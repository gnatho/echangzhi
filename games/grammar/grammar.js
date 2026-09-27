const state = {
    topic: null,
    questions: [],
    index: 0,
    score: 0,
    answers: [],
    locked: false
};

let audioCtx = null;

function tone(freq, dur, type, when) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type || "sine";
        o.frequency.value = freq;
        g.gain.value = 0.08;
        o.connect(g);
        g.connect(audioCtx.destination);
        const t = audioCtx.currentTime + (when || 0);
        o.start(t);
        o.stop(t + dur);
    } catch (e) {}
}

function playCorrect() {
    tone(660, 0.12);
    tone(880, 0.15, "sine", 0.1);
}

function playWrong() {
    tone(180, 0.25, "square");
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

function renderTopics() {
    const grid = document.getElementById("topics-grid");
    grid.innerHTML = "";
    const topics = Object.values(window.GRAMMAR_TOPICS || {});

    topics.forEach(t => {
        const card = document.createElement("button");
        card.className = "topic-card";
        card.innerHTML =
            '<div class="topic-icon">' + t.icon + '</div>' +
            '<div class="topic-name">' + t.name + '</div>' +
            '<div class="topic-desc">' + t.description + '</div>' +
            '<div class="topic-count">' + t.questions.length + ' questions</div>';
        card.onclick = () => selectTopic(t.id);
        grid.appendChild(card);
    });

    const soon = document.createElement("div");
    soon.className = "topic-card disabled";
    soon.innerHTML =
        '<div class="topic-icon">🚧</div>' +
        '<div class="topic-name">More topics soon</div>' +
        '<div class="topic-desc">New grammar topics will appear here.</div>';
    grid.appendChild(soon);
}

function selectTopic(id) {
    state.topic = (window.GRAMMAR_TOPICS || {})[id];
    if (!state.topic) return;
    document.getElementById("length-topic-name").textContent = state.topic.icon + " " + state.topic.name;
    document.getElementById("length-rule").textContent = state.topic.rule;
    showScreen("length-screen");
}

function startQuiz(count) {
    const bank = state.topic.questions;
    state.questions = shuffle(bank).slice(0, Math.min(count, bank.length));
    state.index = 0;
    state.score = 0;
    state.answers = [];
    state.locked = false;
    document.getElementById("quiz-topic-name").textContent = state.topic.icon + " " + state.topic.name;
    showScreen("quiz-screen");
    renderQuestion();
}

function renderQuestion() {
    const q = state.questions[state.index];
    state.locked = false;

    document.getElementById("quiz-counter").textContent =
        (state.index + 1) + " / " + state.questions.length;
    document.getElementById("quiz-score").textContent = "Score: " + state.score;
    document.getElementById("progress-bar").style.width =
        (state.index / state.questions.length * 100) + "%";

    const promptEl = document.getElementById("question-prompt");
    promptEl.innerHTML = "";
    q.prompt.split("___").forEach((part, i) => {
        if (i > 0) {
            const gap = document.createElement("span");
            gap.className = "blank-token";
            gap.id = "blank-token";
            gap.textContent = "___";
            promptEl.appendChild(gap);
        }
        if (part) promptEl.appendChild(document.createTextNode(part));
    });

    const grid = document.getElementById("options-grid");
    grid.innerHTML = "";
    shuffle(q.options).forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.onclick = () => answer(opt, btn);
        grid.appendChild(btn);
    });

    const fb = document.getElementById("feedback");
    fb.className = "feedback";
    fb.innerHTML = "";
    document.getElementById("next-btn").classList.add("hidden");
    document.getElementById("next-btn").textContent =
        state.index === state.questions.length - 1 ? "See Results →" : "Next →";
}

function answer(opt, btn) {
    if (state.locked) return;
    state.locked = true;

    const q = state.questions[state.index];
    const ok = opt === q.correct;
    if (ok) {
        state.score++;
        playCorrect();
    } else {
        playWrong();
    }

    state.answers.push({
        prompt: q.prompt,
        chosen: opt,
        correct: q.correct,
        tip: q.tip,
        ok: ok
    });

    const gap = document.getElementById("blank-token");
    if (gap) {
        gap.textContent = opt;
        gap.classList.add("filled");
        gap.style.color = ok ? "#1e8449" : "#c0392b";
    }

    document.querySelectorAll(".option-btn").forEach(b => {
        b.disabled = true;
        if (b.textContent === q.correct) {
            b.classList.add("correct");
        } else if (b === btn) {
            b.classList.add("wrong");
        } else {
            b.classList.add("dim");
        }
    });

    const fb = document.getElementById("feedback");
    fb.className = "feedback " + (ok ? "good" : "bad");
    fb.innerHTML =
        (ok ? "✅ Correct!" : "❌ The answer is: " + q.correct) +
        '<span class="tip-line">' + q.tip + '</span>';

    document.getElementById("quiz-score").textContent = "Score: " + state.score;
    document.getElementById("progress-bar").style.width =
        ((state.index + 1) / state.questions.length * 100) + "%";
    document.getElementById("next-btn").classList.remove("hidden");
}

function nextQuestion() {
    if (state.index < state.questions.length - 1) {
        state.index++;
        renderQuestion();
    } else {
        showResults();
    }
}

function playAgain() {
    startQuiz(state.questions.length);
}

function showResults() {
    const total = state.questions.length;
    const pct = Math.round((state.score / total) * 100);

    document.getElementById("score-big").textContent = state.score + "/" + total;
    document.getElementById("score-pct").textContent = pct + "%";

    let msg = "Keep practising!";
    if (pct >= 90) msg = "⭐ Excellent work!";
    else if (pct >= 70) msg = "👏 Great job!";
    else if (pct >= 50) msg = "👍 Good try!";
    document.getElementById("result-msg").textContent = msg;

    const ring = document.getElementById("score-ring");
    ring.style.borderColor = pct >= 70 ? "#27ae60" : pct >= 50 ? "#e67e22" : "#e74c3c";
    document.getElementById("score-pct").style.color =
        pct >= 70 ? "#27ae60" : pct >= 50 ? "#e67e22" : "#e74c3c";

    const list = document.getElementById("review-list");
    list.innerHTML = "";
    const wrong = state.answers.filter(a => !a.ok);
    if (wrong.length === 0) {
        const all = document.createElement("div");
        all.className = "review-item";
        all.innerHTML = '<div class="rv-prompt">Perfect score — nothing to review! 🎉</div>';
        list.appendChild(all);
    } else {
        wrong.forEach(a => {
            const item = document.createElement("div");
            item.className = "review-item";
            item.innerHTML =
                '<div class="rv-prompt">' + a.prompt.replace("___", "______") + '</div>' +
                '<div class="rv-answers">Your answer: <span class="rv-wrong">' + a.chosen +
                '</span> · Correct: <span class="rv-right">' + a.correct + '</span></div>' +
                '<div class="rv-tip">' + a.tip + '</div>';
            list.appendChild(item);
        });
    }

    showScreen("results-screen");
}

document.addEventListener("keydown", e => {
    const quizActive = document.getElementById("quiz-screen").classList.contains("active");
    if (!quizActive) return;

    if (!state.locked && (e.key === "1" || e.key === "2" || e.key === "3")) {
        const btns = document.querySelectorAll(".option-btn");
        const b = btns[parseInt(e.key, 10) - 1];
        if (b) b.click();
    } else if (state.locked && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        nextQuestion();
    }
});

renderTopics();
