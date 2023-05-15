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

const JOIN_GAME_MODAL_CLOSE_ID = "join-game-modal-close";
const JOIN_GAME_MODAL_CANCEL_ID = "join-game-modal-cancel";
const JOIN_GAME_MODAL_JOIN_ID = "join-game-modal-join";

// New game modal open/close
document.getElementById(NEW_GAME_BUTTON_ID).onclick = (() => {
    document.getElementById(NEW_GAME_MODAL_ID).style.display = "block";
});
document.getElementById(NEW_GAME_MODAL_CLOSE_ID).onclick = (() => {
    document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
});
document.getElementById(NEW_GAME_MODAL_CANCEL_ID).onclick = (() => {
    document.getElementById(NEW_GAME_MODAL_ID).style.display = "none";
});

// New game modal: disable number of articles if show articles is not checked
// DON'T USE DISABLE ATTRIBUTE, USE READONLY INSTEAD
document.getElementById(NEW_GAME_SHOW_ARTICLES_ID).addEventListener("change", function() {
    if (this.checked) {
        document.getElementById(NEW_GAME_SHOW_NUMBER_ID).removeAttribute("readonly");
        document.getElementById(NEW_GAME_SHOW_ARTICLES_LABEL_ID).style.color = "black";
    } else {
        document.getElementById(NEW_GAME_SHOW_NUMBER_ID).setAttribute("readonly", true);
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

// Join game modal open/close
document.getElementById(JOIN_GAME_BUTTON_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "block";
});
document.getElementById(JOIN_GAME_MODAL_CLOSE_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
});
document.getElementById(JOIN_GAME_MODAL_CANCEL_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
});

// Join game modal: disable join button if no game id
document.getElementById(JOIN_GAME_MODAL_GAME_ID).addEventListener("input", function() {
    if (this.value) {
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = false;
    } else {
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
    }
});

