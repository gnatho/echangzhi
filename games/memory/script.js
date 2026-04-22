// --- SYNTHESIZED AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const SoundFX = {
    playTone: (freq, type, duration, vol=0.1) => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    flip: () => SoundFX.playTone(400, 'sine', 0.1, 0.05),
    match: () => {
        SoundFX.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => SoundFX.playTone(800, 'sine', 0.2, 0.15), 100);
    },
    error: () => SoundFX.playTone(150, 'sawtooth', 0.3, 0.1),
    win: () => {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => SoundFX.playTone(freq, 'square', 0.3, 0.1), i * 150);
        });
    },
    lose: () => {
        [400, 350, 300, 200].forEach((freq, i) => {
            setTimeout(() => SoundFX.playTone(freq, 'sawtooth', 0.4, 0.1), i * 200);
        });
    }
};

// --- GAME STATE & CONSTANTS ---
const EMOJIS = ['🍎', '🌟', '🚗', '🎈', '🐶', '🍕', '🌈', '⚽', '🌙', '🎁', '🎸', '💎', '🚀', '🍔', '⚡'];

const DIFFICULTIES = {
    easy: { cols: 4, rows: 3, time: 45 },    // 12 cards (6 pairs)
    medium: { cols: 4, rows: 4, time: 60 },  // 16 cards (8 pairs)
    hard: { cols: 6, rows: 5, time: 120 }    // 30 cards (15 pairs)
};

let currentDifficulty = 'medium';
let currentLevel = 0;
let currentUnit = 0;
let tiles = [];
let selectedTiles = [];
let matchedPairs = 0;
let score = 0;
let isProcessing = false;
let timerEnabled = true;
let timeRemaining = 0;
let timerInterval = null;
let totalTime = 0;

// --- LEVEL & UNIT SELECTOR ---
function initLevelUnitSelectors() {
    const levelSelect = document.getElementById('level-select');
    const unitSelect = document.getElementById('unit-select');
    
    if (!levelSelect || !unitSelect) return;
    
    // Populate levels
    const levels = Object.keys(levelUnits).sort((a, b) => Number(a) - Number(b));
    levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = "Level " + level;
        levelSelect.appendChild(option);
    });
    
    // Set default values
    currentLevel = levels.length > 0 ? Number(levels[0]) : 0;
    levelSelect.value = currentLevel;
    populateUnits(currentLevel);
}

function populateUnits(level) {
    const unitSelect = document.getElementById('unit-select');
    if (!unitSelect) return;
    
    unitSelect.innerHTML = '';
    const units = Object.keys(levelUnits[level] || {}).sort((a, b) => Number(a) - Number(b));
    
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = "Unit " + unit;
        unitSelect.appendChild(option);
    });
    
    // Set default unit
    if (units.length > 0) {
        currentUnit = Number(units[0]);
        unitSelect.value = currentUnit;
    }
}

function onLevelChange() {
    const levelSelect = document.getElementById('level-select');
    if (levelSelect) {
        currentLevel = Number(levelSelect.value);
        populateUnits(currentLevel);
    }
}

function onUnitChange() {
    const unitSelect = document.getElementById('unit-select');
    if (unitSelect) {
        currentUnit = Number(unitSelect.value);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initLevelUnitSelectors);

// DOM Elements
const screens = {
    menu: document.getElementById('menu-screen'),
    game: document.getElementById('game-screen')
};
const gridEl = document.getElementById('memory-grid');
const scoreEl = document.getElementById('score');
const pairsEl = document.getElementById('pairs');
const totalPairsEl = document.getElementById('total-pairs');
const timerBar = document.getElementById('timer-bar');
const timerContainer = document.getElementById('timer-container');
const timerText = document.getElementById('timer-text');
const overlay = document.getElementById('result-overlay');

// --- GAME LOGIC ---

function startGame(difficulty) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    currentDifficulty = difficulty;
    const config = DIFFICULTIES[difficulty];
    timerEnabled = document.getElementById('timer-enabled').checked;
    
    // Switch screens
    screens.menu.classList.remove('active');
    screens.game.classList.active = true;
    screens.game.style.display = 'flex';
    
    setupBoard(config);
    startTimer(config.time);
}

function returnToMenu() {
    clearInterval(timerInterval);
    overlay.classList.remove('show');
    screens.game.style.display = 'none';
    screens.menu.classList.add('active');
}

function restartCurrentGame() {
    overlay.classList.remove('show');
    startGame(currentDifficulty);
}

function setupBoard(config) {
    // Reset Variables
    tiles = [];
    selectedTiles = [];
    matchedPairs = 0;
    score = 0;
    isProcessing = false;
    
    scoreEl.textContent = '0';
    pairsEl.textContent = '0';
    
    const numPairs = (config.cols * config.rows) / 2;
    totalPairsEl.textContent = numPairs;
    
    // Configure Grid Layout dynamically
    gridEl.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;

    // Set tile aspect ratio to fit the grid without overflow
    const availableHeight = window.innerHeight - 45; // account for top bar
    const availableWidth = window.innerWidth;
    const aspect = (availableWidth * config.rows) / (availableHeight * config.cols);
    document.documentElement.style.setProperty('--tile-aspect', aspect);
    
    // Get words from selected level and unit
    let words = [];
    if (levelUnits[currentLevel] && levelUnits[currentLevel][currentUnit]) {
        words = levelUnits[currentLevel][currentUnit].slice();
    }
    
    // If not enough words, fill with icons from EMOJIS
    let pairPool = [];
    if (words.length >= numPairs) {
        // Use only needed words
        const selectedWords = words.slice(0, numPairs);
        for(let i = 0; i < numPairs; i++) {
            pairPool.push(selectedWords[i], selectedWords[i]);
        }
    } else {
        // Use all available words, fill rest with icons
        const wordsCount = words.length;
        for(let i = 0; i < wordsCount; i++) {
            pairPool.push(words[i], words[i]);
        }
        
        // Fill remaining pairs with icons
        const iconsNeeded = numPairs - wordsCount;
        for(let i = 0; i < iconsNeeded; i++) {
            const icon = EMOJIS[i % EMOJIS.length];
            pairPool.push(icon, icon);
        }
    }
    
    // Shuffle
    pairPool.sort(() => Math.random() - 0.5);
    
    // Render Tiles
    gridEl.innerHTML = '';
    pairPool.forEach((content, index) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.index = index;
        
        tile.innerHTML = `
            <div class="tile-face tile-back">?</div>
            <div class="tile-face tile-front">${content}</div>
        `;
        
        tile.addEventListener('click', () => handleTileClick(index, tile, content));
        gridEl.appendChild(tile);
        
        tiles.push({ element: tile, symbol: content, matched: false, flipped: false });
    });
}

function handleTileClick(index, element, symbol) {
    if (isProcessing || tiles[index].flipped || tiles[index].matched) return;
    
    // Flip card
    SoundFX.flip();
    tiles[index].flipped = true;
    element.classList.add('flipped');
    selectedTiles.push({ index, element, symbol });
    
    if (selectedTiles.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    isProcessing = true;
    const [card1, card2] = selectedTiles;
    
    if (card1.symbol === card2.symbol) {
        // Match!
        setTimeout(() => SoundFX.match(), 300);
        tiles[card1.index].matched = true;
        tiles[card2.index].matched = true;
        
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        matchedPairs++;
        score += timerEnabled ? Math.max(10, Math.floor(timeRemaining * 1.5)) : 10;
        
        scoreEl.textContent = score;
        pairsEl.textContent = matchedPairs;
        
        selectedTiles = [];
        isProcessing = false;
        
        const numPairs = (DIFFICULTIES[currentDifficulty].cols * DIFFICULTIES[currentDifficulty].rows) / 2;
        if (matchedPairs === numPairs) endGame(true);
        
    } else {
        // Mismatch
        setTimeout(() => {
            SoundFX.error();
            card1.element.classList.add('shake');
            card2.element.classList.add('shake');
        }, 500);
        
        setTimeout(() => {
            tiles[card1.index].flipped = false;
            tiles[card2.index].flipped = false;
            card1.element.classList.remove('flipped', 'shake');
            card2.element.classList.remove('flipped', 'shake');
            
            score = Math.max(0, score - 5); // Penalty
            scoreEl.textContent = score;
            
            selectedTiles = [];
            isProcessing = false;
        }, 1200);
    }
}

// --- TIMER & ENDGAME ---

function startTimer(seconds, overrideTotalTime = null) {
    if (!timerEnabled) return;
    
    clearInterval(timerInterval);
    totalTime = overrideTotalTime || seconds;
    timeRemaining = seconds;
    
    timerContainer.classList.add('show-text');
    timerBar.className = '';
    timerBar.style.width = '100%';
    timerText.textContent = seconds;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        timerText.textContent = timeRemaining;
        const percentage = (timeRemaining / totalTime) * 100;
        timerBar.style.width = `${percentage}%`;
        
        if(percentage <= 30 && percentage > 10) timerBar.className = 'warning';
        if(percentage <= 10) timerBar.className = 'danger';
        
        if (timeRemaining <= 0) {
            endGame(false);
        }
    }, 1000);
}

function endGame(win) {
    clearInterval(timerInterval);
    isProcessing = true;
    
    const title = document.getElementById('result-title');
    const msg = document.getElementById('result-message');
    document.getElementById('final-score').textContent = score;
    
    if (win) {
        SoundFX.win();
        title.textContent = "🎉 You Win!";
        title.style.color = "#2ecc71";
        msg.textContent = timerEnabled ? `You finished with ${timeRemaining} seconds to spare!` : "You found all the pairs!";
    } else {
        SoundFX.lose();
        title.textContent = "⏳ Time's Up!";
        title.style.color = "#e74c3c";
        msg.textContent = `You found ${matchedPairs} pairs.`;
    }
    
    setTimeout(() => overlay.classList.add('show'), 500);
}

// Fullscreen
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
});