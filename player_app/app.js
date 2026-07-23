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
