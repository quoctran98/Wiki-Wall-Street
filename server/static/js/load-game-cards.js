class GameCard {
    constructor(name, game_id, position) {
        this.name = name;
        this.game_id = game_id
    }

    generate_html() {
        const play_url = window.location.origin + "/play?game_id=" + this.game_id;
        let html = `
            <img class="card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/0/07/Wikipedia_logo_%28svg%29.svg">
            <div class="card-body">
                <h5 class="card-title">${this.name}</h5>
                <p class="card-text">words words words</p>
                <a href="${play_url}" class="btn btn-primary">Play!</a>
            </div>
        `
        return(html);
    }

    set_html(div_id) {
        let game_container = document.getElementById(div_id);
        game_container.innerHTML = this.generate_html();
    }
}


// initialize grid of games
function initialize_grid(n_games) {
    let html = "";
    for (let i = 0; i < n_games; i++) {
        html += `
            <div class="card" style="width: 8rem;" id="game-${i}">
            </div>
        `;
    }
    document.getElementById("grid-of-games").innerHTML = html;
}

// retrieve games from server and populate grid
fetch("/api/get_games", {
    method: 'POST',
    headers: {
        'Content-Type': "application/json",
    },
    body: `{
        "nothing": "nothing"
    }`
})
.then((res) => {
    res.json().then(data => {
        initialize_grid(data.length);
        for (let i = 0; i < data.length; i++) {
            game_obj = data[i];
            let this_card = new GameCard(game_obj.name, game_obj.game_id);
            this_card.set_html(`game-${i}`);
        }
    });
});
