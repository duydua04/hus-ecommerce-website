from __future__ import annotations
from typing import List, Optional
from fastapi import HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, update
from datetime import datetime
import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker

from ...schemas.common import Page
from ...models.order import Order
from ...config.s3 import public_url
from ...utils.storage import storage  # import S3Storage instance
from ..common.review_common_service import BaseReviewService
from ...config.db import get_db
from ...models.review import Review, ReviewerSnapshot
from ...models.catalog import Product
from ...schemas.review import (
    ReviewCreate,
    ReviewMediaItem,
    ReviewReplyResponse,
    ReviewUpdate,
    ReviewerResponse
)
from ...models.users import Seller  # Điều chỉnh đường dẫn import cho đúng


class BuyerReviewService(BaseReviewService):

    def __init__(self, db: AsyncSession):
        super().__init__(db)

    # # ===================== DANH SÁCH REVIEW CỦA 1 SẢN PHẨM =====================
    async def list_product_reviews(
        self,
        product_id: int,
        rating: int | None = None,
        page: int = 1,
        limit: int = 10,
    ):
        query = Review.find(Review.product_id == product_id)

        if rating:
            query = query.find(Review.rating == rating)

        # Phân trang
        offset = (page - 1) * limit
        total = await query.count()
        items = await query.sort("-created_at").skip(offset).limit(limit).to_list()

        for item in items:
            # 1. CONVERT MEDIA (ẢNH + VIDEO) -> THÊM ĐOẠN NÀY
            if item.images:
                item.images = [public_url(img) for img in item.images]
            if item.videos:
                item.videos = [public_url(vid) for vid in item.videos]

            # 2. convert reviewer
            if isinstance(item.reviewer, ReviewerSnapshot):
                item.reviewer = ReviewerResponse(
                    id=item.reviewer.id,
                    name=item.reviewer.name,
                    avatar=public_url(item.reviewer.avatar) if item.reviewer.avatar else None
                )

            # 3. convert replies
            if hasattr(item, "replies") and item.replies:
                converted_replies = []
                for reply in item.replies:
                    converted_replies.append(
                        ReviewReplyResponse(
                            seller_id=reply.seller_id,
                            reply_text=reply.reply_text,
                            reply_date=reply.reply_date
                        )
                    )
                item.replies = converted_replies

        return self._paginate(items, total, limit, offset)

    # # ===================== REVIEW CỦA CHÍNH BUYER =====================
    async def list_my_reviews(
        self,
        buyer_id: int,
        page: int = 1,
        limit: int = 10,
    ) -> Page:
        """
        Lấy danh sách review của chính buyer
        """

        # Build query cơ bản
        query = Review.find(Review.buyer_id == buyer_id)


        # Phân trang
        offset = (page - 1) * limit
        total = await query.count()
        items = await query.sort("-created_at").skip(offset).limit(limit).to_list()

        for item in items:
            # convert reviewer
            if isinstance(item.reviewer, ReviewerSnapshot):
                item.reviewer = ReviewerResponse(
                    id=item.reviewer.id,
                    name=item.reviewer.name,
                    avatar=item.reviewer.avatar
                )

            # convert replies
            if hasattr(item, "replies") and item.replies:
                converted_replies = []
                for reply in item.replies:
                    converted_replies.append(
                        ReviewReplyResponse(
                            seller_id=reply.seller_id,
                            reply_text=reply.reply_text,    # đúng tên field
                            reply_date=reply.reply_date     # đúng tên field
                        )
                    )
                item.replies = converted_replies

        return self._paginate(items, total, limit, offset)

 # ===================== TẠO REVIEW =====================
    async def create_review(self, buyer_id: int, info, payload: ReviewCreate, bg_tasks: BackgroundTasks):
        # 1. Check đã review chưa
        existed = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.order_id == payload.order_id,
            Review.product_id == payload.product_id
        )
        if existed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already reviewed this product"
            )

        # 2. Lấy seller_id từ Product (SQL)
        stmt = select(Product.seller_id).where(Product.product_id == payload.product_id)
        result = await self.db.execute(stmt)
        seller_id = result.scalar_one_or_none()

        if not seller_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
            )

        # 3. Tạo reviewer snapshot
        reviewer_snapshot = ReviewerSnapshot(
            id=info["user"].buyer_id,
            name=info["user"].lname + " " + info["user"].fname,
            avatar=getattr(info["user"], "avt_url", None)
        )

        # 4. Tạo Review Object
        review = Review(
            product_id=payload.product_id,
            order_id=payload.order_id,
            seller_id=seller_id,
            buyer_id=buyer_id,
            reviewer=reviewer_snapshot,
            rating=payload.rating,
            review_text=payload.content or "",
            images=payload.images,
            videos=payload.videos
        )

        # 5. LƯU VÀO MONGODB
        await review.insert()

        # 6. GỌI BACKGROUND TASK
        # Task này sẽ thực thi sau khi return review về cho khách
        bg_tasks.add_task(self.trigger_sync_ratings, payload.product_id, seller_id)

        return review
    # # ===================== CẬP NHẬT REVIEW =====================
    async def update_review(
        self,
        buyer_id: int,
        product_id: int,
        order_id: int,
        payload: ReviewUpdate
    ):
        # 1. Lấy review
        review = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.product_id == product_id,
            Review.order_id == order_id
        )
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        # 2. Update các trường nếu FE gửi
        if payload.rating is not None:
            review.rating = payload.rating
        if payload.comment is not None:
            review.review_text = payload.comment

        # 3. Lưu thay đổi vào MongoDB
        await review.save()
        return review

    # # ===================== XOÁ REVIEW =====================
    async def delete_review(
        self,
        buyer_id: int,
        product_id: int,
        order_id: int,
        delete_files: bool = False
    ):
        # 1. Lấy review
        review = await Review.find_one(
            Review.buyer_id == buyer_id,
            Review.product_id == product_id,
            Review.order_id == order_id
        )
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )

        # 2. Xóa file trên S3 nếu cần
        if delete_files:
            files_to_delete: List[str] = review.images + review.videos
            for key in files_to_delete:
                storage.delete_file(key)

        # 3. Xóa review MongoDB
        await review.delete()
        return {"deleted": True, "review_id": str(review.id)}

    # ===================== MEDIA REVIEW (ẢNH + VIDEO) =====================
    async def list_all_review_media(self):
        """
        Lấy toàn bộ ảnh + video review của tất cả sản phẩm
        FE tự random kết quả
        """

        query = Review.find(
            {
                "$or": [
                    {"images": {"$exists": True, "$ne": []}},
                    {"videos": {"$exists": True, "$ne": []}},
                ]
            }
        )

        items = await query.sort("-created_at").limit(50).to_list()

        results = []
        for r in items:
            results.append(
                ReviewMediaItem(
                    review_id=str(r.id),
                    product_id=r.product_id,
                    buyer_id=r.buyer_id,
                    rating=r.rating,
                    created_at=r.created_at,
                    images=[public_url(i) for i in (r.images or [])],
                    videos=[public_url(v) for v in (r.videos or [])],
                )
            )

        return results
    
    # ===================== SYNC RATINGS (PRIVATE) =====================
    
    async def _sync_product_rating(self, db_session: AsyncSession, product_id: int):
        from motor.motor_asyncio import AsyncIOMotorClient
        from ...config.settings import settings
        import asyncio

        # 1. Kết nối trực tiếp driver Motor
        client = AsyncIOMotorClient(settings.MONGO_URL)
        db = client[settings.MONGO_DB_NAME]
        
        # SỬA TẠI ĐÂY: Tên bảng phải là 'reviews' như bạn đặt trong Settings
        collection = db['reviews'] 
        
        # Đợi một chút để đảm bảo lệnh insert trước đó đã hoàn tất ghi vào đĩa
        await asyncio.sleep(0.2)

        pipeline = [
            {"$match": {"product_id": int(product_id)}}, # product_id của bạn là int
            {"$group": {
                "_id": "$product_id", 
                "avg": {"$avg": "$rating"}, 
                "count": {"$sum": 1}
            }}
        ]
        
        cursor = collection.aggregate(pipeline)
        res = await cursor.to_list(length=1)
        
        avg, count = (round(res[0]["avg"], 1), res[0]["count"]) if res else (0.0, 0)

        # 2. Cập nhật SQL
        await db_session.execute(
            update(Product)
            .where(Product.product_id == product_id)
            .values(rating=avg, review_count=count)
        )
        print(f"📊 [reviews table] Updated Product {product_id}: {avg}*")

    async def _sync_seller_rating(self, db_session: AsyncSession, seller_id: int):
        # Công thức chuẩn: Tổng (Rating * Review_Count) / Tổng Review_Count
        # Nhưng để đơn giản và chính xác theo Dashboard, ta dùng trọng số:
        stmt = select(
            # Tính tổng điểm: mỗi sản phẩm (rating * số lượt review)
            func.sum(Product.rating * Product.review_count),
            # Tính tổng lượt review
            func.sum(Product.review_count)
        ).where(Product.seller_id == seller_id)
        
        res = await db_session.execute(stmt)
        total_score, total_reviews = res.one()

        # Tính toán giá trị cuối cùng
        if total_reviews and total_reviews > 0:
            final_avg = round(float(total_score) / total_reviews, 1)
        else:
            final_avg = 0.0

        await db_session.execute(
            update(Seller)
            .where(Seller.seller_id == seller_id)
            .values(
                average_rating=final_avg,
                rating_count=total_reviews or 0
            )
        )
        print(f"🏢 Updated Seller {seller_id}: {final_avg}* stars from {total_reviews} reviews")

    async def trigger_sync_ratings(self, product_id: int, seller_id: int):
        """Hàm này sẽ chạy ngầm sau khi API trả về 200"""
        from ...config.db import engine # Import engine để tạo session mới
        from sqlalchemy.ext.asyncio import async_sessionmaker
        
        new_session_factory = async_sessionmaker(engine, expire_on_commit=False)
        
        async with new_session_factory() as new_db:
            try:
                # Gọi các hàm sync và truyền session mới vào
                await self._sync_product_rating(new_db, product_id)
                await self._sync_seller_rating(new_db, seller_id)
                
                await new_db.commit()
                print("✅ Sync Rating Complete!")
            except Exception as e:
                await new_db.rollback()
                print(f"❌ Sync Rating Error: {e}")

    # ===================== ORDER_ID ĐÃ ĐÁNH GIÁ =====================
    async def list_reviewed_order_ids(self, buyer_id: int) -> list[int]:
        reviews = await Review.find(
            Review.buyer_id == buyer_id
        ).to_list(None)

        # lấy order_id duy nhất
        order_ids = list({r.order_id for r in reviews})

        return {
            "reviewed_order_ids": order_ids
        }
def get_buyer_review_service(
    db: AsyncSession = Depends(get_db),
):
    return BuyerReviewService(db)
