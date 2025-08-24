from fastapi import APIRouter, Depends, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..config.s3 import public_url
from ..middleware.auth import get_current_user
from ..services.storage_service import upload_via_backend
from ..models import Admin, Buyer, Seller

router = APIRouter(
    prefix="/avatars",
    tags=["avatars"]
)

# Thuc hien upload avatar cho user hien tai
@router.post("/me")
async def upload_my_avatar(file: UploadFile, db: Session = Depends(get_db), info = Depends(get_current_user)):

    #Lenh if chi cho phep upload anh len
    if not (file.content_type or "").lower().startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Avatar must be an image")

    # Upload len minio
    stored = await upload_via_backend("avatars", file, max_size_mb=10)
    url = public_url(stored["object_key"])

    user = info["user"]
    user.avt_url = url
    db.commit()
    db.refresh(user)

    return {
        "role": info["role"],
        "email": user.email,
        "avt_url": url,
        "object_key": stored["object_key"],
        "size": stored["size"],
        "content_type": stored["content_type"]
    }

@router.delete("/me")
def delete_my_avatar(db: Session = Depends(get_db), info = Depends(get_current_user)):
    user = info["user"]
    user.avt_url = None
    db.commit()

    return {"deleted": True}