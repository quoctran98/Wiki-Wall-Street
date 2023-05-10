// let GAME_ID = window.location.search.split("=")[1].split("&")[0];
// should be defined in portfolio-summary.js (ugh i need to reorganize this)

const LEADERBOARD_CARD_DECK = "leaderboard-card-deck";

function leaderboard_card (player) {

    let cash_html = "";
    if (player.cash) {
        cash_html = `<span>Cash: ${format_price(Math.round(player.cash))}</span>`;
    }

    // make al ist of articles
    let articles_html = "";
    if (player.articles) {
        articles_html = "<span>Articles: </span> <ul>";
        let articles = player.articles;
        for (let article_name in articles) {
            // check if it's a number
            const maybe_number = articles[article_name];
            if (typeof maybe_number !== "number") {
                articles_html += `<li>${article_name}</li>`;
            } else {
                articles_html += `<li>${article_name} (${maybe_number})</li>`;
            }
        }
        articles_html += "</ul>";
    }

    let card_html = `
        <div class="card leaderboard-card">
            <h6 class="card-title"> 
                ${player.name} (${format_price(Math.round(player.value))})
            </h6>
            <p class="card-text">
                <div class="row" style="width: 90%">${cash_html}</div>
                <div class="row" style="width: 90%">${articles_html}</div>
            </p>
        </div>
    `;

    return(card_html);
}


fetch("/api/leaderboard?game_id=" + GAME_ID, {method:"GET"})
.then(response => response.json())
.then(data => {
    const players = data.players;
    let leaderboard = document.getElementById(LEADERBOARD_CARD_DECK);
    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        let card = leaderboard_card(player);
        console.log(card);
        leaderboard.insertAdjacentHTML("beforeend", card);
    }
});
