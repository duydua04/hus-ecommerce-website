from __future__ import annotations
from pydantic import BaseModel, Field
from .common import ORMBase

# Request toi server tao category
class CategoryCreate(BaseModel):
    category_name: str = Field(..., max_length=255)

class CategoryUpdate(BaseModel):
    category_name: str | None = Field(None, max_length=255)

class CategoryResponse(ORMBase):
    category_id: int
    category_name: str
    image_url: str
