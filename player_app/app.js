// ==========================================
// MODULE 1: GLOBAL DYNAMIC STATE & CONFIG
// ==========================================

// Global State Structure (Supports future Admin API Overrides)
window.AppState = window.AppState || {
    // Authentication & User Details
    currentUser: null,
    userType: 'demo', // 'demo', 'real', or 'admin'
    deviceIP: '0.0.0.0',
    
    // Balance & Limits
    playPoints: 5000,
    winPoints: 0,
    
    // View & Dynamic Permissions
    currentMode: 'BOTH', // Default UI Mode: 'BOTH', 'WORD', or 'DIGIT'
    allowedModes: ['BOTH', 'WORD', 'DIGIT'], // Can be restricted by Admin later
    
    // Live Result State
    currentResult: {
        digit: '100',
        word: 'AXZ'
    },
    
    // Game Controls & Cart
    activeRange: 'ALL',
    selectedBetAmount: 10,
    selectedCart: [],
    
    // Dynamic Ratios (Configurable by Admin)
    winningRatios: {
        SINGLE: 9.00,
        TRIPLE: 11.50
    },
    
    // Draw Timer Engine Config
    drawSettings: {
        intervalMinutes: 2,
        lockSecondsBefore: 1
    },
    
    // Lock State
    timerState: {
        isLocked: false,
        secondsRemaining: 120,
        timerId: null
    }
};

// Global Reference Variable
var AppState = window.AppState;

// Initialize Application Engine
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
    checkAndAutoRefillBalance();
}

function updateDateDisplay() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) dateEl.innerText = dateStr;
}

function fetchDeviceIP() {
    AppState.deviceIP = "192.168.1." + Math.floor(Math.random() * 200 + 10);
}

function checkAndAutoRefillBalance() {
    // Testing Refill Guard for Demo Players
    if ((AppState.userType === 'demo' || AppState.currentUser === 'DEMO_PLAYER_01') && AppState.playPoints <= 0) {
        AppState.playPoints = 5000;
        const playPtsEl = document.getElementById('play-points');
        if (playPtsEl) playPtsEl.innerText = AppState.playPoints.toLocaleString();
    }
}

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

// ==========================================
// MODULE 2: AUTHENTICATION & UI SWITCHING
// ==========================================

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username');
            const userTypeInput = document.getElementById('user-type');

            const username = usernameInput ? usernameInput.value.trim() : 'DEMO_PLAYER_01';
            const userType = userTypeInput ? userTypeInput.value : 'demo';

            // Dynamic State Mutation
            AppState.currentUser = username || 'DEMO_PLAYER_01';
            AppState.userType = userType;

            const userIdTextEl = document.getElementById('user-id-text');
            if (userIdTextEl) userIdTextEl.innerText = AppState.currentUser;

            // UI View Transition
            const loginModal = document.getElementById('login-modal');
            const appContainer = document.getElementById('app-container');

            if (loginModal) loginModal.classList.add('hidden');
            if (appContainer) appContainer.classList.remove('hidden');
            
            // Re-render Game View with Updated Config
            renderSingleBoard();
            renderTripleBoard();
            updateLiveResultDisplay();
        });
    }

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

// ==========================================
// MODULE 3: SINGLE BOARD ENGINE (0-9)
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
        
        cell.onclick = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            addBetToCart(`SINGLE-${item.digit}`, item.digit, item.word, 'SINGLE', AppState.selectedBetAmount);
        };

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

    document.querySelectorAll('.mode-selector .btn-mode').forEach(btn => btn.classList.remove('active'));
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
    if (!resultBox || !AppState.currentResult) return;

    if (AppState.currentMode === 'BOTH') {
        resultBox.innerText = `${AppState.currentResult.digit} ${AppState.currentResult.word}`;
    } else if (AppState.currentMode === 'WORD') {
        resultBox.innerText = AppState.currentResult.word;
    } else if (AppState.currentMode === 'DIGIT') {
        resultBox.innerText = AppState.currentResult.digit;
    }
}

// ==========================================
// MODULE 4: TRIPLE 220 MATRIX BOARD
// ==========================================

const RawTripleDigits = [
    "100", "678", "777", "560", "470", "380", "290", "119", "137", "236", "146", "669", "579", "399", "588", "489", "245", "155", "227", "344", "335", "128",
    "200", "345", "444", "570", "480", "390", "660", "129", "237", "336", "246", "679", "255", "147", "228", "499", "688", "778", "138", "156", "110", "589",
    "300", "120", "114", "580", "490", "670", "238", "139", "337", "157", "346", "689", "355", "247", "256", "166", "599", "148", "788", "445", "229", "779",
    "400", "789", "888", "590", "130", "680", "248", "149", "347", "158", "446", "699", "455", "266", "112", "356", "239", "338", "257", "220", "770", "167",
    "500", "456", "555", "140", "230", "690", "258", "159", "357", "799", "267", "780", "447", "366", "113", "122", "177", "249", "339", "889", "348", "168",
    "600", "123", "222", "150", "330", "240", "268", "169", "367", "448", "899", "178", "790", "466", "358", "880", "114", "556", "259", "349", "457", "277",
    "700", "890", "999", "160", "340", "250", "278", "179", "377", "467", "115", "124", "223", "566", "557", "368", "359", "449", "269", "133", "188", "458",
    "800", "567", "666", "170", "350", "260", "288", "189", "116", "233", "459", "125", "224", "477", "990", "134", "558", "369", "378", "440", "279", "468",
    "900", "234", "333", "180", "360", "270", "450", "199", "117", "469", "126", "667", "478", "135", "225", "144", "379", "559", "289", "388", "577", "568",
    "000", "127", "190", "280", "370", "460", "550", "235", "118", "578", "145", "668", "668", "299", "334", "488", "389", "226", "569", "677", "136", "244"
];

const TripleData = [];
for (let i = 0; i < 220; i++) {
    const colNum = (i % 10) + 1;
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

        cell.onclick = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            addBetToCart(`TRIPLE-${item.id}`, item.digit, item.word, 'TRIPLE', AppState.selectedBetAmount);
        };

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

    document.querySelectorAll('.range-selector .btn-range').forEach(btn => btn.classList.remove('active'));
    if (rangeKey === 'ALL') document.getElementById('btn-range-all')?.classList.add('active');
    if (rangeKey === 'A') document.getElementById('btn-range-a')?.classList.add('active');
    if (rangeKey === 'B') document.getElementById('btn-range-b')?.classList.add('active');
    if (rangeKey === 'C') document.getElementById('btn-range-c')?.classList.add('active');
    if (rangeKey === 'D') document.getElementById('btn-range-d')?.classList.add('active');
    if (rangeKey === 'JORA') document.getElementById('btn-range-jora')?.classList.add('active');

    renderTripleBoard();
}

// ==========================================
// MODULE 5: BETTING & SLIP SUMMARY ENGINE
// ==========================================

function setBetAmount(amount) {
    AppState.selectedBetAmount = amount;
    
    document.querySelectorAll('.bet-chip-section .btn-chip').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.trim() === amount.toString()) btn.classList.add('active');
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
        listContainer.innerHTML = '<span class="empty-msg">No items selected</span>';
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

        badge.innerText = `${label} : ৳${item.amount} [Est: ৳${potentialWin.toFixed(1)}]`;
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

    // Deduct Balance dynamically
    AppState.playPoints -= totalCost;
    const playPtsEl = document.getElementById('play-points');
    if (playPtsEl) playPtsEl.innerText = AppState.playPoints.toLocaleString();

    alert(`Bet Submitted Successfully!\nTotal Points Used: ${totalCost}\nPrinting Slip...`);
    
    window.print();
    clearAllSelections();
}

// ==========================================
// MODULE 6: REAL-TIME DRAW TIMER ENGINE
// ==========================================

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

    updateTimerUI(now, msRemaining, totalSecondsRemaining);
}

function setLockState(locked) {
    AppState.timerState.isLocked = locked;
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

    const drawTimeEl = document.getElementById('draw-time-val');
    if (drawTimeEl) drawTimeEl.innerText = timeFormatted;
}
