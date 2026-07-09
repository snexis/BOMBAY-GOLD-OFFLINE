import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

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
const db = getDatabase(app);

// রেজাল্ট সেভ করার ফাংশন (Admin প্যানেলের জন্য)
window.saveResult = function() {
    const time = document.getElementById('time-input').value;
    const result = document.getElementById('result-input').value;
    
    set(ref(db, 'results/' + time), {
        result: result,
        timestamp: Date.now()
    }).then(() => {
        alert("রেজাল্ট আপডেট হয়েছে!");
    });
};

// ওয়েবসাইট রেজাল্ট অন/অফ করার ফাংশন
window.toggleSite = function(status) {
    update(ref(db, 'settings/'), {
        isLive: status
    }).then(() => {
        alert("সাইট স্ট্যাটাস আপডেট হয়েছে!");
    });
};

// লাইভ রেজাল্ট দেখার ফাংশন (Index পেজের জন্য)
if (document.getElementById('result-body')) {
    onValue(ref(db, 'results/'), (snapshot) => {
        const data = snapshot.val();
        const tbody = document.getElementById('result-body');
        tbody.innerHTML = ""; // আগের ডেটা পরিষ্কার করা
        
        for (let time in data) {
            tbody.innerHTML += `<tr><td>${time}</td><td>${data[time].result}</td></tr>`;
        }
    });
}
