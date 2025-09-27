from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload, Query
from ...schemas.product import ProductResponse
from ...models import Product
from sqlalchemy import and_
from typing import Optional
from enum import Enum

class RatingFilter(str, Enum):
    five = "5"         
    four_plus = "4plus"  
    three_plus = "3plus" 
    two_plus = "2plus"
    one_plus = "1plus"

def filter_by_keyword(query: Query, keyword: str):
    if keyword:
        return query.filter(Product.name.ilike(f"%{keyword}%"))
    return query

def filter_by_price(query: Query, min_price: float = None, max_price: float = None):
    if min_price is not None and max_price is not None:
        return query.filter(and_(Product.base_price >= min_price, Product.base_price <= max_price))
    elif min_price is not None:
        return query.filter(Product.base_price >= min_price)
    elif max_price is not None:
        return query.filter(Product.base_price <= max_price)
    return query


def filter_by_rating_option(query: Query, rating_filter: Optional[RatingFilter]):
    if rating_filter == RatingFilter.five:
        query = query.filter(Product.rating == 5)
    elif rating_filter == RatingFilter.four_plus:
        query = query.filter(Product.rating >= 4)
    elif rating_filter == RatingFilter.three_plus:
        query = query.filter(Product.rating >= 3)
    elif rating_filter == RatingFilter.two_plus:
        query = query.filter(Product.rating >= 3)
    elif rating_filter == RatingFilter.one_plus:
        query = query.filter(Product.rating >= 3) 
    return query
