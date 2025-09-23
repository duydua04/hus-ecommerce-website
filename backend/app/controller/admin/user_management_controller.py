from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.common import Page
from ...services.admin.user_management_service import list_buyers, list_sellers

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"]
)

@router.get("/buyers", response_model=Page, dependencies=[Depends(require_admin)])
def admin_list_buyers(db: Session = Depends(get_db),
                        q: str | None = Query(None, description="Search buyer"),
                        active_only: bool = True,
                        limit: int = Query(10, ge=1, le=200),
                        offset: int = Query(0, ge=0)
):
    return list_buyers(db, q, active_only, limit, offset)

@router.get("/sellers", response_model=Page, dependencies=[Depends(require_admin)])
def admin_list_sellers(db: Session = Depends(get_db),
                        q: str | None = Query(None, description="Search sellers"),
                        active_only: bool = True,
                        limit: int = Query(10, ge=1, le=200),
                        offset: int = Query(0, ge=0)):

    return list_sellers(db, q, active_only, limit, offset)