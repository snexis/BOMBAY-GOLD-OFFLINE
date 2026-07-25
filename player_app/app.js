// ==========================================
// MODULE 1: GLOBAL DYNAMIC STATE & CONFIG
// ==========================================

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
    
    soundEnabled: true,
    printEnabled: true,
    
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
    
    if (AppState.currentResult.digit === '---') {
        onNewDrawStart();
    } else {
        renderRecentResults();
    }
}

function updateDateDisplay() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) dateEl.innerText = `${dateStr} | ${timeStr}`;
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

function toggleSound() {
    AppState.soundEnabled = !AppState.soundEnabled;
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) btn.classList.toggle('active', AppState.soundEnabled);
}

function togglePrint() {
    AppState.printEnabled = !AppState.printEnabled;
    const btn = document.getElementById('btn-toggle-print');
    if (btn) btn.classList.toggle('active', AppState.printEnabled);
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

// ==========================================
// MODULE 2: AUTHENTICATION & UI SWITCHING
// ==========================================

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

// ==========================================
// MODULE 3: SINGLE BOARD ENGINE (0-9)
// ==========================================

if (typeof SingleData === 'undefined') {
    var SingleData = [
        { digit: '1', word: 'A' }, { digit: '2', word: 'B' },
        { digit: '3', word: 'C' }, { digit: '4', word: 'D' },
        { digit: '5', word: 'E' }, { digit: '6', word: 'F' },
        { digit: '7', word: 'G' }, { digit: '8', word: 'H' },
        { digit: '9', word: 'I' }, { digit: '0', word: 'J' }
    ];
}

function renderSingleBoard() {
    const gridContainer = document.getElementById('single-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

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
// MODULE 4: TRIPLE 220 MATRIX BOARD (EXACT IMAGE MATCH)
// ==========================================

const RawTripleDataEntries = [
    // Column 1 (Exact from image)
    ["100", "ABC"], ["678", "BCD"], ["777", "CDE"], ["560", "DEF"], ["470", "EFG"], ["380", "FGH"], ["290", "GHI"], ["119", "HIJ"], ["137", "IJK"], ["236", "JKL"],
    ["146", "KLM"], ["669", "LMN"], ["579", "MNO"], ["399", "NOP"], ["588", "OPQ"], ["489", "PQR"], ["245", "QRS"], ["155", "RST"], ["227", "STU"], ["344", "TUV"],
    ["335", "UVW"], ["128", "VWX"],
    
    // Column 2 (Exact from image)
    ["200", "WXY"], ["345", "XYZ"], ["444", "YZA"], ["570", "ZAB"], ["480", "ABC"], ["390", "BCD"], ["660", "CDE"], ["129", "DEF"], ["237", "EFG"], ["336", "FGH"],
    ["246", "GHI"], ["679", "HIJ"], ["255", "IJK"], ["147", "JKL"], ["228", "KLM"], ["499", "LMN"], ["688", "MNO"], ["778", "NOP"], ["138", "OPQ"], ["156", "PQR"],
    ["110", "QRS"], ["589", "RST"],

    // Column 3 (Exact from image)
    ["300", "STU"], ["120", "TUV"], ["114", "UVW"], ["580", "VWX"], ["490", "WXY"], ["670", "XYZ"], ["238", "YZA"], ["139", "ZAB"], ["337", "ABC"], ["157", "BCD"],
    ["346", "CDE"], ["689", "DEF"], ["355", "EFG"], ["247", "FGH"], ["256", "GHI"], ["166", "HIJ"], ["599", "IJK"], ["148", "JKL"], ["788", "KLM"], ["445", "LMN"],
    ["229", "MNO"], ["779", "NOP"],

    // Column 4 (Exact from image)
    ["400", "OPQ"], ["789", "PQR"], ["888", "QRS"], ["590", "RST"], ["130", "STU"], ["680", "TUV"], ["248", "UVW"], ["149", "VWX"], ["347", "WXY"], ["158", "XYZ"],
    ["446", "YZA"], ["699", "ZAB"], ["455", "ABC"], ["266", "BCD"], ["112", "CDE"], ["356", "DEF"], ["239", "EFG"], ["338", "FGH"], ["257", "GHI"], ["220", "HIJ"],
    ["770", "IJK"], ["167", "JKL"],

    // Column 5 (Exact from image)
    ["500", "KLM"], ["456", "LMN"], ["555", "MNO"], ["140", "NOP"], ["230", "OPQ"], ["690", "PQR"], ["258", "QRS"], ["159", "RST"], ["357", "STU"], ["799", "TUV"],
    ["267", "UVW"], ["780", "VWX"], ["447", "WXY"], ["366", "XYZ"], ["113", "YZA"], ["122", "ZAB"], ["177", "ABC"], ["249", "BCD"], ["339", "CDE"], ["889", "DEF"],
    ["348", "EFG"], ["168", "FGH"],

    // Column 6 (Exact from image)
    ["600", "GHI"], ["123", "HIJ"], ["222", "IJK"], ["150", "JKL"], ["330", "KLM"], ["240", "LMN"], ["268", "MNO"], ["169", "NOP"], ["367", "OPQ"], ["448", "PQR"],
    ["899", "QRS"], ["178", "RST"], ["790", "STU"], ["466", "TUV"], ["358", "UVW"], ["880", "VWX"], ["114", "WXY"], ["556", "XYZ"], ["259", "YZA"], ["349", "ZAB"],
    ["457", "ABC"], ["277", "BCD"],

    // Column 7 (Exact from image)
    ["700", "CDE"], ["890", "DEF"], ["999", "EFG"], ["160", "FGH"], ["340", "GHI"], ["250", "HIJ"], ["278", "IJK"], ["179", "JKL"], ["377", "KLM"], ["467", "LMN"],
    ["115", "MNO"], ["124", "NOP"], ["223", "OPQ"], ["566", "PQR"], ["557", "QRS"], ["368", "RST"], ["359", "STU"], ["449", "TUV"], ["269", "UVW"], ["133", "VWX"],
    ["188", "WXY"], ["458", "XYZ"],

    // Column 8 (Exact from image)
    ["800", "YZA"], ["567", "ZAB"], ["666", "ABC"], ["170", "BCD"], ["350", "CDE"], ["260", "DEF"], ["288", "EFG"], ["189", "FGH"], ["116", "GHI"], ["233", "HIJ"],
    ["459", "IJK"], ["125", "JKL"], ["224", "KLM"], ["477", "LMN"], ["990", "MNO"], ["134", "NOP"], ["558", "OPQ"], ["369", "PQR"], ["378", "QRS"], ["440", "RST"],
    ["279", "STU"], ["468", "TUV"],

    // Column 9 (Exact from image)
    ["900", "UVW"], ["234", "VWX"], ["333", "WXY"], ["180", "XYZ"], ["360", "YZA"], ["270", "ZAB"], ["450", "ABC"], ["199", "BCD"], ["117", "CDE"], ["469", "DEF"],
    ["126", "EFG"], ["667", "FGH"], ["478", "GHI"], ["135", "HIJ"], ["225", "IJK"], ["144", "JKL"], ["379", "KLM"], ["559", "LMN"], ["289", "MNO"], ["388", "NOP"],
    ["577", "OPQ"], ["568", "PQR"],

    // Column 10 (Exact from image)
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

function renderTripleBoard() {
    const gridContainer = document.getElementById('triple-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
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
            <div class="triple-val-digit">${mainText}</div>
            ${subText ? `<div class="triple-val-word">${subText}</div>` : ''}
        `;
        gridContainer.appendChild(cell);
    });

    syncBoardBetDisplays();
}

function getFilteredTripleData() {
    if (AppState.activeRange === 'A') return TripleData.slice(0, 55);
    if (AppState.activeRange === 'B') return TripleData.slice(55, 110);
    if (AppState.activeRange === 'C') return TripleData.slice(110, 165);
    if (AppState.activeRange === 'D') return TripleData.slice(165, 220);
    if (AppState.activeRange === 'JORA') {
        return TripleData.filter(item => {
            const d = item.digit;
            return d[0] === d[1] || d[1] === d[2] || d[0] === d[2];
        });
    }
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
        if (btn.innerText.trim().includes(amount.toString())) btn.classList.add('active');
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

function syncBoardBetDisplays() {
    document.querySelectorAll('.bet-amount-badge').forEach(badge => {
        badge.style.display = 'none';
        badge.innerText = '0';
        if(badge.parentElement) badge.parentElement.classList.remove('has-active-bet');
    });

    AppState.selectedCart.forEach(item => {
        const badge = document.getElementById(`badge-${item.uniqueId}`);
        if (badge) {
            badge.innerText = item.amount;
            badge.style.display = 'block';
            if(badge.parentElement) badge.parentElement.classList.add('has-active-bet');
        }
    });
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
        syncBoardBetDisplays();
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

        badge.innerText = `${label} : ${item.amount} PTS [Est Win: ${potentialWin.toFixed(0)} PTS]`;
        listContainer.appendChild(badge);
    });

    if (countDisplay) countDisplay.innerText = AppState.selectedCart.length.toString();
    if (totalDisplay) totalDisplay.innerText = totalPoints.toLocaleString();
    
    syncBoardBetDisplays();
}

function clearAllSelections() {
    AppState.selectedCart = [];
    updateCartDisplay();
}

function submitBetAndPrint() {
    if (AppState.timerState.isLocked) return;
    if (AppState.selectedCart.length === 0) return;

    let totalCost = AppState.selectedCart.reduce((sum, item) => sum + item.amount, 0);

    if (AppState.playPoints < totalCost) return;

    AppState.playPoints -= totalCost;
    const playPtsEl = document.getElementById('play-points');
    if (playPtsEl) playPtsEl.innerText = AppState.playPoints.toLocaleString();

    const ticketId = "TKT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 89 + 10);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const ticketRecord = {
        id: ticketId,
        points: totalCost,
        time: timeStr,
        items: [...AppState.selectedCart],
        status: 'P',
        winningPts: 0
    };
    AppState.ticketHistory.unshift(ticketRecord);

    if (AppState.printEnabled) {
        executeSilentThermalPrint(ticketRecord);
    }

    clearAllSelections();
}

function executeSilentThermalPrint(ticket) {
    const iframe = document.getElementById('silent-print-frame');
    if (!iframe) return;

    let itemsHtml = ticket.items.map(i => `<div>${i.digit} (${i.word}) x ${i.amount} PTS</div>`).join('');

    const printContent = `
        <html>
        <head>
            <style>
                body { font-family: monospace; width: 250px; padding: 10px; font-size: 12px; }
                .center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="center"><strong>A2Z BOMBAY</strong></div>
            <div class="center">Ticket ID: ${ticket.id}</div>
            <div>Time: ${ticket.time}</div>
            <hr/>
            ${itemsHtml}
            <hr/>
            <div><strong>Total: ${ticket.points} PTS</strong></div>
            <div class="center" style="margin-top: 10px; font-size: 10px;">Announcement Only - Ticket Not For Sale</div>
        </body>
        </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
}

// ==========================================
// MODULE 6: DRAW TIMER & RECENT RESULTS BOARD
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

    if (totalSecondsRemaining === 15 && !AppState.timerState.warnedLastChance) {
        AppState.timerState.warnedLastChance = true;
        playVoiceAlert('LAST_CHANCE');
    }

    const isLockPeriod = totalSecondsRemaining <= AppState.drawSettings.lockSecondsBefore;

    if (isLockPeriod && !AppState.timerState.isLocked) {
        setLockState(true);
        playVoiceAlert('GAME_LOCKED');
    } else if (!isLockPeriod && AppState.timerState.isLocked) {
        setLockState(false);
        AppState.timerState.warnedLastChance = false;
        onNewDrawStart();
    }

    updateTimerUI(now, msRemaining, totalSecondsRemaining);
}

function setLockState(locked) {
    AppState.timerState.isLocked = locked;
    const lockBanner = document.getElementById('game-lock-banner');
    if (lockBanner) lockBanner.classList.toggle('hidden', !locked);

    renderSingleBoard();
    renderTripleBoard();
}

function onNewDrawStart() {
    const randomTriple = TripleData[Math.floor(Math.random() * TripleData.length)];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    AppState.currentResult = {
        digit: randomTriple.digit,
        word: randomTriple.word,
        time: timeStr
    };

    AppState.recentResults.unshift({ ...AppState.currentResult });
    if (AppState.recentResults.length > 10) AppState.recentResults.pop();

    evaluateTicketWinners(AppState.currentResult);

    updateLiveResultDisplay();
    renderRecentResults();
}

function renderRecentResults() {
    const container = document.getElementById('recent-results-stripe');
    if (!container) return;

    container.innerHTML = '';
    AppState.recentResults.forEach(res => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerText = `${res.time} | ${res.digit} ${res.word}`;
        container.appendChild(item);
    });
}

function evaluateTicketWinners(result) {
    let totalWonThisDraw = 0;

    AppState.ticketHistory.forEach(ticket => {
        if (ticket.status === 'P') {
            let winTotal = 0;
            ticket.items.forEach(item => {
                if (item.digit === result.digit || item.word === result.word) {
                    winTotal += item.amount * item.winningRatio;
                }
            });

            if (winTotal > 0) {
                ticket.status = 'Y';
                ticket.winningPts = winTotal;
                totalWonThisDraw += winTotal;
            } else {
                ticket.status = 'N';
            }
        }
    });

    if (totalWonThisDraw > 0) {
        AppState.playPoints += totalWonThisDraw;
        const playPtsEl = document.getElementById('play-points');
        if (playPtsEl) {
            playPtsEl.innerText = AppState.playPoints.toLocaleString();
        }
    }
}

function checkTicketBarcode() {
    const input = document.getElementById('barcode-check-input');
    if (!input || !input.value.trim()) return;

    const barcode = input.value.trim();
    const ticket = AppState.ticketHistory.find(t => t.id === barcode);

    if (!ticket) {
        alert("TICKET NOT FOUND!");
        return;
    }

    if (ticket.status === 'Y') {
        alert(`WINNING TICKET!\nWon: ${ticket.winningPts.toFixed(0)} PTS`);
    } else if (ticket.status === 'N') {
        alert(`NOT A WINNING TICKET`);
    } else {
        alert(`TICKET PENDING FOR DRAW`);
    }
}

function renderTicketHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    AppState.ticketHistory.forEach(ticket => {
        const tr = document.createElement('tr');
        
        let statusBadge = '<span class="status-pending">P (Pending)</span>';
        if (ticket.status === 'Y') statusBadge = `<span class="status-won">Y (Won ${ticket.winningPts.toFixed(0)} PTS)</span>`;
        if (ticket.status === 'N') statusBadge = '<span class="status-lost">N (Lost)</span>';

        tr.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.points} PTS</td>
            <td>${ticket.time}</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateTimerUI(nowDate, msRemaining, totalSecs) {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const drawTimeEl = document.getElementById('draw-time-val');
    if (drawTimeEl) drawTimeEl.innerText = timeFormatted;
}
