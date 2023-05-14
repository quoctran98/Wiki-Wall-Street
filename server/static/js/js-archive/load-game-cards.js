const GAME_CARDS_DIV_ID = "game-cards-grid";

// NEW GAME IDS
const NEW_GAME_BUTTON_ID = "new-game-button"; // button to open modal
const NEW_GAME_MODAL_ID = "new-game-modal";

const NEW_GAME_NAME_ID = "new-game-modal-game-name";
const NEW_GAME_SHOW_ARTICLES_ID = "new-game-show-articles";
const NEW_GAME_SHOW_NUMBER_ID = "new-game-show-number";
const NEW_GAME_SHOW_ARTICLES_LABEL_ID = "new-game-show-number-label";

const NEW_GAME_MODAL_CLOSE_ID = "new-game-modal-close";
const NEW_GAME_MODAL_CANCEL_ID = "new-game-modal-cancel";
const NEW_GAME_MODAL_CREATE_ID = "new-game-modal-create"; // button to actually create game

// JOIN GAME IDS
const JOIN_GAME_BUTTON_ID = "join-game-button"; // button to open modal
const JOIN_GAME_MODAL_ID = "join-game-modal";

const JOIN_GAME_MODAL_GAME_ID = "join-game-modal-game-id";

const JOIN_GAME_MODAL_CLOSE_ID = "join-game-modal-close";
const JOIN_GAME_MODAL_CANCEL_ID = "join-game-modal-cancel";
const JOIN_GAME_MODAL_JOIN_ID = "join-game-modal-join"; // button to actually join game

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

    // disable join button if no game id
    document.getElementById(JOIN_GAME_MODAL_GAME_ID).addEventListener("input", function() {
        if (this.value) {
            document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = false;
        } else {
            document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
        }
    });
}

async function load_game_cards() {
    const game_card_container = document.getElementById(GAME_CARDS_DIV_ID);

    // get game data from server
    const res = await fetch("/api/get_joined_games", {method: "GET"});
    if (res.status !== 200) {
        return(false);
    }
    let joined_games = await res.json();
    joined_games = joined_games.games

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
        game_card_container.insertAdjacentHTML("beforeend", game_card_html);
    }

    // create new game card
    const create_game_html = `
        <div class="card game-card">
            <div class="card-body">
                <button id=${NEW_GAME_BUTTON_ID} >New Game</button>
            </div>
        </div>
    `;
    game_card_container.insertAdjacentHTML("beforeend", create_game_html);

    // join game card
    const join_game_html = `
        <div class="card game-card">
            <div class="card-body">
                <button id=${JOIN_GAME_BUTTON_ID} >Join Game</button>
            </div>
        </div>
    `;
    game_card_container.insertAdjacentHTML("beforeend", join_game_html);
}

// open modal and preload game id
function join_game(game_id) {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "block";
    document.getElementById(JOIN_GAME_MODAL_GAME_ID).value = game_id;
    document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = false;
}

async function load_public_game_cards() {
    const res = await fetch("/api/get_public_games", {method:"GET"});
    if (res.status !== 200) {
        return(false);
    }
    let public_games = await res.json();
    public_games = public_games.games

    for (let i = 0; i < public_games.length; i++) {
        const game_id = public_games[i].game_id;
        const game_name = public_games[i].name;
        const players = public_games[i].players;

        const players_string = players.join(", ");
        const join_js = `javascript:join_game('${game_id}');`;
        
        const join_card_html = `
        <div class="card game-card">
            <div class="card-body">
                <h5 class="card-title">${game_name}</h5>
                <p class="card-text" style="white-space: wrap; overflow-x: scroll;">Players: ${players_string}</p>
                <a href="${join_js}" class="btn btn-primary">Join!</a>
            </div>
        </div>
        `;
        document.getElementById(GAME_CARDS_DIV_ID).insertAdjacentHTML("beforeend", join_card_html);
    }
}

load_game_cards().then((res) => {
    add_new_game_event_listeners();
    add_join_game_event_listeners();
    load_public_game_cards();
});
