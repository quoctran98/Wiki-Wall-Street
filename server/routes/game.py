import json
from flask import request, Blueprint, render_template, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timezone
import random

from server.helper import settings, cache, active_games_coll, allowed_categories, banned_categories, search_lists, clear_game_caches, today_wiki, log_error
from server.models import Game, Player, Transaction

import server.WikiAPI as WikiAPI

game = Blueprint("game", __name__)

# @game.route("/games")
# @login_required
# def games():
#     return(render_template("games.html", user=current_user))

# Fallback "/play" route for autocomplete / legacy links
@game.route("/play")
@login_required
def play_legacy():
    game_id = request.args.get("game_id")
    return(redirect(url_for("game.play", game_id=game_id)))

@game.route("/play/<game_id>")
@login_required
def play(game_id):
    this_game = Game.get_by_game_id(game_id)
    if this_game is None:
        flash("Game not found", "alert-danger")
        return(redirect(url_for("main.index")))
    if not current_user.user_id in this_game.user_ids:
        flash("You're not in this game -- you must join it first", "alert-danger")
        return(redirect(url_for("main.index")))
    
    # Update the "daily" event in the player's event log
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    this_player.add_event("daily")

    # Don't send any objects yet -- they'll be requested by the client :)
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
            flash("You can't have both a theme AND banned categories", "alert-danger")
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
        flash("Could not create game", "alert-danger")
        return(redirect(url_for("main.index")))
    
@game.route("/api/change_settings", methods=["POST"])
@login_required
def change_settings():
    # Make sure the user is the owner of the game
    game_id = request.form["game_id"]
    this_game = Game.get_by_game_id(game_id)
    if this_game.owner_id != current_user.user_id:
        flash("You can't change the settings of this game", "alert-danger")
        return(redirect(url_for("game.play", game_id=game_id)))
    else:

        # I have to for checkboxes since they don't get sent if they're not checked
        new_game_settings = {
            "views_limit": int(request.form["views_limit"]) if "views_limit" in request.form else this_game.settings["views_limit"],
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
                flash("You can't have both a theme AND banned categories", "alert-danger")
                return(redirect(url_for("game.play", game_id=game_id)))
            
        # There are settings outside of the settings object (like public status)
        other_settings = { # These aren't allowed to be changed usually?
            "public": True if "public_game" in request.form else False,
        }

        res = this_game.change_settings(new_game_settings, other_settings)
        if not res:
            flash("Could not change settings", "alert-danger")
            return(redirect(url_for("game.play", game_id=game_id)))
        else:
            clear_game_caches(game_id)
            flash(f"Settings changed for {this_game.name}", "alert-primary")
            return(redirect(url_for("game.play", game_id=game_id)))
    
@game.route("/api/join_game", methods=["POST"])
@login_required
def join_game():
    success = Player.join_game(current_user.user_id, request.form["game_id"])
    if success:
        this_game = Game.get_by_game_id(request.form["game_id"])
        this_game.add_event("player")
        return(redirect(url_for("game.play", game_id=request.form["game_id"])))
    else:
        flash("Could not join game", "alert-danger")
        return(redirect(url_for("main.index")))

@game.route("/api/new_transaction", methods=["POST"])
@login_required
def new_transaction():
    tx_data = request.data.decode("utf-8")
    tx_data = json.loads(tx_data)
    this_game = Game.get_by_game_id(tx_data["game_id"])

    # Verifying that transaction details are correct
    # Make sure the price is right (I didn't multiply by quantity before, but it didn't break??)
    real_price = WikiAPI.normalized_views(tx_data["article"], end=today_wiki())[-1]["views"] * float(tx_data["quantity"])
    if abs(abs(real_price) - abs(float(tx_data["price"]))) > 1: # Just because of rounding errors (I should fix it)
        
        # This happens a lot -- let's see why?
        bug_message = f"PRICING BUG! YOUR TRANSACTION DIDN'T GO THROUGH! I'M TRYING TO SOLVE IT! PLEASE SEND QUOC A SCREENSHOT OF THIS MESSAGE!"
        real_price_now = WikiAPI.normalized_views(tx_data["article"], end=today_wiki())[-1]["views"]
        real_time_now = WikiAPI.normalized_views(tx_data["article"], end=today_wiki())[-1]["timestamp"]
        real_price_before = WikiAPI.normalized_views(tx_data["article"], end=today_wiki())[-2]["views"]
        real_time_before = WikiAPI.normalized_views(tx_data["article"], end=today_wiki())[-2]["timestamp"]
        bug_message += f"\n\n  SENT | time-ish: {datetime.now(timezone.utc)} | price: {tx_data['price']}"
        bug_message += f"\n\n REAL NOW | time: {real_time_now} | price: {real_price_now}"
        bug_message += f"\n\n REAL -1 | time: {real_time_before} | price: {real_price_before}"
        bug_message += f"\n\n DIFFERENCE | {abs(abs(real_price) - abs(float(tx_data['price'])))}"
        
        # Let's just log it for now but let the transaction go through
        log_error(bug_message)

        # flash(bug_message)
        # return(jsonify({"success": False}))
    
    # Make sure the article is allowed to be bought
    # I guess that you should be allowed to sell anything just in case it dips after you buy it
    if not this_game.allowed_article(tx_data["article"]) and tx_data["quantity"] > 0:
        flash("You can't buy this article", "alert-warning")
        return(jsonify({"success": False}))
    
    bad_article_chars = [".", "'"]
    # Periods (.) make MongoDB think it's a nested object
    # Single quotes (') break the front end :( -- I should have only dealt with article IDs
    for char in bad_article_chars:
        if char in tx_data["article"]:
            flash("You can't buy/sell this article. It has a weird character in it that might break the game. I'm not smart enough to fix it without rewriting a lot of code.", "alert-warning")
            return(jsonify({"success": False}))

    # Transaction method will verify that user can make this transaction
    new_tx = Transaction.new_transaction(tx_data["game_id"], 
                                         tx_data["player_id"], 
                                         tx_data["article"], 
                                         float(tx_data["price"]),
                                         int(tx_data["quantity"]))
    
    if new_tx == False:
        flash("You can't make this transaction", "alert-danger")
        return(jsonify({"success": False}))
    else:
        return(jsonify({"success": True}))
    
@game.route("/api/allowed_article/<game_id>/<article>")
@login_required
def allowed_article(game_id, article):

    # Try to manually use cache 
    # defining a cache key this way allows us to clear it later for this specific game
    cache_key = f"allowed_article:{game_id}:{article}"
    cached_result = cache.get(cache_key)
    if cached_result:
        #print(f"⭐️ {cache_key} found in cache")
        return(cached_result)
    
    this_game = Game.get_by_game_id(game_id)
    allowed, reason =  this_game.allowed_article(article)

    cache.set(cache_key, jsonify({"allowed": allowed, "reason": reason}))
    return(jsonify({"allowed": allowed, "reason": reason}))

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

@game.route("/api/get_play_info/<game_id>")
@login_required
def get_play_info(game_id):
    # This is becoming a big boy of a function
    # This should only be called by the player themselves
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    if this_game is None or this_player is None:
        flash(f"Could not find game id {game_id}", "alert-danger")
        return(jsonify({"error": True}))
    else:
        # Removing transactions and chats from the game object (for speed)
        this_game_props = vars(this_game)
        this_game_props.pop("transactions")
        this_game_props.pop("chats")

        # Getting the player's portfolio value :)
        this_player_props = vars(this_player)
        # Adding the player's portfolio value to the player object
        # so we don't have to calculate it on the front end
        this_player_props["today_value"] = this_player.value_history[-1]["value"]
        this_player_props["yesterday_value"] = this_player.yesterday_value

        # Get random articles to initialize the game
        if request.args.get("get_random_articles") == "true":
            if "allowed_categories" in this_game_props["settings"]:
                if this_game_props["settings"]["allowed_categories"] != [""]:
                    sls_in_game = [cat for cat in this_game_props["settings"]["allowed_categories"] if cat in search_lists]
                    if len(sls_in_game) > 0:
                        random_sl = search_lists[sls_in_game[random.randint(0, len(sls_in_game) - 1)]]
                        random_articles = [random_sl[random.randint(0, len(random_sl) - 1)]]
                    else:
                        random_articles = [x["title"] for x in WikiAPI.random_articles()]
                else:
                    random_articles = [x["title"] for x in WikiAPI.random_articles()]
            else:
                random_articles = [x["title"] for x in WikiAPI.random_articles()]
        else:
            random_articles = []

        return(jsonify({
            "game": this_game_props, 
            "player": this_player_props,
            "random_articles": random_articles
        }))

@game.route("/api/leaderboard/<game_id>")
@login_required
def leaderboard(game_id):
    game = Game.get_by_game_id(game_id)
    players = []
    for user_id in game.user_ids:
        player = Player.get_by_user_id(game_id, user_id)
        players.append(player.get_info())
    # Sort by value so leaderboard is in order for JS
    players.sort(key=lambda x: x["value"], reverse=True)
    return(jsonify({"players": players}))

@game.route("/api/get_invite_info/<game_id>")
def get_invite_info(game_id):
    this_game = Game.get_by_game_id(game_id)
    if this_game is None:
        flash(f"Could not find game id {game_id}", "alert-danger")
        return(jsonify({"error": True}))
    else:
        return(jsonify({"game": vars(this_game)}))
    
@game.route("/api/get_profile_game/<game_id>/<user_name>")
def get_game_info(game_id, user_name):
    this_game = Game.get_by_game_id(game_id)
    this_player = Player.get_by_player_name(game_id, user_name)
    if this_player is None:
        return(jsonify({"error": True}))
    else:
        return_dict = {
            "game": this_game.name,
            "value": this_player.value_history[-1]["value"],
            "date_joined": this_player.value_history[0]["timestamp"],
            "public": this_game.public,
            "joined": False,
        }

        # If user is logged in, we'll add a play button
        if current_user.is_authenticated:
            if current_user.user_id in this_game.user_ids:
                return_dict["joined"] = True

        return(jsonify(return_dict))
    
@game.route("/api/add_event/<game_id>/<event_name>", methods=["POST"])
@login_required
def add_event(game_id, event_name):
    this_game = Game.get_by_game_id(game_id)
    this_game.add_event(event_name)
    return(jsonify({"success": True}))

@game.route("/api/check_event/<game_id>/<event_name>", methods=["POST"])
@login_required
def check_event(game_id, event_name):
    this_player = Player.get_by_user_id(game_id, current_user.user_id)
    this_player.add_event(event_name)
    return(jsonify({"success": True}))
