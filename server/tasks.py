"""
This script defines the tasks that the server will run periodically.
"""

from datetime import datetime, timezone, timedelta
from server.helper import today_wiki, active_games_coll, players_db
from server.models import Player, Game
import os

# This is to log the update portfolio function -- workaround for now until I move the whole thing
def log_update(end_time, elapsed_time, n_games, n_players, api_calls, changed_vals, timestamp):
    log_out = f"Updated value history for {n_players} players in {n_games} games at {timestamp} (quantized Wiki time), taking {elapsed_time.total_seconds()} seconds ⏰"
    log_out += f"\nMade {api_calls} API calls and changed {changed_vals} values 📈"
    print(log_out)
    # Save this to an output log file
    filename = f"./server/logs/portfolio_updates/{end_time.strftime('%Y%m%d-%H%M%S')}.txt"
    try:
        with open(filename, "w") as f:
            f.write(log_out)
    except:
        print("Couldn't write to log file!")

def update_all_portfolio_vals():
    # Let's debug this before it starts running
    print("Updating all portfolio values...")
    cache_dir = "server/temp/cache"
    n_files = len([name for name in os.listdir(cache_dir) if os.path.isfile(os.path.join(cache_dir, name))])
    print(f"Found {n_files} files in the cache.")
    print(f"Current wiki time is {today_wiki().strftime('%Y-%m-%d %H:%M:%S')}.")

    # Tracking metrics
    start_time = datetime.now(timezone.utc)
    n_games = 0
    n_players = 0
    api_calls = 0
    changed_vals = 0

    # Update all players in all games
    for game in active_games_coll.find():
        n_games += 1
        this_game_changed = False

        # Update all players in this game
        for player in players_db[game["game_id"]].find():
            n_players += 1
            this_player = Player.get_by_player_id(game["game_id"], player["player_id"])
            api, change = this_player.update_value_history() # This is the only thing that's doing anything
            api_calls += api
            changed_vals += change
            this_game_changed = True if change > 0 else this_game_changed

        # Add an event so players get notified
        # Should happen only once per day
        if this_game_changed:
            this_game = Game.get_by_game_id(game["game_id"])
            this_game.add_event("daily")
            
    timestamp = today_wiki().strftime("%Y-%m-%d %H:%M:%S")
    end_time = datetime.now(timezone.utc)
    elapsed_time = end_time - start_time
    # Ugh this sucks
    log_update(end_time, elapsed_time, n_games, n_players, api_calls, changed_vals, timestamp)
