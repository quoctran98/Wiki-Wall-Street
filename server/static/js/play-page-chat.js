/*
    This script manages the chat modal and fetches the chat messages from the server.
*/

// IDs for HTML elements

const CHAT_MODAL = "chat-modal";
const CHAT_MODAL_CLOSE_SYMBOL = "chat-modal-close-symbol";
const CHAT_MODAL_CLOSE_BUTTON = "chat-modal-close-button";
const CHAT_MODAL_TITLE = "chat-modal-title";

const CHAT_MODAL_TEST = "chat-modal-TEST";

const CHAT_MODAL_MAIN = "chat-modal-main";

const CHAT_FORM_USER_ID = "chat-form-user-id";
const CHAT_FORM_GAME_ID = "chat-form-game-id";
const CHAT_FORM_NAME = "chat-form-name";
const CHAT_FORM_MESSSAGE = "chat-form-message";
const CHAT_FORM_SEND_BUTTON = "chat-form-send-button";

async function get_messages(game_id) {
    const chat_url = "/api/see_chat?game_id=" + game_id;
    let chat_res = await fetch(chat_url);
    chat_res = await chat_res.json();
    return(chat_res.messages);
}

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
    console.log(messages);
    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];
        console.log(message);
        let message_div = document.createElement("div");
        message_div.className = "chat-message";
        message_div.innerHTML = message.name + ": " + message.message;
        document.getElementById(CHAT_MODAL_MAIN).appendChild(message_div);
    }

}

function init_chat() {
    // Add event listener to close symbol and button :)
    document.getElementById(CHAT_MODAL_CLOSE_SYMBOL).onclick = (() => {
        document.getElementById(CHAT_MODAL).style.display = "none";
        unblur_background();
    });
    document.getElementById(CHAT_MODAL_CLOSE_BUTTON).onclick = (() => {
        document.getElementById(CHAT_MODAL).style.display = "none";
        unblur_background();
    });
}