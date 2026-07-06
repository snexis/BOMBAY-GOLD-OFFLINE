import {
    db,
    COLLECTION,
    doc,
    getDoc,
    collection,
    getDocs
} from "./firebase.js";

/* ==========================
   ELEMENTS
========================== */

const loader = document.getElementById("loader");

const websiteName = document.getElementById("websiteName");
const welcomeText = document.getElementById("welcomeText");
const noticeText = document.getElementById("noticeText");
const footerText = document.getElementById("footerText");

const morningResult = document.getElementById("morningResult");
const dayResult = document.getElementById("dayResult");
const eveningResult = document.getElementById("eveningResult");
const nightResult = document.getElementById("nightResult");

const liveResultContainer =
document.getElementById("liveResultContainer");

const resultHistory =
document.getElementById("resultHistory");


/* ==========================
   LOAD WEBSITE SETTINGS
========================== */

async function loadWebsite() {

    const snap = await getDoc(
        doc(db, COLLECTION.SETTINGS, "website")
    );

    if (snap.exists()) {

        const data = snap.data();

        websiteName.textContent =
        data.websiteName || "Live Result";

        document.title =
        data.websiteName || "Live Result";

        welcomeText.textContent =
        data.welcomeText || "";

        noticeText.textContent =
        data.noticeText || "";

        footerText.textContent =
        data.footerText || "";

    }

}


/* ==========================
   LOAD TODAY RESULT
========================== */

async function loadTodayResult() {

    const snap = await getDoc(
        doc(db, COLLECTION.SETTINGS, "todayResult")
    );

    if (snap.exists()) {

        const data = snap.data();

        morningResult.textContent =
        data.morning || "--";

        dayResult.textContent =
        data.day || "--";

        eveningResult.textContent =
        data.evening || "--";

        nightResult.textContent =
        data.night || "--";

    }

}
import {
    db,
    COLLECTION,
    doc,
    getDoc,
    collection,
    getDocs
} from "./firebase.js";

/* ==========================
   ELEMENTS
========================== */

const loader = document.getElementById("loader");

const websiteName = document.getElementById("websiteName");
const welcomeText = document.getElementById("welcomeText");
const noticeText = document.getElementById("noticeText");
const footerText = document.getElementById("footerText");

const morningResult = document.getElementById("morningResult");
const dayResult = document.getElementById("dayResult");
const eveningResult = document.getElementById("eveningResult");
const nightResult = document.getElementById("nightResult");

const liveResultContainer =
document.getElementById("liveResultContainer");

const resultHistory =
document.getElementById("resultHistory");


/* ==========================
   LOAD WEBSITE SETTINGS
========================== */

async function loadWebsite() {

    const snap = await getDoc(
        doc(db, COLLECTION.SETTINGS, "website")
    );

    if (snap.exists()) {

        const data = snap.data();

        websiteName.textContent =
        data.websiteName || "Live Result";

        document.title =
        data.websiteName || "Live Result";

        welcomeText.textContent =
        data.welcomeText || "";

        noticeText.textContent =
        data.noticeText || "";

        footerText.textContent =
        data.footerText || "";

    }

}


/* ==========================
   LOAD TODAY RESULT
========================== */

async function loadTodayResult() {

    const snap = await getDoc(
        doc(db, COLLECTION.SETTINGS, "todayResult")
    );

    if (snap.exists()) {

        const data = snap.data();

        morningResult.textContent =
        data.morning || "--";

        dayResult.textContent =
        data.day || "--";

        eveningResult.textContent =
        data.evening || "--";

        nightResult.textContent =
        data.night || "--";

    }

}
/* ==========================
   HIDE LOADER
========================== */

function hideLoader() {

    if (loader) {

        loader.style.display = "none";

    }

}


/* ==========================
   INITIALIZE WEBSITE
========================== */

async function initWebsite() {

    try {

        await loadWebsite();

        await loadTodayResult();

        await loadLiveResult();

        await loadHistory();

    } catch (error) {

        console.error("Initialization Error:", error);

        alert("Failed To Load Website Data.");

    } finally {

        hideLoader();

    }

}


/* ==========================
   START WEBSITE
========================== */

window.addEventListener("DOMContentLoaded", () => {

    initWebsite();

});
