from fastapi import APIRouter, Depends, File, status, UploadFile, Query
from sqlalchemy.orm import Session
from ...config.db import get_db
from ...middleware.auth import require_admin
from ...schemas.carrier import *
from ...services.admin.carrier_management_service import (
    create_carrier, update_carrier,
    update_carrier_avatar, list_active_carrier,
    delete_carrier
)

router = APIRouter(
    prefix="/admin/carriers",
    tags=["admin-carriers"],
    dependencies=[Depends(require_admin)]
)

@router.get("/", response_model=list[CarrierOut])
def admin_list_active_carriers(q: str | None = Query(None), db: Session = Depends(get_db)):
    """Router list ra danh sach don vi van chuyen"""
    return list_active_carrier(db, q)


@router.post("/", response_model=CarrierOut, status_code=status.HTTP_201_CREATED)
async def admin_create_carrier(payload: CarrierCreate, db: Session = Depends(get_db)):
    """Router them don vi van chuyen moi"""
    return await create_carrier(db, payload)


@router.post("/{carrier_id}/upload-avatar", response_model=CarrierOut)
async def admin_uploada_avatar_carrier(
        carrier_id: int,
        avatar: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    """Router update, them anh cua don vi van chuyen"""
    return await update_carrier_avatar(db, carrier_id, avatar)


@router.patch("/{carrier_id}", response_model=CarrierOut)
def admin_update_carrier(
        carrier_id: int,
        payload: CarrierUpdate,
        db: Session = Depends(get_db)
):
    return update_carrier(db, carrier_id, payload)


@router.post("/{carrier_id}/upload-avatar", response_model=CarrierOut)
async def admin_upload_avatar_carrier(
        carrier_id: int,
        avatar: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    return await update_carrier_avatar(db, carrier_id, avatar)


@router.delete("/{carrier_id}")
def admin_delete_carrier(carrier_id: int, db: Session = Depends(get_db)):
    return delete_carrier(db, carrier_id)