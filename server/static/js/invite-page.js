/*
    This script manages the invite links 
*/

// IDS FOR HTML ELEMENTS

// Main page buttons
const SIGNUP_BUTTON_ID = "signup-button";
const LOGIN_BUTTON_ID = "login-button";
const GAME_INFO_ID = "game-information";

// Join game modal elements
// UGH, I know this is bad practice, but I'm just copying the code from home-game-modals.js
// I should make a different template
const JOIN_GAME_BUTTON_ID = "join-game-button";
const JOIN_GAME_MODAL_ID = "join-game-modal";

const JOIN_GAME_MODAL_GAME_ID = "join-game-modal-game-id";
const JOIN_GAME_MODAL_INFO_ID = "join-game-modal-info";
const JOIN_GAME_MODAL_SEARCH = "join-game-modal-search"

const JOIN_GAME_MODAL_CLOSE_ID = "join-game-modal-close";
const JOIN_GAME_MODAL_CANCEL_ID = "join-game-modal-cancel";
const JOIN_GAME_MODAL_JOIN_ID = "join-game-modal-join";

// Get the game ID from the URL args
// Should be the only arg!
const GAME_ID = window.location.href.split("game_id=")[1];

// Add event listener to the join game button if it exists (it won't exist if the user is logged out)
if (document.getElementById(JOIN_GAME_BUTTON_ID)) {
    document.getElementById(JOIN_GAME_BUTTON_ID).onclick = (() => {
        // Open the modal
        document.getElementById(JOIN_GAME_MODAL_ID).style.display = "block";
        blur_background();

        // Get the game information and render it
        fetch("/api/get_invite_info?game_id=" + GAME_ID)
        .then((response) => response.json())
        .then((game_res) => {
            const game = game_res.game;
            const game_info_div = document.getElementById(JOIN_GAME_MODAL_INFO_ID);
            // Render the game information
            game_info_div.innerHTML = render_game_info(game);
        });
    });
}

// Add event listeners to the close and cancel buttons (these exist even if the user is logged out)
document.getElementById(JOIN_GAME_MODAL_CLOSE_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    unblur_background();
});
document.getElementById(JOIN_GAME_MODAL_CANCEL_ID).onclick = (() => {
    document.getElementById(JOIN_GAME_MODAL_ID).style.display = "none";
    unblur_background();
});

// Add this page as the redirect page to the login button if it exists (it won't exist if the user is logged in)
if (document.getElementById(SIGNUP_BUTTON_ID)) {
    // I can't believe this works!
    document.getElementById(SIGNUP_BUTTON_ID).onclick = (() => {
        const redirect_url = "/invite?game_id=" + GAME_ID;
        window.location.href = "/signup?next=" + encodeURIComponent(redirect_url);
    });

    // Add this page as the redirect page to the login button
    document.getElementById(LOGIN_BUTTON_ID).onclick = (() => {
        const redirect_url = "/invite?game_id=" + GAME_ID;
        window.location.href = "/login?next=" + encodeURIComponent(redirect_url);
    });
}

// This makes a sentence out of the game information
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

// Get the game information and render it
fetch("/api/get_invite_info?game_id=" + GAME_ID)
.then((response) => response.json())
.then((game_res) => {
    const game = game_res.game;
    let game_info_div = document.getElementById(GAME_INFO_ID);
    // Render the game information
    game_info_div.innerHTML = render_game_info(game);

    // Make the join game button enabled if the user is logged in
    if (document.getElementById(JOIN_GAME_BUTTON_ID)) {
        document.getElementById(JOIN_GAME_BUTTON_ID).removeAttribute("disabled");
    }

    // Populate the modal with the game information
    document.getElementById(JOIN_GAME_MODAL_GAME_ID).value = game.game_id;
    document.getElementById(JOIN_GAME_MODAL_INFO_ID).innerHTML = render_game_info(game);

});
