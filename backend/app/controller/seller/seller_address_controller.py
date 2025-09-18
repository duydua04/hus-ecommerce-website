from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.config.db import get_db
from backend.app.middleware.auth import require_seller
from backend.app.schemas.address import (
    AddressCreate, AddressUpdate,
    SellerAddressCreate, SellerAddressUpdate,
    SellerAddressResponse
)
from backend.app.services.common import address_service
from backend.app.schemas.common import SellerAddressLabel

router = APIRouter(
    prefix="/seller/addresses",
    tags=["seller_addresses"]
)

# Chuyen doi 1 doi tuong thanh 1 response duoc tra ve
def to_seller_link_response(link):
    return SellerAddressResponse(
        seller_address_id=link.seller_address_id,
        seller_id=link.seller_id,
        address_id=link.address_id,
        is_default=link.is_default,
        label=link.label
    )

# Tra ve tat ca danh sach
@router.get("", response_model=List[SellerAddressResponse])
def get_list_seller_address(info=Depends(require_seller), db: Session = Depends(get_db)):
    addresses = address_service.seller_address_list(db, info["user"].sellerr_id)
    return [to_seller_link_response(address) for address in addresses]

# Tao moi va lien ket dia chi voi seller
@router.post("/create-and-link", response_model=SellerAddressResponse)
def create_and_link_address(payload: AddressCreate, is_default: bool = False, label: SellerAddressLabel | None = None,
                            info = Depends(require_seller), db: Session = Depends(get_db)):
    link = address_service.seller_create_and_link_address(db, info["user"].seller_id, payload, is_default, label)
    return to_seller_link_response(link)

# Lien ket dia chi da ton tai voi seller
@router.post("/link-existing", response_model=SellerAddressResponse)
def link_address_existing(body: SellerAddressCreate, info = Depends(require_seller), db: Session = Depends(get_db)):
    # Neu client truyen buyer_id trong body khac voi buyer_id dang dang nhap thi bao loi
    if getattr(body, "seller_id", None) not in (None, info["user"].seller_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    link = address_service.buyer_link_address_existing(db, info["user"].seller_id, body.address_id, body.is_default, body.label)

    return to_seller_link_response(link)

# Update lien ket dia chi voi seller  (is_default, label)
@router.patch("/{seller_address_id}", response_model=SellerAddressResponse)
def update_link(seller_address_id: int, payload: SellerAddressUpdate,
                info = Depends(require_seller), db: Session = Depends(get_db)):
    link = address_service.seller_update_link_address(db, info["user"].seller_id, seller_address_id, payload)
    return to_seller_link_response(link)

# Sua field dia chi
@router.patch("/{seller_address_id}/address", response_model=SellerAddressResponse)
def update_address_field(seller_address_id: int, payload: AddressUpdate,
                         info = Depends(require_seller), db: Session = Depends(get_db)):

    link = address_service.seller_update_address_fields(db, info["user"].seller_id, seller_address_id, payload)
    return to_seller_link_response(link)

#  Set default
@router.patch("/{seller_address_id}/default", response_model=SellerAddressResponse)
def set_default(seller_address_id: int, info = Depends(require_seller), db: Session = Depends(get_db)):
    link = address_service.seller_set_default_address(db, info["user"].seller_id, seller_address_id)
    return to_seller_link_response(link)

# Xoa dia chi va don address
@router.delete("/{seller_address_id}")
def delete_my_address(seller_address_id: int, info = Depends(require_seller), db: Session = Depends(get_db)):
    return address_service.seller_delete_address(db, info["user"].seller_id, seller_address_id)