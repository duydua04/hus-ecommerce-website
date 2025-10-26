from __future__ import annotations
from fastapi import APIRouter, Depends, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import require_seller
from ...models import Seller
from ...services.seller.seller_profile_service import get_current_seller_info
#from ..services.common.storage_service import upload_via_backend, delete_object, extract_object_key
from ...config.s3 import public_url

router = APIRouter(
    prefix="/seller/profile",
    tags=["seller-profile"],
    dependencies=[Depends(require_seller)]
)

@router.get("/")
def get_seller_info(seller: Seller = Depends(require_seller), db: Session = Depends(get_db)):
    return get_current_seller_info(seller["user"].seller_id, db)