// ── Constants ──────────────────────────────────────────────────────────
const BASE_POINTS           = 100;
const TIME_BONUS_MULTIPLIER = 10;
const REVEAL_DELAY          = 1500;  // ms to show answer before advancing

// Key mappings per player [0]=P1, [1]=P2, [2]=P3, [3]=P4
// "code" is checked via e.code; "key" via e.key
const PLAYER_KEYS = [
    { left: { code: 'F21' },        right: { code: 'F18' } },
    { left: { key:  'ArrowLeft' },  right: { key:  'ArrowRight' } },
    { left: { code: 'F19' },        right: { code: 'F20' } },
    { left: { code: 'F22' },        right: { code: 'F23' } },
];

// ── Configurable Settings ─────────────────────────────────────────────
let TOTAL_QUESTIONS    = 10;
let TIMER_DURATION     = 10;
let NUM_PLAYERS        = 2;
let selectedCategories = [];
let allQuestions       = [];
let questionCategories = {};

// ── State ──────────────────────────────────────────────────────────────
let currentQuestion = 0;
let timer           = TIMER_DURATION;
let timerInterval   = null;
let gameActive      = false;
let revealActive    = false;

// All player state stored in arrays (index 0 = Player 1)
let playerScores   = [0, 0, 0, 0];
let playerStreaks   = [0, 0, 0, 0];
let playerAnswered = [false, false, false, false];
let playerAnswers  = [null, null, null, null];
let playerTimes    = [0, 0, 0, 0];

let gameResults      = [];
let currentQuestions = [];

// ── DOM References ─────────────────────────────────────────────────────
let startScreen, testerScreen, endScreen, editorScreen;
let sentenceEl, qCounterEl, timerEl, timerBarEl;
let leftBtn, rightBtn, leftBtnText, rightBtnText;
let gameContainer, categoriesContainer, numQuestionsSelect, numPlayersSelect, timeLimitSelect;
let winnerEl, resultsBody;

// Per-player DOM arrays (index 0 = Player 1)
let indicators   = [];  // #p{n}-indicator
let choiceEls    = [];  // #p{n}-choice
let scoreHuds    = [];  // #p{n}-score-hud
let streakBadges = [];  // #p{n}-streak-badge
let finalEls     = [];  // #p{n}-final
let totalEls     = [];  // #p{n}-total
let dotLeft      = [];  // #left-dot-p{n}
let dotRight     = [];  // #right-dot-p{n}

// Button tester elements per player
let playerButtons = [];

// ── Initialize DOM References ──────────────────────────────────────────
function initDOM() {
    startScreen  = document.getElementById('start-screen');
    testerScreen = document.getElementById('tester-screen');
    endScreen    = document.getElementById('end-screen');
    editorScreen = document.getElementById('editor-screen');
    sentenceEl   = document.getElementById('sentence');
    qCounterEl   = document.getElementById('question-counter');
    timerEl      = document.getElementById('timer');
    timerBarEl   = document.getElementById('timer-bar');
    leftBtn      = document.getElementById('left-btn');
    rightBtn     = document.getElementById('right-btn');
    leftBtnText  = leftBtn.querySelector('.btn-text');
    rightBtnText = rightBtn.querySelector('.btn-text');
    gameContainer       = document.getElementById('game-container');
    categoriesContainer = document.getElementById('categories-container');
    numQuestionsSelect  = document.getElementById('num-questions');
    numPlayersSelect    = document.getElementById('num-players');
    timeLimitSelect     = document.getElementById('time-limit');
    winnerEl            = document.getElementById('winner-announcement');
    resultsBody         = document.getElementById('results-body');

    // Build per-player DOM arrays
    for (let i = 1; i <= 4; i++) {
        indicators.push(document.getElementById(`p${i}-indicator`));
        choiceEls.push(document.getElementById(`p${i}-choice`));
        scoreHuds.push(document.getElementById(`p${i}-score-hud`));
        streakBadges.push(document.getElementById(`p${i}-streak-badge`));
        finalEls.push(document.getElementById(`p${i}-final`));
        totalEls.push(document.getElementById(`p${i}-total`));
        dotLeft.push(document.getElementById(`left-dot-p${i}`));
        dotRight.push(document.getElementById(`right-dot-p${i}`));
    }

    // Button tester elements (only collect elements that exist)
    ['p1', 'p2', 'p3', 'p4'].forEach(p => {
        const btns = {};
        ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y'].forEach(name => {
            const el = document.getElementById(`${p}-btn-${name}`);
            if (el) btns[name] = el;
        });
        playerButtons.push(btns);
    });

    // Update controls info when player count changes
    numPlayersSelect.addEventListener('change', updateStartScreenPlayers);
    updateStartScreenPlayers();
}

// ── Update Start Screen for Selected Player Count ─────────────────────
function updateStartScreenPlayers() {
    const n = parseInt(numPlayersSelect.value);
    // Show P3/P4 controls info only when enough players are selected
    for (let i = 3; i <= 4; i++) {
        const show = i <= n;
        document.querySelectorAll(`.controls-info .p${i}`).forEach(el => {
            el.style.display = show ? '' : 'none';
        });
    }
}

// ── Show/Hide All Player-Specific Elements ────────────────────────────
function applyPlayerCount() {
    for (let i = 1; i <= 4; i++) {
        const show = i <= NUM_PLAYERS;
        // HUD score panels
        document.querySelectorAll(`.hud-score.p${i}`).forEach(el => {
            el.style.display = show ? 'flex' : 'none';
        });
        // In-game player indicator panels
        if (indicators[i - 1]) {
            indicators[i - 1].style.display = show ? 'flex' : 'none';
        }
        // End-screen final score boxes
        document.querySelectorAll(`.final-score-box.p${i}`).forEach(el => {
            el.style.display = show ? '' : 'none';
        });
        // Results table player columns (headers, cells, footer)
        document.querySelectorAll(`.p${i}-col`).forEach(el => {
            el.style.display = show ? '' : 'none';
        });
    }
}

// ── Audio (Web Audio API) ──────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playTone(freq, type, dur, vol = 0.22) {
    try {
        const ctx  = getAudio();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
    } catch(e) {}
}
function sfxClick()   { playTone(440, 'square', 0.07, 0.12); }
function sfxCorrect() {
    playTone(523, 'sine', 0.12, 0.22);
    setTimeout(() => playTone(659, 'sine', 0.15, 0.22), 90);
    setTimeout(() => playTone(784, 'sine', 0.2,  0.26), 180);
}
function sfxWrong() {
    playTone(220, 'sawtooth', 0.22, 0.2);
    setTimeout(() => playTone(175, 'sawtooth', 0.22, 0.2), 130);
}
function sfxTick()    { playTone(880, 'sine', 0.05, 0.08); }
function sfxGameOver() {
    [523, 494, 440, 392].forEach((f, i) =>
        setTimeout(() => playTone(f, 'sine', 0.26, 0.22), i * 140));
}

// ── Load Questions from JSON ──────────────────────────────────────────
function loadQuestionsFromJSON() {
    try {
        // Reads directly from the gameData variable loaded in questions.js
        questionCategories = gameData.categories;
        allQuestions = gameData.questions;
        initializeCategoryCheckboxes();
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Error: Failed to load game data.');
    }
}

// ── Initialize Category Checkboxes ───────────────────────────────────
function initializeCategoryCheckboxes() {
    categoriesContainer.innerHTML = '';
    selectedCategories = [];
    Object.keys(questionCategories).forEach(catKey => {
        const cat = questionCategories[catKey];
        const label = document.createElement('label');
        label.className = 'category-checkbox checked';
        label.innerHTML = `
            <input type="checkbox" value="${catKey}" checked>
            <span class="checkmark"></span>
            <span class="cat-name">${cat.name}</span>
            <span class="cat-desc">${cat.description}</span>
        `;
        label.querySelector('input').addEventListener('change', function() {
            label.classList.toggle('checked', this.checked);
            updateSelectedCategories();
        });
        categoriesContainer.appendChild(label);
        selectedCategories.push(catKey);
    });
}

function updateSelectedCategories() {
    selectedCategories = [];
    categoriesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selectedCategories.push(cb.value);
    });
}

// ── Get Filtered Questions ────────────────────────────────────────────
function getFilteredQuestions() {
    if (selectedCategories.length === 0) return allQuestions;
    return allQuestions.filter(q => selectedCategories.includes(q.category));
}

// ── Screen Navigation ─────────────────────────────────────────────────
function showTesterScreen() {
    startScreen.style.display = 'none';
    testerScreen.classList.add('show');
}

function showStartScreen() {
    testerScreen.classList.remove('show');
    editorScreen.classList.remove('show');
    startScreen.style.display = 'flex';
}

// ── Button Tester Highlight ───────────────────────────────────────────
function highlightButton(playerNum, buttonName) {
    const btns = playerButtons[playerNum - 1];
    const el   = btns && btns[buttonName];
    if (!el) return;
    const cls = `p${playerNum}-active`;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 150);
}

// ── Questions Editor Functions ────────────────────────────────────────
function showEditorScreen() {
    startScreen.style.display = 'none';
    editorScreen.classList.add('show');
    populateCategorySelect();
    renderQuestionsList();
    renderCategoriesList();
}

// Fix: pass the clicked button element instead of relying on implicit global `event`
function showEditorTab(tabName, clickedBtn) {
    document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('editor-' + tabName).classList.add('active');
    clickedBtn.classList.add('active');
}

function populateCategorySelect() {
    const select = document.getElementById('question-category');
    select.innerHTML = '';
    Object.keys(questionCategories).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = questionCategories[key].name;
        select.appendChild(opt);
    });
}

function renderQuestionsList() {
    const list = document.getElementById('questions-list');
    list.innerHTML = '';
    allQuestions.forEach((q, index) => {
        const catName = questionCategories[q.category]?.name || q.category;
        const item = document.createElement('div');
        item.className = 'editor-item';
        item.innerHTML = `
            <div class="editor-item-content">
                <div class="editor-item-title">${q.sentence}</div>
                <div class="editor-item-subtitle">
                    ${catName} | Options: ${q.options[0]}, ${q.options[1]} | Correct: ${q.correct}
                </div>
            </div>
            <div class="editor-item-actions">
                <button class="editor-item-btn edit"   onclick="editQuestion(${index})">Edit</button>
                <button class="editor-item-btn delete" onclick="deleteQuestion(${index})">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderCategoriesList() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';
    Object.keys(questionCategories).forEach(key => {
        const cat = questionCategories[key];
        const item = document.createElement('div');
        item.className = 'editor-item';
        item.innerHTML = `
            <div class="editor-item-content">
                <div class="editor-item-title">${cat.name}</div>
                <div class="editor-item-subtitle">${cat.description}</div>
            </div>
            <div class="editor-item-actions">
                <button class="editor-item-btn edit"   onclick="editCategory('${key}')">Edit</button>
                <button class="editor-item-btn delete" onclick="deleteCategory('${key}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function saveQuestion() {
    const sentence  = document.getElementById('question-sentence').value.trim();
    const category  = document.getElementById('question-category').value;
    const option1   = document.getElementById('question-option1').value.trim();
    const option2   = document.getElementById('question-option2').value.trim();
    const correct   = document.getElementById('question-correct').value;
    const editIndex = parseInt(document.getElementById('edit-question-index').value);

    if (!sentence || !option1 || !option2) { alert('Please fill in all fields'); return; }

    const newQuestion = {
        category,
        sentence,
        options: [option1, option2],
        correct: correct === 'option1' ? option1 : option2,
    };

    if (editIndex >= 0) allQuestions[editIndex] = newQuestion;
    else                allQuestions.push(newQuestion);

    clearQuestionForm();
    renderQuestionsList();
}

function clearQuestionForm() {
    document.getElementById('question-sentence').value    = '';
    document.getElementById('question-option1').value     = '';
    document.getElementById('question-option2').value     = '';
    document.getElementById('question-correct').value     = 'option1';
    document.getElementById('edit-question-index').value  = '-1';
    document.getElementById('question-form-title').textContent = 'Add New Question';
}

function editQuestion(index) {
    const q = allQuestions[index];
    document.getElementById('question-sentence').value   = q.sentence;
    document.getElementById('question-category').value   = q.category;
    document.getElementById('question-option1').value    = q.options[0];
    document.getElementById('question-option2').value    = q.options[1];
    document.getElementById('question-correct').value    = q.correct === q.options[0] ? 'option1' : 'option2';
    document.getElementById('edit-question-index').value = index;
    document.getElementById('question-form-title').textContent = 'Edit Question';
}

function deleteQuestion(index) {
    if (confirm('Are you sure you want to delete this question?')) {
        allQuestions.splice(index, 1);
        renderQuestionsList();
    }
}

function saveCategory() {
    const key     = document.getElementById('category-key').value.trim().replace(/\s+/g, '_');
    const name    = document.getElementById('category-name').value.trim();
    const desc    = document.getElementById('category-desc').value.trim();
    const editKey = document.getElementById('edit-category-key').value;

    if (!key || !name) { alert('Please fill in category key and name'); return; }

    if (editKey && editKey !== key) {
        delete questionCategories[editKey];
        allQuestions.forEach(q => { if (q.category === editKey) q.category = key; });
    }

    questionCategories[key] = { name, description: desc };
    clearCategoryForm();
    populateCategorySelect();
    renderCategoriesList();
    renderQuestionsList();
}

function clearCategoryForm() {
    document.getElementById('category-key').value      = '';
    document.getElementById('category-name').value     = '';
    document.getElementById('category-desc').value     = '';
    document.getElementById('edit-category-key').value = '';
}

function editCategory(key) {
    const cat = questionCategories[key];
    document.getElementById('category-key').value      = key;
    document.getElementById('category-name').value     = cat.name;
    document.getElementById('category-desc').value     = cat.description;
    document.getElementById('edit-category-key').value = key;
}

function deleteCategory(key) {
    if (Object.keys(questionCategories).length <= 1) {
        alert('Cannot delete the last category'); return;
    }
    if (confirm('Are you sure? Questions using this category will also be removed.')) {
        delete questionCategories[key];
        allQuestions = allQuestions.filter(q => q.category !== key);
        populateCategorySelect();
        renderCategoriesList();
        renderQuestionsList();
    }
}

function exportQuestions() {
    const blob = new Blob(
        [JSON.stringify({ categories: questionCategories, questions: allQuestions }, null, 2)],
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = 'questions.json'; a.click();
    URL.revokeObjectURL(url);
}

function importQuestions() {
    const file = document.getElementById('import-file').files[0];
    if (!file) { alert('Please select a file to import'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.categories) questionCategories = data.categories;
            if (data.questions)  allQuestions = data.questions;
            populateCategorySelect();
            renderQuestionsList();
            renderCategoriesList();
            alert('Questions imported successfully!');
        } catch (err) {
            alert('Error importing file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if (confirm('Reset to default questions? All custom questions will be lost.')) {
        loadQuestionsFromJSON().then(() => {
            populateCategorySelect();
            renderQuestionsList();
            renderCategoriesList();
            alert('Questions reset to default!');
        });
    }
}

function applyEditorChanges() {
    initializeCategoryCheckboxes();
    alert('Changes applied! The game will use your updated questions.');
    showStartScreen();
}

// ── Helpers ────────────────────────────────────────────────────────────
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function streakMultiplier(streak) {
    if (streak >= 4) return 2.0;
    if (streak >= 3) return 1.5;
    if (streak >= 2) return 1.25;
    return 1.0;
}

// ── HUD & Score UI ────────────────────────────────────────────────────
function updateHudScores() {
    for (let i = 0; i < NUM_PLAYERS; i++) {
        scoreHuds[i].textContent = playerScores[i];
    }
}

function bumpScore(el) {
    el.classList.remove('bump');
    void el.offsetWidth;  // force reflow to restart animation
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 200);
}

// i is 0-indexed
function updateStreakUI(i) {
    const streak = playerStreaks[i];
    streakBadges[i].textContent = `🔥${streak}`;
    streakBadges[i].classList.toggle('active', streak >= 2);
}

// i is 0-indexed
function spawnScorePopup(points, i) {
    if (!points) return;
    const popup = document.createElement('div');
    popup.className   = `score-popup p${i + 1}`;
    popup.textContent = `+${points}`;
    const crect = gameContainer.getBoundingClientRect();
    const irect = indicators[i].getBoundingClientRect();
    popup.style.left = (irect.left - crect.left + irect.width / 2 - 24) + 'px';
    popup.style.top  = (irect.top  - crect.top  - 16) + 'px';
    gameContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 1300);
}

// ── selectOption ──────────────────────────────────────────────────────
function selectOption(playerNum, side) {
    if (!gameActive || revealActive) return;

    const i = playerNum - 1;
    if (i >= NUM_PLAYERS || playerAnswered[i]) return;

    sfxClick();

    const btn    = side === 'left' ? leftBtn : rightBtn;
    const chosen = btn.dataset.option;

    playerAnswered[i] = true;
    playerAnswers[i]  = chosen;
    playerTimes[i]    = TIMER_DURATION - timer;

    indicators[i].classList.add('answered');
    choiceEls[i].textContent = chosen;
    btn.classList.add(`chosen-p${playerNum}`);
    (side === 'left' ? dotLeft[i] : dotRight[i]).classList.add('visible');

    // If every active player has answered, reveal immediately
    if (playerAnswered.slice(0, NUM_PLAYERS).every(Boolean)) {
        clearInterval(timerInterval);
        revealAnswers();
    }
}

// ── Timer ──────────────────────────────────────────────────────────────
function startTimer() {
    clearInterval(timerInterval);
    timer = TIMER_DURATION;
    timerEl.textContent = timer;

    // Reset bar without transition, then animate
    timerBarEl.style.transition = 'none';
    timerBarEl.style.width      = '100%';
    timerBarEl.style.background = '#27ae60';
    setTimeout(() => {
        timerBarEl.style.transition = `width ${TIMER_DURATION}s linear, background ${TIMER_DURATION * 0.5}s ${TIMER_DURATION * 0.5}s`;
        timerBarEl.style.width      = '0%';
        timerBarEl.style.background = '#e74c3c';
    }, 40);

    timerInterval = setInterval(() => {
        timer--;
        timerEl.textContent = timer;
        if (timer <= 2) sfxTick();
        if (timer <= 0) { clearInterval(timerInterval); revealAnswers(); }
    }, 1000);
}

// ── Answer Reveal ──────────────────────────────────────────────────────
function revealAnswers() {
    revealActive = true;
    clearInterval(timerInterval);

    const q       = currentQuestions[currentQuestion];
    const correct = q.correct;

    // Colour the option buttons
    [leftBtn, rightBtn].forEach(btn => {
        btn.classList.add(btn.dataset.option === correct ? 'reveal-correct' : 'reveal-wrong');
    });

    // Evaluate each player
    const pts = [];
    let anyCorrect = false;
    let anyAnswered = false;

    for (let i = 0; i < NUM_PLAYERS; i++) {
        const ok = playerAnswers[i] === correct;
        if (ok)              { playerStreaks[i]++; anyCorrect = true; }
        else                   playerStreaks[i] = 0;
        if (playerAnswers[i])  anyAnswered = true;

        const mult = streakMultiplier(playerStreaks[i]);
        const p = ok
            ? Math.round((BASE_POINTS + Math.max(0, TIMER_DURATION - playerTimes[i]) * TIME_BONUS_MULTIPLIER) * mult)
            : 0;
        pts.push(p);
        playerScores[i] += p;

        if (playerAnswers[i]) {
            choiceEls[i].textContent = `${ok ? '✓' : '✗'} ${playerAnswers[i]}`;
        }
    }

    if (anyCorrect)       sfxCorrect();
    else if (anyAnswered) sfxWrong();

    // Record result for the end-screen table
    const result = { question: currentQuestion + 1, sentence: q.sentence, correct };
    for (let i = 0; i < NUM_PLAYERS; i++) {
        result[`p${i + 1}Answer`] = playerAnswers[i] || '—';
        result[`p${i + 1}Points`] = pts[i];
    }
    gameResults.push(result);

    // Update HUD
    updateHudScores();
    for (let i = 0; i < NUM_PLAYERS; i++) {
        if (pts[i]) bumpScore(scoreHuds[i]);
        updateStreakUI(i);
        setTimeout(() => spawnScorePopup(pts[i], i), i * 180);
    }

    // Advance after reveal delay
    setTimeout(() => {
        currentQuestion++;
        revealActive = false;
        loadQuestion();
    }, REVEAL_DELAY);
}

// ── Load Question ──────────────────────────────────────────────────────
function loadQuestion() {
    if (currentQuestion >= TOTAL_QUESTIONS) { endGame(); return; }

    // Reset per-player state for this question
    for (let i = 0; i < NUM_PLAYERS; i++) {
        playerAnswered[i] = false;
        playerAnswers[i]  = null;
        playerTimes[i]    = 0;
        indicators[i].classList.remove('answered');
        choiceEls[i].textContent = '—';
    }

    const q = currentQuestions[currentQuestion];
    sentenceEl.innerHTML   = q.sentence.replace('___', '<span class="blank">___</span>');
    qCounterEl.textContent = `Question ${currentQuestion + 1} of ${TOTAL_QUESTIONS}`;

    // Randomise which option appears left vs right
    const opts = shuffle([...q.options]);
    leftBtn.dataset.option   = opts[0];
    rightBtn.dataset.option  = opts[1];
    leftBtnText.textContent  = opts[0];
    rightBtnText.textContent = opts[1];

    // Clear button visual state
    leftBtn.className  = 'option-btn';
    rightBtn.className = 'option-btn';

    // Clear all player dots
    for (let i = 0; i < 4; i++) {
        dotLeft[i]?.classList.remove('visible');
        dotRight[i]?.classList.remove('visible');
    }

    startTimer();
}

// ── Game Flow ──────────────────────────────────────────────────────────
function startGame() {
    try { getAudio().resume(); } catch(e) {}

    TOTAL_QUESTIONS = parseInt(numQuestionsSelect.value);
    TIMER_DURATION  = parseInt(timeLimitSelect.value);
    NUM_PLAYERS     = parseInt(numPlayersSelect.value);

    const filteredQuestions = getFilteredQuestions();
    if (filteredQuestions.length === 0) {
        alert('Please select at least one category!'); return;
    }

    // Cap question count at what's available
    const actualCount    = Math.min(TOTAL_QUESTIONS, filteredQuestions.length);
    currentQuestions     = shuffle(filteredQuestions).slice(0, actualCount);
    TOTAL_QUESTIONS      = actualCount;
    currentQuestion      = 0;

    // Reset all player state
    for (let i = 0; i < 4; i++) {
        playerScores[i]  = 0;
        playerStreaks[i] = 0;
    }
    gameResults = [];

    // Show/hide player elements based on player count
    applyPlayerCount();

    startScreen.style.display = 'none';
    endScreen.classList.remove('show');

    updateHudScores();
    for (let i = 0; i < NUM_PLAYERS; i++) updateStreakUI(i);

    gameActive   = true;
    revealActive = false;
    loadQuestion();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    sfxGameOver();

    // Determine winner(s)
    const maxScore = Math.max(...playerScores.slice(0, NUM_PLAYERS));
    const winners  = [];
    for (let i = 0; i < NUM_PLAYERS; i++) {
        if (playerScores[i] === maxScore) winners.push(i + 1);
    }

    let winText, winClass;
    if (winners.length > 1) {
        winText  = "🤝 It's a Tie!";
        winClass = 'tie';
    } else {
        winText  = `🎉 Player ${winners[0]} Wins!`;
        winClass = `p${winners[0]}-win`;
    }
    winnerEl.textContent = winText;
    winnerEl.className   = winClass;

    // Fill final score boxes and table totals
    for (let i = 0; i < NUM_PLAYERS; i++) {
        finalEls[i].textContent = playerScores[i];
        totalEls[i].textContent = playerScores[i];
    }

    // Build results table rows
    resultsBody.innerHTML = '';
    gameResults.forEach(r => {
        const row = document.createElement('tr');
        let html = `<td>${r.question}</td><td>${r.sentence}</td><td class="cell-correct">${r.correct}</td>`;
        for (let i = 0; i < NUM_PLAYERS; i++) {
            const n   = i + 1;
            const ans = r[`p${n}Answer`];
            const pts = r[`p${n}Points`];
            const cls = ans !== '—' ? (ans === r.correct ? 'cell-correct' : 'cell-wrong') : '';
            html += `<td class="p${n}-col ${cls}">${ans}</td><td class="p${n}-col">${pts}</td>`;
        }
        row.innerHTML = html;
        resultsBody.appendChild(row);
    });

    endScreen.classList.add('show');
}

function restartGame() {
    endScreen.classList.remove('show');
    startScreen.style.display = 'flex';
}

// ── Keyboard Controls ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.repeat) return;

    PLAYER_KEYS.forEach((keys, i) => {
        const playerNum   = i + 1;
        const matchLeft  = keys.left.code  ? e.code === keys.left.code  : e.key === keys.left.key;
        const matchRight = keys.right.code ? e.code === keys.right.code : e.key === keys.right.key;

        if (matchLeft) {
            e.preventDefault();
            highlightButton(playerNum, 'left');
            selectOption(playerNum, 'left');
        } else if (matchRight) {
            e.preventDefault();
            highlightButton(playerNum, 'right');
            selectOption(playerNum, 'right');
        }
    });
});

// ── Initialize ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    loadQuestionsFromJSON();
});
