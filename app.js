import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const defaultTimeSlots = ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM", "08:50 PM"];

const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnPublish = document.getElementById("btn-publish");

    // বর্তমান ইউজারের রোল ট্র্যাক করার ভেরিয়েবল
    let currentUserRole = "guest"; 

    // --- ১. ইউজার মেইন সাইট ভিউ লজিক (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, "game_results"), (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            if(data.settings) {
                if(data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if(data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if(data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if(data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
                
                const alertBar = document.getElementById("custom-alert-bar");
                if(data.settings.customAlert && data.settings.customAlert.trim() !== "") {
                    alertBar.textContent = data.settings.customAlert;
                    alertBar.style.display = "block";
                } else {
                    alertBar.style.display = "none";
                }

                if(data.settings.bgUrl && data.settings.bgUrl.trim() !== "") {
                    document.body.style.backgroundImage = `url('${data.settings.bgUrl}')`;
                } else {
                    document.body.style.backgroundImage = "none";
                    document.body.style.backgroundColor = "#f4f6f9";
                }
            }

            resultsContainer.innerHTML = "";
            const records = data.records || {};
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(dateKey => {
                const dayData = records[dateKey];
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;
                const activeSlots = dayData._slotsOrder ? dayData._slotsOrder : defaultTimeSlots;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead>
                                    <tr>${activeSlots.map(t => `<th>${t}</th>`).join("")}</tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        ${activeSlots.map(t => {
                                            let patti = (dayData[t] && dayData[t].patti) ? dayData[t].patti : "-";
                                            let single = (dayData[t] && dayData[t].single) ? dayData[t].single : "-";
                                            return `<td><span class="patti-row-text">${patti}</span><span class="single-row-text">${single}</span></td>`;
                                        }).join("")}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                resultsContainer.innerHTML += tableHtml;
            });
        });
    }

    // --- ২. অ্যাডমিন প্যানেল কন্ট্রোল লজিক (admin.html) ---
    if (adminInputsBody && btnPublish) {
        const btnLogin = document.getElementById("btn-login");
        const passInput = document.getElementById("admin-password");
        const authScreen = document.getElementById("admin-auth-screen");
        const mainContent = document.getElementById("admin-main-content");
        const dateInput = document.getElementById("result-date");
        const masterSettingsBox = document.getElementById("master-settings-box");
        const roleBadge = document.getElementById("admin-role-badge");

        // মাস্টার ও জেনারেল অ্যাডমিন লগইন সিস্টেম
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                const password = passInput.value.trim();

                if (password === "7777") { 
                    // মাস্টার অ্যাডমিন লগইন
                    currentUserRole = "master";
                    authScreen.style.display = "none";
                    mainContent.style.display = "block";
                    masterSettingsBox.style.display = "block"; // সেটিংস ওপেন হবে
                    roleBadge.textContent = "★ ROLE: MASTER ADMIN";
                    roleBadge.style.background = "#ffd700";
                    roleBadge.style.color = "#111";
                    loadExistingData();
                } else if (password === "1234") { 
                    // সাধারণ স্টাফ অ্যাডমিন লগইন
                    currentUserRole = "staff";
                    authScreen.style.display = "none";
                    mainContent.style.display = "block";
                    masterSettingsBox.style.display = "none"; // সেটিংস হাইড থাকবে
                    roleBadge.textContent = "● ROLE: STAFF ADMIN (Results Only)";
                    roleBadge.style.background = "#e2e8f0";
                    roleBadge.style.color = "#4a5568";
                    loadExistingData();
                } else {
                    alert("ভুল পাসওয়ার্ড! আবার সঠিক পাসওয়ার্ড দিন।");
                }
            });
        }

        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            get(ref(database, `game_results`)).then((snapshot) => {
                const globalData = snapshot.val() || {};
                const records = globalData.records || {};
                const dayData = records[selectedDate] || {};
                
                adminInputsBody.innerHTML = ""; 
                const activeSlots = dayData._slotsOrder ? dayData._slotsOrder : defaultTimeSlots;

                activeSlots.forEach(time => {
                    const pattiVal = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    const singleVal = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                    
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" class="input-time" value="${time}"></td>
                        <td><input type="text" class="input-patti" value="${pattiVal}" placeholder="-"></td>
                        <td><input type="text" class="input-single" value="${singleVal}" placeholder="-"></td>
                    `;
                    adminInputsBody.appendChild(tr);
                });

                // ওল্ড সেটিংস ডাটা ইনপুট বক্সে রিলোড করা (শুধুমাত্র ইনপুট ভ্যালু ধরে রাখার জন্য)
                if (globalData.settings) {
                    document.getElementById("input-subtitle").value = globalData.settings.subtitle || "";
                    document.getElementById("input-marquee").value = globalData.settings.marquee || "";
                    document.getElementById("input-tips-url").value = globalData.settings.tipsUrl || "";
                    document.getElementById("input-patti-url").value = globalData.settings.pattiUrl || "";
                    document.getElementById("input-alert").value = globalData.settings.customAlert || "";
                    document.getElementById("input-bg-url").value = globalData.settings.bgUrl || "";
                }
            });
        };

        dateInput.value = getLocalDateString(new Date());
        dateInput.addEventListener("change", loadExistingData);

        // পাবলিশ বাটন লজিক (রোল অনুযায়ী ডাটা সেভ করবে)
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return alert("দয়া করে তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            let slotsOrder = [];

            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.querySelector(".input-time").value.trim();
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                
                if (time) {
                    slotsOrder.push(time);
                    recordsUpdate[time] = { patti, single };
                }
            });

            recordsUpdate["_slotsOrder"] = slotsOrder;

            // ১. রেজাল্ট সেভ করার পারমিশন সবারই আছে
            const savePromises = [
                set(ref(database, `game_results/records/${selectedDate}`), recordsUpdate)
            ];

            // ২. যদি মাস্টার অ্যাডমিন লগইন করে, তবেই কেবল ওয়েবসাইট সেটিংস আপডেট হবে
            if (currentUserRole === "master") {
                const settings = {
                    subtitle: document.getElementById("input-subtitle").value.trim(),
                    marquee: document.getElementById("input-marquee").value.trim(),
                    tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                    pattiUrl: document.getElementById("input-patti-url").value.trim() || "#",
                    customAlert: document.getElementById("input-alert").value.trim(),
                    bgUrl: document.getElementById("input-bg-url").value.trim()
                };
                savePromises.push(set(ref(database, `game_results/settings`), settings));
            }

            Promise.all(savePromises).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = currentUserRole === "master" ? "রেজাল্ট ও ওয়েবসাইট সেটিংস সফলভাবে সেভ হয়েছে!" : "রেজাল্ট সফলভাবে লাইভ করা হয়েছে! (সেটিংস অপরিবর্তিত)";
                statusMsg.className = "status-msg status-success";
                setTimeout(() => { statusMsg.style.display = "none"; }, 3000);
            }).catch(err => alert("ফায়ারবেস ত্রুটি: " + err.message));
        });
    }
});
