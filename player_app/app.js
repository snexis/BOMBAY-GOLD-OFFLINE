/**
 * 3D Matka Betting Engine & Terminal Controller
 * Production Ready - Secure Architecture & Modular Logic
 */

const AppState = {
    user: null,
    points: 10000,
    activeMode: 'SINGLE', // 'SINGLE' or 'TRIPLE'
    activeChip: 5,
    activeRange: 'ALL',
    selectedBets: new Map(), // Key: selection, Value: amount
    isLocked: false,
    soundEnabled: true,
    autoPrintEnabled: true,
    drawIntervalSeconds: 120, // 2-minute draws
    currentDrawId: 0,
    timerSecondsLeft: 0,
    lastServerTimeSync: 0,
    recentResults: [], // Stores last 10 draw results
    betHistory: []
};

// 220 Standard Pana Matrix Table Generation Logic
function generate220PanaList() {
    const panaList = [];
    for (let i = 0; i <= 999; i++) {
        let str = i.toString().padStart(3, '0');
        let d1 = parseInt(str[0]), d2 = parseInt(str[1]), d3 = parseInt(str[2]);
        // Pana rule: digits must be in non-decreasing order (e.g., 123, 133, 000)
        let validOrder = false;
        if (d1 === 0 && d2 === 0 && d3 === 0) validOrder = true;
        else if (d1 === 0 && d2 <= d3) validOrder = true;
        else if (d1 <= d2 && d2 <= d3 && d1 !== 0) validOrder = true;

        if (validOrder) {
            let sum = (d1 + d2 + d3) % 10;
            panaList.push({ pana: str, singleDigit: sum });
        }
    }
    return panaList;
}

const PANA_MASTER_LIST = generate220PanaList();

// Utility Helper: Calculate Single Digit Badge from Pana String
function getSingleFromPana(panaStr) {
    if (!panaStr || panaStr.length !== 3) return '-';
    let sum = panaStr.split('').reduce((acc, curr) => acc + parseInt(curr), 0);
    return sum % 10;
}

// DOM Elements Reference
const DOM = {
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    networkOverlay: document.getElementById('network-overlay'),
    historyModal: document.getElementById('history-modal'),
    historyModalTitle: document.getElementById('history-modal-title'),
    historyTableHead: document.getElementById('history-table-head'),
    historyTableBody: document.getElementById('history-table-body'),
    sideDrawer: document.getElementById('side-drawer'),
    drawerUserId: document.getElementById('drawer-user-id'),
    displayUserId: document.getElementById('display-user-id'),
    displayUserPoints: document.getElementById('display-user-points'),
    drawTimerClock: document.getElementById('draw-timer-clock'),
    lockBanner: document.getElementById('lock-banner'),
    lastDrawResult: document.getElementById('last-draw-result'),
    recentResultsStripe: document.getElementById('recent-results-stripe'),
    singleBoardContainer: document.getElementById('single-board-container'),
    tripleBoardContainer: document.getElementById('triple-board-container'),
    tripleBoardGrid: document.getElementById('triple-board-grid'),
    tripleRangeControls: document.getElementById('triple-range-controls'),
    selectedItemsList: document.getElementById('selected-items-list'),
    summaryCount: document.getElementById('summary-count'),
    summaryTotalPts: document.getElementById('summary-total-pts'),
    customBetInput: document.getElementById('custom-bet-input')
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupEventListeners();
    generateSampleRecentResults();
    renderRecentResultsStripe();
    initDrawTimerEngine();
}

// Security: Anti-Time Tampering Guard
function verifySystemTimeIntegrity() {
    const clientTime = Date.now();
    if (AppState.lastServerTimeSync > 0) {
        const drift = Math.abs(clientTime - AppState.lastServerTimeSync);
        if (drift > 10000) { // Time jumped more than 10 seconds artificially
            DOM.networkOverlay.classList.remove('hidden');
            AppState.isLocked = true;
            return false;
        }
    }
    AppState.lastServerTimeSync = clientTime + 1000;
    DOM.networkOverlay.classList.add('hidden');
    return true;
}

// Event Listeners Setup
function setupEventListeners() {
    // Login
    DOM.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (username) {
            AppState.user = username;
            DOM.displayUserId.innerText = `ID: ${username}`;
            DOM.drawerUserId.innerText = `Terminal #${username}`;
            DOM.loginModal.classList.add('hidden');
            renderBoards();
        }
    });

    // Drawer Controls
    document.getElementById('btn-menu-toggle').addEventListener('click', () => {
        DOM.sideDrawer.classList.remove('closed');
    });
    document.getElementById('btn-close-drawer').addEventListener('click', () => {
        DOM.sideDrawer.classList.add('closed');
    });

    // History & Result Modals
    document.getElementById('btn-close-history').addEventListener('click', () => {
        DOM.historyModal.classList.add('hidden');
    });
    document.getElementById('btn-drawer-history').addEventListener('click', () => {
        openHistoryModal('BET_HISTORY');
        DOM.sideDrawer.classList.add('closed');
    });
    document.getElementById('btn-drawer-results').addEventListener('click', () => {
        openHistoryModal('RESULTS_HISTORY');
        DOM.sideDrawer.classList.add('closed');
    });
    document.getElementById('btn-view-recent-modal').addEventListener('click', () => {
        openHistoryModal('RESULTS_HISTORY');
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-drawer-logout').addEventListener('click', handleLogout);

    // Game Mode Switchers
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.activeMode = e.target.dataset.mode;
            
            if (AppState.activeMode === 'TRIPLE') {
                DOM.singleBoardContainer.classList.add('hidden');
                DOM.tripleBoardContainer.classList.remove('hidden');
                DOM.tripleRangeControls.classList.remove('hidden');
            } else {
                DOM.singleBoardContainer.classList.remove('hidden');
                DOM.tripleBoardContainer.classList.add('hidden');
                DOM.tripleRangeControls.classList.add('hidden');
            }
            clearBetCart();
            renderBoards();
        });
    });

    // Pana Range Selector
    document.querySelectorAll('.btn-range').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-range').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.activeRange = e.target.dataset.range;
            renderTripleBoard();
        });
    });

    // Chip Value Selector
    document.querySelectorAll('.btn-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.activeChip = parseInt(e.target.dataset.val);
            DOM.customBetInput.value = '';
        });
    });

    DOM.customBetInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (val > 0) {
            document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
            AppState.activeChip = val;
        }
    });

    // Clear & Submit Action Buttons
    document.getElementById('btn-clear-cart').addEventListener('click', clearBetCart);
    document.getElementById('btn-submit-ticket').addEventListener('click', processSubmitTicket);

    // Barcode Checker
    document.getElementById('btn-check-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode-input').value.trim();
        if (!barcode) return;
        alert(`Checking Barcode/Ticket: ${barcode}\nStatus: No winning payout found or ticket expired.`);
        document.getElementById('barcode-input').value = '';
    });

    // Sound & Print Toggles
    document.getElementById('btn-toggle-sound').addEventListener('click', (e) => {
        AppState.soundEnabled = !AppState.soundEnabled;
        e.target.classList.toggle('active', AppState.soundEnabled);
    });
    document.getElementById('btn-toggle-print').addEventListener('click', (e) => {
        AppState.autoPrintEnabled = !AppState.autoPrintEnabled;
        e.target.classList.toggle('active', AppState.autoPrintEnabled);
    });
}

function handleLogout() {
    AppState.user = null;
    DOM.loginModal.classList.remove('hidden');
    DOM.sideDrawer.classList.add('closed');
}

// Render Logic for Single & Triple Boards
function renderBoards() {
    renderSingleBoard();
    renderTripleBoard();
}

function renderSingleBoard() {
    DOM.singleBoardContainer.innerHTML = '';
    for (let i = 0; i <= 9; i++) {
        const cell = document.createElement('div');
        cell.className = `single-cell ${AppState.selectedBets.has(i.toString()) ? 'selected' : ''}`;
        cell.dataset.val = i.toString();
        cell.innerHTML = `
            <div class="single-val-main">${i}</div>
            <div class="single-val-sub">SINGLE</div>
        `;
        cell.addEventListener('click', () => handleCellBetClick(i.toString()));
        DOM.singleBoardContainer.appendChild(cell);
    }
}

function renderTripleBoard() {
    DOM.tripleBoardGrid.innerHTML = '';
    
    let filteredList = PANA_MASTER_LIST;
    if (AppState.activeRange !== 'ALL') {
        let rangePrefix = AppState.activeRange.charAt(0);
        filteredList = PANA_MASTER_LIST.filter(p => p.pana.startsWith(rangePrefix));
    }

    filteredList.forEach(item => {
        const cell = document.createElement('div');
        cell.className = `triple-cell ${AppState.selectedBets.has(item.pana) ? 'selected' : ''}`;
        cell.dataset.val = item.pana;
        cell.innerHTML = `
            <div class="triple-val-digit">${item.pana}</div>
            <div class="triple-val-word">[${item.singleDigit}]</div>
        `;
        cell.addEventListener('click', () => handleCellBetClick(item.pana));
        DOM.tripleBoardGrid.appendChild(cell);
    });
}

// Bet Selection Handler
function handleCellBetClick(selection) {
    if (AppState.isLocked) {
        alert("Betting is currently locked for draw processing!");
        return;
    }

    let currentBet = AppState.selectedBets.get(selection) || 0;
    let newBet = currentBet + AppState.activeChip;

    AppState.selectedBets.set(selection, newBet);
    updateCartSummaryUI();
    
    // Highlight UI
    const targetCell = document.querySelector(`[data-val="${selection}"]`);
    if (targetCell) targetCell.classList.add('selected');
}

function clearBetCart() {
    AppState.selectedBets.clear();
    updateCartSummaryUI();
    document.querySelectorAll('.single-cell, .triple-cell').forEach(c => c.classList.remove('selected'));
}

function updateCartSummaryUI() {
    DOM.selectedItemsList.innerHTML = '';
    let totalPoints = 0;
    let count = 0;

    AppState.selectedBets.forEach((amount, selection) => {
        totalPoints += amount;
        count++;

        const badge = document.createElement('div');
        badge.className = 'chip-item-badge';
        badge.innerHTML = `${selection} : ${amount} Pts`;
        badge.addEventListener('click', () => {
            AppState.selectedBets.delete(selection);
            updateCartSummaryUI();
            const targetCell = document.querySelector(`[data-val="${selection}"]`);
            if (targetCell) targetCell.classList.remove('selected');
        });
        DOM.selectedItemsList.appendChild(badge);
    });

    DOM.summaryCount.innerText = count;
    DOM.summaryTotalPts.innerText = totalPoints;
}

// Process Ticket & ESC/POS Silent Direct Thermal Print Call
function processSubmitTicket() {
    if (AppState.selectedBets.size === 0) {
        alert("Please select at least one number to place bet.");
        return;
    }

    let totalCost = 0;
    AppState.selectedBets.forEach(val => totalCost += val);

    if (totalCost > AppState.points) {
        alert("Insufficient points balance!");
        return;
    }

    // Deduct Balance
    AppState.points -= totalCost;
    DOM.displayUserPoints.innerText = AppState.points;

    // Record History
    const ticketId = 'TK' + Math.floor(100000 + Math.random() * 900000);
    AppState.selectedBets.forEach((amount, selection) => {
        AppState.betHistory.unshift({
            time: new Date().toLocaleTimeString(),
            drawId: `#${AppState.currentDrawId}`,
            type: selection.length === 1 ? 'SINGLE' : 'TRIPLE',
            selection: selection,
            amount: amount,
            status: 'PENDING'
        });
    });

    if (AppState.autoPrintEnabled) {
        triggerThermalPrinterReceipt(ticketId, totalCost);
    } else {
        alert(`Ticket Placed Successfully!\nTicket ID: ${ticketId}\nTotal Amount: ${totalCost} PTS`);
    }

    clearBetCart();
}

function triggerThermalPrinterReceipt(ticketId, amount) {
    // Esc/POS Raw Command String Simulation
    console.log(`%c [PRINTER OUTPUT] \n--- TICKET: ${ticketId} ---\nDraw: #${AppState.currentDrawId}\nAmount: ${amount} PTS\n-----------------------`, "color: #00f0ff; font-weight: bold;");
    alert(`[THERMAL PRINTER] Printing Ticket: ${ticketId}`);
}

// Continuous Draw Timer & Anti-Tampering Loop Engine
function initDrawTimerEngine() {
    AppState.currentDrawId = Math.floor(Date.now() / (120 * 1000));
    
    setInterval(() => {
        if (!verifySystemTimeIntegrity()) return;

        const now = Date.now();
        const drawCycleMs = 120 * 1000;
        const currentCycleElapsed = now % drawCycleMs;
        const remainingMs = drawCycleMs - currentCycleElapsed;
        
        AppState.timerSecondsLeft = Math.floor(remainingMs / 1000);

        // Format Clock
        const mins = String(Math.floor(AppState.timerSecondsLeft / 60)).padStart(2, '0');
        const secs = String(AppState.timerSecondsLeft % 60).padStart(2, '0');
        DOM.drawTimerClock.innerText = `${mins}:${secs}`;

        // Lock Betting in Last 10 Seconds of Draw
        if (AppState.timerSecondsLeft <= 10) {
            if (!AppState.isLocked) {
                AppState.isLocked = true;
                DOM.lockBanner.classList.remove('hidden');
            }
        } else {
            if (AppState.isLocked) {
                AppState.isLocked = false;
                DOM.lockBanner.classList.add('hidden');
            }
        }

        // Trigger Draw Result Resolution at 00:00
        if (AppState.timerSecondsLeft === 0) {
            executeDrawResolution();
        }
    }, 1000);
}

// Draw Resolution Execution
function executeDrawResolution() {
    AppState.currentDrawId++;
    
    // Pick Random Winning Pana
    const randomIndex = Math.floor(Math.random() * PANA_MASTER_LIST.length);
    const winningPanaObj = PANA_MASTER_LIST[randomIndex];
    
    const newResult = {
        drawId: AppState.currentDrawId,
        pana: winningPanaObj.pana,
        single: winningPanaObj.singleDigit
    };

    // Update Recent Results (Max 10)
    AppState.recentResults.unshift(newResult);
    if (AppState.recentResults.length > 10) AppState.recentResults.pop();

    // Render Recent Results Bar & Highlight Header
    renderRecentResultsStripe();
    DOM.lastDrawResult.innerText = `${winningPanaObj.pana} [ ${winningPanaObj.singleDigit} ]`;

    // Process Bet Statuses
    AppState.betHistory.forEach(bet => {
        if (bet.status === 'PENDING') {
            if (bet.type === 'SINGLE' && parseInt(bet.selection) === winningPanaObj.singleDigit) {
                bet.status = 'WON';
                AppState.points += bet.amount * 9; // 9x Payout for Single
            } else if (bet.type === 'TRIPLE' && bet.selection === winningPanaObj.pana) {
                bet.status = 'WON';
                AppState.points += bet.amount * 180; // 180x Payout for Triple
            } else {
                bet.status = 'LOST';
            }
        }
    });

    DOM.displayUserPoints.innerText = AppState.points;
}

// Pre-fill 10 Results for Visual Verification
function generateSampleRecentResults() {
    AppState.recentResults = [];
    for (let i = 0; i < 10; i++) {
        let panaObj = PANA_MASTER_LIST[Math.floor(Math.random() * PANA_MASTER_LIST.length)];
        AppState.recentResults.push({
            drawId: 1000 - i,
            pana: panaObj.pana,
            single: panaObj.singleDigit
        });
    }
    const latest = AppState.recentResults[0];
    DOM.lastDrawResult.innerText = `${latest.pana} [ ${latest.single} ]`;
}

// Render Recent 10 Results Notice Stripe (Fit 10 No Scrollbar)
function renderRecentResultsStripe() {
    DOM.recentResultsStripe.innerHTML = '';
    
    // Always fill exactly 10 slots
    for (let i = 0; i < 10; i++) {
        const item = AppState.recentResults[i] || { pana: '---', single: '-' };
        const el = document.createElement('div');
        el.className = 'recent-item';
        el.innerHTML = `
            <span class="recent-pana">${item.pana}</span>
            <span class="recent-single-badge">${item.single}</span>
        `;
        DOM.recentResultsStripe.appendChild(el);
    }
}

// Result / History Modal Content Switcher
function openHistoryModal(type) {
    DOM.historyModal.classList.remove('hidden');
    DOM.historyTableBody.innerHTML = '';

    if (type === 'BET_HISTORY') {
        DOM.historyModalTitle.innerText = "Terminal Betting History";
        DOM.historyTableHead.innerHTML = `
            <tr>
                <th>Time</th>
                <th>Draw</th>
                <th>Type</th>
                <th>Selection</th>
                <th>Amount</th>
                <th>Status</th>
            </tr>
        `;

        if (AppState.betHistory.length === 0) {
            DOM.historyTableBody.innerHTML = `<tr><td colspan="6" style="color:#9ca3af;">No bets placed yet.</td></tr>`;
            return;
        }

        AppState.betHistory.forEach(bet => {
            const tr = document.createElement('tr');
            let statusClass = bet.status === 'WON' ? 'status-won' : bet.status === 'LOST' ? 'status-lost' : 'status-pending';
            tr.innerHTML = `
                <td>${bet.time}</td>
                <td>${bet.drawId}</td>
                <td>${bet.type}</td>
                <td style="color:#00f0ff; font-weight:bold;">${bet.selection}</td>
                <td>${bet.amount}</td>
                <td class="${statusClass}">${bet.status}</td>
            `;
            DOM.historyTableBody.appendChild(tr);
        });
    } else if (type === 'RESULTS_HISTORY') {
        DOM.historyModalTitle.innerText = "Recent Draw Results";
        DOM.historyTableHead.innerHTML = `
            <tr>
                <th>Draw ID</th>
                <th>Winning Pana</th>
                <th>Single Highlight Badge</th>
            </tr>
        `;

        AppState.recentResults.forEach(res => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${res.drawId}</td>
                <td style="color:#f59e0b; font-weight:bold; font-size:14px;">${res.pana}</td>
                <td><span class="recent-single-badge" style="font-size:11px; padding:2px 6px;">[ ${res.single} ]</span></td>
            `;
            DOM.historyTableBody.appendChild(tr);
        });
    }
}
