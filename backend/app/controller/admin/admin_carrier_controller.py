from typing import List, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from ...middleware.auth import require_admin
from ...schemas.carrier import CarrierCreate, CarrierUpdate, CarrierOut
from ...services.admin.carrier_management_service import (
    AdminCarrierService,
    get_admin_carrier_service
)

router = APIRouter(
    prefix="/admin/carriers",
    tags=["admin-carriers"],
    dependencies=[Depends(require_admin)]
)


@router.get("", response_model=List[CarrierOut])
async def admin_list_carriers(
    q: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    **Lấy danh sách đơn vị vận chuyển (Dành cho Admin)**

    API này cho phép Admin truy vấn toàn bộ danh sách các đơn vị vận chuyển có trong hệ thống, 
    bao gồm cả trạng thái đang hoạt động (active) và đã tạm dừng (inactive).

    ### Tham số truy vấn:
    - **q**: Từ khóa tìm kiếm theo tên đơn vị vận chuyển.
    - **limit**: Số lượng bản ghi tối đa trả về trên một trang (mặc định: 100).
    - **offset**: Số lượng bản ghi cần bỏ qua để phân trang (mặc định: 0).

    ### Quyền truy cập:
    - Yêu cầu quyền **Admin**.

    ### Trả về:
    - Danh sách các đối tượng `CarrierOut` chứa thông tin chi tiết về đơn vị vận chuyển.
    """
    return await service.list_carrier(q=q, limit=limit, offset=offset)


@router.post("", response_model=CarrierOut, status_code=status.HTTP_201_CREATED)
async def admin_create_carrier(
    payload: CarrierCreate,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    **Tạo mới đơn vị vận chuyển (Dành cho Admin)**

    API này cho phép thiết lập một đối tác vận chuyển mới trong hệ thống với cấu hình giá cước riêng biệt.

    ### Yêu cầu dữ liệu (Request Body):
    - **carrier_name**: Tên chính thức của đơn vị vận chuyển.
    - **carrier_avt_url**: Đường dẫn ảnh logo (tùy chọn).
    - **base_price**: Cước phí nền cố định cho mỗi đơn hàng (không được âm).
    - **price_per_kg**: Cước phí cộng thêm trên mỗi kilogram khối lượng (mặc định 5,000).
    - **is_active**: Trạng thái hiển thị đối với người dùng cuối.

    ### Quyền truy cập:
    - Chỉ dành cho tài khoản có quyền **Administrator**.

    ### Dữ liệu trả về (Response - CarrierOut):
    - **carrier_id**: ID định danh duy nhất vừa được cấp trong cơ sở dữ liệu.
    - **carrier_name**: Tên đơn vị vận chuyển đã lưu.
    - **carrier_avt_url**: Link ảnh đại diện (trả về `null` nếu không cung cấp).
    - **base_price**: Mức phí cơ bản đã được thiết lập.
    - **price_per_kg**: Mức phí trên mỗi kg đã được thiết lập.
    - **is_active**: Trạng thái hoạt động hiện tại.
    """
    return await service.create_carrier(payload)


@router.patch("/{carrier_id}", response_model=CarrierOut)
async def admin_update_carrier(
    carrier_id: int,
    payload: CarrierUpdate,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    **Cập nhật thông tin đơn vị vận chuyển (Dành cho Admin)**

    API này thực hiện cập nhật từng phần (Partial Update) thông tin của một đối tác vận chuyển dựa trên ID.

    ### Tham số đường dẫn (Path Parameter):
    - **carrier_id**: ID định danh duy nhất của đơn vị vận chuyển cần chỉnh sửa.

    ### Yêu cầu dữ liệu (Request Body - CarrierUpdate):
    Các trường sau là tùy chọn, chỉ gửi lên những giá trị cần thay đổi:
    - **carrier_name**: Tên mới của đơn vị vận chuyển.
    - **carrier_avt_url**: Cập nhật lại đường dẫn ảnh logo.
    - **base_price**: Điều chỉnh cước phí cơ bản (phải >= 0).
    - **price_per_kg**: Điều chỉnh cước phí trên mỗi kg (phải >= 0).
    - **is_active**: Thay đổi trạng thái hoạt động (True/False).

    ### Quyền truy cập:
    - Chỉ dành cho tài khoản **Administrator**.

    ### Dữ liệu trả về (Response - CarrierOut):
    - Trả về toàn bộ thông tin của đơn vị vận chuyển (`CarrierOut`) sau khi các thay đổi đã được áp dụng thành công vào cơ sở dữ liệu.
    """
    return await service.update_carrier(carrier_id, payload)


@router.post("/{carrier_id}/upload-avatar", response_model=CarrierOut)
async def admin_upload_carrier_avatar(
    carrier_id: int,
    avatar: UploadFile = File(...),
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    **Tải lên Logo/Avatar cho đơn vị vận chuyển (Dành cho Admin)**

    API này cho phép tải lên hoặc thay đổi ảnh đại diện (logo) của một đối tác vận chuyển hiện có.

    ### Tham số đường dẫn (Path Parameter):
    - **carrier_id**: ID của đơn vị vận chuyển cần cập nhật ảnh.

    ### Yêu cầu dữ liệu (Multipart Form):
    - **avatar**: File hình ảnh (định dạng phổ biến: .jpg, .png, .webp). 

    ### Luồng xử lý:
    1. Tiếp nhận file từ client.
    2. Tải file lên hệ thống lưu trữ (S3/Cloud Storage).
    3. Cập nhật đường dẫn URL mới vào trường `carrier_avt_url` trong cơ sở dữ liệu.

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.

    ### Dữ liệu trả về (Response - CarrierOut):
    - Trả về thông tin đơn vị vận chuyển với trường `carrier_avt_url` đã được cập nhật đường dẫn mới nhất.
    """
    return await service.upload_carrier_avatar(carrier_id, avatar)


@router.delete("/{carrier_id}")
async def admin_delete_carrier(
    carrier_id: int,
    service: AdminCarrierService = Depends(get_admin_carrier_service)
):
    """
    **Xóa đơn vị vận chuyển (Dành cho Admin)**

    API này thực hiện gỡ bỏ đơn vị vận chuyển khỏi hệ thống

    ### Tham số đường dẫn (Path Parameter):
    - **carrier_id**: ID của đơn vị vận chuyển cần xử lý.

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.

    ### Dữ liệu trả về:
    - Thông báo xác nhận trạng thái xóa thành công hoặc đối tượng thông tin đã được xử lý.
    """
    return await service.delete_carrier(carrier_id)