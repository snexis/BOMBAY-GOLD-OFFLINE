// ==========================================
// BOMBAY GOLD
// APP.JS
// ==========================================

// Firebase SDK Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getDatabase,
ref,
set,
get,
update,
remove,
push,
onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
getAuth,
signInWithEmailAndPassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {

apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",

authDomain: "live-result-b9155.firebaseapp.com",

databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",

projectId: "live-result-b9155",

storageBucket: "live-result-b9155.firebasestorage.app",

messagingSenderId: "495121483481",

appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",

measurementId: "G-DFDW40QF87"

};


// ==========================================
// INITIALIZE
// ==========================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const auth = getAuth(app);


// ==========================================
// GLOBAL
// ==========================================

const today = new Date();

const currentDate = today.toLocaleDateString();

const currentTime = today.toLocaleTimeString();


// ==========================================
// HELPER
// ==========================================

function id(name){

return document.getElementById(name);

}

function randomCode(){

return Math.floor(100000 + Math.random()*900000).toString();

}

function show(msg){

alert(msg);

}
// ==========================================
// PAGE DETECT
// ==========================================

const currentPage = window.location.pathname.split("/").pop();

const isIndex = currentPage === "index.html" || currentPage === "";

const isAdmin = currentPage === "admin.html";

const isPlayer = currentPage === "player.html";


// ==========================================
// LOAD LIVE RESULT
// ==========================================

function loadLiveResult() {

const resultRef = ref(db, "liveResult");

onValue(resultRef, (snapshot) => {

const data = snapshot.val();

if (!data) return;

if (id("r1020")) id("r1020").innerHTML = data.r1020 || "--";
if (id("r1150")) id("r1150").innerHTML = data.r1150 || "--";
if (id("r0120")) id("r0120").innerHTML = data.r0120 || "--";
if (id("r0250")) id("r0250").innerHTML = data.r0250 || "--";

if (id("r0420")) id("r0420").innerHTML = data.r0420 || "--";
if (id("r0550")) id("r0550").innerHTML = data.r0550 || "--";
if (id("r0720")) id("r0720").innerHTML = data.r0720 || "--";
if (id("r0850")) id("r0850").innerHTML = data.r0850 || "--";

});

}


// ==========================================
// LOAD NOTICE
// ==========================================

function loadNotice() {

const noticeRef = ref(db, "notice");

onValue(noticeRef, (snapshot) => {

const data = snapshot.val();

if (id("noticeText"))
id("noticeText").innerHTML = data || "";

if (id("todayNotice"))
id("todayNotice").innerHTML = data || "";

});

}


// ==========================================
// LOAD LIVE STATUS
// ==========================================

function loadLiveStatus() {

const liveRef = ref(db, "settings/live");

onValue(liveRef, (snapshot) => {

const status = snapshot.val();

if (id("liveMessage")) {

id("liveMessage").innerHTML =
status === "OFF"
? "🔴 LIVE CLOSED"
: "🟢 LIVE RESULT RUNNING";

}

});

}


// ==========================================
// INDEX PAGE START
// ==========================================

if (isIndex) {

loadLiveResult();

loadNotice();

loadLiveStatus();

}
// ==========================================
// ADMIN LOGIN
// ==========================================

if (isAdmin) {

const loginBtn = id("loginBtn");

if (loginBtn) {

loginBtn.addEventListener("click", async () => {

const email = id("loginId").value.trim();

const password = id("loginPassword").value;

try {

await signInWithEmailAndPassword(auth, email, password);

id("loginPage").style.display = "none";

id("adminPanel").style.display = "block";

loadAdminData();

show("Login Successful");

} catch (err) {

id("loginMessage").innerText = "Invalid Email or Password";

}

});

}

}


// ==========================================
// LOAD ADMIN DATA
// ==========================================

function loadAdminData() {

const resultRef = ref(db, "liveResult");

onValue(resultRef, (snapshot) => {

const data = snapshot.val() || {};

if (id("r1")) id("r1").value = data.r1020 || "";
if (id("r2")) id("r2").value = data.r1150 || "";
if (id("r3")) id("r3").value = data.r0120 || "";
if (id("r4")) id("r4").value = data.r0250 || "";

if (id("r5")) id("r5").value = data.r0420 || "";
if (id("r6")) id("r6").value = data.r0550 || "";
if (id("r7")) id("r7").value = data.r0720 || "";
if (id("r8")) id("r8").value = data.r0850 || "";

});

const noticeRef = ref(db, "notice");

onValue(noticeRef, (snapshot) => {

if (id("notice")) {

id("notice").value = snapshot.val() || "";

}

});

}


// ==========================================
// SAVE ALL
// ==========================================

const saveBtn = id("saveAll");

if (saveBtn) {

saveBtn.addEventListener("click", async () => {

await update(ref(db, "liveResult"), {

r1020: id("r1").value,

r1150: id("r2").value,

r0120: id("r3").value,

r0250: id("r4").value,

r0420: id("r5").value,

r0550: id("r6").value,

r0720: id("r7").value,

r0850: id("r8").value

});

await set(ref(db, "notice"), id("notice").value);

await set(ref(db, "settings/live"), id("liveStatus").value);

show("Data Saved Successfully");

});

}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = id("logoutBtn");

if (logoutBtn) {

logoutBtn.addEventListener("click", async () => {

await signOut(auth);

location.reload();

});

}
// ==========================================
// LOAD PREVIOUS RESULT
// ==========================================

function loadPreviousResult() {

    const previousRef = ref(db, "previousResult");

    onValue(previousRef, (snapshot) => {

        const data = snapshot.val() || {};

        if (id("previousDate")) {
            id("previousDate").textContent = data.date || "--/--/----";
        }

        if (id("previousResult")) {
            id("previousResult").textContent = data.result || "--";
        }

    });

}


// ==========================================
// LOAD CURRENT DATE
// ==========================================

function loadCurrentDate() {

    const date = new Date();

    const today = date.toLocaleDateString();

    if (id("todayDate")) {
        id("todayDate").innerHTML = today;
    }

    if (id("playerDate")) {
        id("playerDate").innerHTML = today;
    }

}


// ==========================================
// ARCHIVE TODAY RESULT
// ==========================================

async function archiveCurrentResult() {

    const snap = await get(ref(db, "liveResult"));

    if (!snap.exists()) return;

    const data = snap.val();

    const summary = [
        data.r1020,
        data.r1150,
        data.r0120,
        data.r0250,
        data.r0420,
        data.r0550,
        data.r0720,
        data.r0850
    ].filter(Boolean).join(" | ");

    await set(ref(db, "previousResult"), {

        date: new Date().toLocaleDateString(),

        result: summary

    });

}


// ==========================================
// LIVE STATUS SYNC
// ==========================================

function syncLiveStatus() {

    const liveRef = ref(db, "settings/live");

    onValue(liveRef, (snapshot) => {

        const status = snapshot.val() || "ON";

        if (id("liveStatusText")) {
            id("liveStatusText").textContent = status;
        }

        if (id("liveMessage")) {

            id("liveMessage").textContent =
                status === "OFF"
                    ? "🔴 LIVE CLOSED"
                    : "🟢 LIVE RESULT RUNNING";

        }

    });

}


// ==========================================
// PAGE LOAD
// ==========================================

loadCurrentDate();

loadPreviousResult();

syncLiveStatus();
// ==========================================
// FIREBASE CONNECTION STATUS
// ==========================================

function monitorConnection() {

    const connectedRef = ref(db, ".info/connected");

    onValue(connectedRef, (snapshot) => {

        const connected = snapshot.val();

        if (id("connectionStatus")) {

            id("connectionStatus").textContent =
                connected ? "🟢 Online" : "🔴 Offline";

        }

        console.log(
            connected
                ? "Firebase Connected"
                : "Firebase Disconnected"
        );

    });

}


// ==========================================
// AUTO REFRESH TIME
// ==========================================

function startClock() {

    if (!id("currentTime")) return;

    setInterval(() => {

        const now = new Date();

        id("currentTime").textContent =
            now.toLocaleTimeString();

    }, 1000);

}


// ==========================================
// SAFE VALUE
// ==========================================

function safeValue(value) {

    if (value === undefined || value === null) {

        return "";

    }

    return String(value);

}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(error) {

    console.error(error);

    if (id("errorMessage")) {

        id("errorMessage").textContent =
            "Something went wrong.";

    }

}


// ==========================================
// PAGE INITIALIZATION
// ==========================================

window.addEventListener("load", () => {

    monitorConnection();

    startClock();

    console.log("Bombay Gold Live Result Loaded");

});
{
  "liveResult": {
    "r1020": "",
    "r1150": "",
    "r0120": "",
    "r0250": "",
    "r0420": "",
    "r0550": "",
    "r0720": "",
    "r0850": ""
  },
  "notice": "",
  "previousResult": {
    "date": "",
    "result": ""
  },
  "settings": {
    "live": "ON"
  }
}
