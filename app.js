// ১. আপনার ফায়ারবেস কনফিগারেশন কোড নিচে বসান (Replace করুন)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ফায়ারবেস ইনিশিয়ালাইজ করুন
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// নির্ধারিত টাইম স্লটসমূহ (ইমেজের সাথে হুবহু মিল রেখে)
const timeSlots = ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM"];

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnPublish = document.getElementById("btn-publish");

    // --- ব্যবহারকারী পেজ লজিক (index.html) ---
    if (resultsContainer) {
        // ফায়ারবেস থেকে রিয়েল-টাইম ডাটা শোনা (কোনো রিফ্রেশ লাগবে না)
        database.ref("game_results").on("value", (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            // হেডার টেক্সট ও লিংক আপডেট
            if(data.settings) {
                if(data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if(data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if(data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if(data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
            }

            // টেবিল তৈরি করা
            resultsContainer.innerHTML = "";
            const records = data.records || {};
            // তারিখ অনুযায়ী সাজানো (নতুন তারিখ উপরে থাকবে)
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(dateKey => {
                const dayData = records[dateKey];
                // তারিখ ফরম্যাট পরিবর্তন (YYYY-MM-DD থেকে DD/MM/YYYY)
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                header_row
                                body_row
                            </table>
                        </div>
                    </div>
                `;

                let headerRow = "<thead><tr>" + timeSlots.map(t => `<th>${t}</th>`).join("") + "</tr></thead>";
                let bodyRow = "<tbody><tr>" + timeSlots.map(t => {
                    let patti = (dayData[t] && dayData[t].patti) ? dayData[t].patti : "-";
                    let single = (dayData[t] && dayData[t].single) ? dayData[t].single : "-";
                    return `<td><span class="patti-row-text">${patti}</span><span class="single-row-text">${single}</span></td>`;
                }).join("") + "</tr></tbody>";

                tableHtml = tableHtml.replace("header_row", headerRow).replace("body_row", bodyRow);
                resultsContainer.innerHTML += tableHtml;
            });
        });
    }

    // --- অ্যাডমিন প্যানেল লজিক (admin.html) ---
    if (adminInputsBody && btnPublish) {
        // ইনপুট রো বা সারিগুলো তৈরি করা
        timeSlots.forEach(time => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-time", time);
            tr.innerHTML = `
                <td><strong>${time}</strong></td>
                <td><input type="text" maxlength="3" class="input-patti" placeholder="-"></td>
                <td><input type="text" maxlength="1" class="input-single" placeholder="-"></td>
            `;
            adminInputsBody.appendChild(tr);
        });

        const dateInput = document.getElementById("result-date");
        // আজকে দিনটি ডিফল্ট সেট করা
        dateInput.value = new Date().toISOString().split('T')[0];

        // তারিখ পরিবর্তন করলে ফায়ারবেস থেকে আগের ডাটা থাকলে ইনপুটে বসবে
        dateInput.addEventListener("change", () => {
            const selectedDate = dateInput.value;
            database.ref(`game_results/records/${selectedDate}`).once("value", (snapshot) => {
                const dayData = snapshot.val() || {};
                document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                    const time = row.getAttribute("data-time");
                    row.querySelector(".input-patti").value = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    row.querySelector(".input-single").value = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                });
            });
        });
        dateInput.dispatchEvent(new Event("change"));

        // পাবলিশ লাইভ বাটনে ক্লিক অ্যাকশন
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return alert("তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.getAttribute("data-time");
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                recordsUpdate[time] = { patti, single };
            });

            const settings = {
                subtitle: document.getElementById("input-subtitle").value.trim(),
                marquee: document.getElementById("input-marquee").value.trim(),
                tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                pattiUrl: document.getElementById("input-patti-url").value.trim() || "#"
            };

            // ফায়ারবেস ডাটাবেসে সেভ করা
            database.ref(`game_results/records/${selectedDate}`).set(recordsUpdate);
            database.ref(`game_results/settings`).set(settings).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "সফলভাবে ইন্টারনেটে লাইভ করা হয়েছে!";
                statusMsg.className = "status-msg status-success";
                setTimeout(() => statusMsg.style.display = "none", 4000);
            });
        });
    }
});
