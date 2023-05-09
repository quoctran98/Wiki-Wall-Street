const GAME_CARDS_DECK_ID = "game-cards-grid";

const PUBLIC_GAME_GRID_ID = "public-game-cards-grid";

// NEW GAME IDS
const NEW_GAME_BUTTON_ID = "new-game-button";
const NEW_GAME_MODAL_ID = "new-game-modal";

const NEW_GAME_NAME_ID = "new-game-modal-game-name";
const NEW_GAME_SHOW_ARTICLES_ID = "new-game-show-articles";
const NEW_GAME_SHOW_NUMBER_ID = "new-game-show-number";
const NEW_GAME_SHOW_ARTICLES_LABEL_ID = "new-game-show-number-label";

const NEW_GAME_MODAL_CLOSE_ID = "new-game-modal-close";
const NEW_GAME_MODAL_CANCEL_ID = "new-game-modal-cancel";
const NEW_GAME_MODAL_CREATE_ID = "new-game-modal-create";

// JOIN GAME IDS
const JOIN_GAME_BUTTON_ID = "join-game-button";
const JOIN_GAME_MODAL_ID = "join-game-modal";

const JOIN_GAME_MODAL_CLOSE_ID = "join-game-modal-close";
const JOIN_GAME_MODAL_CANCEL_ID = "join-game-modal-cancel";
const JOIN_GAME_MODAL_JOIN_ID = "join-game-modal-join";

function add_new_game_event_listeners() {
    // modal open/close
    document.getElementById(NEW_GAME_BUTTON_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "block";
    });
    document.getElementById(NEW_GAME_MODAL_CLOSE_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
    });
    document.getElementById(NEW_GAME_MODAL_CANCEL_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
    });

    // disable number of articles if show articles is not checked
    document.getElementById(NEW_GAME_SHOW_ARTICLES_ID).addEventListener("change", function() {
        if (this.checked) {
            document.getElementById(NEW_GAME_SHOW_NUMBER_ID).disabled = false;
            document.getElementById(NEW_GAME_SHOW_ARTICLES_LABEL_ID).style.color = "black";
        } else {
            document.getElementById(NEW_GAME_SHOW_NUMBER_ID).disabled = true;
            document.getElementById(NEW_GAME_SHOW_ARTICLES_LABEL_ID).style.color = "#E5E5E5";
            document.getElementById(NEW_GAME_SHOW_NUMBER_ID).checked = false;
        }
    });

    // disable create button if no game name
    document.getElementById(NEW_GAME_NAME_ID ).addEventListener("input", function() {
        if (this.value) {
            document.getElementById(NEW_GAME_MODAL_CREATE_ID).disabled = false;
        } else {
            document.getElementById(NEW_GAME_MODAL_CREATE_ID).disabled = true;
        }
    });
}

function add_join_game_event_listeners() {
    // modal open/close
    document.getElementById(JOIN_GAME_BUTTON_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "block";
    });
    document.getElementById(JOIN_GAME_MODAL_CLOSE_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    });
    document.getElementById(JOIN_GAME_MODAL_CANCEL_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    });
    
}

async function load_game_cards() {
    const game_card_container = document.getElementById(GAME_CARDS_DECK_ID);

    // get game data from server
    const res = await fetch("/api/get_games", {method: "GET"});
    if (res.status !== 200) {
        return(false);
    }
    let joined_games = await res.json();
    joined_games = joined_games.games

    // make 3 columns for game cards + 2
    const num_columns = 4;
    const num_rows = Math.ceil((joined_games.length + 2) / num_columns);
    for (let i = 0; i < num_rows; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        game_card_container.appendChild(row);
        for (let j = 0; j < num_columns; j++) {
            const col = document.createElement("div");
            col.classList.add(`col-${12 / num_columns}`);
            row.appendChild(col);
            col.setAttribute("id", "game-card-" + (i * num_columns + j));
        }
    }

    // create game cards
    for (let i = 0; i < joined_games.length; i++) {
        const game_id = joined_games[i].game_id;
        const game_name = joined_games[i].name;
        const players = joined_games[i].players;

        const play_url = window.location.origin + "/play?game_id=" + game_id;
        const players_string = players.join(", ");

        const game_card_html = `
        <div class="card game-card">
            <div class="card-body">
                <h5 class="card-title">${game_name}</h5>
                <p class="card-text" style="white-space: wrap; overflow-x: scroll;">Players: ${players_string}</p>
                <a href="${play_url}" class="btn btn-primary">Play!</a>
            </div>
        </div>
        `;
        document.getElementById("game-card-" + i).insertAdjacentHTML("beforeend", game_card_html);
    }

    // create new game card
    const create_game_html = `
        <div class="card game-card">
            <div class="card-body">
                <button id=${NEW_GAME_BUTTON_ID} >New Game</button>
            </div>
        </div>
    `;
    let card_pos = joined_games.length;
    document.getElementById("game-card-" + card_pos).insertAdjacentHTML("beforeend", create_game_html);

    // join game card
    const join_game_html = `
        <div class="card game-card">
            <div class="card-body">
                <button id=${JOIN_GAME_BUTTON_ID} >Join Game</button>
            </div>
        </div>
    `;
    card_pos += 1;
    document.getElementById("game-card-" + card_pos).insertAdjacentHTML("beforeend", join_game_html);
}

async function load_public_game_cards() {
    const public_grid = document.getElementById(PUBLIC_GAME_GRID_ID);
    const res = await fetch("/api/get_public_games", {method:"GET"});
    if (res.status !== 200) {
        return(false);
    }
    let public_games = await res.json();
    public_games = public_games.games

    public_grid.innerHTML = public_games.map((game) => {
        const game_id = game.game_id;
        return(`
            <div class="card game-card">
                <div class="card-body">
                    <a href="/join_game?game_id=${game_id}">${game_id}</a>
                </div>
            </div>
        `);
    });
}

load_game_cards().then((res) => {
    add_new_game_event_listeners();
    add_join_game_event_listeners();
    load_public_game_cards();
});
