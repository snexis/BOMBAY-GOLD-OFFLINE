// Global State Storage (Modular Lock)
const AppState = {
    currentUser: null,
    userType: 'demo',
    playPoints: 5000,
    winPoints: 1200,
    currentMode: 'BOTH', // BOTH, WORD, DIGIT
    currentResult: {
        digit: '100',
        word: 'AXZ',
        singleDigit: '1',
        singleWord: 'A'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateDateDisplay();
    setupEventListeners();
}

function updateDateDisplay() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('current-date-display').innerText = dateStr;
}

function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const userType = document.getElementById('user-type').value;

        AppState.currentUser = username;
        AppState.userType = userType;

        document.getElementById('display-user').innerText = `User: ${username}`;
        document.getElementById('active-mode-label').innerText = userType === 'admin' ? 'ADMIN CONTROL PANEL' : 'DEMO PLAYER MODE';

        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-modal').classList.remove('hidden');
    });
}
// ==========================================
// MODULE 2 START: SINGLE BOARD & MODE ENGINE
// ==========================================

// Single Master Data Definition (Digit 1-0 with Words A-J)
const SingleData = [
    { digit: '1', word: 'A' },
    { digit: '2', word: 'B' },
    { digit: '3', word: 'C' },
    { digit: '4', word: 'D' },
    { digit: '5', word: 'E' },
    { digit: '6', word: 'F' },
    { digit: '7', word: 'G' },
    { digit: '8', word: 'H' },
    { digit: '9', word: 'I' },
    { digit: '0', word: 'J' }
];

// Extend initApp to load Module 2
const oldInitAppModule2 = initApp;
initApp = function() {
    oldInitAppModule2();
    renderSingleBoard();
};

// Render Single Board Grid
function renderSingleBoard() {
    const gridContainer = document.getElementById('single-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    SingleData.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'single-cell';
        cell.onclick = () => onSingleCellClick(item);

        let mainText = '';
        let subText = '';

        if (AppState.currentMode === 'BOTH') {
            mainText = item.digit;
            subText = item.word;
        } else if (AppState.currentMode === 'WORD') {
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

// Switch View Modes (BOTH / WORD / DIGIT)
function switchViewMode(mode) {
    AppState.currentMode = mode;

    // Update Button Classes
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    if (mode === 'BOTH') document.getElementById('btn-mode-both').classList.add('active');
    if (mode === 'WORD') document.getElementById('btn-mode-word').classList.add('active');
    if (mode === 'DIGIT') document.getElementById('btn-mode-digit').classList.add('active');

    // Re-render Single Board & Top Live Result
    renderSingleBoard();
    updateLiveResultDisplay();
}

// Dynamically sync Top Header Result based on active Mode
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

function onSingleCellClick(item) {
    console.log("Single Item Clicked:", item);
}

// MODULE 2 END

// ==========================================
// MODULE 3 START: 220 MATRIX DATA & RANGE ENGINE
// ==========================================

// AZ-2200-X Master 220 Patti Matrix Data Structure (Image 3 Mapping)
const TripleData = [
    // Column 1
    { id: 1, col: 1, digit: '100', word: 'AXZ' }, { id: 2, col: 1, digit: '678', word: 'BKP' },
    { id: 3, col: 1, digit: '777', word: 'LMO' }, { id: 4, col: 1, digit: '560', word: 'RST' },
    { id: 5, col: 1, digit: '470', word: 'TUV' }, { id: 6, col: 1, digit: '380', word: 'WXY' },
    { id: 7, col: 1, digit: '290', word: 'NOP' }, { id: 8, col: 1, digit: '119', word: 'ABC' },
    { id: 9, col: 1, digit: '137', word: 'EFG' }, { id: 10, col: 1, digit: '146', word: 'KLM' },
    { id: 11, col: 1, digit: '669', word: 'QRS' }, { id: 12, col: 1, digit: '579', word: 'UVW' },
    { id: 13, col: 1, digit: '399', word: 'MNO' }, { id: 14, col: 1, digit: '588', word: 'DEF' },
    { id: 15, col: 1, digit: '489', word: 'GHI' }, { id: 16, col: 1, digit: '245', word: 'MNO' },
    { id: 17, col: 1, digit: '155', word: 'CDE' }, { id: 18, col: 1, digit: '227', word: 'PQR' },
    { id: 19, col: 1, digit: '344', word: 'STU' }, { id: 20, col: 1, digit: '335', word: 'ZAB' },
    { id: 21, col: 1, digit: '128', word: 'ZAB' }, { id: 22, col: 1, digit: '156', word: 'YAD' },

    // Column 2
    { id: 23, col: 2, digit: '200', word: 'BCA' }, { id: 24, col: 2, digit: '345', word: 'CAB' },
    { id: 25, col: 2, digit: '444', word: 'DAB' }, { id: 26, col: 2, digit: '570', word: 'DAC' },
    { id: 27, col: 2, digit: '480', word: 'EAC' }, { id: 28, col: 2, digit: '390', word: 'FAD' },
    { id: 29, col: 2, digit: '129', word: 'HAD' }, { id: 30, col: 2, digit: '237', word: 'JAD' },
    { id: 31, col: 2, digit: '336', word: 'KAD' }, { id: 32, col: 2, digit: '246', word: 'LAD' },
    { id: 33, col: 2, digit: '855', word: 'NAD' }, { id: 34, col: 2, digit: '147', word: 'PAD' },
    { id: 35, col: 2, digit: '228', word: 'SAD' }, { id: 36, col: 2, digit: '688', word: 'TAD' },
    { id: 37, col: 2, digit: '738', word: 'WAD' }, { id: 38, col: 2, digit: '156', word: 'YAD' },
    { id: 39, col: 2, digit: '110', word: 'ZAD' }, { id: 40, col: 2, digit: '569', word: 'BAG' },
    { id: 41, col: 2, digit: '238', word: 'CAG' }, { id: 42, col: 2, digit: '247', word: 'DAG' },
    { id: 43, col: 2, digit: '256', word: 'EAG' }, { id: 44, col: 2, digit: '348', word: 'FAG' }
];

// Generate Full 220 Matrix Array Dynamically (for demonstration & complete rendering)
for (let i = 45; i <= 220; i++) {
    const colNum = ((i - 1) % 10) + 1;
    TripleData.push({
        id: i,
        col: colNum,
        digit: `${(i * 3) % 900 + 100}`,
        word: String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 1) % 26)) + String.fromCharCode(65 + ((i + 2) % 26))
    });
}

AppState.activeRange = 'ALL';

// Extend initApp to load Module 3
const oldInitAppModule3 = initApp;
initApp = function() {
    oldInitAppModule3();
    renderTripleBoard();
};

// Render 220 Triple Board Grid
function renderTripleBoard() {
    const gridContainer = document.getElementById('triple-board-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    const filteredItems = getFilteredTripleData();

    filteredItems.forEach(item => {
        const cell = document.createElement('div');
        cell.className = 'triple-cell';
        cell.id = `triple-cell-${item.id}`;
        cell.onclick = () => onTripleCellClick(item);

        let mainText = '';
        let subText = '';

        if (AppState.currentMode === 'BOTH') {
            mainText = item.digit;
            subText = item.word;
        } else if (AppState.currentMode === 'WORD') {
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

// Get Data Based on Selected 55-Block Range
function getFilteredTripleData() {
    if (AppState.activeRange === 'A') return TripleData.slice(0, 55);
    if (AppState.activeRange === 'B') return TripleData.slice(55, 110);
    if (AppState.activeRange === 'C') return TripleData.slice(110, 165);
    if (AppState.activeRange === 'D') return TripleData.slice(165, 220);
    return TripleData; // ALL (220)
}

// Filter Board By Range (ALL, A, B, C, D)
function filterRange(rangeKey) {
    AppState.activeRange = rangeKey;

    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    if (rangeKey === 'ALL') document.getElementById('btn-range-all').classList.add('active');
    if (rangeKey === 'A') document.getElementById('btn-range-a').classList.add('active');
    if (rangeKey === 'B') document.getElementById('btn-range-b').classList.add('active');
    if (rangeKey === 'C') document.getElementById('btn-range-c').classList.add('active');
    if (rangeKey === 'D') document.getElementById('btn-range-d').classList.add('active');

    renderTripleBoard();
}

// Extend switchViewMode to also re-render Triple Board
const oldSwitchViewMode = switchViewMode;
switchViewMode = function(mode) {
    oldSwitchViewMode(mode);
    renderTripleBoard();
};

function onTripleCellClick(item) {
    console.log("Triple Patti Clicked:", item);
}

// MODULE 3 END
