/*
    This script handles the players modal that pops up when you click on the players button
*/

// ID(S) FOR HTML ELEMENTS
const PLAYERS_MODAL_OPEN_BUTTON = "players-modal-open-button";
const PLAYERS_MODAL = "players-modal";
const PLAYERS_MODAL_CLOSE_SYMBOL = "players-modal-close-symbol";
const PLAYERS_MODAL_CLOSE_BUTTON = "players-modal-close-button";
const PLAYERS_MODAL_TITLE = "players-modal-title";
const PLAYERS_MODAL_MAIN = "players-modal-main";

function show_players_modal(game=GAME_OBJECT) {
    // Show modal
    document.getElementById(PLAYERS_MODAL).style.display = "block";
    blur_background();

    // Fill out the modal
    let players_list = document.getElementById(PLAYERS_MODAL_MAIN);
    players_list.innerHTML = "<ul></ul>";
    for (let i = 0; i < game.players.length; i++) {
        let player_html = `
            <li> ${game.players[i]} </li>
        `;
        players_list.insertAdjacentHTML("beforeend", player_html);
    }
}

function init_players() {
    // Add event listeners
    document.getElementById(PLAYERS_MODAL_CLOSE_BUTTON).onclick = (() => {
        document.getElementById(PLAYERS_MODAL).style.display = "none";
        unblur_background();
    });
    document.getElementById(PLAYERS_MODAL_CLOSE_SYMBOL).onclick = (() => {
        document.getElementById(PLAYERS_MODAL).style.display = "none";
        unblur_background();
    });

    // Enable the players button
    document.getElementById(PLAYERS_MODAL_OPEN_BUTTON).removeAttribute("disabled");
}
