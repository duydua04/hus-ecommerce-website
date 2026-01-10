from fastapi import APIRouter, Depends, Query, status, File, UploadFile
from typing import Optional

from ...middleware.auth import require_admin
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


@router.get("")
async def api_list_categories(
    q: Optional[str] = Query(None, description="Search by category_name"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Lấy danh sách danh mục sản phẩm (Dành cho Admin)**

    API này trả về danh sách toàn bộ các danh mục có trong hệ thống, hỗ trợ tìm kiếm và phân trang.

    ### Tham số truy vấn (Query Parameters):
    - **q**: Từ khóa tìm kiếm theo tên danh mục (`category_name`). Tìm kiếm theo cơ chế chứa chuỗi (Partial match).
    - **limit**: Số lượng bản ghi tối đa trả về trên mỗi trang (Giới hạn từ 1 đến 200, mặc định: 20).
    - **offset**: Số lượng bản ghi cần bỏ qua (Dùng cho phân trang, mặc định: 0).

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.

    ### Dữ liệu trả về:
    - Danh sách các đối tượng danh mục bao gồm: ID, tên danh mục, mô tả và trạng thái liên quan.
    """
    return await service.list(q=q, limit=limit, offset=offset)


@router.get("/{category_id}", response_model=CategoryResponse)
async def api_get_category(
    category_id: int,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Xem chi tiết danh mục sản phẩm (Dành cho Admin)**

    API này truy vấn và trả về toàn bộ thông tin chi tiết của một danh mục cụ thể thông qua ID.

    ### Tham số đường dẫn (Path Parameter):
    - **category_id**: ID định danh duy nhất của danh mục cần xem.

    ### Dữ liệu trả về (Response - CategoryResponse):
    - **category_id**: ID của danh mục.
    - **category_name**: Tên hiển thị của danh mục.
    - **image_url**: Đường dẫn ảnh đại diện của danh mục (trả về `null` nếu chưa có ảnh).

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.
    """
    return await service.get(category_id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def api_create_category(
    payload: CategoryCreate,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Tạo mới danh mục sản phẩm (Dành cho Admin)**

    API này cho phép Admin khởi tạo một danh mục sản phẩm mới trong hệ thống. 
    Danh mục này sau đó có thể được dùng để phân loại các sản phẩm khác nhau.

    ### Yêu cầu dữ liệu (Request Body - CategoryCreate):
    - **category_name**: Tên danh mục (ví dụ: 'Thời trang nam', 'Điện tử'). Đây là trường bắt buộc.

    ### Quyền truy cập:
    - Chỉ tài khoản có quyền **Administrator** mới có thể thực hiện hành động này.

    ### Dữ liệu trả về (Response - CategoryResponse):
    - **category_id**: ID của danh mục.
    - **category_name**: Tên hiển thị của danh mục.
    - **image_url**: Đường dẫn ảnh đại diện của danh mục (trả về `null` nếu chưa có ảnh).

    """
    return await service.create(payload)


@router.put("/{category_id}", response_model=CategoryResponse)
async def api_update_category(
    category_id: int,
    payload: CategoryUpdate,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Cập nhật thông tin danh mục (Dành cho Admin)**

    API này thực hiện thay đổi thông tin của một danh mục sản phẩm hiện có dựa trên ID.

    ### Tham số đường dẫn (Path Parameter):
    - **category_id**: ID của danh mục cần cập nhật.

    ### Yêu cầu dữ liệu (Request Body - CategoryUpdate):
    - **category_name**: Tên mới của danh mục.

    ### Quyền truy cập:
    - Chỉ dành cho tài khoản có quyền **Administrator**.

    ### Dữ liệu trả về (Response - CategoryResponse):
    - Trả về đối tượng danh mục (`CategoryResponse`) với dữ liệu đã được cập nhật mới nhất từ cơ sở dữ liệu.
    """
    return await service.update(category_id, payload)


@router.delete("/{category_id}")
async def api_delete_category(
    category_id: int,
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Xóa danh mục sản phẩm (Dành cho Admin)**

    API này thực hiện gỡ bỏ một danh mục khỏi hệ thống dựa trên ID.

    ### Tham số đường dẫn (Path Parameter):
    - **category_id**: ID của danh mục cần xóa.

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.

    ### Dữ liệu trả về:
    - Trả về thông báo xác nhận việc xóa thành công hoặc trạng thái xử lý từ hệ thống.
    """
    return await service.delete(category_id)

@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_category_image(
    category_id: int,
    file: UploadFile = File(...),
    service: AdminCategoryService = Depends(get_admin_category_service)
):
    """
    **Upload ảnh đại diện cho danh mục sản phẩm.**

    API này cho phép tải lên một file ảnh (jpg, png, webp) và liên kết trực tiếp với danh mục thông qua `category_id`.

    ### Tham số:
    - **category_id**: ID của danh mục cần cập nhật ảnh.
    - **file**: File ảnh định dạng `.jpg`, `.jpeg`, hoặc `.png`. (Dung lượng tối đa 2MB).

    ### Quyền truy cập:
    - Yêu cầu quyền **Administrator**.

    """
    return await service.upload_image(category_id, file)