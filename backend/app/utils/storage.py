from __future__ import annotations
from typing import Literal, IO, List
from fastapi import HTTPException, UploadFile, status
from botocore.exceptions import ClientError
from ..config.settings import settings
from ..config.s3 import get_s3_client
import time, uuid, mimetypes, boto3
from urllib.parse import urlparse

# Luu tru nhung dinh dang file cho phep tai
IMAGE_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
VIDEO_MIME = {"video/mp4", "video/webm"}

def _s3():
    # Tao S3 client - import tu config.s3
    return get_s3_client()

def guess_end_file(filename: str):
    # Ham xu lay de lay ra duoi file
    if filename and "." in filename:
        return "." + filename.split(".")[-1].lower()
    return ""

def gen_key(prefix: Literal["avatars", "products", "reviews"], filename: str):
    # Ham tao ra key duy nhat co cau truc de luu tru file
    t = time.gmtime()
    return f"{prefix}/{t.tm_year:04d}/{t.tm_mon:02d}/{uuid.uuid4().hex}{guess_end_file(filename)}"

def validate_content_type(ct: str):
    # Ham xac thuc va kiem tra loai noi dung cua file upload, chi cho phep cac dinh dang anh va video duoc cho phep
    ct = (ct or "").lower().strip() # Chuan hoa input
    if ct.startswith('image/') and ct in IMAGE_MIME:
        return ct

    if ct.startswith('video/') and ct in VIDEO_MIME:
        return ct

    raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=f'Unsupported content type: {ct}')

# Ham upload file Minio
async def upload_via_backend(folder: Literal['avatars', 'products', 'reviews'],
                             file: UploadFile,
                             max_size_mb: int = 10):
    # Neu file khong co ten thi bao loi
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='File name is required')

    # Xac dinh content file va validate no
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or ""
    ct = validate_content_type(content_type)

    # Doc va kiem tra kich thuoc file
    body = await file.read()
    size_mb = len(body) / (1024 * 1024)

    if size_mb > max_size_mb:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File too large: {size_mb}")

    # Tao key va ket noi s3
    key = gen_key(folder, file.filename)
    s3 = _s3()

    # Thuc hien upload file len minio
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=body,
            ContentType=ct,
            CacheControl="public, max-age=31536000, immutable"
        )
    except ClientError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'S3 put object failed: {e}')

    return {'object_key': key, 'content_type': content_type, 'size': len(body)}

"""
Ham stream file tu minio ve. Cac tham so truyen vao la 
    object_key: Duong dan file
    range_header: Header range tu client
"""
def get_object_range(object_key: str, range_header: str | None = None):
    # Ket noi voi s3
    s3 = _s3()
    params = {'Bucket': settings.S3_BUCKET, 'Key': object_key} # param chua tham so co ban la bucket va key

    if range_header:
        params['Range'] = range_header

    # Bay loi lay file tu minio s3
    try:
        resp = s3.get_object(**params)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("404", "NoSuchKey"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='File not found')
        if code == "InvalidRange":
            raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE, detail="Invalid Range")

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'S3 get object failed: {e}')

    body = resp['Body'] # Lay body tu s2 response ve
    headers = {
        'Content-Type': resp.get("ContentType", "application/octet-stream"),
        'Accept-Ranges': 'bytes',
    }

    # status la 205 neu client gui range request
    # status la 200 neu client request toan bo file
    http_status = 206 if range_header else 200

    if range_header and "ContentRange" in resp:
        headers['Content-Range'] = resp['ContentRange']
    if 'ContentLength' in resp:
        headers['Content-Length'] = str(resp['ContentLength'])

    return body, headers, http_status

def delete_object(object_key: str):
    # Ham thuc hien xoa object tren minio
    s3 = _s3()
    try:
        s3.delete_object(Bucket=settings.S3_BUCKET, Key=object_key)
        return {'deleted': True, 'object_key': object_key}
    except ClientError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"S3 delete failed {e}")

def extract_object_key(url_or_key: str):
    # Nhan vao full url sau do tra ve object key
    if not url_or_key:
        return ""

    # Kiem tra neu chuoi bat dau bang http thi la url khong phai thi tra ve chuoi do bo di "/"
    if not url_or_key.lower().startswith(("http://", "https://")):
        return url_or_key.lstrip("/")

    # Phan tich url thanh cac phan sau do lay phan path cua url
    u = urlparse(url_or_key)
    path = u.path.lstrip("/")
    bucket = settings.S3_BUCKET

    # neu path bat dau bang ten bucket + "/" thi tra ve doan sau cua path
    # neu khong tra ve toan bo path
    if path.startswith(bucket + "/"):
        return path[len(bucket) + 1:]

    return path

async def upload_many_via_backend(folder: Literal['avatars', 'products', 'reviews'],
                                  files: List[UploadFile],
                                  max_size_mb: int = 10):
    """
        Upload nhiều file qua backend (tuần tự).
        Trả về list kết quả giống upload_via_backend ở phía bên trên
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    results = []
    for f in files:
        res = await upload_via_backend(folder, f, max_size_mb=max_size_mb)
        results.append(res)

    return results