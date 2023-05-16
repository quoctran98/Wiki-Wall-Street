/*
    This page manages the modal that opens when the user clicks the settings button on the play page.
    It also updates the game settings if the user changes them.
*/

// IDS FOR HTML ELEMENTS

// Game settings modal elements
const GAME_SETTINGS_OPEN_BUTTON = "game-settings-open-button";
const GAME_SETTINGS_MODAL = "game-settings-modal";
const GAME_SETTINGS_MODAL_TITLE = "game-settings-modal-title";

const GAME_SETTINGS_MODAL_CLOSE_SYMBOL = "game-settings-modal-close-symbol";
const GAME_SETTINGS_CLOSE_BUTTON = "game-settings-modal-close-button";
const GAME_SETTINGS_SAVE_BUTTON = "game-settings-modal-save-button";

// Game settings form elements
const SETTINGS_FORM = "settings-form";
const SETTING_GAME_ID = "settings-game-id";
const SETTINGS_GAME_NAME = "settings-game-name";
const SETTINGS_STARTING_CASH = "settings-starting-cash";
const SETTINGS_VIEWS_LIMIT = "settings-views-limit";
const SETTINGS_SHOW_CASH = "settings-show-cash";
const SETTINGS_SHOW_ARTICLES = "settings-show-articles";
const SETTINGS_SHOW_NUMBER_LABEL = "settings-show-number-label";
const SETTINGS_SHOW_NUMBER = "settings-show-number";
const SETTINGS_PUBLIC_GAME = "settings-public-game";

// Add event listener to close symbol and button :)
document.getElementById(GAME_SETTINGS_MODAL_CLOSE_SYMBOL).onclick = (() => {
    document.getElementById(GAME_SETTINGS_MODAL).style.display = "none";
    unblur_background();
});
document.getElementById(GAME_SETTINGS_CLOSE_BUTTON).onclick = (() => {
    document.getElementById(GAME_SETTINGS_MODAL).style.display = "none";
    unblur_background();
});

// Add event listener to disable number of articles if show articles is not checked
// Same logic as in home-game-modals.js
document.getElementById(SETTINGS_SHOW_ARTICLES).addEventListener("change", function() {
    if (this.checked) {
        document.getElementById(SETTINGS_SHOW_NUMBER).disabled = false;
        document.getElementById(SETTINGS_SHOW_NUMBER_LABEL).style.color = "black";
    } else {
        document.getElementById(SETTINGS_SHOW_NUMBER).disabled = true;
        document.getElementById(SETTINGS_SHOW_NUMBER_LABEL).style.color = "#E5E5E5";
        document.getElementById(SETTINGS_SHOW_NUMBER).checked = false;
    }
});

// Add event listener to enable the save button when the form is changed
// Ideally should only enable the save button if the form is DIFFERENT from the game settings
document.getElementById(SETTINGS_FORM).addEventListener("change", function() {
    if (THIS_PLAYER.user_id === GAME_OBJECT.owner_id) {
        document.getElementById(GAME_SETTINGS_SAVE_BUTTON).removeAttribute("disabled");
    }
});

// Show the modal when the settings button is clicked
function show_game_settings_modal(game=GAME_OBJECT) {
    // Run the init_settings function to fill out the form (in case it was closed and reopened)
    init_settings(game);
    // Redisable the save button and show the modal
    document.getElementById(GAME_SETTINGS_SAVE_BUTTON).setAttribute("disabled", true);
    document.getElementById(GAME_SETTINGS_MODAL).style.display = "block";
    blur_background();
}

// Fill out the modal on page load
function init_settings(game=GAME_OBJECT) {
    document.getElementById(GAME_SETTINGS_MODAL_TITLE).innerHTML = `Settings for ${game.name}`;

    // Fill out the game id
    document.getElementById(SETTING_GAME_ID).value = game.game_id;

    // Fill out the form with the current game settings
    document.getElementById(SETTINGS_GAME_NAME).value = game.name;
    
    document.getElementById(SETTINGS_STARTING_CASH).value = game.settings.starting_cash;
    document.getElementById(SETTINGS_VIEWS_LIMIT).value = game.settings.views_limit;
    document.getElementById(SETTINGS_SHOW_CASH).checked = game.settings.show_cash;
    document.getElementById(SETTINGS_SHOW_ARTICLES).checked = game.settings.show_articles;
    document.getElementById(SETTINGS_SHOW_NUMBER).checked = game.settings.show_number;

    document.getElementById(SETTINGS_PUBLIC_GAME).checked = game.public_game;

    // Enable form elements if the user is the game creator
    // USE READONLY ATTRIUUTE INSTEAD OF DISABLED (disabled elements don't get sent in the form!)
    // It doesn't matter in the new game modal for now, but keep this in mind!
    if (THIS_PLAYER.user_id === game.owner_id) {
        // document.getElementById(SETTINGS_GAME_NAME).readonly = false;
        // Should we let the user change the game name? I don't think so.
        document.getElementById(SETTINGS_VIEWS_LIMIT).removeAttribute("readonly");
        document.getElementById(SETTINGS_SHOW_CASH).removeAttribute("readonly");
        document.getElementById(SETTINGS_SHOW_ARTICLES).removeAttribute("readonly");
        
        // Enable the number of articles checkbox if it's already checked :)
        if (document.getElementById(SETTINGS_SHOW_NUMBER).checked) {
            document.getElementById(SETTINGS_SHOW_NUMBER_LABEL).style.color = "black";
            document.getElementById(SETTINGS_SHOW_NUMBER).removeAttribute("readonly");
        }  
    }
    
    // Enable the settings button now :)
    document.getElementById(GAME_SETTINGS_OPEN_BUTTON).removeAttribute("disabled");
    console.log(game);
}
