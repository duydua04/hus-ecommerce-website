from fastapi import FastAPI
from .controller.auth_controller import router as auth_router
from .controller.avatar_controller import router as avatar_router
from .controller.buyer_address_controller import router as buyer_address_router
from .controller.seller_address_controller import router as seller_address_router
from .controller.category_controller import router as category_router
app = FastAPI(title="Ecommerce Website")
app.include_router(auth_router)
app.include_router(avatar_router)
app.include_router(buyer_address_router)
app.include_router(seller_address_router)
app.include_router(category_router)