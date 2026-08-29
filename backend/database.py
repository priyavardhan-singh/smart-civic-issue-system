import os

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")


if not MONGODB_URL:
    raise ValueError("MONGODB_URL is missing from backend/.env")

if not MONGODB_DB_NAME:
    raise ValueError("MONGODB_DB_NAME is missing from backend/.env")


client = MongoClient(MONGODB_URL)

db = client[MONGODB_DB_NAME]