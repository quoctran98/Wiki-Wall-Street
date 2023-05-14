/*
    This script has the functions to load the portfolio summary on the play page
*/

// IDS FOR HTML ELEMENTS
const PORTFOLIO_SUMMARY_ID = "portfolio-summary"
const PORTFOLIO_CASH_ID = "portfolio-cash"
const PORTFOLIO_VALUE_ID = "portfolio-value"
const PORTFOLIO_CARD_DECK = "portfolio-card-deck"

function format_price(p) {
    p = Math.round(p);
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

function generate_portfolio_card(article_name, n_owned, avg_buy_price) {

    card_html = `
    <a href="javascript:load_into_search('${article_name}')">
        <div class="card portfolio-card">
            <h6 class="card-title"> 
                ${article_name} (${n_owned})
            </h6>
            <p class="card-text">
                <span>Avg Price: ${format_price(avg_buy_price)}</span>
            </p>
        </div>
    </a>
    `;

    return(card_html);
}

// Load in the player's portfolio summary -- called by play-page-main.js
async function init_portfolio(game=GAME_OBJECT , player=THIS_PLAYER) {
    
    // Load cash and portfolio value into the HTML
    // This information comes form api/get_play_info called on the main page load
    const cash = format_price(player["cash"]);
    document.getElementById(PORTFOLIO_CASH_ID).innerHTML = cash;
    const value = format_price(player["today_value"]);
    document.getElementById(PORTFOLIO_VALUE_ID).innerHTML = value;

    // Load the cards for each article into the HTML
    for (let article_name in player["articles"]) {
        let avg_buy_price = player["avg_price"][article_name];
        let n_owned = player["articles"][article_name];
        if (n_owned > 0) {
            let card = generate_portfolio_card(article_name, n_owned, avg_buy_price);
            document.getElementById(PORTFOLIO_CARD_DECK).insertAdjacentHTML("beforeend", card);
        }
    }
}

