from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
import redis.asyncio as redis
from ...config.redis import redis_pool
from ...config.s3 import public_url
from ...models import Order, OrderItem, Product, Carrier, Category
from ...models.users import Buyer, Seller
from ...schemas.common import OrderStatus


class AdminDashboardService:
    PREFIX = "admin"

    KEY_TOTAL_REVENUE = f"{PREFIX}:revenue:total"
    KEY_TOTAL_ORDERS = f"{PREFIX}:count:orders:total"
    KEY_COUNT_BUYER = f"{PREFIX}:count:buyer"
    KEY_COUNT_SELLER = f"{PREFIX}:count:seller"

    KEY_RANK_BUYER_ORDERS = f"{PREFIX}:rank:buyer:orders"
    KEY_RANK_BUYER_REVENUE = f"{PREFIX}:rank:buyer:revenue"

    KEY_RANK_SELLER_ORDERS = f"{PREFIX}:rank:seller:orders"
    KEY_RANK_SELLER_REVENUE = f"{PREFIX}:rank:seller:revenue"

    KEY_RANK_CATEGORY_SOLD = f"{PREFIX}:rank:category:sold"
    KEY_RANK_CATEGORY_REVENUE = f"{PREFIX}:rank:category:revenue"

    KEY_STATS_CARRIERS = f"{PREFIX}:stats:carriers"

    def __init__(self, db: AsyncSession = None, redis_client: Redis = None):
        self.db = db

        if redis_client:
            self.redis = redis_client
        else:
            self.redis = redis.Redis(
                connection_pool=redis_pool,
                decode_responses=True
            )


    async def handle_new_order_stats(self, order_data: dict):
        """
        Gọi khi có đơn mới. Cộng dồn vào các chỉ số All-Time.
        """
        total = float(order_data.get('total_price', 0))
        buyer_id = order_data.get('buyer_id')
        seller_id = order_data.get('seller_id')
        carrier_id = order_data.get('carrier_id')
        items = order_data.get('items', [])

        pipe = self.redis.pipeline()

        pipe.incrbyfloat(self.KEY_TOTAL_REVENUE, total)
        pipe.incr(self.KEY_TOTAL_ORDERS)

        if buyer_id:
            pipe.zincrby(self.KEY_RANK_BUYER_ORDERS, 1, str(buyer_id))
            pipe.zincrby(self.KEY_RANK_BUYER_REVENUE, total, str(buyer_id))

        if seller_id:
            pipe.zincrby(self.KEY_RANK_SELLER_ORDERS, 1, str(seller_id))
            pipe.zincrby(self.KEY_RANK_SELLER_REVENUE, total, str(seller_id))

        if carrier_id:
            pipe.hincrby(self.KEY_STATS_CARRIERS, str(carrier_id), 1)

        for item in items:
            cat_id = item.get('category_id')
            qty = item.get('quantity', 0)
            subtotal = item.get('subtotal', 0)
            if cat_id:
                pipe.zincrby(self.KEY_RANK_CATEGORY_SOLD, qty, str(cat_id))
                pipe.zincrby(self.KEY_RANK_CATEGORY_REVENUE, subtotal, str(cat_id))

        await pipe.execute()


    async def handle_revert_order_stats(self, order_data: dict):
        """Gọi khi hủy đơn. Trừ đi các chỉ số."""
        total = float(order_data.get('total_price', 0))
        buyer_id = order_data.get('buyer_id')
        seller_id = order_data.get('seller_id')
        carrier_id = order_data.get('carrier_id')
        items = order_data.get('items', [])

        pipe = self.redis.pipeline()

        pipe.incrbyfloat(self.KEY_TOTAL_REVENUE, -total)
        pipe.decr(self.KEY_TOTAL_ORDERS)

        if buyer_id:
            pipe.zincrby(self.KEY_RANK_BUYER_ORDERS, -1, str(buyer_id))
            pipe.zincrby(self.KEY_RANK_BUYER_REVENUE, -total, str(buyer_id))

        if seller_id:
            pipe.zincrby(self.KEY_RANK_SELLER_ORDERS, -1, str(seller_id))
            pipe.zincrby(self.KEY_RANK_SELLER_REVENUE, -total, str(seller_id))

        if carrier_id:
            pipe.hincrby(self.KEY_STATS_CARRIERS, str(carrier_id), -1)

        for item in items:
            cat_id = item.get('category_id')
            qty = item.get('quantity', 0)
            subtotal = item.get('subtotal', 0)
            if cat_id:
                pipe.zincrby(self.KEY_RANK_CATEGORY_SOLD, -qty, str(cat_id))
                pipe.zincrby(self.KEY_RANK_CATEGORY_REVENUE, -subtotal, str(cat_id))

        await pipe.execute()


    async def handle_user_count(self, role: str, action: str):
        key = self.KEY_COUNT_BUYER if role == 'buyer' else self.KEY_COUNT_SELLER
        if action == 'add':
            await self.redis.incr(key)
        else:
            # Lua script để không trừ xuống âm
            script = "local curr = tonumber(redis.call('get', KEYS[1]) or 0); if curr > 0 then return redis.call('decr', KEYS[1]) else return 0 end"
            await self.redis.eval(script, 1, key)


    async def get_summary_stats(self):
        keys = [self.KEY_COUNT_BUYER, self.KEY_COUNT_SELLER, self.KEY_TOTAL_ORDERS, self.KEY_TOTAL_REVENUE]
        vals = await self.redis.mget(keys)
        return {
            "buyers": int(vals[0] or 0),
            "sellers": int(vals[1] or 0),
            "orders": int(vals[2] or 0),
            "revenue": float(vals[3] or 0)
        }


    async def get_top_users(self, db: AsyncSession, role: str, criteria: str):
        if role == 'buyer':
            key = self.KEY_RANK_BUYER_ORDERS if criteria == 'orders' else self.KEY_RANK_BUYER_REVENUE
        else:
            key = self.KEY_RANK_SELLER_ORDERS if criteria == 'orders' else self.KEY_RANK_SELLER_REVENUE

        raw = await self.redis.zrevrange(key, 0, 9, withscores=True)
        if not raw: return []

        ids = [int(item[0]) for item in raw]
        scores = {int(item[0]): float(item[1]) for item in raw}

        Model = Buyer if role == 'buyer' else Seller
        id_field = Buyer.buyer_id if role == 'buyer' else Seller.seller_id

        # Query info để lấy tên/avatar
        users = (await db.execute(select(Model).where(id_field.in_(ids)))).scalars().all()
        user_map = {getattr(u, 'buyer_id' if role == 'buyer' else 'seller_id'): u for u in users}

        result = []
        for uid in ids:
            u = user_map.get(uid)
            if not u: continue

            if role == 'buyer':
                name = f"{u.lname} {u.fname}"
                avt = u.avt_url
            else:
                name = u.shop_name
                avt = u.avt_url

            result.append({
                "id": uid,
                "name": name,
                "avatar": public_url(avt),
                "value": scores.get(uid, 0),
                "display": f"{int(scores[uid])} đơn" if criteria == 'orders' else f"{scores[uid]:,.0f} đ"
            })
        return result


    async def get_top_categories(self, db: AsyncSession, criteria: str):
        key = self.KEY_RANK_CATEGORY_SOLD if criteria == 'sold' else self.KEY_RANK_CATEGORY_REVENUE
        raw = await self.redis.zrevrange(key, 0, 9, withscores=True)
        if not raw: return []

        ids = [int(item[0]) for item in raw]
        scores = {int(item[0]): float(item[1]) for item in raw}

        cats = (await db.execute(select(Category).where(Category.category_id.in_(ids)))).scalars().all()

        res = []
        for c in cats:
            val = scores.get(c.category_id, 0)
            res.append({
                "id": c.category_id,
                "name": c.category_name,
                "image": public_url(c.image_url),
                "value": val,
                "display": f"{int(val)} cái" if criteria == 'sold' else f"{val:,.0f} đ"
            })

        res.sort(key=lambda x: x['value'], reverse=True)
        return res


    async def get_carrier_stats(self, db: AsyncSession):
        raw = await self.redis.hgetall(self.KEY_STATS_CARRIERS)
        carriers = (await db.execute(select(Carrier))).scalars().all()

        res = []
        for c in carriers:
            val = int(raw.get(str(c.carrier_id), 0))
            res.append({
                "id": c.carrier_id,
                "name": c.carrier_name,
                "logo": public_url(c.carrier_avt_url),
                "count": val
            })
        res.sort(key=lambda x: x['count'], reverse=True)
        return res


    async def sync_all_stats(self, db: AsyncSession):
        """
        Quét sạch DB tính toán lại từ đầu (All-Time).
        Chạy hàm này 1 lần duy nhất để Redis có dữ liệu.
        """
        print("🔄 [ADMIN SYNC] Bắt đầu đồng bộ All-Time...")
        pipe = self.redis.pipeline()

        total_rev = await db.scalar(
            select(func.sum(Order.total_price)).where(Order.order_status == OrderStatus.delivered)) or 0
        total_ord = await db.scalar(select(func.count(Order.order_id))) or 0
        total_buy = await db.scalar(select(func.count(Buyer.buyer_id))) or 0
        total_sel = await db.scalar(select(func.count(Seller.seller_id))) or 0

        pipe.set(self.KEY_TOTAL_REVENUE, float(total_rev))
        pipe.set(self.KEY_TOTAL_ORDERS, int(total_ord))
        pipe.set(self.KEY_COUNT_BUYER, int(total_buy))
        pipe.set(self.KEY_COUNT_SELLER, int(total_sel))

        # --- B. Sync Buyer Rankings ---
        pipe.delete(self.KEY_RANK_BUYER_ORDERS)
        buyer_ord = (
            await db.execute(select(Order.buyer_id, func.count(Order.order_id)).group_by(Order.buyer_id))).all()
        if buyer_ord:
            pipe.zadd(self.KEY_RANK_BUYER_ORDERS, {str(bid): count for bid, count in buyer_ord if bid})

        # 2. Revenue (Chỉ tính đơn delivered)
        pipe.delete(self.KEY_RANK_BUYER_REVENUE)
        # [FIX]: Dùng OrderStatus.delivered
        buyer_rev = (await db.execute(
            select(Order.buyer_id, func.sum(Order.total_price))
            .where(Order.order_status == OrderStatus.delivered)
            .group_by(Order.buyer_id))).all()
        if buyer_rev:
            pipe.zadd(self.KEY_RANK_BUYER_REVENUE, {str(bid): float(val) for bid, val in buyer_rev if bid})

        # --- C. Sync Seller Rankings ---
        pipe.delete(self.KEY_RANK_SELLER_ORDERS)
        stmt_sell_ord = select(Product.seller_id, func.count(func.distinct(Order.order_id))) \
            .join(Order.items).join(OrderItem.product).group_by(Product.seller_id)
        seller_ord = (await db.execute(stmt_sell_ord)).all()
        if seller_ord:
            pipe.zadd(self.KEY_RANK_SELLER_ORDERS, {str(sid): count for sid, count in seller_ord if sid})

        # 2. Revenue
        pipe.delete(self.KEY_RANK_SELLER_REVENUE)
        # [FIX]: Dùng OrderStatus.delivered và Order.order_status
        stmt_sell_rev = select(Product.seller_id, func.sum(Order.total_price)) \
            .join(Order.items).join(OrderItem.product) \
            .where(Order.order_status == OrderStatus.delivered).group_by(Product.seller_id)
        seller_rev = (await db.execute(stmt_sell_rev)).all()
        if seller_rev:
            pipe.zadd(self.KEY_RANK_SELLER_REVENUE, {str(sid): float(val) for sid, val in seller_rev if sid})

        # --- D. Sync Carrier ---
        pipe.delete(self.KEY_STATS_CARRIERS)
        carrier_stats = (await db.execute(
            select(Order.carrier_id, func.count(Order.order_id)).where(Order.carrier_id.isnot(None)).group_by(
                Order.carrier_id))).all()
        for cid, count in carrier_stats:
            pipe.hset(self.KEY_STATS_CARRIERS, str(cid), count)

        # --- E. Sync Category ---
        pipe.delete(self.KEY_RANK_CATEGORY_SOLD)
        # [FIX]: Dùng Order.order_status == OrderStatus.delivered
        stmt_cat_sold = select(Category.category_id, func.sum(OrderItem.quantity)) \
            .join(Product, Product.category_id == Category.category_id) \
            .join(OrderItem, OrderItem.product_id == Product.product_id) \
            .join(Order, Order.order_id == OrderItem.order_id) \
            .where(Order.order_status == OrderStatus.delivered).group_by(Category.category_id)
        cat_sold = (await db.execute(stmt_cat_sold)).all()
        if cat_sold:
            pipe.zadd(self.KEY_RANK_CATEGORY_SOLD, {str(cid): int(qty) for cid, qty in cat_sold if cid})

        # 2. Revenue
        pipe.delete(self.KEY_RANK_CATEGORY_REVENUE)
        stmt_cat_rev = select(
            Category.category_id,
            func.sum(OrderItem.total_price)
        ) \
            .join(Product, Product.category_id == Category.category_id) \
            .join(OrderItem, OrderItem.product_id == Product.product_id) \
            .join(Order, Order.order_id == OrderItem.order_id) \
            .where(Order.order_status == OrderStatus.delivered).group_by(Category.category_id)

        cat_rev = (await db.execute(stmt_cat_rev)).all()
        if cat_rev:
            pipe.zadd(self.KEY_RANK_CATEGORY_REVENUE, {str(cid): float(val) for cid, val in cat_rev if cid})

        await pipe.execute()
        print("[ADMIN SYNC] Hoàn tất đồng bộ All-Time!")
        return {"status": "success", "message": "Synced all data"}


admin_dashboard_service = AdminDashboardService()