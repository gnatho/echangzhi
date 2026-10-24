(function () {
    "use strict";

    var ACTIVITIES = [
        { emoji: "⏰", name: "get up" },
        { emoji: "👕", name: "get dressed" },
        { emoji: "🪥", name: "brush your teeth" },
        { emoji: "🥣", name: "have breakfast" },
        { emoji: "🏫", name: "go to school" },
        { emoji: "🥪", name: "have lunch" },
        { emoji: "🪁", name: "play in the park" },
        { emoji: "🍽️", name: "have dinner" },
        { emoji: "🛏️", name: "go to bed" },
        { emoji: "📚", name: "do homework" },
        { emoji: "📺", name: "watch TV" },
        { emoji: "🎮", name: "play video games" },
        { emoji: "📖", name: "read a book" },
        { emoji: "🚿", name: "take a shower" },
        { emoji: "🍎", name: "have a snack" },
        { emoji: "🥛", name: "drink milk" },
        { emoji: "🚲", name: "ride a bike" },
        { emoji: "⚽", name: "play soccer" },
        { emoji: "🎵", name: "listen to music" },
        { emoji: "🧹", name: "clean your room" },
        { emoji: "🎨", name: "draw a picture" },
        { emoji: "🐕", name: "walk the dog" },
        { emoji: "🍳", name: "cook" },
        { emoji: "🛁", name: "have a bath" },
        { emoji: "🌳", name: "go to the park" },
        { emoji: "🧼", name: "wash your hands" },
        { emoji: "🧸", name: "play with toys" },
        { emoji: "🗣️", name: "talk to friends" }
    ];

    var CLASSES = [];
    var STUDENTS = [];
    try {
        if (typeof classes !== "undefined" && Array.isArray(classes)) CLASSES = classes.slice();
        if (typeof students !== "undefined" && Array.isArray(students)) STUDENTS = students.slice();
    } catch (e) { /* data file missing - fall back below */ }

    if (!CLASSES.length) CLASSES = ["My Class"];
    if (!STUDENTS.length) {
        STUDENTS = [
            { id: -1, username: "Ryan", loginName: "", classId: 0 },
            { id: -2, username: "Becky", loginName: "", classId: 0 }
        ];
    }

    var setupScreenEl = document.getElementById("setup-screen");
    var gameScreenEl = document.getElementById("game-screen");
    var classGridEl = document.getElementById("class-grid");
    var countChipsEl = document.getElementById("count-chips");
    var randomizeBtn = document.getElementById("randomize-btn");
    var tableWrapEl = document.getElementById("table-wrap");
    var menuBtn = document.getElementById("menu-btn");

    var state = {
        classId: null,
        activityCount: 4,
        activities: [],
        times: []
    };

    function firstName(username) {
        return String(username == null ? "" : username).trim().replace(/\s+\S.*$/, "");
    }

    function studentsInClass(classId) {
        return STUDENTS.filter(function (s) { return s.classId === classId; });
    }

    function randInt(n) {
        return Math.floor(Math.random() * n);
    }

    function shuffle(list) {
        var copy = list.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = randInt(i + 1);
            var tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    function sample(list, n) {
        return shuffle(list).slice(0, n);
    }

    function randomHour() {
        return 1 + randInt(12);
    }

    function randomTimes(rows, cols) {
        var times = [];
        for (var r = 0; r < rows; r++) {
            var row = [];
            for (var c = 0; c < cols; c++) row.push(randomHour());
            if (cols >= 2) {
                var same = true;
                for (var i = 1; i < cols; i++) {
                    if (row[i] !== row[0]) { same = false; break; }
                }
                if (same) {
                    var j = randInt(cols);
                    row[j] = ((row[j] - 1 + 1 + randInt(11)) % 12) + 1;
                }
            }
            times.push(row);
        }
        return times;
    }

    function showScreen(name) {
        var toGame = name === "game";
        setupScreenEl.classList.toggle("active", !toGame);
        gameScreenEl.classList.toggle("active", toGame);
        if (toGame) {
            requestAnimationFrame(fitTable);
        }
    }

    function randomize() {
        var list = studentsInClass(state.classId);
        if (!list.length) return;
        state.activities = sample(ACTIVITIES, Math.min(state.activityCount, ACTIVITIES.length));
        state.times = randomTimes(list.length, state.activities.length);
        renderTable();
    }

    function renderClassGrid() {
        classGridEl.innerHTML = "";
        CLASSES.forEach(function (name, idx) {
            var card = document.createElement("button");
            card.type = "button";
            card.className = "class-card";

            var label = document.createElement("div");
            label.className = "cc-name";
            label.textContent = name;

            var count = document.createElement("div");
            count.className = "cc-count";
            var n = studentsInClass(idx).length;
            count.textContent = n + (n === 1 ? " student" : " students");

            card.appendChild(label);
            card.appendChild(count);
            card.addEventListener("click", function () {
                state.classId = idx;
                showScreen("game");
                randomize();
            });
            classGridEl.appendChild(card);
        });
    }

    function buildClock(hour) {
        var clock = document.createElement("div");
        clock.className = "clock";

        var label = document.createElement("div");
        label.className = "sr-only";
        label.textContent = hour + " o'clock";
        clock.appendChild(label);

        for (var n = 1; n <= 12; n++) {
            var num = document.createElement("div");
            num.className = "clock-num";
            num.textContent = String(n);
            var ang = (n * 30 - 90) * Math.PI / 180;
            num.style.left = (50 + 37.5 * Math.cos(ang)) + "%";
            num.style.top = (50 + 37.5 * Math.sin(ang)) + "%";
            clock.appendChild(num);
        }

        var minHand = document.createElement("div");
        minHand.className = "hand hand-min";
        clock.appendChild(minHand);

        var hourHand = document.createElement("div");
        hourHand.className = "hand hand-hour";
        hourHand.style.transform = "translateX(-50%) rotate(" + (hour * 30) + "deg)";
        clock.appendChild(hourHand);

        var hub = document.createElement("div");
        hub.className = "hub";
        clock.appendChild(hub);

        return clock;
    }

    function renderTable() {
        var list = studentsInClass(state.classId);
        tableWrapEl.innerHTML = "";

        if (!list.length) {
            var msg = document.createElement("div");
            msg.className = "empty-text";
            msg.textContent = "No students in this class";
            tableWrapEl.appendChild(msg);
            return;
        }

        var table = document.createElement("table");
        table.className = "routines-table";

        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");

        var corner = document.createElement("th");
        corner.className = "corner";
        corner.textContent = "🕐";
        headRow.appendChild(corner);

        state.activities.forEach(function (act, i) {
            var th = document.createElement("th");
            th.className = "act";
            th.style.animationDelay = (i * 55) + "ms";

            var emoji = document.createElement("div");
            emoji.className = "act-emoji";
            emoji.textContent = act.emoji;

            var name = document.createElement("div");
            name.className = "act-name";
            name.textContent = act.name;

            th.appendChild(emoji);
            th.appendChild(name);
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        var tbody = document.createElement("tbody");
        list.forEach(function (student, r) {
            var tr = document.createElement("tr");

            var nameCell = document.createElement("th");
            nameCell.className = "student";
            nameCell.textContent = firstName(student.username);
            nameCell.title = student.username;
            nameCell.style.animationDelay = (r * 55) + "ms";
            tr.appendChild(nameCell);

            state.activities.forEach(function (act, c) {
                var td = document.createElement("td");
                td.style.animationDelay = ((r * 40) + (c * 45)) + "ms";

                var cell = document.createElement("button");
                cell.type = "button";
                cell.className = "cell-btn";
                cell.setAttribute("aria-label",
                    firstName(student.username) + " " + act.name + " at " + state.times[r][c] + " o'clock");
                cell.appendChild(buildClock(state.times[r][c]));

                cell.addEventListener("click", function () {
                    state.times[r][c] = (state.times[r][c] % 12) + 1;
                    cell.innerHTML = "";
                    cell.appendChild(buildClock(state.times[r][c]));
                    cell.setAttribute("aria-label",
                        firstName(student.username) + " " + act.name + " at " + state.times[r][c] + " o'clock");
                    cell.classList.remove("pop");
                    void cell.offsetWidth;
                    cell.classList.add("pop");
                });

                td.appendChild(cell);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrapEl.appendChild(table);
        fitTable();
    }

    function fitTable() {
        var table = tableWrapEl.querySelector(".routines-table");
        if (!table) return;
        var rows = studentsInClass(state.classId).length;
        var cols = state.activities.length;
        if (!rows || !cols) return;

        var wrapW = tableWrapEl.clientWidth;
        var wrapH = tableWrapEl.clientHeight;
        if (!wrapW || !wrapH) return;

        var spacing = parseFloat(window.getComputedStyle(table).borderSpacing);
        if (!isFinite(spacing)) spacing = 8;

        var nameW = Math.min(Math.max(88, wrapW * 0.15), 240);
        var availW = wrapW - nameW - spacing * (cols + 1);
        var cellW = availW / cols;

        var corner = table.querySelector("th.corner");
        var actThs = table.querySelectorAll("th.act");
        var tds = table.querySelectorAll("td");
        var emojis = table.querySelectorAll(".act-emoji");
        var names = table.querySelectorAll(".act-name");
        var headRow = table.querySelector("thead tr");

        function apply(cell) {
            var used = cols * cell + spacing * (cols + 1);
            if (corner) corner.style.width = nameW + "px";
            for (var i = 0; i < actThs.length; i++) actThs[i].style.width = cell + "px";
            for (var j = 0; j < tds.length; j++) tds[j].style.height = cell + "px";
            table.style.width = (nameW + used) + "px";
            var emojiPx = Math.max(28, Math.min(cell * 0.42, 110));
            var namePx = Math.max(11, Math.min(cell * 0.135, 30));
            for (var e = 0; e < emojis.length; e++) emojis[e].style.fontSize = emojiPx + "px";
            for (var n = 0; n < names.length; n++) names[n].style.fontSize = namePx + "px";
        }

        function fitCell() {
            var headerH = headRow.getBoundingClientRect().height;
            var availH = wrapH - headerH - spacing * (rows + 1);
            return Math.max(40, Math.min(cellW, availH / rows));
        }

        apply(cellW);
        var cell = fitCell();
        apply(cell);
        var cell2 = fitCell();
        if (Math.abs(cell2 - cell) > 1) apply(cell2);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function () {});
        } else {
            document.exitFullscreen();
        }
    }

    function init() {
        renderClassGrid();

        var resizeTimer = null;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(fitTable, 120);
        });

        countChipsEl.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".chip");
            if (!btn) return;
            var count = parseInt(btn.getAttribute("data-count"), 10);
            if (!count || count === state.activityCount) return;
            state.activityCount = count;
            Array.prototype.forEach.call(countChipsEl.querySelectorAll(".chip"), function (chip) {
                chip.classList.toggle("selected", chip === btn);
            });
        });

        randomizeBtn.addEventListener("click", randomize);

        menuBtn.addEventListener("click", function () {
            showScreen("setup");
        });

        document.getElementById("fs-btn-setup").addEventListener("click", toggleFullscreen);
        document.getElementById("fs-btn-game").addEventListener("click", toggleFullscreen);
    }

    init();
})();
