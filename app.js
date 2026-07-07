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

// আপনার ইমেজের প্রধান ৮টি টাইম স্লট (অফিসিয়াল সিরিয়াল)
const defaultTimeSlots = ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM", "08:50 PM"];

// কারেন্ট ডেট স্ট্রিং জেনারেটর (YYYY-MM-DD ফরম্যাট)
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

    // --- ১. ভিজিটর ফ্রন্টএন্ড পেজ (index.html) ---
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
            }

            resultsContainer.innerHTML = "";
            const records = data.records || {};
            
            // সব তারিখ ক্রমানুসারে সাজানো (নতুন তারিখ সবার উপরে থাকবে)
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            if(sortedDates.length === 0) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো ডাটা রেকর্ড নেই।</div>';
                return;
            }

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

    // --- ২. অ্যাডমিন ব্যাকএন্ড প্যানেল (admin.html) ---
    if (adminInputsBody && btnPublish) {
        
        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return;

            get(ref(database, `game_results/records/${selectedDate}`)).then((snapshot) => {
                const dayData = snapshot.val() || {};
                adminInputsBody.innerHTML = ""; 

                const activeSlots = dayData._slotsOrder ? dayData._slotsOrder : defaultTimeSlots;

                activeSlots.forEach(time => {
                    const pattiVal = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    const singleVal = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                    
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" class="input-time" value="${time}"></td>
                        <td><input type="text" class="input-patti" value="${pattiVal}" placeholder="পাত্তি"></td>
                        <td><input type="text" class="input-single" value="${singleVal}" placeholder="সিঙ্গেল"></td>
                    `;
                    adminInputsBody.appendChild(tr);
                });
            });
        };

        const dateInput = document.getElementById("result-date");
        
        // ডিফল্টভাবে আজকের বর্তমান ডেট সিলেক্ট থাকবে (রাত ১২টা পার হলে অটোমেটিক নতুন ডেট সেট হবে)
        dateInput.value = getLocalDateString(new Date());

        dateInput.addEventListener("change", loadExistingData);
        loadExistingData();

        // পাবলিশ অ্যাকশন (কোনো পেজ রিফ্রেশ ছাড়া ব্যাকগ্রাউন্ডে মসৃণভাবে ডাটা পাঠাবে)
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return alert("দয়া করে তারিখ সিলেক্ট করুন!");

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

            const settings = {
                subtitle: document.getElementById("input-subtitle").value.trim(),
                marquee: document.getElementById("input-marquee").value.trim(),
                tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                pattiUrl: document.getElementById("input-patti-url").value.trim() || "#"
            };

            // ডাটাবেসে সেভ লজিক
            Promise.all([
                set(ref(database, `game_results/records/${selectedDate}`), recordsUpdate),
                set(ref(database, `game_results/settings`), settings)
            ]).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "ডাটাবেস সফলভাবে আপডেট হয়েছে!";
                statusMsg.className = "status-msg status-success";
                
                // বাটন ক্লিক এনিমেশন শেষ করে নোটিফিকেশন হাইড করা
                setTimeout(() => {
                    statusMsg.style.display = "none";
                }, 3000);
            }).catch(err => alert("ফায়ারবেস কানেকশন ত্রুটি: " + err.message));
        });
    }
});
