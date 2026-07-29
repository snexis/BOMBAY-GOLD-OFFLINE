/**
 * A2Z BOMBAY - Main Application Logic
 * Production-Ready Implementation matching exact UI/UX specifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MANAGEMENT & DEMO DATA
    const state = {
        user: {
            username: "Raj",
            playPoints: 5000.00,
            winningBalance: 1200.00,
            rewardPoints: 50.00
        },
        currentDraw: {
            id: "245678",
            drawIdDisplay: "Draw #1000",
            time: "01:25:30 PM",
            nextDrawTime: "02:00 PM",
            timeLeft: 120 // seconds remaining for timer demo
        },
        selectedRange: 'A',
        selectedBetType: 'single',
        selectedChip: 10,
        customChip: 0,
        selectedNumbers: [], // Cart items
        todaysResults: [
            { draw: "#2369", time: "01:20 PM", num: "458", statusClass: "" },
            { draw: "#2368", time: "01:10 PM", num: "279", statusClass: "" },
            { draw: "#2367", time: "01:00 PM", num: "188", statusClass: "highlight-red" },
            { draw: "#2366", time: "12:50 PM", num: "377", statusClass: "" },
            { draw: "#2365", time: "12:40 PM", num: "669", statusClass: "" },
            { draw: "#2364", time: "12:30 PM", num: "145", statusClass: "highlight-pink" },
            { draw: "#2363", time: "12:20 PM", num: "568", statusClass: "" },
            { draw: "#2362", time: "12:10 PM", num: "334", statusClass: "" },
            { draw: "#2361", time: "12:00 PM", num: "229", statusClass: "" },
            { draw: "#2360", time: "11:50 AM", num: "678", statusClass: "" }
        ]
    };

    // 2. INITIALIZE UI ELEMENTS & BINDINGS
    function initApp() {
        updateUserInfo();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initLiveTimer();
        renderTodaysResults();
        renderTripleBoardGrid();
        renderSingleBoard();
        setupEventListeners();
        
        // Ensure Login modal is hidden for direct testing view matching the picture
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.classList.add('hidden');
    }

    // 3. USER INFO & BALANCES
    function updateUserInfo() {
        const userIdEl = document.getElementById('display-user-id');
        const playPtsEl = document.getElementById('play-points');
        const winBalEl = document.getElementById('winning-balance');
        const rewardBalEl = document.getElementById('reward-balance');

        if (userIdEl) userIdEl.textContent = state.user.username;
        if (playPtsEl) playPtsEl.textContent = state.user.playPoints.toFixed(2);
        if (winBalEl) winBalEl.textContent = state.user.winningBalance.toFixed(2);
        if (rewardBalEl) rewardBalEl.textContent = state.user.rewardPoints.toFixed(2);
    }

    // 4. LIVE DATE & TIME WIDGET
    function updateDateTime() {
        const dtEl = document.getElementById('live-date-time');
        if (dtEl) {
            const now = new Date();
            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            dtEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    // 5. LIVE TIMER COUNTDOWN
    function initLiveTimer() {
        const timerEl = document.getElementById('draw-timer');
        if (!timerEl) return;

        setInterval(() => {
            if (state.currentDraw.timeLeft > 0) {
                state.currentDraw.timeLeft--;
                const mins = String(Math.floor(state.currentDraw.timeLeft / 60)).padStart(2, '0');
                const secs = String(state.currentDraw.timeLeft % 60).padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;
            } else {
                state.currentDraw.timeLeft = 120; // reset loop
            }
        }, 1000);
    }

    // 6. RENDER TODAY'S RESULTS SLIDER
    function renderTodaysResults() {
        const grid = document.getElementById('results-12-grid');
        if (!grid) return;
        grid.innerHTML = '';

        state.todaysResults.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-slot-card';
            card.innerHTML = `
                <span class="res-draw">${item.draw}</span>
                <span class="res-time">${item.time}</span>
                <span class="res-num ${item.statusClass}">${item.num}</span>
            `;
            grid.appendChild(card);
        });
    }

    // 7. RENDER SINGLE BOARD (1 - 0)
    function renderSingleBoard() {
        const row = document.getElementById('single-board-row');
        if (!row) return;
        // HTML already contains static items or we can ensure event binding
        const cards = row.querySelectorAll('.single-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const val = card.getAttribute('data-val');
                toggleSelection(`Single-${val}`, val);
                card.classList.toggle('selected');
            });
        });
    }

    // 8. RENDER TRIPLE BOARD MATRIX (22x10 Panna simulation)
    function renderTripleBoardGrid() {
        const grid = document.getElementById('triple-board-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Generate sample interactive panna grid rows matching the visual layout
        const sampleData = [
            ["100", "200", "300", "400", "500", "600", "700", "800", "900", "000"],
            ["678", "345", "120", "789", "456", "123", "890", "567", "234", "197"],
            ["777", "444", "111", "888", "555", "222", "999", "666", "333", "280"],
            ["560", "570", "580", "130", "230", "330", "340", "350", "360", "370"],
            ["470", "480", "490", "680", "690", "240", "250", "260", "270", "460"],
            ["380", "390", "670", "248", "258", "268", "278", "288", "450", "550"],
            ["290", "660", "238", "149", "159", "169", "179", "189", "199", "235"],
            ["119", "129", "139", "347", "357", "367", "377", "116", "117", "118"],
            ["137", "237", "337", "446", "799", "448", "467", "233", "469", "578"],
            ["236", "336", "157", "158", "267", "899", "115", "459", "126", "145"]
        ];

        sampleData.forEach(row => {
            row.forEach(val => {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.textContent = val;
                cell.addEventListener('click', () => {
                    toggleSelection(`Panna-${val}`, val);
                    cell.classList.toggle('selected');
                });
                grid.appendChild(cell);
            });
        });
    }

    // 9. CART & SELECTION LOGIC
    function toggleSelection(name, value) {
        const existingIndex = state.selectedNumbers.findIndex(item => item.name === name);
        if (existingIndex > -1) {
            state.selectedNumbers.splice(existingIndex, 1);
        } else {
            const amount = state.customChip > 0 ? state.customChip : state.selectedChip;
            state.selectedNumbers.push({ name, value, amount });
        }
        updateCartUI();
    }

    function updateCartUI() {
        const cartList = document.getElementById('cart-items-list');
        const totalPtsTag = document.getElementById('total-cart-pts');
        const itemsTag = document.querySelector('.total-pts-tag');
        
        if (!cartList) return;

        cartList.innerHTML = '';
        let totalPts = 0;

        if (state.selectedNumbers.length === 0) {
            cartList.innerHTML = `<div class="empty-msg">No numbers selected</div>`;
        } else {
            state.selectedNumbers.forEach(item => {
                totalPts += item.amount;
                const div = document.createElement('div');
                div.className = 'cart-item-row';
                div.style.cssText = "display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;";
                div.innerHTML = `<span>${item.name}</span><strong>${item.amount} Pts</strong>`;
                cartList.appendChild(div);
            });
        }

        if (totalPtsTag) totalPtsTag.textContent = totalPts;
        const selectedCountTag = document.querySelector('.bet-panel-block.cart-block .cart-header span:first-child');
        if (selectedCountTag) {
            selectedCountTag.textContent = `SELECTED ITEMS ( ${state.selectedNumbers.length} )`;
        }
    }

    // 10. EVENT LISTENERS FOR CONTROLS & MODALS
    function setupEventListeners() {
        // Range Buttons
        document.querySelectorAll('.btn-range').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-range').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedRange = btn.getAttribute('data-range');
            });
        });

        // Bet Type Buttons
        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedBetType = btn.getAttribute('data-type');

                // Toggle sections if needed
                const juriSec = document.getElementById('juri-board-section');
                const tripleSec = document.getElementById('triple-board-section');
                if (state.selectedBetType === 'juri') {
                    if(juriSec) juriSec.classList.remove('hidden');
                    if(tripleSec) tripleSec.classList.add('hidden');
                } else {
                    if(juriSec) juriSec.classList.add('hidden');
                    if(tripleSec) tripleSec.classList.remove('hidden');
                }
            });
        });

        // Chip Buttons
        document.querySelectorAll('.btn-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedChip = parseInt(btn.getAttribute('data-val'), 10);
                state.customChip = 0;
            });
        });

        // Custom Chip Input
        const customInput = document.getElementById('custom-chip-val');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                    document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
                    state.customChip = val;
                }
            });
        }

        // Clear Cart
        const clearBtn = document.getElementById('btn-clear-cart');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.selectedNumbers = [];
                document.querySelectorAll('.matrix-cell.selected, .single-card.selected').forEach(el => el.classList.remove('selected'));
                updateCartUI();
            });
        }

        // Reset Selection
        const resetBtn = document.getElementById('btn-reset-selection');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                clearBtn.click();
            });
        }

        // Submit Bets
        const submitBtn = document.getElementById('btn-submit-bets');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (state.selectedNumbers.length === 0) {
                    alert("Please select at least one number to place a bet.");
                    return;
                }
                let totalCost = state.selectedNumbers.reduce((sum, item) => sum + item.amount, 0);
                if (state.user.playPoints >= totalCost) {
                    state.user.playPoints -= totalCost;
                    updateUserInfo();
                    alert(`Successfully submitted ${state.selectedNumbers.length} bets totaling ${totalCost} Points!`);
                    clearBtn.click();
                } else {
                    alert("Insufficient Play Points! Please recharge or claim winnings.");
                }
            });
        }

        // Navigation Modals
        setupModal("nav-ticket-history", "ticket-history-modal", "close-ticket-history-modal");
        setupModal("nav-result-history", "result-history-modal", "close-result-history-modal");
        setupModal("btn-open-result-history-card", "result-history-modal", "close-result-history-modal");
        setupModal("nav-rules", "rules-modal", "close-rules-modal");
        setupModal("nav-settings", "settings-modal", "close-settings-modal");

        // Logout
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.remove('hidden');
            });
        }

        // Login Form submission simulation
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.add('hidden');
                updateUserInfo();
            });
        }
    }

    function setupModal(triggerId, modalId, closeId) {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const close = document.getElementById(closeId);

        if (trigger && modal) {
            trigger.addEventListener('click', () => modal.classList.remove('hidden'));
        }
        if (close && modal) {
            close.addEventListener('click', () => modal.classList.add('hidden'));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    }

    // Initialize application execution
    initApp();
});
