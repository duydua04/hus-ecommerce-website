from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from ...config.redis import redis_pool
from ...config import public_url
# [SỬA] Import thêm OrderItem và Product để join bảng
from ...models import Order, OrderItem, Product
from ...models.users import Buyer, Seller
from ...models.catalog import Carrier


class AdminDashboardService:
    PREFIX_ADMIN = "admin"

    TTL_RANKING_MONTH = 60 * 60 * 24 * 180

    def __init__(self):
        self.redis = redis.Redis(connection_pool=redis_pool, decode_responses=True)

    @staticmethod
    def _get_time_keys(date: datetime = None):
        if not date: date = datetime.now()
        return {
            "month": date.strftime("%Y%m"),  # Dùng cho Ranking tháng
            "all": "all_time"
        }

    # B. REALTIME UPDATE (KHI CÓ ĐƠN MỚI)
    async def handle_new_order_stats(self, order_data: dict):
        # Lưu ý: Vì Order không có seller_id, hãy chắc chắn rằng
        # dictionary 'order_data' truyền vào đây ĐÃ ĐƯỢC thêm key 'seller_id'
        # từ logic tạo đơn hàng trước đó.
        dt = datetime.fromisoformat(order_data.get("created_at"))
        keys = self._get_time_keys(dt)
        total = float(order_data['total_price'])
        buyer_id = order_data.get('buyer_id')
        seller_id = order_data.get('seller_id')

        pipe = self.redis.pipeline()

        # 1. Cộng Total Counters
        pipe.incrbyfloat(f"{self.PREFIX_ADMIN}:revenue:total", total)
        pipe.incr(f"{self.PREFIX_ADMIN}:count:orders:total")

        # 2. Ranking Buyer (Score = Số đơn & Score = Doanh thu)
        if buyer_id:
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:buyer:orders:{keys['month']}", 1, buyer_id)
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:buyer:revenue:{keys['month']}", total, buyer_id)

        # 3. Ranking Seller (Score = Số đơn & Score = Doanh thu)
        if seller_id:
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:seller:orders:{keys['month']}", 1, seller_id)
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:seller:revenue:{keys['month']}", total, seller_id)

        # 4. Cộng Carrier
        if order_data.get("carrier_id"):
            pipe.hincrby(f"{self.PREFIX_ADMIN}:stats:carriers", str(order_data["carrier_id"]), 1)

        await pipe.execute()

    # C. REALTIME REVERT (KHI HỦY ĐƠN)
    async def handle_revert_order_stats(self, order_data: dict):
        dt = datetime.fromisoformat(order_data.get("created_at"))
        keys = self._get_time_keys(dt)
        total = float(order_data['total_price'])
        buyer_id = order_data.get('buyer_id')
        seller_id = order_data.get('seller_id')

        pipe = self.redis.pipeline()

        # 1. Trừ Total
        pipe.incrbyfloat(f"{self.PREFIX_ADMIN}:revenue:total", -total)
        pipe.decr(f"{self.PREFIX_ADMIN}:count:orders:total")

        # 2. Trừ Ranking Buyer
        if buyer_id:
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:buyer:orders:{keys['month']}", -1, buyer_id)
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:buyer:revenue:{keys['month']}", -total, buyer_id)

        # 3. Trừ Ranking Seller
        if seller_id:
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:seller:orders:{keys['month']}", -1, seller_id)
            pipe.zincrby(f"{self.PREFIX_ADMIN}:rank:seller:revenue:{keys['month']}", -total, seller_id)

        # 4. Trừ Carrier
        if order_data.get("carrier_id"):
            pipe.hincrby(f"{self.PREFIX_ADMIN}:stats:carriers", str(order_data["carrier_id"]), -1)

        await pipe.execute()

    # D. USER MANAGEMENT (TĂNG/GIẢM SỐ LƯỢNG USER)
    async def handle_user_event(self, role: str, action: str):
        """role: 'buyer'|'seller', action: 'add'|'delete'"""
        key = f"{self.PREFIX_ADMIN}:count:{role}"
        if action == 'add':
            await self.redis.incr(key)
        elif action == 'delete':
            script = "local curr = tonumber(redis.call('get', KEYS[1]) or 0); if curr > 0 then return redis.call('decr', KEYS[1]) else return 0 end"
            await self.redis.eval(script, 1, key)

    # E. GETTERS (DỮ LIỆU HIỂN THỊ)
    async def get_summary_stats(self):
        keys = [f"{self.PREFIX_ADMIN}:count:buyer", f"{self.PREFIX_ADMIN}:count:seller",
                f"{self.PREFIX_ADMIN}:count:orders:total", f"{self.PREFIX_ADMIN}:revenue:total"]
        d = await self.redis.mget(keys)
        return {
            "total_buyers": int(d[0] or 0), "total_sellers": int(d[1] or 0),
            "total_orders": int(d[2] or 0), "total_revenue": float(d[3] or 0)
        }

    async def get_top_users(self, db: AsyncSession, role: str, period: str = "month", criteria: str = "orders"):
        tk = datetime.now().strftime("%Y%m") if period == "month" else "all_time"
        key = f"{self.PREFIX_ADMIN}:rank:{role}:{criteria}:{tk}"

        raw = await self.redis.zrevrange(key, 0, 4, withscores=True)
        if not raw: return []

        ids = [int(item[0]) for item in raw]
        scores_map = {int(item[0]): float(item[1]) for item in raw}

        Model = Buyer if role == 'buyer' else Seller
        id_field = Buyer.buyer_id if role == 'buyer' else Seller.seller_id

        stmt = select(Model).where(id_field.in_(ids))
        users = (await db.execute(stmt)).scalars().all()

        result = []
        for u in users:
            uid = getattr(u, 'buyer_id' if role == 'buyer' else 'seller_id')
            if role == 'buyer':
                name = f"{u.lname} {u.fname}"
                avt = u.avt_url
            else:
                name = u.shop_name
                avt = u.avt_url

            val = scores_map.get(uid, 0)
            result.append({
                "id": uid,
                "name": name,
                "avatar": public_url(avt),
                "display_value": f"{int(val)} đơn" if criteria == 'orders' else f"{val:,.0f} đ",
                "raw_value": val
            })

        result.sort(key=lambda x: x['raw_value'], reverse=True)
        return result

    async def get_carrier_stats(self, db: AsyncSession):
        key = f"{self.PREFIX_ADMIN}:stats:carriers"
        data = await self.redis.hgetall(key)
        carriers = (await db.execute(select(Carrier))).scalars().all()

        res = []
        for c in carriers:
            res.append({
                "id": c.carrier_id,
                "name": c.carrier_name,
                "logo": public_url(c.carrier_avt_url),
                "value": int(data.get(str(c.carrier_id), 0))
            })
        res.sort(key=lambda x: x['value'], reverse=True)
        return res

    # A. SYNC (ĐỒNG BỘ LẠI TỪ DB - FULL VERSION)
    async def sync_total_stats(self, db: AsyncSession):
        print("🔄 [ADMIN SYNC] Bắt đầu đồng bộ (Full Mode)...")
        pipe = self.redis.pipeline()
        current_month = datetime.now().strftime("%Y%m")

        # 1. Counters (Tổng số vĩnh viễn) - GIỮ NGUYÊN
        total_revenue = await db.scalar(select(func.sum(Order.total_price))) or 0
        pipe.set(f"{self.PREFIX_ADMIN}:revenue:total", float(total_revenue))

        count_orders = await db.scalar(select(func.count(Order.order_id))) or 0
        pipe.set(f"{self.PREFIX_ADMIN}:count:orders:total", int(count_orders))

        count_buyer = await db.scalar(select(func.count(Buyer.buyer_id))) or 0
        pipe.set(f"{self.PREFIX_ADMIN}:count:buyer", int(count_buyer))

        count_seller = await db.scalar(select(func.count(Seller.seller_id))) or 0
        pipe.set(f"{self.PREFIX_ADMIN}:count:seller", int(count_seller))

        # 2. Carriers (Hash Map) - GIỮ NGUYÊN
        stmt_carrier = select(Order.carrier_id, func.count(Order.order_id)).where(
            Order.carrier_id.isnot(None)).group_by(Order.carrier_id)
        pipe.delete(f"{self.PREFIX_ADMIN}:stats:carriers")
        carrier_stats = (await db.execute(stmt_carrier)).all()
        for cid, count in carrier_stats:
            pipe.hset(f"{self.PREFIX_ADMIN}:stats:carriers", str(cid), count)

        # 3. Rankings (Sync lại Top Buyer & Seller tháng hiện tại)

        # --- 3.1 BUYER: ORDERS & REVENUE ---
        # A. Buyer - Orders
        key_buyer_ord = f"{self.PREFIX_ADMIN}:rank:buyer:orders:{current_month}"
        pipe.delete(key_buyer_ord)
        buyer_ord_stats = (
            await db.execute(select(Order.buyer_id, func.count(Order.order_id)).group_by(Order.buyer_id))).all()
        for bid, count in buyer_ord_stats:
            if bid: pipe.zadd(key_buyer_ord, {str(bid): count})
        pipe.expire(key_buyer_ord, self.TTL_RANKING_MONTH)

        # B. Buyer - Revenue (THÊM MỚI ĐOẠN NÀY)
        key_buyer_rev = f"{self.PREFIX_ADMIN}:rank:buyer:revenue:{current_month}"
        pipe.delete(key_buyer_rev)
        buyer_rev_stats = (
            await db.execute(select(Order.buyer_id, func.sum(Order.total_price)).group_by(Order.buyer_id))).all()
        for bid, total in buyer_rev_stats:
            if bid: pipe.zadd(key_buyer_rev, {str(bid): float(total)})
        pipe.expire(key_buyer_rev, self.TTL_RANKING_MONTH)

        # --- 3.2 SELLER: ORDERS & REVENUE ---
        # A. Seller - Orders
        key_seller_ord = f"{self.PREFIX_ADMIN}:rank:seller:orders:{current_month}"
        pipe.delete(key_seller_ord)
        stmt_seller_ord = (
            select(Product.seller_id, func.count(func.distinct(Order.order_id)))
            .join(Order.items).join(OrderItem.product)
            .group_by(Product.seller_id)
        )
        seller_ord_stats = (await db.execute(stmt_seller_ord)).all()
        for sid, count in seller_ord_stats:
            if sid: pipe.zadd(key_seller_ord, {str(sid): count})
        pipe.expire(key_seller_ord, self.TTL_RANKING_MONTH)

        # B. Seller - Revenue (THÊM MỚI ĐOẠN NÀY)
        key_seller_rev = f"{self.PREFIX_ADMIN}:rank:seller:revenue:{current_month}"
        pipe.delete(key_seller_rev)
        stmt_seller_rev = (
            select(Product.seller_id, func.sum(Order.total_price))  # Tổng tiền đơn hàng
            .join(Order.items).join(OrderItem.product)
            .group_by(Product.seller_id)
        )
        seller_rev_stats = (await db.execute(stmt_seller_rev)).all()
        for sid, total in seller_rev_stats:
            if sid: pipe.zadd(key_seller_rev, {str(sid): float(total or 0)})
        pipe.expire(key_seller_rev, self.TTL_RANKING_MONTH)

        await pipe.execute()
        return {"status": "success", "message": "Admin Sync Completed (Included Revenue)"}


admin_dashboard_service = AdminDashboardService()