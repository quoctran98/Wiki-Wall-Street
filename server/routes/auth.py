from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from flask_mail import Message
from pymongo import MongoClient

from server.helper import settings, mail, OUTGOING_EMAILS, username_is_valid
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
        flash("This email address isn't signed up!", "alert-danger")
        return(redirect(url_for("auth.login")))
    if not user.check_password(password):
        flash("Your password is incorrect", "alert-danger")
        return(redirect(url_for("auth.login")))

    # Redundant but let's play it safe
    if user is not None and user.check_password(password):
        login_user(user, remember=remember)
        if next_url != "":
            return(redirect(next_url))
        else:
            return(redirect(url_for("main.index")))
    else:
        flash("Please check your login details and try again", "alert-danger")
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
        flash("Please enter a valid username (only letters, numbers, -, and _)", "alert-warning")
        return(redirect(url_for("auth.signup")))
    if User.get_by_name(name) is not None:
        flash("Username already taken, please choose another (sorry this isn't handled better)", "alert-warning")
        return(redirect(url_for("auth.signup")))
    # Make sure the passowrds match
    if request.form.get("password") != request.form.get("confirmation"):
        flash("Passwords do not match", "alert-danger")
        return(redirect(url_for("auth.signup")))

    # This is added by the JS on the frontend
    # I cannot believe that this works -- this whole thing is so cobbled together
    next_url = request.form.get("next")

    if User.singup(email, name, password): # Returns True if successful :)
        # Send a confirmation email :)
        msg = Message(subject="Welcome to Wiki Wall Street!", 
                      sender=OUTGOING_EMAILS["default"],
                      recipients=[email])
        msg.html = render_template("emails/welcome.html", name=name, server_url=settings.SERVER_URL)
        mail.send(msg)
        # Redirect to login page
        return(redirect(url_for("auth.login", next=next_url)))
    else:
        flash("This email address already exists -- please log in instead", "alert-danger")
        return(redirect(url_for("auth.signup")))

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return(redirect(url_for("main.index")))
