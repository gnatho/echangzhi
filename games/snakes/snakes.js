/* ═══════════════════════════════════════════════
   SNAKES & LADDERS — snakes.js
   • Cell 1 at bottom-left corner
   • SVG-drawn snakes (wavy, coloured) & ladders (rails + rungs)
   • Multiple tokens on same cell: smart layout offsets
   • No text input — teacher clicks ✓ Correct / ✗ Wrong
   • Smooth step-by-step movement animation
═══════════════════════════════════════════════ */

'use strict';

// ── Fallbacks if questions.js hasn't loaded ──────────────────────────────────
if (typeof SNAKES_LADDERS_CONFIG === 'undefined') {
    window.SNAKES_LADDERS_CONFIG = {
        playerTokens: [
            { id: 'rocket',   emoji: '🚀', name: 'Rocket'    },
            { id: 'star',     emoji: '⭐', name: 'Star'      },
            { id: 'gem',      emoji: '💎', name: 'Diamond'   },
            { id: 'crown',    emoji: '👑', name: 'Crown'     },
            { id: 'fire',     emoji: '🔥', name: 'Fire'      },
            { id: 'lightning',emoji: '⚡', name: 'Lightning' },
            { id: 'dragon',   emoji: '🐉', name: 'Dragon'    },
            { id: 'unicorn',  emoji: '🦄', name: 'Unicorn'   },
            { id: 'robot',    emoji: '🤖', name: 'Robot'     },
            { id: 'alien',    emoji: '👾', name: 'Alien'     },
            { id: 'ghost',    emoji: '👻', name: 'Ghost'     },
            { id: 'ninja',    emoji: '🥷', name: 'Ninja'     },
            { id: 'wizard',   emoji: '🧙', name: 'Wizard'    },
            { id: 'cat',      emoji: '🐱', name: 'Cat'       },
            { id: 'fox',      emoji: '🦊', name: 'Fox'       },
            { id: 'panda',    emoji: '🐼', name: 'Panda'     },
            { id: 'lion',     emoji: '🦁', name: 'Lion'      },
            { id: 'penguin',  emoji: '🐧', name: 'Penguin'   },
            { id: 'shark',    emoji: '🦈', name: 'Shark'     },
            { id: 'butterfly',emoji: '🦋', name: 'Butterfly' },
            { id: 'trophy',   emoji: '🏆', name: 'Trophy'    },
            { id: 'rainbow',  emoji: '🌈', name: 'Rainbow'   },
            { id: 'comet',    emoji: '☄️', name: 'Comet'    },
            { id: 'mushroom', emoji: '🍄', name: 'Mushroom'  },
        ]
    };
}

if (typeof snakesQuestions === 'undefined') {
    window.snakesQuestions = {};
}

// ── Colour palettes ──────────────────────────────────────────────────────────
const SNAKE_COLORS = [
    { body: '#e74c3c', outline: '#922b21', highlight: '#f1948a', belly: '#f5b7b1' },
    { body: '#8e44ad', outline: '#6c3483', highlight: '#c39bd3', belly: '#d7bde2' },
    { body: '#e67e22', outline: '#a04000', highlight: '#f0b27a', belly: '#fad7a0' },
    { body: '#16a085', outline: '#0e6655', highlight: '#76d7c4', belly: '#a9dfcf' },
    { body: '#2980b9', outline: '#1a5276', highlight: '#7fb3d3', belly: '#aed6f1' },
];

const LADDER_COLORS = [
    { rail: '#7d6608', rung: '#b7950b', shine: '#f4d03f' },
    { rail: '#6e2f1a', rung: '#935116', shine: '#d4856a' },
    { rail: '#1a5276', rung: '#2e86c1', shine: '#7fb3d3' },
    { rail: '#145a32', rung: '#1e8449', shine: '#76b041' },
];

// ── Game Config ──────────────────────────────────────────────────────────────
let CONFIG = {
    numPlayers: 2,
    gridSize: 10,
    difficulty: 6,
    skipWrongAnswer: true,
    soundEnabled: true,
    tokens: []
};

// ── Game State ───────────────────────────────────────────────────────────────
let gameState = {
    currentPlayer: 0,
    players: [],
    boardSize: 0,
    snakes: [],
    ladders: [],
    waitingForRoll: true,
    waitingForAnswer: false,
    currentQuestion: null,
    gameOver: false
};

// ── Audio ────────────────────────────────────────────────────────────────────
let audioCtx = null;

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playSound(type) {
    if (!CONFIG.soundEnabled) return;
    try {
        const ctx = getAudio();
        const makeTone = (freq, dur, waveType = 'sine', vol = 0.15, start = 0) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(vol, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur);
        };

        switch (type) {
            case 'roll':    makeTone(400, 0.1); break;
            case 'move':    makeTone(350, 0.08); break;
            case 'snake':   makeTone(200, 0.4, 'sawtooth'); break;
            case 'ladder':
                [300, 420, 560, 700].forEach((f, i) => makeTone(f, 0.15, 'sine', 0.15, i * 0.1));
                break;
            case 'correct':
                [523, 659, 784].forEach((f, i) => makeTone(f, 0.2, 'sine', 0.2, i * 0.1));
                break;
            case 'wrong':
                makeTone(180, 0.35, 'sawtooth', 0.2);
                break;
            case 'win':
                [523, 659, 784, 1047].forEach((f, i) => makeTone(f, 0.22, 'sine', 0.22, i * 0.16));
                break;
        }
    } catch (e) { /* audio not supported */ }
}

// ── Token Selection State ─────────────────────────────────────────────────────
// Maps playerIndex (1-4) → token index in SNAKES_LADDERS_CONFIG.playerTokens
const tokenSelections = { 1: 0, 2: 1, 3: 2, 4: 3 };

// ── DOM Init ─────────────────────────────────────────────────────────────────
function initDOM() {
    document.getElementById('num-players').addEventListener('change', updatePlayerCount);
    document.getElementById('grid-size').addEventListener('change', updateGridSize);
    updatePlayerCount();
    initializeTokenSelection();

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.token-dropdown.open').forEach(d => {
            d.classList.remove('open');
            d.previousElementSibling?.classList.remove('open');
        });
    });
}

function updatePlayerCount() {
    const count = parseInt(document.getElementById('num-players').value);
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`player${i}-token`);
        if (el) el.style.display = i <= count ? 'block' : 'none';
    }
    // Refresh dropdowns so "taken" state reflects active players
    for (let i = 1; i <= 4; i++) refreshDropdown(i);
}

function updateGridSize() {
    CONFIG.gridSize = parseInt(document.getElementById('grid-size').value);
}

// ── Token Picker ──────────────────────────────────────────────────────────────
function initializeTokenSelection() {
    const tokens = SNAKES_LADDERS_CONFIG.playerTokens;
    for (let p = 1; p <= 4; p++) {
        buildTokenWidget(p, tokens);
    }
}

function buildTokenWidget(p, tokens) {
    const container = document.querySelector(`#player${p}-token .token-options`);
    if (!container) return;

    const t = tokens[tokenSelections[p]];

    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'token-trigger';
    trigger.id = `token-trigger-p${p}`;
    trigger.type = 'button';
    trigger.innerHTML = `
        <span class="trigger-emoji">${t.emoji}</span>
        <span class="trigger-name">${t.name}</span>
        <span class="trigger-arrow">▾</span>`;

    trigger.addEventListener('click', e => {
        e.stopPropagation();
        const dropdown = document.getElementById(`token-dropdown-p${p}`);
        const isOpen   = dropdown.classList.contains('open');

        // Close all
        document.querySelectorAll('.token-dropdown.open').forEach(d => {
            d.classList.remove('open');
            d.previousElementSibling?.classList.remove('open');
        });

        if (!isOpen) {
            dropdown.classList.add('open');
            trigger.classList.add('open');
            refreshDropdown(p);
        }
    });

    // Dropdown grid
    const dropdown = document.createElement('div');
    dropdown.className = 'token-dropdown';
    dropdown.id = `token-dropdown-p${p}`;

    tokens.forEach((token, idx) => {
        const opt = document.createElement('div');
        opt.className = 'token-option';
        opt.textContent = token.emoji;
        opt.title = token.name;
        opt.dataset.idx = idx;
        opt.addEventListener('click', e => {
            e.stopPropagation();
            selectToken(p, idx);
        });
        dropdown.appendChild(opt);
    });

    container.innerHTML = '';
    container.appendChild(trigger);
    container.appendChild(dropdown);
    refreshDropdown(p);
}

function selectToken(playerNum, tokenIdx) {
    tokenSelections[playerNum] = tokenIdx;
    const tokens  = SNAKES_LADDERS_CONFIG.playerTokens;
    const t       = tokens[tokenIdx];
    const trigger = document.getElementById(`token-trigger-p${playerNum}`);

    if (trigger) {
        trigger.querySelector('.trigger-emoji').textContent = t.emoji;
        trigger.querySelector('.trigger-name').textContent  = t.name;
    }

    // Close this dropdown
    const dropdown = document.getElementById(`token-dropdown-p${playerNum}`);
    dropdown?.classList.remove('open');
    trigger?.classList.remove('open');

    // Refresh all dropdowns so "taken" badges update everywhere
    for (let i = 1; i <= 4; i++) refreshDropdown(i);
}

function refreshDropdown(playerNum) {
    const dropdown = document.getElementById(`token-dropdown-p${playerNum}`);
    if (!dropdown) return;

    // Collect tokens taken by OTHER active players
    const takenIdx = new Set();
    for (let op = 1; op <= 4; op++) {
        if (op === playerNum) continue;
        const el = document.getElementById(`player${op}-token`);
        if (el && el.style.display !== 'none') takenIdx.add(tokenSelections[op]);
    }

    dropdown.querySelectorAll('.token-option').forEach(opt => {
        const idx = parseInt(opt.dataset.idx);
        opt.classList.toggle('selected', idx === tokenSelections[playerNum]);
        opt.classList.toggle('taken',    takenIdx.has(idx) && idx !== tokenSelections[playerNum]);
    });
}

// ── Game Flow ─────────────────────────────────────────────────────────────────
function startGame() {
    try { getAudio().resume(); } catch (e) { }

    CONFIG.numPlayers       = parseInt(document.getElementById('num-players').value);
    CONFIG.gridSize         = parseInt(document.getElementById('grid-size').value);
    CONFIG.difficulty       = parseInt(document.getElementById('difficulty').value);
    CONFIG.skipWrongAnswer  = document.getElementById('skip-turn').checked;
    CONFIG.soundEnabled     = document.getElementById('sound-enabled').checked;

    CONFIG.tokens = [];
    const allTokens = SNAKES_LADDERS_CONFIG.playerTokens;
    for (let p = 1; p <= CONFIG.numPlayers; p++) {
        const t = allTokens[tokenSelections[p]] || allTokens[p - 1];
        CONFIG.tokens.push({ player: p, emoji: t.emoji, id: t.id });
    }

    gameState.boardSize = CONFIG.gridSize * CONFIG.gridSize;
    gameState.players   = [];
    gameState.gameOver  = false;
    gameState.currentPlayer = 0;

    for (let i = 0; i < CONFIG.numPlayers; i++) {
        gameState.players.push({
            id:       i,
            position: 1,         // start at cell 1 (bottom-left)
            token:    CONFIG.tokens[i].emoji,
            name:     `Player ${i + 1}`,
            skipNext: false
        });
    }

    generateSnakesAndLadders();

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').classList.add('active');

    createBoard();
    // Draw SVG after the browser has laid out the board
    requestAnimationFrame(() => requestAnimationFrame(() => {
        drawSnakesAndLadders();
        renderPlayers();
        updateTurnIndicator();
        renderPlayerCards();
    }));

    window.addEventListener('resize', onResize);
}

function onResize() {
    drawSnakesAndLadders();
}

// ── Board Generation ──────────────────────────────────────────────────────────
function generateSnakesAndLadders() {
    const size  = CONFIG.gridSize;
    const total = size * size;
    const sf    = total / 100;   // scale factor vs 10×10

    const clamp = n => Math.max(2, Math.min(total - 1, Math.round(n * sf)));

    gameState.snakes = [
        { start: clamp(99), end: clamp(54) },
        { start: clamp(70), end: clamp(35) },
        { start: clamp(52), end: clamp(29) },
        { start: clamp(25), end: clamp(8)  },
    ];

    if (size >= 8) {
        gameState.snakes.push({ start: clamp(87), end: clamp(65) });
    }
    if (size >= 10) {
        gameState.snakes.push({ start: clamp(62), end: clamp(43) });
    }

    gameState.ladders = [
        { start: clamp(3),  end: clamp(22) },
        { start: clamp(8),  end: clamp(31) },
        { start: clamp(15), end: clamp(44) },
        { start: clamp(36), end: clamp(57) },
    ];

    if (size >= 8) {
        gameState.ladders.push({ start: clamp(28), end: clamp(68) });
    }
    if (size >= 10) {
        gameState.ladders.push({ start: clamp(63), end: clamp(86) });
        gameState.ladders.push({ start: clamp(71), end: clamp(92) });
    }

    // Resolve collisions: remove snakes/ladders whose start == another's start
    const taken = new Set();
    const dedupe = arr => {
        const out = [];
        for (const item of arr) {
            if (!taken.has(item.start) && item.start !== item.end) {
                taken.add(item.start);
                out.push(item);
            }
        }
        return out;
    };
    gameState.snakes  = dedupe(gameState.snakes);
    gameState.ladders = dedupe(gameState.ladders);
}

// ── Board Creation ────────────────────────────────────────────────────────────
/*
  Standard Snakes & Ladders numbering:
    Bottom row  (row-from-bottom 0, even): 1, 2, 3, …, N   left → right
    Second row  (row-from-bottom 1, odd) : 2N, 2N-1, …, N+1 right → left
    …
    Top row     (row-from-bottom N-1): depends on parity
  Cell 1 is at BOTTOM-LEFT.
*/
function createBoard() {
    const board = document.getElementById('board');
    const size  = CONFIG.gridSize;

    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gridTemplateRows    = `repeat(${size}, 1fr)`;

    const snakeStartSet  = new Set(gameState.snakes.map(s => s.start));
    const ladderStartSet = new Set(gameState.ladders.map(l => l.start));

    // visualRow 0 = top row rendered first in DOM
    for (let visualRow = 0; visualRow < size; visualRow++) {
        const rowFromBottom = size - 1 - visualRow;   // 0 = bottom
        const rowStart = rowFromBottom * size + 1;     // lowest cell number in this row
        const rowEnd   = rowStart + size - 1;

        for (let visualCol = 0; visualCol < size; visualCol++) {
            // Even rows from bottom: left→right;  odd rows: right→left
            const cellNum = (rowFromBottom % 2 === 0)
                ? rowStart + visualCol
                : rowEnd   - visualCol;

            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.number = cellNum;

            // Checkerboard colour
            cell.classList.add((visualRow + visualCol) % 2 === 0 ? 'cell-light' : 'cell-dark');

            // Cell number label
            const numSpan = document.createElement('span');
            numSpan.className = 'cell-number';
            numSpan.textContent = cellNum;
            cell.appendChild(numSpan);

            // Special cells
            if (cellNum === 1) {
                cell.classList.add('cell-start');
                const lbl = document.createElement('span');
                lbl.className = 'cell-label';
                lbl.textContent = 'START';
                cell.appendChild(lbl);
            }

            if (cellNum === size * size) {
                cell.classList.add('cell-end');
                const icon = document.createElement('span');
                icon.className = 'cell-end-icon';
                icon.textContent = '🏆';
                cell.appendChild(icon);
            }

            // Tint for snake head / ladder base
            if (snakeStartSet.has(cellNum))  cell.classList.add('cell-snake');
            if (ladderStartSet.has(cellNum)) cell.classList.add('cell-ladder');

            board.appendChild(cell);
        }
    }
}

// ── SVG Snake & Ladder Drawing ────────────────────────────────────────────────
function getCellCenter(cellNum) {
    const wrapper = document.getElementById('board-wrapper');
    const cell    = document.getElementById('board').querySelector(`.cell[data-number="${cellNum}"]`);
    if (!cell || !wrapper) return null;

    const wr = wrapper.getBoundingClientRect();
    const cr = cell.getBoundingClientRect();

    return {
        x: cr.left - wr.left + cr.width  / 2,
        y: cr.top  - wr.top  + cr.height / 2,
        w: cr.width,
        h: cr.height
    };
}

function drawSnakesAndLadders() {
    const wrapper = document.getElementById('board-wrapper');
    const svg     = document.getElementById('snake-ladder-svg');
    if (!wrapper || !svg) return;

    const W = wrapper.offsetWidth;
    const H = wrapper.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width',  W);
    svg.setAttribute('height', H);
    svg.innerHTML = '';

    // Draw ladders behind snakes
    gameState.ladders.forEach((ladder, idx) => {
        drawLadder(svg, ladder.start, ladder.end, LADDER_COLORS[idx % LADDER_COLORS.length]);
    });

    gameState.snakes.forEach((snake, idx) => {
        drawSnake(svg, snake.start, snake.end, SNAKE_COLORS[idx % SNAKE_COLORS.length]);
    });
}

/* Draw a wavy snake from head (start, high number) to tail (end, low number) */
function drawSnake(svg, startPos, endPos, colors) {
    const head = getCellCenter(startPos);
    const tail = getCellCenter(endPos);
    if (!head || !tail) return;

    const dx  = tail.x - head.x;
    const dy  = tail.y - head.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    // Perpendicular unit vector for wave amplitude
    const px = -dy / len;
    const py =  dx / len;

    const cellSize   = head.w || 40;
    const bodyWidth  = Math.max(6, cellSize * 0.22);
    const waveAmp    = Math.min(len * 0.22, cellSize * 0.7);

    // Build wavy path using 5 cubic bezier segments
    const segments = 5;
    let d = `M ${fmt(head.x)} ${fmt(head.y)}`;

    for (let i = 0; i < segments; i++) {
        const sign = (i % 2 === 0) ? 1 : -1;
        const t0   = i / segments;
        const t1   = (i + 0.5) / segments;
        const t2   = (i + 1)   / segments;

        const cp1x = head.x + dx * (t0 + 0.2 * (1/segments)) + px * waveAmp * sign;
        const cp1y = head.y + dy * (t0 + 0.2 * (1/segments)) + py * waveAmp * sign;
        const cp2x = head.x + dx * (t2 - 0.2 * (1/segments)) + px * waveAmp * sign;
        const cp2y = head.y + dy * (t2 - 0.2 * (1/segments)) + py * waveAmp * sign;
        const epx  = head.x + dx * t2;
        const epy  = head.y + dy * t2;

        d += ` C ${fmt(cp1x)} ${fmt(cp1y)}, ${fmt(cp2x)} ${fmt(cp2y)}, ${fmt(epx)} ${fmt(epy)}`;
    }

    const g = svgEl('g');
    svg.appendChild(g);

    // Outline / shadow
    g.appendChild(makePath(d, { stroke: colors.outline, 'stroke-width': bodyWidth + 5,
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '0.5' }));

    // Body
    g.appendChild(makePath(d, { stroke: colors.body, 'stroke-width': bodyWidth,
        fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    // Belly stripe (lighter dashed)
    g.appendChild(makePath(d, { stroke: colors.highlight, 'stroke-width': bodyWidth * 0.35,
        fill: 'none', 'stroke-linecap': 'round',
        'stroke-dasharray': `${bodyWidth * 0.6} ${bodyWidth * 1.1}` }));

    // HEAD circle
    const hr = bodyWidth * 0.8;
    g.appendChild(makeCircle(head.x, head.y, hr + 3, { fill: colors.outline, opacity: '0.5' }));
    g.appendChild(makeCircle(head.x, head.y, hr,     { fill: colors.body }));

    // Eyes — perpendicular to the direction toward tail
    const ux = dx / len;  // unit vector toward tail
    const uy = dy / len;
    const eyeR   = hr * 0.32;
    const eyeOff = hr * 0.52;
    const eyeFwd = hr * 0.28;

    [1, -1].forEach(side => {
        const ex = head.x + px * eyeOff * side + ux * eyeFwd;
        const ey = head.y + py * eyeOff * side + uy * eyeFwd;
        g.appendChild(makeCircle(ex, ey, eyeR, { fill: 'white' }));
        g.appendChild(makeCircle(ex + ux * eyeR * 0.4, ey + uy * eyeR * 0.4, eyeR * 0.5, { fill: '#111' }));
    });

    // Forked tongue (small red lines at head)
    const tBase  = hr * 0.9;
    const tTipL  = hr * 0.6;
    const tFork  = hr * 0.4;
    const tlx    = head.x + ux * tBase;
    const tly    = head.y + uy * tBase;
    const tongueColor = '#ff3333';

    g.appendChild(makeLine(head.x + ux * hr * 0.8, head.y + uy * hr * 0.8,
                           tlx + ux * tTipL,        tly + uy * tTipL,
                           { stroke: tongueColor, 'stroke-width': eyeR * 0.9, 'stroke-linecap': 'round' }));
    g.appendChild(makeLine(tlx + ux * tTipL, tly + uy * tTipL,
                           tlx + ux * (tTipL + tFork) + px * tFork * 0.7, tly + uy * (tTipL + tFork) + py * tFork * 0.7,
                           { stroke: tongueColor, 'stroke-width': eyeR * 0.7, 'stroke-linecap': 'round' }));
    g.appendChild(makeLine(tlx + ux * tTipL, tly + uy * tTipL,
                           tlx + ux * (tTipL + tFork) - px * tFork * 0.7, tly + uy * (tTipL + tFork) - py * tFork * 0.7,
                           { stroke: tongueColor, 'stroke-width': eyeR * 0.7, 'stroke-linecap': 'round' }));
}

/* Draw a ladder from bottom (start) to top (end) */
function drawLadder(svg, startPos, endPos, colors) {
    const bottom = getCellCenter(startPos);
    const top    = getCellCenter(endPos);
    if (!bottom || !top) return;

    const dx  = top.x - bottom.x;
    const dy  = top.y - bottom.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const px = -dy / len;
    const py =  dx / len;

    const cellSize  = bottom.w || 40;
    const halfWidth = Math.min(cellSize * 0.28, 18);
    const railW     = Math.max(3, halfWidth * 0.35);
    const rungW     = Math.max(2.5, halfWidth * 0.28);
    const numRungs  = Math.max(3, Math.round(len / (cellSize * 0.6)));

    const g = svgEl('g');
    svg.appendChild(g);

    // Shadow
    [-1, 1].forEach(side => {
        g.appendChild(makeLine(
            bottom.x + px * halfWidth * side + 2, bottom.y + py * halfWidth * side + 3,
            top.x    + px * halfWidth * side + 2, top.y    + py * halfWidth * side + 3,
            { stroke: 'rgba(0,0,0,0.25)', 'stroke-width': railW + 2, 'stroke-linecap': 'round' }
        ));
    });

    // Rails
    [-1, 1].forEach(side => {
        g.appendChild(makeLine(
            bottom.x + px * halfWidth * side, bottom.y + py * halfWidth * side,
            top.x    + px * halfWidth * side, top.y    + py * halfWidth * side,
            { stroke: colors.rail, 'stroke-width': railW, 'stroke-linecap': 'round' }
        ));
    });

    // Rungs
    for (let i = 0; i <= numRungs; i++) {
        const t  = i / numRungs;
        const rx = bottom.x + dx * t;
        const ry = bottom.y + dy * t;

        // Shadow
        g.appendChild(makeLine(
            rx - px * halfWidth + 2, ry - py * halfWidth + 2,
            rx + px * halfWidth + 2, ry + py * halfWidth + 2,
            { stroke: 'rgba(0,0,0,0.18)', 'stroke-width': rungW + 2, 'stroke-linecap': 'round' }
        ));

        // Rung body
        g.appendChild(makeLine(
            rx - px * halfWidth, ry - py * halfWidth,
            rx + px * halfWidth, ry + py * halfWidth,
            { stroke: colors.rung, 'stroke-width': rungW, 'stroke-linecap': 'round' }
        ));

        // Highlight on rung
        g.appendChild(makeLine(
            rx - px * halfWidth * 0.6, ry - py * halfWidth * 0.6,
            rx + px * halfWidth * 0.6, ry + py * halfWidth * 0.6,
            { stroke: colors.shine, 'stroke-width': rungW * 0.35, 'stroke-linecap': 'round', opacity: '0.6' }
        ));
    }
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function setAttrs(el, attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function makePath(d, attrs)               { return setAttrs(svgEl('path'),   { d, ...attrs }); }
function makeCircle(cx, cy, r, attrs)     { return setAttrs(svgEl('circle'), { cx: fmt(cx), cy: fmt(cy), r: fmt(r), ...attrs }); }
function makeLine(x1, y1, x2, y2, attrs) {
    return setAttrs(svgEl('line'), { x1: fmt(x1), y1: fmt(y1), x2: fmt(x2), y2: fmt(y2), ...attrs });
}

function fmt(n) { return Math.round(n * 10) / 10; }

// ── Player Rendering ──────────────────────────────────────────────────────────
/*
  Groups players by position so that multiple tokens on the same cell
  are laid out with smart offsets (no overlap).
*/
function renderPlayers() {
    // Remove existing tokens
    document.querySelectorAll('.token-on-board').forEach(el => el.remove());

    const board = document.getElementById('board');

    // Group by position
    const byPos = {};
    gameState.players.forEach(player => {
        if (!byPos[player.position]) byPos[player.position] = [];
        byPos[player.position].push(player);
    });

    Object.entries(byPos).forEach(([pos, players]) => {
        const cell = board.querySelector(`.cell[data-number="${pos}"]`);
        if (!cell) return;

        const count = players.length;

        players.forEach((player, idx) => {
            const token = document.createElement('div');
            token.className = 'token-on-board';
            token.id = `token-p${player.id}`;
            token.textContent = player.token;
            token.dataset.player = player.id;

            if (count === 1) {
                token.classList.add('solo');
                // default CSS positions it at centre
            } else {
                token.classList.add('multi');
                token.classList.add(`pos-${idx}-of-${count}`);
            }

            cell.appendChild(token);
        });
    });
}

// ── Player Cards ──────────────────────────────────────────────────────────────
function renderPlayerCards() {
    const container = document.getElementById('player-cards');
    container.innerHTML = '';

    gameState.players.forEach((player, idx) => {
        const card = document.createElement('div');
        card.className = [
            'player-card',
            idx === gameState.currentPlayer ? 'active'    : '',
            player.skipNext                 ? 'skip-turn' : ''
        ].join(' ').trim();
        card.id = `player-card-${idx}`;

        card.innerHTML = `
            <div class="player-token-icon">${player.token}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">Square ${player.position}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ── Turn Indicator ────────────────────────────────────────────────────────────
function updateTurnIndicator() {
    const player = gameState.players[gameState.currentPlayer];
    const indicator = document.getElementById('turn-indicator');
    const dice      = document.getElementById('dice');
    const diceValue = document.getElementById('dice-value');

    if (player.skipNext) {
        indicator.textContent = `${player.name} ${player.token} — Skipping Turn`;
        dice.textContent = '⏭️';
        diceValue.textContent = 'Skip';
    } else {
        indicator.textContent = `${player.name}'s Turn ${player.token}`;
        dice.textContent = '🎲';
        diceValue.textContent = gameState.waitingForRoll ? 'Click!' : '';
    }
}

// ── Dice ──────────────────────────────────────────────────────────────────────
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function rollDice() {
    if (!gameState.waitingForRoll || gameState.gameOver) return;

    const player      = gameState.players[gameState.currentPlayer];
    const dice        = document.getElementById('dice');
    const diceValue   = document.getElementById('dice-value');
    const diceOverlay = document.getElementById('dice-overlay');
    const diceCube    = document.getElementById('dice-cube');
    const faces       = diceCube.querySelectorAll('.dice-face');

    if (player.skipNext) {
        player.skipNext = false;
        renderPlayerCards();
        nextTurn();
        return;
    }

    gameState.waitingForRoll = false;
    playSound('roll');

    diceOverlay.classList.add('active');
    diceCube.classList.add('rolling');

    const setFaceDots = (faceIndex, num) => {
        const face = faces[faceIndex];
        face.innerHTML = '';
        const positions = {
            1: [4],
            2: [0, 8],
            3: [0, 4, 8],
            4: [0, 2, 6, 8],
            5: [0, 2, 4, 6, 8],
            6: [0, 2, 3, 5, 6, 8]
        };
        (positions[num] || [4]).forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            // Place dot in the right grid cell (empty others act as spacers)
            dot.style.gridColumn = (pos % 3) + 1;
            dot.style.gridRow    = Math.floor(pos / 3) + 1;
            face.appendChild(dot);
        });
    };

    setFaceDots(0, 1);
    setFaceDots(1, 6);
    setFaceDots(2, 3);
    setFaceDots(3, 4);
    setFaceDots(4, 2);
    setFaceDots(5, 5);

    const rollResult = Math.floor(Math.random() * 6) + 1;
    let ticks = 0;

    const interval = setInterval(() => {
        ticks++;
        [0, 1, 2, 3, 4, 5].forEach(i => {
            const fake = Math.floor(Math.random() * 6) + 1;
            setFaceDots(i, fake);
        });
        if (ticks >= 16) {
            clearInterval(interval);
            setFaceDots(0, rollResult);
            setFaceDots(1, 7 - rollResult);
            diceCube.classList.remove('rolling');
            diceCube.classList.add('settling');

            setTimeout(() => {
                diceCube.classList.remove('settling');
                diceCube.classList.add('shrinking');
                setTimeout(() => {
                    diceCube.classList.remove('shrinking');
                    diceOverlay.classList.remove('active');
                    dice.textContent = DICE_FACES[rollResult - 1];
                    diceValue.textContent = rollResult;
                    dice.classList.add('result-shown');
                    setTimeout(() => movePlayer(rollResult), 450);
                }, 500);
            }, 350);
        }
    }, 70);
}

// ── Movement ──────────────────────────────────────────────────────────────────
function movePlayer(steps) {
    const player      = gameState.players[gameState.currentPlayer];
    const oldPosition = player.position;
    let   newPosition = Math.min(oldPosition + steps, gameState.boardSize);

    animateMovement(player, oldPosition, newPosition, () => {
        player.position = newPosition;
        renderPlayers();
        renderPlayerCards();

        if (player.position >= gameState.boardSize) {
            endGame();
            return;
        }

        const snake  = gameState.snakes.find(s => s.start === player.position);
        const ladder = gameState.ladders.find(l => l.start === player.position);

        if (snake) {
            playSound('snake');
            showSlideMessage('🐍 Snake! Sliding down…', '#e74c3c');
            setTimeout(() => {
                animateMovement(player, player.position, snake.end, () => {
                    player.position = snake.end;
                    renderPlayers();
                    renderPlayerCards();
                    showQuestion();
                });
            }, 600);
        } else if (ladder) {
            playSound('ladder');
            showSlideMessage('🪜 Ladder! Climbing up!', '#27ae60');
            setTimeout(() => {
                animateMovement(player, player.position, ladder.end, () => {
                    player.position = ladder.end;
                    renderPlayers();
                    renderPlayerCards();
                    showQuestion();
                });
            }, 600);
        } else {
            showQuestion();
        }
    });
}

/* Brief banner shown for snake/ladder events */
function showSlideMessage(msg, color) {
    const indicator = document.getElementById('turn-indicator');
    const original  = indicator.textContent;
    indicator.textContent = msg;
    indicator.style.color = color;
    setTimeout(() => {
        indicator.textContent = original;
        indicator.style.color = '';
    }, 1200);
}

/* Step-by-step movement animation; uses data-number cell lookup */
function animateMovement(player, fromPos, toPos, callback) {
    const board = document.getElementById('board');
    const token = document.getElementById(`token-p${player.id}`);

    if (!token || fromPos === toPos) {
        if (callback) callback();
        return;
    }

    const direction = toPos > fromPos ? 1 : -1;
    let   current   = fromPos;
    const stepMs    = Math.max(60, Math.min(180, 1200 / Math.abs(toPos - fromPos)));

    const interval = setInterval(() => {
        current += direction;

        const cell = board.querySelector(`.cell[data-number="${current}"]`);
        if (cell) {
            cell.appendChild(token);
            // Reset positioning to centre (solo-style) during animation
            token.className = 'token-on-board solo moving';
            token.style.top  = '';
            token.style.left = '';
            token.style.transform = '';
            setTimeout(() => token.classList.remove('moving'), stepMs * 0.8);
            playSound('move');
        }

        if (current === toPos) {
            clearInterval(interval);
            setTimeout(() => callback && callback(), stepMs * 0.5);
        }
    }, stepMs);
}

// ── Question Handling ─────────────────────────────────────────────────────────
function showQuestion() {
    const level = `level${CONFIG.difficulty}`;
    let questionText  = '(Ask the student your question)';
    let levelName     = `Level ${CONFIG.difficulty}`;
    let levelDesc     = '';

    if (typeof snakesQuestions !== 'undefined') {
        const lq = snakesQuestions[level];
        if (lq && lq.questions && lq.questions.length > 0) {
            const q    = lq.questions[Math.floor(Math.random() * lq.questions.length)];
            gameState.currentQuestion = q;
            questionText = q.question;
            levelName    = lq.name        || levelName;
            levelDesc    = lq.description || '';
        }
    }

    document.getElementById('question-title').textContent = levelName;
    document.getElementById('question-level').textContent = levelDesc;
    document.getElementById('question-text').textContent  = questionText;
    document.getElementById('question-type').textContent  = '';

    const resultEl = document.getElementById('question-result');
    resultEl.style.display = 'none';
    resultEl.className = '';

    // Enable judge buttons
    document.getElementById('correct-btn').disabled = false;
    document.getElementById('wrong-btn').disabled   = false;

    document.getElementById('question-modal').classList.add('show');
    gameState.waitingForAnswer = true;
}

function submitCorrect() {
    if (!gameState.waitingForAnswer) return;
    gameState.waitingForAnswer = false;

    document.getElementById('correct-btn').disabled = true;
    document.getElementById('wrong-btn').disabled   = true;

    playSound('correct');

    const resultEl = document.getElementById('question-result');
    resultEl.textContent = '✓ Correct! Well done!';
    resultEl.className   = 'correct';
    resultEl.style.display = 'block';

    gameState.players[gameState.currentPlayer].skipNext = false;

    setTimeout(() => {
        document.getElementById('question-modal').classList.remove('show');
        nextTurn();
    }, 900);
}

function submitWrong() {
    if (!gameState.waitingForAnswer) return;
    gameState.waitingForAnswer = false;

    document.getElementById('correct-btn').disabled = true;
    document.getElementById('wrong-btn').disabled   = true;

    playSound('wrong');

    const resultEl = document.getElementById('question-result');

    if (CONFIG.skipWrongAnswer) {
        resultEl.textContent = '✗ Wrong! Miss your next turn.';
        gameState.players[gameState.currentPlayer].skipNext = true;
    } else {
        resultEl.textContent = '✗ Wrong! Try again next turn.';
        gameState.players[gameState.currentPlayer].skipNext = false;
    }

    resultEl.className     = 'wrong';
    resultEl.style.display = 'block';

    setTimeout(() => {
        document.getElementById('question-modal').classList.remove('show');
        nextTurn();
    }, 900);
}

// ── Turn Management ───────────────────────────────────────────────────────────
function nextTurn() {
    gameState.currentPlayer  = (gameState.currentPlayer + 1) % CONFIG.numPlayers;
    gameState.waitingForRoll = true;
    updateTurnIndicator();
    renderPlayerCards();
}

// ── End Game ──────────────────────────────────────────────────────────────────
function endGame() {
    gameState.gameOver = true;
    playSound('win');

    const winner = gameState.players[gameState.currentPlayer];
    document.getElementById('winner-text').textContent = `${winner.name} Wins! ${winner.token}`;
    document.getElementById('winner-emoji').textContent = '🏆';

    const positionsDiv = document.getElementById('final-positions');
    positionsDiv.innerHTML = '';

    const sorted = [...gameState.players].sort((a, b) => b.position - a.position);
    const medals = ['🥇', '🥈', '🥉', '4️⃣'];

    sorted.forEach((player, idx) => {
        const div = document.createElement('div');
        div.className = 'final-position';
        div.innerHTML = `
            <span class="place">${medals[idx] || '•'}</span>
            <span class="token">${player.token}</span>
            <span class="name">${player.name}</span>
            <span class="pos">Square ${player.position}</span>
        `;
        positionsDiv.appendChild(div);
    });

    document.getElementById('win-screen').classList.add('show');
}

// ── Navigation ────────────────────────────────────────────────────────────────
function playAgain() {
    document.getElementById('win-screen').classList.remove('show');
    window.removeEventListener('resize', onResize);
    startGame();
}

function goToMenu() {
    document.getElementById('win-screen').classList.remove('show');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').style.display = 'flex';
    window.removeEventListener('resize', onResize);

    gameState = {
        currentPlayer: 0, players: [], boardSize: 0,
        snakes: [], ladders: [],
        waitingForRoll: true, waitingForAnswer: false,
        currentQuestion: null, gameOver: false
    };
}

function goBack() {
    // Try navigating up; fall back to start screen
    try {
        if (window.history.length > 1) { window.history.back(); return; }
    } catch (e) { }
    goToMenu();
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && gameState.waitingForRoll && !gameState.gameOver) {
        e.preventDefault();
        rollDice();
    }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDOM);
