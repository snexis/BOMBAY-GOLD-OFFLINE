import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// ⚙️ ফায়ারবেস প্রজেক্ট কনফিগারেশন
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

let currentRole = 'GUEST';
const todayStr = new Date().toISOString().split('T')[0];

// হার্ডকোডেড স্লট ডেটা (ফায়ারবেসে না থাকলেও অটোমেটিক এই ৮টি বাজি বা স্লট কাজ করবে)
const defaultSlots = {
    "slot_1": "1st Baji (10:00 AM)",
    "slot_2": "2nd Baji (11:30 AM)",
    "slot_3": "3rd Baji (01:00 PM)",
    "slot_4": "4th Baji (02:30 PM)",
    "slot_5": "5th Baji (04:00 PM)",
    "slot_6": "6th Baji (05:30 PM)",
    "slot_7": "7th Baji (07:00 PM)",
    "slot_8": "8th Baji (08:30 PM)"
};

// ==========================================
// 🌐 মেইন পেজ ও রিয়েলটাইম লিসেনার
// ==========================================
function initAppEngine() {
    // সরাসরি মেইন রুট থেকে records এবং settings ট্র্যাক করবে
    onValue(ref(db, 'records/' + todayStr), (snapshot) => {
        renderLiveResultsHTML(snapshot.val() || {});
    });
    
    // marquee ও লাইভ স্ট্যাটাস আপডেট রিড করার জন্য
    onValue(ref(db, '/'), (snapshot) => {
        if (snapshot.exists()) {
            const rootData = snapshot.val();
            // মারকুই বা নোটিশ টেক্সট থাকলে আপডেট করবে
            const marqueeEl = document.getElementById('live-marquee');
            if (marqueeEl && rootData.marquee) marqueeEl.textContent = rootData.marquee;
        }
    });

    // প্লে পেজ (play.html) এর ভেরিফিকেশন বাটন লজিক
    const btnRequestAccess = document.getElementById('btn-request-access');
    if (btnRequestAccess) {
        btnRequestAccess.addEventListener('click', handlePlayerVerification);
    }
}

// ==========================================
// 🛡️ এডমিন প্যানেল লগইন লজিক (সরাসরি মেইন রুট ম্যাচিং)
// ==========================================
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const passInput = document.getElementById('admin-password').value.trim();
        
        // আপনার ডাটাবেসের মেইন রুট থেকে সরাসরি master এবং staff পিন রিড করছে
        get(ref(db, '/')).then((snapshot) => {
            if (snapshot.exists()) {
                const rootData = snapshot.val();
                
                if (passInput === String(rootData.master)) {
                    currentRole = 'MASTER';
                    unlockAdminPanel();
                } else if (passInput === String(rootData.staff)) {
                    currentRole = 'STAFF';
                    unlockAdminPanel();
                } else {
                    alert("ভুল পাসওয়ার্ড! অ্যাক্সেস ডিনাইড।");
                }
            }
        }).catch(err => console.error("Firebase Auth Error:", err));
    });
}

function unlockAdminPanel() {
    if(document.getElementById('admin-auth-screen')) document.getElementById('admin-auth-screen').style.display = 'none';
    if(document.getElementById('admin-main-content')) document.getElementById('admin-main-content').style.display = 'block';
    if(document.getElementById('admin-role-badge')) document.getElementById('admin-role-badge').textContent = `ROLE: ${currentRole}`;

    const resDate = document.getElementById('result-date');
    if (resDate) {
        resDate.value = todayStr;
        loadLiveEntryPanel(todayStr);
        resDate.addEventListener('change', (e) => loadLiveEntryPanel(e.target.value));
    }
}

// ==========================================
// 📊 রেজাল্ট সাবমিশন ও লাইভ ডিসপ্লে প্যানেল
// ==========================================
function loadLiveEntryPanel(date) {
    onValue(ref(db, `records/${date}`), (snapshot) => {
        const tbody = document.getElementById('admin-inputs-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const currentData = snapshot.val() || {};

        for (let slotId in defaultSlots) {
            const slotData = currentData[slotId] || { patti: '', single: '' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${defaultSlots[slotId]}</b></td>
                <td><input type="text" id="patti-${slotId}" value="${slotData.patti || ''}" maxlength="3" style="width:80px; text-align:center; color:white; background:#0f172a;"></td>
                <td><input type="text" id="single-${slotId}" value="${slotData.single || ''}" maxlength="1" style="width:50px; text-align:center; color:white; background:#0f172a;"></td>
                <td><button class="btn-save-live-row" data-slot="${slotId}" style="background:#2563eb; color:white; padding:5px 10px; border-radius:4px; cursor:pointer; width:auto; margin:0;">Save</button></td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.btn-save-live-row').forEach(btn => {
            btn.addEventListener('click', function() {
                const slotId = this.getAttribute('data-slot');
                const pattiVal = document.getElementById(`patti-${slotId}`).value.trim();
                const singleVal = document.getElementById(`single-${slotId}`).value.trim();
                
                update(ref(db, `records/${date}/${slotId}`), {
                    patti: pattiVal,
                    single: singleVal,
                    updatedAt: new Date().toISOString()
                }).then(() => {
                    const msg = document.getElementById('status-message');
                    if(msg) { msg.textContent = "রেজাল্ট সফলভাবে সেভ হয়েছে!"; msg.style.display='block'; setTimeout(()=>msg.style.display='none', 2000); }
                });
            });
        });
    });
}

function renderLiveResultsHTML(currentData) {
    const resultContainer = document.getElementById('today-results-container');
    if (!resultContainer) return;

    let html = `<table style="width:100%; border-collapse: collapse; text-align:center; color:white;">
        <tr style="background:#334155; color:#fbbf24;"><th style="padding:10px;">বাজি স্লট</th><th style="padding:10px;">পত্তি</th><th style="padding:10px;">সিঙ্গেল</th></tr>`;
    
    for (let slotId in defaultSlots) {
        const slotData = currentData[slotId] || { patti: '---', single: '---' };
        html += `<tr style="border-bottom:1px solid #334155;">
            <td style="padding:12px;"><b>${defaultSlots[slotId]}</b></td>
            <td style="color:#a7f3d0; font-weight:bold;">${slotData.patti}</td>
            <td style="color:#fbcfe8; font-weight:bold; font-size:18px;">${slotData.single}</td>
        </tr>`;
    }
    html += `</table>`;
    resultContainer.innerHTML = html;
}

// ==========================================
// 📱 প্লেয়ার ভেরিফিকেশন (play.html এর জন্য)
// ==========================================
function handlePlayerVerification() {
    const playerName = document.getElementById('player-name').value.trim();
    const playerPin = document.getElementById('player-pin').value.trim();

    if (!playerName || !playerPin) {
        alert("দয়া করে আপনার নাম এবং ৪ ডিজিটের পিন সঠিকভাবে দিন!");
        return;
    }

    const requestKey = `${playerName}_${playerPin}`;
    
    // সরাসরি মেইন রুটের otp_requests নোডে ডেটা সেট হবে যেমনটা আপনার ছবিতে আছে
    set(ref(db, `otp_requests/${requestKey}`), {
        name: playerName,
        pin: playerPin,
        status: "pending",
        timestamp: new Date().toISOString()
    }).then(() => {
        alert("আপনার অ্যাক্সেস রিকোয়েস্ট পাঠানো হয়েছে! এডমিনের অনুমোদনের জন্য অপেক্ষা করুন।");
    }).catch(err => {
        console.error("Verification Error:", err);
        alert("রিকোয়েস্ট পাঠাতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।");
    });
}

// ইঞ্জিন রান
initAppEngine();
