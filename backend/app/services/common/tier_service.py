# app/services/common/tier_service.py
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...schemas.common import BuyerTier, SellerTier
from ...models import Buyer, Seller

# ---------- Helpers ----------
def _as_str(v) -> str | None:
    if v is None:
        return None
    return v.value if isinstance(v, Enum) else str(v)

def _coerce_for_column(current_value, new_enum):
    """Nếu cột DB là Enum → gán Enum; nếu là text/varchar → gán string."""
    return new_enum if isinstance(current_value, Enum) else new_enum.value

def decide_buyer_tier(k: dict) -> BuyerTier:
    """
    Rule mẫu (tuỳ chỉnh theo business):
      diamond  : ≥50 đơn hoặc GMV ≥ 50,000,000
      platinum : ≥20 đơn hoặc GMV ≥ 15,000,000
      gold     : ≥ 8 đơn hoặc GMV ≥  5,000,000
      silver   : ≥ 3 đơn hoặc GMV ≥  1,500,000
      bronze   : còn lại
    """
    gmv = k["gmv"]
    delivered = k["orders_delivered"]
    if delivered >= 50 or gmv >= 50_000_000:
        return BuyerTier.diamond
    if delivered >= 20 or gmv >= 15_000_000:
        return BuyerTier.platinum
    if delivered >= 8 or gmv >= 5_000_000:
        return BuyerTier.gold
    if delivered >= 3 or gmv >= 1_500_000:
        return BuyerTier.silver
    return BuyerTier.bronze


# ---------------- BUYER KPI 90d ----------------
def compute_buyer_kpi_90d(db: Session, buyer_id: int) -> dict:
    row = db.execute(text(
        """
        SELECT
          COUNT(*) FILTER (
              WHERE o.order_status = 'delivered'
                AND o.order_date >= NOW() - INTERVAL '90 days'
          ) AS orders_delivered,

          COALESCE(SUM(o.total_price) FILTER (
              WHERE o.order_status = 'delivered'
                AND o.order_date >= NOW() - INTERVAL '90 days'
          ), 0) AS gmv,

          COUNT(*) FILTER (
              WHERE o.order_date >= NOW() - INTERVAL '90 days'
          ) AS orders_total,

          COUNT(*) FILTER (
              WHERE o.order_status IN ('cancelled','returned')
                AND o.order_date >= NOW() - INTERVAL '90 days'
          ) AS orders_bad
        FROM "order" o
        WHERE o.buyer_id = :bid
        """
    ), {"bid": buyer_id}).mappings().first() or {}

    return {
        "orders_delivered": int(row.get("orders_delivered") or 0),
        "gmv": float(row.get("gmv") or 0.0),
        "orders_total": int(row.get("orders_total") or 0),
        "orders_bad": int(row.get("orders_bad") or 0),
    }


def recompute_one_buyer_tier(db: Session, buyer_id: int):
    kpi = compute_buyer_kpi_90d(db, buyer_id)
    new_enum = decide_buyer_tier(kpi)

    buyer = db.query(Buyer).get(buyer_id)
    if not buyer:
        return {"updated": False, "reason": "not_found"}

    cur = buyer.buyer_tier
    if _as_str(cur) != _as_str(new_enum):
        old = cur
        buyer.buyer_tier = _coerce_for_column(cur, new_enum)
        db.commit()
        return {"updated": True, "old": old, "new": buyer.buyer_tier}
    return {"updated": False, "old": cur, "new": cur}


# ---------------- SELLER KPI 90d ----------------
def compute_seller_kpi_90d(db: Session, seller_id: int) -> dict:
    g = db.execute(text(
        """
        WITH s_items AS (
          SELECT
            oi.order_id,
            COALESCE(oi.total_price, oi.unit_price * oi.quantity) AS line_amount
          FROM order_item oi
          JOIN product p ON p.product_id = oi.product_id
          JOIN "order"  o ON o.order_id   = oi.order_id
          WHERE p.seller_id = :sid
            AND o.order_date >= NOW() - INTERVAL '90 days'
        )
        SELECT
          COALESCE(SUM(line_amount), 0) AS gmv,
          COUNT(DISTINCT s_items.order_id) AS orders_total,
          COUNT(DISTINCT CASE
            WHEN (SELECT order_status FROM "order" o WHERE o.order_id = s_items.order_id)
                 IN ('cancelled','returned')
            THEN s_items.order_id END) AS orders_bad
        FROM s_items;
        """
    ), {"sid": seller_id}).mappings().first() or {}

    r = db.execute(text(
        """
        SELECT COALESCE(AVG(r.rating), 0) AS rating_avg
        FROM review r
        JOIN product p ON p.product_id = r.product_id
        WHERE p.seller_id = :sid
          AND r.review_date >= NOW() - INTERVAL '90 days'
        """
    ), {"sid": seller_id}).mappings().first() or {}

    orders_total = int(g.get("orders_total") or 0)
    orders_bad   = int(g.get("orders_bad") or 0)
    cancel_rate  = (orders_bad / orders_total * 100.0) if orders_total else 0.0
    return {
        "gmv": float(g.get("gmv") or 0.0),
        "orders_total": orders_total,
        "orders_bad": orders_bad,
        "rating_avg": float(r.get("rating_avg") or 0.0),
        "cancel_rate": cancel_rate,
    }


def decide_seller_tier(k: dict) -> SellerTier:
    """
    Rule mẫu:
      mall       : GMV ≥ 300,000,000 & rating ≥ 4.7 & cancel ≤ 2%
      preferred  : GMV ≥ 120,000,000 & rating ≥ 4.5 & cancel ≤ 3%
      regular    : còn lại
    """
    gmv, rating, cr = k["gmv"], k["rating_avg"], k["cancel_rate"]
    if gmv >= 300_000_000 and rating >= 4.7 and cr <= 2.0:
        return SellerTier.mall
    if gmv >= 120_000_000 and rating >= 4.5 and cr <= 3.0:
        return SellerTier.preferred
    return SellerTier.regular


def recompute_one_seller_tier(db: Session, seller_id: int):
    kpi = compute_seller_kpi_90d(db, seller_id)
    new_enum = decide_seller_tier(kpi)

    seller = db.query(Seller).filter(Seller.seller_id == seller_id)
    if not seller:
        return {"updated": False, "reason": "not_found"}

    cur = seller.seller_tier
    if _as_str(cur) != _as_str(new_enum):
        old = cur
        seller.seller_tier = _coerce_for_column(cur, new_enum)
        db.commit()
        return {"updated": True, "old": old, "new": seller.seller_tier}
    return {"updated": False, "old": cur, "new": cur}
