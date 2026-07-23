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
