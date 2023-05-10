const NAVIGATOR_DIV_ID = "transaction-navigator";
const SEARCH_ID = "search-input";
const SEARCH_DATALIST_ID = "search-datalist";

const GRAPH_TIME_BUTTON_IDS = ["graph-week-button", "graph-month-button", "graph-year-button", "graph-all-button"];

const GRAPH_DIV_ID = "transaction-graph";
const GRAPH_TITLE_ID = "graph-title";
const GRAPH_DESC_ID = "graph-desc";

const PLAYER_ART_INFO_N = "num-owned";
const PLAYER_ART_INFO_AVG_BUY = "avg-price";

const BUY_1_BUTTON_ID = "buy-1-button";
const BUY_5_BUTTON_ID = "buy-5-button";
const BUY_CUSTOM_BUTTON_ID = "buy-custom-button";
const CUSTOM_BUY_INPUT_ID = "custom-buy-input";

const SELL_DIV_ID = "sell-div";
const SELL_1_BUTTON_ID = "sell-1-button";
const SELL_CUSTOM_BUTTON_ID = "sell-custom-button";
const CUSTOM_SELL_INPUT_ID = "custom-sell-input";

// global variables for when tx form is generated
let PLAYER;
let GAME;
let current_article = "Minecraft";
let current_price = 0;
let current_timespan = "month";

function format_price(p) {
    p = Math.round(p);
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

async function buy_article(n) {
    const url = "/api/new_transaction";
    const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({
            game_id: GAME.game_id,
            player_id: PLAYER.player_id,
            article: current_article,
            price: current_price * n * -1,
            quantity: n,
        }),
    });

    if (res.status === 200) {
        let reload_url = window.location.href;
        reload_url = window.location.href.split("?")[0];
        reload_url += `?game_id=${GAME.game_id}&article=${encodeURIComponent(current_article)}`;
        window.location.href = reload_url;
    } else {
        alert("Something went wrong!")
        console.log(res)
    }
}

async function sell_article(n) {
    const url = "/api/new_transaction";
    const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({
            game_id: GAME.game_id,
            player_id: PLAYER.player_id,
            article: current_article,
            price: current_price * n,
            quantity: n * -1,
        }),
    }); 

    if (res.status === 200) {
        let reload_url = window.location.href;
        reload_url = window.location.href.split("?")[0];
        reload_url += `?game_id=${GAME.game_id}&article=${encodeURIComponent(current_article)}`;
        window.location.href = reload_url;
    } else {
        alert("Something went wrong!")
        console.log(res)
    }
}

async function search_article() {
    const search_input = document.getElementById(SEARCH_ID).value;
    const url = "/api/search_article?query=" + search_input;
    const res = await fetch(url, { method: "GET" })
    if (res.status !== 200) {
        return(false);
    }

    // update datalist with suggestions
    const data = await res.json()
    const suggestions = data.suggestions;
    datalist_html = suggestions.map(suggestion => `<option value="${suggestion}">`).join("");
    document.getElementById(SEARCH_DATALIST_ID).innerHTML = datalist_html;

    // return search input if it's in suggestions (to do other stuff)
    if (suggestions.includes(search_input)) {
        return(search_input);
    } else {
        return(false);
    }
}

async function graph_time(timespan) {
    // bad way to implement this but it works
    const price_info = await update_tx_navigator(current_article, timespan);
    set_title(price_info.article, price_info.monthly_change, price_info.current_price);

    // set global variable
    current_timespan = timespan;
    
    // disable the button that was clicked
    for (let i = 0; i < GRAPH_TIME_BUTTON_IDS.length; i++) {
        this_button_id = GRAPH_TIME_BUTTON_IDS[i];
        if (this_button_id.includes(timespan)) {
            document.getElementById(this_button_id).setAttribute("disabled", true);
        } else {
            document.getElementById(this_button_id).removeAttribute("disabled");
        }
        
    }
        
}

async function update_tx_navigator(article, timespan="month") {
    
    // disbale the button that was clicked
    for (let i = 0; i < GRAPH_TIME_BUTTON_IDS.length; i++) {
        this_button_id = GRAPH_TIME_BUTTON_IDS[i];
        if (this_button_id.includes(timespan)) {
            document.getElementById(this_button_id).setAttribute("disabled", true);
        } else {
            document.getElementById(this_button_id).removeAttribute("disabled");
        }
    }

    // get monthly view data from server
    url = "/api/pageviews?article=" + article;
    url += "&timespan=" + timespan;
    const res = await fetch(url, {method: 'GET'})
    if (res.status !== 200) {
        return(false);
    }
    const data = await res.json()

    // parse data from server
    views = data.views;
    timestamps = data.timestamps;
    for (let i = 0; i < timestamps.length; i++) {
        let year = timestamps[i].substring(0, 4);
        let month = timestamps[i].substring(4, 6);
        let day = timestamps[i].substring(6, 8);
        timestamps[i] = new Date(year, month-1, day);
    }

    // calculate monthly change
    let monthly_change = (views[views.length-1] - views[0]) / views[0];
    monthly_change = Math.round(monthly_change * 1000) / 10;
    let current_price = Math.round(views[views.length-1])

    // plot data with plotly
    let plot_data = [{
        x: timestamps,
        y: views,
        type: "scatter",
    }];
    let plot_layout = {
        margin:{t: 10},
        xaxis: {type: "date",},
        yaxis: {title: "Page Views",},
    };
    graph_div = document.getElementById(GRAPH_DIV_ID);
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});

    // check if article is allowed (if not, disable buy buttons)
    url = "/api/allowed_article?game_id=" + GAME.game_id;
    url += "&article=" + article;
    let res_allowed = await fetch(url, {method: 'GET'})
    if (res_allowed.status !== 200) {
        return(false);
    }
    res_allowed = await res_allowed.json()
    if (res_allowed.allowed == false) {
        document.getElementById(BUY_1_BUTTON_ID).setAttribute("disabled", true);
        document.getElementById(BUY_5_BUTTON_ID).setAttribute("disabled", true);
        document.getElementById(BUY_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
    }

    // price info for transaction form and graph title
    const price_info = {
        article: article,
        monthly_change: monthly_change,
        current_price: views[views.length-1], 
        allowed: res_allowed.allowed,
        // should use the current_price api but hopefully this is fine
        // we'll double check on the server side and if it doesn't match a lot i'll fix it
    }
    return(price_info);
}

async function set_title(article, monthly_change, current_price, allowed) {

    // get article id for wikipedia link
    url = "/api/article_id?article=" + article;
    const res_id = await fetch(url, {method: 'GET'})
    if (res_id.status !== 200) {
        return(false);
    }
    const data_id = await res_id.json()

    // format current price with commas and round
    current_price = Math.round(current_price);
    current_price = format_price(current_price);
    // ^ copilot is magic for this.

    // update graph title with article name and price (and hyperlink)
    let wikipedia_url = `http://en.wikipedia.org/wiki?curid=${data_id.article_id}`;
    let plot_title = `<a href="${wikipedia_url}" target="_blank" rel="noopener noreferrer">${article}</a>:`
    plot_title += ` ${current_price} (${(monthly_change > 0)? "📈" : "📉"} ${monthly_change}%)`;
    if (allowed == false) {
        plot_title = `<s>${plot_title}</s>`;
    }
    document.getElementById(GRAPH_TITLE_ID).innerHTML = plot_title;

    // get short description
    url = "/api/article_description?article=" + article;
    const res_desc = await fetch(url, {method: 'GET'})
    if (res_desc.status !== 200) {
        return(false);
    }
    let data_desc = await res_desc.json()
    data_desc = data_desc.description;
    if (allowed == false) {
        data_desc = `<s>${data_desc}</s>`;
        data_desc += "<br><p style='color:Tomato'>Article is not allowed in this game!</p>"
    }
    document.getElementById(GRAPH_DESC_ID).innerHTML = data_desc;
}

async function search_main() {
    const search_input = await search_article()

    // if the search input is a real article
    if (search_input != false) {
        const price_info = await update_tx_navigator(search_input, current_timespan);
        // keep timespan the same :)
        
        // use price info from update_tx_navigator to set title and other info for transaction form
        set_title(price_info.article, price_info.monthly_change, price_info.current_price, price_info.allowed);
        current_article = price_info.article;
        current_price = price_info.current_price;

        // update player article info
        player_article_info(current_article, PLAYER);
        
        // update custom sell button text to match number owned
        if (current_article in PLAYER.articles && PLAYER.articles[current_article] > 0) {
            document.getElementById(CUSTOM_SELL_INPUT_ID).value = PLAYER.articles[current_article];
        }

        // update tx buttons
        update_tx_info(price_info.allowed);
    }
}

async function player_article_info(article, player) {
    if (article in player.articles) {

        // display number owned
        let n_owned = player.articles[article];
        let owned_html = `Number Owned: ${n_owned}`;
        document.getElementById(PLAYER_ART_INFO_N).innerHTML = owned_html;
        
        // display average buy price
        let avg_buy_price = player.avg_price[article];
        avg_buy_price = Math.round(avg_buy_price);
        avg_buy_price = format_price(avg_buy_price);
        let avg_html = `Average Buy Price: ${avg_buy_price}`;
        document.getElementById(PLAYER_ART_INFO_AVG_BUY).innerHTML = avg_html;

    } else {

        // clear number owned and average buy price
        document.getElementById(PLAYER_ART_INFO_N).innerHTML = ""
        document.getElementById(PLAYER_ART_INFO_AVG_BUY).innerHTML = "";
    }
}

async function update_tx_info(allowed) {
    let custom_buy = document.getElementById(CUSTOM_BUY_INPUT_ID).value;

    // update buy buttons
    document.getElementById(BUY_1_BUTTON_ID).innerHTML = `Buy 1 for ${format_price(current_price)}`;
    document.getElementById(BUY_5_BUTTON_ID).innerHTML = `Buy 5 for ${format_price(current_price * 5)}`;
    document.getElementById(BUY_CUSTOM_BUTTON_ID).innerHTML = `Buy ${custom_buy} for ${format_price(current_price * custom_buy)}`;

    // disable buy buttons if player doesn't have enough cash
    // this is getting out of hand but copilot is writing it for me so who cares
    if (current_price > PLAYER.cash) {
        document.getElementById(BUY_1_BUTTON_ID).setAttribute("disabled", true);
        document.getElementById(BUY_5_BUTTON_ID).setAttribute("disabled", true);
    } else if (current_price * 5 > PLAYER.cash) {
        document.getElementById(BUY_1_BUTTON_ID).removeAttribute("disabled");
        document.getElementById(BUY_5_BUTTON_ID).setAttribute("disabled", true);
    } else {
        document.getElementById(BUY_1_BUTTON_ID).removeAttribute("disabled");
        document.getElementById(BUY_5_BUTTON_ID).removeAttribute("disabled");
    }

    // separete logic for custom price (with non-integer protection)
    if (custom_buy * current_price > PLAYER.cash) {
        document.getElementById(BUY_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
    } else if (custom_buy % 1 != 0) {
        document.getElementById(BUY_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
    } else {
        document.getElementById(BUY_CUSTOM_BUTTON_ID).removeAttribute("disabled");
    }

    // update sell button if player owns article
    if (current_article in PLAYER.articles && PLAYER.articles[current_article] > 0) {
        let custom_sell = document.getElementById(CUSTOM_SELL_INPUT_ID).value;
        document.getElementById(SELL_DIV_ID).style.display = "block"; // reveal sell div
        document.getElementById(SELL_1_BUTTON_ID).innerHTML = `Sell 1 for ${format_price(current_price)}`;
        document.getElementById(SELL_CUSTOM_BUTTON_ID).innerHTML = `Sell ${custom_sell} for ${format_price(current_price * custom_sell)}`;

        // disable sell buttons if player doesn't own ENOUGH of the article
        // sell 1 button is always enabled (because the whole div is hidden if player doesn't own any)
        if (custom_sell > PLAYER.articles[current_article]) {
            document.getElementById(SELL_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
        } else if (custom_sell % 1 != 0) {
            document.getElementById(SELL_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
        } else {
            document.getElementById(SELL_CUSTOM_BUTTON_ID).removeAttribute("disabled");
        }
    } else {
        document.getElementById(SELL_DIV_ID).style.display = "none"; // hide sell div
    }

    // disable buy buttons if article is not allowed
    // probably be a better way to do this but it's fine with copilot
    if (allowed == false) {
        document.getElementById(BUY_1_BUTTON_ID).setAttribute("disabled", true);
        document.getElementById(BUY_5_BUTTON_ID).setAttribute("disabled", true);
        document.getElementById(BUY_CUSTOM_BUTTON_ID).setAttribute("disabled", true);
    }
}

async function initialize() {
    GAME_ID = window.location.search.split("=")[1].split("&")[0];
    // also defined in portfolio-summary.js
    init_info = await fetch("/api/get_play_info", {
        method: 'POST',
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({game_id: GAME_ID}),
    });
    init_info = await init_info.json();

    PLAYER = init_info.player;
    GAME = init_info.game;

    // add event listener to search input
    document.getElementById(SEARCH_ID).addEventListener("input", search_main);

    // add event listeners to buy and sell inputs
    document.getElementById(CUSTOM_BUY_INPUT_ID).addEventListener("input", update_tx_info);
    document.getElementById(CUSTOM_SELL_INPUT_ID).addEventListener("input", update_tx_info);
    
    // setInterval(search_main, 60000); // run every minute just in case?
    
    // preload an article if there's a query string (or just use a default)
    let urlParams = new URLSearchParams(window.location.search);
    let article = urlParams.get('article');
    if (article != null) {
        document.getElementById(SEARCH_ID).value = decodeURIComponent(article);
    } else {
        document.getElementById(SEARCH_ID).value = "Minecraft";
    }
    search_main()
}

initialize();
