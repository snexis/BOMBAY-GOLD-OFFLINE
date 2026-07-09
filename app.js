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
let activeAnalyticsSlot = 'slot_1';
const todayStr = new Date().toISOString().split('T')[0];

const defaultSlots = {
    "slot_1": "1st Baji (10:00 AM)", "slot_2": "2nd Baji (11:30 AM)",
    "slot_3": "3rd Baji (01:00 PM)", "slot_4": "4th Baji (02:30 PM)",
    "slot_5": "5th Baji (04:00 PM)", "slot_6": "6th Baji (05:30 PM)",
    "slot_7": "7th Baji (07:00 PM)", "slot_8": "8th Baji (08:30 PM)"
};

function initAppEngine() {
    onValue(ref(db, '/'), (snapshot) => {
        if (snapshot.exists()) {
            const root = snapshot.val();
            const mainCard = document.getElementById('live-main-card');
            if (mainCard && root.websiteStatus) {
                if(root.websiteStatus.startsWith('#')) {
                    mainCard.style.background = root.websiteStatus;
                } else if(root.websiteStatus.includes('http')) {
                    mainCard.style.backgroundImage = `url('${root.websiteStatus}')`;
                    mainCard.style.backgroundSize = 'cover';
                }
            }
            if(document.getElementById('live-marquee') && root.marquee) {
                document.getElementById('live-marquee').textContent = root.marquee;
            }
        }
    });

    onValue(ref(db, 'records/' + todayStr), (snapshot) => {
        renderLiveResultsHTML(snapshot.val() || {});
    });

    const analSelect = document.getElementById('analytics-slot-select');
    const playSelect = document.getElementById('play-slot-select');
    let optHtml = '';
    for(let key in defaultSlots) { optHtml += `<option value="${key}">${defaultSlots[key]}</option>`; }
    if(analSelect) {
        analSelect.innerHTML = optHtml;
        analSelect.addEventListener('change', (e) => { activeAnalyticsSlot = e.target.value; calculateLiveAnalytics(); });
    }
    if(playSelect) playSelect.innerHTML = optHtml;

    setupAdminUIInteractions();
    activatePlayZoneListeners();
}

function setupAdminUIInteractions() {
    const eyeBtn = document.getElementById('toggle-admin-pass');
    if (eyeBtn) {
        eyeBtn.addEventListener('click', () => {
            const passField = document.getElementById('admin-password');
            passField.type = passField.type === 'password' ? 'text' : 'password';
        });
    }

    const savedPin = localStorage.getItem('rememberedAdminPin');
    if (savedPin && document.getElementById('admin-password')) {
        document.getElementById('admin-password').value = savedPin;
        document.getElementById('chk-remember').checked = true;
    }

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            const passInput = document.getElementById('admin-password').value.trim();
            const rememberMe = document.getElementById('chk-remember').checked;

            get(ref(db, '/')).then((snapshot) => {
                if (snapshot.exists()) {
                    const root = snapshot.val();
                    
                    if (passInput === String(root.master)) {
                        currentRole = 'MASTER';
                        if(rememberMe) localStorage.setItem('rememberedAdminPin', passInput);
                        else localStorage.removeItem('rememberedAdminPin');
                        unlockAdminPanel();
                    } else if (passInput === String(root.staff)) {
                        const staffKey = `Staff_Baji_${passInput}`;
                        set(ref(db, `otp_requests/${staffKey}`), { name: "Staff Admin Panel", pin: passInput, status: 'pending', type: 'staff', createdAt: new Date().toISOString() })
                        .then(() => {
                            alert("স্টাফ লগইন রিকোয়েস্ট পাঠানো হয়েছে! এডমিন Approve করলেই খুলবে।");
                            onValue(ref(db, `otp_requests/${staffKey}`), (snap) => {
                                if(snap.exists() && snap.val().status === 'approved') {
                                    currentRole = 'STAFF';
                                    remove(ref(db, `otp_requests/${staffKey}`));
                                    unlockAdminPanel();
                                }
                            });
                        });
                    } else {
                        alert("ভুল সিকিউরিটি পিন নম্বর!");
                    }
                }
            });
        });
    }
}

function unlockAdminPanel() {
    document.getElementById('admin-auth-screen').style.display = 'none';
    document.getElementById('admin-main-content').style.display = 'block';
    
    if (currentRole === 'MASTER') {
        document.getElementById('master-settings-box').style.display = 'block';
        document.getElementById('analytics-box').style.display = 'block';
        document.getElementById('player-manager-box').style.display = 'block';
        
        get(ref(db, '/')).then(snap => {
            if(snap.exists()) {
                document.getElementById('cfg-bg').value = snap.val().websiteStatus || '';
                document.getElementById('cfg-marquee').value = snap.val().marquee || '';
            }
        });
        
        loadPlayerManagerDashboard();
        calculateLiveAnalytics();
    }
    
    document.getElementById('admin-role-badge').textContent = `ROLE: ${currentRole}`;

    const resDate = document.getElementById('result-date');
    if (resDate) {
        resDate.value = todayStr;
        loadLiveEntryPanel(todayStr);
        resDate.addEventListener('change', (e) => loadLiveEntryPanel(e.target.value));
    }

    listenLiveOtpRequests();
}

const btnSaveMaster = document.getElementById('btn-save-master-global');
if (btnSaveMaster) {
    btnSaveMaster.addEventListener('click', () => {
        const bgVal = document.getElementById('cfg-bg').value.trim();
        const marVal = document.getElementById('cfg-marquee').value.trim();
        const newM = document.getElementById('new-master-pin').value.trim();
        const newS = document.getElementById('new-staff-pin').value.trim();

        let updates = { websiteStatus: bgVal, marquee: marVal };
        if(newM) updates['master'] = parseInt(newM) || newM;
        if(newS) updates['staff'] = parseInt(newS) || newS;

        update(ref(db, '/'), updates).then(() => showNotification("সিস্টেম সফলভাবে আপডেট হয়েছে!"));
    });
}

function loadPlayerManagerDashboard() {
    onValue(ref(db, 'wallets'), (snapshot) => {
        const tbody = document.getElementById('admin-players-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        if(!snapshot.exists()) { tbody.innerHTML='<tr><td colspan="4">কোনো প্লেয়ার ডাটা নেই</td></tr>'; return; }

        snapshot.forEach(child => {
            const pKey = child.key;
            const data = child.val();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${pKey.split('_')[0]}</b></td>
                <td style="color:#10b981; font-weight:bold;">${parseFloat(data.balance || 0).toFixed(2)} PTS</td>
                <td>
                    <input type="number" id="amt-${pKey}" placeholder="Amount" style="width:80px; display:inline; padding:4px;">
                    <button class="btn-wallet-mod" data-id="${pKey}" data-type="add" style="width:auto; margin:0; padding:4px 8px; background:#10b981;">+ Add</button>
                    <button class="btn-wallet-mod" data-id="${pKey}" data-type="sub" style="width:auto; margin:0; padding:4px 8px; background:#ef4444;">- Less</button>
                </td>
                <td>
                    <button class="btn-block-toggle" data-id="${pKey}" style="width:auto; margin:0; padding:4px 8px; background:${data.status==='blocked'?'#10b981':'#dc2626'}">
                        ${data.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-wallet-mod').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const type = this.getAttribute('data-type');
                const amt = parseFloat(document.getElementById(`amt-${id}`).value || 0);
                if(amt <= 0) return;

                get(ref(db, `wallets/${id}`)).then(snap => {
                    let cur = snap.exists() ? parseFloat(snap.val().balance || 0) : 0;
                    let next = type === 'add' ? cur + amt : cur - amt;
                    update(ref(db, `wallets/${id}`), { balance: next < 0 ? 0 : next });
                });
            });
        });

        document.querySelectorAll('.btn-block-toggle').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                get(ref(db, `wallets/${id}`)).then(snap => {
                    const currentStatus = snap.exists() ? snap.val().status : 'active';
                    update(ref(db, `wallets/${id}`), { status: currentStatus === 'blocked' ? 'active' : 'blocked' });
                });
            });
        });
    });
}

function calculateLiveAnalytics() {
    onValue(ref(db, `bets/${todayStr}/${activeAnalyticsSlot}`), (snapshot) => {
        const tbody = document.getElementById('analytics-rows');
        if(!tbody) return;
        tbody.innerHTML = '';

        let singleCounts = {};
        let totalSinglePoints = 0;

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const data = child.val();
                if(data.singleNum && data.singlePoints) {
                    singleCounts[data.singleNum] = (singleCounts[data.singleNum] || 0) + parseFloat(data.singlePoints);
                    totalSinglePoints += parseFloat(data.singlePoints);
                }
            });
        }

        for(let i=0; i<=9; i++) {
            let pts = singleCounts[i] || 0;
            let pct = totalSinglePoints > 0 ? ((pts / totalSinglePoints) * 100).toFixed(1) : '0.0';
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b style="color:var(--gold); font-size:16px;">${i}</b></td><td>Single (নম্বর)</td><td>${pts.toFixed(2)} PTS</td><td><span style="color:#f43f5e">${pct}%</span></td>`;
            tbody.appendChild(tr);
        }
    });
}

function listenLiveOtpRequests() {
    onValue(ref(db, 'otp_requests'), (snapshot) => {
        const tbody = document.getElementById('admin-otp-requests-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:#64748b;">কোনো লাইভ পেন্ডিং রিকোয়েস্ট নেই...</td></tr>`;
            return;
        }

        snapshot.forEach((child) => {
            const reqId = child.key;
            const data = child.val();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="color:${data.type==='staff'?'#f43f5e':'#3b82f6'}">${data.type === 'staff' ? '💼 STAFF' : '👤 PLAYER'}</span></td>
                <td><b>${data.name}</b></td>
                <td><span style="background:#475569; padding:2px 6px; border-radius:4px;">${data.pin}</span></td>
                <td><b style="color:var(--gold); font-size:16px;">${data.otp || '---'}</b></td>
                <td>
                    ${data.status === 'pending' ? 
                        `<button class="btn-approve-otp" data-id="${reqId}" style="background:#10b981; color:#0f172a; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; width:auto; margin:0;">Approve</button>` : 
                        `<span style="color:#10b981; font-weight:bold;">Approved ✅</span>`
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
                <td><button class="btn-save-live-row" data-slot="${slotId}" style="background:var(--blue); color:white; padding:5px 10px; border-radius:4px; cursor:pointer; width:auto; margin:0;">Save</button></td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.btn-save-live-row').forEach(btn => {
            btn.addEventListener('click', function() {
                const slotId = this.getAttribute('data-slot');
                const pattiVal = document.getElementById(`patti-${slotId}`).value.trim();
                const singleVal = document.getElementById(`single-${slotId}`).value.trim();
                
                update(ref(db, `records/${date}/${slotId}`), { patti: pattiVal, single: singleVal, updatedAt: new Date().toISOString() })
                .then(() => showNotification("বাজি ফলাফল সফলভাবে সেভ হয়েছে!"));
            });
        });
    });
}

function renderLiveResultsHTML(currentData) {
    const resultContainer = document.getElementById('today-results-container');
    if (!resultContainer) return;

    let html = `<table>
        <tr><th>বাজি স্লট</th><th>পত্তি</th><th>সিঙ্গেল</th></tr>`;
    for (let slotId in defaultSlots) {
        const slotData = currentData[slotId] || { patti: '---', single: '---' };
        html += `<tr>
            <td class="txt-slot">${defaultSlots[slotId]}</td>
            <td class="txt-patti">${slotData.patti}</td>
            <td class="txt-single">${slotData.single}</td>
        </tr>`;
    }
    html += `</table>`;
    resultContainer.innerHTML = html;
}

function activatePlayZoneListeners() {
    const btnReqOtp = document.getElementById('btn-request-otp');
    if (btnReqOtp) {
        btnReqOtp.addEventListener('click', () => {
            const pName = document.getElementById('player-name').value.trim();
            const pPin = document.getElementById('player-pin').value.trim();

            if (!pName || pPin.length !== 4) { alert("সঠিক নাম ও ৪ ডিজিটের পিন দিন!"); return; }

            playerSessionKey = `${pName}_${pPin}`;
            
            get(ref(db, `wallets/${playerSessionKey}`)).then(wSnap => {
                if(wSnap.exists() && wSnap.val().status === 'blocked') {
                    alert("আপনার অ্যাকাউন্টটি এডমিন দ্বারা ব্লক করা হয়েছে!");
                    return;
                }

                set(ref(db, `otp_requests/${playerSessionKey}`), { name: pName, pin: pPin, status: 'pending', otp: '', type: 'player', createdAt: new Date().toISOString() })
                .then(() => {
                    document.getElementById('otp-input-area').style.display = 'block';
                    alert("অ্যাক্সেস কোড রিকোয়েস্ট পাঠানো হয়েছে। এডমিন প্যানেল থেকে ওটিপি কোড সংগ্রহ করুন।");
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
                    
                    remove(ref(db, `otp_requests/${playerSessionKey}`));

                    document.getElementById('play-auth-screen').style.display = 'none';
                    document.getElementById('play-main-board').style.display = 'block';
                    document.getElementById('display-player-name').textContent = `স্বাগতম, ${playerSessionKey.split('_')[0]}`;
                    
                    onValue(ref(db, `wallets/${playerSessionKey}`), (wSnap) => {
                        if(!wSnap.exists()) {
                            set(ref(db, `wallets/${playerSessionKey}`), { balance: 0, status: 'active' });
                            document.getElementById('player-wallet-display').textContent = `0.00 PTS`;
                        } else {
                            if(wSnap.val().status === 'blocked') { alert("আপনাকে ব্লক করা হয়েছে!"); window.location.reload(); }
                            const bal = parseFloat(wSnap.val().balance || 0);
                            document.getElementById('player-wallet-display').textContent = `${bal.toFixed(2)} PTS`;
                        }
                    });
                } else {
                    alert("ভুল ওটিপি কোড অথবা ওটিপির মেয়াদ শেষ!");
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

            if(!sNum && !pNum) { alert("কমপক্ষে একটি বাজি ইনপুট দিন!"); return; }

            get(ref(db, `wallets/${playerSessionKey}`)).then((wSnap) => {
                const currentBal = wSnap.exists() ? parseFloat(wSnap.val().balance || 0) : 0;
                if (currentBal < (sPts + pPts)) { alert("আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!"); return; }

                update(ref(db, `wallets/${playerSessionKey}`), { balance: currentBal - (sPts + pPts) }).then(() => {
                    const betRef = ref(db, `bets/${todayStr}/${slot}/${playerSessionKey}`);
                    set(betRef, { singleNum: sNum, singlePoints: sPts, pattiNum: pNum, pattiPoints: pPts, timestamp: new Date().toISOString() })
                    .then(() => {
                        alert("আপনার বাজিটি সফলভাবে লক করা হয়েছে! 🚀");
                        document.getElementById('play-single-num').value = '';
                        document.getElementById('play-single-points').value = '';
                        document.getElementById('play-patti-num').value = '';
                        document.getElementById('play-patti-points').value = '';
                    });
                });
            });
        });
    }
}

function showNotification(msg) {
    const bar = document.getElementById('status-message');
    if (!bar) return;
    bar.textContent = msg; bar.style.display = 'block';
    setTimeout(() => bar.style.display = 'none', 3000);
}

const btnLogout = document.getElementById('btn-logout');
if(btnLogout) btnLogout.addEventListener('click', () => window.location.reload());

const btnPlayerLogout = document.getElementById('btn-player-logout');
if(btnPlayerLogout) btnPlayerLogout.addEventListener('click', () => window.location.reload());

initAppEngine();
