/* 
    This script has the functions to load in the leaderboard at the top of the play page 
    And also to load in the player information modal
*/

// Leaderboard banner and elements
const LEADERBOARD_BANNER = "leaderboard-banner";
const TITLE_RANK_SPAN = "title-rank";

// Called when the leaderboard is loading
function loading_leaderboard() {
    // Add a loading card to the leaderboard banner
    let leaderboard_loading_card = `
    <div class="leaderboard-card lb-loading" role="alert">
    <div class="blurred-container">
        Leaderboard
        <br>
        Loading <img class="inline-image" src="/static/img/loading.gif" alt="Loading">
    </div>
    </div>
    `;
    for (let i = 0; i < 10; i++) {
        document.getElementById(LEADERBOARD_BANNER).insertAdjacentHTML("beforeend", leaderboard_loading_card);
    }
}

// Returns the suffix for a number (e.g. 1st, 2nd, 3rd, 4th, etc.)
function get_rank_suffix(rank) {
    if (rank === 11 || rank === 12 || rank === 13) {
        return("th");
    }
    const last_num = rank % 10;
    if (last_num === 1) {
        return("st");
    } else if (last_num === 2) {
        return("nd");
    } else if (last_num === 3) {
        return("rd");
    } else {
        return("th");
    }
}

// This is called when a player's name is clicked on the leaderboard
function show_player_info_modal(player_id) {

    // Find the player object and their rank
    const this_player = ALL_PLAYERS.find(p => p.player_id === player_id);
    const rank = ALL_PLAYERS.indexOf(this_player) + 1;

    // Set the info in the modal!
    $("#leaderboard-modal .modal-title").html(`<ins>${this_player.name}</ins>'s Portfolio`);

    // Calculate the daily and weekly change
    let yesterday_change = (this_player.value - this_player.yesterday_value) / this_player.yesterday_value;
    yesterday_change = Math.round(yesterday_change * 10000) / 100;
    let last_week_change = (this_player.value - this_player.last_week_value) / this_player.last_week_value;
    last_week_change = Math.round(last_week_change * 10000) / 100;

    // Set the summary in the modal! (with cash if it exists and articles if they exist)
    $("#leaderboard-modal #summary-sentence").html(`
        ${this_player.name} is in <ins>${rank}${get_rank_suffix(rank)}</ins> place
        with a portfolio value of <ins>${format_value(this_player.value)}</ins>
        
        ${this_player.cash? "and <ins>" + format_price(this_player.cash) + "</ins> in cash" : ""}!

        <br>
        <br>

        Their portfolio has gone <ins>${(yesterday_change > 0)? "up" : "down"} by ${Math.abs(yesterday_change)}%</ins> in the last day
        and <ins>${(last_week_change > 0)? "up" : "down"} by ${Math.abs(last_week_change)}%</ins> in the last week.
        
        ${this_player.articles? `<hr> Here are the articles they own:` : ""}
    `);

    // Set the articles if they exist
    if (this_player.articles) {
        let articles_html = "<ul>";
        let articles = this_player.articles;
        for (let article_name in articles) {
            // Check if the value is a number -- will be boolean if amount is hidden
            const maybe_number = articles[article_name];
            const clickable_article_name = `
                <a href="javascript:load_into_search('${article_name}');
                close_all_modals();">
                    ${article_name}
                </a>`;
            if (typeof maybe_number !== "number") {
                articles_html += `<li>${clickable_article_name}</li>`;
            } else {
                articles_html += `<li>${clickable_article_name} (${maybe_number})</li>`;
            }
        }
        articles_html += "</ul></div>";
        $("#leaderboard-modal #articles-list").html(articles_html);
    }
    
    // Show the modal!
    $("#leaderboard-modal").modal("show");
}

// Generates HTML for a single player's card on the leaderboard
function leaderboard_card (player) {

    // Calculate the daily change from public player data sent :)
    let daily_change = (player.value - player.yesterday_value) / player.yesterday_value;
    daily_change = Math.round(daily_change * 10000) / 100;

    // Generate the HTML for the card
    let card_html = `
        <a href="#" onclick="show_player_info_modal('${player.player_id}');return(false);">
        <div class="leaderboard-card lb-${(daily_change > 0)? "up" : "down"}" role="alert">
            ${player.name}
            <br>
            ${format_value(player.value, imprecise=true)}
            (${(daily_change > 0)? "📈" : "📉"} ${daily_change}%)
        </div>
        </a>
    `;

    return(card_html);
}

// Load the leaderboard onto the page -- called by play-page-main.js
async function init_leaderboard() {

    // Make a request to the server to get the leaderboard
    const lboard_url = "/api/leaderboard?game_id=" + GAME_ID;
    let lboard_res = await fetch(lboard_url, {method:"GET"});
    lboard_res = await lboard_res.json();
    ALL_PLAYERS = lboard_res.players;

    // Remove the loading card
    document.getElementById(LEADERBOARD_BANNER).innerHTML = "";

    // Set the title rank
    const rank = ALL_PLAYERS.indexOf(ALL_PLAYERS.find(p => p.player_id === THIS_PLAYER.player_id)) + 1;
    document.getElementById(TITLE_RANK_SPAN).innerHTML = `You are in 
        <ins>${rank}${get_rank_suffix(rank)}</ins>
         place!`;

    for (let i = 0; i < ALL_PLAYERS.length; i++) {
        const player = ALL_PLAYERS[i];
        const card = leaderboard_card(player);
        document.getElementById(LEADERBOARD_BANNER).insertAdjacentHTML("beforeend", card);
    }
} 
