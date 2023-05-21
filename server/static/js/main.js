/*
    This script is called in every page of the website.
    Use it to define functions that are used in multiple pages.
*/

// This is used a lot, so let's just define it here
function format_price(p) {
    // Round the price to the nearest integer or at least 3 significant figures
    if (p < 1000) {
        p = Math.round(p);
    } else {
        p = Math.round(p / 100) * 100;
    }
    return(p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
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

// Makes an HTML sentence out of the game information 
function render_game_info(game) {

    // Format the player list
    let player_list = "";
    for (let i = 0; i < game.players.length; i++) {
        // Could be more elegant, but this lets me underline everything
        if (i === game.players.length - 1) {
            player_list += ", and ";
        }
        player_list += `<ins>${game.players[i]}</ins>`;
        if (i < game.players.length - 2) {
            player_list += ", ";
        }
    }

    // Create the HTML with players and some settings
    let game_info_html = `
        <h2>Join <ins>${game.name}</ins>!</h2>
        <p> 👥 Play with ${player_list} </p>
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
        if (game.settings["allowed_categories"][0]!= "") {
            const allowed_categories = game.settings["allowed_categories"].filter((category) => category != "");
            const theme_list = allowed_categories.map((category) => `<ins>${category}</ins>`).join(", ");
            game_info_html += `<p> 📚 Only buy articles from the ${theme_list} Wikipedia ${allowed_categories.length > 1 ? "categories" : "category"} </p>`;   
        }
    }

    // Add banned categories to the HTML
    if ("banned_categories" in game.settings) {
        if (game.settings["banned_categories"][0]!= "") {
            const banned_categories = game.settings["banned_categories"].filter((category) => category != "");
            const ban_list = banned_categories.map((category) => `<ins>${category}</ins>`).join(", ");
            game_info_html += `<p> 🚫 Don't buy articles from the ${ban_list} Wikipedia ${banned_categories.length > 1 ? "categories" : "category"} </p>`;
        }
    }

    return(game_info_html);
}