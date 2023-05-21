import json
from flask import request, Blueprint, render_template, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timezone

from server.helper import settings, cache, active_games_coll, sanitize, allowed_categories, banned_categories
from server.models import Game, Player, Transaction

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
    if this_game is None:
        flash("Game not found.")
        return(redirect(url_for("main.index")))
    if not current_user.user_id in this_game.user_ids:
        flash("You're not in this game. You must join it first.")
        return(redirect(url_for("main.index")))
    # Don't send any objects yet -- they'll be requested by the client (current_user)
    return(render_template("play.html", allowed_categories=allowed_categories, banned_categories=banned_categories, user=current_user))

@game.route("/api/create_game", methods=["POST"])
@login_required
def create_game():

    # DON'T unpack the categories here -- it's done in the helper :)
    this_allowed_categories = []
    if "allowed_categories" in request.form:
        this_allowed_categories = request.form.getlist("allowed_categories")
    this_banned_categories = []
    if "banned_categories" in request.form:
        this_banned_categories = request.form.getlist("banned_categories")

    # Make sure there's no overlap
    if len(this_allowed_categories) > 0 and len(this_banned_categories) > 0:
        flash("You can't have both allowed and banned categories.")
        return(redirect(url_for("main.index")))

    # I should have GameSettings a class :)
    game_settings = {
        # if-elses just in case (backwards compatibility? probably not)
        "starting_cash": float(request.form["starting_cash"]) if "starting_cash" in request.form else 100000,
        "views_limit": int(request.form["views_limit"]) if "views_limit" in request.form else 10,
        "show_cash": True if "show_cash" in request.form else False,
        "show_articles": True if "show_articles" in request.form else False,
        "show_number": True if "show_number" in request.form else False,
        "allowed_categories": this_allowed_categories,
        "banned_categories": this_banned_categories,
    }

    # Make sure only one of these is there (one category can / must have empty string)
    if "allowed_categories" in game_settings and "banned_categories" in game_settings:
        no_allowed = all([x == "" for x in game_settings["allowed_categories"]])
        no_banned = all([x == "" for x in game_settings["banned_categories"]])
        if not (no_allowed or no_banned):
            flash("You can't have both a theme AND banned categories.")
            return(redirect(url_for("main.index")))

    new_game_id = Game.create_game(request.form["game_name"], # don't want to sanitize this for now :)
                                   current_user.user_id, 
                                   game_settings,
                                   True if "public_game" in request.form else False)
    game = Game.get_by_game_id(new_game_id)
    # Add the owner to the game
    Player.join_game(current_user.user_id, game.game_id)
    # Authentication will be handled by the Game class
    if game:
        return(redirect(url_for("game.play", game_id=new_game_id)))
    else:
        flash("Could not create game.")
        return(redirect(url_for("main.index")))
    
@game.route("/api/change_settings", methods=["POST"])
@login_required
def change_settings():
    # Make sure the user is the owner of the game
    game_id = request.form["game_id"]
    this_game = Game.get_by_game_id(game_id)
    if this_game.owner_id != current_user.user_id:
        flash("You can't change the settings of this game.")
        return(redirect(url_for("game.play", game_id=game_id)))
    else:

        # I have to for checkboxes since they don't get sent if they're not checked
        new_game_settings = {
            "show_cash": True if "show_cash" in request.form else False,
            "show_articles": True if "show_articles" in request.form else False,
            "show_number": True if "show_number" in request.form else False,
        }

        # Add the categories if they're there -- we have to do all this manually ugh
        if "allowed_categories" in request.form:
            new_game_settings["allowed_categories"] = request.form.getlist("allowed_categories")
        if "banned_categories" in request.form:
            new_game_settings["banned_categories"] = request.form.getlist("banned_categories")

        # Make sure only one of these is there (one category can / must have empty string)
        if "allowed_categories" in new_game_settings and "banned_categories" in new_game_settings:
            no_allowed = all([x == "" for x in new_game_settings["allowed_categories"]])
            no_banned = all([x == "" for x in new_game_settings["banned_categories"]])
            if not (no_allowed or no_banned):
                flash("You can't have both a theme AND banned categories.")
                return(redirect(url_for("game.play", game_id=game_id)))

        this_game.change_settings(new_game_settings) # This will only change what's been changed :)
        return(redirect(url_for("game.play", game_id=game_id)))
    
@game.route("/api/join_game", methods=["POST"])
@login_required
def join_game():
    success = Player.join_game(current_user.user_id, request.form["game_id"])
    if success:
        return(redirect(url_for("game.play", game_id=request.form["game_id"])))
    else:
        flash("Could not join game.")
        return(redirect(url_for("main.index")))

@game.route("/api/new_transaction", methods=["POST"])
@login_required
def new_transaction():
    tx_data = request.data.decode("utf-8")
    tx_data = json.loads(tx_data)
    this_game = Game.get_by_game_id(tx_data["game_id"])

    # Verifying that transaction details are correct
    # Make sure the price is right (I didn't multiply by quantity before, but it didn't break??)
    real_price = WikiAPI.normalized_views(tx_data["article"])[-1]["views"] * float(tx_data["quantity"])
    if abs(abs(real_price) - abs(float(tx_data["price"]))) > 1: # Just because of rounding errors (I should fix it)
        
        # This happens a lot -- let's see why?
        bug_message = f"PRICING BUG! YOUR TRANSACTION DIDN'T GO THROUGH! I'M TRYING TO SOLVE IT! PLEASE SEND QUOC A SCREENSHOT OF THIS MESSAGE!"
        real_price_now = WikiAPI.normalized_views(tx_data["article"])[-1]["views"]
        real_time_now = WikiAPI.normalized_views(tx_data["article"])[-1]["timestamp"]
        real_price_before = WikiAPI.normalized_views(tx_data["article"])[-2]["views"]
        real_time_before = WikiAPI.normalized_views(tx_data["article"])[-2]["timestamp"]
        bug_message += f"\n\n  SENT | time-ish: {datetime.now(timezone.utc)} | price: {tx_data['price']}"
        bug_message += f"\n\n REAL NOW | time: {real_time_now} | price: {real_price_now}"
        bug_message += f"\n\n REAL -1 | time: {real_time_before} | price: {real_price_before}"
        bug_message += f"\n\n DIFFERENCE | {abs(abs(real_price) - abs(float(tx_data['price'])))}"
        flash(bug_message)
        return(jsonify({"success": False}))
    
    # Make sure the article is allowed to be bought
    # I guess that you should be allowed to sell anything just in case it dips after you buy it
    if not this_game.allowed_article(tx_data["article"]) and tx_data["quantity"] > 0:
        flash("You can't buy this article.")
        return(jsonify({"success": False}))
    
    bad_article_chars = [".", "'"]
    # Periods (.) make MongoDB think it's a nested object
    # Single quotes (') break the front end :( -- I should have only dealt with article IDs
    for char in bad_article_chars:
        if char in tx_data["article"]:
            flash("You can't buy/sell this article. It has a weird character in it that might break the game. I'm not smart enough to fix it without rewriting a lot of code.")
            return(jsonify({"success": False}))

    # Transaction method will verify that user can make this transaction
    new_tx = Transaction.new_transaction(tx_data["game_id"], 
                                         tx_data["player_id"], 
                                         tx_data["article"], 
                                         float(tx_data["price"]),
                                         int(tx_data["quantity"]))
    
    if new_tx == False:
        flash("You can't make this transaction.")
        return(jsonify({"success": False}))
    else:
        return(jsonify({"success": True}))
    
@game.route("/api/allowed_article")
@login_required
@cache.cached(timeout=300, query_string=True)
def allowed_article():
    game_id = request.args.get("game_id")
    article = request.args.get("article")
    this_game = Game.get_by_game_id(game_id)
    return(jsonify({"allowed": this_game.allowed_article(article)}))

@game.route("/api/get_joined_games")
@login_required
def get_joined_games():
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

@game.route("/api/get_play_info")
@login_required
# Don't cache! This is used for a lot of things that should be real-time-ish
# Kind of a monolith of a route, but it's fine :)
def get_play_info():
    # This should only be called by the player themselves
    game_id = request.args.get("game_id")
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    if this_game is None or this_player is None:
        flash("Could not find game!")
        return(jsonify({"error": True}))
    else:
        # Removing transactions and chats from the game object
        # To speed up data transfer I hope?
        this_game_props = vars(this_game)
        this_game_props.pop("transactions")
        this_game_props.pop("chats")

        # Getting the player's portfolio value :)
        # (@property not included in vars(), so I have to do this)
        this_player_props = vars(this_player)
        this_player_props["today_value"] = this_player.portfolio_value
        this_player_props["yesterday_value"] = this_player.yesterday_value

        return(jsonify({"game": this_game_props, "player": this_player_props}))

@game.route("/api/leaderboard")
@login_required
@cache.cached(timeout=300, query_string=True)
def leaderboard():
    game_id = request.args.get("game_id")
    game = Game.get_by_game_id(game_id)
    players = []
    for user_id in game.user_ids:
        player = Player.get_by_user_id(game_id, user_id)
        players.append(player.get_public_dict())
    # Sort by value so leaderboard is in order for JS
    players.sort(key=lambda x: x["value"], reverse=True)
    return(jsonify({"players": players}))

@game.route("/api/get_invite_info")
def get_invite_info():
    game_id = request.args.get("game_id")
    this_game = Game.get_by_game_id(game_id)
    if this_game is None:
        flash("Could not find game!")
        return(jsonify({"error": True}))
    else:
        return(jsonify({"game": vars(this_game)}))