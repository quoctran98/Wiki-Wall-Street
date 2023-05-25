import requests
from flask import Flask, request, jsonify, Blueprint, render_template, flash
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

@main.route("/help")
def help():
    return(render_template("help.html"))

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
    return({"games": user.joined_games})
