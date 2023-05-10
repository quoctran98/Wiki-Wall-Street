from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import datetime

from server.helper import settings, active_users_coll, active_games_coll, transactions_db, players_db

from server import WikiAPI

class User(UserMixin):
    def __init__(self, name, email, password, signup_time, joined_games, user_id=None):
        # We're ignoring MongoDB's document _id field and using our own UUID
        self.name = name
        self.email = email
        self.password = password
        self.signup_time = signup_time
        self.joined_games = joined_games
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
                "signup_time": datetime.datetime.now(),
                "joined_games": [],
                "user_id": user_id
            })
            return(True)
        return(False)

class Game():
    def __init__(self, game_id, name, owner_id, user_ids, settings, players, transactions, public=False):
        self.game_id = game_id
        self.name = name
        self.owner_id = owner_id
        self.user_ids = user_ids
        self.settings = settings
        self.players = players
        self.transactions = transactions
        self.public = public # Default is False in __init__ for backwards compatibility

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
        })

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
            "public": public,
        })
        return(game_id)
    
class Player():
    def __init__(self, player_id, user_id, game_id, name, cash, articles, avg_price, transactions):
        self.player_id = player_id
        self.user_id = user_id
        self.game_id = game_id
        self.name = name
        self.cash = cash
        self.articles = articles
        self.avg_price = avg_price
        self.transactions = transactions

    def update_player(self):
        """Update the player in the MongoDB."""
        players_db[self.game_id].update_one({"player_id": self.player_id}, {"$set": self.__dict__})

    def get_public_dict(self):
        """Return a dictionary with only the public information about the player."""
        game_settings = Game.get_by_game_id(self.game_id).settings
        public_dict = {
            "player_id": self.player_id,
            "user_id": self.user_id,
            "game_id": self.game_id,
            "name": self.name,

            "value": self.portfolio_value,
        }

        # some games don't have these attributes though (ugh!)
        # check if they exist first

        if "show_cash" in game_settings:
            if game_settings["show_cash"]:
                public_dict["cash"] = self.cash
        if "show_articles" in game_settings:
            if game_settings["show_articles"]:
                public_dict["articles"] = {article: True for article in self.articles if self.articles[article] > 0}
        if "show_number" in game_settings:
            if game_settings["show_number"]:
                public_dict["articles"] = self.articles # Overwrite the above if show_number is True
        return(public_dict)


    @property
    def portfolio_value(self):
        value = self.cash
        for article, amount in self.articles.items():
            res = WikiAPI.normalized_views(article)
            if res is not None:
                this_price = res[-1]["views"]
                value += this_price * amount
        return(value)
    
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
            "timestamp": datetime.datetime.now(),
        })
        return(tx_id)
