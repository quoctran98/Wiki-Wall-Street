# BIG THANKS TO https://www.digitalocean.com/community/tutorials/how-to-add-authentication-to-your-app-with-flask-login#step-10-protecting-pages
# for the project structure! 

# AND ALSO TO https://stackoverflow.com/questions/54992412/flask-login-usermixin-class-with-a-mongodb
# for the MongoDB integration help!

# AND A LOT OF OTHER PEOPLE AND WEBSITES :)

from flask import Flask
from flask_login import LoginManager

from server.helper import settings, cache_config, cache
from server.models import User

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

    # Blueprint for auth routes from server/auth.py
    from .routes.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # Blueprint for non-auth routes from server/main.py
    from .routes.main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    # Blueprint for game routes from server/game.py
    from .routes.game import game as game_blueprint
    app.register_blueprint(game_blueprint)

    # Blueprint for wiki routes from server/wiki.py
    from .routes.wiki import wiki as wiki_blueprint
    app.register_blueprint(wiki_blueprint)

    # Make sure the app is running with the correct settings
    print("Routes registered! 🌐")
    print(f"Connected to MongoDB at {settings.MONGODB_CONNECTION_STRING} 💾")
    print(f"Game set up with average en.wikipedia project views of {settings.EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS} 📈")

    return(app)
