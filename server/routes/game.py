import requests
import json
from flask import Flask, request, Blueprint, render_template, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from pymongo import MongoClient

from server.helper import settings, cache
from server.models import User, Game, Player, Transaction

# Functions for the actual game -- we don't really need these in other pages
import server.WikiAPI as WikiAPI

# Connect to MongoDB users database
# I'm doing this for each blueprint because I don't know how to do it in __init__.py
client = MongoClient(settings.MONGODB_CONNECTION_STRING)
users_db = client[settings.USERS_DB_NAME]
active_users_coll = users_db.active_users

game = Blueprint("game", __name__)

@game.route("/games")
@login_required
def games():
    return(render_template("games.html", user=current_user))

@game.route("/play")
@login_required
def play():
    game_id = request.args.get("game_id")
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    if this_game is None:
        flash("Game not found.")
        return(redirect(url_for("main.index")))
    return(render_template("play.html", 
                           game=this_game.get_public_dict(),
                           player=this_player.get_public_dict()))

@game.route("/api/create_game", methods=["POST"])
@login_required
def create_game():
    game_settings = {
        "starting_cash": float(request.form["starting_cash"]),
    }
    new_game_id = Game.create_game(request.form["game_name"], current_user.user_id, game_settings)
    game = Game.get_by_game_id(new_game_id)
    new_player_id = Player.join_game(current_user.user_id, game.game_id)
    player = Player.get_by_player_id(new_game_id, new_player_id)

    # Authentication will be handled by the Game class
    if game:
        return(redirect(url_for("game.play", 
                                game_id=new_game_id)))
    
@game.route("/api/join_game", methods=["POST"])
@login_required
def join_game():
    Player.join_game(current_user.user_id, request.form["game_id"])
    return(redirect(url_for("game.play", 
                            game_id=request.form["game_id"])))

@game.route("/api/new_transaction", methods=["POST"])
@login_required
def new_transaction():
    tx_data = request.data.decode("utf-8")
    tx_data = json.loads(tx_data)
    this_game = Game.get_by_game_id(tx_data["game_id"])
    this_player = Player.get_by_player_id(tx_data["game_id"], tx_data["player_id"])

    # Verifying that transaction details are correct
    

    # Transaction method will verify that user can make this transaction
    new_tx = Transaction.new_transaction(tx_data["game_id"], 
                                         tx_data["player_id"], 
                                         tx_data["article"], 
                                         float(tx_data["price"]),
                                         int(tx_data["quantity"]))
    
    # We need to update this_game and this_player -- this way sucks!
    # Do I need to do this at all?
    this_game = Game.get_by_game_id(tx_data["game_id"])
    this_player = Player.get_by_player_id(tx_data["game_id"], tx_data["player_id"])
    
    # I'm not sure what we're returning here!
    return(jsonify({"game": this_game.get_public_dict(),
                    "player": this_player.get_public_dict()}))
    

@game.route("/api/get_games", methods=["POST"])
@login_required
def get_games():
    games = []
    for game_id in current_user.joined_games:
        this_game = Game.get_by_game_id(game_id)
        if not this_game is None:
            games.append(this_game.get_public_dict())
    return(games)

@game.route("/api/get_play_info", methods=["POST"])
@login_required
def get_play_info():
    game_id = request.json["game_id"]
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    if this_game is None:
        return(jsonify({"error": "Game not found."}))
    return(jsonify({"game": this_game.get_public_dict(),
                    "player": this_player.get_public_dict()}))

@game.route("/api/portfolio_value")
@login_required
@cache.cached(timeout=300, query_string=True) # this should only change once a day
def portfolio_value():
    game_id = request.args.get("game_id")
    player_id = request.args.get("player_id")
    this_player = Player.get_by_player_id(game_id, player_id)
    value = this_player.cash
    for name, quantity in this_player.articles.items():
        normalized_views = WikiAPI.normalized_views(name)
        current_price = normalized_views[-1]["views"] # I should implement a current_price function
        value += quantity * current_price
    return(jsonify({"value": value}))
