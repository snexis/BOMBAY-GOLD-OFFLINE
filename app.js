/* ================================================= */
/* APP STATE */
/* ================================================= */

const App = {

    initialized: false,

    settings: {},

    liveResults: [],

    oldResults: []

};


/* ================================================= */
/* LOAD WEBSITE SETTINGS */
/* ================================================= */

async function initializeSettings() {

    try {

        App.settings = await loadSiteSettings();

        applyWebsiteSettings(App.settings);

    } catch (error) {

        console.error("Settings Error :", error);

    }

}


/* ================================================= */
/* LOAD SPORTS DATA */
/* ================================================= */

async function initializeSports() {

    try {

        const data = await Sports.fetch();

        App.liveResults = data.liveResults;

        App.oldResults = data.oldResults;

    } catch (error) {

        console.error("Sports Error :", error);

    }

}
/* ================================================= */
/* RENDER LIVE RESULTS */
/* ================================================= */

function renderLiveResults() {

    const container = document.getElementById("liveResultContainer");

    if (!container) return;

    container.innerHTML = "";

    if (!App.liveResults.length) {

        container.innerHTML = `
            <div class="empty-message">
                No Live Result Available
            </div>
        `;

        return;

    }

    App.liveResults.forEach(result => {

        const card = document.createElement("div");

        card.className = "live-result-card";

        card.innerHTML = `

            <h3>${result.game || "-"}</h3>

            <p><strong>Result :</strong> ${result.result || "-"}</p>

            <p><strong>Time :</strong> ${result.time || "-"}</p>

        `;

        container.appendChild(card);

    });

}


/* ================================================= */
/* RENDER RESULT TABLE */
/* ================================================= */

function renderResultTable() {

    const table = document.getElementById("resultTable");

    if (!table) return;

    table.innerHTML = "";

    App.oldResults.forEach(item => {

        table.innerHTML += `

        <tr>

            <td>${item.date || "-"}</td>

            <td>${item.morning || "-"}</td>

            <td>${item.day || "-"}</td>

            <td>${item.night || "-"}</td>

        </tr>

        `;

    });

}
/* ================================================= */
/* INITIALIZE APPLICATION */
/* ================================================= */

async function initializeApp() {

    try {

        showLoader();

        await initializeSettings();

        await initializeSports();

        renderLiveResults();

        renderResultTable();

        hideLoader();

        App.initialized = true;

        console.log("Application Started Successfully");

    } catch (error) {

        console.error("Application Initialization Error:", error);

        hideLoader();

        showToast("Something went wrong!", "error");

    }

}


/* ================================================= */
/* AUTO REFRESH */
/* ================================================= */

function startApplication() {

    initializeApp();

    Sports.startAutoRefresh(60000);

}


/* ================================================= */
/* PAGE LOAD */
/* ================================================= */

document.addEventListener("DOMContentLoaded", () => {

    startApplication();

});


/* ================================================= */
/* WINDOW EVENTS */
/* ================================================= */

window.addEventListener("online", () => {

    showToast("Internet Connected", "success");

});

window.addEventListener("offline", () => {

    showToast("Internet Disconnected", "error");

});
