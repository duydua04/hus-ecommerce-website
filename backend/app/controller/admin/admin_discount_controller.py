from fastapi import APIRouter, Depends, Query, status, Body
from ...middleware.auth import require_admin
from ...schemas.discount import DiscountCreate, DiscountResponse, DiscountUpdate

from ...services.admin.admin_discount_management_service import AdminDiscountService, get_discount_service

router = APIRouter(
    prefix="/admin/discounts",
    tags=["admin-discounts"],
    dependencies=[Depends(require_admin)]
)


@router.get("")
async def admin_list_discount(
    q: str | None = None,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    service: AdminDiscountService = Depends(get_discount_service)
):
    """
    **Lấy danh sách các mã giảm giá trong hệ thống.**

    Hỗ trợ tìm kiếm và phân trang để quản lý danh sách mã hiệu quả.

    ### Tham số:
    - **q**: Tìm kiếm theo mã (code) hoặc tên chương trình giảm giá.
    - **limit**: Số lượng bản ghi tối đa trả về (mặc định 10).
    - **offset**: Vị trí bắt đầu lấy dữ liệu.
    """
    return await service.list(q=q, limit=limit, offset=offset)


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_discount(
    payload: DiscountCreate,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """
    **Tạo mã giảm giá mới cho hệ thống.**
    
    ### Lưu ý:
    - Hệ thống sẽ kiểm tra để đảm bảo mã `code` không bị trùng lặp.
    """
    return await service.create(payload)


@router.patch("/{discount_id}", response_model=DiscountResponse)
async def admin_update_discount(
    discount_id: int,
    payload: DiscountUpdate,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """
    **Cập nhật thông tin chi tiết của mã giảm giá.**

    Cho phép chỉnh sửa các thông số như số lượng sử dụng, ngày hết hạn hoặc giá trị giảm.

    - **discount_id**: ID định danh của mã giảm giá cần sửa.
    """
    return await service.update(discount_id, payload)


@router.patch("/{discount_id}/status", response_model=DiscountResponse)
async def admin_set_status(
    discount_id: int,
    is_active: bool = Body(..., embed=True), # Body: { "is_active": true }
    service: AdminDiscountService = Depends(get_discount_service)
):
    """
    **Bật hoặc Tắt trạng thái hoạt động của mã giảm giá.**

    Dùng để tạm dừng áp dụng mã mà không cần xóa khỏi hệ thống.

    ### Request Body:
    ```json
    {
        "is_active": true
    }
    ```
    """
    return await service.set_status(discount_id, is_active)


@router.delete("/{discount_id}")
async def admin_delete_discount(
    discount_id: int,
    service: AdminDiscountService = Depends(get_discount_service)
):
    """Xóa mã giảm giá (Nếu chưa sử dụng)"""
    return await service.delete(discount_id)