import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ১. মাস্টার সুইচ লজিক
document.getElementById('btn-sys-toggle').addEventListener('click', () => {
    const msg = document.getElementById('off-msg').value;
    update(ref(db, 'system/'), { active: false, message: msg });
    alert("সিস্টেম অফ করা হয়েছে");
});

// ২. ওটিপি জেনারেশন ও ফায়ারবেসে সেভ
window.generateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    set(ref(db, 'admin/staffOTP'), { code: otp, timestamp: Date.now() });
    document.getElementById('otp-display').innerText = otp;
};

// ৩. পেমেন্ট ক্যালকুলেটর
window.calculatePayout = () => {
    const percent = document.getElementById('payout-percent').value;
    // এখানে আপনার ডেটাবেস থেকে টোটাল বিট অ্যামাউন্ট রিড করে ক্যালকুলেট করার লজিক বসবে
    alert("পেমেন্ট ক্যালকুলেটেড: " + percent + "%");
};

// ৪. রেজাল্ট সাবমিট (ডবল টিক)
window.markResultDone = (btn) => {
    update(ref(db, 'results/latest'), { status: 'published', time: Date.now() });
    btn.innerHTML = "Submitted ✔✔";
    btn.classList.add('success-btn');
};

// ৫. লাইভ টাইমার (ফায়ারবেস থেকে সিঙ্ক হতে পারে)
let timeLeft = 300;
const timerEl = document.getElementById('live-timer');
setInterval(() => {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    timerEl.innerText = m + ":" + (s < 10 ? '0' : '') + s;
    if(timeLeft > 0) timeLeft--;
}, 1000);

console.log("System Ready & Firebase Connected");
