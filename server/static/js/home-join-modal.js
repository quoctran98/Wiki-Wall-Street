/*
    This script handles the logic for the join game modal on the home page.
    All of the create game modal logic is in the HTML since it's just a form
    and I think I have to insert this script into the modal directly.
*/

// This makes a sentence out of the game information
// Ugh, this is repeated in invite-page.js but doesn't feel important enough to put in main.js
function render_game_info(game) {
    // Format game information as strings
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
    const visible_info = Object.keys(game.settings).filter((key) => game.settings[key] === true);

    // Create the HTML
    let game_info_html = `
        <h2>Join <ins>${game.name}</ins>!</h2>
        <p> 👥 Play with ${player_list} </p>
        <p> ⚙️ You'll start with <ins>${format_price(game.settings.starting_cash)}</ins> cash
    `;

    // Add the settings to the HTML
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
    return(game_info_html);
}

// Join game modal: search for game
document.getElementById("join-game-modal-search").onclick = (() => {
    // Replace the info with a loading spinner
    document.getElementById("join-game-modal-info").innerHTML = `Loading game information <img class="inline-image" src="/static/img/loading.gif" alt="Loading spinner">`;
    const game_id = document.getElementById("join-game-modal-game-id").value;
    // Get the game information and render it
    fetch("/api/get_invite_info?game_id=" + game_id)
    .then((response) => response.json())
    .then((game_res) => {
        const game = game_res.game;
        if (game) {
            const game_info_div = document.getElementById("join-game-modal-info");
            game_info_div.innerHTML = render_game_info(game);
            document.getElementById("join-game-modal-join").removeAttribute("disabled");
        } else {
            document.getElementById("join-game-modal-info").innerHTML = "Game not found :(";
            document.getElementById("join-game-modal-join").disabled = true;
        }
    });
});
