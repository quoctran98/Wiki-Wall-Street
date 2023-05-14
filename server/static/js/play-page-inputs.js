/* 

This page defines functions that are called by the play page HTML elements.

This doesn't doesn't include any of the logic that happens when a search is made --
it only interfaces the user inputs with that logic! And the server

THIS RELIES ON GLOBAL VARIABLES DEFINED IN server/static/js/play-page-tx-nav.js
THAT SCRIPT MUST BE RUN BEFORE THIS ONE!

Examples of when functions are called:

- When the user clicks the "Buy" button, the buy_article() function is called.
    This function sends a request to the server to make a new transaction.

- When the user clicks the "Search" button (or does anything else), the search_article() function is called.
    This initiates the logic in server/static/js/play-page-tx-nav.js

- When the user clicks any of the article names in the trending articles section or modals, etc.,
    the load_into_search() function is called. This function loads the article name into the search bar.

*/

async function new_tx(n, tx_type) {
    // Disable all the buy and sell buttons
    for (let i = 0; i < ALL_TX_BUTTONS.length; i++) {
        document.getElementById(ALL_TX_BUTTONS[i]).setAttribute("disabled", true);
    }

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
    reload_url = window.location.href.split("?")[0];
    reload_url += `?game_id=${GAME_OBJECT.game_id}&article=${encodeURIComponent(CURRENT_ARTICLE)}`;
    window.location.href = reload_url;
}

async function graph_time(timespan) {
    CURRENT_TIMESPAN = timespan;
    load_article(CURRENT_ARTICLE);
    
    // disable the button that was clicked
    for (let i = 0; i < GRAPH_TIME_BUTTON_IDS.length; i++) {
        this_button_id = GRAPH_TIME_BUTTON_IDS[i];
        if (this_button_id.includes(CURRENT_TIMESPAN)) {
            document.getElementById(this_button_id).setAttribute("disabled", true);
        } else {
            document.getElementById(this_button_id).removeAttribute("disabled");
        }
        
    }
        
}

async function search_article() {
    // This function updates the datalist with suggestions from the server
    // Uses the globals: SEARCH_ID and SEARCH_DATALIST_ID (DOM element IDs)

    // Get search suggestions from the server
    const search_input = document.getElementById(SEARCH_ID).value;
    const search_url = "/api/search_article?query=" + search_input;
    let serach_res = await fetch(search_url, { method: "GET" })
    if (serach_res.status !== 200) {
        console.log("Something went wrong!");
        return(false);
    }

    // Update the datalist with suggestions from the server
    const search_data = await serach_res.json()
    const suggestions = search_data.suggestions;
    let datalist_html = suggestions.map(suggestion => `<option value="${suggestion}">`).join("");
    document.getElementById(SEARCH_DATALIST_ID).innerHTML = datalist_html;
}

function load_into_search(article, timespan=CURRENT_TIMESPAN) {
    // Set global variables! This is important!
    CURRENT_ARTICLE = article;
    CURRENT_TIMESPAN = timespan; 

    document.getElementById(SEARCH_ID).value = article;
    load_article(article); 
    // This initates the logic in server/static/js/play-page-tx-nav.js
}
