import requests
from flask import Flask, request, jsonify, Blueprint, render_template
from flask_login import login_required, current_user
from pymongo import MongoClient
from datetime import date, timedelta

from server.helper import settings, cache, today_wiki, allowed_categories, search_lists
from server.models import Game

# Functions for the actual game -- we don't really need these in other pages
import server.WikiAPI as WikiAPI

wiki = Blueprint("wiki", __name__)

@wiki.route("/api/search_article/<game_id>/<query>")
@login_required
@cache.cached(timeout=3600) 
# Long time if the settings change but hopefully they don't
def search_article(game_id, query):
    
    # Try to use the search lists
    game = Game.get_by_game_id(game_id)
    if "allowed_categories" in game.settings:
        if "" not in game.settings["allowed_categories"]:
            suggestions = []
            unfound_search_lists = False
            for category in game.settings["allowed_categories"]:
                if category in search_lists:
                    suggestions += search_lists[category]
                else:
                    unfound_search_lists = True
                    break 
            if not unfound_search_lists: # Only return suggestions if ALL categories have search lists
                suggestions = [x for x in suggestions if query.lower() in x.lower()]
                suggestions = sorted(suggestions, key=len)
                return(jsonify(suggestions=suggestions))

    # Use the default Wikipedia search
    if len(query) > 0:
        results = WikiAPI.search_article(query)
        if results:
            return(jsonify(suggestions=results["suggestions"]))
        return(jsonify(suggestions=[]))
    return(jsonify(suggestions=[]))

@wiki.route("/api/article_price/<article>/<timespan>")
@cache.cached(timeout=300)
def article_price(article, timespan):
    # Shouldn't actually need to use today_wiki() here, but it'll make sure the frontend is consistent :)
    if timespan == "week":
        start = today_wiki() - timedelta(days=7)
    elif timespan == "month":
        start = today_wiki() - timedelta(days=30)
    elif timespan == "year":
        start = today_wiki() - timedelta(days=365)
    elif timespan == "all":
        # No articles actually have data before like 2015, so this doesn't even matter
        start = date(2007, 12, 1)
    else:
        start = today_wiki() - timedelta(days=30) # default to month
    normalized_views = WikiAPI.normalized_views(article, start=start)
    # Return in a format to graph in JavaScript
    timestamps = [x["timestamp"] for x in normalized_views]
    views = [x["views"] for x in normalized_views]
    return(jsonify(timestamps=timestamps, views=views))

@wiki.route("/api/article_information/<article>")
@cache.cached(timeout=86400) # This should never change (maybe)
def article_description(article):
    print("⭐️", article)
    info = WikiAPI.article_information(article)
    return(jsonify(title=info["title"], pageid=info["pageid"], short_desc=info["short_desc"], categories=info["categories"]))

@wiki.route("/api/trending_articles")
@cache.cached(timeout=3600) # This maybe changes once a day?
def trending_articles():
    articles = WikiAPI.top_articles()["articles"][:100]
    trending = []
    for a in articles:
        name = a["article"]
        if name in ["Main_Page", "Special:Search"]:
            continue
        try:
            # Again shouldn't need to use today_wiki() here, but it'll make sure the frontend is consistent :)
            normalized_views = WikiAPI.normalized_views(name, start= today_wiki() - timedelta(days=7))
            trending.append({
                "article": name,
                "last_week_views": normalized_views[0]["views"],
                "today_views": normalized_views[-1]["views"],
                "data": normalized_views
            })
        except:
            pass # article doesn't exist or something
    return(jsonify(trending=trending))

    
