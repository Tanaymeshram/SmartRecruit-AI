import logging
import asyncio
import socket
from typing import Any, Optional
from backend.app.core.config import settings
from backend.app.database.storage import LocalDatabase

logger = logging.getLogger("talentmatch.database")

_db_instance = None
_is_real_mongo = False

class MongoCollectionAdapter:
    """Adapts Motor collection to match our standardized interface."""
    def __init__(self, collection):
        self._col = collection

    async def find(self, filter_dict=None, sort=None, limit=0, skip=0):
        filter_dict = filter_dict or {}
        cursor = self._col.find(filter_dict)
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        docs = await cursor.to_list(length=1000)
        for doc in docs:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
        return docs

    async def find_one(self, filter_dict=None):
        filter_dict = filter_dict or {}
        doc = await self._col.find_one(filter_dict)
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def insert_one(self, doc):
        res = await self._col.insert_one(doc)
        return res

    async def update_one(self, filter_dict, update_dict):
        res = await self._col.update_one(filter_dict, update_dict)
        return res

    async def delete_one(self, filter_dict):
        res = await self._col.delete_one(filter_dict)
        return res

    async def count_documents(self, filter_dict=None):
        filter_dict = filter_dict or {}
        return await self._col.count_documents(filter_dict)

    async def distinct(self, field, filter_dict=None):
        filter_dict = filter_dict or {}
        return await self._col.distinct(field, filter_dict)

class RealMongoDatabase:
    """Loop-safe Motor database provider supporting dynamic pytest and anyio event loops."""
    def __init__(self, uri: str, db_name: str):
        self._uri = uri
        self._db_name = db_name
        self._clients = {}

    def _get_active_client(self):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop not in self._clients or (loop and loop.is_closed()):
            from motor.motor_asyncio import AsyncIOMotorClient
            self._clients[loop] = AsyncIOMotorClient(self._uri, serverSelectionTimeoutMS=1000)
        return self._clients[loop]

    def __getitem__(self, name: str):
        client = self._get_active_client()
        return MongoCollectionAdapter(client[self._db_name][name])

def is_mongo_reachable(host="localhost", port=27017, timeout=0.3) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

async def init_db():
    global _db_instance, _is_real_mongo
    if _db_instance is not None:
        return _db_instance

    if is_mongo_reachable("localhost", 27017):
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1000)
            await client.admin.command('ping')
            _db_instance = RealMongoDatabase(settings.MONGODB_URI, settings.DATABASE_NAME)
            _is_real_mongo = True
            logger.info(f"Connected to live MongoDB at {settings.MONGODB_URI}")
            return _db_instance
        except Exception as e:
            logger.info(f"MongoDB ping notice ({e}). Falling back to local store.")

    logger.info(f"Using high-performance Local Document Store. Data persisted to {settings.DB_STORAGE_DIR}")
    _db_instance = LocalDatabase(settings.DB_STORAGE_DIR)
    _is_real_mongo = False
    return _db_instance

def get_db():
    global _db_instance
    if _db_instance is None:
        _db_instance = LocalDatabase(settings.DB_STORAGE_DIR)
    return _db_instance

def is_using_real_mongo() -> bool:
    return _is_real_mongo
