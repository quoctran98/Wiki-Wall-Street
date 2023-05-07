const PORTFOLIO_SUMMARY_ID = "portfolio-summary"
const PORTFOLIO_CASH_ID = "portfolio-cash"
const PORTFOLIO_VALUE_ID = "portfolio-value"
const PORTFOLIO_CARD_DECK = "portfolio-card-deck"

// get game id from url query string
let GAME_ID = window.location.search.split("=")[1].split("&")[0];

// there's another glboal variable called GAME ugh!
let PORTFOLIO_GAME; 
let PORTFOLIO_PLAYER;

function format_price(p) {
    p = Math.round(p);
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

function generate_card(article_name, n_owned, avg_buy_price) {
    let card = document.createElement("div");
    card.classList.add("card");
    card.classList.add("mb-3");
    card.classList.add("portfolio-card");    

    let card_body = document.createElement("div");
    card_body.classList.add("card-body");

    let card_title = document.createElement("h6");
    card_title.classList.add("card-title");
    card_title.innerHTML = `<a href="javascript:load_into_search('${article_name}')">${article_name} (${n_owned})</a>`

    let card_text = document.createElement("p");
    card_text.classList.add("card-text");
    card_text.innerHTML =  `
        <span class="portfolio-card-avg-price">Avg Price: ${format_price(avg_buy_price)}</span>
    `;

    card_body.appendChild(card_title);
    card_body.appendChild(card_text);
    card.appendChild(card_body);

    return(card);
}

async function cash_and_value(game, player) {
    // load current cash and value
    cash = format_price(Math.round(player["cash"]));
    document.getElementById(PORTFOLIO_CASH_ID).innerHTML = cash;
    value_url = `/api/portfolio_value?game_id=${game["game_id"]}&player_id=${player["player_id"]}`;
    value = await fetch(value_url, { method: "GET" });
    value = await value.json();
    document.getElementById(PORTFOLIO_VALUE_ID).innerHTML = format_price(Math.round(value["value"]));
}

async function initialize_portfolio_summary(game_id) {
    // get game and player objects from server
    play_info = await fetch("/api/get_play_info", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            "game_id": GAME_ID
        })
    });
    play_info = await play_info.json();
    PORTFOLIO_PLAYER = play_info["player"];
    PORTFOLIO_GAME = play_info["game"];
    
    // load cash and value (async?)
    cash_and_value(PORTFOLIO_GAME, PORTFOLIO_PLAYER);
    
    // load portfolio cards
    for (let article_name in PORTFOLIO_PLAYER["articles"]) {
        let avg_buy_price = PORTFOLIO_PLAYER["avg_price"][article_name];
        let n_owned = PORTFOLIO_PLAYER["articles"][article_name];
        if (n_owned > 0) {
            let card = generate_card(article_name, n_owned, avg_buy_price);
            document.getElementById(PORTFOLIO_CARD_DECK).appendChild(card);
        }
    }
}

initialize_portfolio_summary(GAME_ID);
