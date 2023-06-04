import requests
import random
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
def search_article(game_id, query):

    # Try to manually use cache 
    # defining a cache key this way allows us to clear it later for this specific game
    cache_key = f"search_article:{game_id}:{query}"
    cached_result = cache.get(cache_key)
    if cached_result:
        #print(f"⭐️ {cache_key} found in cache")
        return(cached_result)
    
    suggestions = []

    # Try to use the search lists
    game = Game.get_by_game_id(game_id)
    if "allowed_categories" in game.settings:
        if "" not in game.settings["allowed_categories"]:
            unfound_search_lists = False
            for category in game.settings["allowed_categories"]:
                if category in search_lists:
                    query_in_list = [x for x in search_lists[category] if query.lower() in x.lower()]
                    suggestions += query_in_list
                else:
                    unfound_search_lists = True
            if not unfound_search_lists: # If we found all the search lists, we can just return the results
                suggestions = sorted(suggestions, key=len)[:100]
                cache.set(cache_key, jsonify(suggestions=suggestions))
                return(jsonify(suggestions=suggestions))
            
    # If less than ALL the search lists were found, we can just use the API
    if len(query) > 0:
        results = WikiAPI.search_article(query)
        if results:
            suggestions += results["suggestions"]

    # Sort by length so that the shortest ones are first? then return
    suggestions = sorted(suggestions, key=len)
    cache.set(cache_key, jsonify(suggestions=suggestions))
    return(jsonify(suggestions=suggestions))

@wiki.route("/api/article_price/<article>/<timespan>")
# @cache.cached(timeout=86400) # Should only change once a day (will be cleared when the stuff updates)
# Ugh!
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
@cache.cached(timeout=86400) # Should only change once a day (will be cleared when the stuff updates)
def article_description(article):
    info = WikiAPI.article_information(article)
    return(jsonify(title=info["title"], pageid=info["pageid"], short_desc=info["short_desc"], categories=info["categories"]))

@wiki.route("/api/trending_articles")
@cache.cached(timeout=86400)
# Definitely cache! It's a lot of API calls :(
# Let's cache parts of this rather than the whole thing :)
def trending_articles():

    articles = WikiAPI.top_articles()["articles"][:50]
    # Choose a random 100, weighted by the number of views
    # views_range = (min([x["views"] for x in articles]), max([x["views"] for x in articles]))
    # articles = [x for x in articles if random.randint(views_range[0], views_range[1]) <= x["views"] * 10]
    # print(f"⭐️ {len(articles)} articles chosen for trending")
    # random.shuffle(articles)
    # articles = articles[:50]

    trending = []
    for a in articles:
        # Remove underscores and replace with spaces
        name = a["article"].replace("_", " ")
        if name in ["Main Page", "Special:Search"]:
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
        except Exception as e:
            print(f"⭐️ {name} failed to get views with error {e}")
            pass # article doesn't exist or something
    return(jsonify(trending=trending))

@wiki.route("/api/random_articles")
# Don't cache because we want a random article every time
# I should roll this into WikiAPI.py
def random_articles():
    project = request.args.get("project", default="en.wikipedia", type=str)
    n_articles = request.args.get("n_articles", default=5, type=int)
    random_articles = WikiAPI.random_articles(project=project, n=n_articles)
    return(jsonify(random_articles=random_articles))