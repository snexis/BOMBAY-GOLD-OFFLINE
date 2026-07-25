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
    const dateEl = document.getElementById('current-date-display');
    if (dateEl) dateEl.innerText = dateStr;
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
    if (drawer) drawer.classList.toggle('closed');
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
            const usernameInput = document.getElementById('username');
            const userTypeInput = document.getElementById('user-type');

            const username = usernameInput ? usernameInput.value.trim() : 'DEMO_PLAYER_01';
            const userType = userTypeInput ? userTypeInput.value : 'demo';

            AppState.currentUser = username || 'DEMO_PLAYER_01';
            AppState.userType = userType;

            const userIdTextEl = document.getElementById('user-id-text');
            const drawerUserIdEl = document.getElementById('drawer-user-id');
            if (userIdTextEl) userIdTextEl.innerText = AppState.currentUser;
            if (drawerUserIdEl) drawerUserIdEl.innerText = AppState.currentUser;

            const loginModal = document.getElementById('login-modal');
            const appContainer = document.getElementById('app-container');

            if (loginModal) loginModal.classList.add('hidden');
            if (appContainer) appContainer.classList.remove('hidden');
            
            playVoiceAlert('LOGGED_IN');
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
    "000", "127", "190", "280", "370", "460", "550", "235", "118", "578", "145", "479", "668", "299", "334", "488", "389", "226", "569", "677", "136", "244"
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
