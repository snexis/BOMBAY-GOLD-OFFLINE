/** * BOMBAY-GOLD MASTER ENGINE - ভার্সন ২.১
 * সব পেজের লজিক এখানেই আছে।
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

// --- সিস্টেম কন্ট্রোলার ---
const System = {
    // লগইন সিস্টেম
    login: (id, pin) => {
        // এখানে পিন ভেরিফিকেশন কোড যুক্ত হবে
        sessionStorage.setItem('loggedInUser', id);
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('welcome-player').innerText = "স্বাগতম, " + id;
    },
    
    // বাজি সাবমিট
    submitBet: (time, type, amount) => {
        const betData = { time, type, amount, timestamp: Date.now() };
        db.ref(`bets/${getToday()}/${sessionStorage.getItem('loggedInUser')}`).push(betData);
        alert("আপনার খেলাটি সাবমিট হয়েছে!");
    }
};

// --- ইভেন্ট লিসেনার (পেজ লোড হওয়ার পর) ---
window.onload = () => {
    // লগইন বাটনের কাজ
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const id = document.getElementById('player-id').value;
            const pin = document.getElementById('player-pin').value;
            if (id && pin) System.login(id, pin);
            else alert("সব তথ্য পূরণ করুন!");
        };
    }

    // সাবমিট বাটনের কাজ
    const betBtn = document.getElementById('submit-bet-btn');
    if (betBtn) {
        betBtn.onclick = () => {
            const time = document.getElementById('time-select').value;
            const type = document.getElementById('bet-type').value;
            const amount = document.getElementById('bet-amount').value;
            if (amount > 0) System.submitBet(time, type, amount);
        };
    }
    
    // রেজাল্ট দেখানো (Index পেজের জন্য)
    const resultBody = document.getElementById('result-body');
    if (resultBody) {
        db.ref(`results/${getToday()}`).on('value', (s) => {
            resultBody.innerHTML = "";
            const data = s.val();
            for (let k in data) resultBody.innerHTML += `<tr><td>${data[k].time}</td><td>${data[k].result}</td></tr>`;
        });
    }
};
