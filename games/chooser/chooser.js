// ── Constants ──────────────────────────────────────────────────────────
const BASE_POINTS           = 100;
const TIME_BONUS_MULTIPLIER = 10;
const REVEAL_DELAY          = 1500;   // ms to show correct/wrong before advancing

// ── Configurable Settings ─────────────────────────────────────────────
let TOTAL_QUESTIONS    = 10;
let TIMER_DURATION     = 5;
let selectedCategories = [];
let allQuestions       = [];
let questionCategories = {};

// ── State ──────────────────────────────────────────────────────────────
let currentQuestion = 0;
let timer           = TIMER_DURATION;
let timerInterval   = null;
let gameActive      = false;
let revealActive    = false;  // blocks input during the answer-reveal phase

let player1Score  = 0, player2Score  = 0;
let player1Streak = 0, player2Streak = 0;

// BUG FIX: these are now properly guarded per-player (see selectOption below)
let player1Answered = false, player2Answered = false;
let player1Answer   = null,  player2Answer   = null;
let player1Time     = 0,     player2Time     = 0;

let gameResults      = [];
let currentQuestions = [];

// ── DOM ────────────────────────────────────────────────────────────────
let startScreen, testerScreen, endScreen, sentenceEl, qCounterEl, timerEl, timerBarEl;
let leftBtn, rightBtn, leftBtnText, rightBtnText;
let leftDotP1, leftDotP2, rightDotP1, rightDotP2;
let p1Indicator, p2Indicator, p1ChoiceEl, p2ChoiceEl;
let p1ScoreHud, p2ScoreHud, p1StreakBadge, p2StreakBadge;
let winnerEl, resultsBody, p1TotalEl, p2TotalEl, p1FinalEl, p2FinalEl;
let gameContainer, categoriesContainer, numQuestionsSelect, timeLimitSelect;
let editorScreen;

// Button tester elements
let p1Buttons, p2Buttons;

// ── Initialize DOM References ──────────────────────────────────────────
function initDOM() {
    startScreen      = document.getElementById('start-screen');
    testerScreen     = document.getElementById('tester-screen');
    endScreen        = document.getElementById('end-screen');
    editorScreen     = document.getElementById('editor-screen');
    sentenceEl       = document.getElementById('sentence');
    qCounterEl       = document.getElementById('question-counter');
    timerEl          = document.getElementById('timer');
    timerBarEl       = document.getElementById('timer-bar');
    leftBtn          = document.getElementById('left-btn');
    rightBtn         = document.getElementById('right-btn');
    leftBtnText      = leftBtn.querySelector('.btn-text');
    rightBtnText     = rightBtn.querySelector('.btn-text');
    leftDotP1        = document.getElementById('left-dot-p1');
    leftDotP2        = document.getElementById('left-dot-p2');
    rightDotP1       = document.getElementById('right-dot-p1');
    rightDotP2       = document.getElementById('right-dot-p2');
    p1Indicator      = document.getElementById('p1-indicator');
    p2Indicator      = document.getElementById('p2-indicator');
    p1ChoiceEl       = document.getElementById('p1-choice');
    p2ChoiceEl       = document.getElementById('p2-choice');
    p1ScoreHud       = document.getElementById('p1-score-hud');
    p2ScoreHud       = document.getElementById('p2-score-hud');
    p1StreakBadge    = document.getElementById('p1-streak-badge');
    p2StreakBadge    = document.getElementById('p2-streak-badge');
    winnerEl         = document.getElementById('winner-announcement');
    resultsBody      = document.getElementById('results-body');
    p1TotalEl        = document.getElementById('p1-total');
    p2TotalEl        = document.getElementById('p2-total');
    p1FinalEl        = document.getElementById('p1-final');
    p2FinalEl        = document.getElementById('p2-final');
    gameContainer    = document.getElementById('game-container');
    categoriesContainer = document.getElementById('categories-container');
    numQuestionsSelect = document.getElementById('num-questions');
    timeLimitSelect    = document.getElementById('time-limit');

    // Button tester elements
    p1Buttons = {
        up: document.getElementById('p1-btn-up'),
        down: document.getElementById('p1-btn-down'),
        left: document.getElementById('p1-btn-left'),
        right: document.getElementById('p1-btn-right'),
        a: document.getElementById('p1-btn-a'),
        b: document.getElementById('p1-btn-b'),
        x: document.getElementById('p1-btn-x'),
        y: document.getElementById('p1-btn-y')
    };
    p2Buttons = {
        up: document.getElementById('p2-btn-up'),
        down: document.getElementById('p2-btn-down'),
        left: document.getElementById('p2-btn-left'),
        right: document.getElementById('p2-btn-right'),
        a: document.getElementById('p2-btn-a'),
        b: document.getElementById('p2-btn-b'),
        x: document.getElementById('p2-btn-x'),
        y: document.getElementById('p2-btn-y')
    };
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
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
    } catch(e) {}
}
function sfxClick() { playTone(440, 'square', 0.07, 0.12); }
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

// ── Load Questions from JSON ─────────────────────────────────────────
async function loadQuestionsFromJSON() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questionCategories = data.categories;
        allQuestions = data.questions;
        initializeCategoryCheckboxes();
    } catch (error) {
        console.error('Failed to load questions.json, using fallback:', error);
        // Fallback to embedded questions with categories
        allQuestions = [
            { category: "simple_present", sentence: "He ___ an apple every day.", options: ["have", "has"], correct: "has" },
            { category: "simple_present", sentence: "She ___ to school by bus.", options: ["go", "goes"], correct: "goes" },
            { category: "simple_present", sentence: "I ___ a student at this school.", options: ["am", "is"], correct: "am" },
            { category: "simple_present", sentence: "The train ___ at 8:00 every morning.", options: ["leave", "leaves"], correct: "leaves" },
            { category: "simple_present", sentence: "She ___ English every day.", options: ["study", "studies"], correct: "studies" },
            { category: "present_continuous", sentence: "They ___ playing football now.", options: ["is", "are"], correct: "are" },
            { category: "present_continuous", sentence: "The children ___ in the garden now.", options: ["play", "are playing"], correct: "are playing" },
            { category: "present_continuous", sentence: "I ___ TV right now.", options: ["watch", "am watching"], correct: "am watching" },
            { category: "present_continuous", sentence: "She ___ a letter at the moment.", options: ["write", "is writing"], correct: "is writing" },
            { category: "present_continuous", sentence: "The chef ___ dinner for us.", options: ["prepare", "is preparing"], correct: "is preparing" },
            { category: "present_perfect", sentence: "He ___ never ___ to Paris.", options: ["has / been", "have / been"], correct: "has / been" },
            { category: "present_perfect", sentence: "She ___ English for five years.", options: ["study", "has studied"], correct: "has studied" },
            { category: "present_perfect", sentence: "The baby ___ all morning.", options: ["cry", "has been crying"], correct: "has been crying" },
            { category: "present_perfect", sentence: "They ___ in London since 2010.", options: ["live", "have lived"], correct: "have lived" },
            { category: "present_perfect", sentence: "I ___ this book before.", options: ["read", "have read"], correct: "have read" },
            { category: "simple_past", sentence: "The cat ___ on the roof yesterday.", options: ["sit", "sat"], correct: "sat" },
            { category: "simple_past", sentence: "We ___ to the park last Sunday.", options: ["go", "went"], correct: "went" },
            { category: "simple_past", sentence: "She ___ her homework before dinner.", options: ["finish", "finished"], correct: "finished" },
            { category: "simple_past", sentence: "I ___ my keys somewhere yesterday.", options: ["lose", "lost"], correct: "lost" },
            { category: "simple_past", sentence: "He ___ his car last week.", options: ["sell", "sold"], correct: "sold" },
            { category: "simple_past", sentence: "She ___ to the store and bought milk.", options: ["go", "went"], correct: "went" },
            { category: "past_continuous", sentence: "We ___ dinner when the phone rang.", options: ["have", "were having"], correct: "were having" },
            { category: "past_continuous", sentence: "I ___ TV when you called me.", options: ["watch", "was watching"], correct: "was watching" },
            { category: "past_continuous", sentence: "She ___ a shower when the power went out.", options: ["take", "was taking"], correct: "was taking" },
            { category: "past_continuous", sentence: "They ___ for the bus when it started raining.", options: ["wait", "were waiting"], correct: "were waiting" },
            { category: "future", sentence: "The students ___ their exam tomorrow.", options: ["take", "will take"], correct: "will take" },
            { category: "future", sentence: "I ___ you next weekend.", options: ["visit", "will visit"], correct: "will visit" },
            { category: "future", sentence: "It ___ rain later today.", options: ["will", "is going to"], correct: "is going to" },
            { category: "future", sentence: "She ___ to the party tonight.", options: ["come", "will come"], correct: "will come" }
        ];
        questionCategories = {
            simple_present: { name: "Simple Present", description: "Habits, general truths" },
            present_continuous: { name: "Present Continuous", description: "Actions happening now" },
            present_perfect: { name: "Present Perfect", description: "Past to present" },
            simple_past: { name: "Simple Past", description: "Completed past actions" },
            past_continuous: { name: "Past Continuous", description: "Actions in progress" },
            future: { name: "Future", description: "Predictions and plans" }
        };
        initializeCategoryCheckboxes();
    }
}

// ── Initialize Category Checkboxes ───────────────────────────────────
function initializeCategoryCheckboxes() {
    categoriesContainer.innerHTML = '';
    selectedCategories = [];
    Object.keys(questionCategories).forEach(catKey => {
        const cat = questionCategories[catKey];
        const checkbox = document.createElement('label');
        checkbox.className = 'category-checkbox checked';
        checkbox.innerHTML = `
            <input type="checkbox" value="${catKey}" checked>
            <span class="checkmark"></span>
            <span class="cat-name">${cat.name}</span>
            <span class="cat-desc">${cat.description}</span>
        `;
        checkbox.querySelector('input').addEventListener('change', function() {
            checkbox.classList.toggle('checked', this.checked);
            updateSelectedCategories();
        });
        categoriesContainer.appendChild(checkbox);
        selectedCategories.push(catKey);
    });
}

function updateSelectedCategories() {
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]');
    selectedCategories = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selectedCategories.push(cb.value);
    });
}

// ── Get Filtered Questions ───────────────────────────────────────────
function getFilteredQuestions() {
    if (selectedCategories.length === 0) return allQuestions;
    return allQuestions.filter(q => selectedCategories.includes(q.category));
}

// ── Button Tester Functions ──────────────────────────────────────────
function showTesterScreen() {
    startScreen.style.display = 'none';
    testerScreen.classList.add('show');
}

function showStartScreen() {
    testerScreen.classList.remove('show');
    editorScreen.classList.remove('show');
    startScreen.style.display = 'flex';
}

function highlightButton(player, button) {
    const buttons = player === 1 ? p1Buttons : p2Buttons;
    const btnEl = buttons[button];
    if (btnEl) {
        btnEl.classList.add(player === 1 ? 'p1-active' : 'p2-active');
        setTimeout(() => {
            btnEl.classList.remove('p1-active', 'p2-active');
        }, 150);
    }
}

// ── Questions Editor Functions ────────────────────────────────────────
function showEditorScreen() {
    startScreen.style.display = 'none';
    editorScreen.classList.add('show');
    populateCategorySelect();
    renderQuestionsList();
    renderCategoriesList();
}

function showEditorTab(tabName) {
    document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('editor-' + tabName).classList.add('active');
    event.target.classList.add('active');
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
        const item = document.createElement('div');
        item.className = 'editor-item';
        const catName = questionCategories[q.category]?.name || q.category;
        item.innerHTML = `
            <div class="editor-item-content">
                <div class="editor-item-title">${q.sentence}</div>
                <div class="editor-item-subtitle">
                    ${catName} | Options: ${q.options[0]}, ${q.options[1]} | Correct: ${q.correct}
                </div>
            </div>
            <div class="editor-item-actions">
                <button class="editor-item-btn edit" onclick="editQuestion(${index})">Edit</button>
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
                <button class="editor-item-btn edit" onclick="editCategory('${key}')">Edit</button>
                <button class="editor-item-btn delete" onclick="deleteCategory('${key}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function saveQuestion() {
    const sentence = document.getElementById('question-sentence').value.trim();
    const category = document.getElementById('question-category').value;
    const option1 = document.getElementById('question-option1').value.trim();
    const option2 = document.getElementById('question-option2').value.trim();
    const correct = document.getElementById('question-correct').value;
    const editIndex = parseInt(document.getElementById('edit-question-index').value);

    if (!sentence || !option1 || !option2) {
        alert('Please fill in all fields');
        return;
    }

    const correctAnswer = correct === 'option1' ? option1 : option2;
    const newQuestion = {
        category: category,
        sentence: sentence,
        options: [option1, option2],
        correct: correctAnswer
    };

    if (editIndex >= 0) {
        allQuestions[editIndex] = newQuestion;
    } else {
        allQuestions.push(newQuestion);
    }

    clearQuestionForm();
    renderQuestionsList();
}

function clearQuestionForm() {
    document.getElementById('question-sentence').value = '';
    document.getElementById('question-option1').value = '';
    document.getElementById('question-option2').value = '';
    document.getElementById('question-correct').value = 'option1';
    document.getElementById('edit-question-index').value = '-1';
    document.getElementById('question-form-title').textContent = 'Add New Question';
}

function editQuestion(index) {
    const q = allQuestions[index];
    document.getElementById('question-sentence').value = q.sentence;
    document.getElementById('question-category').value = q.category;
    document.getElementById('question-option1').value = q.options[0];
    document.getElementById('question-option2').value = q.options[1];
    document.getElementById('question-correct').value = q.correct === q.options[0] ? 'option1' : 'option2';
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
    const key = document.getElementById('category-key').value.trim().replace(/\s+/g, '_');
    const name = document.getElementById('category-name').value.trim();
    const desc = document.getElementById('category-desc').value.trim();
    const editKey = document.getElementById('edit-category-key').value;

    if (!key || !name) {
        alert('Please fill in category key and name');
        return;
    }

    if (editKey && editKey !== key) {
        delete questionCategories[editKey];
        allQuestions.forEach(q => {
            if (q.category === editKey) q.category = key;
        });
    }

    questionCategories[key] = { name: name, description: desc };
    clearCategoryForm();
    populateCategorySelect();
    renderCategoriesList();
    renderQuestionsList();
}

function clearCategoryForm() {
    document.getElementById('category-key').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-desc').value = '';
    document.getElementById('edit-category-key').value = '';
}

function editCategory(key) {
    const cat = questionCategories[key];
    document.getElementById('category-key').value = key;
    document.getElementById('category-name').value = cat.name;
    document.getElementById('category-desc').value = cat.description;
    document.getElementById('edit-category-key').value = key;
}

function deleteCategory(key) {
    if (Object.keys(questionCategories).length <= 1) {
        alert('Cannot delete the last category');
        return;
    }
    if (confirm('Are you sure you want to delete this category? Questions using this category will need to be reassigned.')) {
        delete questionCategories[key];
        allQuestions = allQuestions.filter(q => q.category !== key);
        populateCategorySelect();
        renderCategoriesList();
        renderQuestionsList();
    }
}

function exportQuestions() {
    const data = {
        categories: questionCategories,
        questions: allQuestions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importQuestions() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to import');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.categories) questionCategories = data.categories;
            if (data.questions) allQuestions = data.questions;
            populateCategorySelect();
            renderQuestionsList();
            renderCategoriesList();
            alert('Questions imported successfully!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if (confirm('Are you sure you want to reset to default questions? All custom questions will be lost.')) {
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

function updateHudScores() {
    p1ScoreHud.textContent = player1Score;
    p2ScoreHud.textContent = player2Score;
}

function bumpScore(el) {
    el.classList.remove('bump');
    void el.offsetWidth;  // reflow
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 200);
}

function updateStreakUI(playerNum) {
    const streak = playerNum === 1 ? player1Streak : player2Streak;
    const badge  = playerNum === 1 ? p1StreakBadge : p2StreakBadge;
    if (streak >= 2) {
        badge.textContent = `🔥${streak}`;
        badge.classList.add('active');
    } else {
        badge.classList.remove('active');
    }
}

function spawnScorePopup(points, playerNum) {
    if (!points) return;
    const popup = document.createElement('div');
    popup.className = `score-popup p${playerNum}`;
    popup.textContent = `+${points}`;
    const ind   = playerNum === 1 ? p1Indicator : p2Indicator;
    const crect = gameContainer.getBoundingClientRect();
    const irect = ind.getBoundingClientRect();
    popup.style.left = (irect.left - crect.left + irect.width / 2 - 24) + 'px';
    popup.style.top  = (irect.top  - crect.top  - 16) + 'px';
    gameContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 1300);
}

// ── selectOption ──────────────────────────────────────────────────────
function selectOption(playerNum, side) {
    if (!gameActive || revealActive) return;

    // Each player may answer only once
    if (playerNum === 1 && player1Answered) return;
    if (playerNum === 2 && player2Answered) return;

    sfxClick();

    const btn    = side === 'left' ? leftBtn : rightBtn;
    const chosen = btn.dataset.option;

    if (playerNum === 1) {
        player1Answered = true;
        player1Answer   = chosen;
        player1Time     = TIMER_DURATION - timer;

        p1Indicator.classList.add('answered');
        p1ChoiceEl.textContent = chosen;
        btn.classList.add('chosen-p1');
        (side === 'left' ? leftDotP1 : rightDotP1).classList.add('visible');

    } else {
        player2Answered = true;
        player2Answer   = chosen;
        player2Time     = TIMER_DURATION - timer;

        p2Indicator.classList.add('answered');
        p2ChoiceEl.textContent = chosen;
        btn.classList.add('chosen-p2');
        (side === 'left' ? leftDotP2 : rightDotP2).classList.add('visible');
    }

    // Both answered → stop timer, reveal immediately
    if (player1Answered && player2Answered) {
        clearInterval(timerInterval);
        revealAnswers();
    }
}

// ── Timer ──────────────────────────────────────────────────────────────
function startTimer() {
    clearInterval(timerInterval);
    timer = TIMER_DURATION;
    timerEl.textContent = timer;
    timerEl.style.color = '#e74c3c';

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
        if (timer <= 0) {
            clearInterval(timerInterval);
            revealAnswers();
        }
    }, 1000);
}

// ── Answer Reveal ──────────────────────────────────────────────────────
function revealAnswers() {
    revealActive = true;
    clearInterval(timerInterval);

    const q       = currentQuestions[currentQuestion];
    const correct = q.correct;

    // Highlight buttons green (correct) or red (wrong)
    [leftBtn, rightBtn].forEach(btn => {
        if (btn.dataset.option === correct) btn.classList.add('reveal-correct');
        else                                btn.classList.add('reveal-wrong');
    });

    // Determine correctness
    const p1ok = player1Answer === correct;
    const p2ok = player2Answer === correct;

    // Update streaks
    if (p1ok) { player1Streak++; sfxCorrect(); }
    else       { player1Streak = 0; if (player1Answer) sfxWrong(); }
    if (p2ok) { player2Streak++; }
    else       { player2Streak = 0; }

    // Calculate points with streak multiplier
    const p1mult   = streakMultiplier(player1Streak);
    const p2mult   = streakMultiplier(player2Streak);
    const p1Points = p1ok
        ? Math.round((BASE_POINTS + Math.max(0, TIMER_DURATION - player1Time) * TIME_BONUS_MULTIPLIER) * p1mult)
        : 0;
    const p2Points = p2ok
        ? Math.round((BASE_POINTS + Math.max(0, TIMER_DURATION - player2Time) * TIME_BONUS_MULTIPLIER) * p2mult)
        : 0;

    player1Score += p1Points;
    player2Score += p2Points;

    // Store result
    gameResults.push({
        question: currentQuestion + 1,
        sentence: q.sentence,
        correct,
        p1Answer: player1Answer || '—',
        p1Points,
        p2Answer: player2Answer || '—',
        p2Points
    });

    // Update HUD
    updateHudScores();
    if (p1Points) bumpScore(p1ScoreHud);
    if (p2Points) bumpScore(p2ScoreHud);
    updateStreakUI(1);
    updateStreakUI(2);

    // Floating +points popups
    spawnScorePopup(p1Points, 1);
    setTimeout(() => spawnScorePopup(p2Points, 2), 180);

    // Show ✓ or ✗ in player indicator
    if (player1Answer) p1ChoiceEl.textContent = `${p1ok ? '✓' : '✗'} ${player1Answer}`;
    if (player2Answer) p2ChoiceEl.textContent = `${p2ok ? '✓' : '✗'} ${player2Answer}`;

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

    player1Answered = player2Answered = false;
    player1Answer   = player2Answer   = null;
    player1Time     = player2Time     = 0;

    const q = currentQuestions[currentQuestion];
    sentenceEl.innerHTML = q.sentence.replace('___', '<span class="blank">___</span>');
    qCounterEl.textContent = `Question ${currentQuestion + 1} of ${TOTAL_QUESTIONS}`;

    // Shuffle which option appears left / right each question
    const opts = shuffle([...q.options]);
    leftBtn.dataset.option  = opts[0];
    rightBtn.dataset.option = opts[1];
    leftBtnText.textContent  = opts[0];
    rightBtnText.textContent = opts[1];

    // Reset all button states
    leftBtn.classList.remove('chosen-p1', 'chosen-p2', 'reveal-correct', 'reveal-wrong');
    rightBtn.classList.remove('chosen-p1', 'chosen-p2', 'reveal-correct', 'reveal-wrong');

    // Reset player-dots
    [leftDotP1, leftDotP2, rightDotP1, rightDotP2].forEach(d => d.classList.remove('visible'));

    // Reset player indicators
    p1Indicator.classList.remove('answered');
    p2Indicator.classList.remove('answered');
    p1ChoiceEl.textContent = '—';
    p2ChoiceEl.textContent = '—';

    startTimer();
}

// ── Game Flow ──────────────────────────────────────────────────────────
function startGame() {
    try { getAudio().resume(); } catch(e) {}

    // Get settings from UI
    TOTAL_QUESTIONS = parseInt(numQuestionsSelect.value);
    TIMER_DURATION  = parseInt(timeLimitSelect.value);
    
    // Get filtered questions based on selected categories
    const filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
        alert('Please select at least one category!');
        return;
    }
    
    // Limit to available questions if less than requested
    const actualQuestions = Math.min(TOTAL_QUESTIONS, filteredQuestions.length);
    currentQuestions = shuffle(filteredQuestions).slice(0, actualQuestions);
    TOTAL_QUESTIONS = actualQuestions;
    
    currentQuestion  = 0;
    player1Score  = player2Score  = 0;
    player1Streak = player2Streak = 0;
    gameResults   = [];

    startScreen.style.display = 'none';
    endScreen.classList.remove('show');

    updateHudScores();
    updateStreakUI(1);
    updateStreakUI(2);

    gameActive   = true;
    revealActive = false;
    loadQuestion();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    sfxGameOver();

    let winText = '', winClass = '';
    if      (player1Score > player2Score) { winText = '🎉 Player 1 Wins!'; winClass = 'p1-win'; }
    else if (player2Score > player1Score) { winText = '🎉 Player 2 Wins!'; winClass = 'p2-win'; }
    else                                  { winText = "🤝 It's a Tie!";    winClass = 'tie';    }

    winnerEl.textContent = winText;
    winnerEl.className   = winClass;
    p1FinalEl.textContent = player1Score;
    p2FinalEl.textContent = player2Score;
    p1TotalEl.textContent = player1Score;
    p2TotalEl.textContent = player2Score;

    resultsBody.innerHTML = '';
    gameResults.forEach(r => {
        const p1cls = r.p1Answer !== '—' ? (r.p1Answer === r.correct ? 'cell-correct' : 'cell-wrong') : '';
        const p2cls = r.p2Answer !== '—' ? (r.p2Answer === r.correct ? 'cell-correct' : 'cell-wrong') : '';
        const row   = document.createElement('tr');
        row.innerHTML = `
            <td>${r.question}</td>
            <td>${r.sentence}</td>
            <td class="cell-correct">${r.correct}</td>
            <td class="p1-col ${p1cls}">${r.p1Answer}</td>
            <td class="p1-col">${r.p1Points}</td>
            <td class="p2-col ${p2cls}">${r.p2Answer}</td>
            <td class="p2-col">${r.p2Points}</td>
        `;
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

    // Player 1: F21 = left answer,  F18 = right answer
    if      (e.code === 'F21')        { e.preventDefault(); highlightButton(1, 'left'); selectOption(1, 'left');  }
    else if (e.code === 'F18')        { e.preventDefault(); highlightButton(1, 'right'); selectOption(1, 'right'); }

    // Player 2: ← = left answer,  → = right answer
    else if (e.key === 'ArrowLeft')   { e.preventDefault(); highlightButton(2, 'left'); selectOption(2, 'left');  }
    else if (e.key === 'ArrowRight')  { e.preventDefault(); highlightButton(2, 'right'); selectOption(2, 'right'); }
});

// ── Initialize Game ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    loadQuestionsFromJSON();
});