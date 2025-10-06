# backend/app/tasks/tier_tasks.py
from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import text

from ..celery_app import celery_app
from ..config.db import SessionLocal
from ..services.common.tier_service import (
    recompute_one_buyer_tier,
    recompute_one_seller_tier,
)


@celery_app.task
def recompute_all_tiers():
    db: Session = SessionLocal()
    try:
        # Buyers
        buyer_ids = [r[0] for r in db.execute(text('SELECT buyer_id FROM "buyer"')).fetchall()]
        for bid in buyer_ids:
            recompute_one_buyer_tier(db, bid)

        # Sellers
        seller_ids = [r[0] for r in db.execute(text('SELECT seller_id FROM "seller"')).fetchall()]
        for sid in seller_ids:
            recompute_one_seller_tier(db, sid)
    finally:
        db.close()
