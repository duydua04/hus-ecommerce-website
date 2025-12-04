from __future__ import annotations
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status, Depends

from ...config.db import get_db
from ...models.address import Address, SellerAddress
from ...schemas.address import AddressCreate, AddressUpdate, SellerAddressUpdate
from ..common.address_service import BaseAddressService


class SellerAddressService(BaseAddressService):

    def list(self, user_id: int):
        return self.db.query(SellerAddress) \
            .options(selectinload(SellerAddress.address)) \
            .filter(SellerAddress.seller_id == user_id) \
            .all()


    def create_and_link(
            self, user_id: int,
            payload: AddressCreate,
            is_default: bool = False,
            label: str = None
    ):

        core_addr = self._create_core_address(payload)

        link = SellerAddress(
            seller_id=user_id,
            address_id=core_addr.address_id,
            is_default=is_default,
            label=label
        )
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)

        if is_default:
            self.set_default(user_id, link.seller_address_id)
            self.db.refresh(link)

        return link


    def update_link(
            self, user_id: int,
            link_id: int, payload: SellerAddressUpdate
    ):
        link = self.db.query(SellerAddress).filter(SellerAddress.seller_address_id == link_id).first()

        if not link or link.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        data = payload.model_dump(exclude_unset=True)
        if "label" in data: link.label = data["label"]

        if data.get("is_default"):
            self.set_default(user_id, link_id)
            self.db.refresh(link)
            return link

        self.db.commit()
        self.db.refresh(link)
        return link


    def update_content(self, user_id: int, link_id: int, payload: AddressUpdate):
        link = self.db.query(SellerAddress).filter(SellerAddress.seller_address_id == link_id).first()
        if not link or link.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        address = self.db.query(Address).get(link.address_id)
        for k, v in payload.model_dump(exclude_unset=True).items():
            if isinstance(v, str) and (not v.strip() or v == "string"): continue
            setattr(address, k, v)

        self.db.commit()
        self.db.refresh(address)
        self.db.refresh(link)
        return link


    def delete(self, user_id: int, link_id: int):
        link = self.db.query(SellerAddress).filter(SellerAddress.seller_address_id == link_id).first()
        if not link or link.seller_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found"
            )

        addr_id = link.address_id
        self.db.delete(link)
        self.db.commit()

        self._cleanup_orphan_address(addr_id)
        return {"deleted": True}


    def set_default(self, user_id: int, link_id: int):
        self.db.query(SellerAddress).filter(SellerAddress.seller_id == user_id).update({"is_default": False})
        self.db.query(SellerAddress).filter(SellerAddress.seller_address_id == link_id).update({"is_default": True})
        self.db.commit()


def get_seller_address_service(db: Session = Depends(get_db)):
    return SellerAddressService(db)