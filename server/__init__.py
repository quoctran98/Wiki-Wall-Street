# BIG THANKS TO https://www.digitalocean.com/community/tutorials/how-to-add-authentication-to-your-app-with-flask-login#step-10-protecting-pages
# for the project structure! 

# AND ALSO TO https://stackoverflow.com/questions/54992412/flask-login-usermixin-class-with-a-mongodb
# for the MongoDB integration help!

# AND A LOT OF OTHER PEOPLE AND WEBSITES :)

from flask import Flask
from flask_login import LoginManager
from datetime import datetime

from server.helper import settings, cache_config, cache, scheduler, active_games_coll, players_db
from server.models import User, Player

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

    # Run Player.update_value_history() for every player in every active game
    def update_all_portfolio_vals():
        n_games = 0
        n_players = 0
        for game in active_games_coll.find():
            n_games += 1
            for player in players_db[game["game_id"]].find():
                this_player = Player.get_by_player_id(game["game_id"], player["player_id"])
                this_player.update_value_history()
                n_players += 1
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"Updated value history for {n_players} players in {n_games} games at {timestamp} ⏰")

    # Set up scheduler
    scheduler.init_app(app)
    scheduler.start()
    # Run update_all_portfolio_vals() every hour (should only change once a day, but this will make it easy to search!)
    scheduler.add_job(id="update_all_portfolio_vals", func=update_all_portfolio_vals, trigger="interval", hours=1)

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
    # print(f"Connected to MongoDB at {settings.MONGODB_CONNECTION_STRING} 💾")
    print(f"Game set up with average en.wikipedia project views of {settings.EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS} 📈")

    return(app)
