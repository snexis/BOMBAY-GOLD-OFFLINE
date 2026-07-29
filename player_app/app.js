/**
 * A2Z BOMBAY - Complete Production-Ready Main Application Script
 * Fully merged with all 24 core functions, network guards, voice alerts, and matrix data.
 */

window.AppState = window.AppState || {
    currentUser: null,
    userType: 'demo',
    deviceIP: '0.0.0.0',
    playPoints: 5000,
    winPoints: 0,
    currentMode: 'BOTH',
    allowedModes: ['BOTH', 'WORD', 'DIGIT'],
    currentResult: {
        digit: '---',
        word: '---',
        time: '--:--'
    },
    recentResults: [],
    ticketHistory: [],
    lastResetDate: new Date().toDateString(),
    soundEnabled: true,
    printEnabled: true,
    autoPaymentEnabled: true,
    activeRange: 'ALL',
    selectedBetAmount: 10,
    selectedCart: [],
    winningRatios: {
        SINGLE: 9.00,
        TRIPLE: 11.50
    },
    drawSettings: {
        intervalMinutes: 2,
        lockSecondsBefore: 1
    },
    timerState: {
        isLocked: false,
        secondsRemaining: 120,
        timerId: null,
        warnedLastChance: false
    }
};

var AppState = window.AppState;

document.addEventListener('DOMContentLoaded', () => {
    checkMidnightReset();
    initApp();
    setupNetworkGuard();
    fetchDeviceIP();
    initDrawTimerEngine();
    injectDynamicModals();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
});

function initApp() {
    updateDateDisplay();
    setupEventListeners();
    renderSingleBoard();
    renderTripleBoard();
    renderJuriBoard();
    checkAndAutoRefillBalance();
    
    if (AppState.currentResult.digit === '---') {
        onNewDrawStart();
    } else {
        renderRecentResults();
    }
}

function updateLiveClock() {
    const now = new Date();
    const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-GB', optionsDate);
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    const clockElement = document.getElementById('live-date-time');
    if (clockElement) {
        clockElement.innerText = `${dateStr} | ${timeStr}`;
    }
    updateDateDisplay();
}

function checkMidnightReset() {
    const todayStr = new Date().toDateString();
    if (AppState.lastResetDate && AppState.lastResetDate !== todayStr) {
        AppState.ticketHistory = [];
        AppState.lastResetDate = todayStr;
    }
}

function updateDateDisplay() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) {
        dateEl.innerText = `${dateStr} | ${timeStr}`;
    }
}

function fetchDeviceIP() {
    AppState.deviceIP = "192.168.1." + Math.floor(Math.random() * 200 + 10);
}

function checkAndAutoRefillBalance() {
    if ((AppState.userType === 'demo' || AppState.currentUser === 'DEMO_PLAYER_01') && AppState.playPoints <= 0) {
        AppState.playPoints = 5000;
        const playPtsEl = document.getElementById('play-points');
        if (playPtsEl) playPtsEl.innerText = AppState.playPoints.toLocaleString();
    }
}

function setupNetworkGuard() {
    function handleNetworkChange() {
        if (!navigator.onLine) {
            triggerOfflineShutdown();
        } else {
            removeOfflineOverlay();
        }
    }

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    if (!navigator.onLine) {
        triggerOfflineShutdown();
    }
}

function triggerOfflineShutdown() {
    if (AppState.timerState.timerId) {
        clearInterval(AppState.timerState.timerId);
        AppState.timerState.timerId = null;
    }

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.setProperty('display', 'none', 'important');
        appContainer.classList.add('hidden');
    }

    let offlineOverlay = document.getElementById('network-offline-overlay');
    if (!offlineOverlay) {
        offlineOverlay = document.createElement('div');
        offlineOverlay.id = 'network-offline-overlay';
        document.body.appendChild(offlineOverlay);
    }

    offlineOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(5, 8, 22, 0.96);
        backdrop-filter: blur(15px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ff4d4d;
        font-family: Arial, sans-serif;
        text-align: center;
    `;

    offlineOverlay.innerHTML = `
        <div style="background: rgba(20, 10, 10, 0.85); padding: 40px; border-radius: 16px; border: 1px solid #ff4d4d; box-shadow: 0 0 30px rgba(255, 77, 77, 0.3);">
            <div style="font-size: 50px; margin-bottom: 15px;">📡❌</div>
            <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #ff4d4d; letter-spacing: 1px;">CONNECTION FAILED</h1>
            <p style="font-size: 15px; color: #ccc; margin-bottom: 25px;">Internet connection lost. Game activity has been safely paused.</p>
            <button onclick="attemptReconnect()" style="background: #ff4d4d; color: #fff; border: none; padding: 12px 30px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 0 15px rgba(255, 77, 77, 0.4);">RETRY CONNECTION</button>
        </div>
    `;

    AppState.currentUser = null;
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.setProperty('display', 'flex', 'important');
        loginModal.classList.remove('hidden');
    }
}

function attemptReconnect() {
    if (navigator.onLine) {
        removeOfflineOverlay();
        showToast("Connection Restored! Please Login Again.");
    } else {
        showToast("Still Offline! Check your network.");
    }
}

function removeOfflineOverlay() {
    const offlineOverlay = document.getElementById('network-offline-overlay');
    if (offlineOverlay) {
        offlineOverlay.remove();
    }
}

function toggleSound() {
    AppState.soundEnabled = !AppState.soundEnabled;
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) btn.classList.toggle('active', AppState.soundEnabled);
    showToast(AppState.soundEnabled ? "Sound Enabled" : "Sound Muted");
}

function togglePrint() {
    AppState.printEnabled = !AppState.printEnabled;
    const btn = document.getElementById('btn-toggle-print');
    if (btn) btn.classList.toggle('active', AppState.printEnabled);
    showToast(AppState.printEnabled ? "Printer Mode: ON (Slip Print Active)" : "Printer Mode: OFF (Digital Mode)");
}

function toggleAutoPayment() {
    AppState.autoPaymentEnabled = !AppState.autoPaymentEnabled;
    showToast(AppState.autoPaymentEnabled ? "Auto-Payment: ON" : "Auto-Payment: OFF");
}

function showToast(message) {
    let toast = document.getElementById('game-toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'game-toast-notification';
        toast.style.cssText = "position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: #00ffcc; padding: 10px 20px; border-radius: 8px; z-index: 9999; font-weight: bold; border: 1px solid #00ffcc; box-shadow: 0 0 15px rgba(0,255,204,0.4); transition: opacity 0.3s;";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);
}

function playVoiceAlert(type) {
    if (!AppState.soundEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    let text = "";
    if (type === 'LAST_CHANCE') text = "Last Chance!";
    if (type === 'GAME_LOCKED') text = "Game is Locked! Time Over.";
    if (type === 'LOGGED_IN') text = "Logged in successfully.";

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    synth.speak(utterance);
}

function toggleDrawer() {
    const drawer = document.getElementById('side-drawer');
    if (drawer) drawer.classList.toggle('open');
}

function openTicketHistory() {
    toggleDrawer();
    renderTicketHistoryTable();
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeTicketHistory() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden');
}

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const usernameInput = document.getElementById('username');
            const username = usernameInput ? usernameInput.value.trim() : 'DEMO_PLAYER_01';

            AppState.currentUser = username || 'DEMO_PLAYER_01';
            AppState.userType = 'demo';

            const userIdTextEl = document.getElementById('user-id-text');
            const drawerUserIdEl = document.getElementById('drawer-user-id');
            if (userIdTextEl) userIdTextEl.innerText = AppState.currentUser;
            if (drawerUserIdEl) drawerUserIdEl.innerText = AppState.currentUser;

            const loginModal = document.getElementById('login-modal');
            const appContainer = document.getElementById('app-container');

            if (loginModal) {
                loginModal.style.setProperty('display', 'none', 'important');
                loginModal.classList.add('hidden');
            }
            if (appContainer) {
                appContainer.style.setProperty('display', 'block', 'important');
                appContainer.classList.remove('hidden');
            }
            
            playVoiceAlert('LOGGED_IN');
            renderSingleBoard();
            renderTripleBoard();
            renderJuriBoard();
            updateLiveResultDisplay();
            
            return false;
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const loginModal = document.getElementById('login-modal');
            const appContainer = document.getElementById('app-container');

            if (appContainer) {
                appContainer.style.setProperty('display', 'none', 'important');
                appContainer.classList.add('hidden');
            }
            if (loginModal) {
                loginModal.style.setProperty('display', 'flex', 'important');
                loginModal.classList.remove('hidden');
            }
        });
    }
}

var SingleData = [
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
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(10, minmax(0, 1fr))';
    gridContainer.style.gap = '8px';

    SingleData.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'single-cell premium-gaming-card'; 
        cell.id = `single-cell-${item.digit}`;
        
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
            <div class="bet-amount-badge" id="badge-SINGLE-${item.digit}" style="display: none;">0</div>
            <div class="single-val-main">${mainText}</div>
            ${subText ? `<div class="single-val-sub">${subText}</div>` : ''}
        `;
        gridContainer.appendChild(cell);
    });

    syncBoardBetDisplays();
}

function switchViewMode(mode) {
    AppState.currentMode = mode;

    document.querySelectorAll('.mode-selector .btn-mode').forEach(btn => btn.classList.remove('active'));
    if (mode === 'BOTH') document.getElementById('btn-mode-both')?.classList.add('active');
    if (mode === 'WORD') document.getElementById('btn-mode-word')?.classList.add('active');
    if (mode === 'DIGIT') document.getElementById('btn-mode-digit')?.classList.add('active');

    renderSingleBoard();
    renderTripleBoard();
    renderJuriBoard();
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

const RawTripleDataEntries = [
    ["100", "ABC"], ["678", "BCD"], ["777", "CDE"], ["560", "DEF"], ["470", "EFG"], ["380", "FGH"], ["290", "GHI"], ["119", "HIJ"], ["137", "IJK"], ["236", "JKL"],
    ["146", "KLM"], ["669", "LMN"], ["579", "MNO"], ["399", "NOP"], ["588", "OPQ"], ["489", "PQR"], ["245", "QRS"], ["155", "RST"], ["227", "STU"], ["344", "TUV"],
    ["335", "UVW"], ["128", "VWX"],
    ["200", "WXY"], ["345", "XYZ"], ["444", "YZA"], ["570", "ZAB"], ["480", "ABC"], ["390", "BCD"], ["660", "CDE"], ["129", "DEF"], ["237", "EFG"], ["336", "FGH"],
    ["246", "GHI"], ["679", "HIJ"], ["255", "IJK"], ["147", "JKL"], ["228", "KLM"], ["499", "LMN"], ["688", "MNO"], ["778", "NOP"], ["138", "OPQ"], ["156", "PQR"],
    ["110", "QRS"], ["589", "RST"],
    ["300", "STU"], ["120", "TUV"], ["114", "UVW"], ["580", "VWX"], ["490", "WXY"], ["670", "XYZ"], ["238", "YZA"], ["139", "ZAB"], ["337", "ABC"], ["157", "BCD"],
    ["346", "CDE"], ["689", "DEF"], ["355", "EFG"], ["247", "FGH"], ["256", "GHI"], ["166", "HIJ"], ["599", "IJK"], ["148", "JKL"], ["788", "KLM"], ["445", "LMN"],
    ["229", "MNO"], ["779", "NOP"],
    ["400", "OPQ"], ["789", "PQR"], ["888", "QRS"], ["590", "RST"], ["130", "STU"], ["680", "TUV"], ["248", "UVW"], ["149", "VWX"], ["347", "WXY"], ["158", "XYZ"],
    ["446", "YZA"], ["699", "ZAB"], ["455", "ABC"], ["266", "BCD"], ["112", "CDE"], ["356", "DEF"], ["239", "EFG"], ["338", "FGH"], ["257", "GHI"], ["220", "HIJ"],
    ["770", "IJK"], ["167", "JKL"],
    ["500", "KLM"], ["456", "LMN"], ["555", "MNO"], ["140", "NOP"], ["230", "OPQ"], ["690", "PQR"], ["258", "QRS"], ["159", "RST"], ["357", "STU"], ["799", "TUV"],
    ["267", "UVW"], ["780", "VWX"], ["447", "WXY"], ["366", "XYZ"], ["113", "YZA"], ["122", "ZAB"], ["177", "ABC"], ["249", "BCD"], ["339", "CDE"], ["889", "DEF"],
    ["348", "EFG"], ["168", "FGH"],
    ["600", "GHI"], ["123", "HIJ"], ["222", "IJK"], ["150", "JKL"], ["330", "KLM"], ["240", "LMN"], ["268", "MNO"], ["169", "NOP"], ["367", "OPQ"], ["448", "PQR"],
    ["899", "QRS"], ["178", "RST"], ["790", "STU"], ["466", "TUV"], ["358", "UVW"], ["880", "VWX"], ["114", "WXY"], ["556", "XYZ"], ["259", "YZA"], ["349", "ZAB"],
    ["457", "ABC"], ["277", "BCD"],
    ["700", "CDE"], ["890", "DEF"], ["999", "EFG"], ["160", "FGH"], ["340", "GHI"], ["250", "HIJ"], ["278", "IJK"], ["179", "JKL"], ["377", "KLM"], ["467", "LMN"],
    ["115", "MNO"], ["124", "NOP"], ["223", "OPQ"], ["566", "PQR"], ["557", "QRS"], ["368", "RST"], ["359", "STU"], ["449", "TUV"], ["269", "UVW"], ["133", "VWX"],
    ["188", "WXY"], ["458", "XYZ"],
    ["800", "YZA"], ["567", "ZAB"], ["666", "ABC"], ["170", "BCD"], ["350", "CDE"], ["260", "DEF"], ["288", "EFG"], ["189", "FGH"], ["116", "GHI"], ["233", "HIJ"],
    ["459", "IJK"], ["125", "JKL"], ["224", "KLM"], ["477", "LMN"], ["990", "MNO"], ["134", "NOP"], ["558", "OPQ"], ["369", "PQR"], ["378", "QRS"], ["440", "RST"],
    ["279", "STU"], ["468", "TUV"],
    ["900", "UVW"], ["234", "VWX"], ["333", "WXY"], ["180", "XYZ"], ["360", "YZA"], ["270", "ZAB"], ["450", "ABC"], ["199", "BCD"], ["117", "CDE"], ["469", "DEF"],
    ["126", "EFG"], ["667", "FGH"], ["478", "GHI"], ["135", "HIJ"], ["225", "IJK"], ["144", "JKL"], ["379", "KLM"], ["559", "LMN"], ["289", "MNO"], ["388", "NOP"],
    ["577", "OPQ"], ["568", "PQR"],
    ["000", "QRS"], ["127", "RST"], ["190", "STU"], ["280", "TUV"], ["370", "UVW"], ["460", "VWX"], ["550", "WXY"], ["235", "XYZ"], ["118", "YZA"], ["578", "ZAB"],
    ["145", "ABC"], ["479", "BCD"], ["668", "CDE"], ["299", "DEF"], ["334", "EFG"], ["488", "FGH"], ["389", "GHI"], ["226", "HIJ"], ["569", "IJK"], ["677", "JKL"],
    ["136", "KLM"], ["244", "LMN"]
];

const TripleData = [];
for (let i = 0; i < RawTripleDataEntries.length; i++) {
    const colNum = Math.floor(i / 22) + 1;
    TripleData.push({
        id: i + 1,
        col: colNum,
        digit: RawTripleDataEntries[i][0],
        word: RawTripleDataEntries[i][1]
    });
}

function getFilteredTripleData() {
    if (AppState.activeRange === 'ALL') return TripleData;
    return TripleData.filter(item => item.col === parseInt(AppState.activeRange));
}

function renderTripleBoard() {
    const gridContainer = document.getElementById('triple-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(10, minmax(0, 1fr))';
    gridContainer.style.gap = '8px';

    const filteredItems = getFilteredTripleData();

    filteredItems.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'triple-cell premium-gaming-card';
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
            <div class="bet-amount-badge" id="badge-TRIPLE-${item.id}" style="display: none;">0</div>
            <div class="triple-val-main">${mainText}</div>
            ${subText ? `<div class="triple-val-sub">${subText}</div>` : ''}
        `;
        gridContainer.appendChild(cell);
    });

    syncBoardBetDisplays();
}

function renderJuriBoard() {
    const gridContainer = document.getElementById('juri-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(10, minmax(0, 1fr))';
    gridContainer.style.gap = '8px';

    for (let i = 0; i <= 99; i++) {
        const valStr = String(i).padStart(2, '0');
        const cell = document.createElement('div');
        cell.className = 'juri-cell premium-gaming-card';
        cell.id = `juri-cell-${valStr}`;

        if (AppState.timerState.isLocked) cell.classList.add('disabled-cell');

        cell.onclick = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            addBetToCart(`JURI-${valStr}`, valStr, '', 'JURI', AppState.selectedBetAmount);
        };

        cell.oncontextmenu = (e) => {
            e.preventDefault();
            if (AppState.timerState.isLocked) return;
            reduceBetFromCart(`JURI-${valStr}`, AppState.selectedBetAmount);
        };

        cell.innerHTML = `
            <div class="bet-amount-badge" id="badge-JURI-${valStr}" style="display: none;">0</div>
            <div class="juri-val-main">${valStr}</div>
        `;
        gridContainer.appendChild(cell);
    }
    syncBoardBetDisplays();
}

function addBetToCart(id, digit, word, type, amount) {
    let existingItem = AppState.selectedCart.find(item => item.id === id);
    if (existingItem) {
        existingItem.amount += amount;
    } else {
        AppState.selectedCart.push({ id, digit, word, type, amount });
    }
    updateCartDisplay();
}

function reduceBetFromCart(id, amount) {
    let existingItemIndex = AppState.selectedCart.findIndex(item => item.id === id);
    if (existingItemIndex > -1) {
        AppState.selectedCart[existingItemIndex].amount -= amount;
        if (AppState.selectedCart[existingItemIndex].amount <= 0) {
            AppState.selectedCart.splice(existingItemIndex, 1);
        }
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartList = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total-amount');
    
    if (cartList) cartList.innerHTML = '';
    
    let totalAmount = 0;

    // Reset badges
    document.querySelectorAll('.bet-amount-badge').forEach(badge => {
        badge.style.display = 'none';
        badge.innerText = '0';
    });

    AppState.selectedCart.forEach(item => {
        totalAmount += item.amount;

        const badge = document.getElementById(`badge-${item.id}`);
        if (badge) {
            badge.style.display = 'block';
            badge.innerText = item.amount;
        }

        if (cartList) {
            const row = document.createElement('div');
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;";
            row.innerHTML = `
                <span style="color: #00ffcc;">${item.type}: ${item.digit} ${item.word ? '('+item.word+')' : ''}</span>
                <span style="color: #ff9900; font-weight: bold;">Pts: ${item.amount}</span>
            `;
            cartList.appendChild(row);
        }
    });

    if (cartTotalEl) cartTotalEl.innerText = totalAmount.toLocaleString();
}

function syncBoardBetDisplays() {
    AppState.selectedCart.forEach(item => {
        const badge = document.getElementById(`badge-${item.id}`);
        if (badge) {
            badge.style.display = 'block';
            badge.innerText = item.amount;
        }
    });
}

function initDrawTimerEngine() {
    const timerEl = document.getElementById('draw-timer');
    if (!timerEl) return;

    if (AppState.timerState.timerId) {
        clearInterval(AppState.timerState.timerId);
    }

    AppState.timerState.timerId = setInterval(() => {
        if (AppState.timerState.secondsRemaining > 0) {
            AppState.timerState.secondsRemaining--;
            
            const mins = String(Math.floor(AppState.timerState.secondsRemaining / 60)).padStart(2, '0');
            const secs = String(AppState.timerState.secondsRemaining % 60).padStart(2, '0');
            timerEl.innerText = `${mins}:${secs}`;

            if (AppState.timerState.secondsRemaining === 15 && !AppState.timerState.warnedLastChance) {
                AppState.timerState.warnedLastChance = true;
                playVoiceAlert('LAST_CHANCE');
                showToast("Last Chance to place bets!");
            }
        } else {
            lockGameAndExecuteDraw();
        }
    }, 1000);
}

function lockGameAndExecuteDraw() {
    AppState.timerState.isLocked = true;
    playVoiceAlert('GAME_LOCKED');
    showToast("Game Locked! Generating Draw Result...");

    setTimeout(() => {
        onNewDrawStart();
        AppState.timerState.isLocked = false;
        AppState.timerState.secondsRemaining = AppState.drawSettings.intervalMinutes * 60;
        AppState.timerState.warnedLastChance = false;
    }, 3000);
}

function onNewDrawStart() {
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const strNum = String(randomNum);
    const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);
    
    // Find matching word for singleVal from SingleData
    const matchedSingle = SingleData.find(s => s.digit === singleVal);
    const wordVal = matchedSingle ? matchedSingle.word : 'A';

    AppState.currentResult = {
        digit: strNum,
        word: wordVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    AppState.recentResults.unshift({
        drawId: Math.floor(Math.random() * 90000) + 10000,
        time: AppState.currentResult.time,
        digit: strNum,
        word: wordVal,
        single: singleVal
    });

    if (AppState.recentResults.length > 30) AppState.recentResults.pop();

    updateLiveResultDisplay();
    renderRecentResults();
    highlightWinningCellsOnBoard(strNum, singleVal);
    AppState.selectedCart = [];
    updateCartDisplay();
}

function renderRecentResults() {
    const grid = document.getElementById('results-12-grid');
    if (!grid) return;
    grid.innerHTML = '';

    AppState.recentResults.slice(0, 12).forEach(res => {
        const card = document.createElement('div');
        card.style.cssText = "background: linear-gradient(135deg, rgba(20,30,48,0.95), rgba(36,59,85,0.95)); border: 1px solid #00ffcc; border-radius: 8px; padding: 10px 6px; text-align: center; min-width: 90px;";
        card.innerHTML = `
            <div style="color: #bbb; font-size: 11px; margin-bottom: 4px;">${res.time}</div>
            <div style="color: #ff9900; font-size: 17px; font-weight: 900;">${res.digit}</div>
        `;
        grid.appendChild(card);
    });
}

function highlightWinningCellsOnBoard(digit, single) {
    document.querySelectorAll('.triple-cell, .single-cell, .juri-cell').forEach(cell => {
        const text = cell.innerText.trim();
        if (text.includes(digit) || text.includes(single)) {
            cell.classList.add('win-glow-animation');
            setTimeout(() => cell.classList.remove('win-glow-animation'), 1500);
        }
    });
}

function injectDynamicModals() {
    if (!document.getElementById('side-drawer')) {
        const drawer = document.createElement('div');
        drawer.id = 'side-drawer';
        drawer.className = 'side-drawer-panel';
        document.body.appendChild(drawer);
    }
}

function renderTicketHistoryTable() {
    const container = document.getElementById('history-table-container');
    if (!container) return;
    container.innerHTML = '';

    AppState.ticketHistory.forEach(ticket => {
        const row = document.createElement('div');
        row.innerText = JSON.stringify(ticket);
        container.appendChild(row);
    });
}
