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

// মডুলার কনফিগারেশন (ফিউচার প্রুফ)
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

    // --- ১. ইউজার মেইন সাইট ইঞ্জিন (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, coreAppConfig.dbRootNode), (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // গ্লোবাল সেটিংস এবং কাস্টম অন/অফ লজিক কন্ট্রোল
            if (data.settings) {
                if (data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if (data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if (data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if (data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
                
                // কাস্টম লাল নোটিফিকেশন অ্যালার্ট বার
                const alertBar = document.getElementById("custom-alert-bar");
                if (data.settings.customAlert && data.settings.customAlert.trim() !== "") {
                    alertBar.textContent = data.settings.customAlert;
                    alertBar.style.display = "block";
                } else {
                    alertBar.style.display = "none";
                }

                // লাইভ ব্যাকগ্রাউন্ড ইমেজ চেঞ্জার
                if (data.settings.bgUrl && data.settings.bgUrl.trim() !== "") {
                    document.body.style.setProperty("background-image", `url('${data.settings.bgUrl}')`, "important");
                } else {
                    document.body.style.backgroundImage = "none";
                }

                // --- অন/অফ ও লাইভ ইন্ডিকেটর কালার লজিক ফিক্স ---
                const liveBadge = document.getElementById("live-indicator");
                const mainResultsWrap = document.getElementById("main-results-wrap");

                if (data.settings.liveStatus === "off") {
                    // অবস্থা অফ: চার্ট হাইড হবে, স্ক্রিন ব্ল্যাঙ্ক থাকবে, বাটন লাল হয়ে ব্লিংক করবে
                    if (liveBadge) {
                        liveBadge.textContent = "● TODAY OFF";
                        liveBadge.style.background = "#ef4444";
                        liveBadge.style.animation = "redIndicatorBlink 1.2s infinite";
                    }
                    if (mainResultsWrap) {
                        mainResultsWrap.style.display = "none"; // পুরো চার্ট উধাও (ব্ল্যাঙ্ক স্ক্রিন)
                    }
                    return; // নিচে আর চার্ট রেন্ডার করতে যাবে না
                } else {
                    // অবস্থা অন: সব চার্ট দেখা যাবে, বাটন নরমাল গ্রিন থাকবে
                    if (liveBadge) {
                        liveBadge.textContent = "● LIVE";
                        liveBadge.style.background = "#22c55e";
                        liveBadge.style.animation = "none";
                    }
                    if (mainResultsWrap) {
                        mainResultsWrap.style.display = "block"; // চার্ট ফিরিয়ে আনা
                    }
                }
            }

            // চার্ট রেন্ডারিং প্রসেস (নতুন থেকে পুরোনো ক্রমানুসারে)
            resultsContainer.innerHTML = "";
            if (!data.records) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            const sortedDates = Object.keys(data.records).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(dateKey => {
                const dayData = data.records[dateKey];
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;
                const activeSlots = coreAppConfig.timeSlots;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead><tr>${activeSlots.map(t => `<th>${t}</th>`).join("")}</tr></thead>
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

    // --- ২. সিকিউরড ডবল অ্যাডমিন কন্ট্রোল প্যানেল লজিক (admin.html) ---
    if (adminInputsBody && btnPublish) {
        const btnLogin = document.getElementById("btn-login");
        const btnLogout = document.getElementById("btn-logout");
        const passInput = document.getElementById("admin-password");
        const authScreen = document.getElementById("admin-auth-screen");
        const mainContent = document.getElementById("admin-main-content");
        const dateInput = document.getElementById("result-date");
        const masterSettingsBox = document.getElementById("master-settings-box");
        const roleBadge = document.getElementById("admin-role-badge");

        // ফায়ারবেস রিয়েল-টাইম পাসওয়ার্ড অথেন্টিকেশন ভেরিফায়ার
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                const password = passInput.value.trim();
                
                get(ref(database, `${coreAppConfig.dbRootNode}/passwords`)).then((snapshot) => {
                    const dbPasswords = snapshot.val() || { master: "7777", staff: "1234" }; // ব্যাকআপ ডিফল্ট কোড
                    
                    if (password === dbPasswords.master) { 
                        currentUserRole = "master";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "block"; // মাস্টার পুরো কাস্টমাইজেশন বক্স দেখতে পাবে
                        roleBadge.textContent = "★ ROLE: MASTER ADMIN";
                        roleBadge.style.background = "#fffbeb";
                        roleBadge.style.color = "#b78103";
                        loadExistingData();
                    } else if (password === dbPasswords.staff) { 
                        currentUserRole = "staff";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "none";  // স্টাফের জন্য সেটিংস বক্স লক ও হাইড থাকবে
                        roleBadge.textContent = "● ROLE: STAFF (Results Only)";
                        roleBadge.style.background = "#f1f5f9";
                        roleBadge.style.color = "#475569";
                        loadExistingData();
                    } else {
                        alert("ভুল পাসওয়ার্ড! সঠিক পিন কোড দিন।");
                    }
                });
            });
        }

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
                coreAppConfig.timeSlots.forEach(time => {
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

                // মাস্টার ডাটা ইনপুট বক্সে ভ্যালু পুশ করা
                if (globalData.settings) {
                    document.getElementById("input-live-status").value = globalData.settings.liveStatus || "live";
                    document.getElementById("input-subtitle").value = globalData.settings.subtitle || "";
                    document.getElementById("input-marquee").value = globalData.settings.marquee || "";
                    document.getElementById("input-tips-url").value = globalData.settings.tipsUrl || "";
                    document.getElementById("input-patti-url").value = globalData.settings.pattiUrl || "";
                    document.getElementById("input-alert").value = globalData.settings.customAlert || "";
                    document.getElementById("input-bg-url").value = globalData.settings.bgUrl || "";
                }
                
                if (globalData.passwords) {
                    document.getElementById("input-master-pass").value = globalData.passwords.master || "7777";
                    document.getElementById("input-staff-pass").value = globalData.passwords.staff || "1234";
                } else {
                    document.getElementById("input-master-pass").value = "7777";
                    document.getElementById("input-staff-pass").value = "1234";
                }
            });
        };

        dateInput.value = getLocalDateString(new Date());
        loadExistingData();
        dateInput.addEventListener("change", loadExistingData);

        // লাইভ ডেটা ও সেটিংস পাবলিশ ইঞ্জিন
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return alert("দয়া করে তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.querySelector(".input-time").value.trim();
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                if (time) recordsUpdate[time] = { patti, single };
            });

            const savePromises = [
                set(ref(database, `${coreAppConfig.dbRootNode}/records/${selectedDate}`), recordsUpdate)
            ];

            // যদি মাস্টার লগইন থাকে তবেই শুধু নতুন সেটিংস ও নতুন পাসওয়ার্ড ডাটাবেসে সেভ হবে
            if (currentUserRole === "master") {
                const settings = {
                    liveStatus: document.getElementById("input-live-status").value,
                    subtitle: document.getElementById("input-subtitle").value.trim(),
                    marquee: document.getElementById("input-marquee").value.trim(),
                    tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                    pattiUrl: document.getElementById("input-patti-url").value.trim() || "#",
                    customAlert: document.getElementById("input-alert").value.trim(),
                    bgUrl: document.getElementById("input-bg-url").value.trim()
                };
                
                const passwords = {
                    master: document.getElementById("input-master-pass").value.trim() || "7777",
                    staff: document.getElementById("input-staff-pass").value.trim() || "1234"
                };

                savePromises.push(set(ref(database, `${coreAppConfig.dbRootNode}/settings`), settings));
                savePromises.push(set(ref(database, `${coreAppConfig.dbRootNode}/passwords`), passwords));
            }

            Promise.all(savePromises).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "✓ Live Update Successful!";
                statusMsg.className = "status-msg status-success"; // নোটিফিকেশন শো
                
                statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => { 
                    statusMsg.className = "status-msg"; // ৩ সেকেন্ড পর হাইড
                }, 3000);
            }).catch(err => alert("ফায়ারবেস ত্রুটি: " + err.message));
        });
    }
});
