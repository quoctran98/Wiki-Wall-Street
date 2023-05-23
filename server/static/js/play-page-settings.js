/*
    This page manages the modal that opens when the user clicks the settings button on the play page.
    It also updates the game settings if the user changes them.
*/

// // Add event listeners to the delete game button
// document.getElementById(SETTINGS_MODAL_DELETE).onclick = (() => {
//     document.getElementById(GAME_SETTINGS_MODAL).style.display = "none";
//     document.getElementById(DELETE_CONFIRM_MODAL_GAME_ID).value = GAME_OBJECT.game_id;
//     document.getElementById(DELETE_CONFIRM_MODAL).style.display = "block";
//     blur_background();
// });

// // Add event listeners to the delete game confirm modal
// document.getElementById(DELETE_CONFIRM_MODAL_CLOSE_BUTTON).onclick = (() => {
//     document.getElementById(DELETE_CONFIRM_MODAL).style.display = "none";
//     show_game_settings_modal();
// });

// Show the modal when the settings button is clicked
function show_game_settings_modal(game=GAME_OBJECT) {
    // Run the init_settings function to fill out the form (in case it was closed and reopened)
    init_settings(game);
    // Redisable the save button and show the modal
    document.getElementById(GAME_SETTINGS_SAVE_BUTTON).setAttribute("disabled", true);
    document.getElementById(GAME_SETTINGS_MODAL).style.display = "block";
    blur_background();
}

function fill_settings_modal(game=GAME_OBJECT) {
    // Fill out the form with the current game settings
    $("#settings-modal #game-id").val(game.game_id);
    $("#settings-modal #game-name").val(game.name);
    $("#settings-modal #starting-cash").val(game.settings.starting_cash);
    $("#settings-modal #views-limit").val(game.settings.views_limit);
    $("#settings-modal #show-cash").prop("checked", game.settings.show_cash);
    $("#settings-modal #show-articles").prop("checked", game.settings.show_articles);
    $("#settings-modal #show-number").prop("checked", game.settings.show_number);
    $("#settings-modal #public-game").prop("checked", game.public);

    // Select the allowed and banned categories in the select elements
    $("#settings-modal #allowed-categories").val(game.settings.allowed_categories);
    $("#settings-modal #banned-categories").val(game.settings.banned_categories);
    let allowed_options = $("#settings-modal #allowed").find("option").filter(function() {
        if (game.settings.allowed_categories === undefined) {
            return($(this).val() === "");
        }
        return(game.settings.allowed_categories.includes($(this).val()));
    });
    $("#settings-modal #allowed").prop("selectedIndex", -1)
    allowed_options.prop('selected', true);
    let banned_options = $("#settings-modal #banned").find("option").filter(function() {
        if (game.settings.banned_categories === undefined) {
            return($(this).val() === "");
        }
        return(game.settings.banned_categories.includes($(this).val()));
    });
    $("#settings-modal #banned").prop("selectedIndex", -1)
    banned_options.prop('selected', true);

    // Fake trigger the change event in the allowed select elements to update banned :)
    $("#settings-modal #allowed").trigger("change");
}

// Fill out the modal on page load
function init_settings(game=GAME_OBJECT) {
    // Set the modal-title class
    $("#settings-modal .modal-title").html(`Settings for <ins>${game.name}</ins>`);

    // Fill out the form with the current game settings
    fill_settings_modal(game);

    // Enable form elements if the user is the game creator
    // Not wrapping this in a function because it's only called once per page load
    if (THIS_PLAYER.user_id === game.owner_id) {
        $("#settings-modal #views-limit").prop("readonly", false);
        $("#settings-modal #show-cash-label").css("color", "black");
        $("#settings-modal #show-cash").prop("disabled", false);
        $("#settings-modal #show-articles-label").css("color", "black");
        $("#settings-modal #show-articles").prop("disabled", false);

        // Enable the number of articles checkbox if it's already checked :)
        $("#settings-modal #show-number-label").css("color", `${game.settings.show_articles ? "black" : "#E5E5E5"}`);
        $("#settings-modal #show-number").prop("disabled", !game.settings.show_articles);

        // Enable the select elements and their options
        $("#settings-modal #allowed").removeAttr("readonly");
        $("#settings-modal #banned").removeAttr("readonly");
        let allowed_options = $("#settings-modal #allowed").find("option");
        let banned_options = $("#settings-modal #banned").find("option");
        allowed_options.prop("disabled", false);
        banned_options.prop("disabled", false);

        // Enable the delete game button
        $("#settings-modal #delete-game-button").prop("disabled", false);

        // Add an event listener to the form to enable the change settings button
        $("#settings-modal form").on("change", function() {
            $("#settings-modal #change-settings-button").prop("disabled", false);
        });
    }

    // Add event listener to the modal opening
    $("#settings-modal").on("shown.bs.modal", function() {
        fill_settings_modal(game); 
        $("#settings-modal #change-settings-button").prop("disabled", true);
        // Refill the form with the current game settings and disable the save button
    });

    // Add event listener to delete game button
    $("#settings-modal #delete-game-button").on("click", function() {
        // Fill out the confirm modal info
        $("#delete-confirm-modal #delete-confirm-form #game-id").val(GAME_OBJECT.game_id);
        // Hide this modal and open the confirm modal
        // (we can't do data-dismiss="modal" because we need to fill out the form)
        $("#settings-modal").modal("hide");
        $("#delete-confirm-modal").modal("show");
    });
    
    // Enable the settings button now :)
    $("#settings-modal-open-button:not(:has(#modal-container))").prop("disabled", false);
}
