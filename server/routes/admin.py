from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user

from server.helper import settings
from server.models import Player, Game

admin = Blueprint("admin", __name__)

@admin.route("/game/leave_game", methods=["POST"])
@login_required
def leave_game():
    game_id = request.form.get("game_id")
    # Don't use the client sent user_id to remove the player (could be malicious)
    game =  Game.get_by_game_id(game_id)
    player = Player.get_by_user_id(game_id, current_user.user_id)
    if not player or not game:
        flash("You are not in this game or the game does not exist")
        return(redirect(url_for("main.index")))
    if game.owner_id == current_user.user_id:
        flash("You are the owner of this game. Please delete the game instead")
        return(redirect(url_for("game.play", game_id=game_id)))
    player.leave_game()
    flash("You have left the game")
    return(redirect(url_for("main.index")))

@admin.route("/game/delete_game", methods=["POST"])
@login_required
def delete_game():
    game_id = request.form.get("game_id")
    game =  Game.get_by_game_id(game_id)
    if not game:
        flash("Game does not exist")
        return(redirect(url_for("main.index")))
    if game.owner_id != current_user.user_id:
        flash("You are not the owner of this game")
        return(redirect(url_for("game.play", game_id=game_id)))
    game.delete_game()
    flash("Game deleted")
    return(redirect(url_for("main.index")))
