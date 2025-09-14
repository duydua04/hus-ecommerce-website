from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..schemas.common import Page
from ..schemas.category import CategoryResponse
from ..services.category_service import list_categories, get_category

router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)

@router.get("", response_model=Page)
def public_list_categories(
    db: Session = Depends(get_db),
    q: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    return list_categories(db, q=q, limit=limit, offset=offset)

@router.get("/{category_id}", response_model=CategoryResponse)
def public_get_category(category_id: int, db: Session = Depends(get_db)):
    return get_category(db, category_id)
