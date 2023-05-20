// This script handles the logic for the new game and join game modals on the home page.

// IDS FOR HTML ELEMENTS

// New game modal elements
const NEW_GAME_BUTTON_ID = "new-game-button";
const NEW_GAME_MODAL_ID = "new-game-modal";

const NEW_GAME_NAME_ID = "new-game-modal-game-name";
const NEW_GAME_SHOW_ARTICLES_ID = "new-game-show-articles";
const NEW_GAME_SHOW_NUMBER_ID = "new-game-show-number";
const NEW_GAME_SHOW_ARTICLES_LABEL_ID = "new-game-show-number-label";

const NEW_GAME_MODAL_CLOSE_ID = "new-game-modal-close";
const NEW_GAME_MODAL_CANCEL_ID = "new-game-modal-cancel";
const NEW_GAME_MODAL_CREATE_ID = "new-game-modal-create";

// Join game modal elements
const JOIN_GAME_BUTTON_ID = "join-game-button";
const JOIN_GAME_MODAL_ID = "join-game-modal";

const JOIN_GAME_MODAL_GAME_ID = "join-game-modal-game-id";
const JOIN_GAME_MODAL_INFO_ID = "join-game-modal-info";
const JOIN_GAME_MODAL_SEARCH = "join-game-modal-search"

const JOIN_GAME_MODAL_CLOSE_ID = "join-game-modal-close";
const JOIN_GAME_MODAL_CANCEL_ID = "join-game-modal-cancel";
const JOIN_GAME_MODAL_JOIN_ID = "join-game-modal-join";

// This makes a sentence out of the game information
// Ugh, this is repeated in invite-page.js
function render_game_info(game) {
    // Format game information as strings
    let player_list = "";
    for (let i = 0; i < game.players.length; i++) {
        // Could be more elegant, but this lets me underline everything
        if (i === game.players.length - 1) {
            player_list += ", and ";
        }
        player_list += `<ins>${game.players[i]}</ins>`;
        if (i < game.players.length - 2) {
            player_list += ", ";
        }
    }
    const visible_info = Object.keys(game.settings).filter((key) => game.settings[key] === true);

    // Create the HTML
    let game_info_html = `
        <h2>Join <ins>${game.name}</ins>!</h2>
        <p> 👥 Play with ${player_list} </p>
        <p> ⚙️ You'll start with <ins>${format_price(game.settings.starting_cash)}</ins> cash
    `;

    // Add the settings to the HTML
    if (visible_info.length > 0) {
        game_info_html += 
        `and you'll be able to see other players ${(game.settings["show_cash"]) ? "<ins>cash</ins>" : ""}
            ${(game.settings["show_cash"] && (game.settings["show_articles"])) ? "and" : ""}
            ${(game.settings["show_articles"]) ? "<ins>owned articles</ins>" : ""} 
            ${(game.settings["show_number"]) ? "(and <ins>how many</ins> they own!)" : "!"} 
        </p>
        `;
    } else {
        game_info_html += `!</p>`;
    }
    return(game_info_html);
}

// New game modal open/close buttons but only if the user is logged in
if (document.getElementById(NEW_GAME_BUTTON_ID)) {
    document.getElementById(NEW_GAME_BUTTON_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "block";
        blur_background();
    });
    
    document.getElementById(NEW_GAME_MODAL_CLOSE_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
        unblur_background();
    });
    document.getElementById(NEW_GAME_MODAL_CANCEL_ID).onclick = (() => {
        document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
        unblur_background();
    });
}

// New game modal: disable number of articles if show articles is not checked
// DON'T USE DISABLE ATTRIBUTE, USE READONLY INSTEAD -- doesn't work for some reason
document.getElementById(NEW_GAME_SHOW_ARTICLES_ID).addEventListener("change", function() {
    if (this.checked) {
        document.getElementById(NEW_GAME_SHOW_NUMBER_ID).removeAttribute("disabled");
        document.getElementById(NEW_GAME_SHOW_ARTICLES_LABEL_ID).style.color = "black";
    } else {
        document.getElementById(NEW_GAME_SHOW_NUMBER_ID).setAttribute("disabled", true);
        document.getElementById(NEW_GAME_SHOW_ARTICLES_LABEL_ID).style.color = "#E5E5E5";
        document.getElementById(NEW_GAME_SHOW_NUMBER_ID).checked = false
    }
});

// New game modal: disable create button if no game name
document.getElementById(NEW_GAME_NAME_ID ).addEventListener("input", function() {
    if (this.value) {
        document.getElementById(NEW_GAME_MODAL_CREATE_ID).disabled = false;
    } else {
        document.getElementById(NEW_GAME_MODAL_CREATE_ID).disabled = true;
    }
});

// Join game modal open/close but only if the user is logged in
if (document.getElementById(JOIN_GAME_BUTTON_ID)) {
    document.getElementById(JOIN_GAME_BUTTON_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "block";
        blur_background();
    });
    document.getElementById(JOIN_GAME_MODAL_CLOSE_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
        unblur_background();
        // Clear the game info and game id
        document.getElementById(JOIN_GAME_MODAL_INFO_ID).innerHTML = "Enter a game ID!";
        document.getElementById(JOIN_GAME_MODAL_GAME_ID).value = "";
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
    });
    document.getElementById(JOIN_GAME_MODAL_CANCEL_ID).onclick = (() => {
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
        unblur_background();
        // Clear the game info and game id
        document.getElementById(JOIN_GAME_MODAL_INFO_ID).innerHTML = "Enter a game ID!";
        document.getElementById(JOIN_GAME_MODAL_GAME_ID).value = "";
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
    });
}

// Join game modal: search for game
document.getElementById(JOIN_GAME_MODAL_SEARCH).onclick = (() => {
    // Replace the info with a loading spinner
    document.getElementById(JOIN_GAME_MODAL_INFO_ID).innerHTML = `Loading game information <img class="inline-image" src="/static/img/loading.gif" alt="Loading spinner">`;
    const game_id = document.getElementById(JOIN_GAME_MODAL_GAME_ID).value;
    // Get the game information and render it
    fetch("/api/get_invite_info?game_id=" + game_id)
    .then((response) => response.json())
    .then((game_res) => {
        const game = game_res.game;
        if (game) {
            const game_info_div = document.getElementById(JOIN_GAME_MODAL_INFO_ID);
            game_info_div.innerHTML = render_game_info(game);
            document.getElementById(JOIN_GAME_MODAL_JOIN_ID).removeAttribute("disabled");
        } else {
            document.getElementById(JOIN_GAME_MODAL_INFO_ID).innerHTML = "Game not found :(";
            document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
        }
    });
});
