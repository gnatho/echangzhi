const MODEL_CONFIG = {
    fast: {
        key: 'vosk-model-small-en-us-0.15',
        file: 'models/vosk-model-small-en-us-0.15.tar.gz',
        kind: 'archive',
        fast: true,
        grammar: true,
        size: '40 MB'
    },
    accurate: {
        key: 'vosk-model-en-us-0.22-lgraph',
        file: 'models/vosk-model-en-us-0.22-lgraph.tar.gz',
        kind: 'archive',
        fast: false,
        grammar: true,
        size: '128 MB',
        sourceDir: 'models/vosk-model-en-us-0.22-lgraph/',
        root: 'vosk-model-en-us-0.22-lgraph',
        dirs: ['am', 'conf', 'graph', 'graph/phones', 'ivector'],
        files: [
            'am/final.mdl',
            'am/tree',
            'conf/mfcc.conf',
            'conf/model.conf',
            'graph/Gr.fst',
            'graph/HCLr.fst',
            'graph/disambig_tid.int',
            'graph/phones.txt',
            'graph/phones/word_boundary.int',
            'graph/words.txt',
            'ivector/final.dubm',
            'ivector/final.ie',
            'ivector/final.mat',
            'ivector/global_cmvn.stats',
            'ivector/online_cmvn.conf',
            'ivector/splice.conf'
        ]
    }
};

const ICON_BASE = '../../static/imgs/words/fl_big/';
const DISPLAY_MODES = ['icon', 'text', 'blank'];
const MODE_LABELS = { icon: 'Pictures', text: 'Text', blank: 'Blank' };

const UI = {
    title: 'Speak & Disappear',
    tagline: 'Say it. Clear it.',
    hint: 'Say a word clearly. When the game hears it, the card disappears!',
    tapStart: 'Tap Start to play',
    listening: 'Listening...',
    pausedStatus: 'Paused — tap ▶ to listen again.',
    detected: 'Detected: {word}!',
    hearing: 'Hearing: {text}',
    heard: 'Heard: {text} — try again!',
    tryAgain: 'Try again! You can do it!',
    startLead: 'Pick a book and a unit. Then choose how the words are shown, and say each word to make it disappear!',
    startButton: 'Start speaking',
    starting: 'Starting...',
    listeningButton: 'Listening...',
    tryAgainButton: 'Try again',
    modelNote: 'The speech model downloads once, then works offline.',
    privacy: '🔒 Audio is processed on this device. Nothing is uploaded.',
    prepareEngine: 'Preparing the microphone and speech model...',
    turnOnMic: 'Turning on the microphone...',
    engineReload: 'Preparing the speech engine... The page will reload once. Then tap Start again.',
    engineFail: 'This browser could not enable the speech engine. Serve the game over HTTPS or localhost, and make sure service workers are allowed.',
    modelCached: 'Loading the speech model...',
    modelDownloading: 'Downloading the speech model (first time only, about {size})...',
    modelBuilding: 'Preparing the speech model (first time only)...',
    modelFile: 'Preparing the speech model ({current}/{total})...',
    modelPreparing: 'Preparing the speech model...',
    recognizer: 'Starting the word recognizer...',
    changeWords: 'Change words',
    menuAria: 'Change words',
    closeMenuAria: 'Close menu',
    book: 'Book',
    unit: 'Unit',
    showAs: 'Show words as',
    summary: '{count} words ready',
    summaryEmpty: 'No words in this unit.',
    pauseAria: 'Pause listening',
    resumeAria: 'Resume listening',
    fullscreenAria: 'Toggle fullscreen',
    exitFullscreenAria: 'Exit fullscreen',
    scoreAria: 'Score: {score}',
    clearedAria: 'Cleared {done} of {total} words',
    greatJob: 'Great job!',
    clearedAll: 'You cleared all {total} words!',
    points: 'points',
    playAgain: 'Play again',
    backToGames: 'Back to games',
    winStatus: 'You did it!',
    burstEmojis: ['⭐', '✨', '🎉', '💫', '🌟'],
    errorPermission: 'Microphone permission was denied. Allow the microphone in your browser settings, then tap Try again.',
    errorNoMic: 'No microphone was found. Connect a microphone, then try again.',
    errorModelMissing: 'The speech model files were not found. Put the model inside games/speak/models/, then try again.',
    errorModelFetch: 'The speech model could not be downloaded. Check the connection and try again.',
    errorIsolation: 'The speech engine needs cross-origin isolation. Open the game over HTTPS or localhost and reload the page.',
    errorFile: 'Open the game through a local web server, not by double-clicking the HTML file.',
    errorGeneric: 'Could not start speech recognition: {text}'
};

const params = new URLSearchParams(window.location.search);
const FORCE_ACCURATE_MODEL = params.get('model') === 'accurate';
const POINTS_PER_WORD = 10;
const FEEDBACK_LOCK_MS = 1900;
const AUDIO_BUFFER_SIZE = 128 * 32;
const utf8Encoder = new TextEncoder();

function readStored(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
    } catch (error) {}
    return fallback;
}

function readStoredInt(key, fallback, allowed) {
    const value = Number(readStored(key, String(fallback)));
    if (!Number.isInteger(value)) return fallback;
    if (allowed && !allowed.includes(value)) return fallback;
    return value;
}

function levelKeys() {
    if (typeof levelUnits === 'undefined' || !levelUnits) return ['0'];
    return Object.keys(levelUnits).sort((a, b) => Number(a) - Number(b));
}

function unitKeys(level) {
    const units = (typeof levelUnits !== 'undefined' && levelUnits && levelUnits[level]) || null;
    if (!units) return ['0'];
    return Object.keys(units).sort((a, b) => Number(a) - Number(b));
}

let selectedLevel = readStoredInt('speakLevel', 0, levelKeys().map(Number));
if (!levelKeys().includes(String(selectedLevel))) selectedLevel = Number(levelKeys()[0]);
let selectedUnit = readStoredInt('speakUnit', 0, unitKeys(selectedLevel).map(Number));
if (!unitKeys(selectedLevel).includes(String(selectedUnit))) selectedUnit = Number(unitKeys(selectedLevel)[0]);
let displayMode = readStored('speakDisplayMode', 'icon');
if (!DISPLAY_MODES.includes(displayMode)) displayMode = 'icon';

function buildWords(level, unit) {
    const list = (typeof levelUnits !== 'undefined' && levelUnits && levelUnits[level] && levelUnits[level][unit]) || [];
    const icons = (typeof levelWordIcons !== 'undefined' && levelWordIcons && levelWordIcons[level + '-' + unit]) || [];
    return list.map((word, index) => ({ word: String(word), file: icons[index] || null }));
}

let WORDS = buildWords(selectedLevel, selectedUnit);

const boardEl = document.getElementById('board');
const statusPanel = document.getElementById('status-panel');
const statusText = document.getElementById('status-text');
const remainingCount = document.getElementById('remaining-count');
const remainingLabel = document.getElementById('remaining-label');
const clearedCount = document.getElementById('cleared-count');
const totalCount = document.getElementById('total-count');
const progressFill = document.getElementById('progress-fill');
const listenBtn = document.getElementById('listen-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const menuBtn = document.getElementById('menu-btn');
const startOverlay = document.getElementById('start-overlay');
const menuClose = document.getElementById('menu-close');
const startBtn = document.getElementById('start-btn');
const startStatus = document.getElementById('start-status');
const levelSelect = document.getElementById('level-select');
const unitSelect = document.getElementById('unit-select');
const modeOptions = document.getElementById('mode-options');
const modeChoices = Array.from(document.querySelectorAll('.mode-choice'));
const menuSummary = document.getElementById('menu-summary');
const celebration = document.getElementById('celebration');
const confettiEl = document.getElementById('confetti');
const playAgainBtn = document.getElementById('play-again-btn');
const celebrateTitle = document.getElementById('celebrate-title');
const celebrateLead = document.getElementById('celebrate-lead');
const celebrateScoreValue = document.getElementById('celebrate-score-value');
const celebrateScoreLabel = document.getElementById('celebrate-score-label');
const celebrateGames = document.getElementById('celebrate-games');
const changeWordsCelebrate = document.getElementById('change-words-celebrate');
const brandTitle = document.getElementById('brand-title');
const brandTagline = document.getElementById('brand-tagline');
const hintBar = document.getElementById('hint-bar');
const backBtn = document.getElementById('back-btn');
const startTitle = document.getElementById('start-title');
const startLead = document.getElementById('start-lead');
const privacyNote = document.getElementById('privacy-note');
const scorePill = document.getElementById('score-pill');
const scoreValue = document.getElementById('score-value');
const screenFlash = document.getElementById('screen-flash');
const fxLayer = document.getElementById('fx-layer');

let vosklet = null;
let model = null;
let activeModelPath = '';
let activeModelId = '';
let recognizer = null;
let recognizerSignature = '';
let audioCtx = null;
let micStream = null;
let micNode = null;
let transferer = null;
let cardEls = [];
let pending = new Set();
let engineReady = false;
let grammarMode = true;
let started = false;
let paused = false;
let gameWon = false;
let finishing = false;
let busy = false;
let statusTimer = 0;
let statusLockUntil = 0;
let feedbackLockUntil = 0;
let flashTimer = 0;
let resumeAfterMenu = false;
let score = 0;
let fxCtx = null;
let applauseBuffer = null;

function format(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, (match, key) => (
        vars && Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
    ));
}

function t(key, vars) {
    const value = UI[key];
    if (Array.isArray(value)) return value;
    const text = value === undefined ? key : value;
    return vars ? format(text, vars) : text;
}

function currentSignature() {
    return selectedLevel + '-' + selectedUnit;
}

function wordLabel(count) {
    return count === 1 ? 'word' : 'words';
}

function iconPath(file) {
    return ICON_BASE + file;
}

function modelPath(config) {
    return new URL(config.file, document.baseURI).href;
}

function normalizeText(text) {
    const source = String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return source
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function editDistance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    const previous = new Array(b.length + 1);
    const current = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j += 1) previous[j] = j;
    for (let i = 1; i <= a.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost
            );
        }
        for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }
    return previous[b.length];
}

function fuzzyEqual(a, b) {
    if (a === b) return true;
    if (Math.min(a.length, b.length) < 3) return false;
    return editDistance(a, b) <= 1;
}

function buildGrammar() {
    const phrases = WORDS.map((item) => item.word.toLowerCase()).filter(Boolean);
    phrases.push('[unk]');
    return JSON.stringify(phrases);
}

function parseDetail(detail) {
    if (!detail) return {};
    if (typeof detail === 'string') {
        try {
            return JSON.parse(detail);
        } catch (error) {
            return {};
        }
    }
    if (detail.result && !detail.text) return detail.result;
    return detail;
}

function boardColumns(count) {
    const narrow = window.innerWidth < 620;
    let cols;
    if (count <= 1) cols = 1;
    else if (count <= 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 8) cols = 4;
    else if (count <= 10) cols = 5;
    else cols = 4;
    if (narrow) cols = Math.min(cols, 3);
    return cols;
}

function layoutBoard() {
    boardEl.style.setProperty('--cols', String(boardColumns(WORDS.length)));
}

function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.dataset.mode = displayMode;
    cardEls = [];
    WORDS.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'word-card';
        card.dataset.index = String(index);
        card.dataset.word = item.word;
        card.tabIndex = 0;

        const art = document.createElement('div');
        art.className = 'card-art';
        art.setAttribute('aria-hidden', 'true');

        if (displayMode === 'blank') {
            art.classList.add('card-art--blank');
            card.setAttribute('aria-label', 'Hidden word ' + (index + 1));
        } else if (displayMode === 'text') {
            art.classList.add('card-art--text');
            art.textContent = item.word;
            card.setAttribute('aria-label', item.word);
        } else if (item.file) {
            const img = document.createElement('img');
            img.className = 'card-icon';
            img.src = iconPath(item.file);
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            art.appendChild(img);
            card.setAttribute('aria-label', item.word);
        } else {
            art.classList.add('card-art--text');
            art.textContent = item.word;
            card.setAttribute('aria-label', item.word);
        }

        card.append(art);
        boardEl.appendChild(card);
        cardEls.push(card);
    });
    layoutBoard();
}

function setStatus(text, mode) {
    statusText.textContent = text;
    statusPanel.dataset.mode = mode || 'idle';
}

function resetStatusLater(delay) {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
        if (!paused && !gameWon && started) {
            setStatus(t('listening'), 'listening');
        }
    }, delay);
}

function updateProgress() {
    const total = WORDS.length;
    const left = pending.size;
    const done = total - left;

    remainingCount.textContent = String(left);
    remainingLabel.textContent = wordLabel(left) + ' left';
    clearedCount.textContent = String(done);
    totalCount.textContent = String(total);
    progressFill.style.width = total ? `${(done / total) * 100}%` : '0%';

    const clearedPill = document.querySelector('.cleared-pill');
    if (clearedPill) {
        clearedPill.setAttribute('aria-label', format(t('clearedAria'), { done, total }));
    }
}

function updateScore() {
    scoreValue.textContent = String(score);
    celebrateScoreValue.textContent = String(score);
    scorePill.setAttribute('aria-label', format(t('scoreAria'), { score }));
}

function addScore(points) {
    score += points;
    updateScore();
    scorePill.classList.remove('pop');
    void scorePill.offsetWidth;
    scorePill.classList.add('pop');
}

function updateListenButton() {
    listenBtn.disabled = !started || gameWon;
    listenBtn.textContent = paused ? '▶' : '⏸';
    listenBtn.setAttribute('aria-label', paused ? t('resumeAria') : t('pauseAria'));
}

function setStartStatus(text, mode) {
    startStatus.textContent = text;
    startStatus.dataset.mode = mode || 'idle';
}

function updateStartButton(label, disabled) {
    startBtn.textContent = label;
    startBtn.disabled = disabled;
}

function populateLevelSelect() {
    levelSelect.innerHTML = '';
    levelKeys().forEach((level) => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = t('book') + ' ' + level;
        levelSelect.appendChild(option);
    });
    levelSelect.value = String(selectedLevel);
}

function populateUnitSelect() {
    unitSelect.innerHTML = '';
    unitKeys(selectedLevel).forEach((unit) => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = t('unit') + ' ' + unit;
        unitSelect.appendChild(option);
    });
    if (!unitKeys(selectedLevel).includes(String(selectedUnit))) {
        selectedUnit = Number(unitKeys(selectedLevel)[0]);
    }
    unitSelect.value = String(selectedUnit);
}

function updateModeHighlight() {
    modeChoices.forEach((button) => {
        const active = button.dataset.mode === displayMode;
        button.classList.toggle('is-current', active);
        button.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    modeOptions.dataset.mode = displayMode;
}

function updateSummary() {
    const count = WORDS.length;
    if (!count) {
        menuSummary.textContent = t('summaryEmpty');
        return;
    }
    menuSummary.textContent = format(t('summary'), { count }) + ' · ' + MODE_LABELS[displayMode];
}

function refreshFromSelection() {
    WORDS = buildWords(selectedLevel, selectedUnit);
    score = 0;
    updateScore();
    renderBoard();
    pending = new Set(WORDS.map((item, index) => index));
    updateProgress();
    updateSummary();
}

function updateStaticText() {
    document.title = t('title');
    brandTitle.textContent = t('title');
    brandTagline.textContent = t('tagline');
    hintBar.textContent = t('hint');
    backBtn.setAttribute('aria-label', t('backToGames'));
    startTitle.textContent = t('title');
    startLead.textContent = t('startLead');
    privacyNote.textContent = t('privacy');
    celebrateTitle.textContent = t('greatJob');
    playAgainBtn.textContent = t('playAgain');
    changeWordsCelebrate.textContent = t('changeWords');
    celebrateGames.textContent = t('backToGames');
    celebrateScoreLabel.textContent = t('points');
    menuBtn.setAttribute('aria-label', t('menuAria'));
    menuClose.setAttribute('aria-label', t('closeMenuAria'));
    document.querySelectorAll('.menu-field-label').forEach((label, index) => {
        label.textContent = index === 0 ? t('book') : (index === 1 ? t('unit') : t('showAs'));
    });
    modeChoices.forEach((button) => {
        const name = button.querySelector('.mode-name');
        if (name) name.textContent = MODE_LABELS[button.dataset.mode];
    });
    fullscreenBtn.setAttribute('aria-label', document.fullscreenElement ? t('exitFullscreenAria') : t('fullscreenAria'));

    if (!busy && startStatus.dataset.mode !== 'loading' && startStatus.dataset.mode !== 'error') {
        setStartStatus(t('modelNote'), 'idle');
    }
    if (!started) {
        setStatus(t('tapStart'), 'idle');
    }
    if (!busy) {
        updateStartButton(t('startButton'), false);
    }
    updateProgress();
    updateListenButton();
    updateModeHighlight();
}

function friendlyError(error) {
    const name = error && error.name ? error.name : '';
    const text = String(error && error.message ? error.message : error);

    if (name === 'NotAllowedError' || /permission|denied/i.test(text)) {
        return t('errorPermission');
    }
    if (name === 'NotFoundError' || /no.*microphone|requested device not found/i.test(text)) {
        return t('errorNoMic');
    }
    if (/MODEL_FILES_MISSING|MODEL_MISSING/.test(text)) {
        return t('errorModelMissing');
    }
    if (/Unable to fetch model|status: 404|Failed to fetch/i.test(text)) {
        return t('errorModelFetch');
    }
    if (/SharedArrayBuffer|crossOriginIsolated|shared memory/i.test(text)) {
        return t('errorIsolation');
    }
    if (/FILE_PROTOCOL/i.test(text)) {
        return t('errorFile');
    }
    return format(t('errorGeneric'), { text });
}

async function modelIsCached(path, key) {
    if (!vosklet) return false;
    try {
        const cache = await vosklet.getModelCache();
        const keys = await cache.keys(path, { ignoreSearch: true });
        return keys.some((request) => request.url.split('?')[1] === key);
    } catch (error) {
        return false;
    }
}

async function urlExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function modelAvailability(config) {
    const path = modelPath(config);
    if (await modelIsCached(path, config.key)) {
        return { path, build: false, cached: true };
    }
    if (config.kind === 'archive' && await urlExists(path)) {
        return { path, build: false, cached: false };
    }
    if (config.sourceDir && config.files && config.files.length) {
        const sourceReady = await urlExists(new URL(`${config.sourceDir}${config.files[0]}`, document.baseURI));
        if (sourceReady) return { path, build: true, cached: false };
    }
    return null;
}

async function selectModel() {
    if (FORCE_ACCURATE_MODEL) {
        const accurate = await modelAvailability(MODEL_CONFIG.accurate);
        if (accurate) return { cfg: MODEL_CONFIG.accurate, ...accurate };
        throw new Error('MODEL_FILES_MISSING');
    }

    const fast = await modelAvailability(MODEL_CONFIG.fast);
    if (fast) return { cfg: MODEL_CONFIG.fast, ...fast };

    const accurate = await modelAvailability(MODEL_CONFIG.accurate);
    if (accurate) return { cfg: MODEL_CONFIG.accurate, ...accurate };

    throw new Error('MODEL_FILES_MISSING');
}

function tarWriteString(header, offset, length, value) {
    const bytes = utf8Encoder.encode(value);
    header.set(bytes.subarray(0, length), offset);
}

function createTarHeader(name, size, typeFlag) {
    if (utf8Encoder.encode(name).length > 100) {
        throw new Error(`Tar path is too long: ${name}`);
    }

    const header = new Uint8Array(512);
    tarWriteString(header, 0, 100, name);
    tarWriteString(header, 100, 8, '0000644\0');
    tarWriteString(header, 108, 8, '0000000\0');
    tarWriteString(header, 116, 8, '0000000\0');
    tarWriteString(header, 124, 12, `${size.toString(8).padStart(11, '0')}\0`);
    tarWriteString(header, 136, 12, '00000000000\0');
    header.fill(32, 148, 156);
    header[156] = typeFlag.charCodeAt(0);
    tarWriteString(header, 257, 6, 'ustar\0');
    tarWriteString(header, 263, 2, '00');
    tarWriteString(header, 265, 32, 'root');
    tarWriteString(header, 297, 32, 'root');

    let checksum = 0;
    for (let i = 0; i < header.length; i += 1) checksum += header[i];
    tarWriteString(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `);

    return header;
}

async function buildModelArchive(config) {
    const gzip = new CompressionStream('gzip');
    const writer = gzip.writable.getWriter();
    const blobPromise = new Response(gzip.readable).blob();
    const root = `${config.root}/`;

    try {
        await writer.write(createTarHeader(root, 0, '5'));

        for (const dir of config.dirs) {
            await writer.write(createTarHeader(`${root}${dir}/`, 0, '5'));
        }

        for (let i = 0; i < config.files.length; i += 1) {
            const relative = config.files[i];
            setStartStatus(format(t('modelFile'), { current: i + 1, total: config.files.length }), 'loading');

            const response = await fetch(
                new URL(`${config.sourceDir}${relative}`, document.baseURI),
                { cache: 'no-store' }
            );

            if (!response.ok) {
                throw new Error(`Unable to fetch model file ${relative}, status: ${response.status}`);
            }

            const data = new Uint8Array(await response.arrayBuffer());
            await writer.write(createTarHeader(`${root}${relative}`, data.byteLength, '0'));
            await writer.write(data);

            const padding = (512 - (data.byteLength % 512)) % 512;
            if (padding) await writer.write(new Uint8Array(padding));
        }

        await writer.write(new Uint8Array(1024));
        await writer.close();
        setStartStatus(t('modelPreparing'), 'loading');
        return await blobPromise;
    } catch (error) {
        try { await writer.abort(error); } catch (abortError) {}
        throw error;
    }
}

async function ensureEngine() {
    const signature = currentSignature();
    if (engineReady && recognizer && recognizerSignature === signature) return;

    if (!window.isSecureContext) {
        throw new Error('FILE_PROTOCOL');
    }
    if (!window.crossOriginIsolated) {
        throw new Error('crossOriginIsolated is not enabled');
    }
    if (typeof loadVosklet !== 'function') {
        throw new Error('The Vosklet library did not load.');
    }
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');
        try {
            audioCtx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 16000 });
        } catch (error) {
            audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
        }
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
    }

    if (!vosklet) vosklet = await loadVosklet();

    if (!model) {
        const selected = await selectModel();
        activeModelPath = selected.path;
        activeModelId = selected.cfg.key;

        let source = activeModelPath;
        let blobUrl = '';

        if (selected.cached) {
            setStartStatus(t('modelCached'), 'loading');
        } else if (selected.build) {
            setStartStatus(t('modelBuilding'), 'loading');
            const archive = await buildModelArchive(selected.cfg);
            blobUrl = URL.createObjectURL(archive);
            source = blobUrl;
        } else {
            setStartStatus(format(t('modelDownloading'), { size: selected.cfg.size }), 'loading');
        }

        try {
            model = await vosklet.createModel(source, activeModelPath, activeModelId);
        } finally {
            if (blobUrl) window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        }
    }

    if (!recognizer || recognizerSignature !== signature) {
        if (recognizer) {
            const old = recognizer;
            recognizer = null;
            try { await old.delete(); } catch (error) {}
        }
        grammarMode = MODEL_CONFIG.fast.grammar;

        if (grammarMode) {
            try {
                const missing = [...new Set(
                    WORDS.flatMap((item) => item.word.toLowerCase().split(' ')).filter(Boolean)
                )].filter((word) => model.findWord(word) < 0);

                if (missing.length) grammarMode = false;
            } catch (error) {
                grammarMode = false;
            }
        }

        setStartStatus(t('recognizer'), 'loading');
        if (grammarMode) {
            try {
                recognizer = await vosklet.createRecognizerWithGrm(model, audioCtx.sampleRate, buildGrammar());
            } catch (error) {
                grammarMode = false;
                recognizer = await vosklet.createRecognizer(model, audioCtx.sampleRate);
            }
        } else {
            recognizer = await vosklet.createRecognizer(model, audioCtx.sampleRate);
        }
        if (typeof recognizer.setEndpointerDelays === 'function') {
            recognizer.setEndpointerDelays(0.4, 0.3, 4.0);
        }
        recognizer.addEventListener('partialResult', onPartialResult);
        recognizer.addEventListener('result', onResult);
        recognizerSignature = signature;
    }

    engineReady = true;
}

async function connectMicrophone() {
    if (micStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
    }

    micStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
        }
    });

    micNode = audioCtx.createMediaStreamSource(micStream);
    transferer = await vosklet.createTransferer(audioCtx, AUDIO_BUFFER_SIZE);
    transferer.port.onmessage = (event) => {
        if (!paused && !gameWon && recognizer) recognizer.acceptWaveform(event.data);
    };
    micNode.connect(transferer);

    if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
    }
}

function releaseMicrophone(suspendContext) {
    if (micNode) {
        try { micNode.disconnect(); } catch (error) {}
        micNode = null;
    }
    if (transferer) {
        transferer.port.onmessage = null;
        try { transferer.disconnect(); } catch (error) {}
        transferer = null;
    }
    if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
    }
    if (suspendContext && audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend().catch(() => {});
    }
}

function onPartialResult(event) {
    if (gameWon || paused) return;
    if (performance.now() < feedbackLockUntil || performance.now() < statusLockUntil) return;

    const detail = parseDetail(event.detail);
    const raw = String(detail.partial || '');
    const text = normalizeText(raw);
    if (!text) return;
    if (handleRecognition(text)) return;
    if (grammarMode) {
        setStatus(format(t('hearing'), { text: raw.trim() }), 'hearing');
    }
}

function targetForms(item) {
    const forms = [item.word, ...(Array.isArray(item.aliases) ? item.aliases : [])];
    return forms.map(normalizeText).filter(Boolean);
}

function findMatches(text) {
    const normalized = normalizeText(text);
    if (!normalized) return [];

    const padded = ` ${normalized} `;
    const tokens = normalized.split(' ').filter(Boolean);
    const hits = new Set();

    pending.forEach((index) => {
        const target = normalizeText(WORDS[index].word);
        if (target && padded.includes(` ${target} `)) hits.add(index);
    });

    if (grammarMode) {
        return [...hits];
    }

    tokens.forEach((token) => {
        const exact = [];
        const close = [];

        WORDS.forEach((item, index) => {
            const forms = targetForms(item);
            if (forms.includes(token)) exact.push(index);
            else if (forms.some((form) => fuzzyEqual(token, form))) close.push(index);
        });

        if (exact.length) {
            exact.forEach((index) => {
                if (pending.has(index)) hits.add(index);
            });
        } else if (close.length === 1 && pending.has(close[0])) {
            hits.add(close[0]);
        }
    });

    return [...hits];
}

function isKnownWord(text) {
    const normalized = normalizeText(text);
    if (!normalized) return false;

    const padded = ` ${normalized} `;
    const tokens = normalized.split(' ').filter(Boolean);

    return WORDS.some((item) => {
        if (grammarMode) {
            const target = normalizeText(item.word);
            return target ? padded.includes(` ${target} `) : false;
        }
        const forms = targetForms(item);
        return tokens.some((token) => forms.some((form) => fuzzyEqual(token, form)));
    });
}

function clearCard(index) {
    if (!pending.has(index)) return;
    const card = cardEls[index];
    const rect = card ? card.getBoundingClientRect() : null;
    pending.delete(index);
    updateProgress();

    if (!card) return;

    card.classList.add('matched');
    if (rect) {
        burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        floatPoints(rect.left + rect.width / 2, rect.top + rect.height / 2, POINTS_PER_WORD);
    }

    window.setTimeout(() => {
        card.classList.add('cleared');
        card.setAttribute('aria-hidden', 'true');
        card.tabIndex = -1;
    }, 160);
}

function handleRecognition(text) {
    const hits = findMatches(text);
    if (!hits.length) return false;

    const lock = performance.now() + FEEDBACK_LOCK_MS;
    feedbackLockUntil = lock;
    statusLockUntil = lock;

    const points = hits.length * POINTS_PER_WORD;
    hits.forEach(clearCard);
    addScore(points);
    playCorrectFeedback(hits.length);

    const labels = hits.map((index) => WORDS[index].word).join(', ');
    setStatus(format(t('detected'), { word: labels }), 'detected');

    if (pending.size === 0) {
        gameWon = true;
        window.clearTimeout(statusTimer);
        updateListenButton();
        window.setTimeout(finishGame, 850);
    } else {
        resetStatusLater(FEEDBACK_LOCK_MS + 250);
    }

    return true;
}

function onResult(event) {
    if (gameWon || paused) return;
    if (performance.now() < feedbackLockUntil || performance.now() < statusLockUntil) return;

    const detail = parseDetail(event.detail);
    const raw = String(detail.text || '');
    const text = normalizeText(raw);

    if (!text) {
        resetStatusLater(600);
        return;
    }

    if (handleRecognition(text)) return;

    if (isKnownWord(text)) {
        resetStatusLater(600);
        return;
    }

    if (!grammarMode) {
        statusLockUntil = performance.now() + 900;
        setStatus(t('tryAgain'), 'miss');
        resetStatusLater(1500);
        return;
    }

    statusLockUntil = performance.now() + 800;
    setStatus(format(t('heard'), { text: raw.trim() }), 'miss');
    resetStatusLater(1400);
}

function ensureFxContext() {
    if (!fxCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        try {
            fxCtx = new AudioContextClass();
        } catch (error) {
            return null;
        }
    }
    if (fxCtx.state === 'suspended') {
        fxCtx.resume().catch(() => {});
    }
    return fxCtx;
}

function buildApplauseBuffer(ctx) {
    const rate = ctx.sampleRate;
    const duration = 2.0;
    const frames = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(2, frames, rate);

    for (let channel = 0; channel < 2; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let clap = 0; clap < 70; clap += 1) {
            const start = Math.floor(Math.random() * (frames - rate * 0.14));
            const length = Math.floor(rate * (0.018 + Math.random() * 0.05));
            const amplitude = 0.12 + Math.random() * 0.3;
            for (let i = 0; i < length && start + i < frames; i += 1) {
                const envelope = Math.pow(1 - i / length, 2.4);
                data[start + i] += (Math.random() * 2 - 1) * amplitude * envelope;
            }
        }
        for (let i = 0; i < frames; i += 1) {
            const time = i / rate;
            const fade = Math.min(1, time / 0.15) * Math.min(1, (duration - time) / 0.35);
            data[i] *= fade * 0.8;
        }

        let peak = 0;
        for (let i = 0; i < frames; i += 1) peak = Math.max(peak, Math.abs(data[i]));
        if (peak > 0) {
            const scale = 0.85 / peak;
            for (let i = 0; i < frames; i += 1) data[i] *= scale;
        }
    }

    return buffer;
}

function playApplause(duration) {
    const ctx = ensureFxContext();
    if (!ctx) return;
    try {
        if (!applauseBuffer) applauseBuffer = buildApplauseBuffer(ctx);
        const source = ctx.createBufferSource();
        source.buffer = applauseBuffer;
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 700;
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        const playDuration = Math.min(duration, applauseBuffer.duration);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + Math.max(0, playDuration - 0.25));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + playDuration);
        source.connect(highpass).connect(gain).connect(ctx.destination);
        source.start(now, 0, playDuration);
    } catch (error) {}
}

function tone(ctx, frequency, start, duration, volume, type) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
}

function playBeep() {
    const ctx = ensureFxContext();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(740, now);
        oscillator.frequency.exponentialRampToValueAtTime(988, now + 0.16);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
        gain.gain.setValueAtTime(0.22, now + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.26);
    } catch (error) {}
}

function playPop() {
    const ctx = ensureFxContext();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(480, now);
        oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.11);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } catch (error) {}
}

function playFanfare() {
    const ctx = ensureFxContext();
    if (!ctx) return;
    const start = ctx.currentTime + 0.05;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((frequency, index) => {
        tone(ctx, frequency, start + index * 0.13, 0.4, 0.12, 'sine');
    });
    [1046.5, 1318.51, 1567.98].forEach((frequency) => {
        tone(ctx, frequency, start + notes.length * 0.13, 0.7, 0.09, 'triangle');
    });
}

function burstAt(x, y) {
    const emojis = t('burstEmojis');
    const colors = ['#ff6b8a', '#ffb703', '#2ec27e', '#3b82f6', '#8b5cf6', '#f97316'];

    for (let i = 0; i < 10; i += 1) {
        const particle = document.createElement('span');
        particle.className = 'fx-particle';
        particle.textContent = emojis[i % emojis.length];
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.fontSize = `${18 + Math.random() * 16}px`;
        const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
        const distance = 55 + Math.random() * 90;
        particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        particle.style.setProperty('--rot', `${Math.round(Math.random() * 260 - 130)}deg`);
        fxLayer.appendChild(particle);
        window.setTimeout(() => particle.remove(), 1200);
    }

    for (let i = 0; i < 8; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'fx-confetti';
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.style.background = colors[i % colors.length];
        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
        const distance = 70 + Math.random() * 80;
        piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        piece.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        piece.style.setProperty('--rot', `${Math.round(Math.random() * 500 - 250)}deg`);
        fxLayer.appendChild(piece);
        window.setTimeout(() => piece.remove(), 1100);
    }
}

function floatPoints(x, y, points) {
    const label = document.createElement('div');
    label.className = 'fx-float';
    label.textContent = `+${points}`;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    fxLayer.appendChild(label);
    window.setTimeout(() => label.remove(), 1200);
}

function flashScreen() {
    screenFlash.classList.remove('show');
    void screenFlash.offsetWidth;
    screenFlash.classList.add('show');
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => screenFlash.classList.remove('show'), 700);
}

function playCorrectFeedback(count) {
    ensureFxContext();
    playApplause(1.1 + Math.min(count, 3) * 0.2);
    playBeep();
    flashScreen();
    if (navigator.vibrate) navigator.vibrate([18, 30, 22]);
}

function showCelebration() {
    confettiEl.innerHTML = '';
    const colors = ['#ff6b8a', '#ffb703', '#2ec27e', '#3b82f6', '#8b5cf6', '#f97316'];

    for (let i = 0; i < 56; i += 1) {
        const piece = document.createElement('i');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.7}s`;
        piece.style.animationDuration = `${2.1 + Math.random() * 1.6}s`;
        piece.style.setProperty('--drift', `${Math.round(Math.random() * 240 - 120)}px`);
        confettiEl.appendChild(piece);
    }

    celebrateTitle.textContent = t('greatJob');
    celebrateLead.textContent = format(t('clearedAll'), { total: WORDS.length });
    celebrateScoreValue.textContent = String(score);
    celebrateScoreLabel.textContent = t('points');
    celebration.classList.add('show');
    celebration.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => playAgainBtn.focus(), 350);
}

function finishGame() {
    if (finishing) return;
    finishing = true;
    gameWon = true;
    paused = true;
    window.clearTimeout(statusTimer);
    feedbackLockUntil = performance.now() + 2500;
    updateListenButton();
    setStatus(t('winStatus'), 'detected');

    releaseMicrophone(false);
    playApplause(2.4);
    playFanfare();
    if (navigator.vibrate) navigator.vibrate([30, 40, 30, 40, 80]);

    window.setTimeout(showCelebration, 550);
    window.setTimeout(() => {
        if (started && !paused && !gameWon) return;
        if (audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
    }, 2200);
}

async function beginSession() {
    if (busy) return;
    ensureFxContext();

    const signature = currentSignature();
    const isResume = engineReady && recognizer && recognizerSignature === signature && pending.size > 0 && pending.size < WORDS.length;
    if (!isResume) {
        refreshFromSelection();
    }
    if (!WORDS.length) {
        setStartStatus(t('summaryEmpty'), 'error');
        return;
    }

    busy = true;
    startBtn.disabled = true;

    try {
        if (location.protocol === 'file:') {
            throw new Error('FILE_PROTOCOL');
        }
        if (!window.isSecureContext) {
            throw new Error('FILE_PROTOCOL');
        }
        if (!window.crossOriginIsolated) {
            setStartStatus(t('engineReload'), 'loading');
            updateStartButton(t('starting'), true);
            window.setTimeout(() => {
                if (!window.crossOriginIsolated) {
                    setStartStatus(t('engineFail'), 'error');
                    updateStartButton(t('tryAgainButton'), false);
                    busy = false;
                }
            }, 6000);
            return;
        }

        const previouslyStarted = started;
        updateStartButton(previouslyStarted ? t('listeningButton') : t('starting'), true);
        setStartStatus(t('prepareEngine'), 'loading');

        await ensureEngine();
        setStartStatus(t('turnOnMic'), 'loading');
        await connectMicrophone();

        started = true;
        paused = false;
        gameWon = false;
        finishing = false;
        busy = false;
        statusLockUntil = 0;
        feedbackLockUntil = 0;
        setStatus(t('listening'), 'listening');
        setStartStatus(t('modelNote'), 'idle');
        updateListenButton();
        updateStartButton(t('startButton'), false);
        closeMenu(false);
        celebration.classList.remove('show');
        celebration.setAttribute('aria-hidden', 'true');
        startBtn.blur();
    } catch (error) {
        busy = false;
        setStartStatus(friendlyError(error), 'error');
        updateStartButton(engineReady ? t('tryAgainButton') : t('startButton'), false);
        openMenu(false);
        console.error(error);
    }
}

function pauseListening() {
    if (!started || paused || gameWon) return;
    paused = true;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
    setStatus(t('pausedStatus'), 'paused');
    updateListenButton();
}

async function resumeListening() {
    if (!started || !paused || gameWon) return;
    try {
        if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
        if (!micStream) await connectMicrophone();
        paused = false;
        statusLockUntil = 0;
        setStatus(t('listening'), 'listening');
        updateListenButton();
    } catch (error) {
        setStatus(t('errorNoMic'), 'miss');
        paused = true;
        updateListenButton();
    }
}

async function resetRound() {
    window.clearTimeout(statusTimer);
    finishing = false;
    gameWon = false;
    paused = false;
    statusLockUntil = 0;
    feedbackLockUntil = 0;
    score = 0;
    updateScore();
    celebration.classList.remove('show');
    celebration.setAttribute('aria-hidden', 'true');
    confettiEl.innerHTML = '';
    fxLayer.innerHTML = '';
    renderBoard();
    pending = new Set(WORDS.map((item, index) => index));
    updateProgress();
    updateListenButton();

    if (engineReady && recognizer) {
        setStatus(t('listening'), 'listening');
        closeMenu(false);
        try {
            if (!micStream) await connectMicrophone();
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
            paused = false;
            setStatus(t('listening'), 'listening');
            updateListenButton();
        } catch (error) {
            paused = true;
            updateListenButton();
            setStartStatus(friendlyError(error), 'error');
            openMenu(false);
        }
    } else {
        started = false;
        setStartStatus(t('modelNote'), 'idle');
        updateStartButton(t('startButton'), false);
        openMenu(false);
        updateListenButton();
    }
}

function openMenu(focusInside) {
    ensureFxContext();
    resumeAfterMenu = started && !paused && !gameWon;
    if (resumeAfterMenu) pauseListening();
    celebration.classList.remove('show');
    celebration.setAttribute('aria-hidden', 'true');
    menuClose.hidden = !started;
    populateLevelSelect();
    populateUnitSelect();
    updateModeHighlight();
    updateSummary();
    startOverlay.classList.remove('closed');
    startOverlay.setAttribute('aria-hidden', 'false');
    if (focusInside !== false) {
        window.setTimeout(() => {
            if (startOverlay.classList.contains('closed')) return;
            startBtn.focus();
        }, 120);
    }
}

function closeMenu(resume) {
    startOverlay.classList.add('closed');
    startOverlay.setAttribute('aria-hidden', 'true');
    if (resume !== false && resumeAfterMenu) {
        resumeAfterMenu = false;
        resumeListening();
    } else {
        resumeAfterMenu = false;
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function onLevelChange() {
    selectedLevel = Number(levelSelect.value);
    if (!levelKeys().includes(String(selectedLevel))) selectedLevel = Number(levelKeys()[0]);
    selectedUnit = Number(unitKeys(selectedLevel)[0]);
    try { localStorage.setItem('speakLevel', String(selectedLevel)); } catch (error) {}
    try { localStorage.setItem('speakUnit', String(selectedUnit)); } catch (error) {}
    populateUnitSelect();
    refreshFromSelection();
}

function onUnitChange() {
    selectedUnit = Number(unitSelect.value);
    if (!unitKeys(selectedLevel).includes(String(selectedUnit))) selectedUnit = Number(unitKeys(selectedLevel)[0]);
    try { localStorage.setItem('speakUnit', String(selectedUnit)); } catch (error) {}
    refreshFromSelection();
}

function onModeChange(mode) {
    if (!DISPLAY_MODES.includes(mode)) return;
    displayMode = mode;
    try { localStorage.setItem('speakDisplayMode', mode); } catch (error) {}
    updateModeHighlight();
    renderBoard();
    updateSummary();
    playPop();
}

startBtn.addEventListener('click', beginSession);
playAgainBtn.addEventListener('click', resetRound);
changeWordsCelebrate.addEventListener('click', () => openMenu(true));
menuBtn.addEventListener('click', () => openMenu(true));
menuClose.addEventListener('click', () => closeMenu(true));
levelSelect.addEventListener('change', onLevelChange);
unitSelect.addEventListener('change', onUnitChange);
modeChoices.forEach((button) => {
    button.addEventListener('click', () => onModeChange(button.dataset.mode));
});
listenBtn.addEventListener('click', () => {
    if (paused) resumeListening();
    else pauseListening();
});
fullscreenBtn.addEventListener('click', toggleFullscreen);
window.addEventListener('resize', layoutBoard);
document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenBtn.textContent = active ? '⤢' : '⛶';
    fullscreenBtn.setAttribute('aria-label', active ? t('exitFullscreenAria') : t('fullscreenAria'));
});
window.addEventListener('pagehide', () => {
    releaseMicrophone(true);
    if (started) {
        paused = true;
        updateListenButton();
    }
});

updateStaticText();
populateLevelSelect();
populateUnitSelect();
updateModeHighlight();
refreshFromSelection();
openMenu(false);
