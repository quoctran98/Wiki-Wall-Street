/* 
    This script manages the /play page and calls all the scripts to make it work!
    Scripts: play-page-tx-nav, play-page-inputs, play-page-leaderborard, play-page-portfolio, play-page-trending
    These are all mainly independent, but rely on the same global variables -- defined here!
    These scripts define functions (and maybe bind listeners) but don't run anything on their own.
    However, each script also define their own HTML element IDs so it's not too messy. 
*/

// Some IDs for HTML divs that are used by this script only :)
const GAME_NAME_ID = "game-name";

// Global variables for the current game and player
let GAME_ID = window.location.search.split("=")[1].split("&")[0];
let GAME_OBJECT;
let THIS_PLAYER;

// Global variables for the tx-nav and the current article
let CURRENT_ARTICLE = "Minecraft";
let CURRENT_PRICE;
let ARTICLE_DATA_OBJECT;
let PAGEVIEWS_DATA_OBJECT;
let CURRENT_TIMESPAN = "month";
let PRICE_CHANGE;
let ARTICLE_ALLOWED = true;

// Used by the leaderboard mainly -- contains player objects :)
let ALL_PLAYERS = [];

// This is used a lot, so let's just define it here
function format_price(p) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p);
    } else {
        p = Math.round(p / 100) * 100;
    }
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

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


// Call api/get_play_info to get the game and player objects -- this is also used globally!
fetch("/api/get_play_info?game_id=" + GAME_ID, {method: 'GET'})
.then(response => response.json())
.then(data => {
    GAME_OBJECT = data["game"];
    THIS_PLAYER = data["player"];

    // Set game title to the game name!
    document.getElementById(GAME_NAME_ID).innerHTML = ` to ${GAME_OBJECT["name"]}`;

    // Initialize the page with functions from other scripts
    // Run all of these async!
    init_settings(); // defined in play-page-settings.js
    init_tx_nav(); // defined in play-page-tx-nav.js
    init_leaderboard(); // defined in play-page-leaderboard.js
    init_portfolio(); // defined in play-page-portfolio.js
    init_trending(); // defined in play-page-trending.js

    // There's nothing in play-page-inputs.js to run :)
});


