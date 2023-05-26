from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
import json

from server.helper import settings, cache
from server.models import Player, Game, User

admin = Blueprint("admin", __name__)

@admin.route("/account")
@login_required
def account():
    return(render_template("account.html", user=current_user))

@admin.route("/api/change_password", methods=["POST"])
@login_required
def change_password():
    # Check if the old password is correct
    old_password = request.form.get("old_password")
    if not current_user.check_password(old_password):
        flash("Old password is incorrect")
        return(redirect(url_for("admin.account")))
    # Check if the new password matches the confirm password
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirmation")
    if new_password != confirm_password:
        flash("New password does not match confirm password")
        return(redirect(url_for("admin.account")))
    # Change the password
    current_user.set_password(new_password)
    flash("Password changed successfully")
    return(redirect(url_for("admin.account")))

@admin.route("/api/forgot_password", methods=["POST"])
def forgot_password():
    email = request.form.get("email")
    user = User.get_by_email(email)
    if not user:
        flash("Email does not exist")
        return(redirect(url_for("auth.login")))
    user.send_reset_email()
    flash("Reset email sent")
    return(redirect(url_for("auth.login")))

@admin.route("/api/leave_game", methods=["POST"])
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

@admin.route("/api/kick_player", methods=["POST"])
@login_required
def kick_player():
    game_id = request.form.get("game_id")
    # Sucks that we have to use the name instead of the user_id
    player_name = request.form.get("player_name")
    game =  Game.get_by_game_id(game_id)
    player = Player.get_by_player_name(game_id, player_name)
    if not player or not game:
        flash("Player or game does not exist (or there are duplicate names)")
        return(redirect(url_for("game.play", game_id=game_id)))
    if game.owner_id != current_user.user_id:
        flash("Only the owner of the game can kick players")
        return(redirect(url_for("game.play", game_id=game_id)))
    player.leave_game()
    flash(f"Player '{player_name}' has been kicked from the game")
    return(redirect(url_for("game.play", game_id=game_id)))

@admin.route("/api/delete_game", methods=["POST"])
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
