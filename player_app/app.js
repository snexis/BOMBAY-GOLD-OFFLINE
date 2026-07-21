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
        selectedBets: new Set(),
        playBalance: 5000,
        winningBalance: 1200
    };

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    // ACCURATE 220 PATTI DATA MATRIX (1 to 0)
    const REAL_PATTI_DATA = {
        1: ["100","119","128","137","146","236","245","290","380","470","489","560","579","588","678","122","133","144","199","227","335","777"],
        2: ["129","138","147","156","200","237","246","390","480","570","589","679","688","789","110","228","233","255","299","336","444","660"],
        3: ["120","139","148","157","238","247","256","300","490","580","670","689","780","111","166","229","337","355","399","445","599","779"],
        4: ["130","149","158","167","239","248","257","347","356","400","590","680","789","112","220","266","338","446","455","499","699","888"],
        5: ["140","159","168","230","249","258","267","348","357","456","500","690","780","113","122","177","221","339","555","599","663","799"],
        6: ["150","169","178","240","259","268","349","358","367","457","600","790","890","114","222","277","330","448","556","664","699","880"],
        7: ["160","179","188","250","269","278","340","359","368","458","467","700","890","115","133","223","288","331","449","557","665","773"],
        8: ["170","189","260","279","288","350","369","378","459","468","567","800","900","116","125","224","233","332","440","558","666","774"],
        9: ["180","199","270","289","360","379","388","450","469","478","568","577","900","117","126","225","234","333","441","559","667","775"],
        0: ["190","280","299","370","389","460","479","488","569","578","677","000","118","127","226","235","334","442","550","668","776","999"]
    };

    // 2. DATA GENERATOR (10 ROWS x 22 COLS = 220 BLOCKS)
    function getPattiData() {
        const rows = [];
        for (let r = 0; r < 10; r++) {
            const rowDigit = (r + 1) % 10; // 1 to 0
            const rowLetter = letters[r];   // A to J
            const pattis = REAL_PATTI_DATA[rowDigit];
            const columns = [];

            for (let c = 1; c <= 22; c++) {
                const blockIndex = (r * 22) + c; // 1 to 220
                const pattiNum = pattis[c - 1]; 
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

    function startClock() {
        const timeEl = document.getElementById('currentDateTime');
        setInterval(() => {
            const now = new Date();
            if (timeEl) timeEl.textContent = now.toLocaleString('en-IN');
        }, 1000);
    }

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
                cell.innerHTML = `
                    <span class="val-top">${digit}</span>
                    <span class="val-bottom">${letter}</span>
                `;
            }

            cell.addEventListener('click', () => toggleBetSelection(cellId));
            grid.appendChild(cell);
        }
        highlightSelectedCells();
    }

    function renderPattiBoard() {
        const container = document.getElementById('pattiVerticalList') || document.getElementById('pattiVerticalContainer');
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

                if (state.betType === 'jora') {
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
                    if (state.viewBy === 'digit') {
                        cell.innerHTML = `<span class="val-top">${item.patti}</span>`;
                    } else if (state.viewBy === 'word') {
                        cell.innerHTML = `<span class="val-top">${item.word}</span>`;
                    } else {
                        cell.innerHTML = `
                            <span class="val-top">${item.rowLabel}</span>
                            <span class="val-mid">${item.patti}</span>
                            <span class="val-bottom">${item.word}</span>
                        `;
                    }
                }

                cell.addEventListener('click', () => toggleBetSelection(`patti_${item.id}`));
                grid22.appendChild(cell);
            });

            rowDiv.appendChild(grid22);
            container.appendChild(rowDiv);
        });

        highlightSelectedCells();
    }

    function toggleBetSelection(id) {
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
            itemDiv.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:4px; border-bottom:1px solid #1e293b; padding:4px 2px;';
            itemDiv.innerHTML = `<span>Item: ${id}</span> <strong>৳${state.betAmount}</strong>`;
            cartList.appendChild(itemDiv);
        });
    }

    // 4. EVENT LISTENERS SETUP

    // View By Tabs
    document.querySelectorAll('#viewByTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#viewByTabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.viewBy = e.target.dataset.view;
            renderSingleSection();
            renderPattiBoard();
        });
    });

    // Bet Type Tabs
    document.querySelectorAll('#betTypeTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#betTypeTabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.betType = e.target.dataset.type;
            renderSingleSection();
            renderPattiBoard();
        });
    });

    // Range Filter Buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const range = target.dataset.range;
            
            if (state.selectedRange === range) {
                state.selectedRange = null;
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
                state.betAmount = parseInt(e.currentTarget.dataset.amount, 10);
                const customInput = document.getElementById('customAmount');
                if (customInput) customInput.value = '';
                updateCartUI();
            }
        });
    });

    // Custom Amount Input
    const customAmountInput = document.getElementById('customAmount');
    if (customAmountInput) {
        customAmountInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val > 0) {
                state.betAmount = val;
                document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
            } else if (e.target.value === '') {
                state.betAmount = 10;
            }
            updateCartUI();
        });
    }

    // Clear Cart Button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            state.selectedBets.clear();
            updateCartUI();
            highlightSelectedCells();
        });
    }

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

    // Submit Bets
    const submitBtn = document.getElementById('submitBetsBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (state.selectedBets.size === 0) {
                alert('Please select at least one item to place a bet.');
                return;
            }

            const totalAmount = state.selectedBets.size * state.betAmount;
            if (totalAmount > state.playBalance) {
                alert('Insufficient play balance!');
                return;
            }

            // Deduct Balance
            state.playBalance -= totalAmount;
            const playBalanceEl = document.getElementById('playBalance');
            if (playBalanceEl) playBalanceEl.textContent = `৳${state.playBalance.toLocaleString()}`;

            alert(`Bet successfully placed! Total Amount: ৳${totalAmount}`);
            state.selectedBets.clear();
            updateCartUI();
            highlightSelectedCells();
        });
    }

    // INITIALIZATION
    startClock();
    renderSingleSection();
    renderPattiBoard();
});
