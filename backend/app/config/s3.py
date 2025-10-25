import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from .settings import settings

def create_s3_client():
    # Tạo boto3 client
    try:
        return boto3.client(
            "s3",
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version="s3v4"),
        )
    except Exception as e:
        raise RuntimeError(f'Failed to create S3 client: {e}')

def get_s3_client():
    # Lay s3 client
    return create_s3_client()

def presign_put(object_key: str, content_type: str, expires: int = 900):
    # Sinh presigned URL
   try:
       s3 = get_s3_client()
       return s3.generate_presigned_url(
           "put_object",
           Params={
               "Bucket": settings.S3_BUCKET,
               "Key": object_key,
               "ContentType": content_type,
               "CacheControl": "public, max-age=31536000, immutable",
           },
           ExpiresIn=expires,
       )
   except ClientError as e:
       raise RuntimeError(f"Failed to generate presigned put url: {e}")

def presign_get(object_key: str, expires: int = 900) :
    """Sinh presigned URL (HTTP GET) để tải tạm thời object private."""
    try:
        s3 = get_s3_client()
        return s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": object_key,
            },
            ExpiresIn=expires,
        )
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned get url: {e}")


def public_url(object_key: str) -> str:
    """Trả về duong dan truy cap toi anh"""

    if not object_key:
        return ""

    # 1) Neu la url thi tra ve ngay
    if object_key.strip().lower().startswith(("http://", "https://")):
        return object_key

    base = settings.S3_PUBLIC_ENDPOINT.rstrip("/")
    return f"{base}/{object_key}"
