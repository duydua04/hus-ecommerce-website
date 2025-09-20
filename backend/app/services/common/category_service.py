from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from ...models.catalog import Category
from ...schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from ...schemas.common import Page, PageMeta

# Ham tao danh muc san pham
def create_category(db: Session, payload: CategoryCreate):
    # Lay ten danh muc va loai bo khoang trang dau cuoi, neu rong tra ve loi
    name = payload.category_name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="category name is required")

    # Kiem tra danh muc da trung chua
    exists = db.query(Category).filter(name.lower() == func.lower(Category.category_name)).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")

    cat = Category(category_name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)

    return CategoryResponse.model_validate(cat)

def list_categories(db: Session, q: str | None = None, limit: int = 10, offset: int = 0):
    query = db.query(Category)
    # Ap dung tim kiem theo tu khoa neu co(
    if q:
        query = query.filter(Category.category_name.ilike(f"%{q.strip}%"))

    total = query.count() # Dem record
    categories = query.order_by(Category.category_name.asc()).limit(limit).offset(offset).all()

    data = [CategoryResponse.model_validate(category) for category in categories]
    meta = PageMeta(total=total, limit=limit, offset=offset)
    return Page(meta=meta, data=data)

def get_category_or_404(db: Session, category_id: int):
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat

def get_category(db: Session, category_id: int):
    category = get_category_or_404(db, category_id)
    return CategoryResponse.model_validate(category)

def update_category(db: Session, category_id: int, payload: CategoryUpdate):
    cat = get_category_or_404(db, category_id)
    # Chi update neu payload co category_name
    if payload.category_name is not None:
        name = payload.category_name.strip()
        if not name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Category name cannot be empty")

        # Kiem tra trung ten
        duplicate = db.query(Category).filter(
            name.lower() == func.lower(Category.category_name),
            Category.category_id != cat.category_id
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")
        cat.category_name = name

    db.add(cat)
    db.commit()
    db.refresh(cat)

    return CategoryResponse.model_validate(cat)

def delete_category(db: Session, category_id: int):
    cat = get_category_or_404(db, category_id)
    try:
        db.delete(cat)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete category")

    return {"deleted": True, "category_id": category_id}