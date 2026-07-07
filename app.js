import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// ফায়ারবেস কনফিগারেশন
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

// ফিউচার প্রুফ: টাইম স্লট বা ডেটা অবজেক্ট সহজেই মডিফাই বা এক্সটেন্ড করা যাবে এখান থেকে
const coreAppConfig = {
    timeSlots: ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM", "08:50 PM"],
    dbRootNode: "game_results"
};

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

    let currentUserRole = "guest"; 

    // --- ১. ভিজিটর মেইন পেজ ভিউ ইঞ্জিন (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, coreAppConfig.dbRootNode), (snapshot) => {
            const data = snapshot.val();
            
            // রাত ১২টার ফিক্স: ডাটাবেস ফাঁকা থাকলেও স্ক্রিন আটকে থাকবে না, নোটিশ বা ওল্ড ডাটা ট্র্যাকার চলবে
            if (!data || !data.records) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট ডাটাবেসে পাওয়া যায়নি।</div>';
                return;
            }

            // গ্লোবাল স্মার্ট ওয়েবসাইট সেটিংস লোড করা
            if (data.settings) {
                if (data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if (data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if (data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if (data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
                
                const alertBar = document.getElementById("custom-alert-bar");
                if (data.settings.customAlert && data.settings.customAlert.trim() !== "") {
                    alertBar.textContent = data.settings.customAlert;
                    alertBar.style.display = "block";
                } else {
                    alertBar.style.display = "none";
                }

                // লাইভ ব্যাকগ্রাউন্ড ইমেজ চেঞ্জার ইঞ্জিন
                if (data.settings.bgUrl && data.settings.bgUrl.trim() !== "") {
                    document.body.style.setProperty("background-image", `url('${data.settings.bgUrl}')`, "important");
                } else {
                    document.body.style.backgroundImage = "none";
                }
            }

            resultsContainer.innerHTML = "";
            const records = data.records;
            
            // ক্রনোলজিক্যাল সর্টিং লজিক (নতুন তারিখ সবসময় থাকবে সবার ওপরে, পুরোনো ডাটা কখনো ডিলিট বা হাইড হবে না)
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            if (sortedDates.length === 0) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো রেজাল্ট রেকর্ড হিস্ট্রি পাওয়া যায়নি।</div>';
                return;
            }

            sortedDates.forEach(dateKey => {
                const dayData = records[dateKey];
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;
                const activeSlots = coreAppConfig.timeSlots;

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

    // --- ২. ডবল সিকিউরিটি অ্যাডমিন কন্ট্রোল ইঞ্জিন (admin.html) ---
    if (adminInputsBody && btnPublish) {
        const btnLogin = document.getElementById("btn-login");
        const btnLogout = document.getElementById("btn-logout");
        const passInput = document.getElementById("admin-password");
        const authScreen = document.getElementById("admin-auth-screen");
        const mainContent = document.getElementById("admin-main-content");
        const dateInput = document.getElementById("result-date");
        const masterSettingsBox = document.getElementById("master-settings-box");
        const roleBadge = document.getElementById("admin-role-badge");

        // লগইন ফাংশনালিটি
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                const password = passInput.value.trim();
                if (password === "7777") { 
                    currentUserRole = "master";
                    authScreen.style.display = "none";
                    mainContent.style.display = "block";
                    masterSettingsBox.style.display = "block"; // মাস্টার সেটিংস অন
                    roleBadge.textContent = "★ ROLE: MASTER ADMIN";
                    roleBadge.className = "role-badge";
                    roleBadge.style.background = "#fffbeb";
                    roleBadge.style.color = "#b78103";
                    loadExistingData();
                } else if (password === "1234") { 
                    currentUserRole = "staff";
                    authScreen.style.display = "none";
                    mainContent.style.display = "block";
                    masterSettingsBox.style.display = "none";  // স্টাফের জন্য হাইড
                    roleBadge.textContent = "● ROLE: STAFF (Results Only)";
                    roleBadge.className = "role-badge";
                    roleBadge.style.background = "#f1f5f9";
                    roleBadge.style.color = "#475569";
                    loadExistingData();
                } else {
                    alert("ভুল পাসওয়ার্ড! সঠিক কোড দিন।");
                }
            });
        }

        // লগআউট ফাংশনালিটি
        if (btnLogout) {
            btnLogout.addEventListener("click", () => {
                currentUserRole = "guest";
                passInput.value = "";
                mainContent.style.display = "none";
                authScreen.style.display = "block";
            });
        }

        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            get(ref(database, coreAppConfig.dbRootNode)).then((snapshot) => {
                const globalData = snapshot.val() || {};
                const records = globalData.records || {};
                const dayData = records[selectedDate] || {};
                
                adminInputsBody.innerHTML = ""; 
                const activeSlots = coreAppConfig.timeSlots;

                activeSlots.forEach(time => {
                    const pattiVal = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    const singleVal = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                    
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" class="input-time" value="${time}" readonly style="background:#f1f5f9; color:#475569; border:none; font-size:12px;"></td>
                        <td><input type="text" class="input-patti" value="${pattiVal}" placeholder="-"></td>
                        <td><input type="text" class="input-single" value="${singleVal}" placeholder="-"></td>
                    `;
                    adminInputsBody.appendChild(tr);
                });

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

        // কারেন্ট ডেট রোটেশন ইনিশিয়েট
        dateInput.value = getLocalDateString(new Date());
        loadExistingData();
        dateInput.addEventListener("change", loadExistingData);

        // লাইভ পাবলিশ মেকানিজম ও সাকসেস মেসেজ ট্র্যাকার
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return alert("দয়া করে তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.querySelector(".input-time").value.trim();
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                
                if (time) {
                    recordsUpdate[time] = { patti, single };
                }
            });

            const savePromises = [
                set(ref(database, `${coreAppConfig.dbRootNode}/records/${selectedDate}`), recordsUpdate)
            ];

            // ডবল সিকিউরিটি চেইন ভ্যালিডেশন
            if (currentUserRole === "master") {
                const settings = {
                    subtitle: document.getElementById("input-subtitle").value.trim(),
                    marquee: document.getElementById("input-marquee").value.trim(),
                    tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                    pattiUrl: document.getElementById("input-patti-url").value.trim() || "#",
                    customAlert: document.getElementById("input-alert").value.trim(),
                    bgUrl: document.getElementById("input-bg-url").value.trim()
                };
                savePromises.push(set(ref(database, `${coreAppConfig.dbRootNode}/settings`), settings));
            }

            Promise.all(savePromises).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "✓ Live Update Successful!";
                statusMsg.className = "status-msg status-success";
                
                // স্ক্রোল করে মেসেজ বক্সে নিয়ে যাওয়া যাতে ইউজার দেখতে পায়
                statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => { 
                    statusMsg.style.display = "none"; 
                }, 3000);
            }).catch(err => alert("ফায়ারবেস ত্রুটি: " + err.message));
        });
    }
});
