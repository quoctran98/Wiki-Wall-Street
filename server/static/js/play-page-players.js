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

    const delete_body = {
        game_id: GAME_OBJECT.game_id,
        player_name: player_name,
    };
    let kick_res = await fetch("/api/kick_player",{
            method: "DELETE",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify(delete_body)}
    );

    if (kick_res.status !== 200) {
        console.log("Error kicking player");
        console.log(kick_res);
    } else {
        window.location.reload();
    }
}

function render_players_list(game) {
    const is_owner = game.owner_id == THIS_PLAYER.user_id;
    const players_list = $("#players-modal #players-list")[0];
    players_list.innerHTML = "";

    // Add the players to the list
    for (let i = 0; i < game.players.length; i++) {
        const is_self = game.players[i] == THIS_PLAYER.name;
        const profile_link = window.location.origin + "/profile/" + encodeURI(game.players[i]);
        let player_html = `
        <li> 
            ${(is_owner && !is_self) ? `<i class="bi-x-circle-fill players-kick-player" onclick="kick_player('${game.players[i]}')"></i>` : ""}
            <i class="bi-person-plus-fill players-add-friend"></i>
            <a href="${profile_link}">${game.players[i]}</a>
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

    // Enable the players button (make sure there's no ID collision)
    $("#players-modal-open-button:not(:has(#modal-container))").prop("disabled", false);
}
