// This script manages the leaderboard at the top of the play page and the player information modal
// Should be pretty independent of the rest of the page, but should still run after play-page-tx-nav.js
// Uses the global variable GAME_ID and maybe GAME_OBJECT?

// IDS FOR HTML ELEMENTS

// Leaderboard banner and player information modal elements
const LEADERBOARD_CARD_DECK = "leaderboard-card-deck";
const PLAYER_INFO_MODAL = "player-leaderboard-modal";
const PLAYER_INFO_MODAL_TITLE = "player-leaderboard-modal-title";
const PLAYER_INFO_MODAL_RANK = "player-leaderboard-modal-rank";
const PLAYER_INFO_MODAL_VALUE = "player-leaderboard-modal-value";
const PLAYER_INFO_MODAL_CASH = "player-leaderboard-modal-cash";
const PLAYER_INFO_MODAL_ARTICLES = "player-leaderboard-modal-articles";

const PLAYER_INFO_MODAL_CLOSE_SYMBOL = "player-leaderboard-modal-close-symbol";
const PLAYER_INFO_MODAL_CLOSE_BUTTON = "player-leaderboard-modal-close-button";

// Global variable to store all the player objects -- this is set when the leaderboard is loaded
let ALL_PLAYERS = [];

// This is called when a player's name is clicked on the leaderboard
function show_player_info_modal(player_id) {

    const this_player = ALL_PLAYERS.find(p => p.player_id === player_id);
    const rank = ALL_PLAYERS.indexOf(this_player) + 1;

    // Set the info in the modal!
    document.getElementById(PLAYER_INFO_MODAL_TITLE).innerHTML = this_player.name;
    document.getElementById(PLAYER_INFO_MODAL_RANK).innerHTML = rank;
    document.getElementById(PLAYER_INFO_MODAL_VALUE).innerHTML = format_price(Math.round(this_player.value));

    // Set the cash if it exists (i.e. hidden in this game)
    if (this_player.cash) {
        document.getElementById(PLAYER_INFO_MODAL_CASH).innerHTML = "<h6>CASH! </h6><p>" + format_price(Math.round(this_player.cash)) + "</p>";
    }

    // Set the articles if they exist
    if (this_player.articles) {
        let articles_html = `
            <div class="row"><h6>ARTICLES! </h6></div> 
            <div class="row"><ul>`;
        let articles = this_player.articles;
        for (let article_name in articles) {
            // Check if the value is a number -- will be boolean if amount is hidden
            const maybe_number = articles[article_name];
            const clickable_article_name = `<a href="javascript:load_into_search('${article_name}')">${article_name}</a>`;
            if (typeof maybe_number !== "number") {
                articles_html += `<li>${clickable_article_name}</li>`;
            } else {
                articles_html += `<li>${clickable_article_name} (${maybe_number})</li>`;
            }
        }
        articles_html += "</ul></div>";
        document.getElementById(PLAYER_INFO_MODAL_ARTICLES).innerHTML = articles_html;
    }
    
    // Show the modal!
    document.getElementById(PLAYER_INFO_MODAL).style.display = "block";
}

function leaderboard_card (player) {
    let daily_change = (player.value - player.yesterday_value) / player.yesterday_value;
    daily_change = Math.round(daily_change * 10000) / 100;

    let card_html = `
        <a href="#" onclick="show_player_info_modal('${player.player_id}');return(false);">
        <div class="card leaderboard-card">
            <h6 class="card-title"> 
                ${player.name} (${format_price(Math.round(player.value))})
            </h6>
            <p class="card-text">
                ${(daily_change > 0)? "📈" : "📉"} ${daily_change}%
            </p>
        </div>
        </a>
    `;

    return(card_html);
}

// Add event listener to close symbol and button :)
document.getElementById(PLAYER_INFO_MODAL_CLOSE_SYMBOL).onclick = (() => {
    document.getElementById(PLAYER_INFO_MODAL).style.display = "none";
});
document.getElementById(PLAYER_INFO_MODAL_CLOSE_BUTTON).onclick = (() => {
    document.getElementById(PLAYER_INFO_MODAL).style.display = "none";
});

async function load_leaderboard() {

    // Make a request to the server to get the leaderboard
    const lboard_url = "/api/leaderboard?game_id=" + GAME_ID;
    let lboard_res = await fetch(lboard_url, {method:"GET"});
    lboard_res = await lboard_res.json();
    ALL_PLAYERS = lboard_res.players;

    console.log(ALL_PLAYERS);

    for (let i = 0; i < ALL_PLAYERS.length; i++) {
        const player = ALL_PLAYERS[i];
        const card = leaderboard_card(player);
        document.getElementById(LEADERBOARD_CARD_DECK).insertAdjacentHTML("beforeend", card);
    }

} 

load_leaderboard();
