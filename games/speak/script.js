const WORDS = [
    { word: 'apple', emoji: '🍎' },
    { word: 'banana', emoji: '🍌' },
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
    { word: 'elephant', emoji: '🐘' },
    { word: 'fish', emoji: '🐟' },
    { word: 'giraffe', emoji: '🦒' },
    { word: 'house', emoji: '🏠' },
    { word: 'juice', emoji: '🧃' },
    { word: 'kite', emoji: '🪁' },
    { word: 'lion', emoji: '🦁' },
    { word: 'monkey', emoji: '🐵' },
    { word: 'orange', emoji: '🍊' },
    { word: 'pencil', emoji: '✏️' },
    { word: 'rabbit', emoji: '🐰' },
    { word: 'rainbow', emoji: '🌈' },
    { word: 'school', emoji: '🏫' },
    { word: 'tiger', emoji: '🐯' },
    { word: 'umbrella', emoji: '☂️' },
    { word: 'zebra', emoji: '🦓' }
];

const MODEL_FILE = 'models/vosk-model-en-us-0.22-lgraph.tar.gz';
const MODEL_ID = 'vosk-model-en-us-0.22-lgraph';
const MODEL_PATH = new URL(MODEL_FILE, document.baseURI).href;
const SMALL_MODEL_FILE = 'models/vosk-model-small-en-us-0.15.tar.gz';
const SMALL_MODEL_ID = 'vosk-model-small-en-us-0.15';
const SMALL_MODEL_PATH = new URL(SMALL_MODEL_FILE, document.baseURI).href;
const FORCE_ACCURATE_MODEL = new URLSearchParams(window.location.search).get('model') === 'accurate';
const MODEL_ARCHIVE_ROOT = 'vosk-model-en-us-0.22-lgraph';
const MODEL_SOURCE_DIR = 'models/vosk-model-en-us-0.22-lgraph/';
const MODEL_ARCHIVE_DIRS = ['am', 'conf', 'graph', 'graph/phones', 'ivector'];
const MODEL_ARCHIVE_FILES = [
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
];
const utf8Encoder = new TextEncoder();
const AUDIO_BUFFER_SIZE = 128 * 32;
const DETECT_LOCK_MS = 1000;

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
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const startStatus = document.getElementById('start-status');
const celebration = document.getElementById('celebration');
const confettiEl = document.getElementById('confetti');
const playAgainBtn = document.getElementById('play-again-btn');
const celebrateTotal = document.getElementById('celebrate-total');

let vosklet = null;
let model = null;
let activeModelPath = SMALL_MODEL_PATH;
let activeModelId = SMALL_MODEL_ID;
let recognizer = null;
let audioCtx = null;
let micStream = null;
let micNode = null;
let transferer = null;
let cardEls = [];
let pending = new Set();
let engineReady = false;
let started = false;
let paused = false;
let gameWon = false;
let busy = false;
let statusTimer = 0;
let statusLockUntil = 0;

function cleanText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/\[unk\]/g, ' ')
        .replace(/[^a-z' ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildGrammar() {
    const phrases = WORDS.map((item) => cleanText(item.word)).filter(Boolean);
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

function renderBoard() {
    boardEl.innerHTML = '';
    cardEls = [];
    WORDS.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'word-card';
        card.dataset.index = String(index);
        card.dataset.word = item.word;

        const art = document.createElement('div');
        art.className = 'card-art';
        art.textContent = item.emoji || '⭐';
        art.setAttribute('aria-hidden', 'true');

        const word = document.createElement('div');
        word.className = 'card-word';
        word.textContent = item.word;

        card.append(art, word);
        card.setAttribute('aria-label', item.word);
        boardEl.appendChild(card);
        cardEls.push(card);
    });
}

function setStatus(text, mode) {
    statusText.textContent = text;
    statusPanel.dataset.mode = mode || 'idle';
}

function resetStatusLater(delay) {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
        if (!paused && !gameWon && started) {
            setStatus('Listening...', 'listening');
        }
    }, delay);
}

function updateProgress() {
    const total = WORDS.length;
    const left = pending.size;
    const done = total - left;

    remainingCount.textContent = String(left);
    remainingLabel.textContent = left === 1 ? 'word left' : 'words left';
    clearedCount.textContent = String(done);
    totalCount.textContent = String(total);
    progressFill.style.width = total ? `${(done / total) * 100}%` : '0%';
}

function updateListenButton() {
    listenBtn.disabled = !started || gameWon;
    listenBtn.textContent = paused ? '▶' : '⏸';
    listenBtn.setAttribute('aria-label', paused ? 'Resume listening' : 'Pause listening');
}

function setStartStatus(text, mode) {
    startStatus.textContent = text;
    startStatus.dataset.mode = mode || 'idle';
}

function friendlyError(error) {
    const name = error && error.name ? error.name : '';
    const text = String(error && error.message ? error.message : error);

    if (name === 'NotAllowedError' || /permission|denied/i.test(text)) {
        return 'Microphone permission was denied. Allow the microphone in your browser settings, then tap Try again.';
    }
    if (name === 'NotFoundError' || /no.*microphone|requested device not found/i.test(text)) {
        return 'No microphone was found. Connect a microphone, then tap Try again.';
    }
    if (/Unable to fetch model|status: 404|Failed to fetch/i.test(text)) {
        return 'The speech model files were not found. Put vosk-model-small-en-us-0.15.tar.gz or the vosk-model-en-us-0.22-lgraph folder/archive inside games/speak/models/, then try again.';
    }
    if (/SharedArrayBuffer|crossOriginIsolated|shared memory/i.test(text)) {
        return 'The speech engine needs cross-origin isolation. Open the game over HTTPS or localhost and reload the page.';
    }
    if (/FILE_PROTOCOL/i.test(text)) {
        return 'Open the game through a local web server, not by double-clicking the HTML file.';
    }
    if (/not in the speech model/i.test(text)) {
        return text;
    }
    return `Could not start speech recognition: ${text}`;
}

async function modelIsCached(path) {
    try {
        const cache = await vosklet.getModelCache();
        const keys = await cache.keys(path, { ignoreSearch: true });
        return keys.length > 0;
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

async function selectModel() {
    if (FORCE_ACCURATE_MODEL) {
        const cached = await modelIsCached(MODEL_PATH);
        const hasArchive = cached || await urlExists(MODEL_PATH);
        return { path: MODEL_PATH, id: MODEL_ID, fast: false, build: !hasArchive };
    }

    if (await modelIsCached(SMALL_MODEL_PATH) || await urlExists(SMALL_MODEL_PATH)) {
        return { path: SMALL_MODEL_PATH, id: SMALL_MODEL_ID, fast: true, build: false };
    }

    const accurateCached = await modelIsCached(MODEL_PATH);
    const accurateArchive = accurateCached || await urlExists(MODEL_PATH);
    return { path: MODEL_PATH, id: MODEL_ID, fast: false, build: !accurateArchive };
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

async function buildModelArchive() {
    const gzip = new CompressionStream('gzip');
    const writer = gzip.writable.getWriter();
    const blobPromise = new Response(gzip.readable).blob();
    const root = `${MODEL_ARCHIVE_ROOT}/`;

    try {
        await writer.write(createTarHeader(root, 0, '5'));

        for (const dir of MODEL_ARCHIVE_DIRS) {
            await writer.write(createTarHeader(`${root}${dir}/`, 0, '5'));
        }

        for (let i = 0; i < MODEL_ARCHIVE_FILES.length; i += 1) {
            const relative = MODEL_ARCHIVE_FILES[i];
            setStartStatus(`Downloading the speech model (${i + 1}/${MODEL_ARCHIVE_FILES.length})...`, 'loading');

            const response = await fetch(
                new URL(`${MODEL_SOURCE_DIR}${relative}`, document.baseURI),
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
        setStartStatus('Preparing the speech model...', 'loading');
        return await blobPromise;
    } catch (error) {
        try { await writer.abort(error); } catch (abortError) {}
        throw error;
    }
}

async function ensureEngine() {
    if (engineReady) return;

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
        activeModelId = selected.id;

        const cached = await modelIsCached(activeModelPath);
        let source = activeModelPath;
        let blobUrl = '';

        if (cached) {
            setStartStatus(`Loading the ${selected.fast ? 'fast ' : ''}English speech model...`, 'loading');
        } else if (selected.build) {
            setStartStatus('Preparing the high-accuracy speech model (first time only)...', 'loading');
            const archive = await buildModelArchive();
            blobUrl = URL.createObjectURL(archive);
            source = blobUrl;
        } else {
            setStartStatus(
                `Downloading the ${selected.fast ? 'fast ' : 'high-accuracy '}English speech model ` +
                `(first time only, about ${selected.fast ? '40' : '128'} MB)...`,
                'loading'
            );
        }

        try {
            model = await vosklet.createModel(source, activeModelPath, activeModelId);
        } finally {
            if (blobUrl) window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        }
    }

    const missing = [...new Set(
        WORDS.flatMap((item) => cleanText(item.word).split(' ')).filter(Boolean)
    )].filter((word) => model.findWord(word) < 0);

    if (missing.length) {
        throw new Error(`These words are not in the speech model: ${missing.join(', ')}. Edit WORDS in script.js.`);
    }

    if (!recognizer) {
        setStartStatus('Building the word grammar...', 'loading');
        recognizer = await vosklet.createRecognizerWithGrm(model, audioCtx.sampleRate, buildGrammar());
        if (typeof recognizer.setEndpointerDelays === 'function') {
            recognizer.setEndpointerDelays(0.4, 0.3, 4.0);
        }
        recognizer.addEventListener('partialResult', onPartialResult);
        recognizer.addEventListener('result', onResult);
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
    if (gameWon || performance.now() < statusLockUntil) return;
    const detail = parseDetail(event.detail);
    const text = cleanText(detail.partial || '');
    if (!text) return;
    if (!handleRecognition(text)) {
        setStatus(`Hearing: ${text}`, 'hearing');
    }
}

function findMatches(text) {
    const padded = ` ${text} `;
    const hits = [];
    pending.forEach((index) => {
        const word = cleanText(WORDS[index].word);
        if (word && padded.includes(` ${word} `)) hits.push(index);
    });
    return hits;
}

function clearCard(index) {
    if (!pending.has(index)) return;
    pending.delete(index);
    updateProgress();

    const card = cardEls[index];
    if (!card) return;

    card.classList.add('matched');
    window.setTimeout(() => {
        card.classList.add('cleared');
        card.setAttribute('aria-hidden', 'true');
    }, 120);
}

function handleRecognition(text) {
    const hits = findMatches(text);
    if (!hits.length) return false;

    statusLockUntil = performance.now() + DETECT_LOCK_MS;
    hits.forEach(clearCard);

    const firstWord = WORDS[hits[0]].word;
    setStatus(`Detected: ${firstWord}!`, 'detected');

    if (pending.size === 0) {
        finishGame();
    } else {
        resetStatusLater(DETECT_LOCK_MS + 150);
    }

    return true;
}

function onResult(event) {
    if (gameWon) return;
    if (performance.now() < statusLockUntil) return;

    const detail = parseDetail(event.detail);
    const text = cleanText(detail.text || '');

    if (!text) {
        resetStatusLater(600);
        return;
    }

    if (handleRecognition(text)) return;

    const knownWord = WORDS.find((item) => {
        const word = cleanText(item.word);
        return word && ` ${text} `.includes(` ${word} `);
    });

    if (knownWord) {
        resetStatusLater(600);
        return;
    }

    statusLockUntil = performance.now() + 800;
    setStatus(`Heard: ${text} — try again!`, 'miss');
    resetStatusLater(1400);
}

function playFanfare() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((frequency, index) => {
            const start = now + index * 0.13;
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.46);
        });
    } catch (error) {}
}

function showCelebration() {
    confettiEl.innerHTML = '';
    const colors = ['#ff6b8a', '#ffb703', '#2ec27e', '#3b82f6', '#8b5cf6', '#f97316'];

    for (let i = 0; i < 24; i += 1) {
        const piece = document.createElement('i');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.7}s`;
        piece.style.animationDuration = `${2.1 + Math.random() * 1.6}s`;
        piece.style.setProperty('--drift', `${Math.round(Math.random() * 240 - 120)}px`);
        confettiEl.appendChild(piece);
    }

    celebrateTotal.textContent = String(WORDS.length);
    celebration.classList.add('show');
    celebration.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => playAgainBtn.focus(), 350);
}

function finishGame() {
    gameWon = true;
    paused = true;
    window.clearTimeout(statusTimer);
    statusLockUntil = performance.now() + 2000;
    updateListenButton();

    releaseMicrophone(false);
    playFanfare();
    window.setTimeout(showCelebration, 600);
    window.setTimeout(() => {
        if (gameWon && audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
    }, 2200);
}

function updateStartButton(label, disabled) {
    startBtn.textContent = label;
    startBtn.disabled = disabled;
}

async function beginSession() {
    if (busy) return;
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
            setStartStatus('Preparing the speech engine... The page will reload once. Then tap Start again.', 'loading');
            updateStartButton('Getting ready...', true);
            window.setTimeout(() => {
                if (!window.crossOriginIsolated) {
                    setStartStatus('This browser could not enable the speech engine. Serve the game over HTTPS or localhost, and make sure service workers are allowed.', 'error');
                    updateStartButton('Try again', false);
                    busy = false;
                }
            }, 6000);
            return;
        }

        const previouslyStarted = started;
        updateStartButton(previouslyStarted ? 'Listening...' : 'Starting...', true);
        setStartStatus('Preparing the microphone and speech model...', 'loading');

        await ensureEngine();
        setStartStatus('Turning on the microphone...', 'loading');
        await connectMicrophone();

        started = true;
        paused = false;
        gameWon = false;
        busy = false;
        statusLockUntil = 0;
        setStatus('Listening...', 'listening');
        updateListenButton();
        updateStartButton('Start speaking', false);
        startOverlay.classList.add('closed');
        startBtn.blur();
    } catch (error) {
        busy = false;
        setStartStatus(friendlyError(error), 'error');
        updateStartButton(engineReady ? 'Try again' : 'Start speaking', false);
        startOverlay.classList.remove('closed');
        console.error(error);
    }
}

function pauseListening() {
    if (!started || paused || gameWon) return;
    paused = true;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
    setStatus('Paused — tap ▶ to listen again.', 'paused');
    updateListenButton();
}

async function resumeListening() {
    if (!started || !paused || gameWon) return;
    try {
        if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
        if (!micStream) await connectMicrophone();
        paused = false;
        statusLockUntil = 0;
        setStatus('Listening...', 'listening');
        updateListenButton();
    } catch (error) {
        setStatus('Microphone is not available. Tap Start to try again.', 'miss');
        paused = true;
        updateListenButton();
    }
}

async function resetRound() {
    gameWon = false;
    paused = false;
    statusLockUntil = 0;
    celebration.classList.remove('show');
    celebration.setAttribute('aria-hidden', 'true');
    confettiEl.innerHTML = '';
    renderBoard();
    pending = new Set(WORDS.map((item, index) => index));
    updateProgress();
    updateListenButton();

    if (engineReady && recognizer) {
        setStatus('Listening...', 'listening');
        try {
            if (!micStream) await connectMicrophone();
            if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
            paused = false;
            setStatus('Listening...', 'listening');
            updateListenButton();
        } catch (error) {
            paused = true;
            updateListenButton();
            setStartStatus(friendlyError(error), 'error');
            startOverlay.classList.remove('closed');
        }
    } else {
        setStartStatus('Tap Start and allow the microphone to play.', 'idle');
        updateStartButton('Start speaking', false);
        startOverlay.classList.remove('closed');
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

startBtn.addEventListener('click', beginSession);
playAgainBtn.addEventListener('click', resetRound);
listenBtn.addEventListener('click', () => {
    if (paused) resumeListening();
    else pauseListening();
});
fullscreenBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenBtn.textContent = active ? '⤢' : '⛶';
    fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Toggle fullscreen');
});
window.addEventListener('pagehide', () => {
    releaseMicrophone(true);
    if (started) {
        paused = true;
        updateListenButton();
    }
});

renderBoard();
pending = new Set(WORDS.map((item, index) => index));
updateProgress();
updateListenButton();
celebrateTotal.textContent = String(WORDS.length);
