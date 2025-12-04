from __future__ import annotations
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session

from ...models.address import Address, BuyerAddress, SellerAddress
from ...schemas.address import AddressCreate, AddressUpdate


class BaseAddressService(ABC):
    def __init__(self, db: Session):
        self.db = db


    def _create_core_address(self, payload: AddressCreate):
        """Tạo bản ghi Address gốc"""
        address = Address(**payload.model_dump())
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)

        return address

    def _cleanup_orphan_address(self, address_id: int):
        """Dọn dẹp Address gốc nếu không còn ai dùng"""
        is_used = (
                self.db.query(BuyerAddress).filter(BuyerAddress.address_id == address_id).first() or
                self.db.query(SellerAddress).filter(SellerAddress.address_id == address_id).first()
        )
        if not is_used:
            self.db.query(Address).filter(Address.address_id == address_id).delete()
            self.db.commit()


    # CAC ABSTRACTMETHOD
    @abstractmethod
    def list(self, user_id: int):
        pass


    @abstractmethod
    def create_and_link(self, user_id: int, payload: AddressCreate, is_default: bool, label: str):
        pass


    @abstractmethod
    def update_link(self, user_id: int, link_id: int, payload):
        pass


    @abstractmethod
    def update_content(self, user_id: int, link_id: int, payload: AddressUpdate):
        pass


    @abstractmethod
    def delete(self, user_id: int, link_id: int):
        pass


    @abstractmethod
    def set_default(self, user_id: int, link_id: int):
        pass