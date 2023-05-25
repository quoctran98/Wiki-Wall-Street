// This script manages the graph, search bar, and buy/sell buttons on the play page.
// This is called by static/js/play-page-inputs.js for many different events.

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
const GRAPH_PRICE_ID = "graph-price";
const GRAPH_DESC_ID = "graph-desc";

// Transaction div elements (when the player owns an article)
const PLAYER_ART_INFO = "article-info";

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

// Let's add a bunch of loading elements to the page!
// Wrapping in a function to avoid global variables and so we can call it again later
function loading_graph(article="Article", timespan="month") {
    // Graph title 
    document.getElementById(GRAPH_TITLE_ID).innerHTML = `
        <a>${article}</a>
    `;
    // Graph description
    document.getElementById(GRAPH_DESC_ID).innerHTML = `
        <p>Loading <img class="inline-image" src="/static/img/loading.gif" alt="Loading"></p>
    `;

    // Make fake timestamps and views
    let n_days;
    if (timespan == "week") {
        n_days = 7;
    } else if (timespan == "month") {
        n_days = 30;
    } else if (timespan == "year") {
        n_days = 365;
    } else if (timespan == "all") {
        n_days = 365 * 5;
    }
    let timestamps = [];
    let views = [];
    let date = new Date();
    for (let i = 0; i < n_days; i++) {
        timestamps.push(new Date(date.getFullYear(), date.getMonth(), date.getDate() - i));
        // Make views follow a random walk
        if (i == 0) {
            views.push(Math.round(Math.random() * 1000) + 1000);
        } else {
            let last_view = views[views.length - 1];
            let new_view = Math.round(last_view * (1 + (Math.random() - 0.5) / 10));
            views.push(new_view);
        }
    }

    const plot_data = [{x: timestamps, y: views, type: "scatter"}];
    const plot_layout = {margin:{t: 10},xaxis: {type: "date",},yaxis: {title: "Page Views",},};
    const graph_div = document.getElementById(GRAPH_DIV_ID);

    // Clear the div (of loading gif) and plot the graph
    graph_div.innerHTML = "";
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});

    // Make it blurry
    graph_div.classList.add("blurred-container");
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
        let percent_change = Math.round(((price - player.avg_price[article]) / player.avg_price[article]) * 1000) / 10;
        let absolute_change = (price - player.avg_price[article]) * player.articles[article];
        document.getElementById(PLAYER_ART_INFO).innerHTML = `
            You own <b>${player.articles[article]}</b> of this article, 
            bought at an average price of <b>${format_price(player.avg_price[article])}</b>!
            <br>
            It's <b>${(percent_change > 0)? "up 📈" : "down 📉"} ${percent_change}%</b> since you bought it,
            and you would <b>${(absolute_change > 0)? "make" : "lose"} ${format_price(absolute_change)}</b> if you sold it now!
        `;    
        
        // Reveal sell div and update sell buttons with current price
        document.getElementById(SELL_DIV_ID).style.display = "block";
        sell_1_button.innerHTML = `Sell 1 for ${format_price(price)}`; 
        // This button is always enabled or the div is hidden, so no need to disable it :)
        sell_1_button.removeAttribute("disabled"); // It's disabled before the page loads :)
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
        document.getElementById(PLAYER_ART_INFO).innerHTML = "";
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
    const plot_layout = {
        margin:{t: 10},
        xaxis: {type: "date",},
        yaxis: {title: "Page Views",},};
    const graph_div = document.getElementById(GRAPH_DIV_ID);

    // Clear the div (of loading gif) and plot the graph
    graph_div.innerHTML = "";
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});

    // Remove the blurry effect
    graph_div.classList.remove("blurred-container");
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
    
    if (allowed == false) {
        let banned_reason;
        if (ALLOWED_REASON == "banned_categories") {
            banned_reason = "in banlist";
        } else if (ALLOWED_REASON == "views_limit") {
            banned_reason = "too few views";
        } else if (ALLOWED_REASON == "allowed_categories") {
            banned_reason = "not in game theme";
        } else {
            banned_reason = "citation needed";
        }
        citation_needed_html = `
            <sup data-toggle="tooltip" title data-original-title="quoc">
                <a href="/help"><span style="color:red;">[<em>${banned_reason}</em>]</span></a>
            </sup>
        `;
        title_html += citation_needed_html;
    }
    
    let price_html = `${format_price(CURRENT_PRICE)} (${(PRICE_CHANGE > 0)? "📈" : "📉"} ${PRICE_CHANGE}%)`;
    let short_desc = article_data.short_desc;

    // Update the title and description
    document.getElementById(GRAPH_TITLE_ID).innerHTML = title_html;
    document.getElementById(GRAPH_PRICE_ID).innerHTML = price_html;
    document.getElementById(GRAPH_DESC_ID).innerHTML = short_desc;
}

// This makes all the necessary API calls and updates the page!
// It also updates the global variables based on the inputs and API calls :)
async function load_article (article_name=null) {

    // Get the article name from the search bar if it's not passed as an argument
    if (article_name == null) {

        // Make the first item of the datalist the actual search term if it doesn't match!
        // Check to see if the datalist has any suggestions
        if (document.getElementById(SEARCH_DATALIST_ID).firstChild == null) {
            // If not, just set the article name to the search bar value
            article_name = document.getElementById(SEARCH_ID).value;
        } else {
            // If so, set the article name to the first suggestion and set the search bar value to that
            article_name = document.getElementById(SEARCH_DATALIST_ID).firstChild.value;
            document.getElementById(SEARCH_ID).value = article_name;
        }
        CURRENT_ARTICLE = article_name;
    }

    // Make the graph loading again
    loading_graph(CURRENT_ARTICLE, CURRENT_TIMESPAN);

   // Do all the API calls up top, then update the page at the end
   Promise.all([
        fetch(`/api/allowed_article?game_id=${GAME_OBJECT.game_id}&article=${article_name}`),
        fetch(`/api/article_price?article=${article_name}&timespan=${CURRENT_TIMESPAN}`),
        fetch(`/api/article_information?article=${article_name}`)
    ]).then(async function (responses) {
        // Get a JSON object from each of the responses
        const allowed_res = await responses[0].json();
        const price_res = await responses[1].json();
        const article_res = await responses[2].json();

        // Update the global variables
        ARTICLE_ALLOWED = allowed_res.allowed;
        ALLOWED_REASON = allowed_res.reason;
        PAGEVIEWS_DATA_OBJECT = price_res;
        CURRENT_PRICE = price_res.views[price_res.views.length-1]; // DON'T ROUND THIS! It's used for calculations!
        PRICE_CHANGE = Math.round(((price_res.views[price_res.views.length-1] - price_res.views[0]) / price_res.views[0]) * 1000) / 10;
        ARTICLE_DATA_OBJECT = article_res;

        console.log(ARTICLE_DATA_OBJECT.categories);

        // Set custom sell input to how many articles the player owns
        // We can't do that in update_trade_buttons() because that's called when the input changes
        if (article_name in THIS_PLAYER.articles) {
            document.getElementById(CUSTOM_SELL_INPUT_ID).value = THIS_PLAYER.articles[article_name];
        } // Don't need to catch any issues because the whole div is hidden usually :)

        // Update the page with the new article
        update_article_info(ARTICLE_DATA_OBJECT, PAGEVIEWS_DATA_OBJECT, ARTICLE_ALLOWED);
        update_graph(PAGEVIEWS_DATA_OBJECT, CURRENT_TIMESPAN);
        update_trade_buttons(CURRENT_ARTICLE, CURRENT_PRICE, THIS_PLAYER, ARTICLE_ALLOWED);

    }).catch(function (error) {
        console.log(error);
    });
}

// Let's bind all the event listeners!
// And load an article into the search -- called by play-page-main.js
// This requires GAME_OBJECT and THIS_PLAYER to have been defined already (from play-page-main.js)
async function init_tx_nav() {

    // Load the current article into the search bar when the page loads
    document.getElementById(SEARCH_ID).value = CURRENT_ARTICLE;

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

    // Add an event listener to datalist to search on click
    // I can't do this???

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

