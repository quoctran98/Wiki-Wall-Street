/* 
    This script has the functions to load in the leaderboard at the top of the play page 
    And also to load in the player information modal

    I rolled in the old /static/js/play-page-leaderboard.js and /static/js/play-page-players.js
*/

// Leaderboard banner and elements
const LEADERBOARD_BANNER = "leaderboard-banner";
const TITLE_RANK_SPAN = "title-rank";

// Called when the leaderboard is loading
function loading_leaderboard() {
    // Add a loading card to the leaderboard banner
    let leaderboard_loading_card = `
    <div class="leaderboard-card lb-loading" role="alert">
    <div class="blurred-container">
        Leaderboard
        <br>
        Loading <img class="inline-image" src="/static/img/loading.gif" alt="Loading">
    </div>
    </div>
    `;
    for (let i = 0; i < 10; i++) {
        document.getElementById(LEADERBOARD_BANNER).insertAdjacentHTML("beforeend", leaderboard_loading_card);
    }
}

// This is called when a player's name is clicked on the leaderboard
function show_player_info_modal(player_id) {

    // Find the player object and their rank
    const this_player = ALL_PLAYERS.find(p => p.player_id === player_id);
    const rank = ALL_PLAYERS.indexOf(this_player) + 1;

    // Set the info in the modal!
    $("#leaderboard-modal .modal-title").html(`
        <ins><a href="/profile/${encodeURIComponent(this_player.name)}">${this_player.name}</a></ins>'s Portfolio
    `);

    // Calculate the daily and weekly change
    let yesterday_change = (this_player.value - this_player.yesterday_value) / this_player.yesterday_value;
    yesterday_change = Math.round(yesterday_change * 10000) / 100;
    let last_week_change = (this_player.value - this_player.last_week_value) / this_player.last_week_value;
    last_week_change = Math.round(last_week_change * 10000) / 100;

    // Set the summary in the modal! (with cash if it exists and articles if they exist)
    $("#leaderboard-modal #summary-sentence").html(`
        <a href="/profile/${encodeURIComponent(this_player.name)}">${this_player.name}</a>
         is in <ins>${rank}${get_rank_suffix(rank)}</ins> place
        with a portfolio value of <ins>${format_value(this_player.value)}</ins>
        
        ${this_player.cash? "and <ins>" + format_price(this_player.cash) + "</ins> in cash" : ""}!

        <br>

        Their portfolio has gone <ins>${(yesterday_change > 0)? "up" : "down"} by ${Math.abs(yesterday_change)}%</ins> in the last day
        and <ins>${(last_week_change > 0)? "up" : "down"} by ${Math.abs(last_week_change)}%</ins> in the last week.
    `);

    // Set the articles if they exist
    if (this_player.articles) {
        $("#leaderboard-modal #articles-list-title").html("<hr><h6>Here are the articles they own:</h6>");
        let articles_html = `<ul>`;
        let articles = this_player.articles;
        for (let article_name in articles) {
            // Check if the value is a number -- will be boolean if amount is hidden
            const maybe_number = articles[article_name];
            const clickable_article_name = `
                <a href="javascript:load_into_search('${article_name}');
                close_all_modals();">
                    ${article_name}
                </a>`;
            if (typeof maybe_number !== "number") {
                articles_html += `<li>${clickable_article_name}</li>`;
            } else {
                articles_html += `<li>${clickable_article_name} (${maybe_number})</li>`;
            }
        }
        articles_html += "</ul>";
        $("#leaderboard-modal #articles-list").html(articles_html);
    }

    // Graph the portfolio value
    let values = [];
    let timestamps = [];
    for (let i = 0; i < this_player.value_history.length; i++) {
        values.push(this_player.value_history[i].value);
        timestamps.push(new Date(Date.parse(this_player.value_history[i].timestamp)));
    }
    // Plot with Plotly
    let color = (values[0] > values[values.length-1])? "#c13030" : "#4668ff";
    let plot_data = [{x: timestamps, y: values, type: "line", line:{color: color}}];
    let plot_layout = {
        autosize: true,
        margin:{t: 3, b: 20, l: 40, r: 3},
        xaxis: {type: "date",},
        yaxis: {title: "", range: [0, Math.max(...values) * 1.1]},
    };
    let graph_div = $("#leaderboard-modal #portfolio-graph")[0];
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true, responsive: true});
    
    // Show the modal!
    $("#leaderboard-modal").modal("show");
}

// Generates HTML for a single player's card on the leaderboard
function leaderboard_card (player) {

    // Calculate the daily change from public player data sent :)
    let daily_change = (player.value - player.yesterday_value) / player.yesterday_value;
    daily_change = Math.round(daily_change * 10000) / 100;

    // Generate the HTML for the card
    let card_html = `
        <a href="#" onclick="show_player_info_modal('${player.player_id}');return(false);">
        <div class="leaderboard-card lb-${(daily_change > 0)? "up" : "down"}" role="alert">
            ${player.name}
            <br>
            ${format_value(player.value, imprecise=true)}
            (${(daily_change > 0)? "📈" : "📉"} ${daily_change}%)
        </div>
        </a>
    `;

    return(card_html);
}

function copy_link(div_id) {
    const text = document.getElementById(div_id);
    text.select(); 
    text.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(text.value);
}

async function kick_player(player_name) {
    $("#players-modal #players-list").css("color", "gray");
    $("#players-modal #players-list").css("pointer-events", "none");

    // Close this modal and open the confirm modal
    $("#players-modal").modal("hide");
    $("#kick-confirm-modal").modal("show");

    // Fill out the confirm modal info
    $("#kick-confirm-modal #kick-confirm-form #game-id").val(GAME_OBJECT.game_id);
    $("#kick-confirm-modal #kick-confirm-form #player-name").val(player_name);
}

function render_players_list(game, players) {
    const is_owner = game.owner_id == THIS_PLAYER.user_id;
    const players_list = $("#players-modal #players-list")[0];
    players_list.innerHTML = "";

    // Add the players to the list
    // Iterate through game.players, so it's in order of joined?
    for (let i = 0; i < game.players.length; i++) {
        const player = players.find(p => p.name === game.players[i]);
        // Get rank of player -- sort ALL_PLAYERS by value (should already be sorted but just in case)
        ALL_PLAYERS.sort((a, b) => b.value - a.value);
        // get index of player in ALL_PLAYERS (search by player_id)
        let rank = ALL_PLAYERS.indexOf(ALL_PLAYERS.find(p => p.player_id === player.player_id)) + 1;
        rank = rank + get_rank_suffix(rank);

        const is_self = player.name == THIS_PLAYER.name;
        const profile_link = window.location.origin + "/profile/" + encodeURIComponent(player.name);

        let time_joined = new Date(Date.parse(player.time_joined))
        // add a day for approxiamte time (because of today_wiki)
        time_joined = time_joined.toLocaleDateString(undefined,{month: "short", day: "numeric"});
        const is_new = (new Date() - new Date(Date.parse(player.time_joined)) < 5 * 24 * 60 * 60 * 1000)


        // Make the HTML for the player row and add it to the list
        let player_html = `
        <div class="player-modal-row" id="player-${player.name}">
            <div class="row" style="margin: -1em;">
                <img class="inline-image" src="/static/img/default-profile.png"></img>
                <ins><a href="${profile_link}">${player.name}</a></ins>
                <p>&nbsp;</p> is in&nbsp;<ins>${rank} place</ins>&nbsp;with&nbsp;
                <a href="#" onclick="show_player_info_modal('${player.player_id}'); $('#players-modal').modal('hide');">
                    ${format_value(player.value, imprecise=true)}
                </a>
                ${(is_new)? `<p>&nbsp;</p><span style="color:#c13030;">New!</span>` : ""}
            </div>
            <div class="row" style="margin: -1em;">
                <p>Joined ${time_joined}</p> 
                <p>&nbsp;</p>
                ${(is_owner && !is_self) ? `<i class="bi-x-circle-fill players-kick-player" onclick="kick_player('${player.name}')"></i><p>&nbsp;</p>` : ""}
                <i class="bi-person-plus-fill players-add-friend"></i>
            </div>
            <br>
        </div>

        `;
        
        players_list.innerHTML += player_html;
    }
}

// Should be called after we get leaderbard data from the server :)
// Copy and pasted from /play-page-players.js (no longer called)
// We need ALL_PLAYERS to be defined!
async function init_players_mdoal() {
    // Fill out the modal title
    $("#players-modal .modal-title").html(`
        There ${(GAME_OBJECT.players.length == 1)? "is" : "are"}
        <ins>${GAME_OBJECT.players.length}</ins>
        ${(GAME_OBJECT.players.length == 1)? "player" : "players"} 
        in <ins>${GAME_OBJECT.name}</ins>
    `);

    // Add event listener when the players modal is open
    $("#players-modal").on("show.bs.modal", function() {

        // Add an invite link that copies to clipboard
        const invite_link = window.location.origin + "/invite/" + GAME_OBJECT.game_id;
        $("#players-modal #invite-link").val(invite_link);

        // Render the players list
        render_players_list(GAME_OBJECT, ALL_PLAYERS);

    });

    // Add event listener to leave game button
    $("#players-modal #leave-game-button").on("click", function() {
        // Fill out the confirm modal info
        $("#leave-confirm-modal #leave-confirm-form #game-id").val(GAME_OBJECT.game_id);
        // Hide this modal and open the confirm modal
        $("#players-modal").modal("hide");
        $("#leave-confirm-modal").modal("show");
    });

    // Check if there are new players to diplay notif
    // Sucks that I do this mutliple times, but who cares -- it's nothing
    let unchecked_events = [];
    for (ev in GAME_OBJECT.new_events) {
        new_event_time = new Date(Date.parse(GAME_OBJECT.new_events[ev]));
        if (ev in THIS_PLAYER.last_checked) {
            last_checked_time = new Date(Date.parse(THIS_PLAYER.last_checked[ev]));
        } else {
            last_checked_time = new Date(0);
        }
        if (new_event_time > last_checked_time) {
            unchecked_events.push(ev);
        }
    }

    // Add the notif if there are new players
    if (unchecked_events.includes("player")) {
        $("#players-modal-open-button").append(`
            <span id="players-notif" class="badge bg-danger rounded-pill position-absolute top-0 end-0 p-10">!</span>
        `);
    }

    // Add event listener to the player modal to remove the notif
    $("#players-modal").on("show.bs.modal", function() {
        $("#players-notif").remove();
        fetch("/api/check_event/" + GAME_OBJECT.game_id + "/player", {method: "POST"});
    });

    // Enable the players button (make sure there's no ID collision)
    $("#players-modal-open-button:not(:has(#modal-container))").prop("disabled", false);
}

// Load the leaderboard onto the page -- called by play-page-main.js
async function init_leaderboard() {

    // Make a request to the server to get the leaderboard
    const lboard_url = "/api/leaderboard/" + GAME_ID;
    let lboard_res = await fetch(lboard_url, {method:"GET"});
    lboard_res = await lboard_res.json();
    ALL_PLAYERS = lboard_res.players;

    // Remove the loading card
    document.getElementById(LEADERBOARD_BANNER).innerHTML = "";

    // Set the title rank
    const rank = ALL_PLAYERS.indexOf(ALL_PLAYERS.find(p => p.player_id === THIS_PLAYER.player_id)) + 1;
    document.getElementById(TITLE_RANK_SPAN).innerHTML = `You are in 
        <ins>${rank}${get_rank_suffix(rank)}</ins>
         place!`;

    for (let i = 0; i < ALL_PLAYERS.length; i++) {
        const player = ALL_PLAYERS[i];
        const card = leaderboard_card(player);
        document.getElementById(LEADERBOARD_BANNER).insertAdjacentHTML("beforeend", card);
    }

    // Call the init_players_modal function now that we have ALL_PLAYERS
    init_players_mdoal();
} 
