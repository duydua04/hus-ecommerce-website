from sqlalchemy.orm import Session
from ...utils.sse_manager import sse_manager
from ...utils.security import verify_access_token
from ...models.users import Buyer, Seller, Admin


# --- SERVICE XỬ LÝ KẾT NỐI SSE ---
async def connect_notification_stream(db: Session, token: str):
    """
    Xử lý logic xác thực và kết nối SSE.
    Trả về Generator nếu thành công, hoặc None nếu thất bại.
    """
    try:
        # 1. Giải mã Token
        payload = verify_access_token(token)
        email = payload.get("sub")
        role = payload.get("role")

        user = None
        user_id = None

        # 2. Query DB theo Role để lấy ID chuẩn
        if role == 'buyer':
            user = db.query(Buyer).filter(Buyer.email == email).first()
            if user: user_id = user.buyer_id

        elif role == 'seller':
            user = db.query(Seller).filter(Seller.email == email).first()
            if user: user_id = user.seller_id

        elif role == 'admin':
            user = db.query(Admin).filter(Admin.email == email).first()
            if user: user_id = user.admin_id

        # 3. Nếu không tìm thấy User -> Trả về None
        if not user_id:
            return None

        # 4. Trả về Generator kết nối từ SSE Manager
        return sse_manager.connect(user_id, role)

    except Exception as e:
        print(f"SSE Auth Error: {e}")
        return None