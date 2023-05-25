// This loads the table on the profile page with a player's joined games

const PROFILE_GAMES_TABLE_ID = "profile-games-table";
const USER_NAME = window.location.pathname.split("/")[2];

// This function adds a row to the profile games table
async function add_game_row (game_id, profile_games_table, total_games) {

    // Get game object and this player's object from the server
    const this_game_url = `/api/get_profile_game/${game_id}/${encodeURIComponent(USER_NAME)}`;
    let this_game_res = await fetch(this_game_url);
    this_game_res = await this_game_res.json();

    // Add the row and cells for this game (make row right before the last row, which is the loading row)
    n_rows = profile_games_table.rows.length;
    let row = profile_games_table.insertRow(n_rows - 1);
    let name_cell = row.insertCell(0);
    let value_cell = row.insertCell(1);
    let date_cell = row.insertCell(2);

    // Populate the cells with the game info
    name_cell.innerHTML = this_game_res.game;
    value_cell.innerHTML = format_value(this_game_res.value, include_icon=false);
    date_cell.innerHTML = new Date(this_game_res.date_joined).toLocaleDateString();

    // Remove the loading row if this is the last game
    if (n_rows == total_games + 1) {
        profile_games_table.deleteRow(n_rows);
    }
}

async function populate_joined_games() {

    // Get the joined games table
    const profile_games_table = document.getElementById(PROFILE_GAMES_TABLE_ID);
    
    // Get users games from the server
    const prof_games_url = `/api/get_users_games/${encodeURIComponent(USER_NAME)}`;
    let prof_games_res = await fetch(prof_games_url);
    prof_games_res = await prof_games_res.json();
    const game_ids = prof_games_res.games;

    // Populate the table with the joined games asynchonously
    for (let i = 0; i < game_ids.length; i++) {
        let id = game_ids[i];
        add_game_row(id, profile_games_table, game_ids.length);
    }
}


$(document).ready(function() {
    populate_joined_games();
});
