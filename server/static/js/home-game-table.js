// This loads the table on the home page with a player's joined games and the public games

// IDS FOR HTML ELEMENTS

// Joined and public game table elements
const JOINED_GAMES_TABLE_ID = "joined-games-table";
const PUBLIC_GAMES_TABLE_ID = "public-games-table";

async function populate_joined_games() {
    const joined_games_table = document.getElementById(JOINED_GAMES_TABLE_ID);
    
    // Get joined games from the server
    const join_url = "/api/get_joined_games";
    let join_res = await fetch(join_url);
    join_res = await join_res.json();
    const joined_games = join_res.games;

    // Populate the table with the joined games
    for (let i = 0; i < joined_games.length; i++) {
        this_game = joined_games[i];

        const play_info_url = `/api/get_play_info?game_id=${this_game.game_id}`;
        let play_info_res = await fetch(play_info_url);
        play_info_res = await play_info_res.json();
        let daily_change = (play_info_res.today_value - play_info_res.yesterday_value) / play_info_res.yesterday_value;
        daily_change = Math.round(daily_change * 10000) / 100;

        let row = joined_games_table.insertRow(-1);
        let name_cell = row.insertCell(0);
        let players_cell = row.insertCell(1);
        let change_cell = row.insertCell(2);
        let id_cell = row.insertCell(3);
        let action_cell = row.insertCell(4);

        name_cell.innerHTML = this_game.name;
        players_cell.innerHTML = this_game.players.join(", ");
        change_cell.innerHTML = `${(daily_change > 0)? "📈" : "📉"} ${daily_change}%`
        id_cell.innerHTML = this_game.game_id;
        action_cell.innerHTML = `<button class="btn btn-primary" 
            onclick="window.location.href='/play?game_id=${this_game.game_id}'">Play</button>`;

    }
}

async function populate_public_games() {
    const public_games_table = document.getElementById(PUBLIC_GAMES_TABLE_ID);

    // Get public games from the server
    const public_url = "/api/get_public_games";
    let public_res = await fetch(public_url);
    public_res = await public_res.json();
    const public_games = public_res.games;

    // Populate the table with the public games
    for (let i = 0; i < public_games.length; i++) {
        this_game = public_games[i];
        let row = public_games_table.insertRow(-1);
        let name_cell = row.insertCell(0);
        let players_cell = row.insertCell(1);
        let id_cell = row.insertCell(2);
        let action_cell = row.insertCell(3);

        name_cell.innerHTML = this_game.name;
        players_cell.innerHTML = this_game.players.join(", ");
        id_cell.innerHTML = this_game.game_id;
        action_cell.innerHTML = `<button class="btn btn-primary"
            onclick="window.location.href='/play?game_id=${this_game.game_id}'">Play</button>`;
    }
}

populate_joined_games();
populate_public_games();
