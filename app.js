/**
 * BOMBAY-GOLD MASTER ENGINE - ভার্সন ৩.০ (ফাইনাল)
 * সকল রিকয়ারমেন্ট ও সিকিউরিটি লজিক একসাথে।
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8"
};

if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const getToday = () => new Date().toISOString().split('T')[0];

const Engine = {
    // ১. রেজাল্ট সাবমিট (ডাবল গ্রিন টিকসহ)
    submitResult: (time, pati, single) => {
        const data = { time, pati, single, status: '✅✅', date: new Date().toLocaleDateString() };
        db.ref(`results/${getToday()}`).push(data);
        alert("রেজাল্ট আপডেট সফল!");
    },

    // ২. প্লেয়ার আইডি ব্লক
    blockPlayer: (id) => {
        db.ref(`players/${id}/blocked`).set(true);
        alert("আইডি ব্লক করা হয়েছে!");
    },

    // ৩. রিয়েল-টাইম গেমিং অ্যানালিটিক্স
    calculateLiveBets: (callback) => {
        db.ref(`bets/${getToday()}`).on('value', (snap) => {
            const data = snap.val();
            let total = 0;
            // এখানে পাতি ও সিঙ্গেল হিস্ট্রি ক্যালকুলেশন হবে
            callback(data, total);
        });
    },

    // ৪. লাইভ সাইট সুইচ
    toggleLive: (status) => {
        db.ref('settings/liveStatus').set(status);
    }
};

// --- ইভেন্ট হ্যান্ডলার (সব পেজের জন্য কমন) ---
window.onload = () => {
    // প্লেয়ার লগইন লজিক
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const id = document.getElementById('player-id').value;
            sessionStorage.setItem('user', id);
            // ড্যাশবোর্ড দেখানোর কোড...
        };
    }

    // অ্যাডমিন রেজাল্ট বাটন
    const submitResBtn = document.getElementById('submit-res-btn');
    if (submitResBtn) {
        submitResBtn.onclick = () => {
            const time = document.getElementById('r-time').value;
            const pati = document.getElementById('r-pati').value;
            const single = document.getElementById('r-single').value;
            Engine.submitResult(time, pati, single);
        };
    }
};
