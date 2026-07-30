/**
 * A2Z BOMBAY - Main Application Logic
 * Complete Production-Ready Version matching exact UI/UX specifications.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MANAGEMENT (Dynamic, Non-Fixed Chips & Real-time setup with LocalStorage Persistence)
    const state = {
        user: {
            username: localStorage.getItem('admin_username') || "ADMIN01",
            playPoints: 50000.00, // High testing points
            winningBalance: 0.00,
            rewardPoints: 50.00
        },
        currentDraw: {
            id: getOrInitPersistentDrawId(),
            drawIdDisplay: "1000",
            time: getCurrentTimeString(),
            nextDrawTime: getNextDrawTimeString(2),
            timeLeft: 120 // 2 minutes test mode (24/7 continuous online simulation)
        },
        adminSettings: {
            drawIntervalMinutes: 2,
            isTestMode: true
        },
        selectedRange: 'A',
        selectedBetType: 'both', // modes: both, word, digit, juri
        selectedGameType: 'single', // single, juri, triple
        selectedChip: 5, 
        customChip: 0,
        selectedNumbers: [],
        todaysResults: getOrInitPersistentResults() // Persistent results so refresh/offline doesn't change history
    };

    // Helper functions for dynamic and persistent generation
    function getOrInitPersistentDrawId() {
        let savedId = localStorage.getItem('a2z_current_draw_id');
        if (!savedId) {
            savedId = String(Math.floor(Math.random() * 90000) + 10000);
            localStorage.setItem('a2z_current_draw_id', savedId);
        }
        return savedId;
    }

    function getCurrentTimeString() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function getNextDrawTimeString(intervalMins) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + intervalMins);
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getOrInitPersistentResults() {
        let savedResults = localStorage.getItem('a2z_todays_results');
        if (savedResults) {
            try {
                return JSON.parse(savedResults);
            } catch (e) {
                console.error("Error parsing saved results", e);
            }
        }
        
        let initialResults = [];
        for (let i = 0; i < 30; i++) {
            const pastTime = new Date();
            pastTime.setMinutes(pastTime.getMinutes() - (i * 2));
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const strNum = String(randomNum);
            const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);
            const juriVal = String(Math.floor(Math.random() * 90)).padStart(2, '0');

            initialResults.push({
                draw: `${Math.floor(Math.random() * 90000) + 10000}`,
                time: pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                num: strNum,
                single: singleVal,
                juri: juriVal,
                statusClass: ""
            });
        }
        localStorage.setItem('a2z_todays_results', JSON.stringify(initialResults));
        return initialResults;
    }

    // 2. INITIALIZATION
    function initApp() {
        updateUserInfo();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        initLiveTimer();
        renderLatestDrawBox();
        renderTodaysResults();
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

        let lastTimestamp = localStorage.getItem('a2z_last_timestamp');
        const currentTime = Date.now();
        if (lastTimestamp) {
            const elapsedSecs = Math.floor((currentTime - parseInt(lastTimestamp, 10)) / 1000);
            if (elapsedSecs > 0) {
                state.currentDraw.timeLeft -= elapsedSecs;
                while (state.currentDraw.timeLeft <= 0) {
                    triggerAutoDrawSequence(true);
                    const intervalMins = state.adminSettings.drawIntervalMinutes || 2;
                    state.currentDraw.timeLeft += (intervalMins * 60);
                }
            }
        }

        setInterval(() => {
            localStorage.setItem('a2z_last_timestamp', Date.now().toString());
            if (state.currentDraw.timeLeft > 0) {
                state.currentDraw.timeLeft--;
                const mins = String(Math.floor(state.currentDraw.timeLeft / 60)).padStart(2, '0');
                const secs = String(state.currentDraw.timeLeft % 60).padStart(2, '0');
                timerEl.textContent = `${mins}:${secs}`;
            } else {
                triggerAutoDrawSequence(false);
            }
        }, 1000);
    }

    function triggerAutoDrawSequence(isCatchup = false) {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        const strNum = String(randomNum);
        const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);
        const juriVal = String(Math.floor(Math.random() * 90)).padStart(2, '0');

        const drawIdToUse = state.currentDraw.id;
        const newResultItem = {
            draw: drawIdToUse,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            num: strNum,
            single: singleVal,
            juri: juriVal,
            statusClass: isCatchup ? "" : "highlight-anim"
        };

        state.todaysResults.unshift(newResultItem);
        if (state.todaysResults.length > 50) state.todaysResults.pop();
        
        localStorage.setItem('a2z_todays_results', JSON.stringify(state.todaysResults));

        renderLatestDrawBox();
        renderTodaysResults();

        if (!isCatchup) {
            highlightWinningCellsOnBoard(strNum, singleVal, juriVal);
        }

        const intervalMins = state.adminSettings.drawIntervalMinutes || 2;
        state.currentDraw.timeLeft = intervalMins * 60;
        state.currentDraw.id = String(Math.floor(Math.random() * 90000) + 10000);
        localStorage.setItem('a2z_current_draw_id', state.currentDraw.id);

        const drawIdEl = document.getElementById('current-draw-id');
        if (drawIdEl) {
            drawIdEl.textContent = `#${state.currentDraw.id}`;
        }
    }

    function highlightWinningCellsOnBoard(num, single, juri) {
        const allCells = document.querySelectorAll('.matrix-cell, .single-card');
        allCells.forEach(cell => {
            const txt = cell.textContent.trim();
            if (txt === num || txt === single || txt === juri || cell.getAttribute('data-val') === single) {
                cell.classList.add('win-glow-animation');
                setTimeout(() => {
                    cell.classList.remove('win-glow-animation');
                }, 1500);
            }
        });
    }

    // 6. RENDER LATEST DRAW BOX
    function renderLatestDrawBox() {
        const latest = state.todaysResults[0];
        if (!latest) return;

        const liveDrawIdEl = document.getElementById('current-draw-id');
        if (liveDrawIdEl) {
            liveDrawIdEl.textContent = `#${state.currentDraw.id}`;
        }

        const drawIdDisplay = document.getElementById('current-draw-id-display');
        const currentResultTime = document.getElementById('current-result-time');
        const currentResultNum = document.getElementById('current-result-num');

        if (drawIdDisplay) drawIdDisplay.textContent = `Draw #${latest.draw}`;
        if (currentResultTime) currentResultTime.textContent = latest.time;
        if (currentResultNum) currentResultNum.textContent = latest.num;
    }

    // 7. TODAY'S RESULTS SLIDER GRID
    function renderTodaysResults() {
        const grid = document.getElementById('results-12-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const displayList = state.todaysResults.slice(0, 12);
        displayList.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <span class="res-time">${item.time}</span>
                <span class="res-num">${item.num}</span>
                <span class="res-single">S: ${item.single} | J: ${item.juri}</span>
            `;
            grid.appendChild(card);
        });

        renderResultHistoryModalList();
    }

    function renderResultHistoryModalList() {
        const tbody = document.getElementById('result-history-table-body');
        const totalDrawsEl = document.getElementById('total-draws-count');
        const resultDateEl = document.getElementById('result-history-date');

        if (totalDrawsEl) totalDrawsEl.textContent = state.todaysResults.length;
        if (resultDateEl) resultDateEl.textContent = new Date().toLocaleDateString();

        if (!tbody) return;
        tbody.innerHTML = '';

        state.todaysResults.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.time}</td>
                <td>#${item.draw}</td>
                <td>${item.single}</td>
                <td>${item.juri}</td>
                <td>${item.num}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 8. SINGLE BOARD (1 - 0)
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

    // 9. TRIPLE BOARD MATRIX
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

    // 10. JURI BOARD (00 to 99)
    function renderJuriBoardGrid() {
        const grid = document.getElementById('juri-board-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i <= 99; i++) {
            const val = String(i).padStart(2, '0');
            const cell = document.createElement('div');
            cell.className = 'matrix-cell juri-cell';
            cell.textContent = val;
            cell.addEventListener('click', () => {
                toggleSelection(`Juri-${val}`, val);
                cell.classList.toggle('selected');
            });
            grid.appendChild(cell);
        }
    }

    // 11. CART & CHIPS LOGIC
    function toggleSelection(name, value) {
        const existingIndex = state.selectedNumbers.findIndex(item => item.name === name);
        if (existingIndex > -1) {
            state.selectedNumbers.splice(existingIndex, 1);
        } else {
            const customInput = document.getElementById('custom-points-input');
            const customVal = customInput ? parseFloat(customInput.value) : 0;
            const amount = (customVal > 0) ? customVal : state.selectedChip;
            state.selectedNumbers.push({ name, value, amount });
        }
        updateCartUI();
    }

    function updateCartUI() {
        const cartContainer = document.getElementById('cart-items-container');
        const cartCount = document.getElementById('cart-count');
        const cartTotalPts = document.getElementById('cart-total-pts');
        
        if (!cartContainer) return;

        if (state.selectedNumbers.length === 0) {
            cartContainer.innerHTML = '<div class="empty-msg">No items selected</div>';
            if (cartCount) cartCount.textContent = '0';
            if (cartTotalPts) cartTotalPts.textContent = '0';
            return;
        }

        cartContainer.innerHTML = '';
        let totalPts = 0;

        state.selectedNumbers.forEach((item, index) => {
            totalPts += item.amount;
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item-row';
            itemRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;";
            itemRow.innerHTML = `
                <span>${item.name} (${item.amount}Pts)</span>
                <button type="button" data-index="${index}" style="background: #ef4444; border: none; color: #fff; border-radius: 3px; cursor: pointer; padding: 1px 5px; font-size: 10px;">✕</button>
            `;
            
            itemRow.querySelector('button').addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                state.selectedNumbers.splice(idx, 1);
                updateCartUI();
            });

            cartContainer.appendChild(itemRow);
        });

        if (cartCount) cartCount.textContent = state.selectedNumbers.length;
        if (cartTotalPts) cartTotalPts.textContent = totalPts.toFixed(2);
    }

    function setupEventListeners() {
        // Navigation Buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        const tripleBoardSection = document.getElementById('triple-board-section');
        const juriBoardSection = document.getElementById('juri-board-section');
        const ticketModal = document.getElementById('ticket-history-modal');
        const resultModal = document.getElementById('result-history-modal');
        const rulesModal = document.getElementById('rules-modal');
        const settingsModal = document.getElementById('settings-modal');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (btn.id === 'nav-dashboard') {
                    if (tripleBoardSection) tripleBoardSection.classList.remove('hidden');
                    if (juriBoardSection) juriBoardSection.classList.add('hidden');
                } else if (btn.id === 'nav-ticket-history') {
                    if (ticketModal) ticketModal.classList.remove('hidden');
                } else if (btn.id === 'nav-result-history') {
                    if (resultModal) resultModal.classList.remove('hidden');
                } else if (btn.id === 'nav-rules') {
                    if (rulesModal) rulesModal.classList.remove('hidden');
                } else if (btn.id === 'nav-settings') {
                    if (settingsModal) settingsModal.classList.remove('hidden');
                }
            });
        });

        // Close Modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                if (ticketModal) ticketModal.classList.add('hidden');
                if (resultModal) resultModal.classList.add('hidden');
                if (rulesModal) rulesModal.classList.add('hidden');
                if (settingsModal) settingsModal.classList.add('hidden');
            });
        });

        // Bet Type Selection (Single / Juri / Triple tabs)
        const typeButtons = document.querySelectorAll('.btn-type');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.getAttribute('data-type');
                state.selectedGameType = type;

                if (type === 'juri') {
                    if (juriBoardSection) juriBoardSection.classList.remove('hidden');
                    if (tripleBoardSection) tripleBoardSection.classList.add('hidden');
                } else {
                    if (juriBoardSection) juriBoardSection.classList.add('hidden');
                    if (tripleBoardSection) tripleBoardSection.classList.remove('hidden');
                }
            });
        });

        // Chip selection
        const chipButtons = document.querySelectorAll('.btn-chip');
        chipButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                chipButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedChip = parseFloat(btn.getAttribute('data-chip'));
                const customInput = document.getElementById('custom-points-input');
                if (customInput) customInput.value = '';
                state.customChip = 0;
            });
        });

        const customInput = document.getElementById('custom-points-input');
        if (customInput) {
            customInput.addEventListener('input', () => {
                const val = parseFloat(customInput.value);
                if (val > 0) {
                    chipButtons.forEach(b => b.classList.remove('active'));
                    state.customChip = val;
                }
            });
        }

        // Submit & Reset Buttons
        const submitBtn = document.getElementById('btn-submit-bet');
        const resetBtn = document.getElementById('btn-reset-bet');
        const clearCartBtn = document.getElementById('btn-clear-cart');

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (state.selectedNumbers.length === 0) {
                    alert('Please select at least one number to place a bet!');
                    return;
                }
                let totalBetAmount = state.selectedNumbers.reduce((sum, item) => sum + item.amount, 0);
                if (state.user.playPoints < totalBetAmount) {
                    alert('Insufficient Play Points!');
                    return;
                }
                state.user.playPoints -= totalBetAmount;
                updateUserInfo();
                alert(`Successfully placed bets worth ${totalBetAmount} points!`);
                state.selectedNumbers = [];
                document.querySelectorAll('.matrix-cell.selected, .single-card.selected').forEach(el => el.classList.remove('selected'));
                updateCartUI();
            });
        }

        if (resetBtn || clearCartBtn) {
            const clearAction = () => {
                state.selectedNumbers = [];
                document.querySelectorAll('.matrix-cell.selected, .single-card.selected').forEach(el => el.classList.remove('selected'));
                updateCartUI();
            };
            if (resetBtn) resetBtn.addEventListener('click', clearAction);
            if (clearCartBtn) clearCartBtn.addEventListener('click', clearAction);
        }
    }

    initApp();
});
