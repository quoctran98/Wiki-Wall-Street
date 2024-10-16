from pydantic_settings import BaseSettings
from pymongo import MongoClient
from flask_caching import Cache
from flask_mail import Mail
from flask_apscheduler import APScheduler
from datetime import datetime, timezone, timedelta
import fnmatch
import pickle
import os

from functools import wraps
from flask import request

# Load settings from .env file
class Settings(BaseSettings):
    SERVER_URL:str
    FLASK_SECRET_KEY:str
    ENVIRONMENT:str

    MONGODB_CONNECTION_STRING:str
    USERS_DB_NAME:str
    GAMES_DB_NAME:str
    PLAYERS_DB_NAME:str
    TRANSACTIONS_DB_NAME:str
    CHATS_DB_NAME:str

    WIKI_API_USER_AGENT:str
    EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS:float
    UPDATE_HOUR_UTC:int
    
    MAIL_SERVER:str
    MAIL_PORT:int
    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_USE_TLS:bool
    MAIL_USE_SSL:bool

    class Config:
        env_file = ".env"

settings = Settings()

# Connect to MongoDB (this will also initialize the collections if they don't exist)
client = MongoClient(settings.MONGODB_CONNECTION_STRING)

# Connect to MongoDB users database
users_db = client[settings.USERS_DB_NAME]
active_users_coll = users_db.active_users
old_users_coll = users_db.old_users

# Connect to the MongoDB games database
games_db = client[settings.GAMES_DB_NAME]
active_games_coll = games_db.active_games
old_games_coll = games_db.old_games

# Connect to the MongoDB transactions database
# Not collections! Each game has its own collection in the transactions database
transactions_db = client[settings.TRANSACTIONS_DB_NAME]

# Connect to the MongoDB players database
# Not collections! Each game has its own collection in the players database
players_db = client[settings.PLAYERS_DB_NAME]

# Connect to the MongoDB chats database
# Not collections! Each game has its own collection in the chats database
chats_db = client[settings.CHATS_DB_NAME]

# Mail for initializating in __init__.py
OUTGOING_EMAILS = {
    "default": "yes-reply@wiki-wall-street.com"
}
mail = Mail()

# Cache for initializing in __init__.py
cache_config = {
    "CACHE_DEBUG": 1,
    "CACHE_DEFAULT_TIMEOUT": 84600, # 24 hours (most things are updated daily)
    "CACHE_TYPE": "FileSystemCache",
    "CACHE_THRESHOLD": 1000,
    "CACHE_DIR": "./server/temp/cache"
}
cache = Cache()

# Scheduler for initializing in __init__.py
scheduler = APScheduler()

# Unpack article categories from .txt files in ./categories
allowed_categories = {"": []}
for filename in os.listdir("./server/categories/allowed"):
    if filename.endswith(".txt"):
        with open("server/categories/allowed/" + filename, "r") as f:
            allowed_categories[filename[:-4]] = f.read().splitlines()
banned_categories = {"": []}
for filename in os.listdir("./server/categories/banned"):
    if filename.endswith(".txt"):
        with open("server/categories/banned/" + filename, "r") as f:
            banned_categories[filename[:-4]] = f.read().splitlines()

# For allowed categories with explicit search lists :)
search_lists = {"": []}
for filename in os.listdir("./server/categories/search_lists"):
    if filename.endswith(".txt"):
        with open("server/categories/search_lists/" + filename, "r") as f:
            search_lists[filename[:-4]] = f.read().splitlines()

###########################
# Helper functions below! #
###########################

# We have to write a function to sanitize a bunch of user inputs
# Don't run article names through this function -- it will break them
# This is mainly for usernames, game names, etc.
def sanitize(string):
    bad_chars = ["$", "{", "}", "[", "]", "(", ")", "<", ">", "'", '"', ";", ":", "/", "\\", "|", "?", "*", "+", "=", "&", "~", "`", "^",]
    for char in bad_chars:
        string = string.replace(char, "_")
    return(string)

# This is called a lot in WikiAPI.py :)
# Basically doesn't let the day change until UPDATE_HOUR_UTC
# So at 6 AM UTC on Tusday, it will return Sunday midnight UTC
# and at 7 AM UTC on Tuesday, it will return Monday midnight UTC -- is this right?
# It's a little HACK to force a single update time :)
def today_wiki():
    # All times should be in UTC (the server's been doing that by default but I should be explicit)
    now = datetime.now(timezone.utc)
    floor_today = now.replace(hour=0, minute=1, second=0, microsecond=0)
    if now.hour < settings.UPDATE_HOUR_UTC:
        return(floor_today - timedelta(days=2))
    else:
        return(floor_today - timedelta(days=1))

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

# Call this function to clear all the caches for a game
# If settings are changed or whatever, delete all caches for a game
GAME_PATHS_CACHED = ["search_article", "allowed_article"]
def clear_game_caches(game_id, paths=GAME_PATHS_CACHED):
    # I found a big issue!
    # Filesystem caches store the hash of the key in the filename
    # There's no way to retrieve the keys from the cache unless I write a function to do it
    cache.clear()


# This is to log server errors
def log_error(error_msg, path="./server/logs/errors"):
    # Save this to an output log file
    time = datetime.now(timezone.utc)
    filename = f"{path}/{time.strftime('%Y%m%d-%H%M%S')}.txt"
    try:
        with open(filename, "w") as f:
            f.write(error_msg)
    except:
        print("Couldn't write to log file!")