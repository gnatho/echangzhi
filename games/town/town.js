(function () {
    "use strict";

    var PLACES = [
        { id: "train-station", name: "train station", emoji: "🚉" },
        { id: "hospital", name: "hospital", emoji: "🏥" },
        { id: "movie-theater", name: "movie theater", emoji: "🎬" },
        { id: "playground", name: "playground", emoji: "🎠" },
        { id: "cafe", name: "café", emoji: "☕" },
        { id: "store", name: "store", emoji: "🏪" },
        { id: "bus-stop", name: "bus stop", emoji: "🚏" },
        { id: "park", name: "park", emoji: "🌳" },
        { id: "school", name: "school", emoji: "🏫" },
        { id: "swimming-pool", name: "swimming pool", emoji: "🏊" }
    ];

    var ROOFS = ["#ef6c5a", "#3f8fd6", "#f2a83b", "#4caf7d", "#8e6bd6", "#e0679a", "#2fa8a0"];
    var THEMES = ["day", "sunset", "night"];

    var sceneEl = document.getElementById("scene");
    var streetEl = document.getElementById("street");
    var streetWrap = document.getElementById("street-wrap");
    var chipsEl = document.getElementById("chips");
    var qTextEl = document.getElementById("q-text");
    var yesBtn = document.getElementById("yes-btn");
    var noBtn = document.getElementById("no-btn");
    var newStreetBtn = document.getElementById("new-street");
    var soundBtn = document.getElementById("sound-btn");
    var helpBtn = document.getElementById("help-btn");
    var helpModal = document.getElementById("help-modal");
    var helpClose = document.getElementById("help-close");
    var helpX = document.getElementById("help-x");
    var fsBtn = document.getElementById("fs-btn");
    var scoreEl = document.getElementById("score");
    var toastEl = document.getElementById("toast");

    var state = {
        present: [],
        selected: null,
        answered: false,
        score: 0,
        sound: true,
        theme: "day"
    };

    var toastTimer = null;
    var actx = null;

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

    function byId(id) {
        for (var i = 0; i < PLACES.length; i++) {
            if (PLACES[i].id === id) return PLACES[i];
        }
        return null;
    }

    function buildChips() {
        chipsEl.innerHTML = "";
        PLACES.forEach(function (place) {
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className = "chip";
            chip.setAttribute("data-id", place.id);
            chip.setAttribute("aria-pressed", "false");
            chip.title = "Ask about the " + place.name;

            var emoji = document.createElement("span");
            emoji.className = "c-emoji";
            emoji.setAttribute("aria-hidden", "true");
            emoji.textContent = place.emoji;

            var label = document.createElement("span");
            label.textContent = place.name;

            chip.appendChild(emoji);
            chip.appendChild(label);
            chip.addEventListener("click", function () {
                selectPlace(place.id);
            });
            chipsEl.appendChild(chip);
        });
    }

    function updateChips() {
        Array.prototype.forEach.call(chipsEl.children, function (chip) {
            var on = chip.getAttribute("data-id") === state.selected;
            chip.classList.toggle("selected", on);
            chip.setAttribute("aria-pressed", on ? "true" : "false");
        });
    }

    function markAsked(id) {
        var chip = chipsEl.querySelector('[data-id="' + id + '"]');
        if (chip) chip.classList.add("asked");
    }

    function renderStreet(list) {
        streetEl.innerHTML = "";
        list.forEach(function (place, i) {
            var building = document.createElement("div");
            building.className = "building";
            building.setAttribute("data-id", place.id);
            building.style.setProperty("--i", String(i));
            building.style.setProperty("--hh", String(18 + randInt(9)));
            building.style.setProperty("--roof", ROOFS[randInt(ROOFS.length)]);

            var emoji = document.createElement("div");
            emoji.className = "b-emoji";
            emoji.setAttribute("aria-hidden", "true");
            emoji.textContent = place.emoji;

            var name = document.createElement("div");
            name.className = "b-name";
            name.textContent = place.name;

            building.appendChild(emoji);
            building.appendChild(name);
            streetEl.appendChild(building);
        });
    }

    function clearFound() {
        Array.prototype.forEach.call(streetEl.querySelectorAll(".building"), function (el) {
            el.classList.remove("found");
        });
    }

    function hideToast() {
        clearTimeout(toastTimer);
        toastEl.className = "toast";
    }

    function showToast(message, kind) {
        clearTimeout(toastTimer);
        toastEl.textContent = message;
        toastEl.className = "toast show " + (kind || "good");
        toastTimer = setTimeout(function () {
            toastEl.className = "toast " + (kind || "good");
        }, 3200);
    }

    function resetRound() {
        state.selected = null;
        state.answered = false;
        qTextEl.classList.remove("active");
        qTextEl.textContent = "Choose a place to ask about.";
        yesBtn.disabled = true;
        noBtn.disabled = true;
        updateChips();
        hideToast();
    }

    function newStreet(playSound) {
        var count = 5 + randInt(3);
        var picks = shuffle(PLACES).slice(0, count);

        state.present = picks.map(function (p) { return p.id; });
        renderStreet(shuffle(picks));

        var options = THEMES.filter(function (t) { return t !== state.theme; });
        state.theme = options[randInt(options.length)];
        sceneEl.setAttribute("data-theme", state.theme);

        Array.prototype.forEach.call(chipsEl.children, function (chip) {
            chip.classList.remove("asked");
        });

        resetRound();
        streetWrap.scrollLeft = 0;
        requestAnimationFrame(updateScrollHint);

        if (playSound) sfxNew();
    }

    function renderQuestion(place) {
        qTextEl.innerHTML = "";
        qTextEl.classList.add("active");
        qTextEl.appendChild(document.createTextNode("Does your town have a "));

        var target = document.createElement("span");
        target.className = "target";
        target.textContent = place.name;
        qTextEl.appendChild(target);

        qTextEl.appendChild(document.createTextNode("?"));
    }

    function selectPlace(id) {
        var place = byId(id);
        if (!place) return;

        state.selected = id;
        state.answered = false;
        clearFound();
        updateChips();
        renderQuestion(place);

        yesBtn.disabled = false;
        noBtn.disabled = false;
        hideToast();

        sfxPop();
    }

    function updateScrollHint() {
        var max = streetWrap.scrollWidth - streetWrap.clientWidth;
        var more = max > 6 && streetWrap.scrollLeft < max - 6;
        sceneEl.classList.toggle("has-more", more);
    }

    function revealBuilding(id) {
        var el = streetEl.querySelector('[data-id="' + id + '"]');
        if (!el) return;

        el.classList.remove("found");
        void el.offsetWidth;
        el.classList.add("found");

        var er = el.getBoundingClientRect();
        var wr = streetWrap.getBoundingClientRect();
        if (er.left < wr.left + 10 || er.right > wr.right - 10) {
            var target = el.offsetLeft - (streetWrap.clientWidth - el.offsetWidth) / 2;
            if (streetWrap.scrollTo) {
                streetWrap.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
            } else {
                streetWrap.scrollLeft = Math.max(0, target);
            }
        }
        updateScrollHint();
    }

    function answer(ans) {
        if (!state.selected || state.answered) return;

        var place = byId(state.selected);
        if (!place) return;

        var present = state.present.indexOf(place.id) !== -1;
        var isYes = ans === "yes";
        var btn = isYes ? yesBtn : noBtn;

        if (isYes !== present) {
            sfxWrong();
            btn.classList.remove("shake");
            void btn.offsetWidth;
            btn.classList.add("shake");
            showToast("Not quite — try again!", "bad");
            return;
        }

        state.answered = true;
        state.score++;
        scoreEl.textContent = String(state.score);
        scoreEl.classList.remove("bump");
        void scoreEl.offsetWidth;
        scoreEl.classList.add("bump");

        yesBtn.disabled = true;
        noBtn.disabled = true;
        markAsked(place.id);
        sfxCorrect();

        showToast(present ? "✅ Yes, it does." : "✅ No, it doesn’t.", "good");

        if (present) revealBuilding(place.id);
    }

    function audioCtx() {
        if (!state.sound) return null;
        if (!actx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try {
                actx = new AC();
            } catch (e) {
                return null;
            }
        }
        if (actx.state === "suspended") {
            actx.resume().catch(function () {});
        }
        return actx;
    }

    function tone(freq, delay, dur, type, vol) {
        var ac = audioCtx();
        if (!ac) return;

        var t0 = ac.currentTime + delay;
        var osc = ac.createOscillator();
        var gain = ac.createGain();

        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
    }

    function sfxPop() {
        tone(520, 0, 0.09, "sine", 0.08);
    }

    function sfxCorrect() {
        tone(659, 0, 0.12, "sine", 0.18);
        tone(880, 0.1, 0.16, "sine", 0.18);
        tone(1175, 0.2, 0.22, "sine", 0.14);
    }

    function sfxWrong() {
        tone(220, 0, 0.16, "triangle", 0.14);
        tone(165, 0.13, 0.22, "triangle", 0.14);
    }

    function sfxNew() {
        tone(392, 0, 0.1, "sine", 0.1);
        tone(523, 0.08, 0.12, "sine", 0.1);
        tone(659, 0.16, 0.16, "sine", 0.1);
    }

    function setSound(on) {
        state.sound = on;
        soundBtn.textContent = on ? "🔊" : "🔇";
        soundBtn.title = on ? "Sound on" : "Sound off";
        soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    function openHelp() {
        helpModal.hidden = false;
    }

    function closeHelp() {
        helpModal.hidden = true;
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function () {});
        } else {
            document.exitFullscreen();
        }
    }

    function init() {
        buildChips();
        newStreet(false);

        newStreetBtn.addEventListener("click", function () {
            newStreet(true);
        });

        yesBtn.addEventListener("click", function () {
            answer("yes");
        });

        noBtn.addEventListener("click", function () {
            answer("no");
        });

        soundBtn.addEventListener("click", function () {
            var next = !state.sound;
            setSound(next);
            if (next) sfxPop();
        });

        helpBtn.addEventListener("click", openHelp);
        helpClose.addEventListener("click", closeHelp);
        helpX.addEventListener("click", closeHelp);
        helpModal.addEventListener("click", function (e) {
            if (e.target === helpModal) closeHelp();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !helpModal.hidden) closeHelp();
        });

        streetWrap.addEventListener("scroll", updateScrollHint, { passive: true });

        var resizeTimer = null;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateScrollHint, 120);
        });

        fsBtn.addEventListener("click", toggleFullscreen);
    }

    init();
})();