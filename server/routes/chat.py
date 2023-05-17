import json
from flask import Flask, request, Blueprint, render_template, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from pymongo import MongoClient

from server.helper import settings, cache, active_games_coll, chats_db
from server.models import User, Game, Player, Transaction, Chat

import server.WikiAPI as WikiAPI

chat = Blueprint("chat", __name__)

@chat.route("/api/see_chat")
@login_required
def see_chat():
    game_id = request.args.get("game_id")
    this_game = Game.get_by_game_id(game_id)
    if this_game is None:
        return(jsonify({"error": "Game not found."}))
    if not current_user.user_id in this_game.user_ids:
        return(jsonify({"error": "You're not in this game. You must join it first."}))
    # Get the chat collection for this game
    chat_coll = chats_db[this_game.game_id]
    # Get the chat messages and sort them :)
    chat_messages = chat_coll.find().sort("timestamp", -1).limit(100)
    chat_messages = list(chat_messages)[::-1]
    chat_messages = [{"name": m["name"], 
                      "message": m["message"], 
                      "timestamp": m["timestamp"].strftime("%Y-%m-%d %H:%M:%S")} for m in chat_messages]
    # Turn the list of dicts into a way to send to the client
    return(jsonify({"messages": chat_messages}))

@chat.route("/api/send_chat", methods=["POST"])
@login_required
def send_chat():
    game_id = request.form["game_id"]
    this_game = Game.get_by_game_id(game_id)
    if this_game is None:
        return(jsonify({"error": "Game not found."}))
    if not current_user.user_id in this_game.user_ids:
        return(jsonify({"error": "You're not in this game. You must join it first."}))
    chat_id = Chat.send_chat(game_id, current_user.user_id, request.form["message"])
    return(jsonify({"chat_id": chat_id}))
