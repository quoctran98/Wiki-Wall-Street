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

// Call blur_background() when any modals are opened
function blur_background() {
    let to_blur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_blur.length; i++) {
        to_blur[i].style = `
            -webkit-filter: blur(3px);
            -moz-filter: blur(3px);
            -o-filter: blur(3px);
            -ms-filter: blur(3px);
            filter: blur(3px);
        `;
    }
}

// Call unblur_background() when any modals are closed
function unblur_background() {
    let to_unblur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_unblur.length; i++) {
        to_unblur[i].style = `
            -webkit-filter: blur(0px);
            -moz-filter: blur(0px);
            -o-filter: blur(0px);
            -ms-filter: blur(0px);
            filter: blur(0px);
        `;
    }
}

// New game modal open/close
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
    blur_background();
});
document.getElementById(JOIN_GAME_MODAL_CLOSE_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    unblur_background();
});
document.getElementById(JOIN_GAME_MODAL_CANCEL_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    unblur_background();
});

// Join game modal: disable join button if no game id
document.getElementById(JOIN_GAME_MODAL_GAME_ID).addEventListener("input", function() {
    if (this.value) {
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = false;
    } else {
        document.getElementById(JOIN_GAME_MODAL_JOIN_ID).disabled = true;
    }
});

