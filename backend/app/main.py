from fastapi import FastAPI
from .controller.auth_controller import router as auth_router
from .controller.avatar_controller import router as avatar_router
app = FastAPI(title="Ecommerce Website")
app.include_router(auth_router)
app.include_router(avatar_router)

