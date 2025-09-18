from fastapi import FastAPI
from backend.app.controller.common.auth_controller import router as auth_router
from backend.app.controller.common.avatar_controller import router as avatar_router
from backend.app.controller.buyer.buyer_address_controller import router as buyer_address_router
from backend.app.controller.seller.seller_address_controller import router as seller_address_router
from backend.app.controller.admin.admin_category_controller import router as admin_category_router
from backend.app.controller.seller.seller_product_controller import router as seller_product_router
from backend.app.controller.common.public_category_controller import router as public_category_router
app = FastAPI(title="Ecommerce Website")
app.include_router(auth_router)
app.include_router(avatar_router)
app.include_router(buyer_address_router)
app.include_router(seller_address_router)
app.include_router(admin_category_router)
app.include_router(public_category_router)
app.include_router(seller_product_router)