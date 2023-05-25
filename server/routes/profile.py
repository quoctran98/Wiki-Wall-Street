import requests
from flask import Blueprint, render_template, flash
from flask_login import login_required, current_user
from pymongo import MongoClient

from server.helper import settings, cache, allowed_categories, banned_categories
from server.models import User

profile = Blueprint("profile", __name__)


