/*
    This script handles the players modal that pops up when you click on the players button
*/

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

function render_players_list(game) {
    const is_owner = game.owner_id == THIS_PLAYER.user_id;
    const players_list = $("#players-modal #players-list")[0];
    players_list.innerHTML = "";

    // Add the players to the list
    for (let i = 0; i < game.players.length; i++) {
        const is_self = game.players[i] == THIS_PLAYER.name;
        const profile_link = window.location.origin + "/profile/" + encodeURI(game.players[i]);

        // Two rows, one with profile pic and name and one with buttons
        let player_html = `
        <li> 
            <div class="row">
                <img class="inline-image" style="border:2px; border-radius:50%;" src="/static/img/default-profile.png">
                <p></p>
                <a href="${profile_link}">${game.players[i]}</a>
            </div>

            <div class="row>
                <div class="col-2"></div>
                <div class="col-10">
                    ${(is_owner && !is_self) ? `<i class="bi-x-circle-fill players-kick-player" onclick="kick_player('${game.players[i]}')"></i>` : ""}
                    <i class="bi-person-plus-fill players-add-friend"></i>
                </div>
            </div>

            <hr>
        </li>
        `; // Bad! That I'm doing this with player name and not ID, but those should be unique anyway

        players_list.innerHTML += player_html;
    }
}

function init_players() {
    // Fill out the modal title
    $("#players-modal .modal-title").html(`Players in <ins>${GAME_OBJECT.name}</ins>`);

    // Add event listener when the players modal is open
    $("#players-modal").on("show.bs.modal", function() {

        // Add an invite link that copies to clipboard
        const invite_link = window.location.origin + "/invite/" + GAME_OBJECT.game_id;
        $("#players-modal #invite-link").val(invite_link);

        // Render the players list
        render_players_list(GAME_OBJECT);

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

    // Add the notif if there are new chats
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
