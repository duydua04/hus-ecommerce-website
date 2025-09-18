from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from backend.app.models.address import Address, BuyerAddress, SellerAddress
from backend.app.schemas.address import AddressCreate, AddressUpdate, BuyerAddressUpdate, SellerAddressUpdate
from backend.app.schemas.common import BuyerAddressLabel, SellerAddressLabel

# Xac minh quyen so huu cua mot dia chi link, dam bao rang nguoi dung hien tai co quyen truy cap vao link do
def ensure_owner_link(link, user_id: int, role: str):
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address link not found")

    if role == "buyer" and link.buyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address link not found")
    elif role == "seller" and link.seller_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address link not found")

# Setting dia chi mac dinh cho buyer, chi co 1 dia chi mac dinh
def set_single_default_address_for_buyer(db: Session, buyer_id: int, buyer_address_id: int):
    db.query(BuyerAddress).filter(BuyerAddress.buyer_id == buyer_id).update({"is_default": False})
    db.query(BuyerAddress).filter(BuyerAddress.buyer_address_id == buyer_address_id).update({"is_default": True})
    db.commit()

# Setting dia chi mac dinh cho seller, chi co 1 dia chi mac dinh
def set_single_default_address_for_seller(db: Session, seller_id: int, seller_address_id: int):
    db.query(SellerAddress).filter(SellerAddress.seller_id == seller_id).update({"is_default": False})
    db.query(SellerAddress).filter(SellerAddress.seller_address_id == seller_address_id).update({"is_default": True})
    db.commit()

# DUNG CHUNG
# Tao address, ham nay se dung chung
def create_address(db: Session, payload: AddressCreate):
    address = Address(**payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)

    return address

# Update address (dung chung)
def update_address(db: Session, address_id: int, payload: AddressUpdate):
    address = db.query(Address).filter(Address.address_id == address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    # Loai bo None va unset value
    update_data = payload.model_dump(exclude_none=True, exclude_unset=True)

    # Chi update nhung field thuc su thay doi
    for field, new_value in update_data.items():
        if new_value == "string":
            continue

        current_value = getattr(address, field)
        if current_value != new_value and new_value.strip() != "":
            setattr(address, field, new_value)

    db.commit()
    db.refresh(address)

    return address

# Tra ve dia chi (dung chung)
def get_address(db: Session, address_id: int):
    address = db.query(Address).filter(Address.address_id == address_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address

# BUYER ADDRESS SERVICE
# Tra ve danh sach dia chi cua buyer
def buyer_address_list(db: Session, buyer_id: int):
    return db.query(BuyerAddress) \
        .options(selectinload(BuyerAddress.address)) \
        .filter(BuyerAddress.buyer_id == buyer_id) \
        .all()

# Lien ket mot dia chi da ton tai voi buyer
def buyer_link_address_existing(db: Session, buyer_id: int, address_id: int,
                                is_default: bool | None, label: BuyerAddressLabel):
    # Kiem tra xem address co ton tai khong
    if not db.query(Address).filter(Address.address_id == address_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    # Kiem tra xem buyer da link voi address nay chua
    exists = db.query(BuyerAddress) \
        .filter(BuyerAddress.address_id == address_id, BuyerAddress.buyer_id == buyer_id) \
        .first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Address already linked")

    # Link dia chi voi buyer, tao xong duoc add vao bang buyer address
    link = BuyerAddress(
        buyer_id=buyer_id,
        address_id=address_id,
        is_default=bool(is_default),
        label=label
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    # Xu ly default, neu buyer dua vao dia chi la default thi goi ham set default va set up
    if is_default:
        set_single_default_address_for_buyer(db, buyer_id, link.buyer_address_id)
        db.refresh(link)

    return link

# Tao dia chi va link dia chi voi buyer
def buyer_create_and_link_address(db: Session, buyer_id: int, address: AddressCreate,
                          is_default: bool | None, label: BuyerAddressLabel | None):
    address = create_address(db, address)
    return buyer_link_address_existing(db, buyer_id, address.address_id, is_default, label)

# Cap nhat thong tin lien ket dia chi cua nguoi mua
def buyer_update_link_address(db: Session, buyer_id: int, buyer_address_id: int, payload: BuyerAddressUpdate):
    link = db.query(BuyerAddress).filter(BuyerAddress.buyer_address_id == buyer_address_id).first()
    ensure_owner_link(link, buyer_id, "buyer") # Kiem tra quyen so huu dia chi co phai dia chi cua buyer khong

    data = payload.model_dump(exclude_unset=True) # Chuyen payload duoc day len thanh dict va loai bo cac field khong duoc set

    # Cap nhat label va dia chi mac dinh neu co thay doi
    if "label" in data:
        link.label = data["label"]
    if "is_default" in data and data["is_default"]:
        set_single_default_address_for_buyer(db, buyer_id, buyer_address_id)
        db.refresh(link)
        return link

    db.commit()
    db.refresh(link)
    return link

# Cap nhat thong tin chi tiet cua dia chi buyer
def buyer_update_address_fields(db: Session, buyer_id: int, buyer_address_id: int, payload: AddressUpdate):
    link = db.query(BuyerAddress) \
        .options(selectinload(BuyerAddress.address)) \
        .filter(BuyerAddress.buyer_address_id == buyer_address_id) \
        .first()

    ensure_owner_link(link, buyer_id, "buyer")
    update_address(db, link.address_id, payload)
    db.refresh(link)
    return link


def buyer_set_default_address(db: Session, buyer_id: int, buyer_address_id: int):
    link = db.query(BuyerAddress).filter(BuyerAddress.buyer_address_id == buyer_address_id).first()
    ensure_owner_link(link, buyer_id, "buyer")
    set_single_default_address_for_buyer(db, buyer_id, buyer_address_id)
    db.refresh(link)

    return link

def buyer_delete_address(db: Session, buyer_id: int, buyer_address_id: int):
    link = db.query(BuyerAddress).filter(BuyerAddress.buyer_address_id == buyer_address_id).first()
    ensure_owner_link(link, buyer_id, "buyer")
    address_id = link.address_id
    db.delete(link)
    db.commit()

    # Kiem tra xem con ai co dia chi nay khong
    still_linked = (db.query(BuyerAddress).filter(BuyerAddress.address_id == address_id).first() or
                    db.query(SellerAddress).filter(SellerAddress.address_id == address_id).first())

    # Neu khong con ai giu dia chi nay thi xoa no di
    if not still_linked:
        address = db.query(Address).filter(Address.address_id == address_id).first()
        if address:
            db.delete(address)
            db.commit()

    return {"deleted": True}

# SELLER ADDRESS SERVICE
def seller_address_list(db: Session, seller_id: int):
    return db.query(SellerAddress) \
        .options(selectinload(SellerAddress.address)) \
        .filter(SellerAddress.seller_id == seller_id) \
        .all()

def seller_link_address_existing(db: Session, seller_id: int, address_id: int,
                                 is_default: bool | None, label: SellerAddressLabel):
    # Kiem tra address co ton tai khong
    if not db.query(Address).filter(Address.address_id == address_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    # Kiem tra seller da link voi address nay chua
    exist = db.query(SellerAddress) \
        .filter(SellerAddress.seller_id == seller_id, SellerAddress.address_id == address_id) \
        .first()

    if exist:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Address already link")

    link = SellerAddress(
        seller_id=seller_id,
        address_id=address_id,
        is_default=bool(is_default),
        label=label
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    # Neu default la true thi goi set single default
    if is_default:
        set_single_default_address_for_seller(db, seller_id, link.seller_address_id)
        db.refresh(link)

    return link

# Tao dia chi va link dia chi voi seller
def seller_create_and_link_address(db: Session, seller_id: int, address: AddressCreate,
                                   is_default: bool | None, label: SellerAddressLabel):
    address = create_address(db, address)
    return seller_link_address_existing(db, seller_id, address.address_id, is_default, label)

# Cap nhat link dia chi cua selle
def seller_update_link_address(db: Session, seller_id: int, seller_address_id: int, payload: SellerAddressUpdate):
    # Tim va kiem tra co link dia chi voi seller khong
    link = db.query(SellerAddress).filter(SellerAddress.seller_address_id == seller_address_id).first()
    ensure_owner_link(link, seller_id, "seller")

    # Cap nhat label va dia chi mac dinh neu co thay doi
    data = payload.model_dump(exclude_unset=True)
    if "label" in data:
        link.label = data["label"]
    if "is_default" in data and data["is_default"]:
        set_single_default_address_for_seller(db, seller_id, seller_address_id)
        db.refresh(link)
        return link

    db.commit()
    db.refresh(link)

    return link

# Cap nhat lai truong dia chi cho seller
def seller_update_address_fields(db: Session, seller_id: int, seller_address_id: int, payload: AddressUpdate):
    # Tim dia chi hien tai
    link = db.query(SellerAddress) \
        .options(selectinload(SellerAddress.address)) \
        .filter(SellerAddress.seller_address_id == seller_address_id) \
        .first()

    ensure_owner_link(link, seller_id, "seller")
    return update_address(db, link.address_id, payload)

# Set dia chi mac dinh cho seller
def seller_set_default_address(db: Session, seller_id: int, seller_address_id: int):
    link = db.query(SellerAddress).filter(SellerAddress.seller_address_id == seller_address_id).first()
    ensure_owner_link(link, seller_id, "seller")
    set_single_default_address_for_seller(db, seller_id, seller_address_id)
    db.refresh(link)

    return link

# xoa dia chi cua seller
def seller_delete_address(db: Session, seller_id: int, seller_address_id: int):
    link = db.query(SellerAddress).filter(SellerAddress.seller_address_id == seller_address_id).first()
    ensure_owner_link(link, seller_id, "seller")
    address_id = link.address_id
    db.delete(link)
    db.commit()

    # Kiem tra xem con ai giu dia chi nay
    still_linked = (db.query(SellerAddress).filter(SellerAddress.address_id == address_id).first() or
                    db.query(BuyerAddress).filter(BuyerAddress.address_id == address_id).first())
    # Neu khong con thi thuc hien xoa khoi database
    if not still_linked:
        address = db.query(Address).filter(Address.address_id == address_id).first()
        if address:
            db.delete(address)
            db.commit()

    return {"deleted": True}