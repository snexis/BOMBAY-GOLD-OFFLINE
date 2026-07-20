// ==========================================
// SYSTEM LOCK CODE: ATOZ-HYBRID-SYS-2026-X9
// ARCHITECTURE FRAME: AZ-2200-X (22 ROWS x 10 COLS)
// STATUS: DEPLOYED IN CLIENT-SIDE ENGINE
// ==========================================

// ? ???? ? ??????? ?????? ???? ????????? ??? ??????? ???
const BOARD_ROWS = [
    {label: '1', cat: 'A'}, {label: '2', cat: 'B'}, {label: '3', cat: 'C'},
    {label: '4', cat: 'D'}, {label: '5', cat: 'E'}, {label: '6', cat: 'F'},
    {label: '7', cat: 'G'}, {label: '8', cat: 'H'}, {label: '9', cat: 'I'}, {label: '0', cat: 'J'}
];

// ??????? ??????? ??????? ?????? ???? ????
const PATTI_DATA = {
    '1': ['100', '678', '777', '560', '470', '380', '290', '119', '137', '236', '146', '669', '579', '399', '588', '489', '245', '155', '227', '344', '335', '128'],
    '2': ['200', '345', '444', '570', '480', '390', '660', '129', '237', '336', '246', '679', '255', '147', '228', '499', '688', '778', '138', '156', '110', '569'],
    '3': ['300', '120', '111', '580', '490', '670', '238', '139', '337', '157', '346', '689', '355', '247', '256', '166', '599', '148', '788', '445', '229', '779'],
    '4': ['400', '789', '888', '590', '130', '680', '248', '149', '347', '158', '446', '699', '455', '266', '112', '356', '239', '338', '257', '220', '770', '167'],
    '5': ['500', '456', '555', '140', '230', '690', '258', '159', '357', '799', '267', '780', '447', '366', '113', '122', '177', '249', '339', '889', '348', '168'],
    '6': ['600', '123', '222', '150', '330', '240', '268', '169', '367', '448', '899', '178', '790', '466', '358', '880', '114', '556', '259', '349', '457', '277'],
    '7': ['700', '890', '999', '160', '340', '250', '278', '179', '377', '467', '115', '124', '223', '566', '557', '368', '359', '449', '269', '133', '188', '458'],
    '8': ['800', '567', '666', '170', '350', '260', '288', '189', '116', '233', '459', '125', '224', '477', '990', '134', '558', '369', '378', '440', '279', '468'],
    '9': ['900', '234', '333', '180', '360', '270', '450', '199', '117', '469', '126', '667', '478', '135', '225', '144', '379', '559', '289', '388', '577', '568'],
    '0': ['000', '127', '190', '280', '370', '460', '550', '235', '118', '578', '145', '479', '668', '299', '334', '488', '389', '226', '569', '677', '136', '244']
};

// ?????? ?????? ??????? ????[cite: 3]
const WORD_MAPPING = {
    'A': ['AXZ', 'BKP', 'LMO', 'RST', 'TUV', 'WXY', 'NOP', 'ABC', 'EFG', 'HIJ', 'KLM', 'QRS', 'UVW', 'XYZ', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'ZAB'],
    'B': ['BCA', 'CAB', 'DAB', 'DAC', 'EAC', 'FAD', 'GAD', 'HAD', 'JAD', 'KAD', 'LAD', 'MAD', 'NAD', 'PAD', 'RAD', 'SAD', 'TAD', 'VAD', 'WAD', 'YAD', 'ZAD', 'BAG'],
    'C': ['CAG', 'DAG', 'EAG', 'FAG', 'GAG', 'HAG', 'JAG', 'KAG', 'LAG', 'MAG', 'NAG', 'PAG', 'RAG', 'SAG', 'TAG', 'VAG', 'WAG', 'YAG', 'ZAG', 'BAK', 'CAK', 'DAK'],
    'D': ['EAK', 'FAK', 'GAK', 'HAK', 'JAK', 'KAK', 'LAK', 'MAK', 'NAK', 'PAK', 'RAK', 'SAK', 'TAK', 'VAK', 'WAK', 'YAK', 'ZAK', 'BAL', 'CAL', 'DAL', 'EAL', 'FAL'],
    'E': ['GAL', 'HAL', 'JAL', 'KAL', 'LAL', 'MAL', 'NAL', 'PAL', 'RAL', 'SAL', 'TAL', 'VAL', 'WAL', 'YAL', 'ZAL', 'BAM', 'CAM', 'DAM', 'EAM', 'FAM', 'GAM', 'HAM'],
    'F': ['JAM', 'KAM', 'LAM', 'MAM', 'NAM', 'PAM', 'RAM', 'SAM', 'TAM', 'VAM', 'WAM', 'YAM', 'ZAM', 'BAN', 'CAN', 'DAN', 'EAN', 'FAN', 'GAN', 'HAN', 'JAN', 'KAN'],
    'G': ['LAN', 'MAN', 'NAN', 'PAN', 'RAN', 'SAN', 'TAN', 'VAN', 'WAN', 'YAN', 'ZAN', 'BAP', 'CAP', 'DAP', 'EAP', 'FAP', 'GAP', 'HAP', 'JAP', 'KAP', 'LAP', 'MAP'],
    'H': ['NAP', 'PAP', 'RAP', 'SAP', 'TAP', 'VAP', 'WAP', 'YAP', 'ZAP', 'BAR', 'CAR', 'DAR', 'EAR', 'FAR', 'GAR', 'HAR', 'JAR', 'KAR', 'LAR', 'MAR', 'NAR', 'PAR'],
    'I': ['RAR', 'SAR', 'TAR', 'VAR', 'WAR', 'YAR', 'ZAR', 'BAS', 'CAS', 'DAS', 'EAS', 'FAS', 'GAS', 'HAS', 'JAS', 'KAS', 'LAS', 'MAS', 'NAS', 'PAS', 'RAS', 'SAS'],
    'J': ['TAS', 'VAS', 'WAS', 'YAS', 'ZAS', 'BAT', 'CAT', 'DAT', 'EAT', 'FAT', 'GAT', 'HAT', 'JAT', 'KAT', 'LAT', 'MAT', 'NAT', 'PAT', 'RAT', 'SAT', 'TAT', 'VAT']
};

// ??? ????? ???????? ????????? ??? (?? ?????? ?????)[cite: 3]
function loadGameBoard() {
    const container = document.getElementById('game-board-container');
    if (!container) return;
    
    let html = `<table class="patti-table">`;
    
    BOARD_ROWS.forEach(row => {
        html += `<tr><td class="row-header">${row.label} (${row.cat})</td>`;
        
        let pattiList = PATTI_DATA[row.label] || [];
        let wordList = WORD_MAPPING[row.cat] || [];
        
        // ???? ?????? ??? ?????? ???? ????[cite: 3]
        for(let i = 0; i < 22; i++) {
            let patti = pattiList[i] || '000';
            let word = wordList[i] || 'AAA';
            
            html += `
            <td class="patti-box" onclick="placeBet('${row.label}', '${i}', '${patti}', '${word}')">
                <div class="box-content">
                    <small>Pat: ${patti}</small><br>
                    <strong>Wrd: ${word}</strong>
                </div>
            </td>`;
        }
        html += `</tr>`;
    });
    
    html += `</table>`;
    container.innerHTML = html;
}

// ???? ???? ?????? ??? ????
function placeBet(rowLabel, colIndex, patti, word) {
    // ??? ????????? ?? ???? ??? ???? ??? ???? ?? (??? ??????? ???? ?????)
    if (!navigator.onLine) {
        alert("??????? ??????? ???! ???? ??? ????? ???");
        return;
    }
    console.log(`Bet Action -> Line: ${rowLabel}, Col: ${colIndex}, Pat: ${patti}, Wrd: ${word}`);
    alert(`????? ?????? ??????? ????:\n????: ${rowLabel}\n????: ${patti}\n??????: ${word}`);
}

// ==========================================
// ?? THE ONLINE ILLUSION (NET DETECTOR)
// ==========================================

function checkNetworkStatus() {
    const lockOverlay = document.getElementById('networkLock');
    if (!lockOverlay) return;

    if (navigator.onLine) {
        // ????????? ????? ??? ????, ??? ??????? ????
        lockOverlay.style.display = 'none';
    } else {
        // ????????? ???? ????? ?????????? ??? ??? ??????? ?? ??
        lockOverlay.style.display = 'flex';
    }
}

// ????? ? ??????? ???? ??????????? ????? ??? ???? ???????? ???
setInterval(checkNetworkStatus, 1000);

// ?????????? ?????? ????????? ?????? ???????
window.addEventListener('online', checkNetworkStatus);
window.addEventListener('offline', checkNetworkStatus);