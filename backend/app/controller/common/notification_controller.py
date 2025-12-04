from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from ...config.db import get_db
from ...models.users import Buyer, Seller, Admin
from ...utils.security import verify_access_token
from ...utils.sse_manager import sse_manager

router = APIRouter(
    prefix="/notification",
    tags=["notifications-stream"]
)


def get_user_from_query_token(token: str, db: Session):
    try:
        payload = verify_access_token(token)
        email, role = payload.get("sub"), payload.get("role")

        user = None
        if role == 'buyer':
            user = db.query(Buyer).filter(Buyer.email == email).first()
            if user:
                return user.buyer_id, role
        elif role == 'seller':
            user = db.query(Seller).filter(Seller.email == email).first()
            if user:
                return user.seller_id, role
        elif role == 'admin':
            user = db.query(Admin).filter(Admin.email == email).first()
            if user:
                return getattr(user, 'admin_id', getattr(user, 'id', None)), role
    except:
        pass
    return None, None


@router.get("/notifications/stream")
async def stream_notifications(
        request: Request,
        token: str = Query(..., description="JWT Token"),
        db: Session = Depends(get_db)
):
    """
    Cổng kết nối SSE chung.
    """
    user_id, role = get_user_from_query_token(token, db)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )

    return EventSourceResponse(sse_manager.connect(user_id, role))