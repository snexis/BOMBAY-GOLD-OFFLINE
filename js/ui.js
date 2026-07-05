/* ================================================= */
/* UI Elements */
/* ================================================= */

const loader = document.getElementById("loader");

const siteLogo = document.getElementById("siteLogo");

const siteName = document.getElementById("siteName");

const pageTitle = document.getElementById("pageTitle");

const welcomeText = document.getElementById("welcomeText");

const noticeText = document.getElementById("noticeText");

const footerText = document.getElementById("footerText");

const mainHeading = document.getElementById("mainHeading");

const todayDate = document.getElementById("todayDate");

const liveTitle = document.getElementById("liveTitle");

const allResultTitle = document.getElementById("allResultTitle");

const scrollTopBtn = document.getElementById("scrollTopBtn");


/* ================================================= */
/* Loader */
/* ================================================= */

function showLoader(){

    loader.style.display = "flex";

}

function hideLoader(){

    loader.style.display = "none";

}


/* ================================================= */
/* Website Settings */
/* ================================================= */

function applyWebsiteSettings(settings){

    if(!settings) return;

    if(settings.siteName){

        siteName.textContent = settings.siteName;

        pageTitle.textContent = settings.siteName;

    }

    if(settings.logo){

        siteLogo.src = settings.logo;

    }

    if(settings.welcomeText){

        welcomeText.textContent = settings.welcomeText;

    }

    if(settings.notice){

        noticeText.textContent = settings.notice;

    }

    if(settings.footer){

        footerText.textContent = settings.footer;

    }

}
/* ================================================= */
/* Toast Notification */
/* ================================================= */

const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "success") {

    const toast = document.createElement("div");

    toast.className = "toast " + type;

    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3000);

}


/* ================================================= */
/* Modal */
/* ================================================= */

const modal = document.getElementById("globalModal");

const modalBody = document.getElementById("modalBody");

const closeModal = document.getElementById("closeModal");

function openModal(content) {

    modalBody.innerHTML = content;

    modal.style.display = "flex";

}

function hideModal() {

    modal.style.display = "none";

}

closeModal.addEventListener("click", hideModal);

window.addEventListener("click", function(event){

    if(event.target === modal){

        hideModal();

    }

});


/* ================================================= */
/* Scroll To Top */
/* ================================================= */

window.addEventListener("scroll", function(){

    if(window.scrollY > 300){

        scrollTopBtn.style.display = "block";

    }else{

        scrollTopBtn.style.display = "none";

    }

});

scrollTopBtn.addEventListener("click", function(){

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});
/* ================================================= */
/* Today's Date */
/* ================================================= */

function updateTodayDate() {

    const today = new Date();

    const options = {

        day: "2-digit",

        month: "long",

        year: "numeric"

    };

    todayDate.textContent = today.toLocaleDateString("en-IN", options);

}


/* ================================================= */
/* Default Titles */
/* ================================================= */

function initializeUI() {

    if (liveTitle) {

        liveTitle.textContent = "Today's Live Game Results";

    }

    if (allResultTitle) {

        allResultTitle.textContent = "Game Results";

    }

    updateTodayDate();

    hideLoader();

}


/* ================================================= */
/* Start UI */
/* ================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeUI();

});
