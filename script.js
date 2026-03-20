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

// ==================== SPELLING MEDIA HELPER ====================
function getSimpleFileName(word) {
    return word
        .toLowerCase()
        .replace(/ /g, '_')     // Replace spaces with underscores
        .replace(/-/g, '-');    // Keep hyphens as-is
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
const keyboardModeSelector = document.getElementById('keyboardModeSelector');
const pictureToggleBtn = document.getElementById('pictureToggleBtn');
const audioToggleBtn = document.getElementById('audioToggleBtn');

let starCellIndex = -1;

// ==================== INITIALIZATION ====================
function init() {
    generateGrid();
    modeSelector.addEventListener('change', handleModeChange);
    selectorElement.addEventListener('change', generateGrid);
    levelSelector.addEventListener('change', handleModeChange);
    unitSelector.addEventListener('change', handleModeChange);
    grammarActivitySelector.addEventListener('change', generateGrammarActivity);
    keyboardModeSelector.addEventListener('change', handleKeyboardModeChange);
}

function handleModeChange() {
    const mode = modeSelector.value;
    
    // Hide all selectors first
    selectorElement.style.display = 'none';
    levelSelector.style.display = 'none';
    unitSelector.style.display = 'none';
    grammarActivitySelector.style.display = 'none';
    keyboardModeSelector.style.display = 'none';
    pictureToggleBtn.style.display = 'none';
    audioToggleBtn.style.display = 'none';
    
    // Reset button text
    const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
    if (resetBtn) resetBtn.textContent = 'Reset Grid';
    
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
        
        // Show spelling toggles if spelling is selected
        if (grammarActivitySelector.value === 'spelling') {
            keyboardModeSelector.style.display = 'block';
            pictureToggleBtn.style.display = 'block';
            audioToggleBtn.style.display = 'block';
        }
        
        generateGrammarActivity();
    }
}

function handleKeyboardModeChange() {
    if (grammarActivitySelector.value === 'spelling') {
        spellingState.keyboardMode = keyboardModeSelector.value;
        generateAvailableLetters();
        renderSpellingUI();
    }
}

function togglePicture() {
    if (grammarActivitySelector.value === 'spelling') {
        spellingState.showPicture = !spellingState.showPicture;
        
        if (spellingState.showPicture) {
            pictureToggleBtn.classList.add('active');
            pictureToggleBtn.textContent = '📷 Picture: ON';
        } else {
            pictureToggleBtn.classList.remove('active');
            pictureToggleBtn.textContent = '📷 Picture: OFF';
        }
        
        renderSpellingUI();
    }
}

function toggleAudio() {
    if (grammarActivitySelector.value === 'spelling') {
        spellingState.showAudio = !spellingState.showAudio;
        
        if (spellingState.showAudio) {
            audioToggleBtn.classList.add('active');
            audioToggleBtn.textContent = '🔊 Audio: ON';
            // Play audio when turned on
            playSpellingAudio();
        } else {
            audioToggleBtn.classList.remove('active');
            audioToggleBtn.textContent = '🔊 Audio: OFF';
        }
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
    currentWords: [],       // Words still in sentence display (not yet placed)
    placedWords: [],        // Words placed in answer slots (in order)
    correctSentence: []    // The correct sentence order
};

function generateGrammarActivity() {
    const level = levelSelector.value;
    const unit = unitSelector.value;
    const activityType = grammarActivitySelector.value;
    
    // Show/hide spelling-specific controls
    if (activityType === 'spelling') {
        keyboardModeSelector.style.display = 'block';
        pictureToggleBtn.style.display = 'block';
        audioToggleBtn.style.display = 'block';
        // Update Reset button to show "Next Word"
        const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
        if (resetBtn) resetBtn.textContent = 'Next Word';
        showSpellingActivity();
        return;
    } else {
        keyboardModeSelector.style.display = 'none';
        pictureToggleBtn.style.display = 'none';
        audioToggleBtn.style.display = 'none';
        // Reset button text
        const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
        if (resetBtn) resetBtn.textContent = 'Reset Grid';
    }
    
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
    grammarState.placedWords = new Array(words.length).fill(null);
    
    grammarContainer.innerHTML = '';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap words below to fill in the blanks. Tap a filled slot to return the word.';
    grammarContainer.appendChild(instructions);
    
    // Add progress dots
    const progress = createProgressDots();
    grammarContainer.appendChild(progress);
    
    // Add answer slots area (empty placeholders at top)
    const answerSlots = document.createElement('div');
    answerSlots.className = 'answer-slots';
    answerSlots.id = 'answerSlots';
    
    grammarState.correctSentence.forEach((word, index) => {
        const slot = document.createElement('div');
        slot.className = 'answer-slot';
        slot.dataset.slotIndex = index;
        slot.dataset.word = ''; // Empty initially
        slot.addEventListener('click', () => handleSlotClick(slot));
        answerSlots.appendChild(slot);
    });
    
    grammarContainer.appendChild(answerSlots);
    
    // Add sentence display area (shuffled words at bottom)
    const sentenceDisplay = document.createElement('div');
    sentenceDisplay.className = 'sentence-display';
    sentenceDisplay.id = 'sentenceDisplay';
    
    grammarState.currentWords.forEach((word, index) => {
        const tile = document.createElement('div');
        tile.className = 'word-tile';
        tile.textContent = word;
        tile.dataset.index = index;
        tile.dataset.word = word;
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
    const word = tile.dataset.word;
    
    // Find the first empty slot
    const slots = document.querySelectorAll('.answer-slot');
    let emptySlot = null;
    let emptySlotIndex = -1;
    
    for (let i = 0; i < slots.length; i++) {
        if (!slots[i].classList.contains('filled')) {
            emptySlot = slots[i];
            emptySlotIndex = i;
            break;
        }
    }
    
    if (emptySlot === null) {
        // All slots are filled
        soundNeutral();
        return;
    }
    
    // Move word to the empty slot
    emptySlot.textContent = word;
    emptySlot.dataset.word = word;
    emptySlot.classList.add('filled');
    
    // Update placedWords array
    grammarState.placedWords[emptySlotIndex] = word;
    
    // Remove word from currentWords array
    grammarState.currentWords.splice(index, 1);
    
    // Remove tile from display
    tile.remove();
    
    // Check if all slots are filled
    checkAllSlotsFilled();
}

function handleSlotClick(slot) {
    initAudio();
    
    // Only process if slot is filled
    if (!slot.classList.contains('filled')) {
        soundNeutral();
        return;
    }
    
    const slotIndex = parseInt(slot.dataset.slotIndex);
    const word = slot.dataset.word;
    
    // Return word to the sentence display (add to currentWords)
    grammarState.currentWords.push(word);
    
    // Clear the slot
    slot.textContent = '';
    slot.dataset.word = '';
    slot.classList.remove('filled', 'correct', 'incorrect');
    
    // Clear placedWords at this index
    grammarState.placedWords[slotIndex] = null;
    
    // Add word back to sentence display
    const sentenceDisplay = document.getElementById('sentenceDisplay');
    const tile = document.createElement('div');
    tile.className = 'word-tile';
    tile.textContent = word;
    tile.dataset.index = grammarState.currentWords.length - 1;
    tile.dataset.word = word;
    tile.addEventListener('click', () => handleReorderTileClick(tile));
    sentenceDisplay.appendChild(tile);
    
    soundPop();
}

function checkAllSlotsFilled() {
    const allFilled = grammarState.placedWords.every(word => word !== null);
    if (allFilled) {
        soundWin();
    }
}

function checkReorderAnswer() {
    initAudio();
    
    // Check if all slots are filled
    const allFilled = grammarState.placedWords.every(word => word !== null);
    if (!allFilled) {
        // Not all slots filled - show feedback
        const checkBtn = grammarContainer.querySelector('.control-btn');
        checkBtn.textContent = 'Fill all blanks first!';
        checkBtn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        soundNeutral();
        
        setTimeout(() => {
            checkBtn.textContent = 'Check Answer';
            checkBtn.style.background = '';
        }, 1500);
        return;
    }
    
    const isCorrect = grammarState.placedWords.join(' ') === grammarState.correctSentence.join(' ');
    const slots = document.querySelectorAll('.answer-slot');
    
    slots.forEach((slot, index) => {
        if (grammarState.placedWords[index] === grammarState.correctSentence[index]) {
            slot.classList.add('correct');
            slot.classList.remove('incorrect');
        } else {
            slot.classList.add('incorrect');
            slot.classList.remove('correct');
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
            slots.forEach(slot => {
                slot.classList.remove('correct', 'incorrect');
            });
        }, 1500);
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
        const activityType = grammarActivitySelector.value;
        if (activityType === 'spelling') {
            // In spelling mode, button acts as "Next Word"
            spellingState.currentIndex++;
            showCurrentSpellingWord();
        } else {
            generateGrammarActivity();
        }
    } else {
        generateGrid();
    }
}

// ==================== SPELLING ACTIVITY ====================
let spellingState = {
    words: [],
    currentIndex: 0,
    currentWord: '',
    typedLetters: [],      // Stores the letter at each position
    availableLetters: [],  // Array of {letter, used} objects for limited mode
    usedLetterIndices: [], // Track which letter indices are used
    keyboardMode: 'full', // 'full' or 'limited'
    showPicture: false,
    showAudio: false,
    hintsUsed: 0
};

// Spelling activity entry point - called from generateGrammarActivity
function showSpellingActivity() {
    const level = levelSelector.value;
    const unit = unitSelector.value;
    
    // Get words from levelUnits for spelling
    spellingState.words = [...(levelUnits[level]?.[unit] || [])];
    
    // Filter out multi-word phrases (like "play soccer", "go to school")
    // and only keep single words for spelling
    spellingState.words = spellingState.words.filter(w => !w.includes(' ') && w.length > 1);
    
    // Also add words from phoneme sets as backup
    if (spellingState.words.length < 3) {
        const allPhonemeWords = [];
        Object.values(phonemeSets).forEach(set => {
            set.forEach(word => {
                const cleanWord = word.replace(/\[|\]/g, '');
                if (!cleanWord.includes(' ') && cleanWord.length > 2) {
                    allPhonemeWords.push(cleanWord);
                }
            });
        });
        // Add some random phoneme words
        spellingState.words = [...spellingState.words, ...allPhonemeWords.sort(() => 0.5 - Math.random()).slice(0, 10)];
    }
    
    // Shuffle and limit to 5 words
    spellingState.words = spellingState.words.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    if (spellingState.words.length === 0) {
        grammarContainer.innerHTML = '<div class="grammar-feedback incorrect">No spelling words found for this unit. Try a different level/unit.</div>';
        return;
    }
    
    spellingState.currentIndex = 0;
    // Get keyboard mode from the selector
    spellingState.keyboardMode = keyboardModeSelector.value;
    // Picture enabled by default, remember state
    spellingState.showPicture = true;
    spellingState.showAudio = false;
    spellingState.hintsUsed = 0;
    
    // Sync toggle button states (enabled by default for picture)
    pictureToggleBtn.classList.add('active');
    pictureToggleBtn.textContent = '📷 Picture: ON';
    audioToggleBtn.classList.remove('active');
    audioToggleBtn.textContent = '🔊 Audio';
    
    showCurrentSpellingWord();
}

function showCurrentSpellingWord() {
    if (spellingState.currentIndex >= spellingState.words.length) {
        showSpellingComplete();
        return;
    }
    
    spellingState.currentWord = spellingState.words[spellingState.currentIndex];
    // Initialize typedLetters array with undefined values matching word length
    spellingState.typedLetters = new Array(spellingState.currentWord.length).fill(undefined);
    spellingState.usedLetterIndices = [];
    
    // Generate available letters based on keyboard mode
    generateAvailableLetters();
    
    renderSpellingUI();
}

function generateAvailableLetters() {
    const wordLetters = spellingState.currentWord.toUpperCase().split('');
    
    if (spellingState.keyboardMode === 'limited') {
        // Only use letters from the word, shuffled - exactly the letters needed
        // Store as objects with index for tracking
        spellingState.availableLetters = wordLetters.map((letter, index) => ({
            letter: letter,
            id: index,
            used: false
        }));
        // Shuffle the letters
        spellingState.availableLetters.sort(() => 0.5 - Math.random());
    } else {
        // Full keyboard - all letters A-Z
        spellingState.availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
    // Reset used indices
    spellingState.usedLetterIndices = [];
}

function renderSpellingUI() {
    grammarContainer.innerHTML = '';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap the letters to spell the word. Tap a letter slot to remove the letter.';
    grammarContainer.appendChild(instructions);
    
    // Add progress dots
    const progress = createSpellingProgressDots();
    grammarContainer.appendChild(progress);
    
    // Word display area (picture placeholder)
    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'spelling-word-display';
    
    // Picture display - load actual image
    const pictureDiv = document.createElement('div');
    pictureDiv.className = `spelling-picture ${spellingState.showPicture ? 'show' : ''}`;
    
    if (spellingState.showPicture) {
        const imageName = getSimpleFileName(spellingState.currentWord);
        const img = document.createElement('img');
        img.src = `static/imgs/words/${imageName}.jpg`;
        img.alt = spellingState.currentWord;
        img.className = 'spelling-word-img';
        img.onerror = () => {
            // Fallback to emoji if image not found
            pictureDiv.innerHTML = '🖼️';
            pictureDiv.classList.add('fallback');
        };
        img.onload = () => {
            // Clear placeholder and show image
            if (!pictureDiv.contains(img)) {
                pictureDiv.innerHTML = '';
                pictureDiv.appendChild(img);
            }
        };
        // Start with loading state
        pictureDiv.innerHTML = '⏳';
    } else {
        pictureDiv.innerHTML = '🖼️';
    }
    
    pictureDiv.title = 'Click to hear the word';
    pictureDiv.style.cursor = 'pointer';
    pictureDiv.addEventListener('click', () => {
        playSpellingAudio();
    });
    wordDisplay.appendChild(pictureDiv);
    
    grammarContainer.appendChild(wordDisplay);
    
    // Add answer slots
    const answerContainer = document.createElement('div');
    answerContainer.className = 'spelling-answer-container';
    answerContainer.id = 'spellingAnswerSlots';
    
    for (let i = 0; i < spellingState.currentWord.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'spelling-letter-slot';
        slot.dataset.index = i;
        
        if (spellingState.typedLetters[i]) {
            slot.textContent = spellingState.typedLetters[i];
            slot.classList.add('filled');
        }
        
        slot.addEventListener('click', () => handleSpellingSlotClick(i));
        answerContainer.appendChild(slot);
    }
    
    grammarContainer.appendChild(answerContainer);
    
    // Add keyboard
    const keyboardDiv = document.createElement('div');
    keyboardDiv.className = `spelling-keyboard ${spellingState.keyboardMode === 'limited' ? 'limited' : ''}`;
    keyboardDiv.id = 'spellingKeyboard';
    
    // Create keyboard rows
    const row1 = 'QWERTYUIOP'.split('');
    const row2 = 'ASDFGHJKL'.split('');
    const row3 = 'ZXCVBNM'.split('');
    
    let rows;
    if (spellingState.keyboardMode === 'limited') {
        // Single row with available letters
        rows = [spellingState.availableLetters];
    } else {
        // Full QWERTY keyboard
        rows = [row1, row2, row3];
    }
    
    rows.forEach((row) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'spelling-keyboard-row';
        
        row.forEach((letterObj, letterIdx) => {
            const key = document.createElement('div');
            key.className = 'spelling-key';
            
            // Handle both string (full keyboard) and object (limited) cases
            let letter, letterId, isUsed;
            
            if (spellingState.keyboardMode === 'limited') {
                // letterObj is {letter, id, used}
                letter = letterObj.letter;
                letterId = letterObj.id;
                isUsed = letterObj.used;
            } else {
                // letterObj is a plain string
                letter = letterObj;
                letterId = letterIdx;
                isUsed = false; // Full keyboard doesn't track used
            }
            
            key.textContent = letter;
            key.dataset.letterId = letterId; // Store the ID for tracking
            
            // Mark used letters in limited mode
            if (isUsed) {
                key.classList.add('used');
            }
            
            key.addEventListener('click', () => handleSpellingKeyClick(letter, letterId));
            rowDiv.appendChild(key);
        });
        
        keyboardDiv.appendChild(rowDiv);
    });
    
    grammarContainer.appendChild(keyboardDiv);
    
    // Add hint button
    const hintBtn = document.createElement('button');
    hintBtn.className = 'spelling-hint-btn';
    hintBtn.textContent = '💡 Hint';
    hintBtn.onclick = useSpellingHint;
    grammarContainer.appendChild(hintBtn);
}

function createSpellingProgressDots() {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'grammar-progress';
    
    for (let i = 0; i < spellingState.words.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        if (i < spellingState.currentIndex) {
            dot.classList.add('completed');
        } else if (i === spellingState.currentIndex) {
            dot.classList.add('current');
        }
        progressDiv.appendChild(dot);
    }
    
    return progressDiv;
}

function handleSpellingKeyClick(letter, letterId) {
    initAudio();
    soundPop();
    
    // Find first empty slot (undefined)
    const emptyIndex = spellingState.typedLetters.findIndex(l => l === undefined);
    
    if (emptyIndex === -1) {
        // All slots filled - replace last letter
        const lastIndex = spellingState.typedLetters.length - 1;
        const oldLetterData = spellingState.typedLetters[lastIndex];
        
        // Remove old letter from used (either plain letter or object with id)
        if (oldLetterData && oldLetterData.id !== undefined) {
            const oldUsedIdx = spellingState.usedLetterIndices.indexOf(oldLetterData.id);
            if (oldUsedIdx > -1) {
                spellingState.usedLetterIndices.splice(oldUsedIdx, 1);
            }
            // Mark the letter as available again in availableLetters
            const availLetter = spellingState.availableLetters.find(l => l.id === oldLetterData.id);
            if (availLetter) availLetter.used = false;
        }
        
        // Store letter with its ID for limited mode
        if (spellingState.keyboardMode === 'limited') {
            spellingState.typedLetters[lastIndex] = { letter: letter, id: letterId };
        } else {
            spellingState.typedLetters[lastIndex] = letter;
        }
    } else {
        // Store letter with its ID for limited mode
        if (spellingState.keyboardMode === 'limited') {
            spellingState.typedLetters[emptyIndex] = { letter: letter, id: letterId };
        } else {
            spellingState.typedLetters[emptyIndex] = letter;
        }
        
        // Mark letter as used in limited mode
        if (spellingState.keyboardMode === 'limited') {
            spellingState.usedLetterIndices.push(letterId);
            // Mark in availableLetters
            const availLetter = spellingState.availableLetters.find(l => l.id === letterId);
            if (availLetter) availLetter.used = true;
        }
    }
    
    // Update UI
    updateSpellingUI();
    
    // Check if word is complete (no undefined values)
    const allFilled = spellingState.typedLetters.every(l => l !== undefined);
    if (allFilled) {
        setTimeout(checkSpellingAnswer, 300);
    }
}

function handleSpellingSlotClick(index) {
    initAudio();
    
    const letterData = spellingState.typedLetters[index];
    if (!letterData) {
        soundNeutral();
        return;
    }
    
    // Remove letter from typed
    spellingState.typedLetters[index] = undefined;
    
    // Remove from used letters (handle both plain string and object)
    if (letterData && letterData.id !== undefined) {
        const usedIdx = spellingState.usedLetterIndices.indexOf(letterData.id);
        if (usedIdx > -1) {
            spellingState.usedLetterIndices.splice(usedIdx, 1);
        }
        // Mark as available again
        const availLetter = spellingState.availableLetters.find(l => l.id === letterData.id);
        if (availLetter) availLetter.used = false;
    }
    
    soundPop();
    updateSpellingUI();
}

function updateSpellingUI() {
    // Update slots
    const slots = document.querySelectorAll('.spelling-letter-slot');
    slots.forEach((slot, index) => {
        const letterData = spellingState.typedLetters[index];
        // Handle both plain string and object with letter/id
        const letter = letterData ? (letterData.letter || letterData) : null;
        if (letter) {
            slot.textContent = letter;
            slot.classList.add('filled');
        } else {
            slot.textContent = '';
            slot.classList.remove('filled');
        }
    });
    
    // Update keyboard - mark used keys
    const keys = document.querySelectorAll('.spelling-key');
    keys.forEach(key => {
        const letterId = parseInt(key.dataset.letterId);
        if (!isNaN(letterId) && spellingState.usedLetterIndices.includes(letterId)) {
            key.classList.add('used');
        } else {
            key.classList.remove('used');
        }
    });
}

function checkSpellingAnswer() {
    initAudio();
    
    // Extract letters from typedLetters (handle both plain string and object)
    const typedWord = spellingState.typedLetters.map(l => l ? (l.letter || l) : '').join('');
    const correctWord = spellingState.currentWord.toUpperCase();
    
    const slots = document.querySelectorAll('.spelling-letter-slot');
    
    if (typedWord === correctWord) {
        // Correct!
        slots.forEach(slot => slot.classList.add('correct'));
        soundWin();
        
        setTimeout(() => {
            spellingState.currentIndex++;
            showCurrentSpellingWord();
        }, 1500);
    } else {
        // Incorrect - show which are wrong
        slots.forEach((slot, index) => {
            const typed = spellingState.typedLetters[index] ? (spellingState.typedLetters[index].letter || spellingState.typedLetters[index]) : '';
            const expected = correctWord[index];
            
            if (typed !== expected) {
                slot.classList.add('incorrect');
            } else {
                slot.classList.add('correct');
            }
        });
        
        soundLose();
        
        // Reset after showing answer
        setTimeout(() => {
            // Clear typed letters (reset to undefined array)
            spellingState.typedLetters = new Array(spellingState.currentWord.length).fill(undefined);
            spellingState.usedLetterIndices = [];
            
            // Reset available letters in limited mode
            if (spellingState.keyboardMode === 'limited') {
                spellingState.availableLetters.forEach(l => l.used = false);
            }
            
            // Update UI
            slots.forEach(slot => {
                slot.classList.remove('correct', 'incorrect', 'filled');
                slot.textContent = '';
            });
            
            // Reset keyboard
            const keys = document.querySelectorAll('.spelling-key');
            keys.forEach(key => key.classList.remove('used'));
        }, 1500);
    }
}

function useSpellingHint() {
    initAudio();
    
    // Find first incorrect letter
    const correctWord = spellingState.currentWord.toUpperCase();
    
    for (let i = 0; i < correctWord.length; i++) {
        const currentTyped = spellingState.typedLetters[i] ? (spellingState.typedLetters[i].letter || spellingState.typedLetters[i]) : '';
        
        if (currentTyped !== correctWord[i]) {
            // Find an unused letter from available letters that matches
            const availableLetter = spellingState.availableLetters.find(l => !l.used && l.letter === correctWord[i]);
            
            if (availableLetter) {
                // Replace with correct letter
                const oldLetterData = spellingState.typedLetters[i];
                
                // Remove old letter from used if exists
                if (oldLetterData && oldLetterData.id !== undefined) {
                    const oldUsedIdx = spellingState.usedLetterIndices.indexOf(oldLetterData.id);
                    if (oldUsedIdx > -1) {
                        spellingState.usedLetterIndices.splice(oldUsedIdx, 1);
                    }
                    // Mark old as available
                    const oldAvail = spellingState.availableLetters.find(l => l.id === oldLetterData.id);
                    if (oldAvail) oldAvail.used = false;
                }
                
                // Store with ID for limited mode
                if (spellingState.keyboardMode === 'limited') {
                    spellingState.typedLetters[i] = { letter: correctWord[i], id: availableLetter.id };
                } else {
                    spellingState.typedLetters[i] = correctWord[i];
                }
                
                // Mark as used
                spellingState.usedLetterIndices.push(availableLetter.id);
                availableLetter.used = true;
                
                soundPop();
                updateSpellingUI();
                
                // Check if complete (no undefined values)
                const allFilled = spellingState.typedLetters.every(l => l !== undefined);
                const typedWord = spellingState.typedLetters.map(l => l ? (l.letter || l) : '').join('');
                if (allFilled && typedWord === correctWord) {
                    setTimeout(checkSpellingAnswer, 300);
                }
            }
            
            return;
        }
    }
}

function playSpellingAudio() {
    initAudio(); // Ensure audio context is ready
    
    const audioName = getSimpleFileName(spellingState.currentWord);
    const audioPath = `static/audio/${audioName}.mp3`;
    
    // Try to play audio file
    const audio = new Audio(audioPath);
    audio.play().catch(() => {
        // Fallback to text-to-speech if audio file not found
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(spellingState.currentWord);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    });
}

function showSpellingComplete() {
    grammarContainer.innerHTML = `
        <div class="grammar-feedback correct">
            🎉 Great job! You spelled all the words! 🎉
        </div>
        <button class="control-btn" style="margin-top: 20px;" onclick="showSpellingActivity()">
            Try Again
        </button>
    `;
    soundWin();
}
