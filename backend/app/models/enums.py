from sqlalchemy.dialects.postgresql import ENUM as PGEnum

# Map tới các enum type đã tạo trong PostgreSQL (create_type=False)
BuyerTierEnum = PGEnum(
    "bronze", "silver", "gold", "platinum", "diamond",
    name="buyer_tier", create_type=False
)

SellerTierEnum = PGEnum(
    "regular", "preferred", "mall",
    name="seller_tier", create_type=False
)

BuyerAddrLabelEnum = PGEnum(
    "home", "office", "other",
    name="buyer_address_label_enum", create_type=False
)

SellerAddrLabelEnum = PGEnum(
    "headquarters", "warehouse", "other",
    name="seller_address_label_enum", create_type=False
)

PaymentMethodEnum = PGEnum(
    "bank_transfer", "cod", "mim_pay",
    name="payment_method_enum", create_type=False
)

OrderStatusEnum = PGEnum(
    "pending", "processing", "shipped", "delivered", "cancelled", "returned",
    name="order_status_enum", create_type=False
)

PaymentStatusEnum = PGEnum(
    "pending", "paid", "failed", "refunded",
    name="payment_status_enum", create_type=False
)
