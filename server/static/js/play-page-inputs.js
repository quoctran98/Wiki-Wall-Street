/* 
    This page defines functions that are called by the play page HTML elements.

    This doesn't doesn't include any of the logic that happens when a search is made --
    it only interfaces the user inputs with that logic! And the server!

    Examples of when functions are called:

    - When the user clicks the "Buy" button, the buy_article() function is called.
        This function sends a request to the server to make a new transaction.

    - When the user clicks the "Search" button (or does anything else), the search_article() function is called.
        This initiates the logic in server/static/js/play-page-tx-nav.js

    - When the user clicks any of the article names in the trending articles section or modals, etc.,
        the load_into_search() function is called. This function loads the article name into the search bar.
*/

// Used when any buy and sell buttons are clicked
async function new_tx(n, tx_type) {
    
    // Disable all the buy and sell buttons
    for (let i = 0; i < ALL_TX_BUTTONS.length; i++) {
        document.getElementById(ALL_TX_BUTTONS[i]).setAttribute("disabled", true);
    }

    // The server takes the price and quantity, so we need to calculate those
    // Price (total) xor quantity can be negative
    if (tx_type === "buy") {
        price = CURRENT_PRICE * n * -1;
        quantity = n;
    } else if (tx_type === "sell") {
        price = CURRENT_PRICE * n;
        quantity = n * -1;
    } else {
        alert("new_tx() called with invalid tx_type!");
        return(false);
    }

    // Send the POST request to the server
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
        alert("Something went wrong!")
        console.log(res)
    }

    // Reload the page if the transaction was successful!
    let reload_url = window.location.href;
    reload_url += `?article=${encodeURIComponent(CURRENT_ARTICLE)}`;
    window.location.href = reload_url;
}

// Used when the timespan buttons above the graph are clicked
async function graph_time(timespan) {

    // Set the timespan and then run the search logic
    CURRENT_TIMESPAN = timespan;
    load_article(CURRENT_ARTICLE);
    
    // Disable the button that was clicked
    for (let i = 0; i < GRAPH_TIME_BUTTON_IDS.length; i++) {
        this_button_id = GRAPH_TIME_BUTTON_IDS[i];
        if (this_button_id.includes(CURRENT_TIMESPAN)) {
            document.getElementById(this_button_id).setAttribute("disabled", true);
        } else {
            document.getElementById(this_button_id).removeAttribute("disabled");
        }
    }
        
}

// Used when the search bar is being used -- udpates the datalist
async function search_article() {

    // Should add in a little rate-limit of some sort here!

    // Get search suggestions from the server
    const search_input = document.getElementById(SEARCH_ID).value;
    const search_url = "/api/search_article/" + GAME_OBJECT.game_id + "/" + search_input;
    let serach_res = await fetch(search_url, { method: "GET" })
    if (serach_res.status !== 200) {
        console.log("Something went wrong!");
        return(false);
    }

    // Update the datalist with suggestions from the server
    const search_data = await serach_res.json()
    let suggestions = search_data.suggestions;
    // Filter out duplicates (I don't know why there are duplicates, but there are)
    suggestions = suggestions.filter((suggestion, index) => suggestions.indexOf(suggestion) === index);
    let datalist_html = suggestions.map(suggestion => `<option value="${suggestion}">`).join("");
    document.getElementById(SEARCH_DATALIST_ID).innerHTML = datalist_html;
}

// Used when the user presses a button that loads an article into the tx-nav
function load_into_search(article, timespan=CURRENT_TIMESPAN) {

    // Close all Bootstrap modals
    $(".modal").modal("hide");
    
    // Set global variables! This is important!
    CURRENT_ARTICLE = article;
    CURRENT_TIMESPAN = timespan; 

    // Run search logic
    document.getElementById(SEARCH_ID).value = article;
    load_article(article); 
}
