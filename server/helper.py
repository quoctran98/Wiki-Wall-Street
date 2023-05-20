from pydantic import BaseSettings
from pymongo import MongoClient
from flask_caching import Cache
from flask_apscheduler import APScheduler
from datetime import datetime, timezone, timedelta

# Load settings from .env file
class Settings(BaseSettings):
    MONGODB_CONNECTION_STRING:str
    USERS_DB_NAME:str
    GAMES_DB_NAME:str
    PLAYERS_DB_NAME:str
    TRANSACTIONS_DB_NAME:str
    CHATS_DB_NAME:str
    
    UPDATE_HOUR_UTC:int
    WIKI_API_USER_AGENT:str
    FLASK_SECRET_KEY:str
    
    EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS:float

    ENVIRONMENT:str

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

# Connect to the MongoDB chats database
# Not collections! Each game has its own collection in the chats database
chats_db = client[settings.CHATS_DB_NAME]

# Cache for later use
cache_config = {
    "CACHE_DEBUG": 1,
    #"CACHE_TYPE": "SimpleCache",
    "CACHE_DEFAULT_TIMEOUT": 1800,
    
    "CACHE_TYPE": "FileSystemCache",
    "CACHE_THRESHOLD": 1000,
    "CACHE_DIR": "./temp/cache"
}
cache = Cache()

# Scheduler for later use
scheduler = APScheduler()

###########################
# Helper functions below! #
###########################

# We have to write a function to sanitize a bunch of user inputs
# Don't run article names through this function -- it will break them
# This is mainly for usernames, game names, etc.
def sanitize(string):
    bad_chars = ["$", "{", "}", "[", "]", "(", ")", "<", ">", "'", '"', ";", ":", "/", "\\", "|", "?", "*", "+", "=", "&", "#", "%", "@", "!", "~", "`", "^", " "]
    for char in bad_chars:
        string = string.replace(char, "_")
    return(string)

# This is called a lot in WikiAPI.py :)
# Basically doesn't let the day change until UPDATE_HOUR_UTC
# It's a little HACK to force a single update time :)
def today_wiki():
    # All times should be in UTC (the server's been doing that by default but I should be explicit)
    now = datetime.now(timezone.utc)
    now = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if now.hour < settings.UPDATE_HOUR_UTC:
        return(now - timedelta(days=1))
    else:
        return(now)

# Don't rely on this!
# There are already currently usernames that have spaces
# This is for later in the future, I guess :)
# Also doesn't check if username is already taken -- do that in the signup route
def username_is_valid(username):
    # Make sure username only containts allowed characters
    allowed_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    for char in username:
        if char not in allowed_chars:
            return(False)
    return(True)
