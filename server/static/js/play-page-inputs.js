/* 
    This page defines functions that are called by the play page HTML elements.

    This doesn't doesn't include any of the logic that happens when a search is made --
    it only interfaces the user inputs with that logic! And the server!
*/

// Used when any buy and sell buttons are clicked
async function new_tx(n, tx_type) {
    
    // Disable all the buy and sell buttons (class .btn-buy and .btn-sell)
    $(".btn-buy").attr("disabled", true);
    $(".btn-sell").attr("disabled", true);

    // The server takes the price and quantity, so we need to calculate those
    // Total price XOR quantity can be negative
    if (tx_type === "buy") {
        price = CURRENT_PRICE * n * -1;
        quantity = n;
    } else if (tx_type === "sell") {
        price = CURRENT_PRICE * n;
        quantity = n * -1;
    } else {
        console.log("new_tx() called with invalid tx_type!");
        window.location.reload();
    }

    // Send the POST request to the server (not a form!)
    const tx_url = "/api/new_transaction";
    const tx_res = await fetch(tx_url, {
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({
            game_id: GAME_OBJECT.game_id,
            player_id: THIS_PLAYER.player_id,
            article: CURRENT_ARTICLE,
            price: price,
            quantity: quantity,
        }),
    });
    if (tx_res.status !== 200) {
        console.log("Something went wrong!");
        console.log(tx_res);
        window.location.reload();
    }

    // Reload the page if the transaction was successful!
    let reload_url = window.location.href.split("?")[0];
    reload_url += `?article=${encodeURIComponent(CURRENT_ARTICLE)}`;
    if (window.location.href !== reload_url) {
        window.location.replace(reload_url);
    } else {
        window.location.reload();
    }
}

// Used when the timespan buttons above the graph are clicked
async function graph_time(timespan) {
    
    // Set the timespan and then run the search logic
    CURRENT_TIMESPAN = timespan;
    load_article(CURRENT_ARTICLE); // defined in play-page-tx-nav.js

    // Disable the button that was clicked (from all buttons in div #timespan-selectors)
    $("#timespan-selectors button").attr("disabled", false);
    $(`#timespan-selectors #${timespan}`).attr("disabled", true);
}

// Used when the search bar is being used -- udpates the datalist
async function search_article() {

    // Should add in a little rate-limit of some sort here!
    // Nah! The server is okay with it :)

    // Get search suggestions from the server
    const search_input = $("#tx-div #search-input").val();
    const search_url = `/api/search_article/${GAME_OBJECT.game_id}/${search_input}`;
    let serach_res = await fetch(search_url, { method: "GET" })
    if (serach_res.status !== 200) {
        console.log("Something went wrong!");
        return(false);
    }

    // Update the datalist with suggestions from the server
    const search_data = await serach_res.json()
    let suggestions = search_data.suggestions;

    // Filter out duplicates (I don't know why there are duplicates, but there are) and update the datalist
    suggestions = suggestions.filter((suggestion, index) => suggestions.indexOf(suggestion) === index);
    let datalist_html = suggestions.map(suggestion => `<option value="${suggestion}">`).join("");
    $("#tx-div #search-datalist").html(datalist_html);
}

// Used when the user presses a button that loads an article into the tx-nav
function load_into_search(article, timespan=CURRENT_TIMESPAN) {

    // Close all Bootstrap modals
    $(".modal").modal("hide");
    
    // Set global variables! This is important!
    CURRENT_ARTICLE = article;
    CURRENT_TIMESPAN = timespan; 

    // Run search logic
    $("#tx-div #search-input").val(article);
    load_article(article); 
}
