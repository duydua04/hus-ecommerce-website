# --- IMPORT THU VIEN, DUONG DAN
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from .config import settings
from .lifespan import lifespan




# IMPORT ADMIN CONTROLLER
from .controller.admin.admin_category_controller import router as admin_category_router
from .controller.admin.user_management_controller import router as admin_manage_user_router
from .controller.admin.admin_discount_controller import router as admin_manage_discount_router
from .controller.admin.admin_carrier_controller import router as admin_manage_carrier_router
from .controller.admin.admin_notification_controller import router as admin_notify_router
from .controller.admin.admin_dashboard_controller import router as admin_dashboard_router


# IMPORT SELLER CONTROLLER
from .controller.seller.seller_address_controller import router as seller_address_router
from .controller.seller.seller_product_controller import router as seller_product_router
from .controller.seller.seller_review_controller import router as seller_review_router
#from .controller.seller.seller_order_controller import router as seller_order_router
from .controller.seller.seller_profile_controller import router as seller_profile_router
from .controller.seller.seller_order_controller import router as seller_order_router
from .controller.seller.seller_dashboard_controller import router as seller_dashboard_router


# IMPORT COMMON CONTROLLER
from .controller.common.auth_controller import router as auth_router
from .controller.common.avatar_controller import router as avatar_router
from .controller.common.chat_controller import router as chat_router
#from .controller.common.notification_controller import router as notice_router
from .controller.common.websocket_controller import router as websocket_router
from .controller.common.public_category_controller import router as public_category_router


# IMPORT BUYER CONTROLLER
from .controller.buyer.buyer_address_controller import router as buyer_address_router
from .controller.buyer.buyer_product_controller import router as buyer_product_filter_router
from .controller.buyer.buyer_cart_controller import router as buyer_cart_router
from .controller.buyer.buyer_discount_controller import router as buyer_discount_router
from .controller.buyer.buyer_carrier_controller import router as buyer_carrier_router
from .controller.buyer.buyer_order_controller import router as buyer_order_router
from .controller.buyer.buyer_profile_controller import router as buyer_profile_router
from .controller.buyer.buyer_review_controller import router as buyer_review_router 






from .controller.buyer.buyer_notification_controller import router as buyer_notify_router

app = FastAPI(
    title="Ecommerce Website",
    lifespan=lifespan
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức HTTP
    allow_headers=["*"],  # Cho phép tất cả các header
)



# APP INCLUDE ADMIN ROUTER
app.include_router(admin_category_router)
app.include_router(admin_manage_user_router)
app.include_router(admin_manage_discount_router)
app.include_router(admin_manage_carrier_router)
app.include_router(admin_notify_router)
app.include_router(admin_dashboard_router)





# APP INCLUDE SELLER ROUTER
app.include_router(seller_address_router)
app.include_router(seller_product_router)
app.include_router(seller_review_router)
app.include_router(seller_order_router)
app.include_router(seller_profile_router)
app.include_router(seller_dashboard_router)





# APP INCLUDE COMMON ROUTER
app.include_router(auth_router)
app.include_router(avatar_router)
app.include_router(chat_router)
app.include_router(websocket_router)
app.include_router(public_category_router)







# APP INCLUDE BUYER ROUTER
app.include_router(buyer_address_router)
app.include_router(buyer_product_filter_router)
app.include_router(buyer_cart_router)
app.include_router(buyer_discount_router)
app.include_router(buyer_carrier_router)
app.include_router(buyer_order_router)
app.include_router(buyer_notify_router)
app.include_router(buyer_profile_router)
app.include_router(buyer_review_router)