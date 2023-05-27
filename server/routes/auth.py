from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from pymongo import MongoClient

from server.helper import settings, username_is_valid
from server.models import User

auth = Blueprint("auth", __name__)

@auth.route("/login")
def login():
    return(render_template("login.html"))

@auth.route("/login", methods=["POST"])
def login_post():
    email = request.form.get("email")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    # Get user from database by email
    user = User.get_by_email(email)

    # This is such a bad hack :( but it's fine!
    next_url = request.form.get("next")

    if user is None:
        flash("Email address isn't signed up")
        return(redirect(url_for("auth.login")))
    if not user.check_password(password):
        flash("Password is incorrect")
        return(redirect(url_for("auth.login")))

    # Redundant but let's play it safe
    if user is not None and user.check_password(password):
        login_user(user, remember=remember)
        if next_url != "":
            return(redirect(next_url))
        else:
            return(redirect(url_for("main.index")))
    else:
        flash("Please check your login details and try again.")
        return(redirect(url_for("auth.login")))

@auth.route("/signup")
def signup():
    return(render_template("signup.html"))

@auth.route("/signup", methods=["POST"])
def signup_post():
    email = request.form.get("email")
    name = request.form.get("name")
    password = request.form.get("password")

    # Make sure username is valid and hasn't been taken
    if not username_is_valid(name):
        flash("Please enter a valid username (only letters, numbers, -, and _)")
        return(redirect(url_for("auth.signup")))
    if User.get_by_name(name) is not None:
        flash("Username already taken, please choose another (sorry this isn't handled better)")
        return(redirect(url_for("auth.signup")))
    # Make sure the passowrds match
    if request.form.get("password") != request.form.get("confirmation"):
        flash("Passwords do not match")
        return(redirect(url_for("auth.signup")))

    # This is added by the JS on the frontend
    # I cannot believe that this works -- this whole thing is so cobbled together
    next_url = request.form.get("next")

    if User.singup(email, name, password):
        return(redirect(url_for("auth.login", next=next_url)))
    else:
        flash("Email address already exists")
        return(redirect(url_for("auth.signup")))

@auth.route("/forgot")
def forgot():
    return(render_template("forgot.html"))

@auth.route("/forgot", methods=["POST"])
def forgot_post():
    email = request.form.get("email")

@auth.route("/reset")
def reset():
    return(render_template("reset.html"))

@auth.route("/reset", methods=["POST"])
def reset_post():
    email = request.form.get("email")
    password = request.form.get("password")

@auth.route("/change_password")
@login_required
def change_password():
    return(render_template("change_password.html"))

@auth.route("/change_password", methods=["POST"])
@login_required
def change_password_post():
    old_password = request.form.get("old_password")
    new_password = request.form.get("new_password")
    return(redirect(url_for("main.index")))

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return(redirect(url_for("main.index")))
