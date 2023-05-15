I made this game because it's something I've always wanted to play! 
It's a web app I developed using [Flask](https://flask.palletsprojects.com/en/2.3.x/)
and [MongoDB](https://www.mongodb.com/) on the backend 
that calls the [Wikipedia API](https://wikitech.wikimedia.org/wiki/API_Portal) to get article view counts (and a bunch of other stuff).
I used a lot of [Bootstrap](https://getbootstrap.com/) and 

### Deploying the app (I used Digital Ocean)

2, Generate `requirements.txt` file: `pip list --format=freeze > requirements.txt`
We have to do it this way because of: https://stackoverflow.com/questions/62885911/pip-freeze-creates-some-weird-path-instead-of-the-package-version

Generate `environment.yml` file: `conda env export > environment.yml`

3. Copy environment variables from .env file to the app
    - It should include: 
        MONGODB_CONNECTION_STRING:str
        USERS_DB_NAME:str
        GAMES_DB_NAME:str
        PLAYERS_DB_NAME:str
        TRANSACTIONS_DB_NAME:str
        
        WIKI_API_USER_AGENT:str
        FLASK_SECRET_KEY:str
        
        EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS:float

4. Add the gunicorn run command: `gunicorn -w 4 --threads 8 --worker-tmp-dir /dev/shm appserver:gunicorn_app`


TODO:
- [✅] Add a method to display `flash()`'d messages in the base template at the top
- [✅] Make the `flash()`'d messages look nicer in an alert/modal box?
- [✅] Generate flash() error messages for: ✅signup, ✅login, ✅joining games, ✅creating games, ✅transactions?
- [ ] Add limits to creating and joining games :)

- [✅] Add info verification to the new_tranaction route
- [✅] Add Game settings!
- [ ] Add a way to filter out articles (✅ too low view counts, disambig pages etc.)
- [ ] Normalized pageviews still don't seem to account for weekly fluctuations in pageviews?

- [✅] Make game cards page look nice
- [✅] Reoganize js for game cards page (i've rid myself of it -- it's all in the home page now)
- [ ] Find a better method to get trending articles

- [✅] Add a way to view other players' portfolios
- [✅] Add a portfolio modal and make the cards look nicer
- [ ] Make portfolio modal look nice (percent change, remove modal on article click, etc.)
- [ ] Make trending cards, ✅portfolio cards, and ✅leaderboard cards look nicer :)

- [✅] Refactor js scripts for /play (✅ almsot done!)
- [✅] Make multple API calls at the same time and wait for all of them to finish! Faster!
- [ ] Add loading symbol for loading elements
- [✅] Do we need to send game and player public dict on /play view request? (no! ✅)
- [ ] api/get_play_info/ is sending A LOT of data and is SLOW!
- [ ] Don't really need to call search article api every time -- wait every few leters or when no more typing is detected

- [✅] Add a way to disallow certain articles from being used in games (lower limit, etc)

- [✅] Update player portfolio values in the background (APscheduler?)
- [✅] Display change in portfolio values in the play page

- [✅] Why is /get_play_info/ a POST request? Should be GET
- [ ] Refactor GET requests -- just one for player and one for game

- [ ] Precaching!

- [ ] SHOULD AVOID HREF A TAGS FOR JS

- [✅] Make a logo and a favicon :)

- [ ] Make sure update value history method and scheduler aren't running too often :)

- [ ] Each worker has their own APScheduler instance -- is this a problem?