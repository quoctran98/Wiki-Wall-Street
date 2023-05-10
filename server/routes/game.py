import requests
import json
from flask import Flask, request, Blueprint, render_template, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from pymongo import MongoClient

from server.helper import settings, cache, active_games_coll
from server.models import User, Game, Player, Transaction

import server.WikiAPI as WikiAPI

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
        # if elses just in case (backwards compatibility? probably not)
        "starting_cash": float(request.form["starting_cash"]) if "starting_cash" in request.form else 100000,
        "show_cash": True if "show_cash" in request.form else False,
        "show_articles": True if "show_articles" in request.form else False,
        "show_number": True if "show_number" in request.form else False,
    }
    new_game_id = Game.create_game(request.form["game_name"], 
                                   current_user.user_id, 
                                   game_settings,
                                   True if "public_game" in request.form else False)
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

    # Verifying that transaction details are correct
    

    # Transaction method will verify that user can make this transaction
    new_tx = Transaction.new_transaction(tx_data["game_id"], 
                                         tx_data["player_id"], 
                                         tx_data["article"], 
                                         float(tx_data["price"]),
                                         int(tx_data["quantity"]))
    
    # return success message and no content
    return(jsonify({"transaction": vars(new_tx)}))
    

@game.route("/api/get_games")
@login_required
def get_games():
    games = []
    for game_id in current_user.joined_games:
        this_game = Game.get_by_game_id(game_id)
        if not this_game is None:
            games.append(vars(this_game))
    return(jsonify({"games": games}))

@game.route("/api/get_public_games")
@login_required
def get_public_games():
    games = []
    for pub_game in active_games_coll.find({"public": True}):
        this_game = Game.get_by_game_id(pub_game["game_id"])
        if not this_game is None and not current_user.user_id in this_game.user_ids:
            games.append(vars(this_game))
    return(jsonify({"games": games}))

@game.route("/api/get_play_info", methods=["POST"])
@login_required
def get_play_info():
    # This should only be called by the player themselves
    game_id = request.json["game_id"]
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    if this_game is None:
        return(jsonify({"error": "Game not found."}))
    return(jsonify({"game": vars(this_game),
                    "player": vars(this_player)}))

@game.route("/api/portfolio_value")
@login_required
@cache.cached(timeout=300, query_string=True) # this should only change once a day
def portfolio_value():
    game_id = request.args.get("game_id")
    player_id = request.args.get("player_id")
    this_player = Player.get_by_player_id(game_id, player_id)
    return(jsonify({"value": this_player.portfolio_value}))

@game.route("/api/leaderboard")
@login_required
@cache.cached(timeout=300, query_string=True) # this should only change once a day
def leaderboard():
    game_id = request.args.get("game_id")
    game = Game.get_by_game_id(game_id)

    players = []
    for user_id in game.user_ids:
        player = Player.get_by_user_id(game_id, user_id)
        players.append(player.get_public_dict())
    players.sort(key=lambda x: x["value"], reverse=True)
    return(jsonify({"players": players}))
