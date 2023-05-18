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

function copy_link(div_id) {
    const text = document.getElementById(div_id);
    text.select(); 
    text.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(text.value);
  }

function show_players_modal(game=GAME_OBJECT) {
    // Show modal
    document.getElementById(PLAYERS_MODAL).style.display = "block";
    blur_background();

    // Add an invite link that copies to clipboard
    const invite_link = window.location.origin + "/invite?game_id=" + game.game_id;
    let invite_link_html = `
    <p> INVITE LINK! <input readonly="true" type="text" id="game-invite-link" value="${invite_link}"> 
    <button class="btn btn-light" onclick="copy_link('game-invite-link')">📋</button></p>
    `;
    players_list.insertAdjacentHTML("beforeend", invite_link_html);

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
