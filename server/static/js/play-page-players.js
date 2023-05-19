/*
    This script handles the players modal that pops up when you click on the players button
*/

// ID(S) FOR HTML ELEMENTS
const PLAYERS_MODAL_OPEN_BUTTON = "players-modal-open-button";
const PLAYERS_MODAL = "players-modal";
const PLAYERS_MODAL_CLOSE_SYMBOL = "players-modal-close-symbol";
const PLAYERS_MODAL_CLOSE_BUTTON = "players-modal-close-button";
const PLAYERS_MODAL_TITLE = "players-modal-title";
const PLAYER_MODAL_INVITE = "players-modal-invite";
const PLAYERS_MODAL_MAIN = "players-modal-main";

const PLAYERS_MODAL_LEAVE = "players-modal-leave-button";
const LEAVE_CONFIRM_MODAL = "leave-confirm-modal";
const LEAVE_CONFIRM_MODAL_GAME_ID = "leave-confirm-modal-game-id";
const LEAVE_CONFIRM_MODAL_CLOSE_BUTTON = "leave-confirm-modal-close-button";

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

    // Fill out the modal
    let invite_link_html = document.getElementById(PLAYER_MODAL_INVITE);
    let players_list_html = document.getElementById(PLAYERS_MODAL_MAIN);

    // Add an invite link that copies to clipboard
    const invite_link = window.location.origin + "/invite?game_id=" + game.game_id;
    invite_link_html.innerHTML = `
    <button class="btn btn-primary" onclick="copy_link('game-invite-link')">🔗</button>
    <input readonly="true" type="text" id="game-invite-link" value="${invite_link}"> 
    `;

    players_list_html.innerHTML = "<ul></ul>";
    for (let i = 0; i < game.players.length; i++) {
        let player_html = `
            <li> ${game.players[i]} </li>
        `;
        players_list_html.insertAdjacentHTML("beforeend", player_html);
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

    // Add event listener to leave game button
    document.getElementById(PLAYERS_MODAL_LEAVE).onclick = (() => {
        // Fill out the confirm modal info
        // No user id from client because it's stored in the session
        document.getElementById(LEAVE_CONFIRM_MODAL_GAME_ID).value = GAME_OBJECT.game_id;

        // Close this modal and open the confirm modal
        document.getElementById(PLAYERS_MODAL).style.display = "none";
        document.getElementById(LEAVE_CONFIRM_MODAL).style.display = "block";
        blur_background();
    });

    // Add event listener to confirm leave game button
    document.getElementById(LEAVE_CONFIRM_MODAL_CLOSE_BUTTON).onclick = (() => {
        document.getElementById(LEAVE_CONFIRM_MODAL).style.display = "none";
        unblur_background();
    });

    // Enable the players button
    document.getElementById(PLAYERS_MODAL_OPEN_BUTTON).removeAttribute("disabled");
}
