/*
    This script manages the chat modal and fetches the chat messages from the server.
*/

// IDs for HTML elements
const CHAT_MODAL_OPEN_BUTTON = "chat-modal-open-button";
const CHAT_MODAL = "chat-modal";
const CHAT_MODAL_CLOSE_SYMBOL = "chat-modal-close-symbol";
const CHAT_MODAL_CLOSE_BUTTON = "chat-modal-close-button";
const CHAT_MODAL_TITLE = "chat-modal-title";

const CHAT_MODAL_TEST = "chat-modal-TEST";

const CHAT_MODAL_MAIN = "chat-modal-main";

const CHAT_FORM = "chat-form";
const CHAT_FORM_USER_ID = "chat-form-user-id";
const CHAT_FORM_GAME_ID = "chat-form-game-id";
const CHAT_FORM_NAME = "chat-form-name";
const CHAT_FORM_MESSSAGE = "chat-form-message";
const CHAT_FORM_SEND_BUTTON = "chat-form-send-button";

// Global variable for the chat update loop
let CHAT_UPDATE_LOOP;

async function show_chat_modal() {
    // Fill out the form for sending messages
    document.getElementById(CHAT_FORM_USER_ID).value = THIS_PLAYER.user_id;
    document.getElementById(CHAT_FORM_GAME_ID).value = GAME_OBJECT.game_id;
    document.getElementById(CHAT_FORM_NAME).value = THIS_PLAYER.name;

    // Show modal
    document.getElementById(CHAT_MODAL).style.display = "block";
    blur_background();

    // Get messages and render them
    let messages = await get_messages(GAME_OBJECT.game_id);
    render_messages(messages);

    // Run this loop every 5 seconds to update the chat and cancel it when the modal is closed
    // This is a global variable so that it can be cancelled when the modal is closed
    CHAT_UPDATE_LOOP = setInterval(async () => {
        let messages = await get_messages(GAME_OBJECT.game_id);
        render_messages(messages);
    }, 5000);
}

function render_messages(message_array) {
    let chat_box = document.getElementById(CHAT_MODAL_MAIN);

    // Check if new messages have been added
    if (chat_box.children.length != message_array.length) {

        // Add the new messages
        let last_message = chat_box.children[chat_box.children.length - 1];
        for (let i = chat_box.children.length; i < message_array.length; i++) {
            let message = message_array[i];

            // Create a div for the message
            let message_div = document.createElement("div");
            message_div.className = "chat-message";
            message_div.innerHTML = `
                <b>${message.name}</b> 
                <span color='gray' style='font-size:60%; float:right;'>${message.timestamp}</span> <br>
                ${message.message}
            `;
        
            chat_box.appendChild(message_div);
            last_message = message_div;
        }

        // Scroll to the bottom of the chat since new messages have been added
        last_message.scrollIntoView(false);
    }
}

async function get_messages(game_id) {
    const chat_url = "/api/see_chat?game_id=" + game_id;
    let chat_res = await fetch(chat_url);
    chat_res = await chat_res.json();
    return(chat_res.messages);
}

async function send_message() {
    const form_data = new FormData(document.getElementById(CHAT_FORM));

    // Disable the send button and change the text to "Sending..."
    document.getElementById(CHAT_FORM_MESSSAGE).value = "";
    document.getElementById(CHAT_FORM_SEND_BUTTON).disabled = true;
    document.getElementById(CHAT_FORM_MESSSAGE).disabled = true;
    document.getElementById(CHAT_FORM_MESSSAGE).paceholder = "Sending...";

    // Send the message
    const chat_url = "/api/send_chat";
    let chat_res = await fetch(chat_url, {
        method: "POST",
        body: form_data
    });
    if (chat_res.status != 200) {

        console.log("Error sending message");
        // Make the modal red for a second
        document.getElementById(CHAT_MODAL).style.backgroundColor = "red";
        setTimeout(() => {
            document.getElementById(CHAT_MODAL).style.backgroundColor = "white";
        }, 1000);

    } else {

        // Re-enable the send button and change the text to "Type a message..."
        document.getElementById(CHAT_FORM_SEND_BUTTON).disabled = false;
        document.getElementById(CHAT_FORM_MESSSAGE).disabled = false;
        document.getElementById(CHAT_FORM_MESSSAGE).paceholder = "Type a message...";
        document.getElementById(CHAT_FORM_MESSSAGE).focus();

        // Get the messages and render them now that we have sent a message
        let message = await get_messages(GAME_OBJECT.game_id);
        render_messages(message);

        // Scroll to the bottom of the chat
        let chat_box = document.getElementById(CHAT_MODAL_MAIN);
        let last_message = chat_box.children[chat_box.children.length - 1];
        last_message.scrollIntoView(false);
    }
}

function init_chat() {
    // Add event listener to close symbol and button :)
    document.getElementById(CHAT_MODAL_CLOSE_SYMBOL).onclick = (() => {
        document.getElementById(CHAT_MODAL).style.display = "none";
        // End the chat update loop
        clearInterval(CHAT_UPDATE_LOOP);
        unblur_background();
    });
    document.getElementById(CHAT_MODAL_CLOSE_BUTTON).onclick = (() => {
        document.getElementById(CHAT_MODAL).style.display = "none";
        // End the chat update loop
        clearInterval(CHAT_UPDATE_LOOP);
        unblur_background();
    });

    // Add event listener to send button
    document.getElementById(CHAT_FORM).addEventListener("submit", (event) => {
        event.preventDefault();
        // End the chat update loop
        clearInterval(CHAT_UPDATE_LOOP);
        send_message();
    });

    // Enable the chat button
    document.getElementById(CHAT_MODAL_OPEN_BUTTON).disabled = false;
}
