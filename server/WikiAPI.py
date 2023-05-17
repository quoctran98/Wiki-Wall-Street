import requests
import json
from datetime import date, timedelta

from server.helper import settings

def pageviews(article, start=date.today()-timedelta(days=30), end=date.today(),
              project="en.wikipedia", access="all-access", agent="user", granularity="daily"):
    """
    Python wrapper for the Wikimedia Pageviews API (https://wikimedia.org/api/rest_v1/)
    Get the pageviews for a single article over a given time period

    Parameters
    ----------
    article : str
        The name of the article to get pageviews for
    start : datetime.date
        The start date for the pageviews
    end : datetime.date
        The end date for the pageviews
    project : str
        The Wikimedia project to get pageviews for (e.g. "en.wikipedia")
    access : str
        The access type to get pageviews for ("all-access", "desktop", "mobile-web", "mobile-app")
    agent : str
        The agent type to get pageviews for ("user", "spider", "bot", "all-agents")
    granularity : str
        The granularity of the pageviews ("daily", "monthly")

    Returns
    -------
    list
        A list of dictionaries containing the pageviews for each day/month from start to end
        The dictionaries contain the following keys: "project", "article", "granularity", "timestamp", "access", "agent", "views"
    """
    
    start=start.strftime("%Y%m%d")
    end=end.strftime("%Y%m%d")
    
    baseurl = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
    endpoint = f"{project}/{access}/{agent}/{article}/{granularity}/{start}/{end}"
    url = baseurl + endpoint

    headers = requests.utils.default_headers()
    headers.update({"User-Agent": settings.WIKI_API_USER_AGENT})

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return(response.json()["items"])
    else:
        print(f"Error: {response.status_code}")
        return(json.loads(response.content)) 

def projectviews(project="en.wikipedia", start=date.today()-timedelta(days=30), end=date.today(),
                access="all-access", agent="user", granularity="daily"):
    """
    Python wrapper for the Wikimedia Pageviews API (https://wikimedia.org/api/rest_v1/)
    Get the total pageviews for a project over a given time period

    Parameters
    ----------
    project : str
        The Wikimedia project to get pageviews for (e.g. "en.wikipedia")
    start : datetime.date
        The start date for the pageviews
    end : datetime.date
        The end date for the pageviews
    access : str
        The access type to get pageviews for ("all-access", "desktop", "mobile-web", "mobile-app")
    agent : str
        The agent type to get pageviews for ("user", "spider", "bot", "all-agents")
    granularity : str
        The granularity of the pageviews ("hourly", "daily", "monthly")

    Returns
    -------
    list
        A list of dictionaries containing the total pageviews for each hour/day/month
        The dictionaries contain the following keys: "project", "access", "agent", "granularity", "timestamp", "views"
    """
    
    start=start.strftime("%Y%m%d")
    end=end.strftime("%Y%m%d")
    
    baseurl = "https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/"
    endpoint = f"{project}/{access}/{agent}/{granularity}/{start}/{end}"
    url = baseurl + endpoint

    headers = requests.utils.default_headers()
    headers.update({"User-Agent": settings.WIKI_API_USER_AGENT})

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return(response.json()["items"])
    else:
        print(f"Error: {response.status_code}")
        return(json.loads(response.content)) 

def top_articles(project="en.wikipedia", date=date.today()-timedelta(days=1), timespan="month",
                 access="all-access", agent="user"):
    """
    Python wrapper for the Wikimedia Pageviews API (https://wikimedia.org/api/rest_v1/)
    Get the top articles for a project on a given day/month

    Parameters
    ----------
    project : str
        The Wikimedia project to get the top articles for (e.g. "en.wikipedia")
    date : datetime.date
        The date to get the top articles for (defaults to yesterday)
        If timespan is "month", this is the month to get the top articles for
    timespan : str
        The timespan to get the top articles for ("day", "month")
    access : str
        The access type to get the top articles for ("all-access", "desktop", "mobile-web", "mobile-app")
    agent : str
        The agent type to get the top articles for ("user", "spider", "bot", "all-agents")
    
    Returns
    -------
    dict
        A dictionary containing the GET parameters passed and a list of dictionaries containing the top articles with key "articles"
        The dictionaries in the list under "articles" contain the following keys: "article", "views", "rank"
    """
    year = date.strftime("%Y")
    month = date.strftime("%m")
    if timespan == "day":
        days = date.strftime("%d")
    elif timespan == "month":
        days = "all-days"
    else:
        raise ValueError("timespan must be either 'day' or 'month'")
    
    baseurl = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/"
    endpoint = f"{project}/{access}/{year}/{month}/{days}"
    url = baseurl + endpoint

    headers = requests.utils.default_headers()
    headers.update({"User-Agent": settings.WIKI_API_USER_AGENT})

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return(response.json()["items"][0])
    else:
        print(f"Error: {response.status_code}")
        return(json.loads(response.content))
    
def search_article(query, project="en.wikipedia", namespace=0, limit=None):
    """
    Python wrapper for the Wikimedia OpenSearch API (https://www.mediawiki.org/wiki/API:Opensearch)
    Get the suggested articles for a given query

    Parameters
    ----------
    query : str
        The search term to get the suggested articles for
    project : str
        The Wikimedia project to get the suggested articles for (e.g. "en.wikipedia")
    namespace : int
        The namespace to get the suggested articles for (defaults to 0)
        (https://en.wikipedia.org/wiki/Wikipedia:Namespace)
    limit : int
        The maximum number of suggested articles to return (defaults to None)
    
    Returns
    -------
    dict
        A dictionary containing the "query", "suggestions", "descriptions", and "links" keys
        The "suggestions" key contains a list of the names of suggested articles
        The "descriptions" and "links" keys contain a lists indexed by the "suggestions" list
    """
    baseurl = f"https://{project}.org/w/api.php?action=opensearch"
    endpoint = f"&search={query}&namespace={namespace}&format=json"
    if limit is not None:
        endpoint += f"&limit={limit}"
    url = baseurl + endpoint

    headers = requests.utils.default_headers()
    headers.update({"User-Agent": settings.WIKI_API_USER_AGENT})

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        res = response.json()
        return({
            "query": res[0],
            "suggestions": res[1],
            "descriptions": res[2],
            "links": res[3]
        })
    else:
        print(f"Error: {response.status_code}")
        return(json.loads(response.content))

def verify_article(article_name, project="en.wikipedia", namespace=0, suggest=False):
    """
    Verifies that an article exists, given its name and the Wikimedia project
    Uses the search_article function to do this

    Parameters
    ----------
    article_name : str
        The name of the article to verify
    project : str
        The Wikimedia project to verify the article for (e.g. "en.wikipedia")
    namespace : int
        The namespace to verify the article for (defaults to 0)
        (https://en.wikipedia.org/wiki/Wikipedia:Namespace)
    suggest : bool
        Whether to return the suggested articles if the article does not exist (defaults to False)
        Otherwise, returns False if the article does not exist

    Returns
    -------
    bool
        True if the article exists, False if it does not
        If suggest is True, returns a list of suggested articles if the article does not exist
    """
    search = search_article(article_name, project=project, namespace=namespace)
    if article_name in search["suggestions"]:
        return(True)
    else:
        if suggest:
            return(search["suggestions"])
        else:
            return(False)

def normalized_views(article,
                     start=date.today()-timedelta(days=30),
                     end=date.today(),
                     project="en.wikipedia",
                     access="all-access",
                     agent="user",
                     average_project_views=settings.EN_WIKI_AVERAGE_DAILY_PROJECT_VIEWS):
    """
    Returns the normalized pageviews for a given article

    Parameters
    ----------
    article : str
        The name of the article to get the normalized pageviews for
    start : datetime.date
        The start date for the pageviews
    end : datetime.date
        The end date for the pageviews
    project : str
        The Wikimedia project to get the pageviews for (e.g. "en.wikipedia")
    access : str
        The access type to get the pageviews for ("all-access", "desktop", "mobile-web", "mobile-app")
    agent : str
        The agent type to get the pageviews for ("user", "spider", "bot", "all-agents")
    average_project_views : float
        The average number of daily pageviews for the project
        (defaults to an .env variable -- 249115652.14 for en.wikipedia)
    
    Returns
    -------
    list
        A list of dictionaries containing the normalized pageviews for each day from start to end
        The dictionaries contain the following keys: "project", "access", "agent", "granularity", "timestamp", "views"
        (same as the output of the pageviews function but now with normalized views)
    """

    if verify_article(article, suggest=False):
        pageviews_list = pageviews(article,
                                   start=start,
                                   end=end,
                                   project=project,
                                   access=access,
                                   agent=agent,
                                   granularity="daily")
        projectviews_list = projectviews(project=project,
                                         start=start,
                                         end=end,
                                         access=access,
                                         agent=agent,
                                         granularity="daily")
        
        # SOMETIMES THE PAGEVIEWS LIST IS SHORTER THAN THE PROJECTVIEWS LIST OR SOMETHING
        # We're prioritizing returning as much of the pageviews list as possible
        project_timestamps = [x["timestamp"] for x in projectviews_list]
        for i in range(len(pageviews_list)):
           timestamp = pageviews_list[i]["timestamp"]
           if timestamp not in project_timestamps:
               pageviews_list.pop(i) # remove the pageviews entry if it doesn't have a corresponding timestamp in the projectviews list
           else:
                norm_factor = average_project_views / projectviews_list[i]["views"]
                pageviews_list[i]["views"] *= norm_factor

        return(pageviews_list)

def article_information(article, project="en.wikipedia"):
    """
    Returns the information about the given article using the Wikimedia query call

    Parameters
    ----------
    article : str
        The name of the article to get the summary for
    project : str
        The Wikimedia project to get the summary for (e.g. "en.wikipedia")
    
    Returns
    -------
    dict
        A dictionary containing the "title", "pageid", "short_desc", and "categories" keys
    """
    baseurl = f"https://{project}.org/w/api.php?action=query"
    endpoint = f"&format=json&prop=revisions&titles={article}&formatversion=2&rvprop=content&rvslots=*"
    url = baseurl + endpoint
    
    headers = requests.utils.default_headers()
    headers.update({"User-Agent": settings.WIKI_API_USER_AGENT})

    info_dict = {}

    response = requests.get(url, headers=headers)
    if response.status_code == 200:

        # Get the title
        info_dict["title"] = response.json()["query"]["pages"][0]["title"]

        # Get the pageid
        info_dict["pageid"] = response.json()["query"]["pages"][0]["pageid"]

        # Get the short description
        content = response.json()["query"]["pages"][0]["revisions"][0]["slots"]["main"]["content"]
        try: 
            info_dict["short_desc"] = content.split("{{Short description|")[1].split("}}")[0]
        except IndexError:
            info_dict["short_desc"] = None

        # Get the categories
        categories = []
        for line in content.split("\n"):
            if line.startswith("[[Category:"):
                categories.append(line.split("[[Category:")[1].split("]]")[0])
                # I love copilot!
        info_dict["categories"] = categories

        return(info_dict)
    else:
        print(f"Error: {response.status_code}")
        return(json.loads(response.content))
