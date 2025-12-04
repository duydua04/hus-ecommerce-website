from fastapi import APIRouter, Depends, Query, status
from typing import Optional

from ...middleware.auth import require_admin
from ...schemas.common import Page
from ...schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

from ...services.admin.admin_category_service import (
    AdminCategoryService,
    get_admin_category_service
)


router = APIRouter(
    prefix="/admin/categories",
    tags=["admin-categories"],
    dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=Page[CategoryResponse])
def api_list_categories(
    q: Optional[str] = Query(None, description="Search by category_name"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """API List danh sach category"""
    return service.list(q=q, limit=limit, offset=offset)


@router.get("/{category_id}", response_model=CategoryResponse)
def api_get_category(
    category_id: int,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """API xem chi tiet category"""
    return service.get(category_id)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def api_create_category(
    payload: CategoryCreate,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """API them category"""
    return service.create(payload)


@router.put("/{category_id}", response_model=CategoryResponse)
def api_update_category(
    category_id: int,
    payload: CategoryUpdate,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """API update category"""
    return service.update(category_id, payload)


@router.delete("/{category_id}")
def api_delete_category(
    category_id: int,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """API xoa category"""
    return service.delete(category_id)