import requests
from flask import Flask, request, jsonify, Blueprint, render_template
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

@main.route("/profile")
@login_required
def profile():
    return(render_template("profile.html", name=current_user.name))

@main.route("/help")
def help():
    return(render_template("help.html"))

@main.route("/invite")
def invite():
    return(render_template("invite.html"))
