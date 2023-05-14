// This script manages the graph, search bar, and buy/sell buttons on the play page.
// This is called by static/js/play-page-inputs.js for many different events.

// But also this script NEEDS to be run first -- it declares all the global variables!

// IDS FOR HTML ELEMENTS

const NAVIGATOR_DIV_ID = "transaction-navigator";
// Search bar, datalist, and button elements
const SEARCH_ID = "search-input";
const SEARCH_BUTTON_ID = "search-button";
const SEARCH_DATALIST_ID = "search-datalist";

// Title, description, buttons, and graph elements
const GRAPH_TIME_BUTTON_IDS = ["graph-week-button", "graph-month-button", "graph-year-button", "graph-all-button"];
const GRAPH_DIV_ID = "transaction-graph";
const GRAPH_TITLE_ID = "graph-title";
const GRAPH_DESC_ID = "graph-desc";

// Transaction div elements (when the player owns an article)
const PLAYER_ART_INFO_N = "num-owned";
const PLAYER_ART_INFO_AVG_BUY = "avg-price";

// Buttons and input for buying
const BUY_1_BUTTON_ID = "buy-1-button";
const BUY_5_BUTTON_ID = "buy-5-button";
const BUY_CUSTOM_BUTTON_ID = "buy-custom-button";
const CUSTOM_BUY_INPUT_ID = "custom-buy-input";
const ALL_BUY_BUTTONS = [BUY_1_BUTTON_ID, BUY_5_BUTTON_ID, BUY_CUSTOM_BUTTON_ID];

// Buttons and input for selling
const SELL_DIV_ID = "sell-div";
const SELL_1_BUTTON_ID = "sell-1-button";
const SELL_CUSTOM_BUTTON_ID = "sell-custom-button";
const CUSTOM_SELL_INPUT_ID = "custom-sell-input";
const ALL_SELL_BUTTONS = [SELL_1_BUTTON_ID, SELL_CUSTOM_BUTTON_ID];
const ALL_TX_BUTTONS = ALL_BUY_BUTTONS.concat(ALL_SELL_BUTTONS);

// Porfolio summary banner elements
// const PORTFOLIO_SUMMARY_ID = "portfolio-summary"
// const PORTFOLIO_CASH_ID = "portfolio-cash"
// const PORTFOLIO_VALUE_ID = "portfolio-value"
// const PORTFOLIO_CARD_DECK = "portfolio-card-deck"

// Leaderboard elements
// const LEADERBOARD_CARD_DECK = "leaderboard-card-deck";

// Global variables for the current game and loaded article
let GAME_ID = window.location.search.split("=")[1].split("&")[0];
let GAME_OBJECT;
let THIS_PLAYER;

let CURRENT_ARTICLE = "Minecraft";
let CURRENT_PRICE;
let ARTICLE_DATA_OBJECT;
let PAGEVIEWS_DATA_OBJECT;

let CURRENT_TIMESPAN = "month";
let PRICE_CHANGE;

let ARTICLE_ALLOWED = true;

function format_price(p) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p);
    } else {
        p = Math.round(p / 100) * 100;
    }
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

// Update the buy/sell buttons! And the information about the player buying the article!
function update_trade_buttons(article=CURRENT_ARTICLE, price=CURRENT_PRICE, player=THIS_PLAYER, allowed=ARTICLE_ALLOWED) {

    // Getting the DOM elements and custom buy/sell values
    let custom_buy = document.getElementById(CUSTOM_BUY_INPUT_ID).value;
    let custom_sell = document.getElementById(CUSTOM_SELL_INPUT_ID).value;

    const buy_1_button = document.getElementById(BUY_1_BUTTON_ID);
    const buy_5_button = document.getElementById(BUY_5_BUTTON_ID);
    const buy_custom_button = document.getElementById(BUY_CUSTOM_BUTTON_ID);
    const sell_1_button = document.getElementById(SELL_1_BUTTON_ID);
    const sell_custom_button = document.getElementById(SELL_CUSTOM_BUTTON_ID);

    // Update buy buttons with current price
    buy_1_button.innerHTML = `Buy 1 for ${format_price(price)}`;
    buy_5_button.innerHTML = `Buy 5 for ${format_price(price * 5)}`;
    buy_custom_button.innerHTML = `Buy ${custom_buy} for ${format_price(price * custom_buy)}`;

    // Disable buy buttons if player doesn't have enough cash (or custom buy is not an integer)
    // Ugh, I can't do this elegantly since HTML boolean attributes aren't actually boolean
    if (price > player.cash) {
        buy_1_button.setAttribute("disabled", true);
        buy_5_button.setAttribute("disabled", true);
    } else if (price * 5 > player.cash) {
        buy_1_button.removeAttribute("disabled");
        buy_5_button.setAttribute("disabled", true);
    } else {
        buy_1_button.removeAttribute("disabled");
        buy_5_button.removeAttribute("disabled");
    }
    if (custom_buy * price > player.cash) {
        buy_custom_button.setAttribute("disabled", true);
    } else if (custom_buy % 1 != 0) {
        buy_custom_button.setAttribute("disabled", true);
    } else {
        buy_custom_button.removeAttribute("disabled");
    }

    // This would have been so elegant :)
    // buy_1_button.setAttribute("disabled", (price > player.cash));
    // buy_5_button.setAttribute("disabled", (price * 5 > player.cash));
    // buy_custom_button.setAttribute("disabled", ((custom_buy * price > player.cash) || (custom_buy % 1 != 0)));

    // Reveal sell div if player owns article and update sell buttons with current price
    if (article in player.articles && player.articles[article] > 0) {
        // Update the player's article info (number owned and average buy price)
        const owned_html = `Number Owned: ${player.articles[article]}`;
        document.getElementById(PLAYER_ART_INFO_N).innerHTML = owned_html;
        const avg_buy_html = `Average Buy Price: ${format_price(player.avg_price[article])}`;
        document.getElementById(PLAYER_ART_INFO_AVG_BUY).innerHTML = avg_buy_html;
        
        // Reveal sell div and update sell buttons with current price
        document.getElementById(SELL_DIV_ID).style.display = "block";
        sell_1_button.innerHTML = `Sell 1 for ${format_price(price)}`; 
        // This button is always enabled or the div is hidden, so no need to disable it :)
        sell_custom_button.innerHTML = `Sell ${custom_sell} for ${format_price(price * custom_sell)}`;

        // Disable sell buttons if player doesn't own enough of the article
        if (custom_sell > player.articles[article] || custom_sell % 1 != 0) {
            sell_custom_button.setAttribute("disabled", true);
        } else {
            sell_custom_button.removeAttribute("disabled");
        }
 
    } else {

        // Hide sell div if player doesn't own article at all
        document.getElementById(SELL_DIV_ID).style.display = "none";

        // Reset the player's article info (number owned and average buy price)
        document.getElementById(PLAYER_ART_INFO_N).innerHTML = "";
        document.getElementById(PLAYER_ART_INFO_AVG_BUY).innerHTML = "";
    }

    // Disable buy buttons if article is not allowed in this game (selling is always allowed, I guess)
    if (!allowed) {
        buy_1_button.setAttribute("disabled", true);
        buy_5_button.setAttribute("disabled", true);
        buy_custom_button.setAttribute("disabled", true);
    } // Don't enable because that's the default assumption above :)
}

// Update the graph with the current article
function update_graph(pageviews_data=PAGEVIEWS_DATA_OBJECT, timespan="month") {
    
    // Disable the timespan buttons that are already selected (should only be one)
    for (let i = 0; i < GRAPH_TIME_BUTTON_IDS.length; i++) {
        this_button_id = GRAPH_TIME_BUTTON_IDS[i];
        if (this_button_id.includes(timespan)) {
            document.getElementById(this_button_id).setAttribute("disabled", true);
        } else {
            document.getElementById(this_button_id).removeAttribute("disabled");
        }
    }

    // Parse views and dates from data
    views = pageviews_data.views;
    timestamps = pageviews_data.timestamps;
    for (let i = 0; i < timestamps.length; i++) {
        let year = timestamps[i].substring(0, 4);
        let month = timestamps[i].substring(4, 6);
        let day = timestamps[i].substring(6, 8);
        timestamps[i] = new Date(year, month-1, day);
    }

    // Plot the graph with Plotly
    const plot_data = [{x: timestamps, y: views, type: "scatter"}];
    const plot_layout = {margin:{t: 10},xaxis: {type: "date",},yaxis: {title: "Page Views",},};
    const graph_div = document.getElementById(GRAPH_DIV_ID);
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});
}

// Update the article title and description
function update_article_info(article_data=ARTICLE_DATA_OBJECT, pageviews_data=PAGEVIEWS_DATA_OBJECT, allowed=ARTICLE_ALLOWED) {

    // Calculate price change and update global variables
    // It shouldn't acually change since we're loading the same article, but just in case?
    const views = pageviews_data.views;
    CURRENT_PRICE = views[views.length-1]; // DON'T ROUND THIS! It's used for calculations!
    PRICE_CHANGE = Math.round(((views[views.length-1] - views[0]) / views[0]) * 1000) / 10;

    const wikipedia_url = `http://en.wikipedia.org/wiki?curid=${article_data.pageid}`;
    let title_html = `<a href="${wikipedia_url}" target="_blank" rel="noopener noreferrer">${article_data.title}</a>:`
    title_html += ` ${format_price(CURRENT_PRICE)} (${(PRICE_CHANGE > 0)? "📈" : "📉"} ${PRICE_CHANGE}%)`;
    if (allowed == false) {
        title_html = `<s>${title_html}</s>`;
    }
    let short_desc = article_data.short_desc;
    if (allowed == false) {
        short_desc = `<s>${short_desc}</s>`;
        short_desc += "<br><p style='color:Tomato'>Article is not allowed in this game!</p>"
    }
    
    // Update the title and description
    document.getElementById(GRAPH_TITLE_ID).innerHTML = title_html;
    document.getElementById(GRAPH_DESC_ID).innerHTML = short_desc;
}

// This makes all the necessary API calls and updates the page!
// It also updates the global variables based on the inputs and API calls :)
async function load_article (article_name=null) {

   // Do all the API calls up top (maybe not the most efficient, but it works for now)
   // We're down to only three!

    // Get the article name from the search bar if it's not passed as an argument
    if (article_name == null) {
        article_name = document.getElementById(SEARCH_ID).value;
        CURRENT_ARTICLE = article_name;
    }

    // Check if article is allowed in this game
    allowed_url = "/api/allowed_article?game_id=" + GAME_OBJECT.game_id;
    allowed_url += "&article=" + article_name;
    let res_allowed = await fetch(allowed_url, {method: 'GET'})
    if (res_allowed.status !== 200) {
        alert("Something went wrong calling api/allowed_article!");
        return(false);
    }
    res_allowed = await res_allowed.json()
    ARTICLE_ALLOWED = res_allowed.allowed;

    // Get price/pageviews data for article
    price_url = "/api/article_price?article=" + article_name;
    price_url += "&timespan=" + CURRENT_TIMESPAN;
    let res_price = await fetch(price_url, {method: 'GET'})
    if (res_price.status !== 200) {
        alert("Something went wrong calling api/article_price!");
        return(false);
    }
    res_price = await res_price.json()
    PAGEVIEWS_DATA_OBJECT = res_price;
    CURRENT_PRICE = res_price.views[res_price.views.length-1];
    PRICE_CHANGE = Math.round(((res_price.views[res_price.views.length-1] - res_price.views[0]) / res_price.views[0]) * 1000) / 10;

    // Get article information
    article_url = "/api/article_information?article=" + article_name;
    let res_article = await fetch(article_url, {method: 'GET'})
    if (res_article.status !== 200) {
        alert("Something went wrong calling api/article_info!");
        return(false);
    }
    res_article = await res_article.json()
    ARTICLE_DATA_OBJECT = res_article;

    // Set custom sell input to how many articles the player owns
    // We can't do that in update_trade_buttons() because that's called when the input changes
    if (article_name in THIS_PLAYER.articles) {
        document.getElementById(CUSTOM_SELL_INPUT_ID).value = THIS_PLAYER.articles[article_name];
    } // Don't need to catch any issues because the whole div is hidden usually :)

    // Update the page with the new article
    update_article_info(ARTICLE_DATA_OBJECT, PAGEVIEWS_DATA_OBJECT, ARTICLE_ALLOWED);
    update_graph(PAGEVIEWS_DATA_OBJECT, CURRENT_TIMESPAN);
    update_trade_buttons(CURRENT_ARTICLE, CURRENT_PRICE, THIS_PLAYER, ARTICLE_ALLOWED);
}

// Let's bind all the event listeners!
// And load an article into the search!
async function initialize() {

    // Load the current article into the search bar when the page loads
    document.getElementById(SEARCH_ID).value = CURRENT_ARTICLE;
    
    // GET game and player objects from server
    const init_url = "/api/get_play_info?game_id=" + GAME_ID;
    let init_info = await fetch(init_url, {method: 'GET'})
    init_info = await init_info.json();
    GAME_OBJECT = init_info.game;
    THIS_PLAYER = init_info.player;

    // Add event listeners to the search bar
    // The search button also calls load_article() when clicked (see HTML)
    // I accidentally add an event listener to the search button here and it broke it in a weird way
    // It made update_graph() display the timestamp as a JS date object only when it ran the second time?
    document.getElementById(SEARCH_ID).addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById(SEARCH_BUTTON_ID).click();
        } else {
            search_article(); // This does the datalist updating stuff :)
        }
    });

    // Add event listeners to the custom buy/sell inputs
    document.getElementById(CUSTOM_BUY_INPUT_ID).addEventListener("input", function() {
        update_trade_buttons(); 
        // If we pass the function name alone to the event listener, it doesn't work :(
        // It passes the event object as the first argument, which is why we need this wrapper function
    });
    document.getElementById(CUSTOM_SELL_INPUT_ID).addEventListener("input", function() {
        update_trade_buttons();
    });

    // Preload the article if it's in the URL (otherwise it's Minecraft)
    if (window.location.search.includes("article=")) {
        CURRENT_ARTICLE = decodeURIComponent(window.location.search.split("article=")[1].split("&")[0]);
        document.getElementById(SEARCH_ID).value = CURRENT_ARTICLE;
    } 

    load_article();
}

// Run the initialize function when the page loads
// This is the first script that should load (maybe packages and stuff)
window.onload = initialize;
