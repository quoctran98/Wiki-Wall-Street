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
const SETTINGS_SHOW_CASH_LABEL = "settings-show-cash-label";
const SETTINGS_SHOW_CASH = "settings-show-cash";
const SETTINGS_SHOW_ARTICLES_LABEL = "settings-show-articles-label";
const SETTINGS_SHOW_ARTICLES = "settings-show-articles";
const SETTINGS_SHOW_NUMBER_LABEL = "settings-show-number-label";
const SETTINGS_SHOW_NUMBER = "settings-show-number";
const SETTINGS_PUBLIC_GAME = "settings-public-game";
const SETTINGS_ALLOWED = "settings-allowed";
const SETTINGS_BANNED = "settings-banned";

// Deleting a game modal elements
const SETTINGS_MODAL_DELETE = "settings-modal-delete-button";
const DELETE_CONFIRM_MODAL = "delete-confirm-modal";
const DELETE_CONFIRM_MODAL_GAME_ID = "delete-confirm-modal-game-id";
const DELETE_CONFIRM_MODAL_CLOSE_BUTTON = "delete-confirm-modal-close-button";

// Add event listeners to the delete game button
document.getElementById(SETTINGS_MODAL_DELETE).onclick = (() => {
    document.getElementById(GAME_SETTINGS_MODAL).style.display = "none";
    document.getElementById(DELETE_CONFIRM_MODAL_GAME_ID).value = GAME_OBJECT.game_id;
    document.getElementById(DELETE_CONFIRM_MODAL).style.display = "block";
    blur_background();
});

// Add event listeners to the delete game confirm modal
document.getElementById(DELETE_CONFIRM_MODAL_CLOSE_BUTTON).onclick = (() => {
    document.getElementById(DELETE_CONFIRM_MODAL).style.display = "none";
    show_game_settings_modal();
});

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
    document.getElementById(SETTINGS_PUBLIC_GAME).checked = game.public;

    // Select the allowed and banned categories in the select elements
    if (game.settings.allowed_categories) {
        for (let category of game.settings.allowed_categories) {
            option_id = `allowed-option-${category}`;
            try { // In case we delete a category and it's still in the game settings
                document.getElementById(option_id).selected = true;
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    if (game.settings.banned_categories) {
        for (let category of game.settings.banned_categories) {
            option_id = `banned-option-${category}`;
            try { // In case we delete a category and it's still in the game settings
                document.getElementById(option_id).selected = true;
            }
            catch (err) {
                console.log(err);
            }
        }
    }

    // Enable form elements if the user is the game creator
    // USE READONLY ATTRIBUTE INSTEAD OF DISABLED (disabled elements don't get sent in the form!)
    // select options only work with DISABLED!
    // It doesn't matter in the new game modal for now, but keep this in mind!
    if (THIS_PLAYER.user_id === game.owner_id) {
        document.getElementById(SETTINGS_VIEWS_LIMIT).removeAttribute("readonly");
        document.getElementById(SETTINGS_SHOW_CASH_LABEL).style.color = "black";
        document.getElementById(SETTINGS_SHOW_CASH).removeAttribute("disabled");
        document.getElementById(SETTINGS_SHOW_ARTICLES_LABEL).style.color = "black";
        document.getElementById(SETTINGS_SHOW_ARTICLES).removeAttribute("disabled");
        // Users can't change public game status after the game is created! Maybe
        
        // Enable the number of articles checkbox if it's already checked :)
        if (document.getElementById(SETTINGS_SHOW_ARTICLES).checked) {
            document.getElementById(SETTINGS_SHOW_NUMBER_LABEL).style.color = "black";
            document.getElementById(SETTINGS_SHOW_NUMBER).removeAttribute("disabled");
        } 

        // Enable the select elements and options within :)
        document.getElementById(SETTINGS_ALLOWED).removeAttribute("readonly");
        document.getElementById(SETTINGS_BANNED).removeAttribute("readonly");
        for (let option of document.getElementById(SETTINGS_ALLOWED).options) {
            option.removeAttribute("disabled");
        }
        for (let option of document.getElementById(SETTINGS_BANNED).options) {
            option.removeAttribute("disabled");
        }

        // Enable the delete game button
        document.getElementById(SETTINGS_MODAL_DELETE).removeAttribute("disabled");
    }
    
    // Enable the settings button now :)
    document.getElementById(GAME_SETTINGS_OPEN_BUTTON).removeAttribute("disabled");
    console.log(game);
}
