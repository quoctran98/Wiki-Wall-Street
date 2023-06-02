from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from flask_mail import Message
import json
import uuid

from server.helper import settings, mail, cache, OUTGOING_EMAILS
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
        flash("Old password is incorrect", "alert-danger")
        return(redirect(url_for("admin.account")))
    # Check if the new password matches the confirm password
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirmation")
    if new_password != confirm_password:
        flash("New password does not match confirm password", "alert-danger")
        return(redirect(url_for("admin.account")))
    # Change the password
    current_user.set_password(new_password)
    flash("Password changed successfully", "alert-primary")
    return(redirect(url_for("admin.account")))

# @admin.route("/api/change_email", methods=["POST"])
# @login_required
# def change_email():
#     new_email = request.form.get("new_email")

@admin.route("/forgot_password")
def forgot_password():
    return(render_template("forgot-password.html"))

@admin.route("/api/forgot_password", methods=["POST"])
def forgot_password_post():
    email = request.form.get("email")
    user = User.get_by_email(email)
    if not user:
        flash("Email does not exist", "alert-danger")
        return(redirect(url_for("admin.forgot_password")))
    
    # Generate a reset token and add it to the user's document
    reset_token = str(uuid.uuid4())
    user.set_reset_token(reset_token)
    reset_link = f"{settings.SERVER_URL}/reset_password?token={reset_token}"

    # Send the reset email
    msg = Message(subject="Reset your Wiki Wall Street password", 
                  sender=OUTGOING_EMAILS["default"], 
                  recipients=[email])
    msg.text = render_template("emails/reset-password.txt", user=user, reset_link=reset_link)
    msg.html = render_template("emails/reset-password.html", user=user, reset_link=reset_link)
    mail.send(msg)

    flash("An email with a reset link has been sent to your email address", "alert-primary")
    return(redirect(url_for("auth.login")))

@admin.route("/reset_password")
def reset_password():
    token = request.args.get("token")
    user = User.get_by_reset_token(token)
    if not user:
        flash("Invalid reset token -- please check your reset link", "alert-danger")
        return(redirect(url_for("auth.login")))
    return(render_template("reset-password.html", token=token, name=user.name))

@admin.route("/api/reset_password", methods=["POST"])
def reset_password_post():
    # Check if the reset token is valid
    token = request.form.get("token")
    user = User.get_by_reset_token(token)
    print(user)
    if not user:
        flash("Invalid reset token -- please check your reset link", "alert-danger")
        return(redirect(url_for("admin.reset_password", token=token)))
    
    # Check if the new password matches the confirm password
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirmation")
    if new_password != confirm_password:
        flash("Passwords do not match", "alert-danger")
        return(redirect(url_for("auth.reset_password", token=token)))

    # Change the password and remove the reset token
    user.set_password(new_password)
    user.set_reset_token(None)
    flash("Password changed successfully", "alert-primary")
    return(redirect(url_for("auth.login")))

@admin.route("/api/leave_game", methods=["POST"])
@login_required
def leave_game():
    game_id = request.form.get("game_id")
    # Don't use the client sent user_id to remove the player (could be malicious)
    game =  Game.get_by_game_id(game_id)
    player = Player.get_by_user_id(game_id, current_user.user_id)
    if not player or not game:
        flash("You are not in this game or the game does not exist", "alert-danger")
        return(redirect(url_for("main.index")))
    if game.owner_id == current_user.user_id:
        flash("You are the owner of this game. Please delete the game instead", "alert-warning")
        return(redirect(url_for("game.play", game_id=game_id)))
    player.leave_game()
    flash("You have left the game", "alert-primary")
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
        flash("Player or game does not exist", "alert-danger")
        return(redirect(url_for("game.play", game_id=game_id)))
    if game.owner_id != current_user.user_id:
        flash("Only the owner of the game can kick players", "alert-warning")
        return(redirect(url_for("game.play", game_id=game_id)))
    player.leave_game()
    flash(f"Player '{player_name}' has been kicked from the game", "alert-primary")
    return(redirect(url_for("game.play", game_id=game_id)))

@admin.route("/api/delete_game", methods=["POST"])
@login_required
def delete_game():
    game_id = request.form.get("game_id")
    game =  Game.get_by_game_id(game_id)
    if not game:
        flash("Game does not exist", "alert-danger")
        return(redirect(url_for("main.index")))
    if game.owner_id != current_user.user_id:
        flash("You are not the owner of this game", "alert-danger")
        return(redirect(url_for("game.play", game_id=game_id)))
    game.delete_game()
    flash(f"{game.name} has been deleted", "alert-primary")
    return(redirect(url_for("main.index")))
