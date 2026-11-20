(function () {
    "use strict";

    var PLACES = [
        { id: "bus-stop", name: "bus stop", plural: "bus stops", emoji: "🚏" },
        { id: "school", name: "school", plural: "schools", emoji: "🏫" },
        { id: "movie-theater", name: "movie theater", plural: "movie theaters", emoji: "🎬" },
        { id: "hospital", name: "hospital", plural: "hospitals", emoji: "🏥" },
        { id: "toy-store", name: "toy store", plural: "toy stores", emoji: "🧸" },
        { id: "park", name: "park", plural: "parks", emoji: "🌳" }
    ];

    var ROOFS = ["#ef6c5a", "#3f8fd6", "#f2a83b", "#4caf7d", "#8e6bd6", "#e0679a"];
    var PLOT_COUNT = 12;

    var NUM_WORDS = [
        "zero", "one", "two", "three", "four", "five", "six",
        "seven", "eight", "nine", "ten", "eleven", "twelve"
    ];

    var lotsEl = document.getElementById("lots");
    var paletteEl = document.getElementById("palette");
    var sentencesEl = document.getElementById("sentences");
    var sentenceEmptyEl = document.getElementById("sentence-empty");
    var newTownBtn = document.getElementById("new-town");
    var helpBtn = document.getElementById("help-btn");
    var helpModal = document.getElementById("help-modal");
    var helpClose = document.getElementById("help-close");
    var helpX = document.getElementById("help-x");
    var fsBtn = document.getElementById("fs-btn");
    var toastEl = document.getElementById("toast");

    var state = {
        plots: new Array(PLOT_COUNT).fill(null),
        selected: null,
        dragging: null
    };

    var toastTimer = null;

    function randInt(n) {
        return Math.floor(Math.random() * n);
    }

    function byId(id) {
        for (var i = 0; i < PLACES.length; i++) {
            if (PLACES[i].id === id) return PLACES[i];
        }
        return null;
    }

    function emptyCount() {
        var c = 0;
        for (var i = 0; i < state.plots.length; i++) {
            if (!state.plots[i]) c++;
        }
        return c;
    }

    function counts() {
        var map = {};
        PLACES.forEach(function (p) { map[p.id] = 0; });
        state.plots.forEach(function (id) {
            if (id) map[id] = (map[id] || 0) + 1;
        });
        return map;
    }

    // ── Palette ──
    function buildPalette() {
        paletteEl.innerHTML = "";
        PLACES.forEach(function (place) {
            var item = document.createElement("button");
            item.type = "button";
            item.className = "palette-item";
            item.setAttribute("data-id", place.id);
            item.setAttribute("draggable", "true");
            item.setAttribute("aria-pressed", "false");

            var emoji = document.createElement("span");
            emoji.className = "p-emoji";
            emoji.setAttribute("aria-hidden", "true");
            emoji.textContent = place.emoji;

            var label = document.createElement("span");
            label.textContent = place.name;

            item.appendChild(emoji);
            item.appendChild(label);

            item.addEventListener("click", function () {
                selectPalette(place.id);
            });

            item.addEventListener("dragstart", function (e) {
                if (emptyCount() === 0) {
                    e.preventDefault();
                    return;
                }
                state.dragging = place.id;
                item.classList.add("drag-source");
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "copy";
                    e.dataTransfer.setData("text/plain", place.id);
                }
            });

            item.addEventListener("dragend", function () {
                state.dragging = null;
                item.classList.remove("drag-source");
                clearDragTargets();
            });

            paletteEl.appendChild(item);
        });
        updatePalette();
    }

    function selectPalette(id) {
        if (emptyCount() === 0) {
            showToast("Your town is full! Remove a building first.", "hint");
            return;
        }
        state.selected = state.selected === id ? null : id;
        updatePalette();
        updateEmptyHighlights();
    }

    function updatePalette() {
        var full = emptyCount() === 0;
        Array.prototype.forEach.call(paletteEl.children, function (item) {
            var on = item.getAttribute("data-id") === state.selected;
            item.classList.toggle("selected", on);
            item.classList.toggle("locked", full && !on);
            item.setAttribute("aria-pressed", on ? "true" : "false");
        });
    }

    // ── Lots ──
    function buildLots() {
        lotsEl.innerHTML = "";
        for (var i = 0; i < PLOT_COUNT; i++) {
            lotsEl.appendChild(makeEmptyLot(i));
        }
    }

    function makeEmptyLot(index) {
        var lot = document.createElement("div");
        lot.className = "lot empty";
        lot.setAttribute("data-index", String(index));
        lot.setAttribute("role", "button");
        lot.setAttribute("tabindex", "0");

        lot.addEventListener("dragover", function (e) {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
            lot.classList.add("dragover");
        });
        lot.addEventListener("dragleave", function () {
            lot.classList.remove("dragover");
        });
        lot.addEventListener("drop", function (e) {
            e.preventDefault();
            lot.classList.remove("dragover");
            var id = state.dragging || (e.dataTransfer && e.dataTransfer.getData("text/plain"));
            if (id) placeAt(index, id);
        });

        lot.addEventListener("click", function () {
            if (state.selected) placeAt(index, state.selected);
        });

        lot.addEventListener("keydown", function (e) {
            if ((e.key === "Enter" || e.key === " ") && state.selected) {
                e.preventDefault();
                placeAt(index, state.selected);
            }
        });

        return lot;
    }

    function clearDragTargets() {
        Array.prototype.forEach.call(lotsEl.querySelectorAll(".dragover"), function (el) {
            el.classList.remove("dragover");
        });
    }

    function updateEmptyHighlights() {
        var selected = state.selected !== null;
        Array.prototype.forEach.call(lotsEl.querySelectorAll(".lot.empty"), function (lot) {
            lot.classList.toggle("hinting", selected);
        });
    }

    function placeAt(index, id) {
        if (state.plots[index]) return;
        var place = byId(id);
        if (!place) return;

        state.plots[index] = id;
        renderLot(index);

        if (emptyCount() === 0) {
            state.selected = null;
        }
        updatePalette();
        updateEmptyHighlights();
        updateSentences();
    }

    function renderLot(index) {
        var id = state.plots[index];
        var old = lotsEl.children[index];
        var lot;

        if (!id) {
            lot = makeEmptyLot(index);
        } else {
            lot = makeFilledLot(index, byId(id));
        }
        lotsEl.replaceChild(lot, old);
    }

    function makeFilledLot(index, place) {
        var lot = document.createElement("div");
        lot.className = "lot filled";
        lot.setAttribute("data-index", String(index));
        lot.setAttribute("role", "button");
        lot.setAttribute("tabindex", "0");
        lot.style.setProperty("--roof", ROOFS[randInt(ROOFS.length)]);
        lot.title = "Tap to remove the " + place.name;

        var emoji = document.createElement("div");
        emoji.className = "lot-emoji";
        emoji.setAttribute("aria-hidden", "true");
        emoji.textContent = place.emoji;

        var name = document.createElement("div");
        name.className = "lot-name";
        name.textContent = place.name;

        var remove = document.createElement("span");
        remove.className = "lot-remove";
        remove.setAttribute("aria-hidden", "true");
        remove.textContent = "✕";

        lot.appendChild(emoji);
        lot.appendChild(name);
        lot.appendChild(remove);

        function removeLot() {
            state.plots[index] = null;
            renderLot(index);
            updatePalette();
            updateEmptyHighlights();
            updateSentences();
        }

        lot.addEventListener("click", removeLot);
        lot.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " " || e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                removeLot();
            }
        });

        return lot;
    }

    // ── Sentences ──
    function updateSentences() {
        sentencesEl.innerHTML = "";
        var map = counts();
        var any = false;

        PLACES.forEach(function (place) {
            var count = map[place.id];
            if (!count) return;
            any = true;

            var chip = document.createElement("div");
            chip.className = "sentence-chip";

            var scEmoji = document.createElement("span");
            scEmoji.className = "sc-emoji";
            scEmoji.setAttribute("aria-hidden", "true");
            scEmoji.textContent = place.emoji;

            var text;
            if (count === 1) {
                text = document.createTextNode("There is a ");
                var one = document.createElement("span");
                one.className = "num";
                one.textContent = place.name;
                chip.appendChild(scEmoji);
                chip.appendChild(text);
                chip.appendChild(one);
                chip.appendChild(document.createTextNode("."));
                sentencesEl.appendChild(chip);
                return;
            }

            chip.appendChild(scEmoji);
            chip.appendChild(document.createTextNode("There are "));

            var numSpan = document.createElement("span");
            numSpan.className = "num";
            numSpan.textContent = NUM_WORDS[count] + " (" + count + ")";
            chip.appendChild(numSpan);

            chip.appendChild(document.createTextNode(" " + place.plural + "."));
            sentencesEl.appendChild(chip);
        });

        sentenceEmptyEl.hidden = any;
    }

    // ── Toast ──
    function showToast(message, kind) {
        clearTimeout(toastTimer);
        toastEl.textContent = message;
        toastEl.className = "toast show " + (kind || "hint");
        toastTimer = setTimeout(function () {
            toastEl.className = "toast " + (kind || "hint");
        }, 2400);
    }

    // ── Reset ──
    function newTown() {
        state.plots = new Array(PLOT_COUNT).fill(null);
        state.selected = null;
        state.dragging = null;
        buildLots();
        updatePalette();
        updateSentences();
        showToast("New town! Let's build! ✨", "hint");
    }

    // ── Help / fullscreen ──
    function openHelp() { helpModal.hidden = false; }
    function closeHelp() { helpModal.hidden = true; }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function () {});
        } else {
            document.exitFullscreen();
        }
    }

    function init() {
        buildPalette();
        buildLots();
        updateSentences();

        newTownBtn.addEventListener("click", newTown);
        helpBtn.addEventListener("click", openHelp);
        helpClose.addEventListener("click", closeHelp);
        helpX.addEventListener("click", closeHelp);
        helpModal.addEventListener("click", function (e) {
            if (e.target === helpModal) closeHelp();
        });
        fsBtn.addEventListener("click", toggleFullscreen);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !helpModal.hidden) closeHelp();
        });
    }

    init();
})();