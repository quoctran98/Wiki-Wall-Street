import requests
from flask import Flask, request, jsonify, Blueprint, render_template
from flask_login import login_required, current_user
from pymongo import MongoClient
from datetime import date, timedelta

from server.helper import settings, cache, today_wiki

# Functions for the actual game -- we don't really need these in other pages
import server.WikiAPI as WikiAPI

wiki = Blueprint("wiki", __name__)

@wiki.route("/api/search_article")
@cache.cached(timeout=86400, query_string=True)
def search_article():
    query = request.args.get("query")
    if len(query) > 0:
        results = WikiAPI.search_article(query)
        if results:
            return(jsonify(suggestions=results["suggestions"]))
        return(jsonify(suggestions=[]))
    return(jsonify(suggestions=[]))

@wiki.route("/api/current_price")
def current_price():
    # THIS DOESN'T ACTUALLY GET THE LATEST PRICE because normalized_views() uses today_wiki()
    article = request.args.get("article")
    normalized_views = WikiAPI.normalized_views(article)
    price = normalized_views[-1]["views"]
    return(jsonify(price=price))

@wiki.route("/api/article_price")
@cache.cached(timeout=300, query_string=True)
def monthly_views():
    article = request.args.get("article")
    timespan = request.args.get("timespan")
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

@wiki.route("/api/article_information")
@cache.cached(timeout=86400, query_string=True) # This should never change (maybe)
def article_description():
    article = request.args.get("article")
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

    
