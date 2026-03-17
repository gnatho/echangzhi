// ==================== AUDIO SYNTHESIZER ====================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration, vol=0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Specific Sound Effects
function soundTick() { playTone(800, 'triangle', 0.05, 0.05); }
function soundPop() { playTone(400, 'sine', 0.15, 0.2); }
function soundNeutral() { playTone(300, 'triangle', 0.2, 0.15); }

function soundWin() {
    if(!audioCtx) return;
    // Cheerful arpeggio
    const now = audioCtx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i*0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + i*0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i*0.1);
        osc.stop(now + i*0.1 + 0.3);
    });
}

function soundLose() {
    if(!audioCtx) return;
    // Womp womp
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
}

function soundGoldenStar() {
    const now = audioCtx.currentTime;
    for(let i=0; i<12; i++) {
        setTimeout(() => {
            playTone(1000 + (i * 200), 'sine', 0.1, 0.08);
        }, i * 50);
    }
}

// Listen for first interaction to enable audio
document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });


// ==================== WORD FORMATTING ====================
function formatWord(word) {
    return word.replace(/\[([^\]]+)\]/g, '<span style="color: #e74c3c;">$1</span>');
}

const scoreWeights = [
    { score: '+2', weight: 25 },
    { score: '+1', weight: 35 },
    { score: '0', weight: 30 },
    { score: '-1', weight: 10 }
];

const starSVG = `<svg viewBox="0 0 24 24" style="fill: #f1c40f; filter: drop-shadow(0 2px 4px rgba(241,196,15,0.6));">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;

function calculateGridLayout(wordCount) {
    if (wordCount <= 4) return { cols: 2, rows: 2 };
    if (wordCount <= 6) return { cols: 3, rows: 2 };
    if (wordCount <= 9) return { cols: 3, rows: 3 };
    if (wordCount <= 12) return { cols: 4, rows: 3 };
    if (wordCount <= 16) return { cols: 4, rows: 4 };
    if (wordCount <= 20) return { cols: 5, rows: 4 };
    return { cols: 6, rows: Math.ceil(wordCount / 6) };
}

// ==================== DOM ELEMENTS ====================
const gridElement = document.getElementById('grid');
const modeSelector = document.getElementById('modeSelector');
const selectorElement = document.getElementById('wordSetSelector');
const levelSelector = document.getElementById('levelSelector');
const unitSelector = document.getElementById('unitSelector');
const grammarActivitySelector = document.getElementById('grammarActivitySelector');
const grammarContainer = document.getElementById('grammarContainer');

let starCellIndex = -1;

// ==================== INITIALIZATION ====================
function init() {
    generateGrid();
    modeSelector.addEventListener('change', handleModeChange);
    selectorElement.addEventListener('change', generateGrid);
    levelSelector.addEventListener('change', handleModeChange);
    unitSelector.addEventListener('change', handleModeChange);
    grammarActivitySelector.addEventListener('change', generateGrammarActivity);
}

function handleModeChange() {
    const mode = modeSelector.value;
    
    // Hide all selectors first
    selectorElement.style.display = 'none';
    levelSelector.style.display = 'none';
    unitSelector.style.display = 'none';
    grammarActivitySelector.style.display = 'none';
    
    // Hide containers
    gridElement.style.display = 'none';
    grammarContainer.style.display = 'none';
    
    if (mode === 'phonemes') {
        selectorElement.style.display = 'block';
        gridElement.style.display = 'grid';
        generateGrid();
    } else if (mode === 'levels') {
        levelSelector.style.display = 'block';
        unitSelector.style.display = 'block';
        gridElement.style.display = 'grid';
        generateGrid();
    } else if (mode === 'grammar') {
        levelSelector.style.display = 'block';
        unitSelector.style.display = 'block';
        grammarActivitySelector.style.display = 'block';
        grammarContainer.style.display = 'flex';
        generateGrammarActivity();
    }
}

function generateGrid() {
    const mode = modeSelector.value;
    let words = [];
    let usePhonemes = true;
    
    if (mode === 'phonemes') {
        const selectedSet = selectorElement.value;
        words = [...(phonemeSets[selectedSet] || [])];
        
        // If there are more than 30 words, let's just pick 30 randomly so the grid doesn't get too small,
        // but you can adjust this slice if you want all of them on screen at once.
        if(words.length > 30) {
           words = words.sort(() => 0.5 - Math.random()).slice(0, 30);
        }
    } else {
        words = [...(levelUnits[levelSelector.value]?.[unitSelector.value] || [])];
        usePhonemes = false;
    }
    
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }

    gridElement.innerHTML = '';
    const layout = calculateGridLayout(words.length);
    gridElement.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

    starCellIndex = Math.floor(Math.random() * words.length);

    for (let i = 0; i < words.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.cellIndex = i;
        
        if (usePhonemes) {
            cell.innerHTML = `<span class="word-text">${formatWord(words[i])}</span>`;
        } else {
            cell.innerHTML = `<span class="word-text">${words[i]}</span>`;
        }
        
        cell.addEventListener('click', function() { handleCellClick(this); }, { once: true });
        gridElement.appendChild(cell);
    }
}

function getWeightedRandomScore() {
    const totalWeight = scoreWeights.reduce((sum, item) => sum + item.weight, 100);
    let random = Math.random() * totalWeight;
    for (const item of scoreWeights) {
        random -= item.weight;
        if (random <= 0) return item.score;
    }
    return '+1';
}

function handleCellClick(cellElement) {
    initAudio(); // Ensure audio is ready
    
    const cellIndex = parseInt(cellElement.dataset.cellIndex);
    const isStar = cellIndex === starCellIndex;
    const score = isStar ? '+2' : getWeightedRandomScore();
    
    let colorClass = '', animationClass = '';
    
    if (isStar) {
        colorClass = 'score-2';
        animationClass = 'animate-star';
        soundGoldenStar();
    } else if (score === '+2') {
        colorClass = 'score-2';
        animationClass = 'animate-bounce';
        soundWin();
    } else if (score === '+1') {
        colorClass = 'score-1';
        animationClass = 'animate-pop';
        soundPop();
    } else if (score === '0') {
        colorClass = 'score-0';
        animationClass = 'animate-fade';
        soundNeutral();
    } else {
        colorClass = 'score-n1';
        animationClass = 'animate-shake';
        soundLose();
    }

    cellElement.className = `cell ${colorClass} ${animationClass}`;
    
    if (isStar) {
        cellElement.innerHTML = starSVG;
    } else {
        cellElement.innerHTML = `<span class="score-text">${score}</span>`;
    }
}

init();

// ==================== UPGRADED SPIN WHEEL ====================
// Exactly 12 segments. Carefully ordered so NO identical values are adjacent.
const wheelSegments = ['+1', '+2', '+1', '+3', '+1', '0', '+2', '-1', '+1', '+3', '+2', '0'];

// Friendly bright color palette
const friendlyColors = {
    '+3': '#f1c40f', // Sun Yellow
    '+2': '#2ecc71', // Emerald Green
    '+1': '#3498db', // Sky Blue
    '0':  '#9b59b6', // Amethyst Purple
    '-1': '#e74c3c'  // Coral Red
};

let currentRotation = 0;
let isSpinning = false;
let tickInterval;

function createWheel() {
    const wheel = document.getElementById('wheel');
    const numSegments = wheelSegments.length; // 12
    const TWO_PI = 2 * Math.PI;
    const segmentAngle = TWO_PI / numSegments;
    const cx = 150, cy = 150, r = 148;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 300');

    wheelSegments.forEach((value, index) => {
        const startAngle = index * segmentAngle - Math.PI / 2;
        const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        // Draw pie slice
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`);
        path.setAttribute('fill', friendlyColors[value]);
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '2');
        svg.appendChild(path);

        // Add text
        const midAngle = startAngle + segmentAngle / 2;
        const textR = r * 0.70;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);
        const rotateDeg = (midAngle * 180 / Math.PI) + 90;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', tx);
        text.setAttribute('y', ty);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', value === '+3' ? '24' : '20');
        text.setAttribute('font-weight', '900');
        text.setAttribute('transform', `rotate(${rotateDeg}, ${tx}, ${ty})`);
        
        // Add a slight text shadow for better readability
        text.setAttribute('style', 'text-shadow: 1px 1px 3px rgba(0,0,0,0.3);');
        text.textContent = value;
        svg.appendChild(text);
    });

    wheel.innerHTML = '';
    wheel.appendChild(svg);
}

function openWheelModal() {
    initAudio(); // Ensure audio is ready
    const modal = document.getElementById('wheelModal');
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = false;
    spinBtn.textContent = 'SPIN';
    isSpinning = false;
    createWheel();
    modal.classList.add('active');
}

function closeWheelModal() {
    if (isSpinning) return;
    document.getElementById('wheelModal').classList.remove('active');
}

function closeFullscreenResult() {
    document.getElementById('fullscreenResult').classList.remove('active');
    closeWheelModal(); // Auto-close wheel modal as well
}

function spinWheel() {
    if (isSpinning) return;
    initAudio();
    
    isSpinning = true;
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    // Pick a winning segment index (0 to 11)
    const targetIndex = Math.floor(Math.random() * 12);
    const finalResult = wheelSegments[targetIndex];
    
    // Calculate math to land exactly in the center of the target segment
    // 1 segment = 30 degrees. 
    // Pointer is at the top (which corresponds to segment 0 initially).
    const segmentAngle = 360 / 12; // 30
    const targetAngle = 360 - (targetIndex * segmentAngle) - (segmentAngle / 2);
    
    // Add 5 full spins
    const spins = 5;
    const newRotation = currentRotation + (spins * 360) + targetAngle - (currentRotation % 360);
    currentRotation = newRotation;
    
    // Start spinning
    wheel.style.transform = `rotate(${newRotation}deg)`;

    // Play ticking sound while spinning
    let ticks = 0;
    const maxTicks = 20;
    tickInterval = setInterval(() => {
        soundTick();
        ticks++;
        if (ticks >= maxTicks) clearInterval(tickInterval); // slow down ticks towards the end
    }, 180);

    // Wait for animation to finish (4s)
    setTimeout(() => {
        clearInterval(tickInterval);
        
        // Set and show full screen result
        const fsOverlay = document.getElementById('fullscreenResult');
        const fsText = document.getElementById('fsResultText');
        
        fsText.textContent = finalResult;
        fsText.style.color = friendlyColors[finalResult];
        fsOverlay.classList.add('active');

        // Play appropriate result sound
        if (finalResult === '+2' || finalResult === '+3') {
            soundWin();
        } else if (finalResult === '-1') {
            soundLose();
        } else if (finalResult === '+1') {
            soundPop();
        } else {
            soundNeutral();
        }

        spinBtn.disabled = false;
        spinBtn.textContent = 'AGAIN';
        isSpinning = false;
    }, 4000);
}

// ==================== GRAMMAR ACTIVITIES ====================
let grammarState = {
    activities: [],
    currentIndex: 0,
    selectedTile: null,
    currentWords: [],
    correctSentence: []
};

function generateGrammarActivity() {
    const level = levelSelector.value;
    const unit = unitSelector.value;
    const activityType = grammarActivitySelector.value;
    
    // Get activities for this level/unit
    let allActivities = grammarUnits[level]?.[unit] || [];
    
    // Filter by activity type
    grammarState.activities = allActivities.filter(a => a.type === activityType);
    
    if (grammarState.activities.length === 0) {
        grammarContainer.innerHTML = '<div class="grammar-feedback incorrect">No activities found for this selection. Try a different level/unit.</div>';
        return;
    }
    
    // Shuffle activities
    grammarState.activities = grammarState.activities.sort(() => 0.5 - Math.random());
    grammarState.currentIndex = 0;
    
    // Show the first activity
    if (activityType === 'reorder') {
        showReorderActivity();
    } else if (activityType === 'fill') {
        showFillActivity();
    }
}

// ==================== SENTENCE REORDERING ====================
function showReorderActivity() {
    const activity = grammarState.activities[grammarState.currentIndex];
    if (!activity) {
        showGrammarComplete();
        return;
    }
    
    // Split sentence into words and shuffle
    const words = activity.sentence.split(' ');
    grammarState.correctSentence = [...words];
    grammarState.currentWords = words.sort(() => 0.5 - Math.random());
    grammarState.selectedTile = null;
    
    grammarContainer.innerHTML = '';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap two words to swap their positions. Put the sentence in the correct order.';
    grammarContainer.appendChild(instructions);
    
    // Add progress dots
    const progress = createProgressDots();
    grammarContainer.appendChild(progress);
    
    // Add sentence display area
    const sentenceDisplay = document.createElement('div');
    sentenceDisplay.className = 'sentence-display';
    sentenceDisplay.id = 'sentenceDisplay';
    
    grammarState.currentWords.forEach((word, index) => {
        const tile = document.createElement('div');
        tile.className = 'word-tile';
        tile.textContent = word;
        tile.dataset.index = index;
        tile.addEventListener('click', () => handleReorderTileClick(tile));
        sentenceDisplay.appendChild(tile);
    });
    
    grammarContainer.appendChild(sentenceDisplay);
    
    // Add check button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'control-btn';
    checkBtn.textContent = 'Check Answer';
    checkBtn.style.marginTop = '20px';
    checkBtn.addEventListener('click', checkReorderAnswer);
    grammarContainer.appendChild(checkBtn);
}

function handleReorderTileClick(tile) {
    initAudio();
    soundPop();
    
    const index = parseInt(tile.dataset.index);
    
    if (grammarState.selectedTile === null) {
        // First tile selected
        grammarState.selectedTile = index;
        tile.classList.add('selected');
    } else if (grammarState.selectedTile === index) {
        // Same tile clicked - deselect
        grammarState.selectedTile = null;
        tile.classList.remove('selected');
    } else {
        // Second tile selected - swap
        const firstIndex = grammarState.selectedTile;
        const secondIndex = index;
        
        // Swap in array
        [grammarState.currentWords[firstIndex], grammarState.currentWords[secondIndex]] = 
        [grammarState.currentWords[secondIndex], grammarState.currentWords[firstIndex]];
        
        // Update display
        const display = document.getElementById('sentenceDisplay');
        const tiles = display.querySelectorAll('.word-tile');
        tiles.forEach((t, i) => {
            t.textContent = grammarState.currentWords[i];
            t.classList.remove('selected');
        });
        
        grammarState.selectedTile = null;
    }
}

function checkReorderAnswer() {
    initAudio();
    
    const isCorrect = grammarState.currentWords.join(' ') === grammarState.correctSentence.join(' ');
    const display = document.getElementById('sentenceDisplay');
    const tiles = display.querySelectorAll('.word-tile');
    
    tiles.forEach((tile, index) => {
        if (grammarState.currentWords[index] === grammarState.correctSentence[index]) {
            tile.classList.add('correct');
        } else {
            tile.classList.add('incorrect');
        }
    });
    
    if (isCorrect) {
        soundWin();
        setTimeout(() => {
            grammarState.currentIndex++;
            showReorderActivity();
        }, 1500);
    } else {
        soundLose();
        // Allow retry after a moment
        setTimeout(() => {
            tiles.forEach(tile => {
                tile.classList.remove('correct', 'incorrect');
            });
        }, 1000);
    }
}

// ==================== FILL IN THE BLANK ====================
function showFillActivity() {
    const activity = grammarState.activities[grammarState.currentIndex];
    if (!activity) {
        showGrammarComplete();
        return;
    }
    
    grammarContainer.innerHTML = '';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap the correct word to fill in the blank.';
    grammarContainer.appendChild(instructions);
    
    // Add progress dots
    const progress = createProgressDots();
    grammarContainer.appendChild(progress);
    
    // Add sentence with blank
    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = 'sentence-display fill-sentence';
    sentenceDiv.id = 'fillSentence';
    
    // Replace ___ with a blank span
    const parts = activity.sentence.split('___');
    sentenceDiv.innerHTML = parts[0] + '<span class="fill-blank" id="fillBlank">&nbsp;</span>' + parts[1];
    grammarContainer.appendChild(sentenceDiv);
    
    // Add options
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-container';
    
    // Shuffle options
    const shuffledOptions = [...activity.options].sort(() => 0.5 - Math.random());
    
    shuffledOptions.forEach(option => {
        const optionTile = document.createElement('div');
        optionTile.className = 'option-tile';
        optionTile.textContent = option;
        optionTile.addEventListener('click', () => handleFillOptionClick(optionTile, option, activity.answer));
        optionsDiv.appendChild(optionTile);
    });
    
    grammarContainer.appendChild(optionsDiv);
}

function handleFillOptionClick(tile, selected, correct) {
    initAudio();
    
    const blank = document.getElementById('fillBlank');
    const allOptions = document.querySelectorAll('.option-tile');
    
    // Disable all options
    allOptions.forEach(opt => opt.classList.add('disabled'));
    
    // Show selected answer in blank
    blank.textContent = selected;
    blank.classList.add('filled');
    
    if (selected === correct) {
        tile.classList.add('correct');
        blank.classList.add('correct');
        soundWin();
        
        setTimeout(() => {
            grammarState.currentIndex++;
            showFillActivity();
        }, 1500);
    } else {
        tile.classList.add('incorrect');
        blank.classList.add('incorrect');
        soundLose();
        
        // Show correct answer after a moment
        setTimeout(() => {
            allOptions.forEach(opt => {
                if (opt.textContent === correct) {
                    opt.classList.remove('disabled');
                    opt.classList.add('correct');
                }
            });
        }, 500);
        
        // Allow retry after showing correct answer
        setTimeout(() => {
            grammarState.currentIndex++;
            showFillActivity();
        }, 2000);
    }
}

// ==================== GRAMMAR HELPERS ====================
function createProgressDots() {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'grammar-progress';
    
    for (let i = 0; i < grammarState.activities.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        if (i < grammarState.currentIndex) {
            dot.classList.add('completed');
        } else if (i === grammarState.currentIndex) {
            dot.classList.add('current');
        }
        progressDiv.appendChild(dot);
    }
    
    return progressDiv;
}

function showGrammarComplete() {
    grammarContainer.innerHTML = `
        <div class="grammar-feedback correct">
            🎉 Great job! You completed all activities! 🎉
        </div>
        <button class="control-btn" style="margin-top: 20px;" onclick="generateGrammarActivity()">
            Try Again
        </button>
    `;
    soundWin();
}

function resetGrid() { 
    const mode = modeSelector.value;
    if (mode === 'grammar') {
        generateGrammarActivity();
    } else {
        generateGrid();
    }
}
