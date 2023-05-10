import requests
from flask import Flask, request, jsonify, Blueprint, render_template
from flask_login import login_required, current_user
from pymongo import MongoClient
from datetime import date, timedelta

from server.helper import settings, cache

# Functions for the actual game -- we don't really need these in other pages
import server.WikiAPI as WikiAPI

wiki = Blueprint("wiki", __name__)

@wiki.route("/api/article_id")
@cache.cached(timeout=86400, query_string=True)
def article_id():
    article = request.args.get("article")
    article_id = WikiAPI.article_id(article)
    return(jsonify(article_id=article_id))

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
    article = request.args.get("article")
    normalized_views = WikiAPI.normalized_views(article)
    price = normalized_views[-1]["views"]
    return(jsonify(price=price))

@wiki.route("/api/pageviews")
@cache.cached(timeout=300, query_string=True)
def monthly_views():
    article = request.args.get("article")
    timespan = request.args.get("timespan")
    if timespan == "week":
        start = date.today() - timedelta(days=7)
    elif timespan == "month":
        start = date.today() - timedelta(days=30)
    elif timespan == "year":
        start = date.today() - timedelta(days=365)
    elif timespan == "all":
        start = date(2007, 12, 1)
    else:
        start = date.today() - timedelta(days=30)
    normalized_views = WikiAPI.normalized_views(article, start=start)
    # return in a format to graph in js
    timestamps = [x["timestamp"] for x in normalized_views]
    views = [x["views"] for x in normalized_views]
    return(jsonify(timestamps=timestamps, views=views))

@wiki.route("/api/article_description")
@cache.cached(timeout=86400, query_string=True) # This should never change (maybe)
def article_description():
    article = request.args.get("article")
    description = WikiAPI.article_description(article)
    return(jsonify(description=description))

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
            normalized_views = WikiAPI.normalized_views(name, start= date.today() - timedelta(days=7))
            trending.append({
                "article": name,
                "last_week_views": normalized_views[0]["views"],
                "today_views": normalized_views[-1]["views"],
                "data": normalized_views
            })
        except:
            pass # article doesn't exist or something
    return(jsonify(trending=trending))

    
