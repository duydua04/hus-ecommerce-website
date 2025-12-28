from pydantic import BaseModel
from typing import List, Optional

# --- Stats Schema ---
class DashboardStatsResponse(BaseModel):
    revenue: float
    total_orders: int
    pending_orders: int
    cancelled_orders: int

# --- Top Products Schema ---
class TopProductResponse(BaseModel):
    name: str
    image: Optional[str] = None
    sold: int
    revenue: float


class ChartResponse(BaseModel):
    data: List[float]
    label: str 