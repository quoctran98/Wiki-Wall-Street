/*
    This file contains the funciton for loading the trending articles
*/

// ID(S) FOR HTML ELEMENTS
const TRENDING_DECK = "trending-articles";

// Called when the trending articles are loading
function loading_trending() {
    // Let's make a loading card when this srcipt is loaded! (10!)
    // Easiest way is to wrap it in a for loop
    for (let i = 0; i < 10; i++) {
        let trending_loading_card = `
        <div class="card trending-card" role="alert">
            <div id="trending-loading-graph-${i}" class="blurred-container" style="width: 100%; height: 3em;"></div>
            <h5 class="card-title blurred-container">Articles</h5>
            <p class="card-text blurred-container">Loading <img class="inline-image" src="/static/img/loading.gif" alt="Loading"></p>
        </div>
        `;
        document.getElementById(TRENDING_DECK).insertAdjacentHTML("beforeend", trending_loading_card);

        // Add a loading graph to the loading card
        timestamps = [101, 102, 103, 104, 105, 106, 107]
        views = []
        for (let i = 0; i < timestamps.length; i++) {
            // No need for the random walk like in center graph because for 7 days it's pretty random
            views.push(Math.round(Math.random() * 1000) + 1000);
        }
        let color = (views[0] > views[views.length-1])? "#c13030" : "#4668ff";
        const plot_data = [{x: timestamps, y: views, type: "line", marker:{color: color}}];
        let plot_layout = {autosize: true, margin:{t: 0, b: 0, l: 0, r: 1}, xaxis: {type: "date",},yaxis: {title: "",}};
        Plotly.newPlot(`trending-loading-graph-${i}`, plot_data, plot_layout, {staticPlot: true, responsive: true});
    }
}

// Generate HTML for each trending article
// Uses an article object from the server (trending articles array)
// ALso returns graph_div_id for the graph to be inserted into
function generate_trending_card(article, index) {
    const today_v = article.today_views;
    const last_week_v = article.last_week_views;
    const weekly_change = Math.round((today_v - last_week_v) / last_week_v * 100);
    const graph_div_id = `trending-graph-${index}`;

    // Make the card
    let card_html = `
    <a href="#" onclick="load_into_search('${article.article}','week');return(false);">
        <div class="card trending-card">
            <div id="${graph_div_id}" style="width: 100%; height: 3em;"></div>
            <h5 class="card-title" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${article.article}</h5>
            <p class="card-text">${format_price(article.today_views, imprecise=true)}</p>
            <p class="card-text">(${(weekly_change > 0)? "📈" : "📉"} ${weekly_change}%)</p>
        </div>
    </a>
    `
    return([card_html, graph_div_id]);
}

// Add small Plotly graphs to each trending article card
// Uses an article object and a graph_div_id in the card
function add_graph(graph_div_id, article) {
    
    // Extract data and parse timestamps
    const view_data = article.data;
    let views = [];
    let timestamps = [];
    for (let i = 0; i < view_data.length; i++) {
        views.push(view_data[i].views);
        const this_timestamp = view_data[i].timestamp;
        let year = this_timestamp.substring(0, 4);
        let month = this_timestamp.substring(4, 6);
        let day = this_timestamp.substring(6, 8);
        timestamps.push(new Date(year, month-1, day));
    }

    let color = (views[0] > views[views.length-1])? "#c13030" : "#4668ff";
    // Call Plotly to make the graph
    let plot_data = [{x: timestamps, y: views, type: "line", marker:{color: color}}];
    let plot_layout = {
        autosize: true,
        margin:{t: 0, b: 0, l: 0, r: 1},
        xaxis: {type: "date",},
        yaxis: {title: "",}
    };

    // Make the graph
    const graph_div = document.getElementById(graph_div_id);
    Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true, responsive: true});
}

// Load in the trending articles -- called by play-page-main.js
async function init_trending() {
    
    // Get trending articles from the server
    const trending_url = "/api/trending_articles";
    let trending_res = await fetch(trending_url, {method: 'GET'})
    if (trending_res.status !== 200) {
        return(false);
    }
    trending_res = await trending_res.json()
    let trending = trending_res.trending

    // Remove loading card
    document.getElementById(TRENDING_DECK).innerHTML = "";

    // Make cards for each trending article
    trending = shuffle(trending);
    for (let i = 0; i < trending.length; i++) {
        const article = trending[i];
        const new_card = generate_trending_card(article, i);
        // Returns [card_html, graph_div_id]

        // Insert card into HTML
        document.getElementById(TRENDING_DECK).insertAdjacentHTML("beforeend", new_card[0]); // Add card to HTML
        add_graph(new_card[1], article); // Add graph to card
    }
}
