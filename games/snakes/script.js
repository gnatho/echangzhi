(function () {
    "use strict";

    var CFG = window.SNAKES_FIELDS || {};
    var FIELD_IMAGES = CFG.FIELD_IMAGES || {};
    var AUTO_IMAGE_FIELDS = CFG.AUTO_IMAGE_FIELDS != null ? CFG.AUTO_IMAGE_FIELDS : "auto";
    var IMAGE_LIBRARY = CFG.IMAGE_LIBRARY || [{ title: "Surprise", emoji: "✨", color: "#feca57", caption: "" }];

    var STEP_MS = 190;
    var SLIDE_MS = 680;
    var DICE_TICK_MS = 72;
    var DICE_TICKS = 13;

    var TOKEN_ICONS = [
        "🐶", "🐱", "🦊", "🐻", "🐼", "🐯", "🦁", "🐮", "🐷", "🐵",
        "🐰", "🐭", "🐹", "🐸", "🐧", "🦉", "🦜", "🦩", "🦋", "🐝",
        "🐞", "🐢", "🐙", "🦑", "🦄", "🐉", "🦖", "🐳", "🐬", "🦈",
        "🚀", "🛸", "🤖", "👾", "🎃", "🍄", "⭐", "🌈", "⚽", "👑"
    ];

    var PLAYER_COLORS = ["#e11d48", "#0284c7", "#16a34a", "#d97706", "#7c3aed", "#db2777", "#0d9488", "#ea580c"];

    var ORDER_LABELS = ["1st", "2nd", "3rd", "4th"];
    var MEDALS = ["🥇", "🥈", "🥉", "🏅"];

    var PIPS = {
        1: [4], 2: [0, 8], 3: [0, 4, 8],
        4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
    };

    var CLASSES = [];
    var STUDENTS = [];
    try {
        if (typeof classes !== "undefined" && Array.isArray(classes)) CLASSES = classes.slice();
        if (typeof students !== "undefined" && Array.isArray(students)) STUDENTS = students.slice();
    } catch (e) { /* data file missing - fall back below */ }

    if (!CLASSES.length) CLASSES = ["My Class"];
    if (!STUDENTS.length) {
        STUDENTS = [
            { id: -1, username: "Player 1", loginName: "", classId: 0 },
            { id: -2, username: "Player 2", loginName: "", classId: 0 },
            { id: -3, username: "Player 3", loginName: "", classId: 0 },
            { id: -4, username: "Player 4", loginName: "", classId: 0 }
        ];
    }

    var menuScreen = document.getElementById("menu-screen");
    var gameScreen = document.getElementById("game-screen");
    var boardEl = document.getElementById("board");
    var svg = document.getElementById("board-svg");
    var tokenLayer = document.getElementById("token-layer");
    var diceEl = document.getElementById("dice");
    var diceStage = document.getElementById("dice-stage");
    var rollBtn = document.getElementById("roll-btn");
    var messageEl = document.getElementById("message");
    var playerListEl = document.getElementById("player-list");
    var turnTokenEl = document.getElementById("turn-token");
    var turnAvatarEl = document.getElementById("turn-avatar");
    var turnNameEl = document.getElementById("turn-name");
    var fieldOverlay = document.getElementById("field-overlay");
    var fieldContent = document.getElementById("field-content");
    var winOverlay = document.getElementById("win-overlay");
    var classOptionsEl = document.getElementById("class-options");
    var playerCardsEl = document.getElementById("player-cards");

    var state = null;
    var audioCtx = null;
    var confettiStop = null;

    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // =====================================================================
    //  Geometry
    // =====================================================================
    function cellVisual(c, N) {
        var i = c - 1;
        var logicalRow = Math.floor(i / N);
        var posInRow = i % N;
        var col = (logicalRow % 2 === 0) ? posInRow : (N - 1 - posInRow);
        var row = (N - 1) - logicalRow;
        return { row: row, col: col };
    }

    function cellCenterPct(c, N) {
        var v = cellVisual(c, N);
        return { x: (v.col + 0.5) * (100 / N), y: (v.row + 0.5) * (100 / N) };
    }

    function cellCenterPx(c, N, boardPx) {
        var v = cellVisual(c, N);
        var cellPx = boardPx / N;
        return { x: (v.col + 0.5) * cellPx, y: (v.row + 0.5) * cellPx };
    }

    // =====================================================================
    //  Setup / menu state
    // =====================================================================
    var setup = {
        classId: 0,
        size: 8,
        players: []
    };
    var playerCount = 2;

    function studentsInClass(classId) {
        return STUDENTS.filter(function (s) { return s.classId === classId; });
    }

    function studentById(id) {
        for (var i = 0; i < STUDENTS.length; i++) if (STUDENTS[i].id === id) return STUDENTS[i];
        return null;
    }

    function makePlayer(slot) {
        var list = studentsInClass(setup.classId);
        var taken = {};
        setup.players.forEach(function (p) { if (p.studentId != null) taken[p.studentId] = true; });
        var pick = null;
        for (var i = 0; i < list.length; i++) {
            if (!taken[list[i].id]) { pick = list[i]; break; }
        }
        return {
            studentId: pick ? pick.id : null,
            custom: !pick,
            name: pick ? pick.username : ("Player " + (slot + 1)),
            token: TOKEN_ICONS[(slot * 7) % TOKEN_ICONS.length],
            color: PLAYER_COLORS[slot % PLAYER_COLORS.length]
        };
    }

    function syncPlayerCount() {
        while (setup.players.length < playerCount) setup.players.push(makePlayer(setup.players.length));
        if (setup.players.length > playerCount) setup.players.length = playerCount;
    }

    function retargetStudentsToClass() {
        var taken = {};
        setup.players.forEach(function (p) {
            var list = studentsInClass(setup.classId);
            if (p.custom || p.studentId == null || !list.some(function (s) { return s.id === p.studentId; })) {
                var pick = null;
                for (var i = 0; i < list.length; i++) {
                    if (!taken[list[i].id]) { pick = list[i]; break; }
                }
                if (pick) {
                    p.studentId = pick.id;
                    p.custom = false;
                    p.name = pick.username;
                    taken[pick.id] = true;
                } else {
                    p.studentId = null;
                    p.custom = true;
                    if (!p.name) p.name = "Player";
                }
            } else {
                taken[p.studentId] = true;
            }
        });
    }

    function usedTokens(exceptIdx) {
        var used = {};
        setup.players.forEach(function (p, i) {
            if (i !== exceptIdx) used[p.token] = true;
        });
        return used;
    }

    function usedStudents(exceptIdx) {
        var used = {};
        setup.players.forEach(function (p, i) {
            if (i !== exceptIdx && p.studentId != null) used[p.studentId] = true;
        });
        return used;
    }

    function renderClassChips() {
        classOptionsEl.innerHTML = "";
        CLASSES.forEach(function (name, idx) {
            var count = studentsInClass(idx).length;
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className = "class-chip" + (idx === setup.classId ? " selected" : "");
            chip.innerHTML = esc(name) + '<span class="chip-count">' + count + "</span>";
            chip.addEventListener("click", function () {
                if (setup.classId === idx) return;
                setup.classId = idx;
                retargetStudentsToClass();
                renderClassChips();
                renderPlayerCards();
            });
            classOptionsEl.appendChild(chip);
        });
    }

    function renderPlayerCards() {
        playerCardsEl.innerHTML = "";
        setup.players.forEach(function (p, idx) {
            playerCardsEl.appendChild(buildPlayerCard(p, idx));
        });
    }

    function buildPlayerCard(p, idx) {
        var card = document.createElement("div");
        card.className = "player-card";
        card.dataset.slot = String(idx);

        var head = document.createElement("div");
        head.className = "pc-head";

        var badge = document.createElement("div");
        badge.className = "order-badge";
        badge.textContent = ORDER_LABELS[idx] + " · Turn " + (idx + 1);

        var avatar = document.createElement("div");
        avatar.className = "pc-avatar";
        avatar.style.setProperty("--pc", p.color);
        avatar.textContent = p.token;

        var fields = document.createElement("div");
        fields.className = "pc-fields";

        var select = document.createElement("select");
        select.className = "student-select";
        var used = usedStudents(idx);
        studentsInClass(setup.classId).forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = String(s.id);
            opt.textContent = s.username + (s.loginName ? " (" + s.loginName + ")" : "");
            if (used[s.id] && p.studentId !== s.id) opt.disabled = true;
            if (p.studentId === s.id && !p.custom) opt.selected = true;
            select.appendChild(opt);
        });
        var customOpt = document.createElement("option");
        customOpt.value = "custom";
        customOpt.textContent = "✏️ Custom name…";
        if (p.custom || p.studentId == null) customOpt.selected = true;
        select.appendChild(customOpt);

        select.addEventListener("change", function () {
            if (select.value === "custom") {
                p.custom = true;
                p.studentId = null;
                if (!p.name || !p.custom) p.name = "Player " + (idx + 1);
            } else {
                var s = studentById(parseInt(select.value, 10));
                if (s) {
                    p.custom = false;
                    p.studentId = s.id;
                    p.name = s.username;
                }
            }
            renderPlayerCards();
        });

        var nameInput = document.createElement("input");
        nameInput.className = "name-input" + (p.custom ? "" : " hidden");
        nameInput.type = "text";
        nameInput.maxLength = 18;
        nameInput.placeholder = "Type a name";
        nameInput.value = p.custom ? (p.name || "") : "";
        nameInput.addEventListener("input", function () {
            p.name = nameInput.value;
        });

        fields.appendChild(select);
        fields.appendChild(nameInput);

        var orderBtns = document.createElement("div");
        orderBtns.className = "order-btns";

        var handle = document.createElement("div");
        handle.className = "drag-handle";
        handle.title = "Drag to reorder";
        handle.textContent = "⠿";
        handle.addEventListener("mousedown", function () { card.draggable = true; });
        handle.addEventListener("touchstart", function () { card.draggable = true; }, { passive: true });

        var up = document.createElement("button");
        up.type = "button";
        up.className = "ord-btn";
        up.textContent = "▲";
        up.title = "Move earlier";
        up.disabled = idx === 0;
        up.addEventListener("click", function () { movePlayer(idx, -1); });

        var down = document.createElement("button");
        down.type = "button";
        down.className = "ord-btn";
        down.textContent = "▼";
        down.title = "Move later";
        down.disabled = idx === setup.players.length - 1;
        down.addEventListener("click", function () { movePlayer(idx, 1); });

        orderBtns.appendChild(handle);
        orderBtns.appendChild(up);
        orderBtns.appendChild(down);

        head.appendChild(badge);
        head.appendChild(avatar);
        head.appendChild(fields);
        head.appendChild(orderBtns);

        var iconRow = document.createElement("div");
        iconRow.className = "icon-row";
        var usedTokensMap = usedTokens(idx);
        TOKEN_ICONS.forEach(function (icon) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "icon-opt" + (icon === p.token ? " selected" : "");
            b.style.setProperty("--pc", p.color);
            b.textContent = icon;
            if (usedTokensMap[icon]) b.disabled = true;
            b.addEventListener("click", function () {
                if (b.disabled) return;
                p.token = icon;
                renderPlayerCards();
                var fresh = playerCardsEl.children[idx];
                var av = fresh && fresh.querySelector(".pc-avatar");
                if (av) {
                    av.textContent = icon;
                    av.classList.add("bump");
                }
            });
            iconRow.appendChild(b);
        });

        card.appendChild(head);
        card.appendChild(iconRow);

        card.addEventListener("dragstart", function (e) {
            card.classList.add("dragging");
            try { e.dataTransfer.setData("text/plain", String(idx)); e.dataTransfer.effectAllowed = "move"; } catch (err) { }
        });
        card.addEventListener("dragend", function () {
            card.classList.remove("dragging");
            card.draggable = false;
            Array.prototype.forEach.call(playerCardsEl.children, function (c) { c.classList.remove("drag-over"); });
        });
        card.addEventListener("dragover", function (e) {
            e.preventDefault();
            card.classList.add("drag-over");
        });
        card.addEventListener("dragleave", function () { card.classList.remove("drag-over"); });
        card.addEventListener("drop", function (e) {
            e.preventDefault();
            card.classList.remove("drag-over");
            var from = parseInt((e.dataTransfer && e.dataTransfer.getData("text/plain")) || "-1", 10);
            if (isNaN(from) || from < 0 || from >= setup.players.length || from === idx) return;
            var moved = setup.players.splice(from, 1)[0];
            setup.players.splice(idx, 0, moved);
            renderPlayerCards();
        });

        return card;
    }

    function movePlayer(idx, dir) {
        var target = idx + dir;
        if (target < 0 || target >= setup.players.length) return;
        var tmp = setup.players[idx];
        setup.players[idx] = setup.players[target];
        setup.players[target] = tmp;
        renderPlayerCards();
    }

    function shuffleOrder() {
        for (var i = setup.players.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = setup.players[i];
            setup.players[i] = setup.players[j];
            setup.players[j] = t;
        }
        renderPlayerCards();
    }

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
            select(pOpts, btn, "data-players", function (v) {
                playerCount = parseInt(v, 10);
                syncPlayerCount();
                renderPlayerCards();
            });
        });
        sOpts.addEventListener("click", function (e) {
            var btn = e.target.closest(".opt-btn");
            if (!btn) return;
            select(sOpts, btn, "data-size", function (v) { setup.size = parseInt(v, 10); });
        });

        pOpts.querySelector('[data-players="2"]').classList.add("selected");
        sOpts.querySelector('[data-size="8"]').classList.add("selected");

        document.getElementById("shuffle-order-btn").addEventListener("click", shuffleOrder);
        document.getElementById("start-btn").addEventListener("click", startGame);
        rollBtn.addEventListener("click", rollDice);

        fieldOverlay.addEventListener("click", function (e) {
            if (e.target === fieldOverlay) closeFieldImage();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key !== " " && e.key !== "Enter") return;
            var t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || t.isContentEditable)) return;
            if (!gameScreen.classList.contains("active")) return;
            if (fieldOverlay.classList.contains("show") || winOverlay.classList.contains("show")) return;
            e.preventDefault();
            rollDice();
        });

        window.addEventListener("resize", function () {
            if (state) {
                state.boardPx = tokenLayer.clientWidth || 1;
                relayoutTokens();
            }
            sizeFxCanvas();
        });

        syncPlayerCount();
        retargetStudentsToClass();
        renderClassChips();
        renderPlayerCards();
    }

    // =====================================================================
    //  Game setup
    // =====================================================================
    function startGame() {
        stopConfetti();
        winOverlay.classList.remove("show");
        fieldOverlay.classList.remove("show");
        menuScreen.classList.remove("active");
        gameScreen.classList.add("active");

        state = {
            size: setup.size,
            total: setup.size * setup.size,
            players: [],
            current: 0,
            snakes: [],
            ladders: [],
            chute: {},
            imageFields: {},
            cellEls: {},
            rolling: false,
            busy: false,
            gameOver: false,
            boardPx: tokenLayer.clientWidth || 1
        };

        for (var i = 0; i < playerCount; i++) {
            var cfg = setup.players[i];
            var name = (cfg && cfg.name) ? String(cfg.name).trim() : "";
            if (!name) name = "Player " + (i + 1);
            state.players.push({
                index: i,
                name: name,
                color: cfg.color,
                token: cfg.token,
                pos: 1,
                el: null
            });
        }

        buildBoard();
        generateChutes();
        placeImageFields();
        drawChutes();
        createTokens();
        updatePlayerList();
        setTurnIndicator(state.players[0]);
        setMessage(state.players[0].name + "'s turn — roll the dice!", "");
        rollBtn.disabled = false;
        rollBtn.classList.add("ready");

        requestAnimationFrame(function () {
            state.boardPx = tokenLayer.clientWidth || 1;
            relayoutTokens();
        });
    }

    function buildBoard() {
        var N = state.size;
        boardEl.style.gridTemplateColumns = "repeat(" + N + ", 1fr)";
        boardEl.style.gridTemplateRows = "repeat(" + N + ", 1fr)";
        boardEl.innerHTML = "";
        state.cellEls = {};

        for (var vRow = 0; vRow < N; vRow++) {
            var logicalRow = (N - 1) - vRow;
            var dirRight = (logicalRow % 2 === 0);
            var startNum = logicalRow * N + 1;
            for (var col = 0; col < N; col++) {
                var num = dirRight ? (startNum + col) : (startNum + (N - 1 - col));
                var cell = document.createElement("div");
                cell.className = "cell" + (((vRow + col) % 2 === 0) ? "" : " alt");
                cell.dataset.cell = num;
                cell.innerHTML = '<span class="cell-num">' + num + "</span>";
                if (num === 1) {
                    cell.classList.add("start");
                    cell.insertAdjacentHTML("beforeend", '<span class="cell-label">START</span>');
                }
                if (num === state.total) {
                    cell.classList.add("finish");
                    cell.insertAdjacentHTML("beforeend", '<span class="cell-label">FINISH</span>');
                }
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
                if (type === "ladder") state.ladders.push({ from: from, to: to });
                else state.snakes.push({ from: from, to: to });
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

        Object.keys(state.chute).forEach(function (cellStr) {
            var ch = state.chute[cellStr];
            var el = state.cellEls[+cellStr];
            if (!el) return;
            var tag = document.createElement("span");
            tag.className = "chute-tag " + ch.type;
            tag.textContent = ch.type === "ladder" ? "⬆" : "⬇";
            el.appendChild(tag);
        });
    }

    // =====================================================================
    //  Image fields
    // =====================================================================
    function placeImageFields() {
        var total = state.total;
        var N = state.size;
        state.imageFields = {};

        Object.keys(FIELD_IMAGES).forEach(function (key) {
            var cell = parseInt(key, 10);
            if (cell >= 1 && cell <= total) {
                state.imageFields[cell] = Object.assign({}, FIELD_IMAGES[key]);
            }
        });

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

        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
        }

        var chosen = [];
        if (candidates.length) {
            for (var k = 0; k < count; k++) {
                chosen.push(candidates[Math.floor(k * candidates.length / count)]);
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

        Object.keys(state.imageFields).forEach(function (cellStr) {
            var el = state.cellEls[+cellStr];
            if (!el) return;
            el.classList.add("image-field");
            var badge = document.createElement("span");
            badge.className = "field-badge";
            badge.textContent = state.imageFields[+cellStr].emoji || "✨";
            el.appendChild(badge);
        });
    }

    // =====================================================================
    //  Snakes & ladders (SVG)
    // =====================================================================
    var SNAKE_GRADS = ["url(#snakeGradA)", "url(#snakeGradB)", "url(#snakeGradC)"];

    function svgEl(name, attrs, parent) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", name);
        if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        if (parent) parent.appendChild(el);
        return el;
    }

    function drawChutes() {
        var N = state.size;
        svg.innerHTML = "";
        svg.setAttribute("viewBox", "0 0 100 100");

        var defs = svgEl("defs", null, svg);

        function grad(id, stops, x1, y1, x2, y2) {
            var g = svgEl("linearGradient", { id: id, gradientUnits: "userSpaceOnUse", x1: x1, y1: y1, x2: x2, y2: y2 }, defs);
            stops.forEach(function (s) {
                svgEl("stop", { offset: s[0], "stop-color": s[1] }, g);
            });
        }

        grad("ladderGrad", [[0, "#fcd34d"], [0.5, "#f59e0b"], [1, "#b45309"]], 0, 0, 100, 100);
        grad("snakeGradA", [[0, "#34d399"], [1, "#0f766e"]], 0, 0, 100, 100);
        grad("snakeGradB", [[0, "#a78bfa"], [1, "#be185d"]], 0, 100, 100, 0);
        grad("snakeGradC", [[0, "#fb923c"], [1, "#e11d48"]], 100, 0, 0, 100);

        state.ladders.forEach(function (l, i) {
            drawLadder(cellCenterPct(l.from, N), cellCenterPct(l.to, N), 100 / N);
        });
        state.snakes.forEach(function (s, i) {
            drawSnake(cellCenterPct(s.from, N), cellCenterPct(s.to, N), 100 / N, SNAKE_GRADS[i % SNAKE_GRADS.length]);
        });
    }

    function drawLadder(a, b, cellPct) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var off = cellPct * 0.21;

        var g = svgEl("g", { class: "ladder" }, svg);

        function rail(sign, cls, width, stroke) {
            return svgEl("line", {
                x1: (a.x + nx * off * sign).toFixed(2), y1: (a.y + ny * off * sign).toFixed(2),
                x2: (b.x + nx * off * sign).toFixed(2), y2: (b.y + ny * off * sign).toFixed(2),
                class: cls, "stroke-width": width, stroke: stroke
            }, g);
        }

        rail(1, "ladder-rail", (cellPct * 0.13).toFixed(2), "url(#ladderGrad)");
        rail(-1, "ladder-rail", (cellPct * 0.13).toFixed(2), "url(#ladderGrad)");

        var rungs = Math.max(3, Math.round(len / cellPct) + 1);
        for (var i = 1; i < rungs; i++) {
            var t = i / rungs;
            var cx = a.x + dx * t, cy = a.y + dy * t;
            svgEl("line", {
                x1: (cx + nx * off).toFixed(2), y1: (cy + ny * off).toFixed(2),
                x2: (cx - nx * off).toFixed(2), y2: (cy - ny * off).toFixed(2),
                class: "ladder-rung", "stroke-width": (cellPct * 0.1).toFixed(2), stroke: "#d97706"
            }, g);
        }

        rail(1, "ladder-flow", (cellPct * 0.05).toFixed(2), "rgba(255,255,255,.9)");
        rail(-1, "ladder-flow", (cellPct * 0.05).toFixed(2), "rgba(255,255,255,.9)");
    }

    function snakeWobble(a, b, cellPct) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var amp = cellPct * 0.26;
        var segs = Math.max(10, Math.round(len / (cellPct * 0.4)));
        var pts = [];
        for (var i = 0; i <= segs; i++) {
            var t = i / segs;
            var taper = Math.sin(t * Math.PI);
            var w = Math.sin(t * Math.PI * 3) * amp * taper;
            pts.push({ x: a.x + dx * t + nx * w, y: a.y + dy * t + ny * w });
        }
        return pts;
    }

    function pathD(pts) {
        var d = "";
        for (var i = 0; i < pts.length; i++) {
            d += (i === 0 ? "M" : "L") + pts[i].x.toFixed(2) + " " + pts[i].y.toFixed(2) + " ";
        }
        return d.trim();
    }

    function drawSnake(a, b, cellPct, grad) {
        var pts = snakeWobble(a, b, cellPct);
        var d = pathD(pts);

        var g = svgEl("g", { class: "snake" }, svg);

        svgEl("path", {
            d: d, class: "snake-shadow",
            "stroke-width": (cellPct * 0.2).toFixed(2),
            transform: "translate(" + (cellPct * 0.045).toFixed(2) + "," + (cellPct * 0.055).toFixed(2) + ")"
        }, g);

        svgEl("path", {
            d: d, class: "snake-body",
            stroke: grad,
            "stroke-width": (cellPct * 0.175).toFixed(2)
        }, g);

        svgEl("path", {
            d: d, class: "snake-pattern",
            "stroke-width": (cellPct * 0.055).toFixed(2)
        }, g);

        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.hypot(dx, dy) || 1;
        var dirx = dx / len, diry = dy / len;
        var perpx = -diry, perpy = dirx;
        var headR = cellPct * 0.19;

        svgEl("circle", { cx: a.x.toFixed(2), cy: a.y.toFixed(2), r: (headR * 1.08).toFixed(2), fill: grad, class: "snake-head" }, g);

        var eyeOff = headR * 0.42;
        var eyeSep = headR * 0.52;
        var eyeR = headR * 0.3;
        [-1, 1].forEach(function (sign) {
            var ex = a.x + dirx * eyeOff + perpx * eyeSep * sign;
            var ey = a.y + diry * eyeOff + perpy * eyeSep * sign;
            svgEl("circle", { cx: ex.toFixed(2), cy: ey.toFixed(2), r: eyeR.toFixed(2), class: "snake-eye-white" }, g);
            svgEl("circle", {
                cx: (ex + dirx * eyeR * 0.32).toFixed(2),
                cy: (ey + diry * eyeR * 0.32).toFixed(2),
                r: (eyeR * 0.5).toFixed(2), class: "snake-eye-core"
            }, g);
        });

        var tStart = headR * 0.95;
        var tEnd = headR * 1.85;
        var sx = a.x + dirx * tStart, sy = a.y + diry * tStart;
        var mx = a.x + dirx * (tStart + (tEnd - tStart) * 0.55);
        var my = a.y + diry * (tStart + (tEnd - tStart) * 0.55);
        var ex2 = a.x + dirx * tEnd, ey2 = a.y + diry * tEnd;
        var fork = headR * 0.42;
        svgEl("path", {
            d: "M" + sx.toFixed(2) + " " + sy.toFixed(2) + " L" + mx.toFixed(2) + " " + my.toFixed(2) +
                " M" + mx.toFixed(2) + " " + my.toFixed(2) + " L" + (ex2 + perpx * fork).toFixed(2) + " " + (ey2 + perpy * fork).toFixed(2) +
                " M" + mx.toFixed(2) + " " + my.toFixed(2) + " L" + (ex2 - perpx * fork).toFixed(2) + " " + (ey2 - perpy * fork).toFixed(2),
            class: "snake-tongue", stroke: "#ef4444", "stroke-width": (cellPct * 0.055).toFixed(2)
        }, g);
    }

    // =====================================================================
    //  Tokens
    // =====================================================================
    function createTokens() {
        tokenLayer.innerHTML = "";
        state.players.forEach(function (p) {
            var t = document.createElement("div");
            t.className = "token";
            var inner = document.createElement("div");
            inner.className = "token-inner";
            inner.style.setProperty("--tc", p.color);
            inner.textContent = p.token;
            t.appendChild(inner);
            tokenLayer.appendChild(t);
            p.el = t;
            positionToken(p, false);
        });
        updateCurrentTokenClass();
    }

    function updateCurrentTokenClass() {
        state.players.forEach(function (p, i) {
            if (!p.el) return;
            p.el.classList.toggle("current", i === state.current && !state.gameOver);
        });
    }

    function positionToken(p, animate) {
        if (!p.el) return;
        if (!state.boardPx) state.boardPx = tokenLayer.clientWidth || 1;
        var N = state.size;
        var cellPx = state.boardPx / N;
        var v = cellVisual(p.pos, N);
        var offsets = [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]];
        var o = offsets[p.index] || [0, 0];
        var x = (v.col + 0.5) * cellPx + o[0] * cellPx;
        var y = (v.row + 0.5) * cellPx + o[1] * cellPx;
        var size = cellPx * 0.62;
        p.el.style.transition = animate
            ? "left " + STEP_MS + "ms cubic-bezier(.34,1.3,.5,1), top " + STEP_MS + "ms cubic-bezier(.34,1.3,.5,1)"
            : "none";
        p.el.style.left = x + "px";
        p.el.style.top = y + "px";
        p.el.style.width = size + "px";
        p.el.style.height = size + "px";
        p.el.style.fontSize = (size * 0.52) + "px";
        if (animate && !prefersReducedMotion()) {
            p.el.classList.remove("hopping");
            void p.el.offsetWidth;
            p.el.classList.add("hopping");
        }
    }

    function relayoutTokens() {
        state.players.forEach(function (p) { positionToken(p, false); });
    }

    function animateAlongPath(p, pts, ms, cls) {
        return new Promise(function (resolve) {
            if (p.el) {
                p.el.classList.remove("hopping");
                p.el.classList.add(cls);
            }
            if (prefersReducedMotion() || pts.length < 2) {
                if (p.el) p.el.classList.remove(cls);
                resolve();
                return;
            }
            var start = null;
            function frame(ts) {
                if (start === null) start = ts;
                var t = Math.min(1, (ts - start) / ms);
                var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                var idx = e * (pts.length - 1);
                var i0 = Math.floor(idx);
                var i1 = Math.min(pts.length - 1, i0 + 1);
                var f = idx - i0;
                var x = pts[i0].x + (pts[i1].x - pts[i0].x) * f;
                var y = pts[i0].y + (pts[i1].y - pts[i0].y) * f;
                if (p.el) {
                    p.el.style.transition = "none";
                    p.el.style.left = x + "px";
                    p.el.style.top = y + "px";
                }
                if (t < 1) requestAnimationFrame(frame);
                else {
                    if (p.el) p.el.classList.remove(cls);
                    resolve();
                }
            }
            requestAnimationFrame(frame);
        });
    }

    function tokenOffsetPx(p, N, boardPx) {
        var offsets = [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]];
        var o = offsets[p.index] || [0, 0];
        var cellPx = boardPx / N;
        return { x: o[0] * cellPx, y: o[1] * cellPx };
    }

    function chutePointsPx(ch, N, boardPx, p) {
        var a = cellCenterPx(ch.from, N, boardPx);
        var b = cellCenterPx(ch.to, N, boardPx);
        var off = tokenOffsetPx(p, N, boardPx);
        var pts = [];
        if (ch.type === "ladder") {
            var steps = 16;
            for (var i = 0; i <= steps; i++) {
                var t = i / steps;
                pts.push({ x: a.x + (b.x - a.x) * t + off.x, y: a.y + (b.y - a.y) * t + off.y });
            }
            return pts;
        }
        var cellPct = 100 / N;
        var scale = boardPx / 100;
        return snakeWobble(
            { x: a.x / scale, y: a.y / scale },
            { x: b.x / scale, y: b.y / scale },
            cellPct
        ).map(function (pt) { return { x: pt.x * scale + off.x, y: pt.y * scale + off.y }; });
    }

    // =====================================================================
    //  Dice
    // =====================================================================
    function buildDicePips() {
        diceEl.innerHTML = "";
        for (var i = 0; i < 9; i++) {
            var pip = document.createElement("div");
            pip.className = "pip";
            diceEl.appendChild(pip);
        }
    }

    function setDiceFace(n, landed) {
        var on = PIPS[n] || [];
        var pips = diceEl.children;
        for (var i = 0; i < 9; i++) {
            if (on.indexOf(i) !== -1) pips[i].classList.add("on");
            else pips[i].classList.remove("on");
        }
        if (landed) {
            diceEl.classList.remove("landed");
            void diceEl.offsetWidth;
            diceEl.classList.add("landed");
        }
    }

    function rollDice() {
        if (!state || state.rolling || state.busy || state.gameOver) return;
        state.rolling = true;
        rollBtn.disabled = true;
        rollBtn.classList.remove("ready");
        diceEl.classList.add("rolling");
        diceStage.classList.add("is-rolling");
        playRollNoise();

        var ticks = 0;
        var iv = setInterval(function () {
            setDiceFace(1 + Math.floor(Math.random() * 6), false);
            playTone(190 + ticks * 12, 0.025, 0.05);
            ticks++;
            if (ticks >= DICE_TICKS) {
                clearInterval(iv);
                var result = 1 + Math.floor(Math.random() * 6);
                diceEl.classList.remove("rolling");
                diceStage.classList.remove("is-rolling");
                setDiceFace(result, true);
                state.rolling = false;
                playTone(320 + result * 40, 0.12, 0.12);
                onDiceResult(result);
            }
        }, DICE_TICK_MS);
    }

    // =====================================================================
    //  Turn resolution
    // =====================================================================
    async function onDiceResult(steps) {
        var p = state.players[state.current];
        state.busy = true;
        setMessage(p.name + " rolled a " + steps + "!", "");

        var path = [];
        var cur = p.pos;
        var remaining = steps;
        while (remaining > 0) {
            if (cur + 1 <= state.total) {
                cur++; path.push(cur); remaining--;
            } else {
                while (remaining > 0) { cur--; path.push(cur); remaining--; }
            }
        }

        for (var i = 0; i < path.length; i++) {
            p.pos = path[i];
            positionToken(p, true);
            playTone(430 + i * 32, 0.035, 0.07);
            flashCell(p.pos, p);
            await wait(STEP_MS);
        }
        updatePlayerList();

        if (p.pos === state.total) {
            await wait(240);
            state.busy = false;
            return winGame(p);
        }

        var ch = state.chute[p.pos];
        if (ch) {
            await wait(160);
            if (ch.type === "ladder") {
                setMessage(p.name + " climbed a ladder! 🪜", "good");
                playTone(523, 0.11, 0.12); setTimeout(function () { playTone(784, 0.11, 0.12); }, 110);
            } else {
                setMessage(p.name + " slid down a snake! 🐍", "bad");
                playTone(330, 0.11, 0.12); setTimeout(function () { playTone(165, 0.15, 0.12); }, 110);
            }
            var pts = chutePointsPx(ch, state.size, state.boardPx, p);
            p.pos = ch.to;
            await animateAlongPath(p, pts, SLIDE_MS, ch.type === "ladder" ? "climbing" : "sliding");
            positionToken(p, false);
            flashCell(p.pos, p);
            updatePlayerList();
        }

        if (state.imageFields[p.pos]) {
            await showFieldImage(p.pos);
        }

        state.busy = false;

        if (steps === 6 && !state.gameOver) {
            setMessage(p.name + " rolled a 6 — roll again! 🎉", "good");
            rollBtn.disabled = false;
            rollBtn.classList.add("ready");
        } else if (!state.gameOver) {
            nextTurn();
        }
    }

    function flashCell(num, p) {
        if (prefersReducedMotion()) return;
        var el = state.cellEls[num];
        if (el) {
            el.classList.remove("flash");
            void el.offsetWidth;
            el.classList.add("flash");
            setTimeout(function () { el.classList.remove("flash"); }, 750);
        }
        var cellPx = state.boardPx / state.size;
        var c = cellCenterPx(num, state.size, state.boardPx);
        var ring = document.createElement("div");
        ring.className = "land-ring";
        ring.style.left = c.x + "px";
        ring.style.top = c.y + "px";
        ring.style.width = (cellPx * 0.92) + "px";
        ring.style.height = (cellPx * 0.92) + "px";
        if (p && p.color) ring.style.borderColor = hexA(p.color, 0.9);
        tokenLayer.appendChild(ring);
        requestAnimationFrame(function () { ring.classList.add("go"); });
        setTimeout(function () {
            if (ring.parentNode) ring.parentNode.removeChild(ring);
        }, 850);
    }

    function nextTurn() {
        state.current = (state.current + 1) % state.players.length;
        var p = state.players[state.current];
        updatePlayerList();
        updateCurrentTokenClass();
        setTurnIndicator(p);
        setMessage(p.name + "'s turn — roll the dice!", "");
        rollBtn.disabled = false;
        rollBtn.classList.add("ready");
    }

    // =====================================================================
    //  Image field overlay
    // =====================================================================
    function showFieldImage(cell) {
        return new Promise(function (resolve) {
            var data = state.imageFields[cell];
            var hasImg = data.src && data.src.length > 0;

            fieldContent.innerHTML = "";

            var chip = document.createElement("div");
            chip.className = "field-cell";
            chip.textContent = "✨ Cell " + cell;

            var media = document.createElement("div");
            media.className = "field-media";

            function makePlaceholder() {
                var ph = document.createElement("div");
                ph.className = "field-placeholder";
                ph.style.background = "linear-gradient(150deg, " + (data.color || "#feca57") + ", rgba(0,0,0,.18))";
                var emoji = document.createElement("span");
                emoji.className = "ph-emoji";
                emoji.textContent = data.emoji || "✨";
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

            var title = document.createElement("h3");
            title.className = "field-title";
            title.textContent = data.title || "Surprise!";

            var caption = document.createElement("p");
            caption.className = "field-caption";
            caption.textContent = data.caption || "";

            var closeBtn = document.createElement("button");
            closeBtn.className = "btn primary";
            closeBtn.id = "field-close-btn";
            closeBtn.textContent = "Continue ▶";

            fieldContent.appendChild(chip);
            fieldContent.appendChild(media);
            fieldContent.appendChild(title);
            fieldContent.appendChild(caption);
            fieldContent.appendChild(closeBtn);

            fieldOverlay.classList.add("show");
            playTone(660, 0.09, 0.1); setTimeout(function () { playTone(880, 0.09, 0.1); }, 100);

            closeBtn.addEventListener("click", function handler() {
                closeBtn.removeEventListener("click", handler);
                fieldOverlay.classList.remove("show");
                resolve();
            });
            setTimeout(function () { closeBtn.focus(); }, 60);
        });
    }

    function closeFieldImage() {
        var closeBtn = document.getElementById("field-close-btn");
        if (closeBtn) closeBtn.click();
    }

    // =====================================================================
    //  Win + confetti
    // =====================================================================
    function winGame(p) {
        state.gameOver = true;
        rollBtn.disabled = true;
        rollBtn.classList.remove("ready");
        updateCurrentTokenClass();
        if (p.el) {
            p.el.classList.remove("current");
            p.el.classList.add("winner");
        }
        setMessage(p.name + " wins! 🎉", "good");

        document.getElementById("win-token").textContent = p.token;
        document.getElementById("win-title").textContent = p.name + " Wins!";

        renderStandings(p);
        winOverlay.classList.add("show");

        playTone(523, 0.15, 0.16);
        setTimeout(function () { playTone(659, 0.15, 0.16); }, 130);
        setTimeout(function () { playTone(784, 0.2, 0.16); }, 260);
        setTimeout(function () { playTone(1047, 0.28, 0.18); }, 400);
        setTimeout(launchConfetti, 120);
    }

    function renderStandings(winner) {
        var box = document.getElementById("win-standings");
        box.innerHTML = "";
        var ranked = state.players.slice().sort(function (a, b) {
            return (b.pos - a.pos) || (a.index - b.index);
        });
        ranked.forEach(function (p, i) {
            var row = document.createElement("div");
            row.className = "standing-row" + (p === winner ? " first" : "");
            row.style.setProperty("--pc", p.color);

            var medal = document.createElement("div");
            medal.className = "st-medal";
            medal.textContent = MEDALS[i] || "🏅";

            var token = document.createElement("div");
            token.className = "st-token";
            token.style.setProperty("--pc", p.color);
            token.textContent = p.token;

            var name = document.createElement("div");
            name.className = "st-name";
            name.textContent = p.name;

            var pos = document.createElement("div");
            pos.className = "st-pos";
            pos.textContent = p.pos + "/" + state.total;

            row.appendChild(medal);
            row.appendChild(token);
            row.appendChild(name);
            row.appendChild(pos);
            box.appendChild(row);
        });
    }

    function sizeFxCanvas() {
        var canvas = document.getElementById("fx-canvas");
        if (!canvas) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
    }

    function launchConfetti() {
        var canvas = document.getElementById("fx-canvas");
        if (!canvas || prefersReducedMotion()) return;
        sizeFxCanvas();
        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        stopConfetti();

        var colors = ["#fbbf24", "#f43f5e", "#10b981", "#4f7cff", "#a78bfa", "#22d3ee", "#fb923c", "#e879f9"];
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = window.innerWidth, h = window.innerHeight;
        var parts = [];
        var count = 170;

        for (var i = 0; i < count; i++) {
            parts.push({
                x: Math.random() * w,
                y: -20 - Math.random() * h * 0.55,
                w: (5 + Math.random() * 8) * dpr * 0.7,
                h: (8 + Math.random() * 11) * dpr * 0.7,
                vx: (Math.random() - 0.5) * 2.2,
                vy: 1.6 + Math.random() * 2.6,
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.16,
                color: colors[i % colors.length],
                tilt: Math.random() * Math.PI,
                vt: (Math.random() - 0.5) * 0.12
            });
        }

        var running = true;
        var startedAt = performance.now();

        function frame(now) {
            if (!running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(dpr, dpr);
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                p.x += p.vx + Math.sin(p.tilt) * 0.7;
                p.y += p.vy;
                p.rot += p.vr;
                p.tilt += p.vt;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
            ctx.restore();
            if (now - startedAt < 6200) requestAnimationFrame(frame);
            else {
                running = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                confettiStop = null;
            }
        }

        confettiStop = function () { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); confettiStop = null; };
        requestAnimationFrame(frame);
    }

    function stopConfetti() {
        if (confettiStop) confettiStop();
    }

    // =====================================================================
    //  UI helpers
    // =====================================================================
    function setMessage(msg, kind) {
        var inner = messageEl.querySelector(".msg-inner");
        if (!inner) {
            inner = document.createElement("span");
            inner.className = "msg-inner";
            messageEl.appendChild(inner);
        }
        inner.textContent = msg;
        inner.classList.remove("pop", "good", "bad");
        if (kind) inner.classList.add(kind);
        void inner.offsetWidth;
        inner.classList.add("pop");
    }

    function setTurnIndicator(p) {
        turnTokenEl.textContent = p.token;
        turnTokenEl.style.color = p.color;
        turnAvatarEl.style.boxShadow = "0 10px 22px " + hexA(p.color, 0.35) + ", 0 0 0 3px " + hexA(p.color, 0.35);
        turnNameEl.textContent = p.name;
        turnNameEl.style.color = p.color;
        turnTokenEl.classList.remove("bounce");
        void turnTokenEl.offsetWidth;
        turnTokenEl.classList.add("bounce");
    }

    function hexA(hex, a) {
        var h = hex.replace("#", "");
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var r = parseInt(h.slice(0, 2), 16);
        var g = parseInt(h.slice(2, 4), 16);
        var b = parseInt(h.slice(4, 6), 16);
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    function updatePlayerList() {
        playerListEl.innerHTML = "";
        state.players.forEach(function (p, idx) {
            var chip = document.createElement("div");
            chip.className = "player-chip" + (idx === state.current && !state.gameOver ? " current" : "");
            chip.style.setProperty("--pc", p.color);

            var token = document.createElement("div");
            token.className = "pc-token";
            token.style.setProperty("--pc", p.color);
            token.textContent = p.token;

            var info = document.createElement("div");
            info.className = "pc-info";
            var name = document.createElement("span");
            name.className = "pc-name";
            name.textContent = ORDER_LABELS[idx] + " · " + p.name;
            var bar = document.createElement("div");
            bar.className = "pc-bar";
            var fill = document.createElement("div");
            fill.className = "pc-bar-fill";
            fill.style.setProperty("--pc", p.color);
            fill.style.width = Math.round((p.pos / state.total) * 100) + "%";
            bar.appendChild(fill);
            info.appendChild(name);
            info.appendChild(bar);

            var pos = document.createElement("div");
            pos.className = "pc-pos";
            pos.textContent = p.pos + "/" + state.total;

            chip.appendChild(token);
            chip.appendChild(info);
            chip.appendChild(pos);
            playerListEl.appendChild(chip);
        });
    }

    // =====================================================================
    //  Audio
    // =====================================================================
    function ensureAudio() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === "suspended") audioCtx.resume();
            return audioCtx;
        } catch (e) { return null; }
    }

    function playTone(freq, dur, vol) {
        try {
            var ctx = ensureAudio();
            if (!ctx) return;
            var o = ctx.createOscillator();
            var g = ctx.createGain();
            o.type = "triangle";
            o.frequency.value = freq;
            g.gain.value = vol != null ? vol : 0.08;
            o.connect(g); g.connect(ctx.destination);
            var t = ctx.currentTime;
            o.start(t);
            g.gain.setValueAtTime(vol != null ? vol : 0.08, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.stop(t + dur + 0.02);
        } catch (e) { /* no audio */ }
    }

    function playRollNoise() {
        try {
            var ctx = ensureAudio();
            if (!ctx) return;
            var dur = 0.32;
            var bufferSize = Math.floor(ctx.sampleRate * dur);
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
            }
            var src = ctx.createBufferSource();
            src.buffer = buffer;
            var filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 1500;
            var g = ctx.createGain();
            g.gain.value = 0.12;
            src.connect(filter); filter.connect(g); g.connect(ctx.destination);
            src.start();
        } catch (e) { /* no audio */ }
    }

    // =====================================================================
    //  Public API
    // =====================================================================
    function returnToMenu() {
        stopConfetti();
        winOverlay.classList.remove("show");
        fieldOverlay.classList.remove("show");
        gameScreen.classList.remove("active");
        menuScreen.classList.add("active");
        state = null;
        renderPlayerCards();
    }

    function restart() {
        stopConfetti();
        winOverlay.classList.remove("show");
        fieldOverlay.classList.remove("show");
        if (state && gameScreen.classList.contains("active")) {
            startGame();
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

    // =====================================================================
    //  Boot
    // =====================================================================
    buildDicePips();
    setDiceFace(6, false);
    sizeFxCanvas();
    initMenu();

    window.SnakesGame = {
        returnToMenu: returnToMenu,
        restart: restart,
        toggleFullscreen: toggleFullscreen
    };
})();
