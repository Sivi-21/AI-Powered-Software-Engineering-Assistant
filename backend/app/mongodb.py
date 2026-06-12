import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("app.mongodb")

class MongoDB:
    client: AsyncIOMotorClient | None = None

db = MongoDB()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGO_URI)
    logger.info("Connected to MongoDB.")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client:
        db.client.close()
    logger.info("MongoDB connection closed.")

def get_database():
    if db.client is None:
        db.client = AsyncIOMotorClient(settings.MONGO_URI)
    return db.client[settings.MONGO_DB_NAME]
