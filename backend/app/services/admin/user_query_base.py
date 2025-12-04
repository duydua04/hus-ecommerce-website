from typing import Optional, List, Type, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ...models.users import Seller, Buyer


UserModel = Type[Buyer] | Type[Seller]


class UserQueryBase:
    """
    Class nền tảng chứa logic truy vấn, lọc, và phân trang chung
    cho cả Buyer và Seller.
    """

    def __init__(self, db: Session):
        self.db = db


    def _get_list_query_and_count(
            self, model: UserModel, search_query: Optional[str],
            active_only: bool, limit: int,
            offset: int, is_seller: bool
    ):
        """
        Hàm lõi: Thực hiện Query, lọc và trả về tổng số lượng và danh sách users.
        """
        query = self.db.query(model)

        # 1. Lọc Trạng thái
        if active_only:
            query = query.filter(model.is_active.is_(True))

        # 2. Lọc Tìm kiếm
        if search_query and search_query.strip():
            s = f"%{search_query.strip()}%"
            search_filters = [
                model.lname.ilike(s),
                model.fname.ilike(s)
            ]
            if is_seller:
                if hasattr(model, 'shop_name'):
                    search_filters.append(model.shop_name.ilike(s))

            query = query.filter(or_(*search_filters))

        total = query.count()

        # 3. Phân trang và Sắp xếp
        users = query \
            .order_by(model.created_at.desc()) \
            .limit(limit) \
            .offset(offset) \
            .all()

        return total, users