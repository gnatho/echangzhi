'use strict';

(function () {
    /* ── State ─────────────────────────────────────────── */
    let isRolling = false;
    let currentRollResult = 1;

    const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    /* ── Overlay helpers ───────────────────────────────── */
    function getOverlayEls() {
        return {
            overlay:   document.getElementById('dice-overlay'),
            face:      document.getElementById('dice-anim-face'),
            label:     document.getElementById('dice-anim-label'),
            resultBox: document.getElementById('dice-result-display'),
            totalEl:   document.getElementById('dice-total'),
        };
    }

    function showOverlay() {
        const { overlay, face, label, resultBox } = getOverlayEls();
        if (!overlay) return;
        resultBox.classList.remove('show');
        face.classList.remove('landed');
        face.classList.add('spinning');
        face.textContent = DICE_FACES[0];
        label.textContent = 'Rolling\u2026';
        overlay.classList.add('active');
    }

    function hideOverlay() {
        const { overlay } = getOverlayEls();
        if (overlay) overlay.classList.remove('active');
    }

    /* ── Main animation promise ────────────────────────── */
    function animateRoll(forcedResult) {
        return new Promise((resolve) => {
            const { face, label, resultBox, totalEl } = getOverlayEls();

            const result = (forcedResult !== null && forcedResult >= 1 && forcedResult <= 6)
                ? forcedResult
                : Math.floor(Math.random() * 6) + 1;

            const totalMs = 900;
            const startMs = Date.now();
            let frameDelay = 60;

            function shuffle() {
                const elapsed = Date.now() - startMs;
                if (elapsed < totalMs) {
                    face.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
                    frameDelay = 60 + Math.floor((elapsed / totalMs) * 160);
                    setTimeout(shuffle, frameDelay);
                } else {
                    // Land on the result
                    face.classList.remove('spinning');
                    face.textContent = DICE_FACES[result - 1];
                    face.classList.add('landed');
                    label.textContent = 'You rolled\u2026';

                    setTimeout(() => {
                        if (totalEl) totalEl.textContent = result;
                        resultBox.classList.add('show');
                        setTimeout(() => resolve(result), 900);
                    }, 300);
                }
            }

            shuffle();
        });
    }

    /* ── DiceController class ──────────────────────────── */
    class DiceController {
        async roll(forcedResult = null) {
            if (isRolling) {
                console.log('Dice already rolling \u2013 ignoring request');
                return currentRollResult;
            }
            isRolling = true;

            showOverlay();

            // Animate the small header dice emoji too
            const headerDice  = document.getElementById('dice');
            const headerValue = document.getElementById('dice-value');
            let shuffleHeader;
            if (headerDice) {
                headerDice.classList.add('rolling');
                shuffleHeader = setInterval(() => {
                    headerDice.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
                }, 80);
            }

            const result = await animateRoll(forcedResult);
            currentRollResult = result;

            if (shuffleHeader) clearInterval(shuffleHeader);
            if (headerDice) {
                headerDice.classList.remove('rolling');
                headerDice.textContent = DICE_FACES[result - 1];
                headerDice.classList.add('result-shown');
                setTimeout(() => headerDice.classList.remove('result-shown'), 500);
            }
            if (headerValue) headerValue.textContent = result;

            hideOverlay();
            isRolling = false;
            return result;
        }

        isCurrentlyRolling() { return isRolling; }
    }

    /* ── Singleton factory ─────────────────────────────── */
    let diceController = null;

    window.initDiceController = function () {
        if (!diceController) diceController = new DiceController();
        return diceController;
    };

    /* ── Public rollDice (called by the header dice click) */
    window.rollDice = function () {
        if (typeof gameState === 'undefined') {
            console.warn('rollDice: gameState not ready');
            return;
        }
        if (!gameState.waitingForRoll || gameState.gameOver) return;

        const player = gameState.players[gameState.currentPlayer];
        if (player.skipNext) {
            player.skipNext = false;
            if (typeof renderPlayerCards === 'function') renderPlayerCards();
            if (typeof nextTurn         === 'function') nextTurn();
            return;
        }

        gameState.waitingForRoll = false;
        if (typeof playSound === 'function') playSound('roll');

        window.initDiceController().roll().then(window.handleRollResult);
    };

    /* ── handleRollResult ──────────────────────────────── */
    window.handleRollResult = function (rollResult) {
        if (typeof announceDiceResult === 'function') announceDiceResult(rollResult);
        setTimeout(function () {
            if (typeof movePlayer === 'function') movePlayer(rollResult);
        }, 400);
    };

    /* ── Force roll (debug / teacher tool) ─────────────── */
    window.rollDiceForce = function (value) {
        if (value < 1 || value > 6) { console.error('rollDiceForce: 1\u20136 only'); return; }
        if (typeof gameState === 'undefined' || !gameState.waitingForRoll || gameState.gameOver) return;

        const player = gameState.players[gameState.currentPlayer];
        if (player.skipNext) {
            player.skipNext = false;
            if (typeof renderPlayerCards === 'function') renderPlayerCards();
            if (typeof nextTurn         === 'function') nextTurn();
            return;
        }

        gameState.waitingForRoll = false;
        if (typeof playSound === 'function') playSound('roll');

        window.initDiceController().roll(value).then(window.handleRollResult);
    };

    /* ── Misc helpers ──────────────────────────────────── */
    window.getDiceController   = () => diceController;
    window.resetDiceController = () => { diceController = new DiceController(); return diceController; };
    window.isDiceRolling       = () => isRolling;

    window.announceDiceResult = function (value) {
        const el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        el.textContent = 'Dice rolled ' + value;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    };

    window.setupDiceKeyboardSupport = function () {
        document.addEventListener('keydown', function (e) {
            if ((e.code === 'Space' || e.code === 'Enter') &&
                typeof gameState !== 'undefined' &&
                gameState.waitingForRoll && !gameState.gameOver) {
                const gs = document.getElementById('game-screen');
                if (gs && gs.classList.contains('active')) {
                    e.preventDefault();
                    window.rollDice();
                }
            }
        });
    };

    // Debug helpers
    window.testDiceFaces        = () => { DICE_FACES.forEach((f, i) => console.log(i+1, f)); return DICE_FACES.length === 6; };
    window.testRapidRolls       = (n = 10) => Array.from({length: n}, () => Math.floor(Math.random()*6)+1).every(r => r >= 1 && r <= 6);
    window.testOppositeFaceSums = () => [1+6, 2+5, 3+4].every(s => s === 7);
    window.testAccessibility    = () => { const d = document.getElementById('dice'); return !!(d && d.getAttribute); };

    console.log('Dice controller initialised \u2713');
})();
