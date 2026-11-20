/* =========================================================================
   Word Map — find the target word among a scattered, non-overlapping map.
   Words come from data/level_words.js (global `levelUnits`).
   ========================================================================= */

// ── Config ────────────────────────────────────────────────────────────────
const POINTS_CORRECT = 100;   // base points for a correct pick
const PENALTY_WRONG  = 15;    // points removed for a wrong pick (floored at 0)
const CORRECT_DELAY  = 750;   // ms to celebrate before the next word

// ── Settings (from start screen) ───────────────────────────────────────────
let numWordsToPractice = 20;
let mapSizeSetting     = 8;

// ── State ──────────────────────────────────────────────────────────────────
let selectedLevels = [];      // array of level keys (numbers as strings ok)
let pool           = [];      // unique words from all selected levels
let actualMapSize  = 8;       // effective words shown in a map
let practiceWords  = [];      // the target words, shuffled
let practiceIndex  = 0;
let currentTarget  = null;
let currentChips   = [];      // chip objects currently on the board
let wordStartTime  = 0;
let gameStartTime  = 0;

let score          = 0;
let mistakes       = 0;
let correctCount   = 0;
let locked         = false;   // blocks input during the correct-transition
let running        = false;

let timerInterval  = null;

// ── DOM ────────────────────────────────────────────────────────────────────
let startScreen, gameScreen, endScreen;
let board, targetWordEl, scoreEl, mistakesEl, progressEl, timerEl;
let levelButtonsWrap, numWordsSelect, mapSizeSelect, menuSummary, fxLayer;

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

function init() {
    startScreen    = document.getElementById('start-screen');
    gameScreen     = document.getElementById('game-screen');
    endScreen      = document.getElementById('end-screen');
    board          = document.getElementById('board');
    targetWordEl   = document.getElementById('target-word');
    scoreEl        = document.getElementById('score');
    mistakesEl     = document.getElementById('mistakes');
    progressEl     = document.getElementById('progress');
    timerEl        = document.getElementById('timer');
    levelButtonsWrap = document.getElementById('level-buttons');
    numWordsSelect = document.getElementById('num-words');
    mapSizeSelect  = document.getElementById('map-size');
    menuSummary    = document.getElementById('menu-summary');
    fxLayer        = document.getElementById('fx-layer');

    buildLevelButtons();
    updateSummary();

    numWordsSelect.addEventListener('change', updateSummary);
    mapSizeSelect.addEventListener('change', updateSummary);

    // Re-flow the map when the device rotates / resizes mid-game.
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(relayout, 120);
    });
}

// ── Start screen: level multi-select ───────────────────────────────────────
function buildLevelButtons() {
    const levels = (typeof levelUnits !== 'undefined' && levelUnits)
        ? Object.keys(levelUnits).sort((a, b) => Number(a) - Number(b))
        : [];

    if (!levels.length) {
        levelButtonsWrap.innerHTML = '<p style="color:#e74c3c">No word data found.</p>';
        return;
    }

    // Default: select the first (starter) level so the game is ready to play.
    selectedLevels = [levels[0]];

    levels.forEach(level => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'level-btn' + (selectedLevels.includes(level) ? ' selected' : '');
        btn.textContent = 'L' + level;
        btn.dataset.level = level;
        btn.addEventListener('click', () => toggleLevel(level, btn));
        levelButtonsWrap.appendChild(btn);
    });
}

function toggleLevel(level, btn) {
    const idx = selectedLevels.indexOf(level);
    if (idx >= 0) {
        selectedLevels.splice(idx, 1);
        btn.classList.remove('selected');
    } else {
        selectedLevels.push(level);
        btn.classList.add('selected');
    }
    updateSummary();
}

function updateSummary() {
    const levels = (typeof levelUnits !== 'undefined' && levelUnits) ? levelUnits : {};
    let total = 0;
    selectedLevels.forEach(l => {
        const units = levels[l] || {};
        Object.keys(units).forEach(u => { total += (units[u] || []).length; });
    });

    if (!selectedLevels.length) {
        menuSummary.textContent = '⚠️ Choose at least one level to begin.';
        menuSummary.classList.add('warn');
    } else {
        menuSummary.classList.remove('warn');
        menuSummary.textContent =
            `${selectedLevels.length} level(s) selected · ${total} words available`;
    }
}

// ── Build the word pool from selected levels ────────────────────────────────
function buildPool() {
    const levels = (typeof levelUnits !== 'undefined' && levelUnits) ? levelUnits : {};
    const set = new Set();
    selectedLevels.forEach(l => {
        const units = levels[l] || {};
        Object.keys(units).forEach(u => {
            (units[u] || []).forEach(w => {
                if (w && w.trim()) set.add(w.trim());
            });
        });
    });
    pool = Array.from(set);
}

// ── Game flow ──────────────────────────────────────────────────────────────
function startGame() {
    if (!selectedLevels.length) { updateSummary(); return; }

    numWordsToPractice = parseInt(numWordsSelect.value, 10) || 20;
    mapSizeSetting     = parseInt(mapSizeSelect.value, 10) || 8;

    buildPool();
    if (pool.length < 2) {
        menuSummary.textContent = '⚠️ Not enough words in the selected levels.';
        menuSummary.classList.add('warn');
        return;
    }

    // Effective map size: can't exceed the pool.
    actualMapSize = Math.max(2, Math.min(mapSizeSetting, pool.length));

    // Choose the target words for this round.
    practiceWords = shuffle(pool).slice(0, Math.min(numWordsToPractice, pool.length));
    practiceIndex = 0;

    // Reset stats.
    score = 0; mistakes = 0; correctCount = 0;
    locked = false; running = true;
    gameStartTime = performance.now();

    updateHud();
    startTimer();

    startScreen.classList.remove('active');
    endScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // Let the board get its layout, then render the first map.
    requestAnimationFrame(loadWord);
}

function loadWord() {
    if (!running) return;

    currentTarget = practiceWords[practiceIndex];

    // Distractors: distinct words from the pool that aren't the target.
    const others = shuffle(pool.filter(w => w !== currentTarget));
    const distractors = others.slice(0, Math.max(0, actualMapSize - 1));
    const mapWords = shuffle([currentTarget, ...distractors]);

    targetWordEl.textContent = currentTarget;
    progressEl.textContent = (practiceIndex + 1) + ' / ' + practiceWords.length;
    wordStartTime = performance.now();

    renderMap(mapWords);
}

function onChipClick(chip) {
    if (!running || locked || chip.dead) return;

    if (chip.word === currentTarget) {
        // ── Correct ──────────────────────────────────────────────────────
        locked = true;
        correctCount++;

        const elapsed = (performance.now() - wordStartTime) / 1000;
        const timeBonus = Math.max(0, Math.round(POINTS_CORRECT - elapsed * 20));
        const pts = POINTS_CORRECT + timeBonus;
        score += pts;

        chip.el.classList.remove('wrong');
        chip.el.classList.add('correct');
        playCorrect();
        showFloat(chip.el, '+' + pts, 'plus');
        updateHud();

        setTimeout(() => chip.el.classList.add('vanish'), 260);
        setTimeout(() => {
            locked = false;
            advance();
        }, CORRECT_DELAY);
    } else {
        // ── Wrong ────────────────────────────────────────────────────────
        mistakes++;
        score = Math.max(0, score - PENALTY_WRONG);
        chip.dead = true;
        chip.el.classList.add('wrong');
        playWrong();
        showFloat(chip.el, '−' + PENALTY_WRONG, 'minus');
        updateHud();

        setTimeout(() => {
            chip.el.classList.add('vanish');
            setTimeout(() => {
                if (chip.el.parentNode) chip.el.remove();
            }, 300);
        }, 380);
    }
}

function advance() {
    practiceIndex++;
    if (practiceIndex >= practiceWords.length) {
        endGame();
        return;
    }
    loadWord();
}

// ── Board layout (no overlap) ───────────────────────────────────────────────
function renderMap(words) {
    board.innerHTML = '';
    currentChips = words.map(word => {
        const el = document.createElement('div');
        el.className = 'chip';
        el.textContent = word;
        el.addEventListener('click', () => onChipClick(chip));
        board.appendChild(el);
        const chip = { word, el, w: 0, h: 0, x: 0, y: 0, dead: false };
        return chip;
    });

    relayout();
}

// Try progressively smaller font sizes until every chip fits without overlap.
function relayout() {
    if (!currentChips.length) return;
    const alive = currentChips.filter(c => c.el.isConnected);
    if (!alive.length) return;

    let fontSize = baseFontSize(alive.length);
    for (let attempt = 0; attempt < 12; attempt++) {
        measure(alive, fontSize);
        if (placeAll(alive, board.clientWidth, board.clientHeight, fontSize)) return;
        fontSize = Math.max(11, fontSize * 0.85);
        if (fontSize <= 11 && attempt > 2) break;
    }
    gridFallback(alive, fontSize);
}

function baseFontSize(n) {
    const w = board.clientWidth || 800;
    const h = board.clientHeight || 500;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * w / h)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cell = Math.min(w / cols, h / rows);
    return Math.max(14, Math.min(46, Math.round(cell * 0.3)));
}

function measure(chips, fontSize) {
    chips.forEach(c => {
        c.el.style.fontSize = fontSize + 'px';
        c.el.style.visibility = 'hidden';
        c.el.style.left = '0px';
        c.el.style.top = '0px';
    });
    void board.offsetWidth; // force reflow so measurements are accurate
    chips.forEach(c => {
        c.w = c.el.offsetWidth;
        c.h = c.el.offsetHeight;
    });
}

function placeAll(chips, bw, bh, fontSize) {
    const gap = Math.max(6, fontSize * 0.35);
    const margin = 6;
    const placed = [];

    // Place larger chips first (better packing), keep random positions.
    const order = chips.slice().sort((a, b) => (b.w * b.h) - (a.w * a.h));

    for (const c of order) {
        const pos = findSpot(c, bw, bh, margin, gap, placed);
        if (!pos) return false;
        c.x = pos.x; c.y = pos.y;
        placed.push({ x: c.x, y: c.y, w: c.w, h: c.h });
    }

    chips.forEach(c => {
        c.el.style.left = c.x + 'px';
        c.el.style.top = c.y + 'px';
        c.el.style.visibility = 'visible';
    });
    return true;
}

function findSpot(c, bw, bh, margin, gap, placed) {
    const maxX = bw - c.w - margin;
    const maxY = bh - c.h - margin;
    if (maxX < margin || maxY < margin) return null;

    // Random attempts first.
    for (let i = 0; i < 160; i++) {
        const x = margin + Math.random() * (maxX - margin);
        const y = margin + Math.random() * (maxY - margin);
        if (!overlaps(x, y, c.w, c.h, placed, gap)) return { x, y };
    }
    // Grid scan fallback to guarantee a free slot when one exists.
    const step = Math.max(4, gap * 0.6);
    for (let y = margin; y <= maxY; y += step) {
        for (let x = margin; x <= maxX; x += step) {
            if (!overlaps(x, y, c.w, c.h, placed, gap)) return { x, y };
        }
    }
    return null;
}

function overlaps(x, y, w, h, placed, gap) {
    for (const p of placed) {
        if (x < p.x + p.w + gap && x + w + gap > p.x &&
            y < p.y + p.h + gap && y + h + gap > p.y) {
            return true;
        }
    }
    return false;
}

// Last-resort tidy grid so nothing overlaps even on tiny screens.
function gridFallback(chips, fontSize) {
    const bw = board.clientWidth || 800;
    const bh = board.clientHeight || 500;
    const n = chips.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * bw / bh)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cellW = bw / cols;
    const cellH = bh / rows;

    // Shrink further to fit each cell.
    measure(chips, fontSize);
    const maxW = Math.max(...chips.map(c => c.w));
    const maxH = Math.max(...chips.map(c => c.h));
    const fit = Math.min(1, (cellW - 8) / (maxW || 1), (cellH - 8) / (maxH || 1));
    if (fit < 1) measure(chips, Math.max(10, Math.floor(fontSize * fit)));

    chips.forEach((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = col * cellW + (cellW - c.w) / 2;
        const cy = row * cellH + (cellH - c.h) / 2;
        c.el.style.left = Math.max(2, cx) + 'px';
        c.el.style.top = Math.max(2, cy) + 'px';
        c.el.style.visibility = 'visible';
    });
}

// ── HUD / timer / feedback ───────────────────────────────────────────────────
function updateHud() {
    scoreEl.textContent = score;
    mistakesEl.textContent = mistakes;
    if (running && practiceWords.length) {
        progressEl.textContent = (practiceIndex + 1) + ' / ' + practiceWords.length;
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerEl.textContent = '0:00';
    timerInterval = setInterval(() => {
        if (!running) return;
        timerEl.textContent = formatTime((performance.now() - gameStartTime) / 1000);
    }, 250);
}

function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function showFloat(anchorEl, text, cls) {
    const rect = anchorEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fx-float ' + cls;
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

// ── End game ─────────────────────────────────────────────────────────────────
function endGame() {
    running = false;
    locked = true;
    clearInterval(timerInterval);

    const totalSeconds = (performance.now() - gameStartTime) / 1000;
    const totalClicks = correctCount + mistakes;
    const accuracy = totalClicks > 0 ? Math.round((correctCount / totalClicks) * 100) : 100;

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = formatTime(totalSeconds);
    document.getElementById('final-mistakes').textContent = mistakes;
    document.getElementById('final-accuracy').textContent = accuracy + '%';
    document.getElementById('final-words').textContent = correctCount;

    playWin();

    gameScreen.classList.remove('active');
    endScreen.classList.add('active');
}

function restartGame() {
    endScreen.classList.remove('active');
    startGame();
}

function returnToMenu() {
    running = false;
    locked = false;
    clearInterval(timerInterval);
    endScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    board.innerHTML = '';
    currentChips = [];
    startScreen.classList.add('active');
    updateSummary();
}

// ── Audio (Web Audio API synth SFX) ──────────────────────────────────────────
let audioCtx = null;
function getAudio() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
}
function tone(freq, type, dur, vol = 0.2, delay = 0) {
    const ctx = getAudio();
    if (!ctx) return;
    try {
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur);
    } catch (e) {}
}
function playCorrect() {
    tone(523.25, 'sine', 0.14, 0.22, 0);
    tone(659.25, 'sine', 0.14, 0.22, 0.08);
    tone(783.99, 'sine', 0.22, 0.24, 0.16);
}
function playWrong() {
    tone(220, 'sawtooth', 0.18, 0.18, 0);
    tone(165, 'sawtooth', 0.22, 0.18, 0.12);
}
function playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(f, 'sine', 0.3, 0.22, i * 0.14));
}

// ── Fullscreen ───────────────────────────────────────────────────────────────
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
        document.exitFullscreen?.();
    }
}

// ── Utils ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}