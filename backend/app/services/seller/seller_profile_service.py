from __future__ import annotations
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ...models.users import Seller
from ...config.s3 import public_url
from ...schemas.user import SellerResponse, SellerUpdate


def get_current_seller_info(seller_id: int, db: Session):
    current_seller = db.query(Seller).filter(Seller.seller_id == seller_id).first()

    if not current_seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller could not found"
        )

    return SellerResponse.model_validate(current_seller)
