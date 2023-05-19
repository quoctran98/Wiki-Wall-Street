from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user

from server.helper import settings
from server.models import Player

admin = Blueprint("admin", __name__)

@admin.route("/game/leave_game", methods=["POST"])
@login_required
def leave_game():
    game_id = request.form.get("game_id")
    # Don't use the client sent user_id to remove the player (could be malicious)
    player = Player.get_by_user_id(game_id, current_user.user_id)
    if player:
        player.leave_game()
        return(redirect(url_for("main.index")))
    else:
        flash("You are not in this game")
        return(redirect(url_for("main.index")))
    