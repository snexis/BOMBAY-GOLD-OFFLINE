/**
 * A2Z BOMBAY - Main Application Logic
 * Complete Production-Ready Version with Aggressive DOM Synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. STATE MANAGEMENT (Dynamic, Non-Fixed Chips & Real-time setup with LocalStorage Persistence)
    const state = {
        user: {
            username: localStorage.getItem('admin_username') || "Player_Demo",
            playPoints: 50000.00,
            winningBalance: 0.00,
            rewardPoints: 50.00
        },
        currentDraw: {
            id: getOrInitPersistentDrawId(),
            drawIdDisplay: "1000",
            time: getCurrentTimeString(),
            nextDrawTime: getNextDrawTimeString(2),
            timeLeft: 120 // 2 minutes test mode
        },
        adminSettings: {
            drawIntervalMinutes: 2,
            isTestMode: true
        },
        selectedRange: 'A',
        selectedBetType: 'both', 
        selectedGameType: 'single', 
        selectedChip: 10, 
        customChip: 0,
        selectedNumbers: [],
        todaysResults: getOrInitPersistentResults() 
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
            const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a, 10) + parseInt(b, 10), 0)).slice(-1);
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

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                let savedTs = localStorage.getItem('a2z_last_timestamp');
                if (savedTs) {
                    const elapsed = Math.floor((Date.now() - parseInt(savedTs, 10)) / 1000);
                    if (elapsed > 0) {
                        state.currentDraw.timeLeft -= elapsed;
                        while (state.currentDraw.timeLeft <= 0) {
                            triggerAutoDrawSequence(true);
                            const intervalMins = state.adminSettings.drawIntervalMinutes || 2;
                            state.currentDraw.timeLeft += (intervalMins * 60);
                        }
                    }
                }
            }
        });

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
        const singleVal = String(strNum.split('').reduce((a, b) => parseInt(a, 10) + parseInt(b, 10), 0)).slice(-1);
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
// 6. RENDER LATEST DRAW BOX (Single Result + Side Slide Animation + No Draw ID)
    function renderLatestDrawBox() {
        const latest = state.todaysResults[0];
        if (!latest) return;

        // Dynamic Injection of Side-Slide CSS Animation
        if (!document.getElementById('a2z-slide-anim-style')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'a2z-slide-anim-style';
            styleTag.textContent = `
                @keyframes slideFromSide {
                    0% { transform: translateX(50px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .side-slide-active {
                    animation: slideFromSide 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
            `;
            document.head.appendChild(styleTag);
        }

        let modeContent = "";
        if (state.selectedBetType === 'word') {
            modeContent = `<div style="font-size: 32px; font-weight: 900; color: #ff9900; text-shadow: 0 0 10px rgba(255,153,0,0.7); margin-top: 4px;">${latest.num}</div>`;
        } else if (state.selectedBetType === 'digit') {
            modeContent = `<div style="font-size: 32px; font-weight: 900; color: #00ffcc; text-shadow: 0 0 10px rgba(0,255,200,0.7); margin-top: 4px;">${latest.single}</div>`;
        } else if (state.selectedBetType === 'juri') {
            modeContent = `<div style="font-size: 32px; font-weight: 900; color: #ffff33; text-shadow: 0 0 10px rgba(255,255,51,0.7); margin-top: 4px;">${latest.juri}</div>`;
        } else {
            modeContent = `
                <div style="font-size: 30px; font-weight: 900; color: #ff9900; text-shadow: 0 0 10px rgba(255,153,0,0.7); margin-top: 4px;">${latest.num}</div>
                <div style="font-size: 15px; font-weight: bold; color: #00ffcc; margin-top: 6px; letter-spacing: 0.5px;">SINGLE: ${latest.single} | JURI: ${latest.juri}</div>
            `;
        }

        // Clean Single HTML Content with Time only (DRAW # removed)
        const newInnerContent = `
            <div class="side-slide-active" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; text-align: center; padding: 10px 0;">
                <div style="font-size: 13px; font-weight: bold; color: #00ffcc; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">LATEST DRAW RESULT</div>
                <div style="font-size: 16px; font-weight: 800; color: #a0c4ff; margin-bottom: 4px;">${latest.time}</div>
                ${modeContent}
            </div>
        `;

        // Target primary container to completely replace all inner duplicates
        let targetBox = document.querySelector('#latest-draw-box, .latest-draw-result-box');
        if (!targetBox) {
            const containers = Array.from(document.querySelectorAll('div, section')).filter(el => {
                return el.textContent.includes('LATEST DRAW RESULT') && el.children.length > 0;
            });
            if (containers.length > 0) {
                targetBox = containers[0];
            }
        }

        if (targetBox) {
            targetBox.innerHTML = newInnerContent;
        }
    }
    // 7. TODAY'S RESULTS SLIDER GRID
    function renderTodaysResults() {
        const grid = document.getElementById('results-12-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const displayList = state.todaysResults.slice(0, 12);
        const multiColors = ['#ff3366', '#00ffcc', '#ff9900', '#33ccff', '#cc33ff', '#ffff33', '#33ff66', '#ff66ff'];

        displayList.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'result-slot-card';
            const accentColor = multiColors[idx % multiColors.length];
            
            card.style.cssText = `background: linear-gradient(135deg, rgba(20,30,48,0.95), rgba(36,59,85,0.95)); border: 1px solid ${accentColor}; border-radius: 8px; padding: 10px 6px; text-align: center; min-width: 90px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); ${item.statusClass ? 'animation: pulseGlow 1s ease-in-out infinite;' : ''}`;
            
            let modeDisplayContent = "";
            if (state.selectedBetType === 'word') {
                modeDisplayContent = `<span style="color: ${accentColor}; font-size: 18px; font-weight: 900;">${item.num}</span>`;
            } else if (state.selectedBetType === 'digit') {
                modeDisplayContent = `<span style="color: ${accentColor}; font-size: 18px; font-weight: 900;">${item.single}</span>`;
            } else if (state.selectedBetType === 'juri') {
                modeDisplayContent = `<span style="color: ${accentColor}; font-size: 18px; font-weight: 900;">${item.juri}</span>`;
            } else {
                modeDisplayContent = `
                    <div style="color: ${accentColor}; font-size: 17px; font-weight: 900;">${item.num}</div>
                    <div style="color: #00ffcc; font-size: 12px; font-weight: bold; border-top: 1px dashed rgba(255,255,255,0.25); margin-top: 4px; padding-top: 3px;">Single: ${item.single}</div>
                `;
            }

            card.innerHTML = `
                <div style="color: #bbb; font-size: 11px; font-weight: 600; margin-bottom: 4px;">${item.time}</div>
                ${modeDisplayContent}
            `;
            grid.appendChild(card);
        });

        renderLatestDrawBox();
        renderResultHistoryModalList();
    }

    // Fix for the Empty Daily Result History Modal showing '---' and '0'
    function renderResultHistoryModalList() {
        const modal = document.getElementById('result-history-modal');
        if (!modal) return;

        // 1. Force update "Date: ---" and "Total Draws: 0" by scanning text content
        const allSpans = modal.querySelectorAll('span, p, div');
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        
        allSpans.forEach(el => {
            if (el.childNodes.length === 1 && typeof el.textContent === 'string') {
                if (el.textContent.includes('Date: ---') || el.textContent.trim() === 'Date: --') {
                    el.textContent = `Date: ${todayStr}`;
                }
                if (el.textContent.includes('Total Draws: 0')) {
                    el.textContent = `Total Draws: ${state.todaysResults.length}`;
                }
            }
        });

        // 2. Find where to put the list. If container is missing, create it dynamically under the header.
        let historyContainer = document.getElementById('result-history-list-container');
        
        if (!historyContainer) {
            // Search for the header row text to inject below it
            const modalDivs = Array.from(modal.querySelectorAll('div'));
            const headerRow = modalDivs.find(d => d.textContent.includes('Draw Time') && d.textContent.includes('Draw ID') && d.children.length > 2);
            
            if (headerRow) {
                historyContainer = document.createElement('div');
                historyContainer.id = 'result-history-list-container';
                historyContainer.style.cssText = "max-height: 400px; overflow-y: auto; margin-top: 10px; width: 100%;";
                headerRow.parentNode.insertBefore(historyContainer, headerRow.nextSibling);
            }
        }

        // 3. Populate the container
        if (historyContainer) {
            historyContainer.innerHTML = '';
            state.todaysResults.forEach(item => {
                const row = document.createElement('div');
                row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px; width: 100%;";
                row.innerHTML = `
                    <span style="color: #ccc; width: 20%; text-align: left;">${item.time}</span>
                    <span style="color: #a0c4ff; font-weight: bold; width: 20%; text-align: center;">${item.draw}</span>
                    <span style="color: #00ffcc; font-weight: bold; font-size: 15px; width: 20%; text-align: center;">${item.single}</span>
                    <span style="color: #ffff33; font-weight: bold; font-size: 15px; width: 20%; text-align: center;">${item.juri}</span>
                    <span style="color: #ff9900; font-weight: 900; font-size: 17px; width: 20%; text-align: right;">${item.num}</span>
                `;
                historyContainer.appendChild(row);
            });
        }
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

    // 10. JURI BOARD 
    function renderJuriBoardGrid() {
        const grid = document.getElementById('juri-board-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i <= 99; i++) {
            const val = String(i).padStart(2, '0');
            const cell = document.createElement('div');
            cell.className = 'matrix-cell juri-cell';
            cell.textContent = val;
            cell.style.cssText = "background: rgba(30, 40, 60, 0.9); border: 1px solid rgba(255, 255, 0, 0.3); color: #ffff33; font-weight: bold;";
            cell.addEventListener('click', () => {
                toggleSelection(`Juri-${val}`, val);
                cell.classList.toggle('selected');
            });
            grid.appendChild(cell);
        }
    }

    // 11. CART & DYNAMIC CHIPS LOGIC
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
            state.selectedNumbers.forEach((item, index) => {
                totalPts += item.amount;
                const div = document.createElement('div');
                div.className = 'cart-item-row';
                div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px;";
                div.innerHTML = `
                    <span>${item.name}</span>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="btn-cart-minus" style="background:#333; color:#fff; border:none; width:20px; height:20px; border-radius:4px; cursor:pointer; font-weight:bold;">-</button>
                        <strong>${item.amount} Pts</strong>
                        <button type="button" class="btn-cart-plus" style="background:#333; color:#fff; border:none; width:20px; height:20px; border-radius:4px; cursor:pointer; font-weight:bold;">+</button>
                    </div>
                `;

                div.querySelector('.btn-cart-plus').addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.amount += (state.customChip > 0 ? state.customChip : state.selectedChip);
                    updateCartUI();
                });

                div.querySelector('.btn-cart-minus').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const activeStep = state.customChip > 0 ? state.customChip : state.selectedChip;
                    item.amount -= activeStep;
                    if (item.amount <= 0) {
                        state.selectedNumbers.splice(index, 1);
                    }
                    updateCartUI();
                });

                cartList.appendChild(div);
            });
        }

        if (totalPtsTag) totalPtsTag.textContent = totalPts;
        const selectedCountTag = document.querySelector('.bet-panel-block.cart-block .cart-header span:first-child');
        if (selectedCountTag) {
            selectedCountTag.textContent = `SELECTED ITEMS ( ${state.selectedNumbers.length} )`;
        }
    }

    // 12. EVENT LISTENERS
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
                const btnText = btn.textContent.toLowerCase();
                if (btnText.includes('single') || btnText.includes('juri') || btnText.includes('triple')) {
                    document.querySelectorAll('.btn-type').forEach(b => {
                        if(b.textContent.toLowerCase().includes('single') || b.textContent.toLowerCase().includes('juri') || b.textContent.toLowerCase().includes('triple')) {
                            b.classList.remove('active');
                        }
                    });
                    btn.classList.add('active');
                    if (btnText.includes('juri')) {
                        state.selectedGameType = 'juri';
                        state.selectedBetType = 'juri';
                    } else if (btnText.includes('single')) {
                        state.selectedGameType = 'single';
                        state.selectedBetType = 'digit';
                    } else {
                        state.selectedGameType = 'triple';
                        state.selectedBetType = 'word';
                    }
                } else {
                    document.querySelectorAll('.btn-type').forEach(b => {
                        if(!b.textContent.toLowerCase().includes('single') && !b.textContent.toLowerCase().includes('juri') && !b.textContent.toLowerCase().includes('triple')) {
                            b.classList.remove('active');
                        }
                    });
                    btn.classList.add('active');
                    const typeAttr = (btn.getAttribute('data-type') || btn.textContent).toLowerCase();
                    if (typeAttr.includes('word') || typeAttr.includes('panna')) {
                        state.selectedBetType = 'word';
                    } else if (typeAttr.includes('digit') || typeAttr.includes('single')) {
                        state.selectedBetType = 'digit';
                    } else if (typeAttr.includes('juri')) {
                        state.selectedBetType = 'juri';
                    } else {
                        state.selectedBetType = 'both';
                    }
                }
                renderTodaysResults();
            });
        });

        document.querySelectorAll('.btn-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedChip = parseInt(btn.getAttribute('data-val'), 10) || 10;
                state.customChip = 0;
            });

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                state.selectedChip += 50;
                btn.textContent = state.selectedChip;
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
        
        // Trigger Modal Update every time it opens to ensure dynamic injection works
        const resultTrigger = document.getElementById("nav-result-history") || document.getElementById("btn-open-result-history-card");
        if (resultTrigger) {
            resultTrigger.addEventListener('click', () => {
                const modal = document.getElementById("result-history-modal");
                if(modal) {
                    modal.classList.remove('hidden');
                    renderResultHistoryModalList(); // Force render when clicked
                }
            });
        }

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
