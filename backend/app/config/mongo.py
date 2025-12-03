from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .settings import settings
from ..models.chat import Conversation, Message
from ..models.notification import Notification

async def init_mongo():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(
        database=client[settings.MONGO_DB_NAME],
        document_models=[
            Conversation,
            Message,
            Notification,

        ]
    )