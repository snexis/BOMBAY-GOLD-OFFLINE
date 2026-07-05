/* ================================================= */
/* Sports Module Configuration */
/* ================================================= */

const SPORTS = {

    apiUrl: "",

    apiKey: "",

    provider: "firebase",

    timeout: 10000

};


/* ================================================= */
/* Sports State */
/* ================================================= */

const sportsState = {

    liveResults: [],

    oldResults: [],

    lastUpdated: null

};


/* ================================================= */
/* Change API Only Here */
/* ================================================= */

function setSportsProvider(config = {}) {

    Object.assign(SPORTS, config);

}


/* ================================================= */
/* Get Live Results */
/* ================================================= */

async function getLiveResults() {

    if (SPORTS.provider === "firebase") {

        return await getCollection(COLLECTIONS.liveResults);

    }

    return [];

}


/* ================================================= */
/* Get Old Results */
/* ================================================= */

async function getOldResults() {

    if (SPORTS.provider === "firebase") {

        return await getCollection(COLLECTIONS.oldResults);

    }

    return [];

}
/* ================================================= */
/* Load Sports Data */
/* ================================================= */

async function loadSportsData() {

    try {

        sportsState.liveResults = await getLiveResults();

        sportsState.oldResults = await getOldResults();

        sportsState.lastUpdated = new Date();

        return sportsState;

    } catch (error) {

        console.error("Sports Data Error:", error);

        return sportsState;

    }

}


/* ================================================= */
/* Find Result By Date */
/* ================================================= */

function getResultByDate(date) {

    return sportsState.oldResults.find(item => item.date === date);

}


/* ================================================= */
/* Get Latest Result */
/* ================================================= */

function getLatestResult() {

    if (!sportsState.liveResults.length) {

        return null;

    }

    return sportsState.liveResults[0];

}


/* ================================================= */
/* Refresh Sports Data */
/* ================================================= */

async function refreshSportsData() {

    await loadSportsData();

    return sportsState;

}
/* ================================================= */
/* API Adapter */
/* ================================================= */

async function fetchSportsData() {

    if (SPORTS.provider === "firebase") {

        return await loadSportsData();

    }

    if (SPORTS.provider === "api") {

        const response = await fetch(SPORTS.apiUrl, {

            method: "GET",

            headers: {

                "Authorization": SPORTS.apiKey

            }

        });

        if (!response.ok) {

            throw new Error("API Request Failed");

        }

        const data = await response.json();

        sportsState.liveResults = data.liveResults || [];

        sportsState.oldResults = data.oldResults || [];

        sportsState.lastUpdated = new Date();

        return sportsState;

    }

    return sportsState;

}


/* ================================================= */
/* Auto Refresh */
/* ================================================= */

let sportsRefreshTimer = null;

function startSportsAutoRefresh(interval = 60000) {

    stopSportsAutoRefresh();

    sportsRefreshTimer = setInterval(async () => {

        try {

            await fetchSportsData();

        } catch (error) {

            console.error("Auto Refresh Error:", error);

        }

    }, interval);

}

function stopSportsAutoRefresh() {

    if (sportsRefreshTimer) {

        clearInterval(sportsRefreshTimer);

        sportsRefreshTimer = null;

    }

}


/* ================================================= */
/* Public Sports API */
/* ================================================= */

window.Sports = {

    setProvider: setSportsProvider,

    fetch: fetchSportsData,

    refresh: refreshSportsData,

    latest: getLatestResult,

    byDate: getResultByDate,

    startAutoRefresh: startSportsAutoRefresh,

    stopAutoRefresh: stopSportsAutoRefresh,

    state: sportsState

};


