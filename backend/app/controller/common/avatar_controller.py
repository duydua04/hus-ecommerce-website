from fastapi import APIRouter, Depends, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...config.s3 import public_url
from ...middleware.auth import get_current_user
from ...utils.storage import storage

# Lưu ý: Import router tùy theo cấu trúc project của bạn
router = APIRouter(
    prefix="/avatars",
    tags=["avatars"]
)


@router.post("/me")
async def upload_my_avatar(
        file: UploadFile,
        db: Session = Depends(get_db),
        info=Depends(get_current_user)
):
    """
   **Tải lên và cập nhật ảnh đại diện (Avatar) cho người dùng hiện tại.**

    API này xử lý việc tải tệp tin lên hệ thống lưu trữ đám mây, sau đó cập nhật đường dẫn vào hồ sơ người dùng trong cơ sở dữ liệu.

    ### Quy trình xử lý:
    1. **Kiểm tra định dạng**: Chỉ chấp nhận các tệp tin có `content-type` bắt đầu bằng `image/` (jpg, png, webp...).
    2. **Kiểm tra dung lượng**: Giới hạn tối đa **10MB**.
    3. **Lưu trữ**: Tải tệp lên thư mục `/avatars` trên Storage.
    4. **Cập nhật DB**: Lưu `object_key` vào trường `avt_url` của người dùng.
    """
    # Check định dạng ảnh
    if not (file.content_type or "").lower().startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Avatar must be an image"
        )

    stored = await storage.upload_file("avatars", file, max_size_mb=10)
    avt_url_database = stored["object_key"]

    user = info["user"]
    user.avt_url = avt_url_database

    await db.commit()
    await db.refresh(user)

    avt_url = public_url(avt_url_database)

    return {
        "role": info["role"],
        "email": user.email,
        "public_url": avt_url,
        "avt_url": avt_url,
        "object_key": stored["object_key"],
        "size": stored["size"],
        "content_type": stored["content_type"]
    }


@router.delete("/me")
async def delete_my_avatar(
        db: Session = Depends(get_db),
        info=Depends(get_current_user)
):
    """
    **Xóa ảnh đại diện hiện tại.**
    """
    user = info["user"]

    if not user.avt_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No avatar to delete"
        )

    object_key = storage.extract_object_key(user.avt_url)

    # Xóa trên storage
    delete_resp = await storage.delete_object(object_key)

    user.avt_url = None

    db.commit()
    db.refresh(user)

    return {
        "deleted": True,
        "removed_from_storage": delete_resp.get("Deleted", False),
        "object_key": object_key
    }