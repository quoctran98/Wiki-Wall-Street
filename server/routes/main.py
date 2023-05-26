import requests
from flask import Flask, request, jsonify, Blueprint, render_template, flash, redirect, url_for
from flask_login import login_required, current_user
from pymongo import MongoClient

from server.helper import settings, cache, allowed_categories, banned_categories
from server.models import User, Game, Player, Transaction

main = Blueprint("main", __name__)

@main.route("/")
def index():
    return(render_template("index.html",
                           allowed_categories=allowed_categories.keys(), 
                           banned_categories=banned_categories.keys()))

# @main.route("/robots.txt")
# def robots():
#     return(render_template("robots.txt"))

@main.route("/help")
def help():
    return(render_template("help.html"))

# Fallback "/invite" route for legacy links
@main.route("/invite")
def invite_legacy():
    game_id = request.args.get("game_id")
    return(redirect(url_for("main.invite", game_id=game_id)))

@main.route("/invite/<game_id>")
def invite(game_id):
    game = Game.get_by_game_id(game_id)
    custom_og = {
        "title": f"Join my {game.name} Wiki Wall Street Game!",
    }
    return(render_template("invite.html", custom_og=custom_og))

@main.route("/profile/<name>")
def profile(name):
    name = name.replace("%20", " ")
    user = User.get_by_name(name)
    if user is None:
        flash("User not found")
        return(render_template("index.html",
                                 allowed_categories=allowed_categories.keys(), 
                                 banned_categories=banned_categories.keys()))
    return(render_template("profile.html", user=user.get_profile()))

@main.route("/api/get_users_games/<name>")
def get_users_games(name):
    name = name.replace("%20", " ")
    user = User.get_by_name(name)
    if user is None:
        return({"error": "User not found"})
    # public_joined_games = []
    # for game_id in user.joined_games:
    #     game = Game.get_by_game_id(game_id)
    #     if game is not None and game.public:
    #         public_joined_games.append(game.game_id)
    # return({"games": public_joined_games})
    return({"games": user.joined_games})
