from sqlalchemy import text
from fastapi import HTTPException
from sqlalchemy.orm import Session
from ...models import Buyer

def recompute_one_buyer_tier(db: Session, buyer_id: int):
    """
    Cập nhật tier của buyer dựa trên:
      - Số đơn hàng giao thành công trong 30 ngày gần nhất
      - Tổng GMV (giá trị đơn giao thành công)
    """

    # Truy van tim va loc ra so don hoan thanh va tong so tien chi trong 30 ngay gan nhat
    kpi = db.execute(text("""
        SELECT 
            COUNT(*) AS orders_delivered, 
            COALESCE(SUM(o.total_price), 0) as gmv
        FROM "order" AS o
        WHERE o.buyer_id = :buyer_id
            AND o.order_status = 'delivered'
            AND o.order_date = NOW() - INTERVAL '30 days'
    """), {"buyer_id": buyer_id}).fetchone()

    # Gan gia tri cho bien
    orders_delivered = kpi.orders_delivered or 0
    gmv = float(kpi.gmv or 0)

    # Thay doi thu hang cua buyer voi cac dieu kien (de tam da bao gio chuyen lai sau)
    if gmv >= 20000000 and orders_delivered >= 10:
        new_tier = "diamond"
    elif gmv >= 10000000 and orders_delivered >= 6:
        new_tier = "platinum"
    elif gmv >= 5000000 and orders_delivered >= 3:
        new_tier = "gold"
    elif gmv >= 1000000 and orders_delivered >= 1:
        new_tier = "silver"
    else:
        new_tier = "bronze"

    # Tier hiện tại
    old_tier = db.execute(
        text('SELECT seller_tier FROM seller WHERE seller_id = :buyer_id'),
        {"buyer_id": buyer_id}
    ).scalar()

    # Neu khac thi cap nhat
    if new_tier != old_tier:
        db.execute(text("""
            UPDATE buyer
            SET buyer_tier = :tier
            WHERE buyer_id = :bid
        """), {"tier": new_tier, "bid": buyer_id})
        db.commit()

    return {
        "buyer_id": buyer_id,
        "old_tier": old_tier,
        "new_tier": new_tier,
        "orders_delivered": orders_delivered,
        "gmv": gmv
    }


# ===============     SELLER  TIER  UPDATE    ================
def recompute_one_seller_tier(db: Session, seller_id: int):
    """
    Cập nhat tier theo:
      - GMV (tổng doanh thu 30 ngày gần nhất)
      - Điểm rating trung bình của sản phẩm
    """

    kpi = db.execute(text("""
        SELECT 
            COALESCE(SUM(o.total_price), 0) AS gmv,
            COALESCE(AVG(r.rating), 0) AS avg_rating
        FROM "order" o
        JOIN order_item oi ON oi.order_id = o.order_id
        JOIN product p ON p.product_id = oi.product_id
        LEFT JOIN review r ON r.product_id = p.product_id
        WHERE p.seller_id = :sid
          AND o.order_status = 'delivered'
          AND o.order_date >= NOW() - INTERVAL '30 days'
    """), {"sid": seller_id}).fetchone()

    gmv = float(kpi.gmv or 0)
    avg_rating = float(kpi.avg_rating or 0)

    # Quy tắc xếp hạng (de sau khi nao doi lai)
    if gmv >= 50000000 and avg_rating >= 4.5:
        new_tier = "mall"
    elif gmv >= 20000000 and avg_rating >= 4.0:
        new_tier = "preferred"
    else:
        new_tier = "regular"

    # Tier hiện tại
    old_tier = db.execute(
        text('SELECT seller_tier FROM seller WHERE seller_id = :sid'),
        {"sid": seller_id}
    ).scalar()

    # Neu new_tier khac old_tier thi doi lai
    if new_tier != old_tier:
        db.execute(text("""
            UPDATE seller
            SET seller_tier = :tier
            WHERE seller_id = :sid
        """), {"tier": new_tier, "sid": seller_id})
        db.commit()

    return {
        "seller_id": seller_id,
        "old_tier": old_tier,
        "new_tier": new_tier,
        "gmv": gmv,
        "avg_rating": avg_rating
    }
