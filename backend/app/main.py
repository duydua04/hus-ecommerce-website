from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from .config import settings
from .controller.common.auth_controller import router as auth_router
from .controller.common.avatar_controller import router as avatar_router
from .controller.buyer.buyer_address_controller import router as buyer_address_router
from .controller.seller.seller_address_controller import router as seller_address_router
from .controller.admin.admin_category_controller import router as admin_category_router
from .controller.seller.seller_product_controller import router as seller_product_router
from .controller.common.public_category_controller import router as public_category_router
from .controller.admin.user_management_controller import router as admin_manage_user_router
from .controller.admin.admin_discount_controller import router as admin_manage_discount_router
from .controller.admin.admin_carrier_controller import router as admin_manage_carrier_router
from .controller.seller.seller_review_controller import router as seller_review_router
from .controller.seller.seller_order_controller import router as seller_order_router
app = FastAPI(title="Ecommerce Website")

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # Cho phép tất cả các nguồn (front-end) truy cập
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức HTTP
    allow_headers=["*"],  # Cho phép tất cả các header
)

app.include_router(auth_router)
app.include_router(avatar_router)
app.include_router(buyer_address_router)
app.include_router(seller_address_router)
app.include_router(admin_category_router)
app.include_router(public_category_router)
app.include_router(seller_product_router)
app.include_router(admin_manage_user_router)
app.include_router(admin_manage_discount_router)
app.include_router(admin_manage_carrier_router)
app.include_router(seller_review_router)
app.include_router(seller_order_router)
from .controller.buyer.buyer_product_controller import router as buyer_product_filter_router
app.include_router(buyer_product_filter_router)