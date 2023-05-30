// This script manages the graph, search bar, and buy/sell buttons on the play page.
// This is called by static/js/play-page-inputs.js for many different events.

// Let's add a bunch of loading elements to the page!
function loading_graph(article="Article", timespan="month") {
    
    // Graph title 
    $("#main-info-div #title").html(`<a>${article}</a>`);
    
    // Graph description
    $("#main-info-div #description").html(`<p>Loading <img class="inline-image" src="/static/img/loading.gif" alt="Loading"></p>`);

    // Make a fake graph only if there isn't one already
    let graph_div = $("#main-info-div #graph")[0] // needs to be a DOM element, not a jQuery object!
    if (graph_div.firstChild === null) {
        fake = fake_data(timespan);
        let color = (fake.views[0] < fake.views[fake.views.length-1])? "#c13030" : "#4668ff";
        const plot_data = [{x: fake.timestamps, y: fake.views, type: "scatter", line:{color: color}}];
        const plot_layout = {margin:{t: 10},xaxis: {type: "date",},yaxis: {title: "Page Views",},};

        // Clear the div (of loading gif) and plot the graph
        Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});
    }

    // Make it blurry (old or new graph)
    graph_div.classList.add("blurred-container");
}

// Update the buy/sell buttons! And the information about the player buying the article!
function update_trade_buttons(article=CURRENT_ARTICLE, price=CURRENT_PRICE, player=THIS_PLAYER, allowed=ARTICLE_ALLOWED) {

    // Getting the DOM elements and custom buy/sell values
    const custom_buy_amt = $("#tx-div #custom-buy-amt").val();
    const custom_sell_amt = $("#tx-div #custom-sell-amt").val();

    // Update buy buttons with current price
    $("#buy-div #buy-1").html(`Buy 1 for ${format_price(price)}`);
    $("#buy-div #buy-5").html(`Buy 5 for ${format_price(price * 5)}`);
    $("#buy-div #buy-custom").html(`Buy ${custom_buy_amt} for ${format_price(price * custom_buy_amt)}`);

    // Disable buy buttons if player doesn't have enough cash (or custom buy is not an integer)
    // I can make this elegant with jQuery! I can treat the attribute like a boolean finally!
    $("#buy-div #buy-1").prop("disabled", (price > player.cash));
    $("#buy-div #buy-5").prop("disabled", (price * 5 > player.cash));
    $("#buy-div #buy-custom").prop("disabled", ((custom_buy_amt * price > player.cash) || (custom_buy_amt % 1 != 0) || (custom_buy_amt == 0)));

    // Reveal sell div if player owns article and update sell buttons with current price
    if (article in player.articles && player.articles[article] > 0) {

        // Make a summary of the player's averae buy price and number owned of the article
        let percent_change = Math.round(((price - player.avg_price[article]) / player.avg_price[article]) * 1000) / 10;
        let absolute_change = (price - player.avg_price[article]) * player.articles[article];
        $("#sell-div #article-info").html(`
            You own <b>${player.articles[article]}</b> of this article, 
            bought at an average price of <b>${format_price(player.avg_price[article])}</b>!
            <br>
            It's <b>${(percent_change > 0)? "up 📈" : "down 📉"} ${percent_change}%</b> since you bought it,
            and you would <b>${(absolute_change > 0)? "make" : "lose"} ${format_price(absolute_change)}</b> if you sold it now!
        `);  

        // Update sell buttons with current price
        $("#sell-div #sell-1").html(`Sell 1 for ${format_price(price)}`);
        $("#sell-div #sell-custom").html(`Sell ${custom_sell_amt} for ${format_price(price * custom_sell_amt)}`);
        
        // Disable sell buttons if player doesn't own enough of the article
        $("#sell-div #sell-1").prop("disabled", (1 > player.articles[article]));
        $("#sell-div #sell-custom").prop("disabled", ((custom_sell_amt > player.articles[article]) || (custom_sell_amt % 1 != 0) || (custom_sell_amt == 0)));

        // Reveal the sell div :)
        $("#sell-div").show();
 
    } else {
        // Hide the sell div and reset the info within for next time :)
        $("#sell-div").hide();
        $("#sell-div #article-info").html("");
    }

    // Disable buy buttons if article is not allowed in this game (selling is always allowed, I guess)
    // Make sure we don't re-enable the buttons if they were disabled for another reason!
    $("#buy-div #buy-1").prop("disabled", !allowed || $("#buy-div #buy-1").prop("disabled"));
    $("#buy-div #buy-5").prop("disabled", !allowed || $("#buy-div #buy-5").prop("disabled"));
    $("#buy-div #buy-custom").prop("disabled", !allowed || $("#buy-div #buy-custom").prop("disabled"));
}

// Update the graph with the current article
function update_graph(pageviews_data=PAGEVIEWS_DATA_OBJECT, timespan="month") {
    
    // Disable the timespan buttons that are already selected (should only be one)
    $(".btn-timespan").each(function() {
        $(this).attr("disabled", ($(this).attr("id").includes(timespan)));
    });

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
    let color = (views[0] > views[views.length-1])? "#c13030" : "#4668ff";
    const plot_data = [{x: timestamps, y: views, type: "scatter", line:{color: color}}];
    const plot_layout = {
        margin:{t: 10},
        xaxis: {type: "date",},
        yaxis: {title: "Normalized Page Views",},};
    // Plotly needs a DOM element, not a jQuery object! (Is this true? Copilot wrote this...)
    let graph_div = $("#main-info-div #graph")[0];
    graph_div.innerHTML = "";
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true});

    // Remove the blurry effect :)
    graph_div.classList.remove("blurred-container");
}

// Update the article title and description
function update_article_info(article_data=ARTICLE_DATA_OBJECT, pageviews_data=PAGEVIEWS_DATA_OBJECT, allowed=ARTICLE_ALLOWED) {

    // Make and set the title HTML
    const wikipedia_url = `http://en.wikipedia.org/wiki?curid=${article_data.pageid}`;
    let title_html = `<a href="${wikipedia_url}" target="_blank" rel="noopener noreferrer">${article_data.title}</a>:`
    // Add a cute little "[citation needed]" thing if the article is not allowed
    switch (ALLOWED_REASON) {
        case "banned_categories":
            citation_needed_text = "in banlist";
            break;
        case "views_limit":
            citation_needed_text = "too few views";
            break;
        case "allowed_categories":
            citation_needed_text = "not in game theme";
            break;
        default:
            citation_needed_text = "citation needed";
            
    $("#main-info-div #title").html(title_html + (allowed? "" : `<sup><a href="/help"><span style="color:#c13030;">[<em>${citation_needed_text}</em>]</span></a></sup>`));
    
    // Make and set the price HTML (and global variables just in case)
    const views = pageviews_data.views;
    CURRENT_PRICE = views[views.length-1]; // DON'T ROUND THIS! It's used for calculations!
    PRICE_CHANGE = Math.round(((views[views.length-1] - views[0]) / views[0]) * 1000) / 10;
    PRICE_CHANGE = (isNaN(PRICE_CHANGE))? 0 : PRICE_CHANGE;
    PRICE_CHANGE = (PRICE_CHANGE == Infinity)? "∞" : PRICE_CHANGE;
    $("#main-info-div #price").html(`${format_price(CURRENT_PRICE)} (${(PRICE_CHANGE > 0)? "📈" : "📉"} ${PRICE_CHANGE}%)`);

    // Make and set the description HTML
    if (article_data.short_desc != null) {
        short_desc = article_data.short_desc;
    } else if (article_data.categories.length > 0) {
        const rand_idx = Math.floor(Math.random() * article_data.categories.length);
        short_desc = `Category: ${article_data.categories[rand_idx]}`;
    } else {
        short_desc = null;
    }
    $("#main-info-div #description").html(short_desc);
}

// This makes all the necessary API calls and updates the page!
// This is called every time a new article is loaded onto the page (from different events)
// This function makes use of mainly global variables (defined in play-page-main.js
async function load_article (article_name=null) {

    // Get the article name from the search bar if it's not passed as an argument
    if (article_name == null) {
        // Make the first item of the datalist the actual search term if it doesn't match! 
        if ($("#tx-div #search-datalist").children().length == 0) {
            article_name = $("#tx-div #search-input").val();
        } else {
            article_name = $("#tx-div #search-datalist").children()[0].value;
            $("#tx-div #search-input").val(article_name);
        }
        // Set the global variable (this should be its own function)
        CURRENT_ARTICLE = article_name;
    }

    // Make the graph loading again (will make it blurry!)
    loading_graph(CURRENT_ARTICLE, CURRENT_TIMESPAN);

   // Do all the API calls up top, then update the page at the end
   Promise.all([
        fetch(`/api/allowed_article/${GAME_OBJECT.game_id}/${article_name}`),
        fetch(`/api/article_price/${article_name}/${CURRENT_TIMESPAN}`),
        fetch(`/api/article_information/${article_name}`)
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

        // This is just fun to look at :)
        console.log(ARTICLE_DATA_OBJECT.categories);

        // Set custom buy input to how many articles the player can afford
        if (CURRENT_PRICE > 0) {
            $("#tx-div #custom-buy-amt").val(Math.floor(THIS_PLAYER.cash / CURRENT_PRICE));
        }

        // Set custom sell input to how many articles the player owns
        if (article_name in THIS_PLAYER.articles) {
            $("#tx-div #custom-sell-amt").val(THIS_PLAYER.articles[article_name]);
        } // Don't need to catch any issues because the whole div is hidden usually :)

        // Update the page with the new article -- call all the update functions!
        update_article_info(ARTICLE_DATA_OBJECT, PAGEVIEWS_DATA_OBJECT, ARTICLE_ALLOWED);
        update_graph(PAGEVIEWS_DATA_OBJECT, CURRENT_TIMESPAN);
        update_trade_buttons(CURRENT_ARTICLE, CURRENT_PRICE, THIS_PLAYER, ARTICLE_ALLOWED);

    }).catch(function (error) {
        console.log(error);
    });
}

// Let's bind all the event listeners and load an article!
// This requires GAME_OBJECT and THIS_PLAYER to have been defined already (from play-page-main.js)
async function init_tx_nav() {

    // Make the loading elements while we set up the page
    loading_graph(CURRENT_ARTICLE);

    // Load the current (random) article into the search bar when the page loads
    $("#tx-div #search-input").val(CURRENT_ARTICLE);

    // Add event listeners to the search bar
    $("#tx-div #search-input").on("keyup", function(event) {
        if (event.keyCode === 13) {
            // Click the search button if enter is pressed :)
            event.preventDefault();
            $("#tx-div #search-button").click();
            search_article() // Mainly to update the URL
        } else {
            // Update the datalist
            search_article(); // defined in play-page-inputs.js (why?)
        }
    });

    // Add event listeners to the custom buy/sell inputs 
    $("#tx-div #custom-buy-amt").on("input", function(event) {
        update_trade_buttons();
    });
    $("#tx-div #custom-sell-amt").on("input", function(event) {
        update_trade_buttons();
    });

    // Load the first article!
    // CURRENT_ARTICLE is defined and set in play-page-main.js
    load_article();
}
