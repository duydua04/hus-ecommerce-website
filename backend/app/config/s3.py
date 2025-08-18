import boto3
from botocore.client import Config
from settings import settings

def client():
    # Tạo boto3 client

    return boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
        endpoint_url=settings.S3_ENDPOINT,
        config=Config(signature_version="s3v4"),
    )

# Set client dùng chung cho toàn bộ web
s3 = client()

def presign_put(object_key: str, content_type: str, expires: int = 900) -> str:
    """Sinh presigned URL (HTTP PUT) cho phép upload trực tiếp lên MinIO/S3.

    Tham số:
      - object_key: đường dẫn lưu trong bucket (vd: products/123/img.jpg)
      - content_type: MIME type (vd: image/jpeg)
      - expires: thời gian hết hạn URL (giây), mặc định 15 phút
    """
    return s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
    )


def presign_get(object_key: str, expires: int = 900) -> str:
    """Sinh presigned URL (HTTP GET) để tải tạm thời object private."""
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": object_key,
        },
        ExpiresIn=expires,
    )


def public_url(object_key: str) -> str:
    """Trả về URL public nếu bucket đang bật quyền đọc ẩn danh (dev).

    MinIO: http://<endpoint>/<bucket>/<key>
    """
    base = settings.S3_ENDPOINT.rstrip("/")
    return f"{base}/{settings.S3_BUCKET}/{object_key}"
