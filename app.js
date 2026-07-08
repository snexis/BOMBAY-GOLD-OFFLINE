import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

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

const CONFIG = {
    root: "game_results",
    fallbackSlots: ["10:20 AM", "11:50 AM", "01:20 PM", "04:20 PM"]
};

let loginAttempts = 0;

const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const dynamicSlotsList = document.getElementById("global-dynamic-slots-list");
    const btnAddSlotRow = document.getElementById("btn-add-new-slot-row");
    
    // স্টাফ পাসওয়ার্ড চেঞ্জের নতুন এলিমেন্ট
    const staffPasswordContainer = document.getElementById("staff-password-change-container");
    const inputStaffSelfPass = document.getElementById("input-staff-self-pass");
    const btnSaveStaffSelfPass = document.getElementById("btn-save-staff-self-pass");

    let activeRole = "guest";

    // --- ফাট ফাটাফাট ইনপুট রো তৈরি করার ইন্টারনাল ফাংশন ---
    const createSlotInputRowHTML = (value = "") => {
        if (!dynamicSlotsList) return;
        const div = document.createElement("div");
        div.className = "slot-row-item";
        div.innerHTML = `
            <input type="text" class="dynamic-slot-time-value" value="${value}" placeholder="যেমন: 10:20 AM বা 02:30 PM">
            <button type="button" class="btn-delete-slot">Delete</button>
        `;
        div.querySelector(".btn-delete-slot").addEventListener("click", () => div.remove());
        dynamicSlotsList.appendChild(div);
    };

    // আপনার ক্লিক না হওয়ার মূল বাগ ফিক্স (বাটনটি ক্লিক লিসেনারে সরাসরি বাইন্ড করা হলো)
    if (btnAddSlotRow) {
        btnAddSlotRow.onclick = function() {
            createSlotInputRowHTML("");
        };
    }

    // ==================== [ মেইন ভিজিটর পেজ ইঞ্জিন (index.html) ] ====================
    if (resultsContainer) {
        onValue(ref(database, CONFIG.root), (snapshot) => {
            const serverData = snapshot.val();
            if (!serverData) return;

            let liveSlots = serverData.settings && serverData.settings.globalSlots ? serverData.settings.globalSlots : CONFIG.fallbackSlots;

            if (serverData.settings) {
                if (serverData.settings.subtitle) document.getElementById("site-subtitle").textContent = serverData.settings.subtitle;
                if (serverData.settings.marquee) document.getElementById("site-marquee").textContent = serverData.settings.marquee;
                if (serverData.settings.tipsUrl) document.getElementById("link-tips").href = serverData.settings.tipsUrl;
                if (serverData.settings.pattiUrl) document.getElementById("link-patti").href = serverData.settings.pattiUrl;
                
                const alertBar = document.getElementById("custom-alert-bar");
                if (serverData.settings.customAlert && serverData.settings.customAlert.trim() !== "") {
                    alertBar.textContent = serverData.settings.customAlert;
                    alertBar.style.display = "block";
                } else {
                    alertBar.style.display = "none";
                }

                if (serverData.settings.bgUrl && serverData.settings.bgUrl.trim() !== "") {
                    document.body.style.setProperty("background-image", `url('${serverData.settings.bgUrl}')`, "important");
                }

                if (serverData.settings.liveStatus === "off") {
                    const lb = document.getElementById("live-indicator");
                    if (lb) { lb.textContent = "● TODAY OFF"; lb.style.background = "#ef4444"; }
                    const mw = document.getElementById("main-results-wrap");
                    if (mw) mw.style.display = "none";
                    return;
                }
            }

            resultsContainer.innerHTML = "";
            if (!serverData.records) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট আপলোড করা হয়নি।</div>';
                return;
            }

            const sortedDates = Object.keys(serverData.records).sort((a, b) => new Date(b) - new Date(a));
            sortedDates.forEach(dateKey => {
                const dayRecords = serverData.records[dateKey] || {};
                const dateParts = dateKey.split("-");
                const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${formattedDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead><tr>${liveSlots.map(s => `<th>${s}</th>`).join("")}</tr></thead>
                                <tbody>
                                    <tr>
                                        ${liveSlots.map(s => {
                                            let patti = (dayRecords[s] && dayRecords[s].patti) ? dayRecords[s].patti : "-";
                                            let single = (dayRecords[s] && dayRecords[s].single) ? dayRecords[s].single : "-";
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

    // ==================== [ সিকিউরড অ্যাডমিন প্যানেল ইঞ্জিন (admin.html) ] ====================
    if (adminInputsBody) {
        const btnLogin = document.getElementById("btn-login");
        const btnLogout = document.getElementById("btn-logout");
        const passInput = document.getElementById("admin-password");
        const authScreen = document.getElementById("admin-auth-screen");
        const mainContent = document.getElementById("admin-main-content");
        const dateInput = document.getElementById("result-date");
        const masterSettingsBox = document.getElementById("master-settings-box");
        const roleBadge = document.getElementById("admin-role-badge");
        const statusMsg = document.getElementById("status-message");

        const showAlert = (msg, isSuccess = true) => {
            statusMsg.textContent = msg;
            statusMsg.className = isSuccess ? "status-msg status-success" : "status-msg status-error";
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => { statusMsg.className = "status-msg"; }, 3500);
        };

        // লগইন ও রোল অথেন্টিকেশন সিঙ্ক
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                if (loginAttempts >= 5) {
                    alert("সিকিউরিটি লক! ৫ মিনিট পর চেষ্টা করুন।");
                    return;
                }

                const entryPass = passInput.value.trim();
                if (!entryPass) return alert("পাসওয়ার্ড লিখুন!");

                get(ref(database, `${CONFIG.root}/passwords`)).then((snap) => {
                    const dbPass = snap.val() || { master: "1985", staff: "123@" };

                    if (entryPass === String(dbPass.master)) {
                        activeRole = "master";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "block";
                        staffPasswordContainer.style.display = "none"; // মাস্টারের নিজের পাসওয়ার্ড চেঞ্জের ঘর লাগবে না
                        roleBadge.textContent = "★ ROLE: MASTER ADMIN";
                        roleBadge.style.background = "#fffbeb"; roleBadge.style.color = "#b78103";
                        syncDashboardData();
                    } else if (entryPass === String(dbPass.staff)) {
                        activeRole = "staff";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "none";
                        staffPasswordContainer.style.display = "flex"; // স্টাফের নিজের পাসওয়ার্ড বদলানোর ঘর ওপেন হবে
                        inputStaffSelfPass.value = dbPass.staff;
                        roleBadge.textContent = "● ROLE: STAFF (Results Entry)";
                        roleBadge.style.background = "#f1f5f9"; roleBadge.style.color = "#475569";
                        syncDashboardData();
                    } else {
                        loginAttempts++;
                        alert(`ভুল পাসওয়ার্ড! আর মাত্র ${5 - loginAttempts} বার চেষ্টা করতে পারবেন।`);
                    }
                });
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener("click", () => {
                activeRole = "guest"; passInput.value = "";
                mainContent.style.display = "none"; authScreen.style.display = "block";
            });
        }

        // স্টাফ প্যানেল থেকে নিজেই নিজের পাসওয়ার্ড চেঞ্জ করার বাটন লজিক
        if (btnSaveStaffSelfPass) {
            btnSaveStaffSelfPass.addEventListener("click", () => {
                const newStaffPin = inputStaffSelfPass.value.trim();
                if (!newStaffPin) return alert("পাসওয়ার্ড ফাঁকা রাখা যাবে না!");

                set(ref(database, `${CONFIG.root}/passwords/staff`), newStaffPin).then(() => {
                    showAlert("✓ আপনার স্টাফ লগইন পাসওয়ার্ডটি সফলভাবে পরিবর্তন করা হয়েছে!", true);
                }).catch(err => showAlert("ত্রুটি: " + err.message, false));
            });
        }

        // ডাটাবেস রিয়েল-টাইম রেন্ডারিং ও টেবিল জেনারেটর
        const syncDashboardData = () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            get(ref(database, CONFIG.root)).then((snapshot) => {
                const rootData = snapshot.val() || {};
                const records = rootData.records || {};
                const currentDayData = records[selectedDate] || {};

                let activeSlots = rootData.settings && rootData.settings.globalSlots ? rootData.settings.globalSlots : CONFIG.fallbackSlots;

                adminInputsBody.innerHTML = "";
                if (activeRole === "master") dynamicSlotsList.innerHTML = ""; 

                // স্টাফ ও মাস্টারের টেবিলে ডাইনামিক রো তৈরি
                activeSlots.forEach((slotName) => {
                    const pattiVal = (currentDayData[slotName] && currentDayData[slotName].patti && currentDayData[slotName].patti !== "-") ? currentDayData[slotName].patti : "";
                    const singleVal = (currentDayData[slotName] && currentDayData[slotName].single && currentDayData[slotName].single !== "-") ? currentDayData[slotName].single : "";

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" value="${slotName}" readonly style="background:#e2e8f0; font-weight:bold; cursor:not-allowed;"></td>
                        <td><input type="text" class="cell-patti" value="${pattiVal}" placeholder="-"></td>
                        <td><input type="text" class="cell-single" value="${singleVal}" placeholder="-"></td>
                        <td><button type="button" class="btn-cell-submit">Submit</button></td>
                    `;

                    // রেজাল্ট সাবমিট ও ডাবল কনফার্মেশন প্রটেকশন লজিক
                    tr.querySelector(".btn-cell-submit").addEventListener("click", () => {
                        const finalPatti = tr.querySelector(".cell-patti").value.trim() || "-";
                        const finalSingle = tr.querySelector(".cell-single").value.trim() || "-";

                        if (!confirm(`আপনি কি নিশ্চিত যে ${slotName} স্লটে [ পাত্তি: ${finalPatti}, সিঙ্গেল: ${finalSingle} ] পাবলিশ করতে চান?`)) {
                            return;
                        }

                        const rowPath = `${CONFIG.root}/records/${selectedDate}/${slotName}`;
                        set(ref(database, rowPath), { patti: finalPatti, single: finalSingle }).then(() => {
                            showAlert(`✓ ${slotName} এর রেজাল্ট সফলভাবে লাইভ সেভ হয়েছে!`, true);
                        }).catch(err => showAlert("ত্রুটি: " + err.message, false));
                    });

                    adminInputsBody.appendChild(tr);
                });

                // মাস্টার সেটিংসের ডেটা ইনপুট বক্সে রেন্ডার করা
                if (activeRole === "master") {
                    activeSlots.forEach(slot => createSlotInputRowHTML(slot));

                    if (rootData.settings) {
                        document.getElementById("input-live-status").value = rootData.settings.liveStatus || "live";
                        document.getElementById("input-subtitle").value = rootData.settings.subtitle || "";
                        document.getElementById("input-marquee").value = rootData.settings.marquee || "";
                        document.getElementById("input-tips-url").value = rootData.settings.tipsUrl || "";
                        document.getElementById("input-patti-url").value = rootData.settings.pattiUrl || "";
                        document.getElementById("input-alert").value = rootData.settings.customAlert || "";
                        document.getElementById("input-bg-url").value = rootData.settings.bgUrl || "";
                    }
                    if (rootData.passwords) {
                        document.getElementById("input-master-pass").value = rootData.passwords.master || "1985";
                        document.getElementById("input-staff-pass").value = rootData.passwords.staff || "123@";
                    }
                }
            });
        };

        dateInput.value = getTodayDateStr();
        dateInput.addEventListener("change", syncDashboardData);

        // ==================== [ ৩. মাস্টার অল-ইন-ওয়ান সেভ বাটন লজিক ] ====================
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener("click", () => {
                if (activeRole !== "master") return alert("অনুমতি নেই!");

                const freshSlotsArray = [];
                const inputElements = document.querySelectorAll(".dynamic-slot-time-value");
                
                for (let input of inputElements) {
                    const val = input.value.trim();
                    if (!val) {
                        alert("কোনো টাইম স্লটের নাম ফাঁকা রাখা যাবে না!");
                        return;
                    }
                    freshSlotsArray.push(val);
                }

                if (freshSlotsArray.length === 0) {
                    alert("আপনাকে নূন্যতম ১ টি টাইম স্লট অবশ্যই তৈরি রাখতে হবে!");
                    return;
                }

                const updatedSettings = {
                    liveStatus: document.getElementById("input-live-status").value,
                    subtitle: document.getElementById("input-subtitle").value.trim(),
                    marquee: document.getElementById("input-marquee").value.trim(),
                    tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                    pattiUrl: document.getElementById("input-patti-url").value.trim() || "#",
                    customAlert: document.getElementById("input-alert").value.trim(),
                    bgUrl: document.getElementById("input-bg-url").value.trim(),
                    globalSlots: freshSlotsArray
                };

                const updatedPasswords = {
                    master: document.getElementById("input-master-pass").value.trim() || "1985",
                    staff: document.getElementById("input-staff-pass").value.trim() || "123@"
                };

                const packet = {};
                packet[`${CONFIG.root}/settings`] = updatedSettings;
                packet[`${CONFIG.root}/passwords`] = updatedPasswords;

                update(ref(database), packet).then(() => {
                    showAlert("✓ অভিনন্দন! গ্লোবাল র (Rows), স্মার্ট সেটিংস এবং পাসওয়ার্ড সফলভাবে লাইভ আপডেট হয়েছে!", true);
                    syncDashboardData();
                }).catch(err => showAlert("ব্যর্থ হয়েছে: " + err.message, false));
            });
        }
    }
});
