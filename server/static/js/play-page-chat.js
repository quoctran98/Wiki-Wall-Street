/*
    This script manages the chat modal and fetches the chat messages from the server.
*/

// Global variable for the chat update loop
let CHAT_UPDATE_LOOP;

function render_messages(message_array, force_reset=false) {
    let chat_box = $("#chat-modal #main-messages")[0];

    if (force_reset) {
        chat_box.innerHTML = "";
    }

    // Check if new messages have been added
    if (chat_box.children.length != message_array.length) {

        // Add the new messages
        let last_message = chat_box.children[chat_box.children.length - 1];
        for (let i = chat_box.children.length; i < message_array.length; i++) {
            let message = message_array[i];

            // Create a div for the message
            let message_div = document.createElement("div");
            message_div.className = "chat-message";
            message_html = `
                
                <b>${message.name}</b> 
                <br>
                ${escape_html(message.message)}

                <span class="chat-timestamp">${message.timestamp}</span>
            `;

            if (message.name == THIS_PLAYER.name) {
                message_html += `
                    <span class="chat-delete"><i class="bi-trash3-fill" onclick="delete_message('${message.chat_id}');"></i></span>
                `;
            }

            // Add the message to the div
            message_div.innerHTML = message_html;
            
            // Add the message to the chat box
            chat_box.appendChild(message_div);
            last_message = message_div;
        }

        // Scroll to the bottom of the chat since new messages have been added
        if (!force_reset) {
            last_message.scrollIntoView(false);
        }
    }
}

async function delete_message(chat_id) {
    const delete_body = {
        game_id: GAME_OBJECT.game_id,
        chat_id: chat_id,
    };
    let delete_res = await fetch("/api/delete_chat",{
            method: "DELETE",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify(delete_body)}
    );

    if (delete_res.status == 200) {
        let messages = await get_messages(GAME_OBJECT.game_id);
        render_messages(messages, true);
    } else {
        console.log("Error deleting message");
        console.log(delete_res);
    }
}

async function get_messages(game_id) {
    const chat_url = "/api/see_chat/" + game_id;
    let chat_res = await fetch(chat_url);
    chat_res = await chat_res.json();
    return(chat_res.messages);
}

async function send_message(chat_form) {
    const form_data = new FormData(chat_form);

    // Disable the send button and change the text to "Sending..."
    $("#chat-modal #chat-form #send-button").prop("disabled", true);
    $("#chat-modal #chat-form #message").val("");
    $("#chat-modal #chat-form #message").prop("disabled", true);
    $("#chat-modal #chat-form #message").prop("placeholder", "Sending...");

    // Send the message
    const chat_url = "/api/send_chat";
    let chat_res = await fetch(chat_url, {method: "POST", body: form_data});
    if (chat_res.status != 200) {
        console.log("Error sending message");
        // Make the modal red for a second
        $("#chat-modal").style.backgroundColor = "red";
        setTimeout(() => {
            $("#chat-modal").style.backgroundColor = "white";
        }, 1000);

    } else {

        // Re-enable the send button and change the text to "Type a message..."
        $("#chat-modal #chat-form #send-button").prop("disabled", false);
        $("#chat-modal #chat-form #message").prop("disabled", false);
        $("#chat-modal #chat-form #message").prop("placeholder", "Type a message...");

        // Get the messages and render them now that we have sent a message
        let message = await get_messages(GAME_OBJECT.game_id);
        render_messages(message);

        // Scroll to the bottom of the chat
        let chat_box = $("#chat-modal #main-messages")[0];
        let last_message = chat_box.children[chat_box.children.length - 1];
        last_message.scrollIntoView(false);
    }
}

function init_chat() {
    // Fill out the modal title
    $("#chat-modal .modal-title").html(`Chat with <ins>${GAME_OBJECT.name}</ins> players`);

    // Start the chat update loop when the modal is opened (and fill out the form)
    $("#chat-modal").on("shown.bs.modal", () => {
        $("#chat-modal #chat-form #message").focus();
        $("#chat-modal #chat-form #user-id").val(THIS_PLAYER.user_id);
        $("#chat-modal #chat-form #game-id").val(GAME_OBJECT.game_id);
        $("#chat-modal #chat-form #name").val(THIS_PLAYER.name);

        // Get messages and render them
        get_messages(GAME_OBJECT.game_id)
        .then((messages) => {
            render_messages(messages);
        });

        // Run this loop every 5 seconds to update the chat and cancel it when the modal is closed
        // This is a global variable so that it can be cancelled when the modal is closed
        CHAT_UPDATE_LOOP = setInterval(async () => {
            let messages = await get_messages(GAME_OBJECT.game_id);
            render_messages(messages);
        }, 5000);

        // Clear the new events notif if it's there
        $("#chat-modal-open-button #chat-notif").remove();
    });

    // Stop the chat update loop when the modal is closed
    $("#chat-modal").on("hidden.bs.modal", () => {
        clearInterval(CHAT_UPDATE_LOOP);
    });

    // Intercept the send button so we can do extra stuff
    $("#chat-modal #chat-form").submit((event) => {
        event.preventDefault();
        send_message($("#chat-modal #chat-form")[0]);
    });

    // Check if there are new chats to diplay notif
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
    if (unchecked_events.includes("chat")) {
        $("#chat-modal-open-button").append(`
            <span id="chat-notif" class="badge bg-danger rounded-pill position-absolute top-0 end-0 p-10">!</span>
        `);
    }

    // Enable the chat button
    $("#chat-modal-open-button:not(:has(#modal-container))").prop("disabled", false);
}
