/* ==========================================================================
   A2Z GAME DASHBOARD - DYNAMIC BOARD ENGINE (APP.JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. STATE MANAGEMENT
    const state = {
        viewBy: 'both',       // 'both', 'word', 'digit'
        betType: 'triple',     // 'single', 'jora', 'triple'
        selectedRange: null,  // 'A', 'B', 'C', 'D'
        betAmount: 10,
        selectedBets: new Set()
    };

    // 2. MOCK DATA GENERATORS (10 ROWS x 22 COLS = 220 BLOCKS)
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    // Generate Sample 220 Patti & Word Mapping
    function getPattiData() {
        const rows = [];
        for (let r = 0; r < 10; r++) {
            const rowDigit = (r + 1) % 10; // 1 to 0
            const rowLetter = letters[r];  // A to J
            const columns = [];

            for (let c = 1; c <= 22; c++) {
                const blockIndex = (r * 22) + c; // 1 to 220
                
                // Sample 3-digit Patti & 3-letter Word Logic
                const pattiNum = `${(r + 1) * 100 + c}`; 
                const wordCode = `${rowLetter}${String.fromCharCode(65 + (c % 26))}${String.fromCharCode(65 + ((c + 2) % 26))}`;

                columns.push({
                    id: blockIndex,
                    rowLabel: `${rowDigit}/${rowLetter}`,
                    patti: pattiNum,
                    word: wordCode
                });
            }
            rows.push({ digit: rowDigit, letter: rowLetter, cols: columns });
        }
        return rows;
    }

    // 3. UI RENDER FUNCTIONS

    // Update Top Bar Clock
    function startClock() {
        const timeEl = document.getElementById('currentDateTime');
        setInterval(() => {
            const now = new Date();
            if(timeEl) timeEl.textContent = now.toLocaleString('en-IN');
        }, 1000);
    }

    // Render Single Mode Section (10 Blocks)
    function renderSingleSection() {
        const grid = document.getElementById('singleGrid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 0; i < 10; i++) {
            const digit = (i + 1) % 10;
            const letter = letters[i];
            const cellId = `single_${digit}_${letter}`;
            
            const cell = document.createElement('div');
            cell.className = 'cell-box';
            cell.dataset.id = cellId;

            if (state.viewBy === 'digit') {
                cell.innerHTML = `<span class="val-top">${digit}</span>`;
            } else if (state.viewBy === 'word') {
                cell.innerHTML = `<span class="val-top">${letter}</span>`;
            } else {
                // BOTH View (Vertical Layout)
                cell.innerHTML = `
                    <span class="val-top">${digit}</span>
                    <span class="val-bottom">${letter}</span>
                `;
            }

            cell.addEventListener('click', () => toggleBetSelection(cellId, `${digit}/${letter}`));
            grid.appendChild(cell);
        }
    }

    // Render Patti Board (220 Blocks Grid)
    function renderPattiBoard() {
        const container = document.getElementById('pattiVerticalList');
        if (!container) return;
        container.innerHTML = '';

        const data = getPattiData();

        data.forEach((row) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'patti-row';

            const rowTitle = document.createElement('div');
            rowTitle.className = 'row-label';
            rowTitle.textContent = `LINE ${row.digit} (${row.letter})`;
            rowDiv.appendChild(rowTitle);

            const grid22 = document.createElement('div');
            grid22.className = 'cols-22-grid';

            row.cols.forEach((item) => {
                const cell = document.createElement('div');
                cell.className = 'cell-box';
                cell.dataset.id = `patti_${item.id}`;
                cell.dataset.index = item.id;

                // Handle Range Filter Highlighting
                if (state.selectedRange) {
                    const idx = item.id;
                    let inRange = false;
                    if (state.selectedRange === 'A' && idx >= 1 && idx <= 55) inRange = true;
                    if (state.selectedRange === 'B' && idx >= 56 && idx <= 110) inRange = true;
                    if (state.selectedRange === 'C' && idx >= 111 && idx <= 165) inRange = true;
                    if (state.selectedRange === 'D' && idx >= 166 && idx <= 220) inRange = true;

                    if (!inRange) {
                        cell.style.opacity = '0.2';
                    } else {
                        cell.style.opacity = '1';
                    }
                }

                // Render content without Pat/Wor tags (Clean Vertical Layout)
                if (state.betType === 'jora') {
                    // Jora / Jodi Mode Logic (2-digit / 2-letter)
                    const joraDigit = item.patti.substring(0, 2);
                    const joraWord = item.word.substring(0, 2);

                    if (state.viewBy === 'digit') {
                        cell.innerHTML = `<span class="val-top">${joraDigit}</span>`;
                    } else if (state.viewBy === 'word') {
                        cell.innerHTML = `<span class="val-top">${joraWord}</span>`;
                    } else {
                        cell.innerHTML = `
                            <span class="val-top">${joraDigit}</span>
                            <span class="val-bottom">${joraWord}</span>
                        `;
                    }
                } else {
                    // Triple / Patti Mode (Full 3-digit / 3-letter)
                    if (state.viewBy === 'digit') {
                        cell.innerHTML = `<span class="val-top">${item.patti}</span>`;
                    } else if (state.viewBy === 'word') {
                        cell.innerHTML = `<span class="val-top">${item.word}</span>`;
                    } else {
                        // BOTH VERTICAL VIEW
                        cell.innerHTML = `
                            <span class="val-top">${item.rowLabel}</span>
                            <span class="val-mid">${item.patti}</span>
                            <span class="val-bottom">${item.word}</span>
                        `;
                    }
                }

                cell.addEventListener('click', () => toggleBetSelection(`patti_${item.id}`, `${item.patti} / ${item.word}`));
                grid22.appendChild(cell);
            });

            rowDiv.appendChild(grid22);
            container.appendChild(rowDiv);
        });
    }

    // Toggle Bet Selection in Cart
    function toggleBetSelection(id, label) {
        if (state.selectedBets.has(id)) {
            state.selectedBets.delete(id);
        } else {
            state.selectedBets.add(id);
        }
        updateCartUI();
        highlightSelectedCells();
    }

    function highlightSelectedCells() {
        document.querySelectorAll('.cell-box').forEach(cell => {
            if (state.selectedBets.has(cell.dataset.id)) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }

    function updateCartUI() {
        const countEl = document.getElementById('selectedCount');
        const cartList = document.getElementById('cartItemsList');
        if (countEl) countEl.textContent = state.selectedBets.size;

        if (!cartList) return;
        if (state.selectedBets.size === 0) {
            cartList.innerHTML = '<div class="empty-cart-msg">Your selections will appear here</div>';
            return;
        }

        cartList.innerHTML = '';
        state.selectedBets.forEach(id => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px solid #1e293b; padding:2px;';
            itemDiv.innerHTML = `<span>Item: ${id}</span> <strong>৳${state.betAmount}</strong>`;
            cartList.appendChild(itemDiv);
        });
    }

    // 4. EVENT LISTENERS SETUP

    // View By Tabs (Both, Word, Digit)
    document.querySelectorAll('#viewByTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#viewByTabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.viewBy = e.target.dataset.view;
            renderSingleSection();
            renderPattiBoard();
        });
    });

    // Bet Type Tabs (Single, Jora, Triple)
    document.querySelectorAll('#betTypeTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#betTypeTabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.betType = e.target.dataset.type;
            renderSingleSection();
            renderPattiBoard();
        });
    });

    // Range Filter Buttons (A, B, C, D)
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const range = target.dataset.range;
            
            if (state.selectedRange === range) {
                state.selectedRange = null; // Toggle Off
                target.classList.remove('active');
            } else {
                document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                state.selectedRange = range;
            }
            renderPattiBoard();
        });
    });

    // Chip Amount Selectors
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            if (e.currentTarget.dataset.amount) {
                state.betAmount = parseInt(e.currentTarget.dataset.amount);
                updateCartUI();
            }
        });
    });

    // Reset Button
    const resetBtn = document.getElementById('resetBetsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state.selectedBets.clear();
            state.selectedRange = null;
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            updateCartUI();
            renderSingleSection();
            renderPattiBoard();
        });
    }

    // INITIALIZATION
    startClock();
    renderSingleSection();
    renderPattiBoard();
});
