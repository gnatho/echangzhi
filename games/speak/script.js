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
const AUDIO_BUFFER_SIZE = 128 * 100;
const DETECT_LOCK_MS = 1300;

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
        return 'The speech model was not found. Put vosk-model-en-us-0.22-lgraph.tar.gz inside games/speak/models/, then try again.';
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

async function modelIsCached() {
    try {
        const cache = await vosklet.getModelCache();
        const keys = await cache.keys(MODEL_PATH, { ignoreSearch: true });
        return keys.length > 0;
    } catch (error) {
        return false;
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
        audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
    }

    if (!vosklet) vosklet = await loadVosklet();

    if (!model) {
        const cached = await modelIsCached();
        setStartStatus(
            cached
                ? 'Loading the English speech model...'
                : 'Downloading the English speech model (first time only, about 128 MB)...',
            'loading'
        );
        model = await vosklet.createModel(MODEL_PATH, MODEL_PATH, MODEL_ID);
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
            recognizer.setEndpointerDelays(0.6, 0.5, 6.0);
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
    if (performance.now() < statusLockUntil) return;
    const detail = parseDetail(event.detail);
    const text = cleanText(detail.partial || '');
    if (!text) return;
    setStatus(`Hearing: ${text}`, 'hearing');
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

function onResult(event) {
    if (gameWon) return;
    const detail = parseDetail(event.detail);
    const text = cleanText(detail.text || '');

    if (!text) {
        resetStatusLater(700);
        return;
    }

    const hits = findMatches(text);

    if (!hits.length) {
        statusLockUntil = performance.now() + 1000;
        setStatus(`Heard: ${text} — try again!`, 'miss');
        resetStatusLater(1500);
        return;
    }

    statusLockUntil = performance.now() + DETECT_LOCK_MS;
    hits.forEach(clearCard);

    const firstWord = WORDS[hits[0]].word;
    setStatus(`Detected: ${firstWord}!`, 'detected');

    if (pending.size === 0) {
        finishGame();
    } else {
        resetStatusLater(DETECT_LOCK_MS + 200);
    }
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

    for (let i = 0; i < 48; i += 1) {
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
