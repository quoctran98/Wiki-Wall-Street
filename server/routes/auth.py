from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from pymongo import MongoClient

from server.helper import settings
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

    # Check if user exists and password is correct
    # Use the method from User class to check the password
    if user is not None and user.check_password(password):
        login_user(user, remember=remember)
        if next_url is not "":
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

    # This is added by the JS on the frontend
    # I cannot believe that this works -- this whole thing is so cobbled together
    next_url = request.form.get("next")

    if User.singup(email, name, password):
        return(redirect(url_for("auth.login", next=next_url)))
    else:
        flash("Email address already exists")
        return(redirect(url_for("auth.signup")))

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return(redirect(url_for("main.index")))
