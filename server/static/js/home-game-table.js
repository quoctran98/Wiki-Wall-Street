// This loads the table on the home page with a player's joined games and the public games

// IDS FOR HTML ELEMENTS

// Joined and public game table elements
const JOINED_GAMES_TABLE_ID = "joined-games-table";
const JOINED_GAMES_LOADING_ID = "joined-games-loading";
const PUBLIC_GAMES_TABLE_ID = "public-games-table";

// This function adds a row to the joined games table
async function add_game_row (game_id, joined_games_table, total_games) {

    // Get game object and this player's object from the server
    const play_info_url = `/api/get_play_info/${game_id}`;
    let play_info_res = await fetch(play_info_url);
    play_info_res = await play_info_res.json();
    const game = play_info_res.game; // Redundant, since we already have this_game
    const player = play_info_res.player;
    let daily_change = (player.today_value - player.yesterday_value) / player.yesterday_value;
    daily_change = Math.round(daily_change * 10000) / 100;

    // Add the row and cells for this game (make row right before the last row, which is the loading row)
    n_rows = joined_games_table.rows.length;
    let row = joined_games_table.insertRow(n_rows - 1);
    let name_cell = row.insertCell(0);
    let players_cell = row.insertCell(1);
    let change_cell = row.insertCell(2);
    let action_cell = row.insertCell(3);

    // Make the player cell shorten to ellipses if it's too long
    // Ugh should move this to CSS
    players_cell.style = `
        overflow: scroll;
        max-width: 20vw;
        white-space: nowrap;
    `;

    // Populate the cells with the game info
    name_cell.innerHTML = game.name;
    players_cell.innerHTML = format_players_list(game.players); // defined in main.js (should be in utils.js)
    change_cell.innerHTML = `${(daily_change > 0)? "📈" : "📉"} ${daily_change}%`

    // Change the action cell if there's an unchecked update from the game!
    let unchecked_events = [];
    for (ev in game.new_events) {
        new_event_time = new Date(Date.parse(game.new_events[ev]));
        if (ev in player.last_checked) {
            last_checked_time = new Date(Date.parse(player.last_checked[ev]));
        } else {
            last_checked_time = new Date(0);
        }
        if (new_event_time > last_checked_time) {
            unchecked_events.push(ev);
        }
    }
    console.log(game);
    console.log(player);

    let icon_html = `<i class="bi-joystick"></i>`;
    let button_class = "btn-primary";

    //  Chats and players override dailies :)
    if (unchecked_events.includes("chat")) {
        icon_html = `<i class="bi-chat-dots"></i>`;
        button_class = "btn-success";
    } else if (unchecked_events.includes("player")) {
        icon_html = `<i class="bi-person-circle"></i>`;
        button_class = "btn-success";
    } else if (unchecked_events.includes("daily")) {
        icon_html = `<i class="bi-exclamation-circle"></i>`;
        button_class = "btn-info";
    }

    button_html = `
    <button class="btn ${button_class}" id='play-${game.game_id}' onclick="window.location.href='/play/${game.game_id}'">
        ${icon_html} Play
    </button>
    `;
    action_cell.innerHTML = button_html;

    
    // Remove the loading row if this is the last game
    if (n_rows == total_games + 1) {
        joined_games_table.deleteRow(n_rows);
    }
}

async function populate_joined_games() {

    // Get the joined games table
    const joined_games_table = document.getElementById(JOINED_GAMES_TABLE_ID);
    
    // Get joined games from the server
    const join_url = "/api/get_joined_games";
    let join_res = await fetch(join_url);
    join_res = await join_res.json();
    const joined_games = join_res.games;

    // Populate the table with the joined games asynchonously
    for (let i = 0; i < joined_games.length; i++) {
        let this_game = joined_games[i];
        add_game_row(this_game.game_id, joined_games_table, joined_games.length);
    }
}

async function populate_public_games() {

    // Get the public games table
    const public_games_table = document.getElementById(PUBLIC_GAMES_TABLE_ID);

    // Get public games from the server
    const public_url = "/api/get_public_games";
    let public_res = await fetch(public_url);
    public_res = await public_res.json();
    const public_games = public_res.games;

    // If there are no public games, say so!
    if (public_games.length == 0) {
        let row = public_games_table.insertRow(-1);
        let name_cell = row.insertCell(0);
        let players_cell = row.insertCell(1);
        let action_cell = row.insertCell(2);

        name_cell.innerHTML = "No public games at the moment :(";
        players_cell.innerHTML = "";
        action_cell.innerHTML = "";
    } 

    // Populate the table with the public games
    // We don't have to wrap this in an async function because it's not making any server calls
    for (let i = 0; i < public_games.length; i++) {
        this_game = public_games[i];
        let row = public_games_table.insertRow(-1);
        let name_cell = row.insertCell(0);
        let players_cell = row.insertCell(1);
        let action_cell = row.insertCell(2);

        // Ugh should move this to CSS
        players_cell.style = `
            overflow: scroll;
            max-width: 20vw;
            white-space: nowrap;
        `;

        name_cell.innerHTML = this_game.name;
        players_cell.innerHTML = `
            (${this_game.players.length})
            ${format_players_list(this_game.players)}
        `;
        action_cell.innerHTML = `
        <button class="btn btn-success"
            data-toggle="modal" data-target="#join-game-modal"
            onclick="preload_join_game('${this_game.game_id}')">
         <i class="bi-person-plus"></i> Join</button>`;
    }
}


$(document).ready(function() {
    populate_joined_games();
    populate_public_games();
});
