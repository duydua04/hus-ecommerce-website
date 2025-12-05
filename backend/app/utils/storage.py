from __future__ import annotations
from typing import Literal, List
from fastapi import HTTPException, UploadFile, status
from botocore.exceptions import ClientError
from urllib.parse import urlparse
import time
import uuid
import mimetypes
from ..config.settings import settings
from ..config.s3 import get_s3_client

# Constants
IMAGE_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
VIDEO_MIME = {"video/mp4", "video/webm"}
ALLOWED_FOLDERS = Literal["avatars", "products", "reviews", "chat"]


class S3Storage:
    def __init__(self):
        # Khởi tạo S3 Client 1 lần duy nhất khi tạo Instance
        self.s3_client = get_s3_client()
        self.bucket = settings.S3_BUCKET

    @staticmethod
    def _guess_end_file(filename: str) -> str:
        if filename and "." in filename:
            return "." + filename.split(".")[-1].lower()
        return ""

    @staticmethod
    def _gen_key(self, prefix: ALLOWED_FOLDERS, filename: str) -> str:
        t = time.gmtime()
        ext = self._guess_end_file(filename)

        return f"{prefix}/{t.tm_year:04d}/{t.tm_mon:02d}/{uuid.uuid4().hex}{ext}"

    @staticmethod
    def _validate_content_type(ct: str) -> str:
        ct = (ct or "").lower().strip()
        if ct.startswith('image/') and ct in IMAGE_MIME:
            return ct
        if ct.startswith('video/') and ct in VIDEO_MIME:
            return ct

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f'Unsupported content type: {ct}'
        )

    def extract_object_key(self, url_or_key: str) -> str:
        if not url_or_key:
            return ""
        if not url_or_key.lower().startswith(("http://", "https://")):
            return url_or_key.lstrip("/")

        u = urlparse(url_or_key)
        path = u.path.lstrip("/")
        if path.startswith(self.bucket + "/"):
            return path[len(self.bucket) + 1:]

        return path


    async def upload_file(self, folder: ALLOWED_FOLDERS, file: UploadFile, max_size_mb: int = 10):
        if not file.filename:
            raise HTTPException(status_code=400, detail='File name is required')

        # Validate Content Type
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or ""
        valid_ct = self._validate_content_type(content_type)

        # Validate Size
        body = await file.read()
        size_mb = len(body) / (1024 * 1024)
        if size_mb > max_size_mb:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large: {size_mb:.2f}MB"
            )

        # Generate Key
        key = self._gen_key(folder, file.filename)

        # Upload to S3
        try:
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=body,
                ContentType=valid_ct,
                CacheControl="public, max-age=31536000, immutable"
            )
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f'S3 upload failed: {e}'
            )

        return {'object_key': key, 'content_type': valid_ct, 'size': len(body)}


    async def upload_many(self, folder: ALLOWED_FOLDERS, files: List[UploadFile], max_size_mb: int = 10):
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )

        results = []
        for f in files:
            await f.seek(0)
            res = await self.upload_file(folder, f, max_size_mb)
            results.append(res)

        return results


    def delete_file(self, object_key: str):
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=object_key)
            return {'deleted': True, 'object_key': object_key}
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 delete failed {e}")

storage = S3Storage()