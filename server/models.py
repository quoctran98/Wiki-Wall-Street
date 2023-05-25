from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime, timezone, timedelta

from server.helper import settings, active_users_coll, active_games_coll, old_games_coll, transactions_db, players_db, chats_db, today_wiki, allowed_categories, banned_categories

from server import WikiAPI

class User(UserMixin):
    def __init__(self, name, email, password, signup_time, joined_games, old_games=[], user_id=None):
        # We're ignoring MongoDB's document _id field and using our own UUID
        self.name = name
        self.email = email
        self.password = password
        self.signup_time = signup_time
        self.joined_games = joined_games
        self.old_games = old_games # This is for backwards compatibility :)
        self.user_id = uuid.uuid4().hex if user_id is None else str(user_id)
        # We're going to avoid touching MongoDB document _id fields entirely

    # These are the methods required by Flask-Login
    def is_authenticated(self):
        return(True)
    def is_active(self):
        return(True)
    def is_anonymous(self):
        return(False)
    def get_id(self):
        return(self.user_id)
    
    # This isn't a class method because it's called on an instance of the class
    def check_password(self, password):
        return(check_password_hash(self.password, password))
    
    def update_user(self):
        """Update the user's information in MongoDB"""
        active_users_coll.update_one({"user_id": self.user_id}, {"$set": self.__dict__})

    @classmethod
    def get_by_email(cls, email):
        data = active_users_coll.find_one({"email": email})
        if data is not None:
            data.pop('_id', None) # Remove the MongoDB _id field
            return cls(**data)
    
    # This shouldn't be used often!
    # I want usernames to be unique, but I can't guarantee that right now
    @classmethod
    def get_by_name(cls, name):
        data = active_users_coll.find_one({"name": name})
        if data is not None:
            data.pop('_id', None)
            return cls(**data)
    
    # This method is only used by Flask-Login's load_user() in __init__.py
    @classmethod
    def get_by_user_id(cls, user_id):
        data = active_users_coll.find_one({"user_id": user_id}) 
        if data is not None:
            data.pop('_id', None) # Remove the MongoDB _id field
            return cls(**data)

    @classmethod
    def singup(cls, email, name, password):
        user = cls.get_by_email(email)
        if user is None:
            user_id = "user_" + uuid.uuid4().hex
            active_users_coll.insert_one({
                "email": email,
                "name": name,
                "password": generate_password_hash(password, method="sha256"),
                # scrypt breaks on DigitalOcean?
                "signup_time": datetime.now(timezone.utc),
                "joined_games": [],
                "user_id": user_id
            })
            return(True)
        return(False)

class Game():
    def __init__(self, game_id, name, owner_id, user_ids, settings, players, transactions, 
                 chats=None, public=None):
        self.game_id = game_id
        self.name = name
        self.owner_id = owner_id
        self.user_ids = user_ids
        self.settings = settings
        self.players = players
        self.transactions = transactions
        # Defaults in __init__ for backwards compatibility-ish
        self.chats = chats if chats is not None else ["chat_0"] # Default chat I guess
        self.public = public if public is not None else False

    def update_game(self):
        """Update the game in the MongoDB."""
        active_games_coll.update_one({"game_id": self.game_id}, {"$set": self.__dict__})

    def get_public_dict(self):
        """Return a dictionary with only the public information about the game."""
        return({
            "game_id": self.game_id,
            "name": self.name,
            "owner_id": self.owner_id,
            "settings": self.settings,
            "players": self.players,
            "chat": self.chats, # "public" means "public to all players in the game", I guess
            "public": self.public,
        })
    
    def allowed_article(self, article_name):
        # Sucks that I have to make this call twice per article but it's probably fine
        article_categories = WikiAPI.article_information(article_name)["categories"]
        
        # Check if the game has any explicitly allowed themes
        if "allowed_categories" in self.settings:
            unpacked_allowed = [] # unpack the game's allowed categories
            for c in self.settings["allowed_categories"]:
                unpacked_allowed.extend(allowed_categories[c])
            if len(unpacked_allowed) > 0: # if there's an explicit list of allowed categories
                return(any([cat in unpacked_allowed for cat in article_categories]) or article_name in unpacked_allowed)

        # Check if the game has any banned categories
        if "banned_categories" in self.settings:
            unpacked_banned = []
            for c in self.settings["banned_categories"]:
                unpacked_banned.extend(banned_categories[c])
            if any([cat in unpacked_banned for cat in article_categories]) or article_name in unpacked_banned:
                return(False) # not necessarily allowed yet but definitely not allowed

        # Check if the article is below the minimum views limit
        if "views_limit" in self.settings:
            lowest_this_month = float(min([x["views"] for x in WikiAPI.normalized_views(article_name)]))
            if (float(self.settings["views_limit"]) > lowest_this_month):
                return(False)

        return(True)

    def change_settings(self, new_settings):
        """Change the settings of the game."""
        updated_settings = self.settings
        # Add/change settings that are in the new settings
        for setting in new_settings:
            updated_settings[setting] = new_settings[setting]

        # Update the settings in the MongoDB
        active_games_coll.update_one({"game_id": self.game_id}, {"$set": {"settings": updated_settings}})
        # Update the current game object
        self.settings = updated_settings
        
        # I would love to clear all the caches related to this game here but I don't know how

    def delete_game(self):
        """Delete the game from the MongoDB."""

        # Add the game to the old games collection
        old_games_coll.insert_one({
            "game_id": self.game_id,
            "name": self.name,
            "owner_id": self.owner_id,
            "user_ids": self.user_ids,
            "settings": self.settings,
            "players": self.players,
            "transactions": self.transactions,
            "chats": self.chats,
            "public": self.public,
        })

        # Remove the game from the users' joined_games lists
        for user_id in self.user_ids:
            active_users_coll.update_one({"user_id": user_id}, {"$pull": {"joined_games": self.game_id}})
            active_users_coll.update_one({"user_id": user_id}, {"$push": {"old_games": self.game_id}})
        # Remove the game from the MongoDB
        active_games_coll.delete_one({"game_id": self.game_id})
        # Remove the game's transactions collection
        transactions_db.drop_collection(self.game_id)
        # Remove the game's players collection
        players_db.drop_collection(self.game_id)
        # Remove the game's chats collection
        chats_db.drop_collection(self.game_id)

    @classmethod
    def get_by_game_id(cls, game_id):
        data = active_games_coll.find_one({"game_id": game_id})
        if data is not None:
            data.pop('_id', None) # Remove the MongoDB _id field
            return cls(**data)
    
    @classmethod
    def create_game(cls, name, owner_id, settings, public):
        game_id = "game_" + uuid.uuid4().hex

        # Create a new collection in the transactions database
        transactions_db.create_collection(game_id)

        # Create a new collection in the players database

        active_games_coll.insert_one({
            "game_id": game_id,
            "name": name,
            "owner_id": owner_id,
            "user_ids": [], # Join game is a separate operation
            "settings": settings,
            "players": [],
            "transactions": [],
            "chats": [],
            "public": public,
        })
        return(game_id)
    
class Player():
    def __init__(self, player_id, user_id, game_id, name, cash, articles, avg_price, transactions, value_history):
        self.player_id = player_id
        self.user_id = user_id
        self.game_id = game_id
        self.name = name
        self.cash = cash
        self.articles = articles
        self.avg_price = avg_price
        self.transactions = transactions
        self.value_history = value_history

    def get_info(self):
        """Return a dictionary with only the public information about the player."""
        game_settings = Game.get_by_game_id(self.game_id).settings
        info_dict = {
            "player_id": self.player_id,
            "user_id": self.user_id,
            "game_id": self.game_id,
            "name": self.name,
            "value": self.value_history[-1]["value"],
            "yesterday_value": self.yesterday_value,
            "last_week_value": self.last_week_value,
        }

        # Some games don't have these visibility (ugh!), so check if they exist first
        if "show_cash" in game_settings:
            if game_settings["show_cash"]:
                info_dict["cash"] = self.cash
        if "show_articles" in game_settings:
            if game_settings["show_articles"]:
                info_dict["articles"] = {art: amt for art, amt in self.articles.items() if amt > 0}
        if "show_number" in game_settings:
            if not game_settings["show_number"] and "articles" in info_dict:
                info_dict["articles"] = {art: True for art in info_dict["articles"].keys()} 

        return(info_dict)
    
    @property
    def portfolio_value(self):
        value = self.cash
        for article, amount in self.articles.items():
            res = WikiAPI.normalized_views(article)
            if res is not None:
                this_price = res[-1]["views"]
                value += this_price * amount
        return(value)
    
    def update_value_history(self):
        """
        Update the player's value history in the MongoDB (should only be run by the scheduled task).
        Let's try to make as few API calls as possible!
        Returns an int and a bool -- how many times the wiki api was called and if the value changed.
        """
        if len(self.value_history) == 0: # Should always have at least one!
            this_value = {"timestamp": today_wiki(), "value": self.portfolio_value}
            # Don't call self.portfolio_value unless it's needed -- I don't want to make unnecessary API calls
            players_db[self.game_id].update_one({"player_id": self.player_id}, 
                                                {"$push": {"value_history": this_value}})
            return(len(self.articles), True) # For debugging purposes
        elif self.value_history[-1]["timestamp"].timestamp() < today_wiki().timestamp():
            this_value = {"timestamp": today_wiki(), "value": self.portfolio_value}
            players_db[self.game_id].update_one({"player_id": self.player_id}, 
                                                {"$push": {"value_history": this_value}}) 
            return(len(self.articles), self.value_history[-1]["value"] != this_value["value"]) # For debugging purposes
        else:
            return(False, False) # For debugging purposes
        

    def leave_game(self):
        """Remove the player from the game (called by leave_game and kick_player methods!)."""

        # Remove the player from the game's players list and user_ids list
        active_games_coll.update_one({"game_id": self.game_id}, {"$pull": {"players": self.name}})
        active_games_coll.update_one({"game_id": self.game_id}, {"$pull": {"user_ids": self.user_id}})

        # Remove the game from the user's joined_games list
        active_users_coll.update_one({"user_id": self.user_id}, {"$pull": {"joined_games": self.game_id}})

        # Add the game to the user's old_games list
        active_users_coll.update_one({"user_id": self.user_id}, {"$push": {"old_games": self.game_id}})

        # Remove the player from the MongoDB
        players_db[self.game_id].delete_one({"player_id": self.player_id})

    @property
    def yesterday_value(self):
        """Return the value of the player's portfolio yesterday."""
        yesterday = today_wiki() - timedelta(days=1)
        for value in reversed(self.value_history):
            if value["timestamp"].timestamp() == yesterday.timestamp():
                return(value["value"])
        # Return second to last value or first value if yesterday's value doesn't exist exactly
        return(self.value_history[-2]["value"] if len(self.value_history) > 1 else self.value_history[0]["value"])
    
    @property
    def last_week_value(self):
        """Return the value of the player's portfolio last week."""
        last_week = today_wiki() - timedelta(days=7)
        for value in reversed(self.value_history):
            if value["timestamp"].timestamp() <= last_week.timestamp():
                # I want to eventually phase out the <= for == here :)
                return(value["value"])
        return(self.value_history[0]["value"]) # Return first value
    
    @classmethod
    def get_by_user_id(cls, game_id, user_id):
        data = players_db[game_id].find_one({"user_id": user_id})
        if data is not None:
            data.pop("_id", None) # Remove the MongoDB _id field
            return cls(**data)

    @classmethod
    def get_by_player_id(cls, game_id, player_id):
        data = players_db[game_id].find_one({"player_id": player_id})
        if data is not None:
            data.pop("_id", None) # Remove the MongoDB _id field
            return cls(**data)
        
    @classmethod
    def get_by_player_name(cls, game_id, player_name):
        data = players_db[game_id].find({"name": player_name})
        if data is not None and data.count() > 0:
            data = data[0]
            data.pop("_id", None) # Remove the MongoDB _id field
            return cls(**data)
        else:
            return None

    @classmethod
    def join_game(cls, user_id, game_id):
        game = Game.get_by_game_id(game_id)
        user = User.get_by_user_id(user_id)

        # Check if game exists and if user is allowed to join
        if game is None:
            return(False)
        if user_id in game.user_ids:
            return(False)
        
        # Give the player a unique ID
        player_id = "player_" + uuid.uuid4().hex

        # Update the game
        # Use this rather than Game.update_game() to avoid concurrency issues
        active_games_coll.update_one({"game_id": game_id}, 
                                     {"$push": {"user_ids": user_id,
                                                "players": user.name}})

        # Update the user
        # Use this rather than User.update_user() to avoid concurrency issues
        active_users_coll.update_one({"user_id": user_id}, {"$push": {"joined_games": game_id}})

        # Create the player and upload it to the MongoDB
        players_db[game_id].insert_one({
            "player_id": player_id,
            "user_id": user_id,
            "game_id": game_id,
            "name": user.name,
            "cash": game.settings["starting_cash"],
            "articles": {},
            "avg_price": {},
            "transactions": [],
            "value_history": [
                {"timestamp": today_wiki(), "value": game.settings["starting_cash"]}
            ]
        })
        return(player_id)
            
class Transaction():
    def __init__(self, tx_id, game_id, player_id, article_id, price, quantity, timestamp):
        self.tx_id = tx_id
        self.game_id = game_id
        self.player_id = player_id
        self.article_id = article_id
        self.price = price
        self.quantity = quantity
        self.timestamp = timestamp

    def update_transaction(self):
        """Update the transaction in the MongoDB (shouldn't really be needed)."""
        active_games_coll.update_one({"_id": self._id}, {"$set": self.__dict__})

    @classmethod
    def get_by_tx_id(cls, game_id, tx_id):
        data = transactions_db[game_id].find_one({"tx_id": tx_id})
        if data is not None:
            data.pop("_id", None) # Remove the MongoDB _id field
            return cls(**data)

    @classmethod
    def new_transaction(self, game_id, player_id, article, price, quantity):
        game = Game.get_by_game_id(game_id) # Not sure if this is needed
        player = Player.get_by_player_id(game_id, player_id)

        # Verify the transaction (not the details but if it's possible)
        # Check if the player has enough cash
        current_quantity = player.articles[article] if article in player.articles else 0

        # Whoops! All the types are wrong! Maybe?
        player.cash = float(player.cash) # This won't update the actual player object/DB?
        price = float(price)
        quantity = int(quantity)

        if player.cash + price < 0:
            return(False)
        # Check if the player has enough articles
        if current_quantity + quantity < 0:
            return(False)
        
        # Give the transaction a unique ID
        tx_id = "tx_" + uuid.uuid4().hex

        # Calculate the new average price
        new_quantity = current_quantity + quantity
        current_avg = player.avg_price[article] if article in player.avg_price else 0

        # oh! don't multiply price by quantity since price isn't per unit :)
        if new_quantity == 0:
            new_avg_price = 0 # hopefully this math is okay for if they rebuy?
        elif quantity > 0: # buying
            new_avg_price = ((current_quantity * current_avg) + (price * -1 )) / new_quantity
        elif quantity < 0: # selling
            new_avg_price = ((current_quantity * current_avg) - (price)) / new_quantity
        else:
            new_avg_price = current_avg

        # Updating the game's transactions
        # Use this rather than Game.update_game() to avoid concurrency issues
        active_games_coll.update_one({"game_id": game_id}, {"$push": {"transactions": tx_id}})
        
        # Updating the player's transactions, cash, and articles
        players_db[game_id].update_one({"player_id": player_id},
            update = {"$inc": {"cash": price},
                      "$push": {"transactions": tx_id},
                      "$set": {f"articles.{article}": new_quantity, 
                               f"avg_price.{article}": new_avg_price}},
        )

        # Saving the transaction to the transactions collection for the game
        transactions_db[game_id].insert_one({
            "tx_id": tx_id,
            "player_id": player_id,
            "article_id": article,
            "price": price,
            "quantity": quantity,
            "timestamp": datetime.now(timezone.utc),
        })
        return(tx_id)

class Chat():
    def __init__(self, chat_id, user_id, name, message, timestamp, game_id=None, deleted=False):
        self.chat_id = chat_id
        self.game_id = game_id # Whoops a lot of messages don't have this
        self.user_id = user_id
        self.name = name
        self.message = message
        self.timestamp = timestamp
        self.deleted = deleted

    @classmethod
    def delete_chat(cls, game_id, chat_id):
        """Delete a chat from the game."""
        # Update the chat in the chats collection
        chats_db[game_id].update_one({"chat_id": chat_id}, {"$set": {"deleted": True}})
        # Remove the chat from the game's chats list
        active_games_coll.update_one({"game_id": game_id}, {"$pull": {"chats": chat_id}})

    @classmethod
    def get_by_chat_id(cls, game_id, chat_id):
        data = chats_db[game_id].find_one({"chat_id": chat_id})
        if data is not None:
            data.pop("_id", None) # Remove the MongoDB _id field
            return cls(**data)

    @classmethod
    def send_chat(self, game_id, user_id, message, name=None):
        # Give the chat a unique ID
        chat_id = "chat_" + uuid.uuid4().hex

        # Update the game's chats
        active_games_coll.update_one({"game_id": game_id}, {"$push": {"chats": chat_id}})
        
        # Saving the chat to the chats collection for the game
        chats_db[game_id].insert_one({
            "chat_id": chat_id,
            "user_id": user_id,
            # so that non-player system messages can be sent (user_id will be game_id)
            "name": User.get_by_user_id(user_id).name if name is None else name,
            "message": message,
            "timestamp": datetime.now(timezone.utc),
            "game_id": game_id,
            "deleted": False,
        })
        return(chat_id)
    
    