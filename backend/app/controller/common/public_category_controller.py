from typing import List
from fastapi import APIRouter, Depends

from ...services.common.public_category import (
    PublicCategoryService,
    get_public_category_service
)
from ...schemas.category import CategoryResponse


router = APIRouter(
    prefix="/common/categories",
    tags=["common-categories"]
)


@router.get("/", response_model=List)
async def get_all_categories(
    service: PublicCategoryService = Depends(get_public_category_service)
):
    """
    Lấy toàn bộ danh mục để hiển thị Menu/Select box.
    """
    return await service.get_all_cached()


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category_detail(
    category_id: int,
    service: PublicCategoryService = Depends(get_public_category_service)
):
    """
    Lấy chi tiết 1 danh mục.:
    """
    return await service.get(category_id)