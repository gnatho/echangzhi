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

function playTone(freq, type, duration, vol = 0.1) {
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

function soundTick() { playTone(800, 'triangle', 0.05, 0.05); }
function soundPop() { playTone(400, 'sine', 0.15, 0.2); }
function soundNeutral() { playTone(300, 'triangle', 0.2, 0.15); }

function soundWin() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
    });
}

function soundLose() {
    if (!audioCtx) return;
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
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            playTone(1000 + (i * 200), 'sine', 0.1, 0.08);
        }, i * 50);
    }
}

document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });

// ==================== UTILITIES ====================
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatWord(word) {
    return word.replace(/\[([^\]]+)\]/g, (_, p1) =>
        `<span style="color: #e74c3c;">${escapeHTML(p1)}</span>`
    );
}

function fisherYatesShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getSimpleFileName(word) {
    return word.toLowerCase().replace(/ /g, '_').replace(/-/g, '-');
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
    populateWordSetSelector('wordSetSelector');
    populateLevelSelector('levelSelector');
    populateUnitSelector('unitSelector', levelSelector.value);
    generateGrid();
    modeSelector.addEventListener('change', handleModeChange);
    selectorElement.addEventListener('change', generateGrid);
    levelSelector.addEventListener('change', function () {
        populateUnitSelector('unitSelector', this.value);
        if (modeSelector.value === 'levels' || modeSelector.value === 'grammar') {
            generateGrid();
        }
        if (modeSelector.value === 'grammar') {
            generateGrammarActivity();
        }
    });
    unitSelector.addEventListener('change', handleModeChange);
    grammarActivitySelector.addEventListener('change', generateGrammarActivity);
    keyboardModeSelector.addEventListener('change', handleKeyboardModeChange);
}

function handleModeChange() {
    const mode = modeSelector.value;

    selectorElement.style.display = 'none';
    levelSelector.style.display = 'none';
    unitSelector.style.display = 'none';
    grammarActivitySelector.style.display = 'none';
    keyboardModeSelector.style.display = 'none';
    pictureToggleBtn.style.display = 'none';
    audioToggleBtn.style.display = 'none';

    const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
    if (resetBtn) resetBtn.textContent = 'Reset Grid';

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
        const allWords = getWordsByKey(selectedSet);
        words = [...allWords];
        if (words.length > 30) {
            words = fisherYatesShuffle(words).slice(0, 30);
        }
    } else {
        words = [...(levelUnits[levelSelector.value]?.[unitSelector.value] || [])];
        usePhonemes = false;
    }

    words = fisherYatesShuffle(words);

    gridElement.replaceChildren();
    const layout = calculateGridLayout(words.length);
    gridElement.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

    starCellIndex = Math.floor(Math.random() * words.length);

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < words.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.cellIndex = i;

        const wordSpan = document.createElement('span');
        wordSpan.className = 'word-text';

        if (usePhonemes) {
            wordSpan.innerHTML = formatWord(words[i]);
        } else {
            wordSpan.textContent = words[i];
        }

        cell.appendChild(wordSpan);
        cell.addEventListener('click', function () { handleCellClick(this); }, { once: true });
        fragment.appendChild(cell);
    }

    gridElement.appendChild(fragment);
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
    initAudio();

    const cellIndex = parseInt(cellElement.dataset.cellIndex, 10);
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
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score-text';
        scoreSpan.textContent = score;
        cellElement.replaceChildren(scoreSpan);
    }
}

init();

// ==================== UPGRADED SPIN WHEEL ====================
const wheelSegments = ['+1', '+2', '+1', '+3', '+1', '0', '+2', '-1', '+1', '+3', '+2', '0'];

const friendlyColors = {
    '+3': '#f1c40f',
    '+2': '#2ecc71',
    '+1': '#3498db',
    '0': '#9b59b6',
    '-1': '#e74c3c'
};

let currentRotation = 0;
let isSpinning = false;
let tickInterval = null;

function createWheel() {
    const wheel = document.getElementById('wheel');
    const numSegments = wheelSegments.length;
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

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`);
        path.setAttribute('fill', friendlyColors[value]);
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '2');
        svg.appendChild(path);

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
        text.setAttribute('style', 'text-shadow: 1px 1px 3px rgba(0,0,0,0.3);');
        text.textContent = value;
        svg.appendChild(text);
    });

    wheel.replaceChildren(svg);
}

function openWheelModal() {
    initAudio();
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
    closeWheelModal();
}

function handleOverlayClick(event) {
    if (event.target.id === 'fullscreenResult' || event.target.classList.contains('tap-continue')) {
        closeFullscreenResult();
    }
}

function spinWheelAgain(event) {
    event.stopPropagation();
    document.getElementById('fullscreenResult').classList.remove('active');
    const modal = document.getElementById('wheelModal');
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = false;
    spinBtn.textContent = 'SPIN';
    isSpinning = false;
    createWheel();
    modal.classList.add('active');
}

function spinWheel() {
    if (isSpinning) return;
    initAudio();

    isSpinning = true;
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    const targetIndex = Math.floor(Math.random() * 12);
    const finalResult = wheelSegments[targetIndex];

    const segmentAngle = 360 / 12;
    const targetAngle = 360 - (targetIndex * segmentAngle) - (segmentAngle / 2);

    const spins = 5;
    const newRotation = currentRotation + (spins * 360) + targetAngle - (currentRotation % 360);
    currentRotation = newRotation;

    wheel.style.transform = `rotate(${newRotation}deg)`;

    let ticks = 0;
    const maxTicks = 20;
    tickInterval = setInterval(() => {
        soundTick();
        ticks++;
        if (ticks >= maxTicks) clearInterval(tickInterval);
    }, 180);

    setTimeout(() => {
        clearInterval(tickInterval);

        const fsOverlay = document.getElementById('fullscreenResult');
        const fsText = document.getElementById('fsResultText');

        fsText.textContent = finalResult;
        fsText.style.color = friendlyColors[finalResult];
        fsOverlay.classList.add('active');

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
    currentWords: [],
    placedWords: [],
    correctSentence: []
};

function generateGrammarActivity() {
    const level = levelSelector.value;
    const unit = unitSelector.value;
    const activityType = grammarActivitySelector.value;

    if (activityType === 'spelling') {
        keyboardModeSelector.style.display = 'block';
        pictureToggleBtn.style.display = 'block';
        audioToggleBtn.style.display = 'block';
        const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
        if (resetBtn) resetBtn.textContent = 'Next Word';
        showSpellingActivity();
        return;
    } else {
        keyboardModeSelector.style.display = 'none';
        pictureToggleBtn.style.display = 'none';
        audioToggleBtn.style.display = 'none';
        const resetBtn = document.querySelector('.control-btn[onclick="resetGrid()"]');
        if (resetBtn) resetBtn.textContent = 'Reset Grid';
    }

    let allActivities = grammarUnits[level]?.[unit] || [];
    grammarState.activities = allActivities.filter(a => a.type === activityType);

    if (grammarState.activities.length === 0) {
        grammarContainer.replaceChildren();
        const feedback = document.createElement('div');
        feedback.className = 'grammar-feedback incorrect';
        feedback.textContent = 'No activities found for this selection. Try a different level/unit.';
        grammarContainer.appendChild(feedback);
        return;
    }

    grammarState.activities = fisherYatesShuffle(grammarState.activities);
    grammarState.currentIndex = 0;

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

    const words = activity.sentence.split(' ');
    grammarState.correctSentence = [...words];
    grammarState.currentWords = fisherYatesShuffle(words);
    grammarState.placedWords = new Array(words.length).fill(null);

    grammarContainer.replaceChildren();

    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap words below to fill in the blanks. Tap a filled slot to return the word.';
    grammarContainer.appendChild(instructions);

    const progress = createProgressDots();
    grammarContainer.appendChild(progress);

    const answerSlots = document.createElement('div');
    answerSlots.className = 'answer-slots';
    answerSlots.id = 'answerSlots';

    grammarState.correctSentence.forEach((_, index) => {
        const slot = document.createElement('div');
        slot.className = 'answer-slot';
        slot.dataset.slotIndex = index;
        slot.dataset.word = '';
        slot.addEventListener('click', () => handleSlotClick(slot));
        answerSlots.appendChild(slot);
    });

    grammarContainer.appendChild(answerSlots);

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

    const index = parseInt(tile.dataset.index, 10);
    const word = tile.dataset.word;

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
        soundNeutral();
        return;
    }

    emptySlot.textContent = word;
    emptySlot.dataset.word = word;
    emptySlot.classList.add('filled');

    grammarState.placedWords[emptySlotIndex] = word;
    grammarState.currentWords.splice(index, 1);
    tile.remove();

    checkAllSlotsFilled();
}

function handleSlotClick(slot) {
    initAudio();

    if (!slot.classList.contains('filled')) {
        soundNeutral();
        return;
    }

    const slotIndex = parseInt(slot.dataset.slotIndex, 10);
    const word = slot.dataset.word;

    grammarState.currentWords.push(word);

    slot.textContent = '';
    slot.dataset.word = '';
    slot.classList.remove('filled', 'correct', 'incorrect');

    grammarState.placedWords[slotIndex] = null;

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

    const allFilled = grammarState.placedWords.every(word => word !== null);
    if (!allFilled) {
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

    grammarContainer.replaceChildren();

    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap the correct word to fill in the blank.';
    grammarContainer.appendChild(instructions);

    const progress = createProgressDots();
    grammarContainer.appendChild(progress);

    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = 'sentence-display fill-sentence';
    sentenceDiv.id = 'fillSentence';

    const parts = activity.sentence.split('___');
    const beforeBlank = document.createTextNode(parts[0]);
    const blank = document.createElement('span');
    blank.className = 'fill-blank';
    blank.id = 'fillBlank';
    blank.innerHTML = '&nbsp;';
    const afterBlank = document.createTextNode(parts[1]);

    sentenceDiv.appendChild(beforeBlank);
    sentenceDiv.appendChild(blank);
    sentenceDiv.appendChild(afterBlank);
    grammarContainer.appendChild(sentenceDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-container';

    const shuffledOptions = fisherYatesShuffle(activity.options);

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

    allOptions.forEach(opt => opt.classList.add('disabled'));

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

        setTimeout(() => {
            allOptions.forEach(opt => {
                if (opt.textContent === correct) {
                    opt.classList.remove('disabled');
                    opt.classList.add('correct');
                }
            });
        }, 500);

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
    grammarContainer.replaceChildren();

    const feedback = document.createElement('div');
    feedback.className = 'grammar-feedback correct';
    feedback.textContent = '🎉 Great job! You completed all activities! 🎉';
    grammarContainer.appendChild(feedback);

    const btn = document.createElement('button');
    btn.className = 'control-btn';
    btn.style.marginTop = '20px';
    btn.textContent = 'Try Again';
    btn.addEventListener('click', generateGrammarActivity);
    grammarContainer.appendChild(btn);

    soundWin();
}

function resetGrid() {
    const mode = modeSelector.value;
    if (mode === 'grammar') {
        const activityType = grammarActivitySelector.value;
        if (activityType === 'spelling') {
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
    typedLetters: [],
    availableLetters: [],
    usedLetterIndices: [],
    keyboardMode: 'full',
    showPicture: false,
    showAudio: false,
    hintsUsed: 0
};

let spellingAudioPool = null;

function showSpellingActivity() {
    const level = levelSelector.value;
    const unit = unitSelector.value;

    spellingState.words = [...(levelUnits[level]?.[unit] || [])];
    spellingState.words = spellingState.words.filter(w => !w.includes(' ') && w.length > 1);

    if (spellingState.words.length < 3) {
        const allPhonemeWords = [];
        PHONEME_DATA.forEach(({ words: wordList }) => {
            wordList.forEach(word => {
                const cleanWord = word.replace(/\[|\]/g, '');
                if (!cleanWord.includes(' ') && cleanWord.length > 2) {
                    allPhonemeWords.push(cleanWord);
                }
            });
        });
        spellingState.words = [...spellingState.words, ...fisherYatesShuffle(allPhonemeWords).slice(0, 10)];
    }

    spellingState.words = fisherYatesShuffle(spellingState.words).slice(0, 5);

    if (spellingState.words.length === 0) {
        grammarContainer.replaceChildren();
        const feedback = document.createElement('div');
        feedback.className = 'grammar-feedback incorrect';
        feedback.textContent = 'No spelling words found for this unit. Try a different level/unit.';
        grammarContainer.appendChild(feedback);
        return;
    }

    spellingState.currentIndex = 0;
    spellingState.keyboardMode = keyboardModeSelector.value;
    spellingState.showPicture = true;
    spellingState.showAudio = false;
    spellingState.hintsUsed = 0;

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
    spellingState.typedLetters = new Array(spellingState.currentWord.length).fill(undefined);
    spellingState.usedLetterIndices = [];

    generateAvailableLetters();
    renderSpellingUI();
}

function generateAvailableLetters() {
    const wordLetters = spellingState.currentWord.toUpperCase().split('');

    if (spellingState.keyboardMode === 'limited') {
        spellingState.availableLetters = wordLetters.map((letter, index) => ({
            letter: letter,
            id: index,
            used: false
        }));
        spellingState.availableLetters = fisherYatesShuffle(spellingState.availableLetters);
    } else {
        spellingState.availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
    spellingState.usedLetterIndices = [];
}

function renderSpellingUI() {
    grammarContainer.replaceChildren();

    const instructions = document.createElement('div');
    instructions.className = 'grammar-instructions';
    instructions.textContent = 'Tap the letters to spell the word. Tap a letter slot to remove the letter.';
    grammarContainer.appendChild(instructions);

    const progress = createSpellingProgressDots();
    grammarContainer.appendChild(progress);

    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'spelling-word-display';

    const pictureDiv = document.createElement('div');
    pictureDiv.className = `spelling-picture ${spellingState.showPicture ? 'show' : ''}`;

    if (spellingState.showPicture) {
        const imageName = getSimpleFileName(spellingState.currentWord);
        const img = document.createElement('img');
        img.src = `static/imgs/words/${imageName}.jpg`;
        img.alt = spellingState.currentWord;
        img.className = 'spelling-word-img';
        img.onerror = () => {
            pictureDiv.textContent = '🖼️';
            pictureDiv.classList.add('fallback');
        };
        pictureDiv.textContent = '⏳';
        img.onload = () => {
            if (!pictureDiv.contains(img)) {
                pictureDiv.replaceChildren(img);
            }
        };
    } else {
        pictureDiv.textContent = '🖼️';
    }

    pictureDiv.title = 'Click to hear the word';
    pictureDiv.style.cursor = 'pointer';
    pictureDiv.addEventListener('click', () => {
        playSpellingAudio();
    });
    wordDisplay.appendChild(pictureDiv);

    grammarContainer.appendChild(wordDisplay);

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

    const keyboardDiv = document.createElement('div');
    keyboardDiv.className = `spelling-keyboard ${spellingState.keyboardMode === 'limited' ? 'limited' : ''}`;
    keyboardDiv.id = 'spellingKeyboard';

    const row1 = 'QWERTYUIOP'.split('');
    const row2 = 'ASDFGHJKL'.split('');
    const row3 = 'ZXCVBNM'.split('');

    let rows;
    if (spellingState.keyboardMode === 'limited') {
        rows = [spellingState.availableLetters];
    } else {
        rows = [row1, row2, row3];
    }

    rows.forEach((row) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'spelling-keyboard-row';

        row.forEach((letterObj, letterIdx) => {
            const key = document.createElement('div');
            key.className = 'spelling-key';

            let letter, letterId, isUsed;

            if (spellingState.keyboardMode === 'limited') {
                letter = letterObj.letter;
                letterId = letterObj.id;
                isUsed = letterObj.used;
            } else {
                letter = letterObj;
                letterId = letterIdx;
                isUsed = false;
            }

            key.textContent = letter;
            key.dataset.letterId = letterId;

            if (isUsed) {
                key.classList.add('used');
            }

            key.addEventListener('click', () => handleSpellingKeyClick(letter, letterId));
            rowDiv.appendChild(key);
        });

        keyboardDiv.appendChild(rowDiv);
    });

    grammarContainer.appendChild(keyboardDiv);
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

    const emptyIndex = spellingState.typedLetters.findIndex(l => l === undefined);

    if (emptyIndex === -1) {
        const lastIndex = spellingState.typedLetters.length - 1;
        const oldLetterData = spellingState.typedLetters[lastIndex];

        if (oldLetterData && oldLetterData.id !== undefined) {
            const oldUsedIdx = spellingState.usedLetterIndices.indexOf(oldLetterData.id);
            if (oldUsedIdx > -1) {
                spellingState.usedLetterIndices.splice(oldUsedIdx, 1);
            }
            const availLetter = spellingState.availableLetters.find(l => l.id === oldLetterData.id);
            if (availLetter) availLetter.used = false;
        }

        if (spellingState.keyboardMode === 'limited') {
            spellingState.typedLetters[lastIndex] = { letter: letter, id: letterId };
        } else {
            spellingState.typedLetters[lastIndex] = letter;
        }
    } else {
        if (spellingState.keyboardMode === 'limited') {
            spellingState.typedLetters[emptyIndex] = { letter: letter, id: letterId };
        } else {
            spellingState.typedLetters[emptyIndex] = letter;
        }

        if (spellingState.keyboardMode === 'limited') {
            spellingState.usedLetterIndices.push(letterId);
            const availLetter = spellingState.availableLetters.find(l => l.id === letterId);
            if (availLetter) availLetter.used = true;
        }
    }

    updateSpellingUI();

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

    spellingState.typedLetters[index] = undefined;

    if (letterData && letterData.id !== undefined) {
        const usedIdx = spellingState.usedLetterIndices.indexOf(letterData.id);
        if (usedIdx > -1) {
            spellingState.usedLetterIndices.splice(usedIdx, 1);
        }
        const availLetter = spellingState.availableLetters.find(l => l.id === letterData.id);
        if (availLetter) availLetter.used = false;
    }

    soundPop();
    updateSpellingUI();
}

function updateSpellingUI() {
    const slots = document.querySelectorAll('.spelling-letter-slot');
    slots.forEach((slot, index) => {
        const letterData = spellingState.typedLetters[index];
        const letter = letterData ? (letterData.letter || letterData) : null;
        if (letter) {
            slot.textContent = letter;
            slot.classList.add('filled');
        } else {
            slot.textContent = '';
            slot.classList.remove('filled');
        }
    });

    const keys = document.querySelectorAll('.spelling-key');
    keys.forEach(key => {
        const letterId = parseInt(key.dataset.letterId, 10);
        if (!isNaN(letterId) && spellingState.usedLetterIndices.includes(letterId)) {
            key.classList.add('used');
        } else {
            key.classList.remove('used');
        }
    });
}

function checkSpellingAnswer() {
    initAudio();

    const typedWord = spellingState.typedLetters.map(l => l ? (l.letter || l) : '').join('');
    const correctWord = spellingState.currentWord.toUpperCase();

    const slots = document.querySelectorAll('.spelling-letter-slot');

    if (typedWord === correctWord) {
        slots.forEach(slot => slot.classList.add('correct'));
        soundWin();

        setTimeout(() => {
            spellingState.currentIndex++;
            showCurrentSpellingWord();
        }, 1500);
    } else {
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

        setTimeout(() => {
            spellingState.typedLetters = new Array(spellingState.currentWord.length).fill(undefined);
            spellingState.usedLetterIndices = [];

            if (spellingState.keyboardMode === 'limited') {
                spellingState.availableLetters.forEach(l => l.used = false);
            }

            slots.forEach(slot => {
                slot.classList.remove('correct', 'incorrect', 'filled');
                slot.textContent = '';
            });

            const keys = document.querySelectorAll('.spelling-key');
            keys.forEach(key => key.classList.remove('used'));
        }, 1500);
    }
}

function useSpellingHint() {
    initAudio();

    const correctWord = spellingState.currentWord.toUpperCase();

    for (let i = 0; i < correctWord.length; i++) {
        const currentTyped = spellingState.typedLetters[i] ? (spellingState.typedLetters[i].letter || spellingState.typedLetters[i]) : '';

        if (currentTyped !== correctWord[i]) {
            const availableLetter = spellingState.availableLetters.find(l => !l.used && l.letter === correctWord[i]);

            if (availableLetter) {
                const oldLetterData = spellingState.typedLetters[i];

                if (oldLetterData && oldLetterData.id !== undefined) {
                    const oldUsedIdx = spellingState.usedLetterIndices.indexOf(oldLetterData.id);
                    if (oldUsedIdx > -1) {
                        spellingState.usedLetterIndices.splice(oldUsedIdx, 1);
                    }
                    const oldAvail = spellingState.availableLetters.find(l => l.id === oldLetterData.id);
                    if (oldAvail) oldAvail.used = false;
                }

                if (spellingState.keyboardMode === 'limited') {
                    spellingState.typedLetters[i] = { letter: correctWord[i], id: availableLetter.id };
                } else {
                    spellingState.typedLetters[i] = correctWord[i];
                }

                spellingState.usedLetterIndices.push(availableLetter.id);
                availableLetter.used = true;

                soundPop();
                updateSpellingUI();

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
    initAudio();

    const audioName = getSimpleFileName(spellingState.currentWord);
    const audioPath = `static/audio/${audioName}.mp3`;

    if (!spellingAudioPool) {
        spellingAudioPool = new Audio();
    }

    spellingAudioPool.src = audioPath;
    spellingAudioPool.play().catch(() => {
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
    grammarContainer.replaceChildren();

    const feedback = document.createElement('div');
    feedback.className = 'grammar-feedback correct';
    feedback.textContent = '🎉 Great job! You spelled all the words! 🎉';
    grammarContainer.appendChild(feedback);

    const btn = document.createElement('button');
    btn.className = 'control-btn';
    btn.style.marginTop = '20px';
    btn.textContent = 'Try Again';
    btn.addEventListener('click', showSpellingActivity);
    grammarContainer.appendChild(btn);

    soundWin();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}
