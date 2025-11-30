from fastapi import APIRouter, Depends, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...config.s3 import public_url
from ...middleware.auth import get_current_user
from ...utils.storage import upload_via_backend, delete_object, extract_object_key

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
    avt_url_database = stored["object_key"]
    avt_url = public_url(avt_url_database)

    user = info["user"]
    user.avt_url = avt_url_database
    db.commit()
    db.refresh(user)

    return {
        "role": info["role"],
        "email": user.email,
        "public_url": avt_url,
        "object_key": stored["object_key"],
        "size": stored["size"],
        "content_type": stored["content_type"]
    }

@router.delete("/me")
def delete_my_avatar(db: Session = Depends(get_db), info = Depends(get_current_user)):
    user = info["user"]

    if not user.avt_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No avatar to delete")

    object_key = extract_object_key(user.avt_url)

    delete_resp = delete_object(object_key)

    user.avt_url = None
    db.commit()
    db.refresh(user)

    return {"deleted": True, "removed_from_storage": delete_resp.get("Deleted", False), "object_key": object_key}