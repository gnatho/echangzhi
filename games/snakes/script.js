/* ===========================================================================
   Snakes & Ladders - Game Logic
   Vanilla JS. Exposes a small API on window.SnakesGame for the HTML buttons.
   =========================================================================== */
(function () {
    "use strict";

    var CFG = window.SNAKES_FIELDS || {};
    var FIELD_IMAGES = CFG.FIELD_IMAGES || {};
    var AUTO_IMAGE_FIELDS = CFG.AUTO_IMAGE_FIELDS != null ? CFG.AUTO_IMAGE_FIELDS : "auto";
    var IMAGE_LIBRARY = CFG.IMAGE_LIBRARY || [{ title: "Surprise", emoji: "🖼️", color: "#feca57", caption: "" }];

    var STEP_MS = 175;        // token step animation duration
    var SLIDE_MS = 540;       // snake/ladder travel duration
    var DICE_TICK_MS = 70;    // dice face change during roll
    var DICE_TICKS = 12;      // number of face changes during a roll

    var PLAYER_DEFS = [
        { name: "Charlotte", color: "#e74c3c", token: "🐶" },
        { name: "Luna", color: "#3498db", token: "🐱" },
        { name: "Player 3", color: "#27ae60", token: "🦊" },
        { name: "Player 4", color: "#f1c40f", token: "🐻" }
    ];

    var PIPS = {
        1: [4], 2: [0, 8], 3: [0, 4, 8],
        4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
    };

    // ---- DOM refs ----
    var menuScreen = document.getElementById("menu-screen");
    var gameScreen = document.getElementById("game-screen");
    var boardEl = document.getElementById("board");
    var boardWrap = document.getElementById("board-wrap");
    var svg = document.getElementById("board-svg");
    var tokenLayer = document.getElementById("token-layer");
    var diceEl = document.getElementById("dice");
    var rollBtn = document.getElementById("roll-btn");
    var messageEl = document.getElementById("message");
    var playerListEl = document.getElementById("player-list");
    var turnTokenEl = document.getElementById("turn-token");
    var turnNameEl = document.getElementById("turn-name");
    var fieldOverlay = document.getElementById("field-overlay");
    var fieldContent = document.getElementById("field-content");
    var fieldCloseBtn = document.getElementById("field-close-btn");
    var winOverlay = document.getElementById("win-overlay");

    // ---- Menu state ----
    var selectedPlayers = 2;
    var selectedSize = 8;

    // ---- Game state ----
    var state = null;
    var audioCtx = null;

    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    // =========================================================================
    //  Geometry helpers
    // =========================================================================
    // Returns the visual position of a cell number (1-indexed).
    // row is measured from the TOP (0 = top row), col from the LEFT (0 = left).
    function cellVisual(c, N) {
        var i = c - 1;
        var logicalRow = Math.floor(i / N);       // 0 = bottom row
        var posInRow = i % N;
        var col = (logicalRow % 2 === 0) ? posInRow : (N - 1 - posInRow);
        var row = (N - 1) - logicalRow;            // flip to top-based
        return { row: row, col: col };
    }

    // =========================================================================
    //  Menu / configuration
    // =========================================================================
    function initMenu() {
        var pOpts = document.getElementById("player-options");
        var sOpts = document.getElementById("size-options");

        function select(group, btn, attr, setter) {
            var btns = group.querySelectorAll(".opt-btn");
            for (var i = 0; i < btns.length; i++) btns[i].classList.remove("selected");
            btn.classList.add("selected");
            setter(btn.getAttribute(attr));
        }

        pOpts.addEventListener("click", function (e) {
            var btn = e.target.closest(".opt-btn");
            if (!btn) return;
            select(pOpts, btn, "data-players", function (v) { selectedPlayers = parseInt(v, 10); });
        });
        sOpts.addEventListener("click", function (e) {
            var btn = e.target.closest(".opt-btn");
            if (!btn) return;
            select(sOpts, btn, "data-size", function (v) { selectedSize = parseInt(v, 10); });
        });

        // default selections
        pOpts.querySelector('[data-players="2"]').classList.add("selected");
        sOpts.querySelector('[data-size="8"]').classList.add("selected");

        document.getElementById("start-btn").addEventListener("click", startGame);
        rollBtn.addEventListener("click", rollDice);
        // The field overlay's close button is rebuilt inside showFieldImage with
        // its own handler; the backdrop click delegates via closeFieldImage().
        fieldOverlay.addEventListener("click", function (e) {
            if (e.target === fieldOverlay) closeFieldImage();
        });
        document.addEventListener("keydown", function (e) {
            if ((e.key === " " || e.key === "Enter") && gameScreen.classList.contains("active")) {
                e.preventDefault();
                rollDice();
            }
        });
        window.addEventListener("resize", function () {
            if (state) { state.boardPx = boardWrap.clientWidth; relayoutTokens(); }
        });
    }

    // =========================================================================
    //  Game setup
    // =========================================================================
    function startGame() {
        menuScreen.classList.remove("active");
        gameScreen.classList.add("active");

        state = {
            size: selectedSize,
            total: selectedSize * selectedSize,
            players: [],
            current: 0,
            snakes: [],
            ladders: [],
            chute: {},            // cell -> { to, type }
            imageFields: {},      // cell -> image data
            cellEls: {},
            rolling: false,
            busy: false,
            gameOver: false,
            boardPx: boardWrap.clientWidth
        };

        for (var i = 0; i < selectedPlayers; i++) {
            var def = PLAYER_DEFS[i];
            state.players.push({
                index: i, name: def.name, color: def.color, token: def.token,
                pos: 1, el: null
            });
        }

        buildBoard();
        generateChutes();
        placeImageFields();
        drawChutes();
        createTokens();
        updatePlayerList();
        setTurnIndicator(state.players[0]);
        setMessage(state.players[0].name + "'s turn — roll the dice!");

        // layout once the screen is painted
        requestAnimationFrame(function () {
            state.boardPx = boardWrap.clientWidth;
            relayoutTokens();
        });
    }

    function buildBoard() {
        var N = state.size;
        boardEl.style.gridTemplateColumns = "repeat(" + N + ", 1fr)";
        boardEl.style.gridTemplateRows = "repeat(" + N + ", 1fr)";
        boardEl.innerHTML = "";
        state.cellEls = {};

        // Build cells top-row-first so CSS grid auto-flow matches the visuals.
        for (var vRow = 0; vRow < N; vRow++) {
            var logicalRow = (N - 1) - vRow;
            var dirRight = (logicalRow % 2 === 0);     // even logical row runs left→right
            var startNum = logicalRow * N + 1;
            for (var col = 0; col < N; col++) {
                var num = dirRight ? (startNum + col) : (startNum + (N - 1 - col));
                var cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.cell = num;
                cell.innerHTML = '<span class="cell-num">' + num + "</span>";
                if (num === 1) { cell.classList.add("start"); cell.insertAdjacentHTML("beforeend", '<span class="cell-label">START</span>'); }
                if (num === state.total) { cell.classList.add("finish"); cell.insertAdjacentHTML("beforeend", '<span class="cell-label">FINISH</span>'); }
                boardEl.appendChild(cell);
                state.cellEls[num] = cell;
            }
        }
    }

    function generateChutes() {
        var N = state.size;
        var total = state.total;
        var used = {};
        used[1] = true; used[total] = true;

        function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
        function tryAdd(type) {
            for (var attempt = 0; attempt < 80; attempt++) {
                var from, to;
                if (type === "ladder") {
                    from = rand(2, total - 3);
                    to = rand(from + 2, total - 1);
                } else {
                    from = rand(N + 1, total - 1);
                    to = rand(2, from - 2);
                }
                if (used[from] || used[to] || from === to) continue;
                if (type === "ladder") { state.ladders.push({ from: from, to: to }); }
                else { state.snakes.push({ from: from, to: to }); }
                used[from] = true; used[to] = true;
                state.chute[from] = { to: to, type: type };
                return true;
            }
            return false;
        }

        var ladderCount = Math.max(2, Math.round(N / 2));
        var snakeCount = Math.max(2, Math.round(N / 2));
        for (var i = 0; i < ladderCount; i++) tryAdd("ladder");
        for (var j = 0; j < snakeCount; j++) tryAdd("snake");

        // Tag the source cells with a small arrow.
        Object.keys(state.chute).forEach(function (cellStr) {
            var ch = state.chute[cellStr];
            var el = state.cellEls[+cellStr];
            if (el) {
                var tag = document.createElement("span");
                tag.className = "chute-tag " + ch.type;
                tag.textContent = ch.type === "ladder" ? "⬆" : "⬇";
                el.appendChild(tag);
            }
        });
    }

    // =========================================================================
    //  Image fields (placeholder system)
    // =========================================================================
    function placeImageFields() {
        var total = state.total;
        var N = state.size;
        state.imageFields = {};

        // 1. Explicit entries from FIELD_IMAGES that exist on this board.
        Object.keys(FIELD_IMAGES).forEach(function (key) {
            var cell = parseInt(key, 10);
            if (cell >= 1 && cell <= total) {
                state.imageFields[cell] = Object.assign({}, FIELD_IMAGES[key]);
            }
        });

        // 2. Scatter extra placeholder image fields across the board.
        var count;
        if (AUTO_IMAGE_FIELDS === "auto") count = Math.max(3, Math.round(N));
        else count = parseInt(AUTO_IMAGE_FIELDS, 10) || 0;

        var blocked = {};
        blocked[1] = true; blocked[total] = true;
        Object.keys(state.chute).forEach(function (c) { blocked[+c] = true; });
        Object.keys(state.chute).forEach(function (c) { blocked[state.chute[c].to] = true; });
        Object.keys(state.imageFields).forEach(function (c) { blocked[+c] = true; });

        var candidates = [];
        for (var c = 2; c < total; c++) if (!blocked[c]) candidates.push(c);

        // Fisher-Yates shuffle
        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
        }

        // Evenly spread `count` picks across the shuffled list so they are not clustered.
        var chosen = [];
        if (candidates.length) {
            for (var k = 0; k < count; k++) {
                var idx = Math.floor(k * candidates.length / count);
                chosen.push(candidates[idx]);
            }
        }

        chosen.forEach(function (cell, idx) {
            if (state.imageFields[cell]) return;
            var lib = IMAGE_LIBRARY[idx % IMAGE_LIBRARY.length];
            state.imageFields[cell] = {
                title: lib.title, emoji: lib.emoji, color: lib.color,
                caption: lib.caption, src: lib.src || ""
            };
        });

        // Mark cells visually with a picture badge.
        Object.keys(state.imageFields).forEach(function (cellStr) {
            var el = state.cellEls[+cellStr];
            if (!el) return;
            el.classList.add("image-field");
            var badge = document.createElement("span");
            badge.className = "field-badge";
            badge.textContent = state.imageFields[+cellStr].emoji || "🖼️";
            el.appendChild(badge);
        });
    }

    // =========================================================================
    //  Draw snakes & ladders (SVG overlay)
    // =========================================================================
    function drawChutes() {
        var N = state.size;
        var cellPct = 100 / N;
        svg.innerHTML = "";
        svg.setAttribute("viewBox", "0 0 100 100");
        var NS = "http://www.w3.org/2000/svg";

        function center(cell) {
            var v = cellVisual(cell, N);
            return { x: (v.col + 0.5) * cellPct, y: (v.row + 0.5) * cellPct };
        }

        state.ladders.forEach(function (l) { drawLadder(center(l.from), center(l.to), cellPct, NS); });
        state.snakes.forEach(function (s) { drawSnake(center(s.from), center(s.to), cellPct, NS); });
    }

    function drawLadder(a, b, cellPct, NS) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var ux = dx / len, uy = dy / len;
        var nx = -uy, ny = ux;            // perpendicular unit
        var off = cellPct * 0.22;
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "ladder");

        function line(x1, y1, x2, y2) {
            var l = document.createElementNS(NS, "line");
            l.setAttribute("x1", x1.toFixed(2)); l.setAttribute("y1", y1.toFixed(2));
            l.setAttribute("x2", x2.toFixed(2)); l.setAttribute("y2", y2.toFixed(2));
            g.appendChild(l);
        }

        // two rails
        line(a.x + nx * off, a.y + ny * off, b.x + nx * off, b.y + ny * off);
        line(a.x - nx * off, a.y - ny * off, b.x - nx * off, b.y - ny * off);
        // rungs
        var rungs = Math.max(3, Math.round(len / cellPct));
        for (var i = 1; i < rungs; i++) {
            var t = i / rungs;
            var p1x = a.x + nx * off + (b.x - a.x) * t;
            var p1y = a.y + ny * off + (b.y - a.y) * t;
            var p2x = a.x - nx * off + (b.x - a.x) * t;
            var p2y = a.y - ny * off + (b.y - a.y) * t;
            line(p1x, p1y, p2x, p2y);
        }
        svg.appendChild(g);
    }

    function drawSnake(a, b, cellPct, NS) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var ux = dx / len, uy = dy / len;
        var nx = -uy, ny = ux;
        var amp = cellPct * 0.26;
        var segs = Math.max(10, Math.round(len / (cellPct * 0.4)));
        var d = "";
        for (var i = 0; i <= segs; i++) {
            var t = i / segs;
            var px = a.x + dx * t;
            var py = a.y + dy * t;
            var taper = Math.sin(t * Math.PI);           // 0 at both ends, 1 in middle
            var w = Math.sin(t * Math.PI * 3) * amp * taper;
            var x = px + nx * w;
            var y = py + ny * w;
            d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
        }
        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "snake-body");
        svg.appendChild(path);

        var head = document.createElementNS(NS, "circle");
        head.setAttribute("cx", a.x.toFixed(2));
        head.setAttribute("cy", a.y.toFixed(2));
        head.setAttribute("r", (cellPct * 0.2).toFixed(2));
        head.setAttribute("class", "snake-head");
        svg.appendChild(head);

        var tail = document.createElementNS(NS, "circle");
        tail.setAttribute("cx", b.x.toFixed(2));
        tail.setAttribute("cy", b.y.toFixed(2));
        tail.setAttribute("r", (cellPct * 0.06).toFixed(2));
        tail.setAttribute("class", "snake-tail");
        svg.appendChild(tail);
    }

    // =========================================================================
    //  Tokens
    // =========================================================================
    function createTokens() {
        tokenLayer.innerHTML = "";
        state.players.forEach(function (p) {
            var t = document.createElement("div");
            t.className = "token";
            t.style.borderColor = p.color;
            t.style.color = p.color;
            t.textContent = p.token;
            tokenLayer.appendChild(t);
            p.el = t;
            positionToken(p, false);
        });
    }

    function positionToken(p, animate) {
        if (!p.el) return;
        if (!state.boardPx) state.boardPx = boardWrap.clientWidth || 1;
        var N = state.size;
        var cellPx = state.boardPx / N;
        var v = cellVisual(p.pos, N);
        var offsets = [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]];
        var o = offsets[p.index] || [0, 0];
        var x = (v.col + 0.5) * cellPx + o[0] * cellPx;
        var y = (v.row + 0.5) * cellPx + o[1] * cellPx;
        var size = cellPx * 0.6;
        p.el.style.transition = animate ? "left " + STEP_MS + "ms cubic-bezier(.4,.2,.2,1), top " + STEP_MS + "ms cubic-bezier(.4,.2,.2,1)" : "none";
        p.el.style.left = x + "px";
        p.el.style.top = y + "px";
        p.el.style.width = size + "px";
        p.el.style.height = size + "px";
        p.el.style.fontSize = (size * 0.5) + "px";
    }

    function relayoutTokens() {
        state.players.forEach(function (p) { positionToken(p, false); });
    }

    // =========================================================================
    //  Dice
    // =========================================================================
    function buildDicePips() {
        diceEl.innerHTML = "";
        for (var i = 0; i < 9; i++) {
            var pip = document.createElement("div");
            pip.className = "pip";
            diceEl.appendChild(pip);
        }
    }

    function setDiceFace(n) {
        var on = PIPS[n] || [];
        var pips = diceEl.children;
        for (var i = 0; i < 9; i++) {
            if (on.indexOf(i) !== -1) pips[i].classList.add("on");
            else pips[i].classList.remove("on");
        }
    }

    function rollDice() {
        if (!state || state.rolling || state.busy || state.gameOver) return;
        state.rolling = true;
        rollBtn.disabled = true;
        diceEl.classList.add("rolling");
        playTone(220, 0.04);

        var ticks = 0;
        var iv = setInterval(function () {
            setDiceFace(1 + Math.floor(Math.random() * 6));
            ticks++;
            if (ticks >= DICE_TICKS) {
                clearInterval(iv);
                var result = 1 + Math.floor(Math.random() * 6);
                setDiceFace(result);
                diceEl.classList.remove("rolling");
                state.rolling = false;
                onDiceResult(result);
            }
        }, DICE_TICK_MS);
    }

    // =========================================================================
    //  Turn resolution
    // =========================================================================
    async function onDiceResult(steps) {
        var p = state.players[state.current];
        state.busy = true;
        setMessage(p.name + " rolled a " + steps + "!");

        // Build the path of cells the token visits (with bounce-back at finish).
        var path = [];
        var cur = p.pos;
        var remaining = steps;
        while (remaining > 0) {
            if (cur + 1 <= state.total) {
                cur++; path.push(cur); remaining--;
            } else {
                // bounce back from the finish line
                while (remaining > 0) { cur--; path.push(cur); remaining--; }
            }
        }

        for (var i = 0; i < path.length; i++) {
            p.pos = path[i];
            positionToken(p, true);
            playTone(440 + i * 25, 0.03);
            await wait(STEP_MS);
        }
        updatePlayerList();

        // Exact landing on finish => win (no snake can pull you off).
        if (p.pos === state.total) { await wait(220); state.busy = false; return winGame(p); }

        // Snake / ladder?
        var ch = state.chute[p.pos];
        if (ch) {
            await wait(180);
            if (ch.type === "ladder") {
                setMessage(p.name + " climbed a ladder! 🪜");
                playTone(523, 0.12); setTimeout(function () { playTone(784, 0.12); }, 110);
            } else {
                setMessage(p.name + " slid down a snake! 🐍");
                playTone(330, 0.12); setTimeout(function () { playTone(165, 0.16); }, 110);
            }
            p.pos = ch.to;
            positionToken(p, true);
            p.el.classList.add(ch.type === "ladder" ? "climbing" : "sliding");
            await wait(SLIDE_MS);
            p.el.classList.remove("climbing", "sliding");
            updatePlayerList();
        }

        // Image field?
        if (state.imageFields[p.pos]) {
            await showFieldImage(p.pos);
        }

        state.busy = false;

        // Roll again on a 6 (classic rule), otherwise next player.
        if (steps === 6 && !state.gameOver) {
            setMessage(p.name + " rolled a 6 — roll again! 🎉");
            rollBtn.disabled = false;
        } else if (!state.gameOver) {
            nextTurn();
        }
    }

    function nextTurn() {
        state.current = (state.current + 1) % state.players.length;
        var p = state.players[state.current];
        updatePlayerList();
        setTurnIndicator(p);
        setMessage(p.name + "'s turn — roll the dice!");
        rollBtn.disabled = false;
    }

    // =========================================================================
    //  Image field overlay
    // =========================================================================
    function showFieldImage(cell) {
        return new Promise(function (resolve) {
            var data = state.imageFields[cell];
            var hasImg = data.src && data.src.length > 0;

            // Build the media area with the DOM so image error handling is robust.
            var media = document.createElement("div");
            media.className = "field-media";

            function makePlaceholder() {
                var ph = document.createElement("div");
                ph.className = "field-placeholder";
                ph.style.background = data.color || "#feca57";
                var emoji = document.createElement("span");
                emoji.className = "ph-emoji";
                emoji.textContent = data.emoji || "🖼️";
                var label = document.createElement("span");
                label.className = "ph-label";
                label.textContent = "PLACEHOLDER";
                ph.appendChild(emoji);
                ph.appendChild(label);
                return ph;
            }

            if (hasImg) {
                var img = document.createElement("img");
                img.className = "field-img";
                img.src = data.src;
                img.alt = data.title || "";
                img.addEventListener("error", function () {
                    media.innerHTML = "";
                    media.appendChild(makePlaceholder());
                });
                media.appendChild(img);
            } else {
                media.appendChild(makePlaceholder());
            }

            fieldContent.innerHTML =
                '<div class="field-cell">Cell ' + cell + "</div>" +
                '<h3 class="field-title">' + (data.title || "Surprise!") + "</h3>" +
                '<p class="field-caption">' + (data.caption || "") + "</p>";
            // Insert the built media right after the cell badge.
            fieldContent.insertBefore(media, fieldContent.firstChild.nextSibling);
            // Append a fresh close button.
            var closeBtn = document.createElement("button");
            closeBtn.className = "btn primary";
            closeBtn.id = "field-close-btn";
            closeBtn.textContent = "Continue ▶";
            fieldContent.appendChild(closeBtn);

            fieldOverlay.classList.add("show");
            playTone(660, 0.1); setTimeout(function () { playTone(880, 0.1); }, 100);

            closeBtn.addEventListener("click", function handler() {
                closeBtn.removeEventListener("click", handler);
                fieldOverlay.classList.remove("show");
                resolve();
            });
        });
    }

    function closeFieldImage() {
        var closeBtn = document.getElementById("field-close-btn");
        if (closeBtn) closeBtn.click();
    }

    // =========================================================================
    //  Win
    // =========================================================================
    function winGame(p) {
        state.gameOver = true;
        rollBtn.disabled = true;
        setMessage(p.name + " wins! 🎉");
        document.getElementById("win-token").textContent = p.token;
        document.getElementById("win-title").textContent = p.name + " Wins! 🎉";
        winOverlay.classList.add("show");
        playTone(523, 0.15);
        setTimeout(function () { playTone(659, 0.15); }, 130);
        setTimeout(function () { playTone(784, 0.2); }, 260);
        setTimeout(function () { playTone(1047, 0.25); }, 400);
    }

    // =========================================================================
    //  UI helpers
    // =========================================================================
    function setMessage(msg) { messageEl.textContent = msg; }

    function setTurnIndicator(p) {
        turnTokenEl.textContent = p.token;
        turnTokenEl.style.color = p.color;
        turnNameEl.textContent = p.name;
        turnNameEl.style.color = p.color;
        turnTokenEl.classList.remove("bounce");
        void turnTokenEl.offsetWidth; // reflow to restart animation
        turnTokenEl.classList.add("bounce");
    }

    function updatePlayerList() {
        playerListEl.innerHTML = "";
        state.players.forEach(function (p, idx) {
            var chip = document.createElement("div");
            chip.className = "player-chip" + (idx === state.current ? " current" : "");
            chip.innerHTML =
                '<span class="pc-token">' + p.token + "</span>" +
                '<span class="pc-name" style="color:' + p.color + '">' + p.name + "</span>" +
                '<span class="pc-pos">' + p.pos + "/" + state.total + "</span>";
            playerListEl.appendChild(chip);
        });
    }

    // =========================================================================
    //  Audio (lightweight Web Audio beeps - fails silently)
    // =========================================================================
    function playTone(freq, dur) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = "triangle";
            o.frequency.value = freq;
            g.gain.value = 0.08;
            o.connect(g); g.connect(audioCtx.destination);
            var t = audioCtx.currentTime;
            o.start(t);
            g.gain.setValueAtTime(0.08, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.stop(t + dur);
        } catch (e) { /* no audio - ignore */ }
    }

    // =========================================================================
    //  Public API (used by inline onclick handlers in index.html)
    // =========================================================================
    function returnToMenu() {
        winOverlay.classList.remove("show");
        fieldOverlay.classList.remove("show");
        gameScreen.classList.remove("active");
        menuScreen.classList.add("active");
        state = null;
    }

    function restart() {
        winOverlay.classList.remove("show");
        fieldOverlay.classList.remove("show");
        if (state && gameScreen.classList.contains("active")) {
            startGame(); // rebuild with a fresh random board
        } else {
            returnToMenu();
        }
    }

    function toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        } catch (e) { /* ignore */ }
    }

    // =========================================================================
    //  Boot
    // =========================================================================
    buildDicePips();
    setDiceFace(6);
    initMenu();

    window.SnakesGame = {
        returnToMenu: returnToMenu,
        restart: restart,
        toggleFullscreen: toggleFullscreen
    };
})();
