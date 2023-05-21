/*
    This script manages the invite links!
    It'll get the game information and render it. 
    It also manages the join game modal (templates/modals/join-game.html)
    It also does the login and signup redirects!!!
*/

// I worry about HTML ID collision (for this page specifically), so I'm doing the :not(:has(#modal-container)) thing
$(document).ready(() => {

    // Get the game ID from the URL args (should be the only arg)
    const GAME_ID = window.location.href.split("game_id=")[1];

    // Add the game ID to the join game button (it'll exist if the user is logged in)
    if ($("#join-game-button:not(:has(#modal-container))")) {
        $("#join-game-button:not(:has(#modal-container))").click(() => {
            preload_join_game(GAME_ID); // defined in main.js
        });
    }

    // Add this page as the redirect page to the login button if it exists (it won't exist if the user is logged in)
    // Not worried about HTML ID collision here... I think
    if ($("#signup-button") && $("#login-button")) {

        // Add this page as the redirect page to the signup button
        // The server handles the redirect to the login page and then back to this page
        $("#signup-button").click(() => {
            const redirect_url = "/invite?game_id=" + GAME_ID;
            window.location.href = "/signup?next=" + encodeURIComponent(redirect_url);
            // I can't believe this trick works :)
        });

        // Add this page as the redirect page to the login button
        // The next arg will redirect the user back to this page after logging in
        $("#login-button").click(() => {
            const redirect_url = "/invite?game_id=" + GAME_ID;
            window.location.href = "/login?next=" + encodeURIComponent(redirect_url);
        });
    }

    // Get the game information and render it on the page
    fetch("/api/get_invite_info?game_id=" + GAME_ID)
    .then((response) => response.json())
    .then((game_res) => {

        // Render the game information
        $("#game-information:not(:has(#modal-container))").html(render_game_info(game_res.game)); // defined in main.js

        // Make the join game button enabled if it exists (it won't exist if the user is logged in)
        if ($("#join-game-button:not(:has(#modal-container))")) {
            $("#join-game-button:not(:has(#modal-container))").prop("disabled", false);
        }
    });
});
