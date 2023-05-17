/*
    This script has the functions to load the portfolio summary on the play page
*/

// IDS FOR HTML ELEMENTS
const PORTFOLIO_CASH_ID = "title-cash"
const PORTFOLIO_BANNER = "portfolio-banner"

function portfolio_card(article_name, n_owned, avg_buy_price) {

    let card_html = `
        <a href="#" onclick="javascript:load_into_search('${article_name}');return(false);">
        <div class="portfolio-card" role="alert">
            ${article_name}
            <br>
            ${n_owned} bought @ ${format_price(avg_buy_price)}
        </div>
        </a>
    `;
    
    return(card_html);
}

// Load in the player's portfolio summary -- called by play-page-main.js
async function init_portfolio(game=GAME_OBJECT , player=THIS_PLAYER) {
    
    // Load cash into the HTML
    // This information comes form api/get_play_info called on the main page load
    let cash_html = `You have <ins>${format_price(player["cash"])}</ins> in cash.`;
    document.getElementById(PORTFOLIO_CASH_ID).innerHTML = cash_html;

    // Remove loading spinner
    document.getElementById(PORTFOLIO_BANNER).innerHTML = "";

    // Load the cards for each article into the HTML
    total = 0;
    for (let article_name in player["articles"]) {
        let avg_buy_price = player["avg_price"][article_name];
        let n_owned = player["articles"][article_name];
        if (n_owned > 0) {
            total += n_owned;
            let card = portfolio_card(article_name, n_owned, avg_buy_price);
            document.getElementById(PORTFOLIO_BANNER).insertAdjacentHTML("beforeend", card);
        }
    }

    // If player has no articles, display a message
    if (total == 0) {
        document.getElementById(PORTFOLIO_BANNER).innerHTML = "You don't own any article -- buy some!";
    }
}
