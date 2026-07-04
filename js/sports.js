// ==========================
// SPORTS.JS
// ==========================

// Manual Mode
let manualSports = false;

// Cricket Auto Update
async function fetchCricket() {

    if (manualSports) return;

    try {

        // এখানে পরে Cricket API যোগ হবে

        document.getElementById("cricketScore").innerText =
            "No Live Match";

    } catch (e) {

        document.getElementById("cricketScore").innerText =
            "Cricket Error";

    }

}

// Football Auto Update
async function fetchFootball() {

    if (manualSports) return;

    try {

        // এখানে পরে Football API যোগ হবে

        document.getElementById("footballScore").innerText =
            "No Live Match";

    } catch (e) {

        document.getElementById("footballScore").innerText =
            "Football Error";

    }

}

// Manual Override

export function updateManualSports(data) {

    if (!data) return;

    manualSports = false;

    if (data.cricket) {

        manualSports = true;

        document.getElementById("cricketScore").innerText =
            data.cricket;

    }

    if (data.football) {

        manualSports = true;

        document.getElementById("footballScore").innerText =
            data.football;

    }

}

// Start Auto Update

fetchCricket();
fetchFootball();

setInterval(fetchCricket, 30000);
setInterval(fetchFootball, 30000);
