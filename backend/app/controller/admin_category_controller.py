from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..middleware.auth import require_admin
from ..schemas.common import Page
from ..schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from ..services.category_service import create_category, list_categories, get_category, update_category, delete_category

router = APIRouter(
    prefix="/admin/categories",
    tags=["admin-categories"]
)

@router.get("/", response_model=Page, dependencies=[Depends(require_admin)])
def api_list_categories(db: Session = Depends(get_db),
                        q: str | None = Query(None, description="Search by category_name"),
                        limit: int = Query(20, ge=1, le=200),
                        offset: int = Query(0, ge=0)):
    return list_categories(db, q=q, limit=limit, offset=offset)

@router.get("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def api_get_category(category_id: int, db: Session = Depends(get_db)):
    return get_category(db, category_id)

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def api_create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return create_category(db, payload)

@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def api_update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    return update_category(db, category_id, payload)

@router.delete("/{category_id}", dependencies=[Depends(require_admin)])
def api_delete_category(category_id: int, db: Session = Depends(get_db)):
    return delete_category(db, category_id)