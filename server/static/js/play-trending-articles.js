const TRENDING_DECK = "trending-articles";

async function update_trending_articles() {
    
    // get trending articles from server
    url = "/api/trending_articles";
    const res = await fetch(url, {method: 'GET'})
    if (res.status !== 200) {
        return(false);
    }
    const data = await res.json()
    const trending = data.trending

    // make cards for each trending article
    let trending_html = "";
    for (let i = 0; i < trending.length; i++) {
        const article = trending[i];
        const today_v = article.today_views;
        const last_week_v = article.last_week_views;
        const weekly_change = Math.round((today_v - last_week_v) / last_week_v * 100);
        let card_html = `
        <a href="javascript:load_into_search('${article.article}','week')">
            <div class="card trending-card">
                <div id="trending-graph-${i}"></div>
                <h5 class="card-title">
                    ${article.article}
                </h5>
                <p class="card-text">${Math.round(article.today_views/1000)}k 
                (${(weekly_change > 0)? "📈" : "📉"} ${weekly_change}%)
                </p>
            </div>
        </a>
        `
        trending_html += card_html;
    }
    document.getElementById(TRENDING_DECK).innerHTML = trending_html;

    // insert graphs into cards
    for (let i = 0; i < trending.length; i++) {
        const article = trending[i];
        const graph_div = document.getElementById(`trending-graph-${i}`);
        const view_data = article.data;
        
        // extract views and timestamps from each object in the array
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

        // plot data with plotly
        let plot_data = [{
            x: timestamps,
            y: views,
            type: "line",
        }];
        let plot_layout = {
            height: 70,
            margin:{t: 0, b: 0, l: 0, r: 1},
            xaxis: {type: "date",},
            yaxis: {title: "",}
        };
        
        Plotly.newPlot(graph_div, plot_data, plot_layout, {staticPlot: true, responsive: true});
    }
}

function load_into_search(article, timespan=null) {
    if (timespan) {
        current_timespan = timespan;
    }
    document.getElementById(SEARCH_ID).value = article;
    // SEARCH_ID is defined in server/static/js/transaction-navigator.js
    search_main(); // defined in server/static/js/transaction-navigator.js
}

update_trending_articles();
