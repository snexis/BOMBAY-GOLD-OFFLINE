/**
 * A2Z BOMBAY - Main Application Logic
 * Complete Production-Ready Version matching exact UI/UX specifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MANAGEMENT (Dynamic, Non-Fixed Chips & Real-time setup with LocalStorage Persistence)
    const state = {
        user: {
            username: localStorage.getItem('admin_username') || "Player_Demo",
            playPoints: 50000.00, // High testing points
            winningBalance: 0.00,
            rewardPoints: 50.00
        },
        currentDraw: {
            id: getOrInitPersistentDrawId(),
            drawIdDisplay: "Draw 1000",
            time: getCurrentTimeString(),
            nextDrawTime: getNextDrawTimeString(2),
            timeLeft: 120 // 2 minutes test mode (24/7)
        },
        adminSettings: {
            drawIntervalMinutes: 2,
            isTestMode: true
        },
        selectedRange: 'A',
        selectedBetType: 'both', // modes: both, word, digit (No Juri)
        selectedChip: 10, 
        customChip: 0,
        selectedNumbers: [],
        todaysResults: getOrInitPersistentResults() // Persistent results so refresh doesn't change history
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
        
        // Generate initial 20+ live past records if none exist
        let initialResults = [];
        for (let i = 20; i > 0; i--) {
            const pastTime = new Date();
            pastTime.setMinutes(pastTime.getMinutes() - (i * 2));
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const strNum = String(randomNum);
            const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);

            initialResults.push({
                draw: `${Math.floor(Math.random() * 90000) + 10000}`,
                time: pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                num: strNum,
                single: singleVal,
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
        renderTodaysResults();
        renderSingleBoard();
        renderTripleBoardGrid();
        renderJuriBoardGrid(); // Or hidden if not needed, kept for fallback
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

    function triggerAutoDrawSequence() {
        const randomNum = Math.floor(Math.random() * 900) + 100;
        const strNum = String(randomNum);
        const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)).slice(-1);

        const newResultItem = {
            draw: `${Math.floor(Math.random() * 90000) + 10000}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            num: strNum,
            single: singleVal,
            statusClass: "highlight-live"
        };

        // Unshift to put the latest current result at the very front/top
        state.todaysResults.unshift(newResultItem);
        if (state.todaysResults.length > 35) state.todaysResults.pop();
        
        // Save to LocalStorage so refresh won't alter or lose it
        localStorage.setItem('a2z_todays_results', JSON.stringify(state.todaysResults));

        renderTodaysResults();

        const intervalMins = state.adminSettings.drawIntervalMinutes || 2;
        state.currentDraw.timeLeft = intervalMins * 60;
        state.currentDraw.id = String(Math.floor(Math.random() * 90000) + 10000);
        localStorage.setItem('a2z_current_draw_id', state.currentDraw.id);

        const drawIdEl = document.getElementById('current-draw-id');
        if (drawIdEl) {
            drawIdEl.textContent = `Draw ${state.currentDraw.id}`;
        }
    }

    // 6. TODAY'S RESULTS SLIDER GRID (Multi-color, Larger Bold Size, Latest on Front)
    function renderTodaysResults() {
        const grid = document.getElementById('results-12-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Display top 12 results on dashboard grid, current result first
        const displayList = state.todaysResults.slice(0, 12);

        displayList.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'result-slot-card';
            // Applied multi-color styling & larger prominent font sizes
            card.style.cssText = "background: linear-gradient(135deg, rgba(20,30,48,0.9), rgba(36,59,85,0.9)); border: 1px solid rgba(0,255,200,0.3); border-radius: 8px; padding: 8px; text-align: center; min-width: 85px;";
            
            // Render depending on mode (Word, Digit, Both) along with single digit
            let modeDisplayContent = "";
            if (state.selectedBetType === 'word') {
                modeDisplayContent = `<span style="color: #ff9900; font-size: 16px; font-weight: bold;">${item.num}</span>`;
            } else if (state.selectedBetType === 'digit') {
                modeDisplayContent = `<span style="color: #00ffcc; font-size: 16px; font-weight: bold;">${item.single}</span>`;
            } else {
                // Both mode showing word + single clear format
                modeDisplayContent = `
                    <div style="color: #ff9900; font-size: 15px; font-weight: bold;">${item.num}</div>
                    <div style="color: #00ffcc; font-size: 14px; font-weight: bold; border-top: 1px dashed rgba(255,255,255,0.2); margin-top: 2px; padding-top: 2px;">Single: ${item.single}</div>
                `;
            }

            card.innerHTML = `
                <div style="color: #a0c4ff; font-size: 11px; font-weight: 600;">${item.draw}</div>
                <div style="color: #888; font-size: 10px; margin-bottom: 3px;">${item.time}</div>
                ${modeDisplayContent}
            `;
            grid.appendChild(card);
        });

        // Also update Result History modal list if open (showing 20+ records)
        renderResultHistoryModalList();
    }

    function renderResultHistoryModalList() {
        const historyContainer = document.getElementById('result-history-list-container');
        if (!historyContainer) return;
        historyContainer.innerHTML = '';

        state.todaysResults.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = "display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px;";
            row.innerHTML = `
                <span style="color: #a0c4ff;">Draw ${item.draw}</span>
                <span style="color: #bbb;">${item.time}</span>
                <span style="color: #ff9900; font-weight: bold;">${item.num}</span>
                <span style="color: #00ffcc; font-weight: bold;">Single: ${item.single}</span>
            `;
            historyContainer.appendChild(row);
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

    // 8. TRIPLE BOARD MATRIX
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

    // 9. JURI BOARD (Fallback)
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

    // 11. EVENT LISTENERS (Strictly 3 Modes: Word, Digit, Both)
    function setupEventListeners() {
        document.querySelectorAll('.btn-range').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-range').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedRange = btn.getAttribute('data-range');
            });
        });

        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Map to Word, Digit, or Both modes
                const typeAttr = (btn.getAttribute('data-type') || btn.textContent).toLowerCase();
                if (typeAttr.includes('word') || typeAttr.includes('panna') || typeAttr.includes('triple')) {
                    state.selectedBetType = 'word';
                } else if (typeAttr.includes('digit') || typeAttr.includes('single')) {
                    state.selectedBetType = 'digit';
                } else {
                    state.selectedBetType = 'both';
                }
                
                renderTodaysResults(); // Re-render results grid to reflect chosen mode instantly
            });
        });

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
