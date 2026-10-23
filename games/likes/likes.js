(function () {
    "use strict";

    var LIKE = "😄";
    var DISLIKE = "😞";

    var ANIMALS = [
        { emoji: "🐶", name: "dog" },
        { emoji: "🐱", name: "cat" },
        { emoji: "🐭", name: "mouse" },
        { emoji: "🐰", name: "rabbit" },
        { emoji: "🦊", name: "fox" },
        { emoji: "🐻", name: "bear" },
        { emoji: "🐼", name: "panda" },
        { emoji: "🐨", name: "koala" },
        { emoji: "🐯", name: "tiger" },
        { emoji: "🦁", name: "lion" },
        { emoji: "🐮", name: "cow" },
        { emoji: "🐷", name: "pig" },
        { emoji: "🐵", name: "monkey" },
        { emoji: "🐔", name: "chicken" },
        { emoji: "🦆", name: "duck" },
        { emoji: "🐧", name: "penguin" },
        { emoji: "🦉", name: "owl" },
        { emoji: "🦜", name: "parrot" },
        { emoji: "🦅", name: "eagle" },
        { emoji: "🦢", name: "swan" },
        { emoji: "🦩", name: "flamingo" },
        { emoji: "🦚", name: "peacock" },
        { emoji: "🐢", name: "turtle" },
        { emoji: "🐍", name: "snake" },
        { emoji: "🐊", name: "crocodile" },
        { emoji: "🦎", name: "lizard" },
        { emoji: "🐸", name: "frog" },
        { emoji: "🐘", name: "elephant" },
        { emoji: "🦛", name: "hippo" },
        { emoji: "🦒", name: "giraffe" },
        { emoji: "🦓", name: "zebra" },
        { emoji: "🐴", name: "horse" },
        { emoji: "🐑", name: "sheep" },
        { emoji: "🐐", name: "goat" },
        { emoji: "🐫", name: "camel" },
        { emoji: "🦘", name: "kangaroo" },
        { emoji: "🐺", name: "wolf" },
        { emoji: "🦌", name: "deer" },
        { emoji: "🦝", name: "raccoon" },
        { emoji: "🦔", name: "hedgehog" },
        { emoji: "🐿️", name: "squirrel" },
        { emoji: "🦇", name: "bat" },
        { emoji: "🐝", name: "bee" },
        { emoji: "🦋", name: "butterfly" },
        { emoji: "🐞", name: "ladybug" },
        { emoji: "🐜", name: "ant" },
        { emoji: "🕷️", name: "spider" },
        { emoji: "🐌", name: "snail" },
        { emoji: "🐙", name: "octopus" },
        { emoji: "🦑", name: "squid" },
        { emoji: "🦀", name: "crab" },
        { emoji: "🐳", name: "whale" },
        { emoji: "🐬", name: "dolphin" },
        { emoji: "🦈", name: "shark" },
        { emoji: "🐟", name: "fish" },
        { emoji: "🐠", name: "tropical fish" },
        { emoji: "🦭", name: "seal" }
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
        animalCount: 4,
        animals: [],
        faces: []
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

    function randomFaces(rows, cols) {
        var faces = [];
        for (var r = 0; r < rows; r++) {
            var row = [];
            for (var c = 0; c < cols; c++) row.push(Math.random() < 0.5);
            if (cols >= 2 && row.every(function (v) { return v === row[0]; })) {
                row[randInt(cols)] = !row[0];
            }
            faces.push(row);
        }
        if (rows > 1 && cols >= 2) {
            var identical = true;
            for (var k = 1; k < rows; k++) {
                if (faces[k].join("") !== faces[0].join("")) { identical = false; break; }
            }
            if (identical) {
                var target = faces[randInt(rows)];
                var other = -1;
                for (var i = 1; i < cols; i++) {
                    if (target[i] !== target[0]) { other = i; break; }
                }
                if (other > 0) {
                    var tmp = target[0];
                    target[0] = target[other];
                    target[other] = tmp;
                }
            }
        }
        return faces;
    }

    function showScreen(name) {
        var toGame = name === "game";
        setupScreenEl.classList.toggle("active", !toGame);
        gameScreenEl.classList.toggle("active", toGame);
    }

    function randomize() {
        var list = studentsInClass(state.classId);
        if (!list.length) return;
        state.animals = sample(ANIMALS, Math.min(state.animalCount, ANIMALS.length));
        state.faces = randomFaces(list.length, state.animals.length);
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
                randomize();
                showScreen("game");
            });
            classGridEl.appendChild(card);
        });
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
        table.className = "likes-table";

        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");

        var corner = document.createElement("th");
        corner.className = "corner";
        corner.textContent = "😃";
        headRow.appendChild(corner);

        state.animals.forEach(function (animal, i) {
            var th = document.createElement("th");
            th.className = "animal";
            th.style.animationDelay = (i * 55) + "ms";

            var emoji = document.createElement("div");
            emoji.className = "animal-emoji";
            emoji.textContent = animal.emoji;

            var name = document.createElement("div");
            name.className = "animal-name";
            name.textContent = animal.name;

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

            state.animals.forEach(function (animal, c) {
                var td = document.createElement("td");
                td.style.animationDelay = ((r * 40) + (c * 45)) + "ms";

                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "face-btn";
                btn.textContent = state.faces[r][c] ? LIKE : DISLIKE;
                btn.setAttribute("aria-label",
                    firstName(student.username) + (state.faces[r][c] ? " likes " : " does not like ") + animal.name);

                btn.addEventListener("click", function () {
                    state.faces[r][c] = !state.faces[r][c];
                    btn.textContent = state.faces[r][c] ? LIKE : DISLIKE;
                    btn.classList.remove("pop");
                    void btn.offsetWidth;
                    btn.classList.add("pop");
                });

                td.appendChild(btn);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrapEl.appendChild(table);
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

        countChipsEl.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".chip");
            if (!btn) return;
            var count = parseInt(btn.getAttribute("data-count"), 10);
            if (!count || count === state.animalCount) return;
            state.animalCount = count;
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
