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
let GAME_ID = window.location.pathname.split("/")[2];
let GAME_OBJECT;
let THIS_PLAYER;

// Global variables for the tx-nav and the current article
let CURRENT_ARTICLE;
let CURRENT_PRICE;
let ARTICLE_DATA_OBJECT;
let PAGEVIEWS_DATA_OBJECT;
let CURRENT_TIMESPAN = "month";
let PRICE_CHANGE;
let ARTICLE_ALLOWED = true;
let ALLOWED_REASON = "";

// Used by the leaderboard mainly -- contains player objects :)
let ALL_PLAYERS = [];

// Create the loading elements -- functions defined in the scripts that manage the actual elements
loading_graph(CURRENT_ARTICLE, CURRENT_TIMESPAN);
loading_leaderboard();
loading_portfolio();
loading_trending();

// Call api/get_play_info to get the game and player objects -- this is also used globally!
fetch("/api/get_play_info/" + GAME_ID + "?get_random_articles=true", {method: 'GET'})
.then(response => response.json())
.then(data => {

    // Set the global variables for the game and player objects
    GAME_OBJECT = data["game"];
    THIS_PLAYER = data["player"];
    console.log(GAME_OBJECT);
    console.log(THIS_PLAYER);

    // Set game title to the game name!
    document.getElementById(GAME_NAME_ID).innerHTML = ` to ${GAME_OBJECT["name"]}`;

    // Set the random article
    CURRENT_ARTICLE = data["random_articles"][0];

    // Initialize different parts of the page with functions from other scripts (run all of these asyncronously)
    init_settings(); // defined in play-page-settings.js
    init_tx_nav(); // defined in play-page-tx-nav.js
    init_leaderboard(); // defined in play-page-leaderboard.js
    init_portfolio(); // defined in play-page-portfolio.js
    init_trending(); // defined in play-page-trending.js
    init_chat(); // defined in play-page-chat.js
    init_players(); // defined in play-page-players.js

    // There's nothing in play-page-inputs.js to run :)
    // It just adds event listeners and defines onclick functions for the buttons
    // The other scripts do that too, but they need to wait for the game data to load first
});


