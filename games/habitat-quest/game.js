(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const CONNECT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const MYSTERY_EXCLUDE = {
    fish: ['tuna'],
    tuna: ['fish'],
    snake: ['anaconda'],
    anaconda: ['snake'],
    bear: ['polar-bear'],
    'polar-bear': ['bear', 'penguin'],
    lion: ['tiger', 'jaguar'],
    tiger: ['lion', 'jaguar'],
    jaguar: ['lion', 'tiger'],
    toucan: ['parrot'],
    parrot: ['toucan'],
    seal: ['penguin'],
    penguin: ['seal', 'polar-bear']
  };

  const MODE_INFO = {
    home: {
      emoji: '🏠',
      title: 'Find the Right Home',
      text: 'Where does the animal live? Tap the correct home.',
      difficulties: [
        { id: 'easy', name: 'Easy', desc: '3 homes · easy animals' },
        { id: 'medium', name: 'Medium', desc: '4 homes · more animals' },
        { id: 'challenge', name: 'Challenge', desc: '4 homes · tricky animals' }
      ]
    },
    connect: {
      emoji: '🔗',
      title: 'Connect the Animals',
      text: 'Tap an animal. Then tap its home. Draw a line!'
    },
    memory: {
      emoji: '🧠',
      title: 'Habitat Memory',
      text: 'Turn over two cards. Match an animal to its home.',
      difficulties: [
        { id: 'easy', name: 'Easy', desc: '6 pairs · 4 × 3' },
        { id: 'medium', name: 'Medium', desc: '8 pairs · 4 × 4' },
        { id: 'hard', name: 'Hard', desc: '10 pairs · 5 × 4' }
      ]
    },
    mystery: {
      emoji: '❓',
      title: 'Mystery Animal',
      text: 'Read the clues. Tap the animal. Who am I?'
    }
  };

  const state = {
    mode: null,
    difficulty: null,
    started: false,
    locked: false,
    score: 0,
    timers: new Set(),
    intervals: new Set(),
    home: null,
    connect: null,
    memory: null,
    mystery: null
  };

  const canvas = $('#confetti');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let toastTimer = null;
  let confettiRaf = null;
  let confettiParts = [];
  let audioCtx = null;
  let soundOn = true;
  let connectObserver = null;
  let resizeTimer = null;

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function sample(list, n) {
    return shuffle(list).slice(0, n);
  }

  function formatTime(total) {
    const s = Math.max(0, Math.floor(total));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function articleFor(name) {
    return /^[aeiou]/i.test(name) ? 'An' : 'A';
  }

  function animalVisualHTML(animal, extraClass) {
    return '<span class="animal-visual ' + (extraClass || '') + '">' +
      '<span class="animal-fallback" aria-hidden="true">' + animal.emoji + '</span>' +
      '<img src="' + animal.image + '" alt="' + animal.name + '" draggable="false" onerror="this.remove()">' +
      '</span>';
  }

  function habitatChoiceHTML(id, cls) {
    const h = HABITATS_BY_ID[id];
    return '<button class="habitat-choice ' + (cls || '') + '" data-habitat="' + id + '" style="--accent:' + h.accent + ';--soft:' + h.soft + '">' +
      '<span class="h-emoji" aria-hidden="true">' + h.emoji + '</span>' +
      '<span class="h-name">' + h.name + '</span>' +
      '</button>';
  }

  function later(fn, ms) {
    const id = setTimeout(function () {
      state.timers.delete(id);
      fn();
    }, ms);
    state.timers.add(id);
    return id;
  }

  function every(fn, ms) {
    const id = setInterval(fn, ms);
    state.intervals.add(id);
    return id;
  }

  function clearTimers() {
    state.timers.forEach(function (id) { clearTimeout(id); });
    state.timers.clear();
    state.intervals.forEach(function (id) { clearInterval(id); });
    state.intervals.clear();
    if (connectObserver) {
      connectObserver.disconnect();
      connectObserver = null;
    }
  }

  function ac() {
    if (!soundOn) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try {
        audioCtx = new Ctx();
      } catch (e) {
        return null;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function tone(freq, dur, type, vol, delay) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  const sfx = {
    tap: function () { tone(520, 0.07, 'square', 0.03); },
    flip: function () { tone(420, 0.08, 'sine', 0.04); },
    correct: function () {
      tone(660, 0.12, 'triangle', 0.07);
      tone(880, 0.16, 'triangle', 0.06, 0.1);
    },
    wrong: function () { tone(180, 0.18, 'sawtooth', 0.05); },
    match: function () {
      tone(600, 0.1, 'sine', 0.06);
      tone(800, 0.16, 'sine', 0.06, 0.08);
    },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, 0.2, 'triangle', 0.06, i * 0.09);
      });
    }
  };

  function toggleSound() {
    soundOn = !soundOn;
    updateSoundButtons();
    if (soundOn) sfx.tap();
  }

  function updateSoundButtons() {
    $$('[data-action="sound"]').forEach(function (btn) {
      btn.textContent = soundOn ? '🔊' : '🔇';
      btn.setAttribute('aria-pressed', String(soundOn));
    });
  }

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function confettiBurst(count) {
    if (!ctx) return;
    const colors = ['#ff5d8f', '#ffb703', '#8ecae6', '#90be6d', '#c77dff', '#ff9770', '#4cc9f0', '#ffd166', '#ef476f'];
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight * 0.42;
    for (let i = 0; i < (count || 100); i++) {
      confettiParts.push({
        x: ox + (Math.random() - 0.5) * 80,
        y: oy + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * -15 - 4,
        g: 0.35 + Math.random() * 0.25,
        s: 6 + Math.random() * 9,
        c: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.45,
        life: 1
      });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(confettiLoop);
  }

  function confettiLoop() {
    if (!ctx) {
      confettiRaf = null;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = confettiParts.length - 1; i >= 0; i--) {
      const p = confettiParts[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.995;
      p.rot += p.vr;
      p.life -= 0.008;
      if (p.life <= 0 || p.y > canvas.height + 50) {
        confettiParts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    }
    if (confettiParts.length) {
      confettiRaf = requestAnimationFrame(confettiLoop);
    } else {
      confettiRaf = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function showToast(kind, text, duration) {
    const toast = $('#toast');
    if (!toast) return;
    toast.className = 'toast show ' + kind;
    toast.innerHTML = '<span aria-hidden="true">' + (kind === 'good' ? '⭐' : '💛') + '</span><span>' + text + '</span>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.className = 'toast';
    }, duration || 1500);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    if (toast) toast.className = 'toast';
  }

  function showScreen(id) {
    $$('.screen').forEach(function (s) { s.classList.remove('active'); });
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function hideResult() {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.innerHTML = '';
  }

  function showResult(opts) {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    const stars = opts.stars || 1;
    overlay.innerHTML = '<div class="result-card">' +
      '<div class="result-emoji">' + (opts.emoji || '🎉') + '</div>' +
      '<h2>' + (opts.title || 'Well done!') + '</h2>' +
      '<p>' + (opts.message || '') + '</p>' +
      '<div class="result-stars">' + [0, 1, 2].map(function (i) {
        return '<span class="' + (i < stars ? 'on' : '') + '">★</span>';
      }).join('') + '</div>' +
      '<div class="result-score">Score: ' + (opts.score || 0) + '</div>' +
      '<div class="result-actions">' +
      '<button class="btn primary" id="result-replay">Play Again</button>' +
      '<button class="btn secondary" id="result-menu">Main Menu</button>' +
      '</div></div>';
    overlay.classList.add('show');
    const replay = document.getElementById('result-replay');
    const menu = document.getElementById('result-menu');
    if (replay) {
      replay.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        (opts.replay || goMenu)();
      });
    }
    if (menu) {
      menu.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        goMenu();
      });
    }
    sfx.win();
    confettiBurst(160);
  }

  function updateHud(mode) {
    const screen = document.getElementById('screen-' + mode);
    if (!screen) return;
    const progress = $('.hud-progress', screen);
    const score = $('.hud-score', screen);
    if (score) score.textContent = 'Score ' + state.score;
    if (!progress) return;

    if (mode === 'home' && state.home) {
      progress.textContent = 'Question ' + Math.min(state.home.index + 1, state.home.questions.length) + ' / ' + state.home.questions.length;
    } else if (mode === 'connect' && state.connect) {
      progress.textContent = 'Matches ' + state.connect.matched + ' / ' + state.connect.total;
    } else if (mode === 'memory' && state.memory) {
      const secs = Math.floor((Date.now() - state.memory.startTime) / 1000);
      progress.textContent = 'Pairs ' + state.memory.matched + ' / ' + state.memory.pairs + ' · Tries ' + state.memory.attempts + ' · ' + formatTime(secs);
    } else if (mode === 'mystery' && state.mystery) {
      progress.textContent = 'Mystery ' + Math.min(state.mystery.index + 1, state.mystery.total) + ' / ' + state.mystery.total + ' · Clues ' + (state.mystery.clueIndex + 1) + ' / 3';
    }
  }

  function openMode(mode) {
    clearTimers();
    hideResult();
    hideToast();
    state.mode = mode;
    state.difficulty = null;
    state.started = false;
    state.locked = false;
    state.score = 0;

    showScreen('screen-' + mode);
    const screen = document.getElementById('screen-' + mode);
    const scoreEl = screen ? $('.hud-score', screen) : null;
    const progressEl = screen ? $('.hud-progress', screen) : null;
    if (scoreEl) scoreEl.textContent = 'Score 0';
    if (progressEl) progressEl.textContent = '';

    const body = document.getElementById(mode + '-body');
    if (!body) return;
    body.innerHTML = '';
    renderIntro(mode, body);
  }

  function renderIntro(mode, body) {
    const info = MODE_INFO[mode];
    if (!info) return;
    let controls = '';
    if (info.difficulties) {
      controls = '<div class="diff-grid">' + info.difficulties.map(function (d) {
        return '<button class="diff-btn" data-diff="' + d.id + '">' +
          '<span class="diff-name">' + d.name + '</span>' +
          '<span class="diff-desc">' + d.desc + '</span>' +
          '</button>';
      }).join('') + '</div>';
    } else {
      controls = '<button class="big-btn" data-action="start">Start</button>';
    }
    body.innerHTML = '<div class="intro-wrap"><div class="intro-card">' +
      '<div class="intro-emoji">' + info.emoji + '</div>' +
      '<h2>' + info.title + '</h2>' +
      '<p>' + info.text + '</p>' +
      controls +
      '</div></div>';

    $$('[data-diff]', body).forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfx.tap();
        const diff = btn.dataset.diff;
        if (mode === 'home') startHome(diff);
        else if (mode === 'memory') startMemory(diff);
      });
    });

    const startBtn = $('[data-action="start"]', body);
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        sfx.tap();
        if (mode === 'connect') startConnect();
        else if (mode === 'mystery') startMystery();
      });
    }
  }

  function goMenu() {
    clearTimers();
    hideResult();
    hideToast();
    state.mode = null;
    state.started = false;
    state.locked = false;
    showScreen('screen-menu');
  }

  function restartMode() {
    sfx.tap();
    if (!state.mode) {
      goMenu();
      return;
    }
    if (!state.started) {
      openMode(state.mode);
      return;
    }
    if (state.mode === 'home') startHome(state.difficulty || 'easy');
    else if (state.mode === 'connect') startConnect();
    else if (state.mode === 'memory') startMemory(state.difficulty || 'easy');
    else if (state.mode === 'mystery') startMystery();
  }

  function buildHomeQuestions(diff) {
    let pool;
    if (diff === 'easy') {
      pool = sample(SINGLE_HABITAT_ANIMALS, 10);
    } else if (diff === 'medium') {
      pool = sample(ANIMALS, 10);
    } else {
      const multi = sample(MULTI_HABITAT_ANIMALS, MULTI_HABITAT_ANIMALS.length);
      const single = sample(SINGLE_HABITAT_ANIMALS, 10 - multi.length);
      pool = multi.concat(single);
    }

    const choiceCount = diff === 'easy' ? 3 : 4;
    return pool.map(function (animal) {
      const valid = animal.habitats.slice();
      const others = shuffle(HABITATS.map(function (h) { return h.id; }).filter(function (id) {
        return !valid.includes(id);
      }));
      const choices = shuffle(valid.concat(others.slice(0, Math.max(0, choiceCount - valid.length))));
      return { animal: animal, choices: choices, valid: valid };
    });
  }

  function startHome(diff) {
    clearTimers();
    hideToast();
    hideResult();
    state.mode = 'home';
    state.difficulty = diff;
    state.started = true;
    state.locked = false;
    state.score = 0;
    state.home = { questions: buildHomeQuestions(diff), index: 0, attempts: 0, firstTry: 0 };
    const body = document.getElementById('home-body');
    if (!body) return;
    body.innerHTML = '';
    renderHomeQuestion();
  }

  function renderHomeQuestion() {
    const h = state.home;
    const body = document.getElementById('home-body');
    if (!body) return;
    if (!h || h.index >= h.questions.length) {
      finishHome();
      return;
    }

    h.attempts = 0;
    const q = h.questions[h.index];
    const animal = q.animal;
    const hint = q.valid.length > 1 && state.difficulty === 'challenge'
      ? 'This animal can live in more than one habitat!'
      : '';

    body.innerHTML = '<div class="home-wrap">' +
      '<div class="home-question">Where does the ' + animal.name.toLowerCase() + ' live?</div>' +
      '<div class="home-animal">' +
      '<div class="animal-frame">' + animalVisualHTML(animal) + '</div>' +
      '<div class="animal-name">' + animal.name + '</div>' +
      '</div>' +
      '<div class="home-choices">' +
      q.choices.map(function (id) { return habitatChoiceHTML(id, 'home-choice'); }).join('') +
      '</div>' +
      '<div class="home-hint">' + hint + '</div>' +
      '</div>';

    $$('.home-choice', body).forEach(function (btn) {
      btn.addEventListener('click', function () { onHomeChoice(btn); });
    });
    updateHud('home');
  }

  function onHomeChoice(btn) {
    if (state.locked || !state.home) return;
    const h = state.home;
    const q = h.questions[h.index];
    if (!q) return;
    const id = btn.dataset.habitat;

    if (q.valid.includes(id)) {
      state.locked = true;
      const points = h.attempts === 0 ? 10 : 5;
      state.score += points;
      if (h.attempts === 0) h.firstTry++;
      btn.classList.add('correct');
      sfx.correct();

      let msg;
      if (q.animal.habitats.length > 1) {
        const places = q.animal.habitats.map(function (hid) { return HABITATS_BY_ID[hid].place; }).join(' or ');
        msg = articleFor(q.animal.name) + ' ' + q.animal.name.toLowerCase() + ' can live in ' + places + '.';
      } else {
        msg = articleFor(q.animal.name) + ' ' + q.animal.name.toLowerCase() + ' lives in ' + HABITATS_BY_ID[id].place + '.';
      }
      showToast('good', 'Correct! ' + msg, 1900);
      updateHud('home');

      later(function () {
        h.index++;
        state.locked = false;
        renderHomeQuestion();
      }, 1700);
    } else {
      h.attempts++;
      btn.classList.add('wrong');
      sfx.wrong();
      showToast('bad', 'Try again!', 1100);
      later(function () { btn.classList.remove('wrong'); }, 650);
    }
  }

  function finishHome() {
    const h = state.home;
    if (!h) return;
    const stars = h.firstTry >= 9 ? 3 : h.firstTry >= 7 ? 2 : 1;
    showResult({
      emoji: '🏆',
      title: 'Habitat Expert!',
      message: 'You got ' + h.firstTry + ' right on the first try!',
      stars: stars,
      score: state.score,
      replay: function () { startHome(state.difficulty); }
    });
  }

  function buildConnectPairs() {
    const byHabitat = {};
    SINGLE_HABITAT_ANIMALS.forEach(function (a) {
      const hid = a.habitats[0];
      if (!byHabitat[hid]) byHabitat[hid] = [];
      byHabitat[hid].push(a);
    });
    return HABITATS.map(function (h) {
      const list = byHabitat[h.id] || [];
      const animal = list[Math.floor(Math.random() * list.length)] || SINGLE_HABITAT_ANIMALS[0];
      return { animal: animal, habitat: h.id };
    });
  }

  function startConnect() {
    clearTimers();
    hideToast();
    hideResult();
    state.mode = 'connect';
    state.started = true;
    state.locked = false;
    state.score = 0;

    const pairs = buildConnectPairs();
    state.connect = { pairs: pairs, selected: null, matched: 0, total: pairs.length, lines: [], mistakes: 0 };

    const body = document.getElementById('connect-body');
    if (!body) return;
    body.innerHTML = '<div class="connect-wrap">' +
      '<div class="connect-board" id="connect-board">' +
      '<svg id="connect-lines" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>' +
      '<div class="connect-col" id="connect-animals"></div>' +
      '<div class="connect-col" id="connect-habitats"></div>' +
      '</div>' +
      '<div class="connect-tip">Tap an animal, then tap its home.</div>' +
      '</div>';

    const animals = shuffle(pairs.map(function (p) { return p.animal; }));
    const habitats = shuffle(pairs.map(function (p) { return p.habitat; }));
    const animalsCol = document.getElementById('connect-animals');
    const habitatsCol = document.getElementById('connect-habitats');

    animalsCol.innerHTML = animals.map(function (a) {
      return '<button class="connect-card animal-card" data-animal="' + a.id + '">' +
        animalVisualHTML(a) +
        '<span class="connect-name">' + a.name + '</span>' +
        '<span class="connect-check">✓</span>' +
        '</button>';
    }).join('');

    habitatsCol.innerHTML = habitats.map(function (hid) {
      const h = HABITATS_BY_ID[hid];
      return '<button class="connect-card habitat-card" data-habitat="' + hid + '" style="--accent:' + h.accent + ';--soft:' + h.soft + '">' +
        '<span class="connect-emoji" aria-hidden="true">' + h.emoji + '</span>' +
        '<span class="connect-name">' + h.name + '</span>' +
        '<span class="connect-check">✓</span>' +
        '</button>';
    }).join('');

    $$('.animal-card', animalsCol).forEach(function (btn) {
      btn.addEventListener('click', function () { selectConnectAnimal(btn); });
    });
    $$('.habitat-card', habitatsCol).forEach(function (btn) {
      btn.addEventListener('click', function () { tryConnectHabitat(btn); });
    });

    setupConnectObserver();
    updateHud('connect');
  }

  function selectConnectAnimal(btn) {
    const c = state.connect;
    if (!c || state.locked || btn.classList.contains('matched')) return;
    if (c.selected === btn) {
      btn.classList.remove('selected');
      c.selected = null;
      return;
    }
    if (c.selected) c.selected.classList.remove('selected');
    c.selected = btn;
    btn.classList.add('selected');
    sfx.tap();
  }

  function tryConnectHabitat(btn) {
    const c = state.connect;
    if (!c || state.locked || btn.classList.contains('matched')) return;
    if (!c.selected) {
      showToast('bad', 'Choose an animal first!', 1100);
      sfx.wrong();
      return;
    }

    const animalBtn = c.selected;
    const animal = ANIMALS_BY_ID[animalBtn.dataset.animal];
    const hid = btn.dataset.habitat;

    if (animal && animal.habitats[0] === hid) {
      state.locked = true;
      animalBtn.classList.remove('selected');
      animalBtn.classList.add('matched');
      btn.classList.add('matched');
      animalBtn.disabled = true;
      btn.disabled = true;
      c.selected = null;
      c.matched++;
      state.score += 10;
      sfx.match();

      showToast('good', 'Yes! ' + animal.name + ' lives in ' + HABITATS_BY_ID[hid].place + '.', 1400);
      drawConnectLine(animalBtn, btn, CONNECT_COLORS[c.lines.length % CONNECT_COLORS.length]);
      updateHud('connect');

      if (c.matched === c.total) {
        later(finishConnect, 1100);
      } else {
        state.locked = false;
      }
    } else {
      state.locked = true;
      c.mistakes++;
      btn.classList.add('wrong');
      animalBtn.classList.add('wrong');
      sfx.wrong();
      showToast('bad', 'Try again!', 1100);

      later(function () {
        btn.classList.remove('wrong');
        if (c.selected) c.selected.classList.remove('wrong');
        c.selected = null;
        state.locked = false;
      }, 750);
    }
  }

  function centerIn(el, container) {
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return {
      x: er.left - cr.left + er.width / 2,
      y: er.top - cr.top + er.height / 2
    };
  }

  function sizeConnectSvg() {
    const board = document.getElementById('connect-board');
    const svg = document.getElementById('connect-lines');
    if (!board || !svg) return;
    const w = board.clientWidth;
    const h = board.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
  }

  function drawConnectLine(animalBtn, habitatBtn, color) {
    const board = document.getElementById('connect-board');
    const svg = document.getElementById('connect-lines');
    if (!board || !svg) return;
    const a = centerIn(animalBtn, board);
    const b = centerIn(habitatBtn, board);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '8');
    line.setAttribute('pathLength', '1');
    line.setAttribute('class', 'connect-line');
    svg.appendChild(line);
    state.connect.lines.push({ animalBtn: animalBtn, habitatBtn: habitatBtn, line: line });
    sizeConnectSvg();
  }

  function redrawConnectLines() {
    const c = state.connect;
    if (!c) return;
    const board = document.getElementById('connect-board');
    if (!board) return;
    sizeConnectSvg();
    c.lines.forEach(function (item) {
      const a = centerIn(item.animalBtn, board);
      const b = centerIn(item.habitatBtn, board);
      item.line.setAttribute('x1', a.x);
      item.line.setAttribute('y1', a.y);
      item.line.setAttribute('x2', b.x);
      item.line.setAttribute('y2', b.y);
    });
  }

  function setupConnectObserver() {
    if (connectObserver) {
      connectObserver.disconnect();
      connectObserver = null;
    }
    const board = document.getElementById('connect-board');
    if (!board || typeof ResizeObserver === 'undefined') return;
    connectObserver = new ResizeObserver(function () { redrawConnectLines(); });
    connectObserver.observe(board);
  }

  function finishConnect() {
    const c = state.connect;
    if (!c) return;
    const stars = c.mistakes === 0 ? 3 : c.mistakes <= 2 ? 2 : 1;
    showResult({
      emoji: '🎉',
      title: 'Great Matching!',
      message: 'You matched every animal to its home.',
      stars: stars,
      score: state.score,
      replay: startConnect
    });
  }

  function startMemory(diff) {
    clearTimers();
    hideToast();
    hideResult();

    const config = {
      easy: { cols: 4, rows: 3, pairs: 6 },
      medium: { cols: 4, rows: 4, pairs: 8 },
      hard: { cols: 5, rows: 4, pairs: 10 }
    }[diff] || { cols: 4, rows: 3, pairs: 6 };

    state.mode = 'memory';
    state.difficulty = diff;
    state.started = true;
    state.locked = false;
    state.score = 0;

    const animals = sample(SINGLE_HABITAT_ANIMALS, config.pairs);
    const cards = [];
    animals.forEach(function (a) {
      const hid = a.habitats[0];
      cards.push({ type: 'animal', animal: a, habitatId: hid, matched: false });
      cards.push({ type: 'habitat', animal: a, habitatId: hid, matched: false });
    });

    const deck = shuffle(cards);
    state.memory = {
      cards: deck,
      flipped: [],
      matched: 0,
      pairs: config.pairs,
      attempts: 0,
      lock: false,
      startTime: Date.now(),
      timerId: null
    };

    const body = document.getElementById('memory-body');
    if (!body) return;
    body.innerHTML = '<div class="memory-wrap">' +
      '<div class="mem-grid" id="mem-grid" style="--cols:' + config.cols + ';--rows:' + config.rows + '"></div>' +
      '</div>';

    const grid = document.getElementById('mem-grid');
    grid.innerHTML = deck.map(function (card, i) { return memoryCardHTML(card, i); }).join('');
    $$('.mem-card', grid).forEach(function (btn) {
      btn.addEventListener('click', function () { onMemoryCard(btn); });
    });

    state.memory.timerId = every(function () {
      if (state.memory) updateHud('memory');
    }, 1000);

    updateHud('memory');
  }

  function memoryCardHTML(card, index) {
    let front;
    let style = '';
    if (card.type === 'animal') {
      front = animalVisualHTML(card.animal) + '<span class="mem-name">' + card.animal.name + '</span>';
    } else {
      const h = HABITATS_BY_ID[card.habitatId];
      front = '<span class="mem-emoji" aria-hidden="true">' + h.emoji + '</span><span class="mem-name">' + h.name + '</span>';
      style = ' style="--soft:' + h.soft + ';--accent:' + h.accent + '"';
    }
    return '<button class="mem-card" data-index="' + index + '" aria-label="Memory card ' + (index + 1) + '">' +
      '<span class="mem-inner">' +
      '<span class="mem-face mem-back">?</span>' +
      '<span class="mem-face mem-front ' + card.type + '"' + style + '>' + front + '</span>' +
      '</span></button>';
  }

  function onMemoryCard(btn) {
    const m = state.memory;
    if (!m || m.lock) return;
    const index = Number(btn.dataset.index);
    const card = m.cards[index];
    if (!card || card.matched || btn.classList.contains('flipped')) return;

    btn.classList.add('flipped');
    m.flipped.push({ card: card, btn: btn });
    sfx.flip();

    if (m.flipped.length === 2) {
      m.attempts++;
      m.lock = true;
      const a = m.flipped[0];
      const b = m.flipped[1];
      const match = a.card.type !== b.card.type && a.card.habitatId === b.card.habitatId;

      if (match) {
        later(function () {
          a.btn.classList.add('matched');
          b.btn.classList.add('matched');
          a.card.matched = true;
          b.card.matched = true;
          m.matched++;
          state.score += 10;
          sfx.match();

          const animalCard = a.card.type === 'animal' ? a.card : b.card;
          showToast('good', animalCard.animal.name + ' lives in ' + HABITATS_BY_ID[animalCard.habitatId].place + '!', 1200);

          m.flipped = [];
          m.lock = false;
          updateHud('memory');

          if (m.matched === m.pairs) finishMemory();
        }, 520);
      } else {
        later(function () {
          a.btn.classList.remove('flipped');
          b.btn.classList.remove('flipped');
          m.flipped = [];
          m.lock = false;
          sfx.wrong();
          updateHud('memory');
        }, 950);
      }
    }
  }

  function finishMemory() {
    const m = state.memory;
    if (!m) return;
    if (m.timerId) {
      clearInterval(m.timerId);
      state.intervals.delete(m.timerId);
      m.timerId = null;
    }
    const stars = m.attempts <= m.pairs * 1.4 ? 3 : m.attempts <= m.pairs * 2 ? 2 : 1;
    const secs = Math.floor((Date.now() - m.startTime) / 1000);
    showResult({
      emoji: '🧠',
      title: 'Excellent memory!',
      message: 'You found all ' + m.pairs + ' pairs in ' + m.attempts + ' tries (' + formatTime(secs) + ').',
      stars: stars,
      score: state.score,
      replay: function () { startMemory(state.difficulty); }
    });
  }

  function startMystery() {
    clearTimers();
    hideToast();
    hideResult();
    state.mode = 'mystery';
    state.started = true;
    state.locked = false;
    state.score = 0;

    const queue = sample(MYSTERY_ANIMALS, 8);
    state.mystery = {
      queue: queue,
      index: 0,
      clueIndex: 0,
      attempts: 0,
      total: queue.length,
      lock: false
    };

    const body = document.getElementById('mystery-body');
    if (!body) return;
    body.innerHTML = '';
    renderMysteryQuestion();
  }

  function renderMysteryQuestion() {
    const m = state.mystery;
    const body = document.getElementById('mystery-body');
    if (!m || !body) return;
    if (m.index >= m.total) {
      finishMystery();
      return;
    }

    const animal = m.queue[m.index];
    m.clueIndex = 0;
    m.lock = false;

    const blocked = MYSTERY_EXCLUDE[animal.id] || [];
    const pool = MYSTERY_ANIMALS.filter(function (a) {
      return a.id !== animal.id && !blocked.includes(a.id);
    });
    const candidates = shuffle(pool);
    const others = [];

    candidates.forEach(function (candidate) {
      if (others.length >= 3) return;
      const candidateBlocked = MYSTERY_EXCLUDE[candidate.id] || [];
      const conflict = others.some(function (o) {
        return candidateBlocked.includes(o.id) ||
          (MYSTERY_EXCLUDE[o.id] || []).includes(candidate.id);
      });
      if (!conflict) others.push(candidate);
    });

    if (others.length < 3) {
      candidates.forEach(function (candidate) {
        if (others.length >= 3) return;
        if (!others.includes(candidate)) others.push(candidate);
      });
    }

    const choices = shuffle([animal].concat(others));

    body.innerHTML = '<div class="mystery-wrap">' +
      '<div class="mystery-side">' +
      '<div class="clue-panel" id="clue-panel"></div>' +
      '<div class="mystery-answer" id="mystery-answer"></div>' +
      '<button class="big-btn clue-btn" id="clue-btn">Show Next Clue</button>' +
      '<div class="mystery-choices" id="mystery-choices">' +
      choices.map(function (a) {
        return '<button class="choice-card" data-animal="' + a.id + '">' +
          animalVisualHTML(a) +
          '<span class="choice-name">' + a.name + '</span>' +
          '</button>';
      }).join('') +
      '</div></div></div>';

    $$('.choice-card', body).forEach(function (btn) {
      btn.addEventListener('click', function () { onMysteryChoice(btn); });
    });

    const clueBtn = document.getElementById('clue-btn');
    if (clueBtn) clueBtn.addEventListener('click', showNextClue);

    renderMysteryClues();
    updateHud('mystery');
  }

  function renderMysteryClues() {
    const m = state.mystery;
    if (!m) return;
    const animal = m.queue[m.index];
    if (!animal) return;

    const panel = document.getElementById('clue-panel');
    const btn = document.getElementById('clue-btn');
    if (!panel) return;

    const clues = animal.clues.slice(0, m.clueIndex + 1);
    panel.innerHTML = '<div class="clue-title">Clues</div>' + clues.map(function (text, i) {
      return '<div class="clue"><span class="clue-num">' + (i + 1) + '</span><span>' + text + '</span></div>';
    }).join('');

    if (btn) {
      if (m.clueIndex >= animal.clues.length - 1) {
        btn.textContent = 'All clues shown';
        btn.disabled = true;
      } else {
        btn.textContent = 'Show Next Clue';
        btn.disabled = false;
      }
    }

    updateHud('mystery');
  }

  function showNextClue() {
    const m = state.mystery;
    if (!m || m.lock) return;
    const animal = m.queue[m.index];
    if (!animal) return;
    if (m.clueIndex < animal.clues.length - 1) {
      m.clueIndex++;
      sfx.tap();
      renderMysteryClues();
    }
  }

  function revealMystery(animal) {
    const answer = document.getElementById('mystery-answer');
    if (answer) {
      answer.innerHTML = '<span class="answer-name">' + animal.emoji + ' ' + animal.name + '</span>' +
        '<span class="answer-fact">' + animal.fact + '</span>';
      answer.classList.add('show');
    }
    sfx.win();
    confettiBurst(90);
  }

  function onMysteryChoice(btn) {
    const m = state.mystery;
    if (!m || m.lock || btn.classList.contains('wrong')) return;
    const animal = m.queue[m.index];
    if (!animal) return;
    const chosen = ANIMALS_BY_ID[btn.dataset.animal];
    if (!chosen) return;

    if (chosen.id === animal.id) {
      m.lock = true;
      state.score += [3, 2, 1][m.clueIndex] || 1;
      btn.classList.add('correct');
      sfx.correct();
      revealMystery(animal);

      const article = /^[aeiou]/i.test(animal.name) ? 'an' : 'a';
      showToast('good', 'Great job! I am ' + article + ' ' + animal.name.toLowerCase() + '.', 1600);
      updateHud('mystery');

      const clueBtn = document.getElementById('clue-btn');
      if (clueBtn) clueBtn.style.display = 'none';

      const side = $('.mystery-side');
      if (side && !document.getElementById('mystery-next')) {
        const next = document.createElement('button');
        next.id = 'mystery-next';
        next.className = 'big-btn next-btn';
        next.textContent = 'Next Animal ➜';
        next.addEventListener('click', function () {
          sfx.tap();
          m.index++;
          renderMysteryQuestion();
        });
        side.appendChild(next);
      }
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      m.attempts++;
      sfx.wrong();
      showToast('bad', 'Try again!', 1100);
    }
  }

  function finishMystery() {
    const m = state.mystery;
    if (!m) return;
    const maxScore = m.total * 3;
    const stars = state.score >= maxScore * 0.8 ? 3 : state.score >= maxScore * 0.5 ? 2 : 1;
    showResult({
      emoji: '🕵️',
      title: 'Mystery Detective!',
      message: 'You solved ' + m.total + ' mystery animals!',
      stars: stars,
      score: state.score,
      replay: startMystery
    });
  }

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    } catch (e) {}
  }

  function init() {
    sizeCanvas();
    updateSoundButtons();
    showScreen('screen-menu');

    $$('.activity-card').forEach(function (card) {
      card.addEventListener('click', function () {
        sfx.tap();
        openMode(card.dataset.mode);
      });
    });

    document.addEventListener('click', function (e) {
      const actionEl = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      if (action === 'sound') { toggleSound(); return; }
      if (action === 'fullscreen') { toggleFullscreen(); return; }
      if (action === 'menu') { goMenu(); return; }
      if (action === 'hub') { window.location.href = '../index.html'; return; }
      if (action === 'restart') { restartMode(); return; }
    });

    window.addEventListener('resize', function () {
      sizeCanvas();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(redrawConnectLines, 120);
    });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        sizeCanvas();
        redrawConnectLines();
      }, 250);
    });

    document.addEventListener('fullscreenchange', function () {
      setTimeout(function () {
        sizeCanvas();
        redrawConnectLines();
      }, 120);
    });

    document.addEventListener('webkitfullscreenchange', function () {
      setTimeout(function () {
        sizeCanvas();
        redrawConnectLines();
      }, 120);
    });

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

    document.addEventListener('contextmenu', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('.game-body') || e.target.closest('.activity-grid') || e.target.closest('.menu-title-wrap')) {
        e.preventDefault();
      }
    });
  }

  init();
})();