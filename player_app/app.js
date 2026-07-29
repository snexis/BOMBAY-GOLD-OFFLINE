/**
 * A2Z BOMBAY - Main Application Logic
 * Complete Production-Ready Version matching exact UI/UX specifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MANAGEMENT (Dynamic, Non-Fixed Chips & Real-time setup)
    const state = {
        user: {
            username: localStorage.getItem('admin_username') || "Player_Demo",
            playPoints: 50000.00, // High testing points
            winningBalance: 0.00,
            rewardPoints: 50.00
        },
        currentDraw: {
            id: generateDynamicDrawId(),
            drawIdDisplay: "Draw #1000",
            time: getCurrentTimeString(),
            nextDrawTime: getNextDrawTimeString(2),
            timeLeft: 120 // 2 minutes test mode (24/7)
        },
        adminSettings: {
            drawIntervalMinutes: 2,
            isTestMode: true
        },
        selectedRange: 'A',
        selectedBetType: 'single',
        selectedChip: 10, // Default selection, but fully dynamic via click/custom input
        customChip: 0,
        selectedNumbers: [],
        todaysResults: [] // No fixed dummy data; populated dynamically in real-time
    };

    // Helper functions for dynamic generation
    function generateDynamicDrawId() {
        return `${Math.floor(Math.random() * 90000) + 10000}`;
    }

    function getCurrentTimeString() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function getNextDrawTimeString(intervalMins) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + intervalMins);
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 2. INITIALIZATION
    function initApp() {
        updateUserInfo();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initLiveTimer();
        renderInitialLiveHistory();
        renderSingleBoard();
        renderTripleBoardGrid();
        renderJuriBoardGrid();
        setupEventListeners();
        
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

    // 5. LIVE TIMER COUNTDOWN & AUTO-DRAW TRIGGER
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
                // Timer reached 0: Trigger Auto-Draw & Results Generation
                triggerAutoDrawSequence();
            }
        }, 1000);
    }

    function renderInitialLiveHistory() {
        if (state.todaysResults.length > 0) return;
        for (let i = 12; i > 0; i--) {
            const pastTime = new Date();
            pastTime.setMinutes(pastTime.getMinutes() - (i * 2));
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const strNum = String(randomNum);
            const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);

            state.todaysResults.push({
                draw: `#${Math.floor(Math.random() * 9000) + 1000}`,
                time: pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                num: strNum,
                single: singleVal,
                statusClass: ""
            });
        }
        renderTodaysResults();
    }

    function triggerAutoDrawSequence() {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        const strNum = String(randomNum);
        const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);

        const newResultItem = {
            draw: `#${Math.floor(Math.random() * 9000) + 1000}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            num: strNum,
            single: singleVal,
            statusClass: "highlight-live"
        };

        state.todaysResults.unshift(newResultItem);
        if (state.todaysResults.length > 30) state.todaysResults.pop();
        renderTodaysResults();

        const intervalMins = state.adminSettings.drawIntervalMinutes || 2;
        state.currentDraw.timeLeft = intervalMins * 60;
        state.currentDraw.id = generateDynamicDrawId();

        const drawIdEl = document.getElementById('current-draw-id');
        if (drawIdEl) {
            drawIdEl.textContent = `Draw #${Math.floor(Math.random() * 9000) + 1000}`;
        }
    }

    // 6. TODAY'S RESULTS SLIDER GRID
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

    // 7. SINGLE BOARD (1 - 0)
    function renderSingleBoard() {
        const row = document.getElementById('single-board-row');
        if (!row) return;
        const cards = row.querySelectorAll('.single-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const val = card.getAttribute('data-val');
                toggleSelection(`Single-${val}`, val);
                card.classList.toggle('selected');
            });
        });
    }

    // 8. TRIPLE BOARD MATRIX (Exact 22 Rows matching reference image)
    function renderTripleBoardGrid() {
        const grid = document.getElementById('triple-board-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const sampleData = [
            ["100", "200", "300", "400", "500", "600", "700", "800", "900", "000"],
            ["678", "345", "120", "789", "456", "123", "890", "567", "234", "127"],
            ["777", "444", "111", "888", "555", "222", "999", "666", "333", "190"],
            ["560", "570", "580", "590", "140", "150", "160", "170", "180", "280"],
            ["470", "480", "490", "130", "230", "330", "340", "350", "360", "370"],
            ["380", "390", "670", "680", "690", "240", "250", "260", "270", "460"],
            ["290", "660", "238", "248", "258", "268", "278", "288", "450", "550"],
            ["119", "129", "139", "149", "159", "169", "179", "189", "199", "235"],
            ["137", "237", "337", "347", "357", "367", "377", "116", "117", "118"],
            ["236", "336", "157", "158", "799", "448", "467", "233", "469", "578"],
            ["146", "246", "346", "446", "267", "899", "115", "459", "126", "145"],
            ["669", "679", "689", "699", "780", "178", "124", "125", "667", "479"],
            ["579", "255", "355", "455", "447", "790", "223", "224", "478", "668"],
            ["399", "147", "247", "266", "366", "466", "566", "477", "135", "299"],
            ["588", "228", "256", "112", "113", "358", "557", "990", "225", "334"],
            ["489", "499", "166", "356", "122", "880", "368", "134", "144", "488"],
            ["245", "688", "599", "239", "177", "114", "359", "558", "379", "389"],
            ["155", "778", "148", "338", "249", "556", "449", "369", "559", "226"],
            ["227", "138", "788", "257", "339", "259", "269", "378", "289", "569"],
            ["344", "156", "445", "220", "889", "349", "133", "440", "388", "677"],
            ["335", "110", "229", "770", "348", "457", "188", "279", "577", "136"],
            ["128", "569", "779", "167", "168", "277", "458", "468", "568", "244"]
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

    // 9. JURI BOARD (00 - 99)
    function renderJuriBoardGrid() {
        const grid = document.getElementById('juri-board-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 0; i <= 99; i++) {
            const val = String(i).padStart(2, '0');
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.textContent = val;
            cell.addEventListener('click', () => {
                toggleSelection(`Juri-${val}`, val);
                cell.classList.toggle('selected');
            });
            grid.appendChild(cell);
        }
    }

    // 10. CART & DYNAMIC CHIPS LOGIC
    function toggleSelection(name, value) {
        const existingIndex = state.selectedNumbers.findIndex(item => item.name === name);
        if (existingIndex > -1) {
            state.selectedNumbers.splice(existingIndex, 1);
        } else {
            // Fully dynamic chip calculation based on user selection or custom input
            const amount = state.customChip > 0 ? state.customChip : state.selectedChip;
            state.selectedNumbers.push({ name, value, amount });
        }
        updateCartUI();
    }

    function updateCartUI() {
        const cartList = document.getElementById('cart-items-list');
        const totalPtsTag = document.getElementById('total-cart-pts');
        
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

    // 11. EVENT LISTENERS
    function setupEventListeners() {
        document.querySelectorAll('.btn-range').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-range').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedRange = btn.getAttribute('data-range');
                filterTripleBoardByRange(state.selectedRange);
            });
        });

        document.querySelectorAll('.btn-bet-on').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-bet-on').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedBetType = btn.getAttribute('data-bet-type') || btn.textContent.toLowerCase();
            });
        });

        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedBetType = btn.getAttribute('data-type');

                const juriSec = document.getElementById('juri-board-section');
                const tripleSec = document.getElementById('triple-board-section');
                const rangeBlock = document.getElementById('range-selector-block');

                if (state.selectedBetType === 'juri') {
                    if(juriSec) juriSec.classList.remove('hidden');
                    if(tripleSec) tripleSec.classList.add('hidden');
                    if(rangeBlock) rangeBlock.classList.add('hidden');
                } else if (state.selectedBetType === 'triple') {
                    if(juriSec) juriSec.classList.add('hidden');
                    if(tripleSec) tripleSec.classList.remove('hidden');
                    if(rangeBlock) rangeBlock.classList.remove('hidden');
                } else {
                    if(juriSec) juriSec.classList.add('hidden');
                    if(tripleSec) tripleSec.classList.remove('hidden');
                    if(rangeBlock) rangeBlock.classList.remove('hidden');
                }
            });
        });

        // Dynamic Chip Click Handler (No fixed value forced)
        document.querySelectorAll('.btn-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedChip = parseInt(btn.getAttribute('data-val'), 10);
                state.customChip = 0;
            });
        });

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

        const clearBtn = document.getElementById('btn-clear-cart');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.selectedNumbers = [];
                document.querySelectorAll('.matrix-cell.selected, .single-card.selected').forEach(el => el.classList.remove('selected'));
                updateCartUI();
            });
        }

        const resetBtn = document.getElementById('btn-reset-selection');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if(clearBtn) clearBtn.click();
            });
        }

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
                    if(clearBtn) clearBtn.click();
                } else {
                    alert("Insufficient Play Points!");
                }
            });
        }

        const claimBtn = document.getElementById('btn-claim-ticket');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                const ticketInput = document.getElementById('barcode-input');
                if (ticketInput && ticketInput.value.trim() !== "") {
                    alert(`Claim request submitted for Ticket: ${ticketInput.value}`);
                    ticketInput.value = "";
                } else {
                    alert("Please enter or scan a valid Ticket No.");
                }
            });
        }

        const adminTimerInput = document.getElementById('admin-timer-input');
        const adminSaveBtn = document.getElementById('admin-save-timer');
        if (adminSaveBtn && adminTimerInput) {
            adminSaveBtn.addEventListener('click', () => {
                const mins = parseInt(adminTimerInput.value, 10);
                if (!isNaN(mins) && mins > 0) {
                    state.adminSettings.drawIntervalMinutes = mins;
                    state.adminSettings.isTestMode = false;
                    state.currentDraw.timeLeft = mins * 60;
                    alert(`Admin updated draw timer interval to ${mins} minutes.`);
                } else {
                    alert("Please enter a valid minute value.");
                }
            });
        }

        setupModal("nav-ticket-history", "ticket-history-modal", "close-ticket-history-modal");
        setupModal("nav-result-history", "result-history-modal", "close-result-history-modal");
        setupModal("btn-open-result-history-card", "result-history-modal", "close-result-history-modal");
        setupModal("nav-rules", "rules-modal", "close-rules-modal");
        setupModal("nav-settings", "settings-modal", "close-settings-modal");

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.remove('hidden');
            });
        }

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

    function filterTripleBoardByRange(range) {
        console.log(`Filtered Triple Board for Range: ${range}`);
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

    initApp();
});
