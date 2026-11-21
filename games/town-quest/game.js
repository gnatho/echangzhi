/* ============================================================
   TOWN QUEST — game controller
   Four activities, one shared isometric town.
   ============================================================ */

(function () {
  'use strict';

  const D = TQ_DATA;
  const T = TQTown;

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  const state = {
    screen: 'menu',
    activity: null,
    sound: true,
    explore: null,
    build: null,
    picture: null,
    sentence: null
  };

  const timers = new Set();
  let toastTimer = null;
  let confettiRaf = null;
  let confettiParts = [];
  let audioCtx = null;

  const DEVICE = {
    dev: false,
    rotateEl: null,
    deviceEl: null
  };

  /* ------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------ */
  function randInt(n) { return Math.floor(Math.random() * n); }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function later(fn, ms) {
    const id = setTimeout(function () {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers.clear();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function starsFor(firstTry, total) {
    if (!total) return 1;
    const ratio = firstTry / total;
    return ratio >= 0.9 ? 3 : ratio >= 0.62 ? 2 : 1;
  }

  function relationPhrase(rel) {
    return D.REL_WORD[rel.type] || '';
  }

  /* ------------------------------------------------------------------
     Sound
     ------------------------------------------------------------------ */
  function ac() {
    if (!state.sound) return null;
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
    gain.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  const sfx = {
    tap: function () { tone(520, 0.07, 'sine', 0.05); },
    place: function () {
      tone(440, 0.08, 'triangle', 0.07);
      tone(660, 0.12, 'triangle', 0.06, 0.07);
    },
    correct: function () {
      tone(660, 0.11, 'triangle', 0.09);
      tone(880, 0.14, 'triangle', 0.08, 0.1);
      tone(1180, 0.18, 'triangle', 0.06, 0.2);
    },
    wrong: function () {
      tone(220, 0.14, 'triangle', 0.08);
      tone(165, 0.2, 'triangle', 0.07, 0.12);
    },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, 0.22, 'triangle', 0.07, i * 0.1);
      });
    }
  };

  function speak(text) {
    // Text-to-speech is disabled by default (TQ_CONFIG.tts).
    if (!D.CONFIG.tts) return;
    if (!text || !state.sound) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.92;
      u.pitch = 1.06;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* speech is a bonus, never required */
    }
  }

  function ttsOn() {
    return !!D.CONFIG.tts;
  }

  function listenBtnHTML(compact) {
    if (!ttsOn()) return '';
    return '<button class="listen-btn" data-x="listen" type="button">' +
      (compact ? '🔊' : '🔊 Listen') + '</button>';
  }

  function setSound(on) {
    state.sound = on;
    $$('[data-action="sound"]').forEach(function (btn) {
      btn.textContent = on ? '🔊' : '🔇';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function toggleSound() {
    setSound(!state.sound);
    if (state.sound) sfx.tap();
  }

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  function showToast(text, kind, ms) {
    const toast = $('#toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.className = 'toast show ' + (kind || 'good');
    toastTimer = setTimeout(function () {
      toast.className = 'toast ' + (kind || 'good');
    }, ms || 1600);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    if (toast) toast.className = 'toast';
  }

  /* ------------------------------------------------------------------
     Confetti
     ------------------------------------------------------------------ */
  const canvas = $('#confetti');
  const cctx = canvas ? canvas.getContext('2d') : null;

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function confettiBurst(count) {
    if (!cctx) return;
    const colors = ['#ff5d8f', '#ffb703', '#8ecae6', '#90be6d', '#c77dff', '#ff9770', '#4cc9f0', '#ffd166', '#ef476f'];
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight * 0.4;
    for (let i = 0; i < (count || 100); i++) {
      confettiParts.push({
        x: ox + (Math.random() - 0.5) * 90,
        y: oy + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * -15 - 4,
        g: 0.34 + Math.random() * 0.26,
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
    if (!cctx) {
      confettiRaf = null;
      return;
    }
    cctx.clearRect(0, 0, canvas.width, canvas.height);
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
      cctx.save();
      cctx.globalAlpha = Math.max(0, p.life);
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.fillStyle = p.c;
      cctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      cctx.restore();
    }
    if (confettiParts.length) {
      confettiRaf = requestAnimationFrame(confettiLoop);
    } else {
      confettiRaf = null;
      cctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ------------------------------------------------------------------
     Screens, HUD, result overlay
     ------------------------------------------------------------------ */
  function showScreen(id) {
    $$('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === id);
    });
    state.screen = id;
  }

  function updateHud(mode, progress, score) {
    const p = document.getElementById('progress-' + mode);
    const s = document.getElementById('score-' + mode);
    if (p) p.textContent = progress;
    if (s) s.textContent = '⭐ ' + score;
  }

  function hideResult() {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    overlay.className = 'result-overlay';
    overlay.innerHTML = '';
  }

  function showResult(opts) {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    const stars = opts.stars || 1;
    const actions = [];

    if (opts.next) {
      actions.push('<button class="btn primary" data-res="next" type="button">' +
        esc(opts.nextLabel || 'Next Level') + '</button>');
    }
    actions.push('<button class="btn ' + (opts.next ? 'secondary' : 'primary') +
      '" data-res="replay" type="button">Play Again</button>');
    actions.push('<button class="btn secondary" data-res="menu" type="button">Main Menu</button>');

    overlay.className = 'result-overlay show' + (opts.soft ? ' soft' : '');
    overlay.innerHTML = '<div class="result-card">' +
      '<div class="result-emoji">' + (opts.emoji || '🎉') + '</div>' +
      '<h2>' + (opts.title || 'Well done!') + '</h2>' +
      '<p>' + (opts.message || '') + '</p>' +
      '<div class="result-stars">' + [0, 1, 2].map(function (i) {
        return '<span class="' + (i < stars ? 'on' : '') + '">★</span>';
      }).join('') + '</div>' +
      '<div class="result-score">Score: ' + (opts.score || 0) + '</div>' +
      '<div class="result-actions">' + actions.join('') + '</div>' +
      '</div>';

    const nextBtn = overlay.querySelector('[data-res="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        if (opts.next) opts.next();
      });
    }
    const replayBtn = overlay.querySelector('[data-res="replay"]');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        if (opts.replay) opts.replay();
      });
    }
    const menuBtn = overlay.querySelector('[data-res="menu"]');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        goMenu();
      });
    }

    if (opts.soft) {
      confettiBurst(90);
    } else {
      sfx.win();
      confettiBurst(150);
    }
  }

  /* ------------------------------------------------------------------
     Device gates
     ------------------------------------------------------------------ */
  function isTabletDevice() {
    const ua = navigator.userAgent || '';
    const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    const android = /Android/i.test(ua);
    const ipad = /iPad/i.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    const shortSide = Math.min(screen.width, screen.height);
    const tabletSize = shortSide >= (D.CONFIG.minTabletShortSide || 600);
    return (android || ipad) && touch && tabletSize;
  }

  function updateGates() {
    if (!DEVICE.rotateEl) return;
    if (DEVICE.dev) {
      DEVICE.rotateEl.classList.remove('show');
      DEVICE.deviceEl.classList.remove('show');
      return;
    }
    const portrait = window.innerHeight > window.innerWidth;
    DEVICE.rotateEl.classList.toggle('show', portrait);
    DEVICE.deviceEl.classList.toggle('show', !portrait && !isTabletDevice());
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(function () {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  /* ------------------------------------------------------------------
     Menu / activity intros
     ------------------------------------------------------------------ */
  const INTRO = {
    explore: {
      emoji: '🔎',
      title: 'Explore the Town',
      text: 'Look at the town. Find places and describe where they are.',
      options: [
        { kind: 'find', name: 'Find the Place', desc: 'Read and tap the right building.', cls: '' },
        { kind: 'describe', name: 'Look & Describe', desc: 'Choose the sentence that matches the map.', cls: 'blue' }
      ]
    },
    picture: {
      emoji: '👀',
      title: 'Which Picture?',
      text: 'Read the sentence. Tap the picture that shows it.',
      options: [
        { kind: 'picture', diff: 'easy', name: 'Easy', desc: 'One clear sentence · 6 pictures', cls: '' },
        { kind: 'picture', diff: 'medium', name: 'Medium', desc: 'All four expressions · 6 pictures', cls: 'blue' },
        { kind: 'picture', diff: 'challenge', name: 'Challenge', desc: 'Between and two-clue sentences', cls: 'orange' }
      ]
    },
    sentence: {
      emoji: '📝',
      title: 'Make a Sentence',
      text: 'Tap the word tiles in order to make a sentence.',
      options: [
        { kind: 'sentence', diff: 'easy', name: 'Easy', desc: 'Short sentences · next to & behind', cls: '' },
        { kind: 'sentence', diff: 'medium', name: 'Medium', desc: 'In front of · extra word tiles', cls: 'blue' },
        { kind: 'sentence', diff: 'challenge', name: 'Challenge', desc: 'Between · long sentences', cls: 'orange' }
      ]
    }
  };

  function openActivity(mode) {
    clearTimers();
    hideResult();
    hideToast();
    if (ttsOn() && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    state.activity = mode;
    state.explore = null;
    state.build = null;
    state.picture = null;
    state.sentence = null;
    showScreen('screen-' + mode);
    const startLabel = mode === 'build' ? 'Choose a level'
      : mode === 'explore' ? 'Choose a mode' : 'Choose a difficulty';
    updateHud(mode, startLabel, 0);
    renderIntro(mode);
    sfx.tap();
  }

  function renderIntro(mode) {
    const body = document.getElementById('body-' + mode);
    if (!body) return;
    let optionsHTML = '';
    let title = '';
    let text = '';
    let emoji = '';

    if (mode === 'explore') {
      const info = INTRO.explore;
      emoji = info.emoji;
      title = info.title;
      text = info.text;
      optionsHTML = '<div class="diff-grid">' + info.options.map(function (o) {
        return '<button class="diff-btn ' + o.cls + '" data-start="' + o.kind + '" type="button">' +
          '<span class="diff-name">' + esc(o.name) + '</span>' +
          '<span class="diff-desc">' + esc(o.desc) + '</span></button>';
      }).join('') + '</div>';
    } else if (mode === 'build') {
      emoji = '🏗️';
      title = 'Build the Town';
      text = 'Read the instruction. Tap the building in the tray, then tap the empty spot.';
      optionsHTML = '<div class="diff-grid">' + D.BUILD_LEVELS.map(function (level, i) {
        return '<button class="diff-btn ' + (i === 1 ? 'blue' : i === 2 ? 'orange' : '') +
          '" data-start="level" data-level="' + i + '" type="button">' +
          '<span class="diff-name">' + esc(level.name) + '</span>' +
          '<span class="diff-desc">' + esc(level.subtitle) + ' · ' + level.missions.length +
          ' instruction' + (level.missions.length === 1 ? '' : 's') + '</span></button>';
      }).join('') + '</div>';
    } else {
      const info = INTRO[mode];
      emoji = info.emoji;
      title = info.title;
      text = info.text;
      optionsHTML = '<div class="diff-grid">' + info.options.map(function (o) {
        return '<button class="diff-btn ' + o.cls + '" data-start="' + o.kind + '" data-diff="' +
          o.diff + '" type="button">' +
          '<span class="diff-name">' + esc(o.name) + '</span>' +
          '<span class="diff-desc">' + esc(o.desc) + '</span></button>';
      }).join('') + '</div>';
    }

    body.innerHTML = '<div class="intro-wrap"><div class="intro-card">' +
      '<div class="intro-emoji" aria-hidden="true">' + emoji + '</div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p>' + esc(text) + '</p>' +
      optionsHTML +
      '</div></div>';

    $$('[data-start]', body).forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfx.tap();
        const kind = btn.getAttribute('data-start');
        if (kind === 'find' || kind === 'describe') startExplore(kind);
        else if (kind === 'level') startBuild(Number(btn.getAttribute('data-level')));
        else if (kind === 'picture') startPicture(btn.getAttribute('data-diff'));
        else if (kind === 'sentence') startSentence(btn.getAttribute('data-diff'));
      });
    });
  }

  function goMenu() {
    clearTimers();
    hideResult();
    hideToast();
    if (ttsOn() && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    state.activity = null;
    state.explore = null;
    state.build = null;
    state.picture = null;
    state.sentence = null;
    showScreen('screen-menu');
    sfx.tap();
  }

  function restartCurrent() {
    const activity = state.activity;
    if (!activity) {
      goMenu();
      return;
    }
    clearTimers();
    hideResult();
    hideToast();
    if (activity === 'explore' && state.explore) {
      startExplore(state.explore.mode);
    } else if (activity === 'build' && state.build) {
      startBuild(state.build.levelIndex);
    } else if (activity === 'picture' && state.picture) {
      startPicture(state.picture.level);
    } else if (activity === 'sentence' && state.sentence) {
      startSentence(state.sentence.level);
    } else {
      openActivity(activity);
    }
  }

  /* ------------------------------------------------------------------
     Shared map helpers
     ------------------------------------------------------------------ */
  function bindBuildingTaps(frame, handler) {
    if (!frame) return;
    $$('.tq-bld', frame).forEach(function (g) {
      g.addEventListener('click', function () {
        handler(g.getAttribute('data-id'), g);
      });
    });
  }

  function bindPadTaps(frame, handler) {
    if (!frame) return;
    $$('.tq-pad', frame).forEach(function (g) {
      g.addEventListener('click', function () {
        handler(Number(g.getAttribute('data-col')), Number(g.getAttribute('data-row')), g);
      });
    });
  }

  function compassHTML() {
    return '<div class="compass" aria-hidden="true">' +
      '<span class="compass-row back"><span class="arrow">↑</span>BACK</span>' +
      '<span class="compass-dot">·</span>' +
      '<span class="compass-row front"><span class="arrow">↓</span>FRONT</span>' +
      '</div>';
  }

  function bindListen(text) {
    if (!ttsOn()) return;
    const body = $('.screen.active .game-body');
    const btn = body && body.querySelector('[data-x="listen"]');
    if (btn) {
      btn.addEventListener('click', function () {
        if (!state.sound) setSound(true);
        sfx.tap();
        speak(text);
      });
    }
  }

  function setFeedback(mode, text, kind) {
    const el = document.getElementById('feedback-' + mode);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('good', 'bad');
    if (kind) el.classList.add(kind);
  }

  /* ==================================================================
     ACTIVITY 1 — EXPLORE THE TOWN
     ================================================================== */
  function startExplore(mode) {
    clearTimers();
    hideResult();
    hideToast();
    state.activity = 'explore';
    const items = mode === 'find'
      ? shuffle(D.FIND_IDS.map(function (id) { return { kind: 'find', id: id }; }))
      : shuffle(D.DESCRIBE.map(function (q) { return { kind: 'q', q: q }; }));

    state.explore = {
      mode: mode,
      items: items,
      index: 0,
      score: 0,
      firstTry: 0,
      attempts: 0,
      labels: mode !== 'find',
      highlight: [],
      focus: [],
      picks: [],
      pairA: null,
      pairB: null,
      options: null,
      locked: false
    };
    showScreen('screen-explore');
    renderExplore();
  }

  function renderExplore() {
    const ex = state.explore;
    if (!ex) return;
    if (ex.index >= ex.items.length) {
      finishExplore();
      return;
    }
    ex.attempts = 0;
    ex.highlight = [];
    ex.focus = [];
    ex.picks = [];
    ex.options = null;
    ex.locked = false;
    ex.pairA = null;
    ex.pairB = null;

    const item = ex.items[ex.index];
    if (item.kind === 'find') renderExploreFind(item);
    else if (item.q.type === 'pick') renderExplorePick(item.q);
    else renderExplorePair(item.q);
  }

  function exploreMapHTML() {
    const ex = state.explore;
    return T.renderScene({
      variant: 'town',
      cols: D.MAIN_TOWN.cols,
      rows: D.MAIN_TOWN.rows,
      buildings: D.MAIN_TOWN.buildings,
      labels: ex.labels,
      bigLabels: true,
      highlight: ex.highlight,
      focus: ex.focus,
      slice: true
    });
  }

  function drawExploreMap(interactive, handler) {
    const frame = document.getElementById('explore-map');
    if (!frame) return;
    frame.innerHTML = exploreMapHTML();
    if (interactive && handler) bindBuildingTaps(frame, handler);
  }

  function renderExploreFind(item) {
    const ex = state.explore;
    const b = D.BY_ID[item.id];
    const body = document.getElementById('body-explore');

    body.innerHTML =
      '<div class="play-grid">' +
      '<aside class="side-panel">' +
      '<div class="panel-top"><span class="mode-pill">🔎 Find the place</span>' +
      '<span class="step-pill">' + (ex.index + 1) + ' / ' + ex.items.length + '</span></div>' +
      '<div class="prompt">Find the <b>' + esc(b.name) + '</b>!</div>' +
      listenBtnHTML() +
      '<div class="quest-art" aria-hidden="true">' +
      '<span class="quest-art-bg"></span>' +
      '<span class="quest-art-icon">🔎</span>' +
      '</div>' +
      '<div class="feedback" id="feedback-explore">Tap the correct place on the map.</div>' +
      '<button class="ghost-btn" data-x="labels" type="button">🏷️ ' +
      (ex.labels ? 'Hide labels' : 'Show labels') + '</button>' +
      '</aside>' +
      '<div class="map-wrap"><div class="map-frame" id="explore-map"></div>' + compassHTML() + '</div>' +
      '</div>';

    drawExploreMap(true, onExploreFindTap);
    updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
    bindListen('Find the ' + b.name + '!');

    const labelsBtn = body.querySelector('[data-x="labels"]');
    if (labelsBtn) {
      labelsBtn.addEventListener('click', function () {
        ex.labels = !ex.labels;
        sfx.tap();
        drawExploreMap(true, onExploreFindTap);
        labelsBtn.textContent = '🏷️ ' + (ex.labels ? 'Hide labels' : 'Show labels');
      });
    }
  }

  function onExploreFindTap(id, group) {
    const ex = state.explore;
    if (!ex || ex.locked) return;
    const item = ex.items[ex.index];
    if (!item || item.kind !== 'find') return;

    if (id === item.id) {
      ex.locked = true;
      ex.score += ex.attempts === 0 ? 10 : 5;
      if (ex.attempts === 0) ex.firstTry++;
      ex.highlight = [id];
      drawExploreMap(false);
      updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
      setFeedback('explore', 'Yes! That is the ' + D.BY_ID[id].name + '.', 'good');
      showToast('⭐ Well done!', 'good');
      sfx.correct();
      later(nextExplore, 1500);
    } else {
      ex.attempts++;
      group.classList.add('is-wrong');
      later(function () { group.classList.remove('is-wrong'); }, 550);
      setFeedback('explore', 'Almost! Look again and tap another place.', 'bad');
      showToast('💛 Try again!', 'bad');
      sfx.wrong();
    }
  }

  function renderExplorePick(q) {
    const ex = state.explore;
    const body = document.getElementById('body-explore');
    const options = shuffle([{ fact: q.fact, ok: true }].concat(q.wrong.map(function (f) {
      return { fact: f, ok: false };
    })));
    ex.options = options;

    body.innerHTML =
      '<div class="play-grid">' +
      '<aside class="side-panel">' +
      '<div class="panel-top"><span class="mode-pill">💬 Look and describe</span>' +
      '<span class="step-pill">' + (ex.index + 1) + ' / ' + ex.items.length + '</span></div>' +
      '<div class="prompt">Where is the <b>' + esc(D.BY_ID[q.fact.a].name) + '</b>?</div>' +
      listenBtnHTML() +
      '<div class="answer-list" id="explore-answers">' +
      options.map(function (o, i) {
        return '<button class="answer-btn" data-i="' + i + '" type="button">' +
          esc(D.factSentence(o.fact)) + '</button>';
      }).join('') +
      '</div>' +
      '<div class="feedback" id="feedback-explore">Choose the sentence that matches the map.</div>' +
      '</aside>' +
      '<div class="map-wrap"><div class="map-frame" id="explore-map"></div>' + compassHTML() + '</div>' +
      '</div>';

    drawExploreMap(false);
    updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
    bindListen('Where is the ' + D.BY_ID[q.fact.a].name + '?');

    $$('#explore-answers .answer-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onExploreAnswer(btn, Number(btn.getAttribute('data-i')));
      });
    });
  }

  function onExploreAnswer(btn, index) {
    const ex = state.explore;
    if (!ex || ex.locked || !ex.options) return;
    const opt = ex.options[index];
    if (!opt) return;
    const item = ex.items[ex.index];
    const q = item.q;

    if (opt.ok) {
      ex.locked = true;
      ex.score += ex.attempts === 0 ? 10 : 5;
      if (ex.attempts === 0) ex.firstTry++;
      btn.classList.add('correct');
      $$('#explore-answers .answer-btn').forEach(function (b) { b.disabled = true; });
      ex.highlight = [q.fact.a];
      ex.focus = [q.fact.b, q.fact.c].filter(Boolean);
      drawExploreMap(false);
      updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
      setFeedback('explore', 'Yes! ' + D.factSentence(q.fact), 'good');
      showToast('✅ Well done!', 'good');
      sfx.correct();
      later(nextExplore, 1700);
    } else {
      ex.attempts++;
      btn.classList.add('wrong');
      later(function () { btn.classList.remove('wrong'); }, 600);
      setFeedback('explore', 'Not quite. Look at the map and try again.', 'bad');
      showToast('💛 Look again!', 'bad');
      sfx.wrong();
    }
  }

  function renderExplorePair(q) {
    const ex = state.explore;
    const body = document.getElementById('body-explore');
    const a = D.BY_ID[q.fact.a];
    const b = D.BY_ID[q.fact.b];
    ex.pairA = a.id;
    ex.pairB = b.id;

    body.innerHTML =
      '<div class="play-grid">' +
      '<aside class="side-panel">' +
      '<div class="panel-top"><span class="mode-pill">👆 Tap two places</span>' +
      '<span class="step-pill">' + (ex.index + 1) + ' / ' + ex.items.length + '</span></div>' +
      '<div class="pair-sentence">' + esc(D.factSentence(q.fact)) + '</div>' +
      '<div class="prompt">Tap the <b>' + esc(a.name) + '</b>, then the <b>' + esc(b.name) + '</b>.</div>' +
      listenBtnHTML() +
      '<div class="pair-chips">' +
      '<span class="pair-chip" id="pair-1"><span class="n">1</span><span class="t">?</span></span>' +
      '<span class="pair-chip" id="pair-2"><span class="n">2</span><span class="t">?</span></span>' +
      '</div>' +
      '<div class="panel-spacer"></div>' +
      '<div class="feedback" id="feedback-explore">Tap the first place on the map.</div>' +
      '</aside>' +
      '<div class="map-wrap"><div class="map-frame" id="explore-map"></div>' + compassHTML() + '</div>' +
      '</div>';

    drawExploreMap(true, onExplorePairTap);
    updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
    bindListen(D.factSentence(q.fact));
  }

  function updatePairChips() {
    const ex = state.explore;
    if (!ex) return;
    [0, 1].forEach(function (i) {
      const chip = document.getElementById('pair-' + (i + 1));
      if (!chip) return;
      const id = ex.picks[i];
      chip.classList.toggle('on', !!id);
      const t = chip.querySelector('.t');
      if (t) t.textContent = id ? D.BY_ID[id].name : '?';
    });
  }

  function onExplorePairTap(id, group) {
    const ex = state.explore;
    if (!ex || ex.locked) return;
    const a = ex.pairA;
    const b = ex.pairB;

    if (id === ex.picks[0]) return;

    if (id !== a && id !== b) {
      group.classList.add('is-wrong');
      later(function () { group.classList.remove('is-wrong'); }, 550);
      setFeedback('explore', 'Tap the ' + D.BY_ID[a].name + ' or the ' + D.BY_ID[b].name + '.', 'bad');
      sfx.wrong();
      return;
    }

    ex.picks.push(id);
    ex.focus = ex.picks.slice();
    sfx.tap();
    updatePairChips();

    if (ex.picks.length === 1) {
      drawExploreMap(true, onExplorePairTap);
      setFeedback('explore', 'Good. Now tap the ' + D.BY_ID[b].name + '.', '');
      return;
    }

    // Two picks: check the order.
    drawExploreMap(false);
    if (ex.picks[0] === a && ex.picks[1] === b) {
      ex.locked = true;
      ex.score += ex.attempts === 0 ? 10 : 5;
      if (ex.attempts === 0) ex.firstTry++;
      ex.highlight = [a, b];
      ex.focus = [];
      drawExploreMap(false);
      updateHud('explore', 'Question ' + (ex.index + 1) + ' / ' + ex.items.length, ex.score);
      setFeedback('explore', 'Yes! The ' + D.BY_ID[a].name + ' is ' + relationPhrase(ex.items[ex.index].q.fact) +
        ' the ' + D.BY_ID[b].name + '.', 'good');
      showToast('⭐ Well done!', 'good');
      sfx.correct();
      later(nextExplore, 1700);
    } else {
      ex.attempts++;
      ex.locked = true;
      sfx.wrong();
      setFeedback('explore', 'Almost! The ' + D.BY_ID[a].name + ' comes first.', 'bad');
      showToast('💛 Try again!', 'bad');
      later(function () {
        ex.picks = [];
        ex.focus = [];
        ex.locked = false;
        updatePairChips();
        drawExploreMap(true, onExplorePairTap);
        setFeedback('explore', 'Tap the ' + D.BY_ID[a].name + ' first.', '');
      }, 1200);
    }
  }

  function nextExplore() {
    const ex = state.explore;
    if (!ex) return;
    ex.index++;
    if (ex.index >= ex.items.length) finishExplore();
    else renderExplore();
  }

  function finishExplore() {
    const ex = state.explore;
    if (!ex) return;
    const total = ex.items.length;
    updateHud('explore', 'Complete', ex.score);
    showResult({
      emoji: ex.mode === 'find' ? '🏙️' : '💬',
      title: ex.mode === 'find' ? 'Town Explorer!' : 'Town Talker!',
      message: 'You got ' + ex.firstTry + ' of ' + total + ' right on the first try.',
      stars: starsFor(ex.firstTry, total),
      score: ex.score,
      replay: function () { startExplore(ex.mode); }
    });
  }

  /* ==================================================================
     ACTIVITY 2 — BUILD THE TOWN
     ================================================================== */
  function startBuild(levelIndex) {
    clearTimers();
    hideResult();
    hideToast();
    state.activity = 'build';
    const level = D.BUILD_LEVELS[levelIndex];
    if (!level) return;
    const placed = level.preplaced.map(function (b) {
      return { id: b.id, col: b.col, row: b.row };
    });
    const trayIds = [];
    level.missions.forEach(function (m) {
      if (trayIds.indexOf(m.building) === -1) trayIds.push(m.building);
    });

    state.build = {
      levelIndex: levelIndex,
      level: level,
      placed: placed,
      index: 0,
      score: 0,
      firstTry: 0,
      attempts: 0,
      selected: null,
      locked: false,
      target: null,
      trayIds: trayIds,
      pop: null
    };
    showScreen('screen-build');
    startBuildMission();
  }

  function buildPositions() {
    const b = state.build;
    const pos = {};
    b.placed.forEach(function (p) { pos[p.id] = { col: p.col, row: p.row }; });
    return pos;
  }

  function buildOccupied() {
    const set = {};
    state.build.placed.forEach(function (p) { set[p.col + ',' + p.row] = p.id; });
    return set;
  }

  function startBuildMission() {
    const b = state.build;
    if (!b) return;
    b.attempts = 0;
    b.selected = null;
    b.locked = false;
    b.pop = null;
    if (b.index >= b.level.missions.length) {
      finishBuildLevel();
      return;
    }
    const m = b.level.missions[b.index];
    const occupied = buildOccupied();
    const candidates = D.candidateCells(m.rel, buildPositions(), b.level.cols, b.level.rows)
      .filter(function (c) { return !occupied[c.col + ',' + c.row]; });
    b.target = candidates.length === 1 ? candidates[0] : (candidates[0] || null);
    renderBuild();
  }

  function renderBuild() {
    const b = state.build;
    if (!b) return;
    const body = document.getElementById('body-build');
    const m = b.level.missions[b.index];
    if (!m) return;
    const req = D.BY_ID[m.building];
    const occupied = buildOccupied();
    const empty = [];
    for (let row = 0; row < b.level.rows; row++) {
      for (let col = 0; col < b.level.cols; col++) {
        if (!occupied[col + ',' + row]) empty.push({ col: col, row: row });
      }
    }

    const refs = m.rel.type === 'between' ? m.rel.refs : [m.rel.ref];
    const focus = b.selected ? refs.slice() : [];

    body.innerHTML =
      '<div class="play-grid">' +
      '<aside class="side-panel">' +
      '<div class="panel-top"><span class="mode-pill">🏗️ ' + esc(b.level.name) + '</span>' +
      '<span class="step-pill">Step ' + (b.index + 1) + ' / ' + b.level.missions.length + '</span></div>' +
      '<div class="prompt">' + esc(D.buildInstruction(m)) + '</div>' +
      listenBtnHTML() +
      '<div class="tray" id="build-tray">' +
      b.trayIds.map(function (id) {
        const placedHere = b.placed.some(function (p) { return p.id === id; });
        return '<button class="tray-item' +
          (b.selected === id ? ' selected' : '') +
          (placedHere ? ' done' : '') +
          '" data-bid="' + id + '" type="button">' +
          '<span class="tray-art">' + T.renderIcon(id) + '</span>' +
          '<span class="tray-name">' + esc(D.BY_ID[id].name) + '</span>' +
          '</button>';
      }).join('') +
      '</div>' +
      '<div class="tray-tip">1. Tap the <b>' + esc(req.name) + '</b>.  2. Tap a glowing spot.</div>' +
      '<div class="build-art" aria-hidden="true">' +
      '<span class="build-art-bg"></span><span class="build-art-icon">🏗️</span>' +
      '</div>' +
      '<div class="feedback" id="feedback-build">' +
      (b.selected ? 'Now tap a glowing spot on the map.' : 'Tap the ' + esc(req.name) + ' in the tray first.') +
      '</div>' +
      '</aside>' +
      '<div class="map-wrap"><div class="map-frame" id="build-map"></div>' + compassHTML() + '</div>' +
      '</div>';

    const frame = document.getElementById('build-map');
    if (frame) {
      frame.innerHTML = T.renderScene({
        variant: 'town',
        cols: b.level.cols,
        rows: b.level.rows,
        buildings: b.placed,
        labels: true,
        bigLabels: true,
        road: false,
        empty: b.selected ? empty : [],
        emptyHint: !!b.selected,
        focus: focus,
        pop: b.pop
      });
      bindPadTaps(frame, onBuildPad);
      b.pop = null;
    }

    $$('#build-tray .tray-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onBuildTray(btn.getAttribute('data-bid'), btn);
      });
    });

    updateHud('build', 'Step ' + (b.index + 1) + ' / ' + b.level.missions.length, b.score);
    bindListen(D.buildInstruction(m));
  }

  function onBuildTray(id, btn) {
    const b = state.build;
    if (!b || b.locked) return;
    const m = b.level.missions[b.index];
    if (!m) return;
    if (btn.classList.contains('done')) return;

    if (id !== m.building) {
      setFeedback('build', 'We need the ' + D.BY_ID[m.building].name + ' now. Tap it in the tray.', 'bad');
      showToast('💛 Tap the ' + D.BY_ID[m.building].name + '.', 'bad');
      sfx.wrong();
      return;
    }

    b.selected = id;
    sfx.tap();
    renderBuild();
    setFeedback('build', 'Great! Now tap a glowing spot on the map.', '');
  }

  function onBuildPad(col, row, padEl) {
    const b = state.build;
    if (!b || b.locked) return;
    const m = b.level.missions[b.index];
    if (!m) return;

    if (!b.selected) {
      setFeedback('build', 'First tap the ' + D.BY_ID[m.building].name + ' in the tray.', 'bad');
      sfx.wrong();
      return;
    }

    const target = b.target;
    if (target && col === target.col && row === target.row) {
      b.locked = true;
      b.placed.push({ id: m.building, col: col, row: row });
      b.selected = null;
      b.pop = m.building;
      const first = b.attempts === 0;
      b.score += first ? 10 : 5;
      if (first) b.firstTry++;
      renderBuild();
      setFeedback('build', 'Yes! The ' + D.BY_ID[m.building].name + ' is ' +
        relationPhrase(m.rel) + ' the ' + rebRefNames(m) + '.', 'good');
      showToast('✅ Great job!', 'good');
      sfx.correct();
      later(function () {
        b.index++;
        startBuildMission();
      }, 1400);
    } else {
      b.attempts++;
      padEl.classList.add('is-wrong');
      later(function () { padEl.classList.remove('is-wrong'); }, 550);
      setFeedback('build', 'Not quite. Look at the town and try again.', 'bad');
      showToast('💛 Try again!', 'bad');
      sfx.wrong();
    }
  }

  function rebRefNames(m) {
    if (m.rel.type === 'between') {
      return D.BY_ID[m.rel.refs[0]].name + ' and the ' + D.BY_ID[m.rel.refs[1]].name;
    }
    return D.BY_ID[m.rel.ref].name;
  }

  function finishBuildLevel() {
    const b = state.build;
    if (!b) return;
    const total = b.level.missions.length;
    const stars = starsFor(b.firstTry, total);
    const isLast = b.levelIndex >= D.BUILD_LEVELS.length - 1;
    updateHud('build', isLast ? 'Town complete!' : 'Level complete!', b.score);

    const panel = document.querySelector('#body-build .side-panel');
    if (!panel) return;

    panel.innerHTML =
      '<div class="win-card">' +
      '<div class="win-emoji" aria-hidden="true">🎉</div>' +
      '<h2>Great job! You built a town!</h2>' +
      '<p>' + (isLast
        ? 'You built the whole town! ' + b.firstTry + ' of ' + total +
          ' were right on the first try.'
        : 'You placed ' + total + ' building' + (total === 1 ? '' : 's') + ' in ' + esc(b.level.name) +
          '. ' + b.firstTry + ' of ' + total + ' were right on the first try.') + '</p>' +
      '<div class="result-stars">' + [0, 1, 2].map(function (i) {
        return '<span class="' + (i < stars ? 'on' : '') + '">★</span>';
      }).join('') + '</div>' +
      '<div class="win-score">Score: ' + b.score + '</div>' +
      '<div class="win-actions">' +
      (!isLast ? '<button class="btn primary" data-win="next" type="button">Next Level</button>' : '') +
      '<button class="btn ' + (isLast ? 'primary' : 'secondary') +
      '" data-win="replay" type="button">Play Again</button>' +
      '<button class="btn secondary" data-win="menu" type="button">Main Menu</button>' +
      '</div>' +
      '</div>';

    const nextBtn = panel.querySelector('[data-win="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        sfx.tap();
        startBuild(b.levelIndex + 1);
      });
    }
    const replayBtn = panel.querySelector('[data-win="replay"]');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        sfx.tap();
        startBuild(b.levelIndex);
      });
    }
    const menuBtn = panel.querySelector('[data-win="menu"]');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        sfx.tap();
        goMenu();
      });
    }

    sfx.win();
    confettiBurst(130);
  }

  /* ==================================================================
     ACTIVITY 3 — WHICH PICTURE?
     ================================================================== */
  function startPicture(level) {
    clearTimers();
    hideResult();
    hideToast();
    state.activity = 'picture';
    const pool = D.PICTURE_QUESTIONS.filter(function (q) { return q.level === level; });
    state.picture = {
      level: level,
      items: shuffle(pool),
      index: 0,
      score: 0,
      firstTry: 0,
      attempts: 0,
      options: [],
      locked: false
    };
    showScreen('screen-picture');
    renderPicture();
  }

  function renderPicture() {
    const pic = state.picture;
    if (!pic) return;
    if (pic.index >= pic.items.length) {
      finishPicture();
      return;
    }
    pic.attempts = 0;
    pic.locked = false;

    const item = pic.items[pic.index];
    let options;
    if (item.layouts) {
      options = item.layouts.map(function (layout) {
        const pos = D.positionsOf(layout);
        return {
          layout: layout,
          ok: item.clauses.every(function (clause) { return D.factIsTrue(clause, pos); })
        };
      });
    } else {
      const layouts = D.pictureLayouts(item.clauses[0]);
      options = layouts.map(function (layout, i) {
        return { layout: layout, ok: i === 0 };
      });
    }
    // Safety: always exactly one correct picture.
    if (options.filter(function (o) { return o.ok; }).length !== 1) {
      console.warn('[Town Quest] picture question does not have exactly one correct layout', item);
    }
    pic.options = shuffle(options);

    const sentence = D.pictureSentence(item.clauses);
    const body = document.getElementById('body-picture');
    const letters = ['A', 'B', 'C'];

    body.innerHTML =
      '<div class="pic-layout">' +
      '<div class="pic-top">' +
      '<span class="mode-pill">👀 Which picture?</span>' +
      '<div class="pic-sentence">' + highlightRel(sentence) + '</div>' +
      listenBtnHTML(true) +
      '</div>' +
      '<div class="pic-options" id="pic-options">' +
      pic.options.map(function (o, i) {
        return '<button class="pic-card" data-i="' + i + '" type="button" aria-label="Picture ' +
          letters[i] + '">' +
          '<span class="pic-letter">' + letters[i] + '</span>' +
          '<span class="pic-art">' +
          T.renderScene({
            variant: 'mini',
            cols: 3,
            rows: 3,
            buildings: o.layout,
            labels: true
          }) +
          '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="pic-hint" id="feedback-picture">Tap the picture that matches the sentence.</div>' +
      '</div>';

    updateHud('picture', 'Picture ' + (pic.index + 1) + ' / ' + pic.items.length, pic.score);
    bindListen(sentence);

    $$('#pic-options .pic-card').forEach(function (card) {
      card.addEventListener('click', function () {
        onPictureChoice(card, Number(card.getAttribute('data-i')));
      });
    });
  }

  function highlightRel(sentence) {
    return esc(sentence).replace(/\b(in front of|next to|behind|between)\b/g,
      '<span class="rel">$1</span>');
  }

  function onPictureChoice(card, index) {
    const pic = state.picture;
    if (!pic || pic.locked) return;
    const opt = pic.options[index];
    if (!opt) return;

    if (opt.ok) {
      pic.locked = true;
      pic.score += pic.attempts === 0 ? 10 : 5;
      if (pic.attempts === 0) pic.firstTry++;
      card.classList.add('correct');
      updateHud('picture', 'Picture ' + (pic.index + 1) + ' / ' + pic.items.length, pic.score);
      setFeedback('picture', 'Yes! That picture matches the sentence.', 'good');
      showToast('⭐ Well done!', 'good');
      sfx.correct();
      later(nextPicture, 1600);
    } else {
      pic.attempts++;
      card.classList.add('wrong');
      later(function () { card.classList.remove('wrong'); }, 700);
      setFeedback('picture', 'Not quite. Read the sentence and look again.', 'bad');
      showToast('💛 Look carefully!', 'bad');
      sfx.wrong();
    }
  }

  function nextPicture() {
    const pic = state.picture;
    if (!pic) return;
    pic.index++;
    if (pic.index >= pic.items.length) finishPicture();
    else renderPicture();
  }

  function finishPicture() {
    const pic = state.picture;
    if (!pic) return;
    const total = pic.items.length;
    updateHud('picture', 'Complete', pic.score);
    showResult({
      emoji: '🖼️',
      title: 'Picture Perfect!',
      message: 'You chose the right picture ' + pic.firstTry + ' of ' + total +
        ' times on the first try.',
      stars: starsFor(pic.firstTry, total),
      score: pic.score,
      replay: function () { startPicture(pic.level); }
    });
  }

  /* ==================================================================
     ACTIVITY 4 — MAKE A SENTENCE
     ================================================================== */
  function startSentence(level) {
    clearTimers();
    hideResult();
    hideToast();
    state.activity = 'sentence';
    const pool = D.SENTENCE_QUESTIONS.filter(function (q) { return q.level === level; });
    state.sentence = {
      level: level,
      items: shuffle(pool),
      index: 0,
      score: 0,
      firstTry: 0,
      attempts: 0,
      locked: false,
      targetWords: [],
      tiles: [],
      order: [],
      placed: []
    };
    showScreen('screen-sentence');
    renderSentence();
  }

  function renderSentence() {
    const s = state.sentence;
    if (!s) return;
    if (s.index >= s.items.length) {
      finishSentence();
      return;
    }
    const item = s.items[s.index];
    const targetWords = D.sentenceWords(item.fact, item.alt);
    let tiles = targetWords.map(function (w, i) {
      return { uid: 't' + i, word: w };
    });
    (item.extras || []).forEach(function (w, i) {
      tiles.push({ uid: 'x' + i, word: w });
    });
    s.targetWords = targetWords;
    s.tiles = tiles;
    s.order = shuffle(tiles.map(function (t) { return t.uid; }));
    s.placed = [];
    s.attempts = 0;
    s.locked = false;

    const question = 'Where is the ' + D.BY_ID[item.fact.a].name + '?';
    const scene = D.sceneForFact(item.fact);
    const refs = item.fact.type === 'between'
      ? [item.fact.b, item.fact.c]
      : [item.fact.b];
    const dims = item.fact.type === 'between' ? { cols: 3, rows: 3 } : { cols: 2, rows: 2 };

    const body = document.getElementById('body-sentence');
    body.innerHTML =
      '<div class="sentence-layout">' +
      '<div class="work-panel">' +
      '<div class="panel-top"><span class="mode-pill">📝 Make a sentence</span>' +
      '<span class="step-pill">' + (s.index + 1) + ' / ' + s.items.length + '</span></div>' +
      '<div class="sentence-q">' + esc(question) + '</div>' +
      listenBtnHTML() +
      '<div class="answer-slots" id="answer-slots"></div>' +
      '<div class="word-bank">' +
      '<div class="word-bank-head"><span>🔤 Word tiles</span><span>Tap to add · tap again to remove</span></div>' +
      '<div class="tile-pool" id="tile-pool"></div>' +
      '</div>' +
      '<div class="sentence-actions">' +
      '<button class="ghost-btn" data-x="clear" type="button">↺ Clear</button>' +
      '<div class="feedback" id="feedback-sentence" style="min-height:auto;margin:0">Tap the words in order.</div>' +
      '</div>' +
      '</div>' +
      '<div class="sentence-scene">' +
      '<div class="map-frame">' +
      T.renderScene({
        variant: 'mini',
        cols: dims.cols,
        rows: dims.rows,
        buildings: scene,
        labels: true,
        highlight: [item.fact.a],
        focus: refs,
        slice: dims.cols === 2,
        extraScenery: (item.fact.type === D.REL.BEHIND || item.fact.type === D.REL.IN_FRONT)
          ? [
            { type: 'bench', col: 1.25, row: 1.05 },
            { type: 'flowers', col: 1.45, row: 0.25, color: '#f472b6' },
            { type: 'bush', col: 1.55, row: 1.75, s: 0.78 }
          ]
          : []
      }) +
      '</div>' +
      compassHTML() +
      '</div>' +
      '</div>';

    updateHud('sentence', 'Sentence ' + (s.index + 1) + ' / ' + s.items.length, s.score);
    bindListen(question);

    const clearBtn = body.querySelector('[data-x="clear"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (s.locked) return;
        s.placed = [];
        sfx.tap();
        renderSentenceTiles();
        setFeedback('sentence', 'Tap the words in order.', '');
      });
    }

    renderSentenceTiles();
  }

  function tileHTML(tile, placed) {
    return '<button class="word-tile' + (placed ? ' placed' : '') +
      '" data-uid="' + tile.uid + '" type="button">' + esc(tile.word) + '</button>';
  }

  function renderSentenceTiles() {
    const s = state.sentence;
    if (!s) return;
    const slots = document.getElementById('answer-slots');
    const pool = document.getElementById('tile-pool');
    if (!slots || !pool) return;

    let slotsHTML = '';
    for (let i = 0; i < s.targetWords.length; i++) {
      const tile = s.placed[i];
      if (tile) {
        slotsHTML += tileHTML(tile, true);
      } else {
        slotsHTML += '<span class="slot-empty' + (i === s.placed.length ? ' next' : '') + '"></span>';
      }
    }
    slots.innerHTML = slotsHTML;

    const placedUids = {};
    s.placed.forEach(function (t) { placedUids[t.uid] = true; });
    let poolHTML = '';
    s.order.forEach(function (uid) {
      if (placedUids[uid]) return;
      const tile = s.tiles.filter(function (t) { return t.uid === uid; })[0];
      if (tile) poolHTML += tileHTML(tile, false);
    });
    pool.innerHTML = poolHTML;

    $$('.word-tile', slots).forEach(function (btn) {
      btn.addEventListener('click', function () {
        onPlacedTile(btn.getAttribute('data-uid'));
      });
    });
    $$('.word-tile', pool).forEach(function (btn) {
      btn.addEventListener('click', function () {
        onPoolTile(btn.getAttribute('data-uid'));
      });
    });
  }

  function onPoolTile(uid) {
    const s = state.sentence;
    if (!s || s.locked) return;
    if (s.placed.length >= s.targetWords.length) {
      setFeedback('sentence', 'The sentence is full. Tap a word to take it out.', 'bad');
      return;
    }
    if (s.placed.some(function (t) { return t.uid === uid; })) return;
    const tile = s.tiles.filter(function (t) { return t.uid === uid; })[0];
    if (!tile) return;

    s.placed.push(tile);
    sfx.tap();
    renderSentenceTiles();
    setFeedback('sentence', 'Keep going!', '');

    if (s.placed.length === s.targetWords.length) {
      checkSentence();
    }
  }

  function onPlacedTile(uid) {
    const s = state.sentence;
    if (!s || s.locked) return;
    s.placed = s.placed.filter(function (t) { return t.uid !== uid; });
    sfx.tap();
    renderSentenceTiles();
    setFeedback('sentence', 'Tap the words in order.', '');
  }

  function checkSentence() {
    const s = state.sentence;
    if (!s || s.locked) return;
    const made = s.placed.map(function (t) { return t.word; }).join(' ');
    const target = s.targetWords.join(' ');
    const slots = document.getElementById('answer-slots');

    if (made === target) {
      s.locked = true;
      s.score += s.attempts === 0 ? 10 : 5;
      if (s.attempts === 0) s.firstTry++;
      if (slots) slots.classList.add('good');
      updateHud('sentence', 'Sentence ' + (s.index + 1) + ' / ' + s.items.length, s.score);
      setFeedback('sentence', 'Perfect! ' + target, 'good');
      showToast('⭐ Perfect sentence!', 'good');
      sfx.correct();
      speak(target);
      later(nextSentence, 2100);
    } else {
      s.attempts++;
      if (slots) {
        slots.classList.add('bad');
        later(function () { slots.classList.remove('bad'); }, 700);
      }
      setFeedback('sentence', 'Not yet. Tap a word to take it out, then try again.', 'bad');
      showToast('💛 Almost! Try again.', 'bad');
      sfx.wrong();
    }
  }

  function nextSentence() {
    const s = state.sentence;
    if (!s) return;
    s.index++;
    if (s.index >= s.items.length) finishSentence();
    else renderSentence();
  }

  function finishSentence() {
    const s = state.sentence;
    if (!s) return;
    const total = s.items.length;
    updateHud('sentence', 'Complete', s.score);
    showResult({
      emoji: '✏️',
      title: 'Super Sentences!',
      message: 'You made ' + total + ' sentences. ' + s.firstTry + ' were perfect on the first try.',
      stars: starsFor(s.firstTry, total),
      score: s.score,
      replay: function () { startSentence(s.level); }
    });
  }

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */
  function renderMenuArt() {
    const art = {
      explore: ['school', 'playground'],
      build: ['hospital', 'store'],
      picture: ['swimming-pool', 'movie-theater'],
      sentence: ['cafe', 'train-station']
    };
    $$('.card-art').forEach(function (el) {
      const ids = art[el.getAttribute('data-art')] || [];
      el.innerHTML = ids.map(function (id) { return T.renderIcon(id); }).join('');
    });
  }

  function bindGlobal() {
    $$('.activity-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openActivity(card.getAttribute('data-activity'));
      });
    });

    document.addEventListener('click', function (e) {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        if (action === 'sound') toggleSound();
        else if (action === 'fullscreen') toggleFullscreen();
        else if (action === 'menu') goMenu();
        else if (action === 'hub') { window.location.href = '../index.html'; }
        else if (action === 'restart') restartCurrent();
        return;
      }
    });

    window.addEventListener('resize', function () {
      updateGates();
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(updateGates, 120);
    });
    if (window.screen && screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', function () {
        setTimeout(updateGates, 120);
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && ttsOn() && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
      }
    });
  }

  function init() {
    DEVICE.rotateEl = document.getElementById('rotate-gate');
    DEVICE.deviceEl = document.getElementById('device-gate');
    DEVICE.dev = !!(D.CONFIG.devOverride || /(?:^|[?&])dev=1(?:&|$)/.test(window.location.search));

    const issues = D.validateContent();
    if (issues.length) {
      console.warn('[Town Quest] Content check found ' + issues.length + ' issue(s):');
      issues.forEach(function (issue) { console.warn(' - ' + issue); });
    }

    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    setSound(true);
    renderMenuArt();
    bindGlobal();
    updateGates();
    showScreen('screen-menu');

    // Development-only inspection hook (available with ?dev=1 or devOverride).
    if (DEVICE.dev) {
      window.TQ_DEBUG = { state: state, data: D, town: T };
    }
  }

  init();
})();



