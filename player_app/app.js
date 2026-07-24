// ==========================================
// MODULE 1: GLOBAL STATE, IP & NETWORK GUARD
// ==========================================

const AppState = {
    currentUser: null,
    userType: 'demo',
    deviceIP: '127.0.0.1',
    playPoints: 5000,
    winPoints: 1200,
    currentMode: 'BOTH', // BOTH, WORD, DIGIT
    currentResult: {
        digit: '100',
        word: 'AXZ'
    },
    activeRange: 'ALL', // ALL, A, B, C, D, JORA
    selectedBetAmount: 10,
    selectedCart: [],
    
    // Winning Ratio Multipliers (As per mathematical specifications)
    winningRatios: {
        SINGLE: 9.00,    // 1 Point = 9 Points
        TRIPLE: 11.50    // 1 Point = 11.50 Points
    },

    // Dynamic Admin Timing & Engine Configurations
    drawSettings: {
        intervalMinutes: 2,   // Default 2-minute interval for testing
        lockSecondsBefore: 1  // Locks 1 second before draw completion
    },
    timerState: {
        isLocked: false,
        secondsRemaining: 120,
        timerId: null
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupNetworkGuard();
    fetchDeviceIP();
    initDrawTimerEngine();
});

function initApp() {
    updateDateDisplay();
    setupEventListeners();
    renderSingleBoard();
    renderTripleBoard();
}

function updateDateDisplay() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) dateEl.innerText = dateStr;
}

// Device IP Extractor Hook for Future Admin Binding
function fetchDeviceIP() {
    AppState.deviceIP = "192.168.1." + Math.floor(Math.random() * 200 + 10);
    console.log("Device Local IP Enrolled:", AppState.deviceIP);
}

// Network Internet Guard
function setupNetworkGuard() {
    function updateOnlineStatus() {
        const overlay = document.getElementById('network-offline-overlay');
        if (!overlay) return;
        
        if (navigator.onLine) {
            overlay.classList.add('hidden');
        } else {
            overlay.classList.remove('hidden');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const userTypeInput = document.getElementById('user-type');

        const username = usernameInput ? usernameInput.value : 'DEMO_PLAYER_01';
        const userType = userTypeInput ? userTypeInput.value : 'demo';

        AppState.currentUser = username;
        AppState.userType = userType;

        const userIdTextEl = document.getElementById('user-id-text');
        if (userIdTextEl) userIdTextEl.innerText = username;

        const displayUserEl = document.getElementById('display-user');
        if (displayUserEl) displayUserEl.innerText = `User: ${username}`;

        const modeLabelEl = document.getElementById('active-mode-label');
        if (modeLabelEl) {
            modeLabelEl.innerText = userType === 'admin' ? 'ADMIN CONTROL PANEL' : 'DEMO PLAYER MODE';
        }

        const loginModal = document.getElementById('login-modal');
        const appContainer = document.getElementById('app-container');

        if (loginModal) loginModal.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        renderSingleBoard();
        renderTripleBoard();
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const loginModal = document.getElementById('login-modal');
            const appContainer = document.getElementById('app-container');

            if (appContainer) appContainer.classList.add('hidden');
            if (loginModal) loginModal.classList.remove('hidden');
        });
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.sidebar-menu .nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    console.log("Switched to Tab:", tabName);
}

// ==========================================
// MODULE 2: SINGLE BOARD ENGINE
// ==========================================

const SingleData = [
    { digit: '1', word: 'A' }, { digit: '2', word: 'B' },
    { digit: '3', word: 'C' }, { digit: '4', word: 'D' },
    { digit: '5', word: 'E' }, { digit: '6', word: 'F' },
    { digit: '7', word: 'G' }, { digit: '8', word: 'H' },
    { digit: '9', word: 'I' }, { digit: '0', word: 'J' }
];

function renderSingleBoard() {
    const gridContainer = document.getElementById('single-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    SingleData.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'single-cell';
        if (AppState.timerState.isLocked) cell.classList.add('disabled-cell');
        
        // Left-click (Add Bet)
        cell.onclick = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            addBetToCart(`SINGLE-${item.digit}`, item.digit, item.word, 'SINGLE', AppState.selectedBetAmount);
        };

        // Right-click (Reduce Bet)
        cell.oncontextmenu = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            reduceBetFromCart(`SINGLE-${item.digit}`, AppState.selectedBetAmount);
        };

        let mainText = item.digit;
        let subText = item.word;

        if (AppState.currentMode === 'WORD') {
            mainText = item.word;
            subText = '';
        } else if (AppState.currentMode === 'DIGIT') {
            mainText = item.digit;
            subText = '';
        }

        cell.innerHTML = `
            <div class="single-val-main">${mainText}</div>
            ${subText ? `<div class="single-val-sub">${subText}</div>` : ''}
        `;
        gridContainer.appendChild(cell);
    });
}

function switchViewMode(mode) {
    AppState.currentMode = mode;

    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    if (mode === 'BOTH') document.getElementById('btn-mode-both')?.classList.add('active');
    if (mode === 'WORD') document.getElementById('btn-mode-word')?.classList.add('active');
    if (mode === 'DIGIT') document.getElementById('btn-mode-digit')?.classList.add('active');

    renderSingleBoard();
    renderTripleBoard();
    updateLiveResultDisplay();
    updateCartDisplay();
}

function updateLiveResultDisplay() {
    const resultBox = document.getElementById('top-result-display');
    if (!resultBox) return;

    if (AppState.currentMode === 'BOTH') {
        resultBox.innerText = `${AppState.currentResult.digit} ${AppState.currentResult.word}`;
    } else if (AppState.currentMode === 'WORD') {
        resultBox.innerText = AppState.currentResult.word;
    } else if (AppState.currentMode === 'DIGIT') {
        resultBox.innerText = AppState.currentResult.digit;
    }
}

// ==========================================
// MODULE 3: TRIPLE 220 MATRIX (EXACT IMAGE DATA)
// ==========================================

// ইমেজের চার্ট অনুযায়ী ১ থেকে ০ কলামের সম্পূর্ণ ২২০টি ডিজিট
const RawTripleDigits = [
    // Col 1 (1)
    "100", "678", "777", "560", "470", "380", "290", "119", "137", "236", "146", "669", "579", "399", "588", "489", "245", "155", "227", "344", "335", "128",
    // Col 2 (2)
    "200", "345", "444", "570", "480", "390", "660", "129", "237", "336", "246", "679", "255", "147", "228", "499", "688", "778", "138", "156", "110", "589",
    // Col 3 (3)
    "300", "120", "114", "580", "490", "670", "238", "139", "337", "157", "346", "689", "355", "247", "256", "166", "599", "148", "788", "445", "229", "779",
    // Col 4 (4)
    "400", "789", "888", "590", "130", "680", "248", "149", "347", "158", "446", "699", "455", "266", "112", "356", "239", "338", "257", "220", "770", "167",
    // Col 5 (5)
    "500", "456", "555", "140", "230", "690", "258", "159", "357", "799", "267", "780", "447", "366", "113", "122", "177", "249", "339", "889", "348", "168",
    // Col 6 (6)
    "600", "123", "222", "150", "330", "240", "268", "169", "367", "448", "899", "178", "790", "466", "358", "880", "114", "556", "259", "349", "457", "277",
    // Col 7 (7)
    "700", "890", "999", "160", "340", "250", "278", "179", "377", "467", "115", "124", "223", "566", "557", "368", "359", "449", "269", "133", "188", "458",
    // Col 8 (8)
    "800", "567", "666", "170", "350", "260", "288", "189", "116", "233", "459", "125", "224", "477", "990", "134", "558", "369", "378", "440", "279", "468",
    // Col 9 (9)
    "900", "234", "333", "180", "360", "270", "450", "199", "117", "469", "126", "667", "478", "135", "225", "144", "379", "559", "289", "388", "577", "568",
    // Col 10 (0)
    "000", "127", "190", "280", "370", "460", "550", "235", "118", "578", "145", "668", "668", "299", "334", "488", "389", "226", "569", "677", "136", "244"
];

const TripleData = [];
for (let i = 0; i < 220; i++) {
    const colNum = (i % 10) + 1;
    // Word গাণিতিক নিয়ম অনুযায়ী অটো সাজানো থাকবে, ওয়ার্ডে কোনো হাত দেওয়া হয়নি
    const wordVal = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 1) % 26)) + String.fromCharCode(65 + ((i + 2) % 26));
    
    TripleData.push({
        id: i + 1,
        col: colNum,
        digit: RawTripleDigits[i],
        word: wordVal
    });
}

function renderTripleBoard() {
    const gridContainer = document.getElementById('triple-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const filteredItems = getFilteredTripleData();

    filteredItems.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'triple-cell';
        cell.id = `triple-cell-${item.id}`;
        if (AppState.timerState.isLocked) cell.classList.add('disabled-cell');

        // Left-click (Add Bet)
        cell.onclick = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            addBetToCart(`TRIPLE-${item.id}`, item.digit, item.word, 'TRIPLE', AppState.selectedBetAmount);
        };

        // Right-click (Reduce Bet)
        cell.oncontextmenu = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            reduceBetFromCart(`TRIPLE-${item.id}`, AppState.selectedBetAmount);
        };

        let mainText = item.digit;
        let subText = item.word;

        if (AppState.currentMode === 'WORD') {
            mainText = item.word;
            subText = '';
        } else if (AppState.currentMode === 'DIGIT') {
            mainText = item.digit;
            subText = '';
        }

        cell.innerHTML = `
            <div class="triple-val-digit">${mainText}</div>
            ${subText ? `<div class="triple-val-word">${subText}</div>` : ''}
        `;
        gridContainer.appendChild(cell);
    });
}

function getFilteredTripleData() {
    if (AppState.activeRange === 'A') return TripleData.slice(0, 55);
    if (AppState.activeRange === 'B') return TripleData.slice(55, 110);
    if (AppState.activeRange === 'C') return TripleData.slice(110, 165);
    if (AppState.activeRange === 'D') return TripleData.slice(165, 220);
    if (AppState.activeRange === 'JORA') return TripleData.slice(0, 100);
    return TripleData;
}

function filterRange(rangeKey) {
    AppState.activeRange = rangeKey;

    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    if (rangeKey === 'ALL') document.getElementById('btn-range-all')?.classList.add('active');
    if (rangeKey === 'A') document.getElementById('btn-range-a')?.classList.add('active');
    if (rangeKey === 'B') document.getElementById('btn-range-b')?.classList.add('active');
    if (rangeKey === 'C') document.getElementById('btn-range-c')?.classList.add('active');
    if (rangeKey === 'D') document.getElementById('btn-range-d')?.classList.add('active');
    if (rangeKey === 'JORA') document.getElementById('btn-range-jora')?.classList.add('active');

    renderTripleBoard();
}

// ==========================================
// MODULE 4: CART & WINNING CALCULATION ENGINE
// ==========================================

function setBetAmount(amount) {
    AppState.selectedBetAmount = amount;
    
    document.querySelectorAll('.bet-chip-section .btn-chip').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(amount.toString())) btn.classList.add('active');
    });

    const customInput = document.getElementById('custom-bet-input');
    if (customInput) customInput.value = '';
}

function setCustomAmount(val) {
    const num = parseInt(val);
    if (num && num > 0) {
        AppState.selectedBetAmount = num;
        document.querySelectorAll('.bet-chip-section .btn-chip').forEach(btn => btn.classList.remove('active'));
    }
}

function addBetToCart(uniqueId, digitVal, wordVal, type, amount) {
    if (AppState.timerState.isLocked) return;

    const existingIndex = AppState.selectedCart.findIndex(i => i.uniqueId === uniqueId);

    if (existingIndex > -1) {
        AppState.selectedCart[existingIndex].amount += amount;
    } else {
        const ratio = type === 'SINGLE' ? AppState.winningRatios.SINGLE : AppState.winningRatios.TRIPLE;
        AppState.selectedCart.push({
            uniqueId: uniqueId,
            digit: digitVal,
            word: wordVal,
            type: type,
            amount: amount,
            winningRatio: ratio
        });
    }

    updateCartDisplay();
}

function reduceBetFromCart(uniqueId, amount) {
    if (AppState.timerState.isLocked) return;

    const existingIndex = AppState.selectedCart.findIndex(i => i.uniqueId === uniqueId);

    if (existingIndex > -1) {
        AppState.selectedCart[existingIndex].amount -= amount;
        if (AppState.selectedCart[existingIndex].amount <= 0) {
            AppState.selectedCart.splice(existingIndex, 1);
        }
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const listContainer = document.getElementById('selected-items-display');
    const countDisplay = document.getElementById('selected-count');
    const totalDisplay = document.getElementById('total-bet-points');

    if (!listContainer) return;

    if (AppState.selectedCart.length === 0) {
        listContainer.innerHTML = '<span class="empty-msg">কোনো আইটেম সিলেক্ট করা হয়নি</span>';
        if (countDisplay) countDisplay.innerText = '0';
        if (totalDisplay) totalDisplay.innerText = '0';
        return;
    }

    listContainer.innerHTML = '';
    let totalPoints = 0;

    AppState.selectedCart.forEach(item => {
        totalPoints += item.amount;
        const badge = document.createElement('span');
        badge.className = 'chip-item-badge';

        let label = item.digit;
        if (AppState.currentMode === 'WORD') label = item.word;
        if (AppState.currentMode === 'BOTH') label = `${item.digit}(${item.word})`;

        const potentialWin = item.amount * item.winningRatio;

        badge.innerText = `${label} : ${item.amount} Pts [Est. Win: ${potentialWin.toFixed(1)}]`;
        listContainer.appendChild(badge);
    });

    if (countDisplay) countDisplay.innerText = AppState.selectedCart.length.toString();
    if (totalDisplay) totalDisplay.innerText = totalPoints.toLocaleString();
}

function clearAllSelections() {
    AppState.selectedCart = [];
    updateCartDisplay();
}

function submitBetAndPrint() {
    if (AppState.timerState.isLocked) {
        alert("Betting is currently LOCKED for this draw!");
        return;
    }

    if (AppState.selectedCart.length === 0) {
        alert("Please select a bet before submitting!");
        return;
    }

    let totalCost = AppState.selectedCart.reduce((sum, item) => sum + item.amount, 0);

    if (AppState.playPoints < totalCost) {
        alert("Insufficient play points!");
        return;
    }

    AppState.playPoints -= totalCost;
    const playPtsEl = document.getElementById('play-points');
    if (playPtsEl) playPtsEl.innerText = AppState.playPoints.toLocaleString();

    AudioSystem.playSuccess();

    alert(`Bet Submitted Successfully!\nTotal Points Used: ${totalCost}\nDevice IP: ${AppState.deviceIP}\nPrinting Slip...`);
    
    window.print();
    clearAllSelections();
}

// ==========================================
// MODULE 5: REAL-TIME CLOCK, AUDIO & LOCK ENGINE
// ==========================================

const AudioSystem = {
    ctx: null,
    
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    },

    playSuccess() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    playTick() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    },

    playLockBeep() {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }
};

function initDrawTimerEngine() {
    if (AppState.timerState.timerId) clearInterval(AppState.timerState.timerId);
    AppState.timerState.timerId = setInterval(runClockCycle, 1000);
    runClockCycle();
}

function runClockCycle() {
    const now = new Date();
    const intervalMs = AppState.drawSettings.intervalMinutes * 60 * 1000;
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentMs = now.getTime() - startOfDay;
    
    const msIntoCurrentDraw = currentMs % intervalMs;
    const msRemaining = intervalMs - msIntoCurrentDraw;
    
    const totalSecondsRemaining = Math.floor(msRemaining / 1000);
    AppState.timerState.secondsRemaining = totalSecondsRemaining;

    const isLockPeriod = totalSecondsRemaining <= AppState.drawSettings.lockSecondsBefore;

    if (isLockPeriod && !AppState.timerState.isLocked) {
        setLockState(true);
    } else if (!isLockPeriod && AppState.timerState.isLocked) {
        setLockState(false);
        onNewDrawStart();
    }

    if (totalSecondsRemaining > 1 && totalSecondsRemaining <= 10) {
        AudioSystem.playTick();
    }

    updateTimerUI(now, msRemaining, totalSecondsRemaining);
}

function setLockState(locked) {
    AppState.timerState.isLocked = locked;
    
    const lockOverlay = document.getElementById('time-lock-banner');
    const submitBtn = document.getElementById('submit-bet-btn');

    if (locked) {
        AudioSystem.playLockBeep();
        if (lockOverlay) lockOverlay.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        if (lockOverlay) lockOverlay.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
    }

    renderSingleBoard();
    renderTripleBoard();
}

function onNewDrawStart() {
    const randomTriple = TripleData[Math.floor(Math.random() * TripleData.length)];

    AppState.currentResult = {
        digit: randomTriple.digit,
        word: randomTriple.word
    };

    updateLiveResultDisplay();
}

function updateTimerUI(nowDate, msRemaining, totalSecs) {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const nextDrawTime = new Date(nowDate.getTime() + msRemaining);
    const nextDrawFormatted = nextDrawTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const countdownEl = document.getElementById('draw-countdown-timer');
    const nextDrawEl = document.getElementById('next-draw-time-display');

    if (countdownEl) {
        countdownEl.innerText = timeFormatted;
        if (totalSecs <= 10) {
            countdownEl.classList.add('warning-text');
        } else {
            countdownEl.classList.remove('warning-text');
        }
    }

    if (nextDrawEl) {
        nextDrawEl.innerText = `Next Draw: ${nextDrawFormatted}`;
    }
}
