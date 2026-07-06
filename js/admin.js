import {
    db,
    COLLECTION,
    doc,
    setDoc
} from "./firebase.js";

/* ==========================
   ELEMENTS
========================== */

const websiteName = document.getElementById("websiteName");
const welcomeText = document.getElementById("welcomeText");
const noticeText = document.getElementById("noticeText");
const footerText = document.getElementById("footerText");

const morning = document.getElementById("morning");
const day = document.getElementById("day");
const evening = document.getElementById("evening");
const night = document.getElementById("night");

const gameName = document.getElementById("gameName");
const liveResult = document.getElementById("liveResult");

const resultDate = document.getElementById("resultDate");
const oldMorning = document.getElementById("oldMorning");
const oldDay = document.getElementById("oldDay");
const oldEvening = document.getElementById("oldEvening");
const oldNight = document.getElementById("oldNight");

const saveSettings =
document.getElementById("saveSettings");

const saveTodayResult =
document.getElementById("saveTodayResult");

const saveLiveResult =
document.getElementById("saveLiveResult");

const saveHistory =
document.getElementById("saveHistory");

/* ==========================
   SAVE WEBSITE SETTINGS
========================== */

saveSettings.addEventListener("click", async () => {

    try{

        await setDoc(
            doc(db, COLLECTION.SETTINGS, "website"),
            {

                websiteName:
                websiteName.value,

                welcomeText:
                welcomeText.value,

                noticeText:
                noticeText.value,

                footerText:
                footerText.value

            }
        );

        alert("Website Settings Saved");

    }catch(error){

        console.log(error);

        alert("Save Failed");

    }

});
/* ==========================
   SAVE TODAY RESULT
========================== */

saveTodayResult.addEventListener("click", async () => {

    try{

        await setDoc(
            doc(db, COLLECTION.SETTINGS, "todayResult"),
            {

                morning: morning.value,

                day: day.value,

                evening: evening.value,

                night: night.value,

                updatedAt: new Date().toISOString()

            }
        );

        alert("Today's Result Saved");

    }catch(error){

        console.error(error);

        alert("Failed To Save Today's Result");

    }

});


/* ==========================
   SAVE LIVE RESULT
========================== */

saveLiveResult.addEventListener("click", async () => {

    try{

        const id = Date.now().toString();

        await setDoc(
            doc(db, COLLECTION.LIVE, id),
            {

                gameName: gameName.value,

                result: liveResult.value,

                createdAt: new Date().toISOString()

            }
        );

        alert("Live Result Saved");

        gameName.value = "";
        liveResult.value = "";

    }catch(error){

        console.error(error);

        alert("Failed To Save Live Result");

    }

});
/* ==========================
   SAVE PREVIOUS RESULT
========================== */

saveHistory.addEventListener("click", async () => {

    try {

        if (!resultDate.value) {
            alert("Please Select Date");
            return;
        }

        await setDoc(
            doc(db, COLLECTION.HISTORY, resultDate.value),
            {

                date: resultDate.value,

                morning: oldMorning.value,

                day: oldDay.value,

                evening: oldEvening.value,

                night: oldNight.value,

                createdAt: new Date().toISOString()

            }
        );

        alert("Previous Result Saved");

        resultDate.value = "";
        oldMorning.value = "";
        oldDay.value = "";
        oldEvening.value = "";
        oldNight.value = "";

    } catch (error) {

        console.error(error);

        alert("Failed To Save Previous Result");

    }

});


/* ==========================
   PAGE READY
========================== */

window.addEventListener("load", () => {

    console.log("Admin Panel Ready");

});
