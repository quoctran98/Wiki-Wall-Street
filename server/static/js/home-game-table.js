// This loads the table on the home page with a player's joined games and the public games

// IDS FOR HTML ELEMENTS

// Joined and public game table elements
const JOINED_GAMES_TABLE_ID = "joined-games-table";
const PUBLIC_GAMES_TABLE_ID = "public-games-table";

// This function adds a row to the joined games table
async function add_game_row (game_id, joined_games_table) {

    // Get game object and this player's object from the server
    const play_info_url = `/api/get_play_info?game_id=${game_id}`;
    let play_info_res = await fetch(play_info_url);
    play_info_res = await play_info_res.json();
    const game = play_info_res.game; // Redundant, since we already have this_game
    const player = play_info_res.player;
    let daily_change = (player.today_value - player.yesterday_value) / player.yesterday_value;
    daily_change = Math.round(daily_change * 10000) / 100;

    // Add the row and cells for this game
    let row = joined_games_table.insertRow(-1);
    let name_cell = row.insertCell(0);
    let players_cell = row.insertCell(1);
    let change_cell = row.insertCell(2);
    let action_cell = row.insertCell(3);

    // Populate the cells with the game info
    name_cell.innerHTML = game.name;
    players_cell.innerHTML = game.players.join(", ");
    change_cell.innerHTML = `${(daily_change > 0)? "📈" : "📉"} ${daily_change}%`
    action_cell.innerHTML = `<button class="btn btn-primary" 
        onclick="window.location.href='/play?game_id=${game.game_id}'">Play</button>`;
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
        this_game = joined_games[i];
        add_game_row(this_game.game_id, joined_games_table);
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

    // Populate the table with the public games
    // We don't have to wrap this in an async function because it's not making any server calls
    for (let i = 0; i < public_games.length; i++) {
        this_game = public_games[i];
        let row = public_games_table.insertRow(-1);
        let name_cell = row.insertCell(0);
        let players_cell = row.insertCell(1);
        let action_cell = row.insertCell(2);

        name_cell.innerHTML = this_game.name;
        players_cell.innerHTML = this_game.players.join(", ");
        action_cell.innerHTML = `<button class="btn btn-primary"
            onclick="window.location.href='/play?game_id=${this_game.game_id}'">Play</button>`;
    }
}

populate_joined_games();
populate_public_games();
