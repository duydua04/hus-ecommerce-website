from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..middleware.auth import require_buyer
from ..schemas.address import (
    AddressCreate, AddressUpdate,
    BuyerAddressCreate, BuyerAddressUpdate,
    BuyerAddressResponse, AddressResponse
)
from ..services import address_service
from ..schemas.common import BuyerAddressLabel

router = APIRouter(
    prefix="/buyer/addresses",
    tags=["buyer_addresses"]
)

# Chuyen doi 1 doi tuong Buyer Address thanh 1 response duoc tra ve
def to_buyer_link_response(link):
    return BuyerAddressResponse(
        buyer_address_id=link.buyer_address_id,
        buyer_id=link.buyer_id,
        address_id=link.address_id,
        is_default=link.is_default,
        label=link.label
    )

def to_address_response(address):
    return AddressResponse.model_validate(address)

# Tra ve tat ca danh sach
@router.get("", response_model=List[BuyerAddressResponse])
def get_list_buyer_address(info=Depends(require_buyer), db: Session = Depends(get_db)):
    addresses = address_service.buyer_address_list(db, info["user"].buyer_id)
    return [to_buyer_link_response(address) for address in addresses]

# Tao moi va lien ket dia chi voi buyer
@router.post("/create-and-link", response_model=BuyerAddressResponse)
def create_and_link_address(payload: AddressCreate, is_default: bool = False, label: BuyerAddressLabel | None = None,
                            info = Depends(require_buyer), db: Session = Depends(get_db)):
    link = address_service.buyer_create_and_link_address(db, info["user"].buyer_id, payload, is_default, label)
    return to_buyer_link_response(link)

# Lien ket dia chi da ton tai voi buyer
@router.post("/link-existing", response_model=BuyerAddressResponse)
def link_address_existing(body: BuyerAddressCreate, info = Depends(require_buyer), db: Session = Depends(get_db)):
    # Neu client truyen buyer_id trong body khac voi buyer_id dang dang nhap thi bao loi
    if getattr(body, "buyer_id", None) not in (None, info["user"].buyer_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    link = address_service.buyer_link_address_existing(db, info["user"].buyer_id, body.address_id, body.is_default, body.label)

    return to_buyer_link_response(link)

# Update lien ket dia chi voi buyer (is_default, label)
@router.patch("/{buyer_address_id}", response_model=BuyerAddressResponse)
def update_link(buyer_address_id: int, payload: BuyerAddressUpdate,
                info = Depends(require_buyer), db: Session = Depends(get_db)):
    link = address_service.buyer_update_link_address(db, info["user"].buyer_id, buyer_address_id, payload)
    return to_buyer_link_response(link)

# Sua field dia chi
@router.patch("/{buyer_address_id}/address", response_model=BuyerAddressResponse)
def update_address_field(buyer_address_id: int, payload: AddressUpdate,
                         info = Depends(require_buyer), db: Session = Depends(get_db)):

    link = address_service.buyer_update_address_fields(db, info["user"].buyer_id, buyer_address_id, payload)
    return to_buyer_link_response(link)

#  Set default
@router.patch("/{buyer_address_id}/default", response_model=BuyerAddressResponse)
def set_default(buyer_address_id: int, info = Depends(require_buyer), db: Session = Depends(get_db)):
    link = address_service.buyer_set_default_address(db, info["user"].buyer_id, buyer_address_id)
    return to_buyer_link_response(link)

# Xoa lien ket dia chi va don address
@router.delete("/{buyer_address_id}")
def delete_my_address(buyer_address_id: int, info = Depends(require_buyer), db: Session = Depends(get_db)):
    return address_service.buyer_delete_address(db, info["user"].buyer_id, buyer_address_id)