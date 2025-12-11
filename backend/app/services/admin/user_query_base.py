from typing import Optional, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from ...models.users import Seller, Buyer

UserModel = Type[Buyer] | Type[Seller]


class UserQueryBase:
    """
    Class nền tảng chứa logic truy vấn, lọc, và phân trang
    """

    def __init__(self, db: AsyncSession):
        self.db = db


    async def _get_list_query_and_count(
            self, model: UserModel,
            search_query: Optional[str],
            active_only: bool, limit: int,
            offset: int, is_seller: bool
    ):
        """
        Hàm lõi: Thực hiện Query, lọc và trả về tổng số lượng và danh sách users.
        """
        stmt = select(model)

        if active_only:
            stmt = stmt.where(model.is_active.is_(True))

        if search_query and search_query.strip():
            s = f"%{search_query.strip()}%"
            search_filters = [
                model.lname.ilike(s),
                model.fname.ilike(s)
            ]

            # Kiểm tra thuộc tính shop_name có tồn tại trong Model class không
            if is_seller and hasattr(model, 'shop_name'):
                search_filters.append(model.shop_name.ilike(s))

            stmt = stmt.where(or_(*search_filters))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        paginated_stmt = stmt.order_by(model.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(paginated_stmt)
        users = result.scalars().all()

        return total, users