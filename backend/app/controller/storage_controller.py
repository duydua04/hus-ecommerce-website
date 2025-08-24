from fastapi import APIRouter, Depends, Header, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import Optional, Literal
from ..config.db import get_db
from ..config.settings import settings
from ..middleware.auth import get_current_user, require_admin
from ..services.storage_service import get_object_range, delete_object, gen_key, validate_content_type
from ..config.s3 import presign_get, presign_put, public_url

router = APIRouter(
    prefix="/storage",
    tags=["storage"]
)

@router.get("/object/{object_key:path}")
def stream_object(object_key: str,
                  range: Optional[str] = Header(default=None, convert_underscores=False)):
    # Stream object tu Minio
    # Nhan request sau do lay file tu Minio roi tra ve stream data
    body, headers, http_status = get_object_range(object_key, range_header=range)

    return StreamingResponse(body, media_type=headers.get("Content-Type", "application/octet-stream"),
                             headers=headers, status_code=http_status)

@router.delete("/objects/{object_key:path}", dependencies=[Depends(require_admin)])
def delete_object_admin(object_key: str):
    """
    Xóa object bất kỳ (chỉ admin). Với tài nguyên cụ thể (avatar/product/review)
    hãy dùng API domain tương ứng để đảm bảo đồng bộ DB.
    """
    return delete_object(object_key)

@router.get("/presign/get")
def presigned_get(object_key: str, expires: int = Query(900, ge=1, le=3600)):
    # Tao url tam thoi de tai file truc tiep tu Minio
    # url het han sau toi da 1 tieng
    url = presign_get(object_key, expires=expires)
    return {"url": url, "expires": expires}

@router.post("/presign/put")
def presigned_put(folder: Literal["avatars", "products", "reviews"],
                  filename: str,
                  content_type: str,
                  expires: int = Query(900, ge=1, le=3600),
                  current_user=Depends(get_current_user)):
    """
    Tạo key + Presigned PUT URL để client upload trực tiếp lên MinIO
    """
    ct = validate_content_type(content_type)
    key = gen_key(folder, filename)
    url = presign_put(key, content_type=ct, expires=expires)

    return {
        "object_key": key,
        "put_url": url,
        "public_url": public_url(key),
        "content_type": ct,
        "expires": expires,
    }