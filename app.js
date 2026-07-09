import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

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
let playerSessionKey = '';
const todayStr = new Date().toISOString().split('T')[0];

const defaultSlots = {
    "slot_1": "1st Baji (10:00 AM)", "slot_2": "2nd Baji (11:30 AM)",
    "slot_3": "3rd Baji (01:00 PM)", "slot_4": "4th Baji (02:30 PM)",
    "slot_5": "5th Baji (04:00 PM)", "slot_6": "6th Baji (05:30 PM)",
    "slot_7": "7th Baji (07:00 PM)", "slot_8": "8th Baji (08:30 PM)"
};

// ==========================================
// 🚀 কোর ইনিশিয়ালাইজেশন
// ==========================================
function initAppEngine() {
    onValue(ref(db, 'records/' + todayStr), (snapshot) => {
        renderLiveResultsHTML(snapshot.val() || {});
    });

    // প্লে পেজে ড্রপডাউন স্লট ফিল করা
    const playSelect = document.getElementById('play-slot-select');
    if (playSelect) {
        let opt = '';
        for(let key in defaultSlots) { opt += `<option value="${key}">${defaultSlots[key]}</option>`; }
        playSelect.innerHTML = opt;
    }

    activatePlayZoneListeners();
}

// ==========================================
// 🛡️ এডমিন অথেন্টিকেশন ও রোল বিভাজন
// ==========================================
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const passInput = document.getElementById('admin-password').value.trim();
        get(ref(db, '/')).then((snapshot) => {
            if (snapshot.exists()) {
                const root = snapshot.val();
                if (passInput === String(root.master)) {
                    currentRole = 'MASTER';
                    unlockAdminPanel();
                } else if (passInput === String(root.staff)) {
                    currentRole = 'STAFF';
                    unlockAdminPanel();
                } else {
                    alert("ভুল পাসওয়ার্ড!");
                }
            }
        });
    });
}

function unlockAdminPanel() {
    document.getElementById('admin-auth-screen').style.display = 'none';
    document.getElementById('admin-main-content').style.display = 'block';
    document.getElementById('admin-role-badge').textContent = `ROLE: ${currentRole}`;

    // 👑 শুধু মাস্টার হলে মাস্টার বক্সটি দেখাবে, স্টাফ হলে দেখাবে না!
    if (currentRole === 'MASTER') {
        document.getElementById('master-settings-box').style.display = 'block';
    } else {
        document.getElementById('master-settings-box').style.display = 'none';
    }

    const resDate = document.getElementById('result-date');
    if (resDate) {
        resDate.value = todayStr;
        loadLiveEntryPanel(todayStr);
        resDate.addEventListener('change', (e) => loadLiveEntryPanel(e.target.value));
    }

    listenLiveOtpRequests();
}

// ==========================================
// 🔑 এডমিন প্যানেলে ওটিপি রিকোয়েস্ট হ্যান্ডলিং
// ==========================================
function listenLiveOtpRequests() {
    onValue(ref(db, 'otp_requests'), (snapshot) => {
        const tbody = document.getElementById('admin-otp-requests-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="4" style="color:#64748b;">কোনো ওটিপি রিকোয়েস্ট নেই...</td></tr>`;
            return;
        }

        snapshot.forEach((child) => {
            const reqId = child.key;
            const data = child.val();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${data.name}</b></td>
                <td><span style="background:#475569; padding:2px 6px; border-radius:4px;">${data.pin}</span></td>
                <td><b style="color:#2563eb; font-size:16px;">${data.otp || '---'}</b></td>
                <td>
                    ${data.status === 'pending' ? 
                        `<button class="btn-approve-otp" data-id="${reqId}" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; width:auto;">Approve</button>` : 
                        `<span style="color:#10b981; font-weight:bold;">Approved</span>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-approve-otp').forEach(btn => {
            btn.addEventListener('click', function() {
                const reqId = this.getAttribute('data-id');
                const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
                update(ref(db, `otp_requests/${reqId}`), { otp: randomOtp, status: 'approved' });
            });
        });
    });
}

// ==========================================
// 📊 রেজাল্ট ম্যানেজমেন্ট লজিক
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
                <td><input type="text" id="patti-${slotId}" value="${slotData.patti || ''}" maxlength="3" style="width:80px; text-align:center;"></td>
                <td><input type="text" id="single-${slotId}" value="${slotData.single || ''}" maxlength="1" style="width:50px; text-align:center;"></td>
                <td><button class="btn-save-live-row" data-slot="${slotId}" style="background:#2563eb; color:white; padding:5px 10px; border-radius:4px; cursor:pointer; width:auto; margin:0;">Save</button></td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.btn-save-live-row').forEach(btn => {
            btn.addEventListener('click', function() {
                const slotId = this.getAttribute('data-slot');
                const pattiVal = document.getElementById(`patti-${slotId}`).value.trim();
                const singleVal = document.getElementById(`single-${slotId}`).value.trim();
                
                update(ref(db, `records/${date}/${slotId}`), { patti: pattiVal, single: singleVal, updatedAt: new Date().toISOString() })
                .then(() => {
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
// 📱 প্লেয়ার প্যানেল ভেরিফিকেশন ও ওয়ালেট লজিক
// ==========================================
function activatePlayZoneListeners() {
    const btnReqOtp = document.getElementById('btn-request-otp');
    if (btnReqOtp) {
        btnReqOtp.addEventListener('click', () => {
            const pName = document.getElementById('player-name').value.trim();
            const pPin = document.getElementById('player-pin').value.trim();

            if (!pName || pPin.length !== 4) { alert("সঠিক নাম ও ৪ ডিজিটের পিন দিন!"); return; }

            playerSessionKey = `${pName}_${pPin}`;
            set(ref(db, `otp_requests/${playerSessionKey}`), { name: pName, pin: pPin, status: 'pending', otp: '', createdAt: new Date().toISOString() })
            .then(() => {
                document.getElementById('otp-input-area').style.display = 'block';
                alert("অ্যাক্সেস কোড রিকোয়েস্ট পাঠানো হয়েছে। এডমিন থেকে ওটিপি কোড নিয়ে বসান।");
                
                onValue(ref(db, `otp_requests/${playerSessionKey}`), (snap) => {
                    if(snap.exists() && snap.val().status === 'approved' && snap.val().otp) {
                        alert(`আপনার কোড জেনারেট হয়েছে: ${snap.val().otp}`);
                    }
                });
            });
        });
    }

    const btnVerify = document.getElementById('btn-verify-login');
    if (btnVerify) {
        btnVerify.addEventListener('click', () => {
            const inputOtp = document.getElementById('player-otp').value.trim();
            get(ref(db, `otp_requests/${playerSessionKey}`)).then((snapshot) => {
                if (snapshot.exists() && snapshot.val().status === 'approved' && snapshot.val().otp === inputOtp) {
                    document.getElementById('play-auth-screen').style.display = 'none';
                    document.getElementById('play-main-board').style.display = 'block';
                    document.getElementById('display-player-name').textContent = `স্বাগতম, ${playerSessionKey.split('_')[0]}`;
                    
                    onValue(ref(db, `wallets/${playerSessionKey}`), (wSnap) => {
                        const bal = wSnap.exists() ? parseFloat(wSnap.val().balance || 0) : 0;
                        document.getElementById('player-wallet-display').textContent = `${bal.toFixed(2)} PTS`;
                    });
                } else {
                    alert("ভুল ওটিপি কোড!");
                }
            });
        });
    }

    const btnSubmitBet = document.getElementById('btn-submit-bet');
    if (btnSubmitBet) {
        btnSubmitBet.addEventListener('click', () => {
            const slot = document.getElementById('play-slot-select').value;
            const sNum = document.getElementById('play-single-num').value.trim();
            const sPts = parseFloat(document.getElementById('play-single-points').value || 0);
            const pNum = document.getElementById('play-patti-num').value.trim();
            const pPts = parseFloat(document.getElementById('play-patti-points').value || 0);

            get(ref(db, `wallets/${playerSessionKey}`)).then((wSnap) => {
                const currentBal = wSnap.exists() ? parseFloat(wSnap.val().balance || 0) : 0;
                if (currentBal < (sPts + pPts)) { alert("পর্যাপ্ত ব্যালেন্স নেই!"); return; }

                set(ref(db, `wallets/${playerSessionKey}`), { balance: currentBal - (sPts + pPts) }).then(() => {
                    set(ref(db, `bets/${todayStr}/${slot}/${playerSessionKey}`), { singleNum: sNum, singlePoints: sPts, pattiNum: pNum, pattiPoints: pPts })
                    .then(() => alert("বাজি সফলভাবে সাবমিট হয়েছে!"));
                });
            });
        });
    }
}

const btnLogout = document.getElementById('btn-logout');
if(btnLogout) btnLogout.addEventListener('click', () => window.location.reload());

const btnPlayerLogout = document.getElementById('btn-player-logout');
if(btnPlayerLogout) btnPlayerLogout.addEventListener('click', () => { if(playerSessionKey) remove(ref(db, `otp_requests/${playerSessionKey}`)); window.location.reload(); });

initAppEngine();
