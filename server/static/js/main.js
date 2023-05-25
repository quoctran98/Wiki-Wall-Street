/*
    This script is called in every page of the website.
    Use it to define functions that are used in multiple pages.
*/

// Enable bootstrap tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

// This is used a lot, so let's just define it here
function format_price(p, imprecise=false, include_icon=true) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p * 100) / 100;
    } else {
        p = Math.round(p);
    }

    // If the price can be imprecise, use k, M, B, T, etc.
    string = "";
    if (include_icon) {
        string += "<i class='bi-cash-coin'></i> ";
    }

    if (imprecise) {
        if (p < 1000) {
            return(string + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
        } else if (p < 1000000) {
            return(string + (p / 1000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k")
        } else if (p < 1000000000) {
            return(string + (p / 1000000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "M")
        } else if (p < 1000000000000) {
            return(string + (p / 1000000000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "B")
        }
    }
    return(string + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
}

function format_value(p, imprecise=false, include_icon=true) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p * 100) / 100;
    } else {
        p = Math.round(p);
    }

    // If the value can be imprecise, use k, M, B, T, etc.
    string = "";
    if (include_icon) {
        string += "<i class='bi-piggy-bank-fill'></i> ";
    }

    if (imprecise) {
        if (p < 1000) {
            return(string + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
        } else if (p < 1000000) {
            return(string + (p / 1000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k")
        } else if (p < 1000000000) {
            return(string + (p / 1000000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "M")
        } else if (p < 1000000000000) {
            return(string + (p / 1000000000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "B")
        }
    }
    return(string + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
    
}

// Call this function to close all modals
function close_all_modals() {
    let modals = document.getElementsByClassName("modal");
    for (let i = 0; i < modals.length; i++) {
        modals[i].style.display = "none";
    }
    unblur_background();
}

// Call blur_background() when any modals are opened
function blur_background() {
    let to_blur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_blur.length; i++) {
        to_blur[i].style = `
            -webkit-filter: blur(5px);
            -moz-filter: blur(5px);
            -o-filter: blur(5x);
            -ms-filter: blur(5px);
            filter: blur(5px);
        `;
    }
}

// Call unblur_background() when any modals are closed
function unblur_background() {
    let to_unblur = document.getElementsByClassName("gets-blurred");
    for (let i = 0; i < to_unblur.length; i++) {
        to_unblur[i].style = `
            -webkit-filter: blur(0px);
            -moz-filter: blur(0px);
            -o-filter: blur(0px);
            -ms-filter: blur(0px);
            filter: blur(0px);
        `;
    }
}

function format_players_list(players, order="random") {
    // Order the players
    if (order == "random") {
        // Shuffle the players
        for (let i = players.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
    } else if (order == "alphabetical") {
        players.sort();
    }

    // Format the player list
    let players_list = "";
    for (let i = 0; i < players.length; i++) {
        players_list += `
            <a href="/profile/${encodeURIComponent(players[i])}">${players[i]}</a>`;
        if (i < players.length - 1 && players.length > 2) {
            players_list += ", ";
        }
        if (i == players.length - 2 && players.length > 2) {
            players_list += "and ";
        } else if (i == players.length - 2 && players.length > 1) {
            players_list += " and ";
        }
    }
    return(players_list);
}

// Makes an HTML sentence out of the game information 
function render_game_info(game) {

    // Create the HTML with players and some settings
    let game_info_html = `
        <h2>Join <ins>${game.name}</ins>!</h2>
        <p> 👥 Play with ${format_players_list(game.players)} </p>
        <p> ⚙️ You'll start with <ins>${format_price(game.settings.starting_cash)}</ins> cash
    `;

    // Add the rest of the settings to the HTML (visibility info)
    const visible_info = Object.keys(game.settings).filter((key) => game.settings[key] === true);
    if (visible_info.length > 0) {
        game_info_html += 
        `and you'll be able to see other players ${(game.settings["show_cash"]) ? "<ins>cash</ins>" : ""}
            ${(game.settings["show_cash"] && (game.settings["show_articles"])) ? "and" : ""}
            ${(game.settings["show_articles"]) ? "<ins>owned articles</ins>" : ""} 
            ${(game.settings["show_number"]) ? "(and <ins>how many</ins> they own!)" : "!"} 
        </p>
        `;
    } else {
        game_info_html += `!</p>`;
    }

    // Add theme(s) to the HTML (allowed categories)
    if ("allowed_categories" in game.settings) {
        console.log(game.settings["allowed_categories"])
        // The server SHOULD store it as an empty array and remove the empty string, but just in case
        if (game.settings["allowed_categories"][0]!== "" && game.settings["allowed_categories"].length > 0) {
            const allowed_categories = game.settings["allowed_categories"].filter((category) => category != "");
            const theme_list = allowed_categories.map((category) => `<ins>${category}</ins>`).join(", ");
            game_info_html += `<p> 📚 Only buy articles from the ${theme_list} Wikipedia ${allowed_categories.length > 1 ? "categories" : "category"} </p>`;   
        }
    }

    // Add banned categories to the HTML
    if ("banned_categories" in game.settings) {
        if (game.settings["banned_categories"][0]!== "" && game.settings["banned_categories"].length > 0) {
            const banned_categories = game.settings["banned_categories"].filter((category) => category != "");
            const ban_list = banned_categories.map((category) => `<ins>${category}</ins>`).join(", ");
            game_info_html += `<p> 🚫 Don't buy articles from the ${ban_list} Wikipedia ${banned_categories.length > 1 ? "categories" : "category"} </p>`;
        }
    }

    return(game_info_html);
}

// Ugh, this is such a bad way to prevent XSS attacks
// Used mainly when rendering chat messages
function escape_html(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}