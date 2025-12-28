from __future__ import annotations
import json
from datetime import datetime
from calendar import monthrange
from fastapi import Depends
from sqlalchemy import func, select, desc, case, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from ...config.db import get_db
from ...config.redis import get_redis_client
from ...config.s3 import public_url

from ...models import Order, OrderItem, Product, ProductImage
from ...utils.socket_manager import socket_manager
from ...schemas.common import OrderStatus


class SellerDashboardService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
        self.CACHE_TTL = 86400


    async def _query_general_stats(self, seller_id: int):
        """
        Lấy 4 chỉ số quan trọng: Doanh thu, Tổng đơn, Đơn chờ, Đơn hủy.
        """
        stmt = select(
            func.count(func.distinct(Order.order_id)).label("total_orders"),

            #Tổng Doanh thu
            func.sum(
                case(
                    (Order.order_status == OrderStatus.delivered, OrderItem.total_price),
                    else_=0
                )
            ).label("revenue"),

            # Tổng số đơn hủy
            func.count(func.distinct(case((Order.order_status == OrderStatus.cancelled, Order.order_id)))).label(
                "cancelled"),

            # Số đơn đang chờ xử lý
            func.count(func.distinct(case((Order.order_status == OrderStatus.pending, Order.order_id)))).label(
                "pending"),
        ).join(Order.items).join(OrderItem.product).where(
            Product.seller_id == seller_id
        )

        result = await self.db.execute(stmt)
        data = result.one()

        return {
            "revenue": float(data.revenue or 0),
            "total_orders": int(data.total_orders or 0),
            "pending_orders": int(data.pending or 0),
            "cancelled_orders": int(data.cancelled or 0)
        }


    async def _query_monthly_chart(self, seller_id: int, year: int):
        stmt = select(
            extract('month', Order.order_date).label("month"),
            func.sum(OrderItem.total_price).label("total")
        ).join(Order.items).join(OrderItem.product).where(
            and_(
                Product.seller_id == seller_id,
                extract('year', Order.order_date) == year,
                Order.order_status == OrderStatus.delivered
            )
        ).group_by(extract('month', Order.order_date))

        result = await self.db.execute(stmt)
        data_map = {int(row.month): float(row.total) for row in result.all()}
        return [data_map.get(m, 0) for m in range(1, 13)]


    async def _query_daily_chart(self, seller_id: int, month: int, year: int):
        stmt = select(
            extract('day', Order.order_date).label("day"),
            func.sum(OrderItem.total_price).label("total")
        ).join(Order.items).join(OrderItem.product).where(
            and_(
                Product.seller_id == seller_id,
                extract('year', Order.order_date) == year,
                extract('month', Order.order_date) == month,
                Order.order_status == OrderStatus.delivered
            )
        ).group_by(extract('day', Order.order_date))

        result = await self.db.execute(stmt)
        data_map = {int(row.day): float(row.total) for row in result.all()}
        _, days_in_month = monthrange(year, month)

        return [data_map.get(d, 0) for d in range(1, days_in_month + 1)]


    async def _query_top_products(self, seller_id: int):
        """
        Top 5 sản phẩm.
        """
        stmt = select(
            Product.name,
            ProductImage.image_url,
            func.sum(OrderItem.quantity).label("sold"),
            func.sum(OrderItem.total_price).label("revenue")
        ).join(OrderItem, Product.product_id == OrderItem.product_id) \
            .join(Order, OrderItem.order_id == Order.order_id) \
            .outerjoin(
            ProductImage,
            and_(
                ProductImage.product_id == Product.product_id,
                ProductImage.is_primary == True
            )
        ) \
            .where(
            and_(
                Product.seller_id == seller_id,
                Order.order_status == OrderStatus.delivered
            )
        ) \
            .group_by(
            Product.product_id,
            Product.name,
            ProductImage.image_url
        ) \
            .order_by(desc("sold")) \
            .limit(5)

        result = await self.db.execute(stmt)
        return [{
            "name": row.name,
            "image": public_url(row.image_url) if row.image_url else None,
            "sold": int(row.sold or 0),
            "revenue": float(row.revenue or 0)
        } for row in result.all()]


    async def sync_realtime_data(self, seller_id: int):
        print(f"🔄 [SELLER SYNC] Updating dashboard for Seller {seller_id}...")
        now = datetime.now()

        stats = await self._query_general_stats(seller_id)
        await self.redis.set(f"seller:{seller_id}:stats", json.dumps(stats), ex=self.CACHE_TTL)

        chart_monthly = await self._query_monthly_chart(seller_id, now.year)
        await self.redis.set(f"seller:{seller_id}:chart:monthly:{now.year}", json.dumps(chart_monthly),
                             ex=self.CACHE_TTL)

        chart_daily = await self._query_daily_chart(seller_id, now.month, now.year)
        await self.redis.set(f"seller:{seller_id}:chart:daily:{now.year}:{now.month}", json.dumps(chart_daily),
                             ex=self.CACHE_TTL)

        top_products = await self._query_top_products(seller_id)
        await self.redis.set(f"seller:{seller_id}:top_products", json.dumps(top_products), ex=self.CACHE_TTL)

        await socket_manager.emit_to_user(seller_id, "DASHBOARD_UPDATED", {
            "stats": stats,
            "charts": {"monthly": chart_monthly, "daily": chart_daily},
            "top_products": top_products,
            "timestamp": str(now)
        })


    async def get_stats(self, seller_id: int):
        key = f"seller:{seller_id}:stats"
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        data = await self._query_general_stats(seller_id)
        await self.redis.set(key, json.dumps(data), ex=self.CACHE_TTL)

        return data


    async def get_chart(self, seller_id: int, view: str):
        now = datetime.now()
        if view == 'monthly':
            key = f"seller:{seller_id}:chart:monthly:{now.year}"
            cached = await self.redis.get(key)
            if cached:
                return json.loads(cached)
            data = await self._query_monthly_chart(seller_id, now.year)
            await self.redis.set(key, json.dumps(data), ex=self.CACHE_TTL)

            return data
        else:
            key = f"seller:{seller_id}:chart:daily:{now.year}:{now.month}"
            cached = await self.redis.get(key)
            if cached:
                return json.loads(cached)
            data = await self._query_daily_chart(seller_id, now.month, now.year)
            await self.redis.set(key, json.dumps(data), ex=self.CACHE_TTL)

            return data


    async def get_top_products(self, seller_id: int):
        key = f"seller:{seller_id}:top_products"
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        data = await self._query_top_products(seller_id)
        await self.redis.set(key, json.dumps(data), ex=self.CACHE_TTL)

        return data


def get_seller_dashboard_service(
        db: AsyncSession = Depends(get_db),
        redis: Redis = Depends(get_redis_client)
):
    return SellerDashboardService(db, redis)