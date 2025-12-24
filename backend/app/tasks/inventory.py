from celery import shared_task
from sqlalchemy import update
from ..config.db import SyncSessionLocal
from ..models import ProductSize


@shared_task(
    bind=True,
    max_retries=5,
    default_retry_delay=10,  # Thử lại sau 10s nếu DB lock
    name="inventory.update_stock_db"
)
def update_stock_db(self, size_id: int, delta_quantity: int):
    """
    Đồng bộ kho xuống DB.
    - delta_quantity < 0: Trừ kho (Đặt hàng)
    - delta_quantity > 0: Hoàn kho (Hủy đơn)
    """
    db = SyncSessionLocal()
    try:
        # Update trực tiếp dùng biểu thức SQL (tránh Race Condition ở level DB)
        stmt = (
            update(ProductSize)
            .where(ProductSize.size_id == size_id)
            .values(available_units=ProductSize.available_units + delta_quantity)
        )
        result = db.execute(stmt)

        # Nếu muốn log warning khi update ID không tồn tại
        if result.rowcount == 0:
            print(f"[WARNING] Size ID {size_id} not found in DB to update stock")

        db.commit()
        return f"Size {size_id}: Updated {delta_quantity} units"

    except Exception as e:
        db.rollback()
        print(f"[CELERY ERROR] Sync stock failed: {e}")
        # Retry task
        raise self.retry(exc=e)
    finally:
        db.close()