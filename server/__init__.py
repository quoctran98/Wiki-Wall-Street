# BIG THANKS TO https://www.digitalocean.com/community/tutorials/how-to-add-authentication-to-your-app-with-flask-login#step-10-protecting-pages
# for the project structure! 

# AND ALSO TO https://stackoverflow.com/questions/54992412/flask-login-usermixin-class-with-a-mongodb
# for the MongoDB integration help!

# AND A LOT OF OTHER PEOPLE AND WEBSITES :)

from flask import Flask
from flask_login import LoginManager
from datetime import datetime, timezone

from server.helper import settings, cache_config, cache, scheduler, active_games_coll, players_db, today_wiki, log_update
from server.models import User, Player
from server.tasks import update_all_portfolio_vals

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.FLASK_SECRET_KEY

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return(User.get_by_user_id(user_id))
    
    # Set up cache
    cache.init_app(app, config=cache_config)

    # Set up scheduler
    scheduler.init_app(app)
    scheduler.start()
    
    # Don't run the value updater when testing locally -- the timezones mess up the history
    # It's actually solved now, but I'm leaving this here just in case :)
    if settings.ENVIRONMENT == "local":
        print("Not starting scheduler in local environment ⏰")
    else:
        # This should run at UPDATE_HOUR:01 UTC every day and we should clear the cache the minute before
        scheduler.add_job(id="clear_cache", func=cache.clear, trigger="cron", hour=settings.UPDATE_HOUR_UTC, minute=0, timezone=timezone.utc)
        scheduler.add_job(id="update_all_portfolio_vals", func=update_all_portfolio_vals, trigger="cron", hour=settings.UPDATE_HOUR_UTC, minute=1, timezone=timezone.utc)
        print("Scheduler started! ⏰")
        update_all_portfolio_vals() # To make sure it works! And the server was down during the update time!

    # Blueprint for auth routes from routes/auth.py
    from .routes.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # Blueprint for non-auth routes from routes/main.py
    from .routes.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    # Blueprint for game routes from routes/game.py
    from .routes.game import game as game_blueprint
    app.register_blueprint(game_blueprint)

    # Blueprint for wiki routes from routes/wiki.py
    from .routes.wiki import wiki as wiki_blueprint
    app.register_blueprint(wiki_blueprint)

    # Blueprint for chat routes from routes/chat.py
    from .routes.chat import chat as chat_blueprint
    app.register_blueprint(chat_blueprint)

    # Blueprint for admin routes from routes/admin.py
    from .routes.admin import admin as admin_blueprint
    app.register_blueprint(admin_blueprint)

    # # Blueprint for profile routes from routes/profile.py
    # from .routes.profile import profile as profile_blueprint
    # app.register_blueprint(profile_blueprint)

    # Make sure the app is running with the correct settings
    print("Routes registered! 🌐")
    print(f"Game set up with average en.wikipedia project views of {settings.EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS} 📈")
    print(f"The current environment is {settings.ENVIRONMENT} 🌎")
    print(f"The game will allow pageviews to update at {settings.UPDATE_HOUR_UTC}:00 UTC ⏰")

    return(app)
