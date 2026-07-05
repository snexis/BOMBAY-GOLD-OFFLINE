/* ================================================= */
/* ADMIN ELEMENTS */
/* ================================================= */

const siteNameInput = document.getElementById("siteNameInput");

const logoInput = document.getElementById("logoInput");

const welcomeInput = document.getElementById("welcomeInput");

const noticeInput = document.getElementById("noticeInput");

const footerInput = document.getElementById("footerInput");

const saveSettingsBtn = document.getElementById("saveSettings");


const gameNameInput = document.getElementById("gameNameInput");

const gameResultInput = document.getElementById("gameResultInput");

const gameTimeInput = document.getElementById("gameTimeInput");

const saveLiveResultBtn = document.getElementById("saveLiveResult");


const resultDateInput = document.getElementById("resultDateInput");

const morningInput = document.getElementById("morningInput");

const dayInput = document.getElementById("dayInput");

const nightInput = document.getElementById("nightInput");

const saveOldResultBtn = document.getElementById("saveOldResult");


/* ================================================= */
/* LOAD SETTINGS */
/* ================================================= */

async function loadAdminSettings(){

    const settings = await loadSiteSettings();

    siteNameInput.value = settings.siteName || "";

    logoInput.value = settings.logo || "";

    welcomeInput.value = settings.welcomeText || "";

    noticeInput.value = settings.notice || "";

    footerInput.value = settings.footer || "";

}
/* ================================================= */
/* SAVE OLD RESULT */
/* ================================================= */

saveOldResultBtn.addEventListener("click", async () => {

    try {

        const id = resultDateInput.value;

        if (!id) {

            alert("Please Select A Date");

            return;

        }

        const data = {

            date: resultDateInput.value,

            morning: morningInput.value.trim(),

            day: dayInput.value.trim(),

            night: nightInput.value.trim(),

            updatedAt: new Date().toISOString()

        };

        await saveDocument(

            COLLECTIONS.oldResults,

            id,

            data

        );

        alert("Old Result Saved Successfully");

    } catch (error) {

        console.error(error);

        alert("Failed To Save Old Result");

    }

});


/* ================================================= */
/* PREVIEW */
/* ================================================= */

function updatePreview() {

    const preview = document.getElementById("previewArea");

    if (!preview) return;

    preview.innerHTML = `

        <h3>${siteNameInput.value || "Website Name"}</h3>

        <p>${welcomeInput.value || "Welcome Text"}</p>

        <p>${noticeInput.value || "Notice Text"}</p>

        <small>${footerInput.value || "Footer Text"}</small>

    `;

}

siteNameInput.addEventListener("input", updatePreview);
welcomeInput.addEventListener("input", updatePreview);
noticeInput.addEventListener("input", updatePreview);
footerInput.addEventListener("input", updatePreview);


/* ================================================= */
/* INITIALIZE ADMIN PANEL */
/* ================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await loadAdminSettings();

        updatePreview();

        console.log("Admin Panel Ready");

    } catch (error) {

        console.error("Admin Initialization Error:", error);

    }

})
