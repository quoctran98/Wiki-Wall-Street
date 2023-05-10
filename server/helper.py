from pydantic import BaseSettings
from pymongo import MongoClient
from flask_caching import Cache
from flask_apscheduler import APScheduler

# Load settings from .env file
class Settings(BaseSettings):
    MONGODB_CONNECTION_STRING:str
    USERS_DB_NAME:str
    GAMES_DB_NAME:str
    PLAYERS_DB_NAME:str
    TRANSACTIONS_DB_NAME:str
    
    WIKI_API_USER_AGENT:str
    FLASK_SECRET_KEY:str
    
    EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS:float

    class Config:
        env_file = ".env"

settings = Settings()

# Connect to MongoDB (this will also initialize the collections if they don't exist)
client = MongoClient(settings.MONGODB_CONNECTION_STRING)

# Connect to MongoDB users database
users_db = client[settings.USERS_DB_NAME]
active_users_coll = users_db.active_users

# Connect to the MongoDB games database
games_db = client[settings.GAMES_DB_NAME]
active_games_coll = games_db.active_games

# Connect to the MongoDB transactions database
# Not collections! Each game has its own collection in the transactions database
transactions_db = client[settings.TRANSACTIONS_DB_NAME]

# Connect to the MongoDB players database
# Not collections! Each game has its own collection in the players database
players_db = client[settings.PLAYERS_DB_NAME]

# Cache for later use
cache_config = {
    "CACHE_DEBUG": 1,
    "CACHE_TYPE": "simple",
    "CACHE_DEFAULT_TIMEOUT": 1800
}
cache = Cache()

# Scheduler for later use
scheduler = APScheduler()
