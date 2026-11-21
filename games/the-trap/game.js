/* ============================================================
   THE TRAP — Story Challenge
   Game logic: main menu, Story Sequencer, Who Said It?, S or SH?
   Plain ES5-compatible IIFE (same style as the other games in
   the collection). No speech / TTS of any kind.
   ============================================================ */

(function () {
  'use strict';

  const D = TRAP_DATA;
  const A = TRAP_ART;
  const CONFIG = D.CONFIG;

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  /* ------------------------------------------------------------
     State
     ------------------------------------------------------------ */
  const state = {
    mode: null,
    started: false,
    difficulty: null,
    score: 0,
    locked: false,
    sequence: null,
    said: null,
    phonics: null
  };

  const timers = new Set();
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

  /* ------------------------------------------------------------
     Device gates
     ------------------------------------------------------------ */
  let rotateEl = null;
  let deviceEl = null;
  let devMode = false;

  function isTabletDevice() {
    const ua = navigator.userAgent || '';
    const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    const android = /Android/i.test(ua);
    const ipad = /iPad/i.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    const shortSide = Math.min(screen.width, screen.height);
    const tabletSize = shortSide >= (CONFIG.minTabletShortSide || 600);
    return (android || ipad) && touch && tabletSize;
  }

  function updateGates() {
    if (rotateEl) {
      const portrait = window.innerHeight > window.innerWidth;
      rotateEl.classList.toggle('show', !devMode && portrait);
    }
    if (deviceEl) {
      deviceEl.classList.toggle('show', !devMode && !isTabletDevice());
    }
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------
     Sound effects (synthesised tones only — no speech)
     ------------------------------------------------------------ */
  let audioCtx = null;
  let soundOn = CONFIG.sound !== false;

  function ac() {
    if (!soundOn) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { audioCtx = new Ctx(); } catch (e) { return null; }
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
    place: function () { tone(440, 0.09, 'sine', 0.05); tone(660, 0.1, 'sine', 0.04, 0.05); },
    correct: function () { tone(660, 0.12, 'triangle', 0.07); tone(880, 0.16, 'triangle', 0.06, 0.1); },
    wrong: function () { tone(200, 0.16, 'sawtooth', 0.045); tone(160, 0.18, 'sawtooth', 0.04, 0.1); },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.06, i * 0.09); });
    }
  };

  function updateSoundButtons() {
    $$('[data-action="sound"]').forEach(function (btn) {
      btn.textContent = soundOn ? '🔊' : '🔇';
      btn.setAttribute('aria-pressed', String(soundOn));
    });
  }

  /* ------------------------------------------------------------
     Toast + confetti
     ------------------------------------------------------------ */
  let toastTimer = null;

  function showToast(kind, text, duration) {
    const toast = $('#toast');
    if (!toast) return;
    toast.className = 'toast show ' + kind;
    toast.innerHTML = '<span aria-hidden="true">' + (kind === 'good' ? '⭐' : '💛') +
      '</span><span>' + text + '</span>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.className = 'toast'; }, duration || 1500);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    if (toast) toast.className = 'toast';
  }

  const canvas = $('#confetti');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let confettiParts = [];
  let confettiRaf = null;

  function sizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function confettiBurst(count) {
    if (!ctx) return;
    const colors = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#a78bfa', '#fb923c', '#ffffff'];
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight * 0.4;
    for (let i = 0; i < (count || 110); i++) {
      confettiParts.push({
        x: ox + (Math.random() - 0.5) * 90,
        y: oy + (Math.random() - 0.5) * 50,
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
    if (!ctx) { confettiRaf = null; return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = confettiParts.length - 1; i >= 0; i--) {
      const p = confettiParts[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.995;
      p.rot += p.vr;
      p.life -= 0.008;
      if (p.life <= 0 || p.y > canvas.height + 50) { confettiParts.splice(i, 1); continue; }
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

  /* ------------------------------------------------------------
     Screens / HUD / result overlay
     ------------------------------------------------------------ */
  const MODE_INFO = {
    sequence: { emoji: '📖', title: 'Story Sequencer', hud: '📖 Story Sequencer', activity: 'sequence' },
    said: { emoji: '💬', title: 'Who Said It?', hud: '💬 Who Said It?', activity: 'said' },
    phonics: { emoji: '🔤', title: 'S or SH?', hud: '🔤 S or SH?', activity: 'phonics' }
  };

  function showScreen(id) {
    $$('.screen').forEach(function (s) { s.classList.remove('active'); });
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function setHud(mode, progress, score) {
    const p = document.getElementById('progress-' + mode);
    const s = document.getElementById('score-' + mode);
    if (p && progress != null) p.textContent = progress;
    if (s && score != null) s.textContent = '⭐ ' + score;
  }

  function updateScore(mode) {
    const s = document.getElementById('score-' + mode);
    if (s) s.textContent = '⭐ ' + state.score;
  }

  function hideResult() {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }

  function showResult(opts) {
    const overlay = $('#result-overlay');
    if (!overlay) return;
    const stars = opts.stars || 1;
    const actions = [];
    actions.push('<button class="btn primary" data-res="replay" type="button">Play Again</button>');
    actions.push('<button class="btn secondary" data-res="menu" type="button">Main Menu</button>');
    if (opts.next) {
      actions.push('<button class="btn next" data-res="next" type="button">' +
        esc(opts.nextLabel || 'Next Level') + '</button>');
    }
    overlay.innerHTML = '<div class="result-card" role="document">' +
      '<div class="result-emoji">' + (opts.emoji || '🎉') + '</div>' +
      '<div class="result-text">' +
      '<h2>' + esc(opts.title || 'Well done!') + '</h2>' +
      '<p>' + esc(opts.message || '') + '</p>' +
      '<div class="result-stars">' + [0, 1, 2].map(function (i) {
        return '<span class="' + (i < stars ? 'on' : '') + '">★</span>';
      }).join('') + '</div>' +
      '<div class="result-score">Score: ' + (opts.score || 0) + '</div>' +
      '</div>' +
      '<div class="result-actions">' + actions.join('') + '</div>' +
      '</div>';
    overlay.classList.add('show');

    const replay = $('[data-res="replay"]', overlay);
    if (replay) {
      replay.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        if (opts.replay) opts.replay();
      });
    }
    const menu = $('[data-res="menu"]', overlay);
    if (menu) {
      menu.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        goMenu();
      });
    }
    const next = $('[data-res="next"]', overlay);
    if (next) {
      next.addEventListener('click', function () {
        sfx.tap();
        hideResult();
        if (opts.next) opts.next();
      });
    }
    sfx.win();
    confettiBurst(150);
  }

  /* ------------------------------------------------------------
     Menu handling
     ------------------------------------------------------------ */
  function renderMenuCast() {
    const host = $('#menu-cast');
    if (!host) return;
    const ids = ['lucy', 'ben', 'horax', 'zelda', 'octopus', 'shark'];
    host.innerHTML = ids.map(function (id) {
      return '<span class="cast-avatar">' + A.avatar(id) + '</span>';
    }).join('');
  }

  function renderMenuArt() {
    const seq = $('[data-art="sequence"]');
    if (seq) seq.innerHTML = A.lucy() + A.ben();
    const said = $('[data-art="said"]');
    if (said) said.innerHTML = A.horax() + A.zelda();
    const ph = $('[data-art="phonics"]');
    if (ph) ph.innerHTML = A.shark() + A.fishSchoolS();
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

  function openActivity(mode) {
    clearTimers();
    hideResult();
    hideToast();
    state.mode = mode;
    state.started = false;
    state.difficulty = null;
    state.locked = false;
    state.score = 0;
    showScreen('screen-' + mode);
    setHud(mode, 'Ready', 0);
    const body = document.getElementById('body-' + mode);
    if (!body) return;
    body.innerHTML = '';
    renderIntro(mode, body);
  }

  function renderIntro(mode, body) {
    const info = MODE_INFO[mode];
    if (!info) return;

    let hero = '';
    let text = '';
    let levels = [];
    let levelKey = '';

    if (mode === 'sequence') {
      hero = A.lucy() + A.ben() + A.shellWithLetter();
      text = 'Tap a story card, then tap a space in the story strip. ' +
        'Put all the story events in the right order!';
      levels = D.LEVELS;
      levelKey = 'seq';
    } else if (mode === 'said') {
      hero = A.lucy() + A.ben() + A.horax() + A.zelda();
      text = 'Read the speech bubble. Then tap the character who said it.';
      levels = D.SAID_LEVELS;
      levelKey = 'said';
    } else if (mode === 'phonics') {
      hero = A.word('shark') + A.word('shell') + A.word('fish');
      text = 'Read the word. Was it said with the S sound /s/ or the SH sound /ʃ/?';
      levels = D.PHONICS_LEVELS;
      levelKey = 'ph';
    }

    body.innerHTML = '<div class="intro-wrap"><div class="intro-card">' +
      '<div class="intro-hero">' + hero + '</div>' +
      '<h2>' + info.emoji + ' ' + esc(info.title) + '</h2>' +
      '<p>' + esc(text) + '</p>' +
      '<div class="diff-grid">' + levels.map(function (lv) {
        return '<button class="diff-btn" data-diff="' + esc(lv.id) + '" type="button">' +
          '<span class="diff-name">' + esc(lv.name) + '</span>' +
          '<span class="diff-desc">' + esc(lv.desc) + '</span>' +
          '</button>';
      }).join('') + '</div>' +
      '</div></div>';

    $$('[data-diff]', body).forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfx.tap();
        const diff = btn.dataset.diff;
        if (levelKey === 'seq') startSequence(diff);
        else if (levelKey === 'said') startSaid(diff);
        else if (levelKey === 'ph') startPhonics(diff);
      });
    });
  }

  function restartActivity() {
    sfx.tap();
    if (!state.mode) { goMenu(); return; }
    if (!state.started || !state.difficulty) { openActivity(state.mode); return; }
    if (state.mode === 'sequence') startSequence(state.difficulty);
    else if (state.mode === 'said') startSaid(state.difficulty);
    else if (state.mode === 'phonics') startPhonics(state.difficulty);
  }

  function hudTap() {
    sfx.tap();
  }

  /* ============================================================
     GAME 1 — STORY SEQUENCER
     ============================================================ */
  function startSequence(diff) {
    clearTimers();
    hideToast();
    hideResult();

    const level = D.level(diff) || D.LEVELS[2];
    const events = level.events.map(function (id) { return D.event(id); });
    const orderedIds = events.map(function (e) { return e.id; });

    state.mode = 'sequence';
    state.difficulty = level.id;
    state.started = true;
    state.locked = false;
    state.score = 0;

    state.sequence = {
      level: level,
      orderedIds: orderedIds,
      cards: orderCards(events),
      slots: new Array(events.length).fill(null),
      selected: null,
      mistakesThisRound: 0,
      checks: 0,
      solved: false,
      reveal: false
    };

    showScreen('screen-sequence');
    setHud('sequence', 'Level: ' + level.name, 0);
    renderSequence();
  }

  /*
   * Shuffle the cards, then fix the order so that the same picture never
   * appears twice in a row (events 5 and 6 share the "chase" picture).
   */
  function orderCards(events) {
    const byScene = {};
    events.forEach(function (e) {
      if (!byScene[e.scene]) byScene[e.scene] = [];
      byScene[e.scene].push(e.id);
    });
    const keys = Object.keys(byScene);
    let best = null;
    for (let attempt = 0; attempt < 40 && !best; attempt++) {
      const buckets = keys.map(function (k) { return shuffle(byScene[k]); });
      let out = [];
      let prev = null;
      while (out.length < events.length) {
        const options = buckets.filter(function (b) { return b.length; });
        const fresh = options.filter(function (b) { return b[0] !== prev; });
        const pick = (fresh.length ? fresh : options)[(Math.random() * (fresh.length || options.length)) | 0];
        const id = pick.shift();
        out.push(id);
        prev = id;
      }
      if (out.length === events.length) best = out;
    }
    return best || shuffle(events.map(function (e) { return e.id; }));
  }

  function renderSequence() {
    const s = state.sequence;
    const body = document.getElementById('body-sequence');
    if (!s || !body) return;

    const n = s.orderedIds.length;
    const slotCols = [4, 4, 4, 4, 4, 3, 4, 4][n - 1] || 4;

    body.innerHTML = '<div class="seq-wrap">' +
      '<div class="progress-wrap">' +
      '<span class="progress-text" id="seq-progress-text"></span>' +
      '<div class="progress-bar"><span id="seq-progress"></span></div>' +
      '</div>' +
      '<div class="task-banner">📖 <strong>Put the story in the correct order!</strong> ' +
      'Tap a card, then tap a space.</div>' +
      '<div class="seq-strip" id="seq-strip" style="grid-template-columns:repeat(' + slotCols + ',minmax(0,1fr))"></div>' +
      '<div class="seq-hand" id="seq-hand" data-count="' + n + '"></div>' +
      '<div class="seq-tip" id="seq-tip"></div>' +
      '</div>';

    renderSequenceStrip();
    renderSequenceHand();
    updateSequenceProgress();
  }

  function renderSequenceStrip() {
    const s = state.sequence;
    const strip = document.getElementById('seq-strip');
    if (!s || !strip) return;
    const n = s.orderedIds.length;

    let html = '';
    for (let i = 0; i < n; i++) {
      const id = s.slots[i];
      const ev = id ? D.event(id) : null;
      const armed = state.locked ? '' : (s.selected ? ' armed' : '');
      const wrongCls = (s.reveal && id && id !== s.orderedIds[i]) ? ' bad' : '';
      if (ev) {
        html += '<button class="seq-slot filled' + armed + wrongCls + '" data-slot="' + i + '" type="button" ' +
          'aria-label="Space ' + (i + 1) + ': ' + esc(ev.text) + '">' +
          '<span class="slot-num">' + (i + 1) + '</span>' +
          '<span class="slot-pic">' + A.scene(ev.scene) + '</span>' +
          '<span class="slot-text">' + esc(ev.text) + '</span>' +
          '<span class="slot-remove" aria-hidden="true">↩</span>' +
          '</button>';
      } else {
        html += '<button class="seq-slot' + armed + '" data-slot="' + i + '" type="button" ' +
          'aria-label="Empty space ' + (i + 1) + '">' +
          '<span class="slot-num">' + (i + 1) + '</span>' +
          '<span class="slot-pic" aria-hidden="true">' + (s.selected ? '＋' : '·') + '</span>' +
          '</button>';
      }
    }
    strip.innerHTML = html;

    $$('[data-slot]', strip).forEach(function (btn) {
      btn.addEventListener('click', function () { onSequenceSlot(Number(btn.dataset.slot)); });
    });
  }

  function renderSequenceHand() {
    const s = state.sequence;
    const hand = document.getElementById('seq-hand');
    if (!s || !hand) return;
    hand.classList.toggle('recap', !!s.reveal);

    let html = '';
    s.cards.forEach(function (id) {
      const ev = D.event(id);
      const used = s.slots.indexOf(id) !== -1;
      const sel = s.selected === id;
      if (s.reveal) {
        /* recap: show the cards in story order */
        html += '<div class="seq-card reveal' + (sel ? ' selected' : '') + '" data-card="' + id + '">' +
          '<span class="card-pic">' + A.scene(ev.scene) + '</span>' +
          '<span class="card-text">' + esc(ev.text) + '</span>' +
          '<span class="card-caption">' + esc(ev.short) + '</span>' +
          '</div>';
        return;
      }
      html += '<button class="seq-card' + (used ? ' placed' : '') + (sel ? ' selected' : '') +
        '" data-card="' + id + '" type="button" aria-pressed="' + (sel ? 'true' : 'false') + '">' +
        '<span class="card-pic">' + A.scene(ev.scene) + '</span>' +
        '<span class="card-text">' + esc(ev.text) + '</span>' +
        '</button>';
    });
    hand.innerHTML = html;

    if (!s.reveal) {
      $$('[data-card]', hand).forEach(function (btn) {
        btn.addEventListener('click', function () { onSequenceCard(Number(btn.dataset.card)); });
      });
    }
  }

  function updateSequenceProgress() {
    const s = state.sequence;
    if (!s) return;
    const n = s.orderedIds.length;
    const filled = s.slots.filter(function (v) { return v != null; }).length;
    const bar = document.getElementById('seq-progress');
    const text = document.getElementById('seq-progress-text');
    if (bar) bar.style.width = Math.round((filled / n) * 100) + '%';
    if (text) text.textContent = 'Placed ' + filled + ' / ' + n;
    const tip = document.getElementById('seq-tip');
    if (tip && !s.solved && !s.reveal) {
      tip.textContent = filled === n
        ? 'All spaces are full! Check your story order.'
        : (s.selected ? 'Now tap a space in the story strip.' : 'Tap a story card to start.');
    }
    setHud('sequence', 'Placed ' + filled + ' / ' + n, state.score);
  }

  function onSequenceCard(id) {
    const s = state.sequence;
    if (!s || state.locked || s.solved || s.reveal) return;
    const ev = D.event(id);
    if (!ev) return;
    if (s.slots.indexOf(id) !== -1) return;

    if (s.selected === id) {
      s.selected = null;
      sfx.tap();
    } else {
      s.selected = id;
      sfx.tap();
      const tip = document.getElementById('seq-tip');
      if (tip) tip.textContent = 'Good! Now tap the space where this comes in the story.';
    }
    renderSequenceHand();
    renderSequenceStrip();
    updateSequenceProgress();
  }

  function onSequenceSlot(index) {
    const s = state.sequence;
    if (!s || state.locked || s.solved || s.reveal) return;
    const current = s.slots[index];

    if (current != null) {
      if (s.selected != null) {
        /* swap the selected card with the card already in this space */
        const from = s.slots.indexOf(s.selected);
        s.slots[index] = s.selected;
        if (from !== -1) s.slots[from] = current;
        s.selected = null;
        sfx.place();
      } else {
        /* take the card back out of the strip */
        s.slots[index] = null;
        sfx.tap();
        const tip = document.getElementById('seq-tip');
        if (tip) tip.textContent = 'Card moved back. Choose where it goes.';
      }
    } else if (s.selected != null) {
      s.slots[index] = s.selected;
      s.selected = null;
      sfx.place();
      const tip = document.getElementById('seq-tip');
      if (tip) tip.textContent = 'Nice! Keep going.';
    } else {
      showToast('bad', 'Tap a story card first!', 1100);
      sfx.wrong();
      return;
    }

    renderSequenceHand();
    renderSequenceStrip();
    updateSequenceProgress();

    const slotEl = $('[data-slot="' + index + '"]');
    if (slotEl) {
      slotEl.classList.remove('just-placed');
      void slotEl.offsetWidth;
      slotEl.classList.add('just-placed');
    }

    if (s.slots.every(function (v) { return v != null; })) {
      checkSequence();
    }
  }

  function checkSequence() {
    const s = state.sequence;
    if (!s) return;
    const wrong = [];
    s.slots.forEach(function (id, i) {
      if (id !== s.orderedIds[i]) wrong.push(i);
    });
    s.checks++;

    if (wrong.length === 0) {
      s.solved = true;
      state.locked = true;
      $$('.seq-slot').forEach(function (el) { el.classList.add('ok'); });
      sfx.win();
      confettiBurst(130);
      const n = s.orderedIds.length;
      setHud('sequence', 'All correct!', state.score);
      later(finishSequence, 750);
      return;
    }

    s.mistakesThisRound += wrong.length;
    state.locked = true;
    wrong.forEach(function (i) {
      const el = $('[data-slot="' + i + '"]');
      if (el) {
        el.classList.remove('bad');
        void el.offsetWidth;
        el.classList.add('bad');
      }
    });
    sfx.wrong();
    showToast('bad', 'Almost! ' + wrong.length + (wrong.length === 1 ? ' space' : ' spaces') +
      ' need to move. Tap a card to swap it.', 2300);

    later(function () {
      $$('.seq-slot.bad').forEach(function (el) { el.classList.remove('bad'); });
      state.locked = false;
    }, 1800);
  }

  function finishSequence() {
    const s = state.sequence;
    if (!s) return;
    const n = s.orderedIds.length;
    const levelId = s.level.id;
    const stars = s.mistakesThisRound === 0 ? 3 : s.mistakesThisRound <= 3 ? 2 : 1;
    state.score = 100;
    state.locked = false;
    s.reveal = true;
    setHud('sequence', 'Fantastic!', state.score);
    const body = document.getElementById('body-sequence');
    if (body) {
      body.innerHTML = '';
      renderSequenceRecap();
    }
    later(function () {
      showResult({
        emoji: '🏆',
        title: 'Fantastic! You know the story!',
        message: s.mistakesThisRound === 0
          ? 'You put all ' + n + ' events in order with no mistakes!'
          : 'You put all ' + n + ' events in order. Read the story again from 1 to ' + n + '.',
        stars: stars,
        score: state.score,
        replay: function () { startSequence(levelId); }
      });
    }, 650);
  }

  function renderSequenceRecap() {
    const s = state.sequence;
    const body = document.getElementById('body-sequence');
    if (!s || !body) return;
    const n = s.orderedIds.length;

    body.innerHTML = '<div class="seq-wrap">' +
      '<div class="task-banner">🏆 <strong>Fantastic! You know the story!</strong> Read it from start to end.</div>' +
      '<div class="seq-strip" id="seq-strip"></div>' +
      '<div class="seq-hand" id="seq-hand" data-count="' + n + '"></div>' +
      '<div class="seq-tip">Tap a card to read the story words.</div>' +
      '</div>';

    const strip = document.getElementById('seq-strip');
    strip.innerHTML = s.orderedIds.map(function (id, i) {
      const ev = D.event(id);
      return '<button class="seq-slot filled ok" data-slot="' + i + '" type="button" ' +
        'aria-label="Step ' + (i + 1) + ': ' + esc(ev.text) + '">' +
        '<span class="slot-num">' + (i + 1) + '</span>' +
        '<span class="slot-pic">' + A.scene(ev.scene) + '</span>' +
        '<span class="slot-text">' + esc(ev.text) + '</span>' +
        '<span class="slot-badge" aria-hidden="true">✓</span>' +
        '</button>';
    }).join('');

    const hand = document.getElementById('seq-hand');
    hand.classList.add('recap');
    hand.innerHTML = s.orderedIds.map(function (id) {
      const ev = D.event(id);
      return '<button class="seq-card reveal" data-card="' + id + '" type="button" ' +
        'aria-label="' + esc(ev.text) + '. ' + esc(ev.hint) + '">' +
        '<span class="card-pic">' + A.scene(ev.scene) + '</span>' +
        '<span class="card-text">' + esc(ev.text) + '</span>' +
        '<span class="card-caption">' + esc(ev.short) + '</span>' +
        '</button>';
    }).join('');

    $$('[data-card]', hand).forEach(function (btn) {
      btn.addEventListener('click', function () {
        const ev = D.event(Number(btn.dataset.card));
        if (!ev) return;
        sfx.tap();
        showToast('good', ev.hint, 2600);
      });
    });
    $$('[data-slot]', strip).forEach(function (btn) {
      btn.addEventListener('click', function () {
        const ev = D.event(s.orderedIds[Number(btn.dataset.slot)]);
        if (!ev) return;
        sfx.tap();
        showToast('good', 'Step ' + ev.id + ': ' + ev.hint, 2600);
      });
    });
  }

  /* ============================================================
     GAME 2 — WHO SAID IT?
     ============================================================ */
  function buildSaidRound(level) {
    const pool = D.DIALOGUE.filter(function (q) { return level.filter(q); });
    const round = Math.min(level.round, pool.length);

    /*
     * Shuffled, never repeated in one round.
     * The rarest speakers go in first so that every character who speaks
     * in this level really appears in the round (Zelda only has one line).
     */
    const counts = {};
    pool.forEach(function (q) { counts[q.who] = (counts[q.who] || 0) + 1; });

    const speakers = level.characters.filter(function (id) { return counts[id]; });
    const spoken = {};
    const picked = [];

    shuffle(speakers).forEach(function (id) {
      if (picked.length >= round) return;
      const q = shuffle(pool.filter(function (o) { return o.who === id; }))[0];
      if (!q) return;
      spoken[id] = true;
      picked.push(q);
    });

    const rest = shuffle(pool.filter(function (q) { return picked.indexOf(q) === -1; }));
    rest.forEach(function (q) {
      if (picked.length < round) picked.push(q);
    });

    /* guard: if a character was missed (round too short), swap one in */
    speakers.forEach(function (id) {
      if (picked.some(function (q) { return q.who === id; })) return;
      const spare = picked.filter(function (q) {
        return counts[q.who] > 1 && picked.filter(function (o) { return o.who === q.who; }).length > 1;
      })[0];
      const add = pool.filter(function (q) {
        return q.who === id && picked.indexOf(q) === -1;
      })[0];
      if (spare && add) picked[picked.indexOf(spare)] = add;
    });

    return shuffle(picked);
  }

  function startSaid(diff) {
    clearTimers();
    hideToast();
    hideResult();

    const level = D.saidLevel(diff) || D.SAID_LEVELS[1];
    const questions = buildSaidRound(level);

    state.mode = 'said';
    state.difficulty = level.id;
    state.started = true;
    state.locked = false;
    state.score = 0;

    state.said = {
      level: level,
      questions: questions,
      index: 0,
      firstTry: 0,
      attempts: 0
    };

    showScreen('screen-said');
    setHud('said', 'Question 1 / ' + questions.length, 0);
    renderSaidQuestion();
  }

  function renderSaidQuestion() {
    const st = state.said;
    const body = document.getElementById('body-said');
    if (!st || !body) return;
    if (st.index >= st.questions.length) {
      finishSaid();
      return;
    }

    const q = st.questions[st.index];
    st.attempts = 0;
    state.locked = false;

    const chars = st.level.characters;
    const items = chars.map(function (id) { return D.character(id); }).filter(Boolean);
    /* a small underwater guest joins the question, purely decorative */
    const guests = ['octopus', 'fish', 'shark'];
    const guest = guests[st.index % guests.length];

    body.innerHTML = '<div class="said-wrap">' +
      '<div class="progress-wrap">' +
      '<span class="progress-text" id="said-progress-text">Question ' + (st.index + 1) +
      ' of ' + st.questions.length + '</span>' +
      '<div class="progress-bar"><span id="said-progress"></span></div>' +
      '</div>' +
      '<div class="said-stage">' +
      '<span class="said-guest" aria-hidden="true">' + A.guest(guest) + '</span>' +
      '<div class="speech-card" id="speech-card">' +
      '<span class="speech-mark" aria-hidden="true">“</span>' +
      '<div class="speech-text" id="speech-text">' + esc(q.text) + '</div>' +
      '<span class="speech-mark" aria-hidden="true">”</span>' +
      '</div>' +
      '</div>' +
      '<div class="said-choices" id="said-choices" data-count="' + items.length + '">' +
      items.map(function (c) {
        return '<button class="char-card" data-char="' + c.id + '" type="button" ' +
          'style="--accent:' + c.accent + ';--soft:' + c.soft + '" aria-label="' + esc(c.name) + '">' +
          '<span class="char-art">' + A.avatar(c.id) + '</span>' +
          '<span class="char-name">' + esc(c.name) + '</span>' +
          '<span class="char-check" aria-hidden="true">✓</span>' +
          '</button>';
      }).join('') +
      '</div>' +
      '<div class="seq-tip" id="said-tip">Tap the character who said this.</div>' +
      '</div>';

    const bar = document.getElementById('said-progress');
    if (bar) bar.style.width = Math.round((st.index / st.questions.length) * 100) + '%';

    $$('[data-char]', body).forEach(function (btn) {
      btn.addEventListener('click', function () { onSaidChoice(btn, q); });
    });

    setHud('said', 'Question ' + (st.index + 1) + ' / ' + st.questions.length, state.score);
  }

  function onSaidChoice(btn, q) {
    const st = state.said;
    if (!st || state.locked) return;
    const chosen = D.character(btn.dataset.char);
    if (!chosen) return;

    if (chosen.id !== q.who) {
      st.attempts++;
      btn.classList.add('wrong');
      sfx.wrong();
      showToast('bad', 'Try again!', 1100);
      const tip = document.getElementById('said-tip');
      if (tip) tip.textContent = 'Read the bubble again. Who said it?';
      return;
    }

    state.locked = true;
    btn.classList.add('correct');
    sfx.correct();
    if (st.attempts === 0) st.firstTry++;
    state.score += st.attempts === 0 ? 10 : 5;
    updateScore('said');

    const correctChar = D.character(q.who);
    const tip = document.getElementById('said-tip');
    if (tip) tip.textContent = correctChar.name + ' says that.';

    showToast('good', 'Correct! ' + correctChar.name + ' said that.', 1700);
    const bar = document.getElementById('said-progress');
    if (bar) bar.style.width = Math.round(((st.index + 1) / st.questions.length) * 100) + '%';

    const card = document.getElementById('speech-card');
    if (card) card.classList.add('solved');

    later(function () {
      st.index++;
      renderSaidQuestion();
    }, 1500);
  }

  function finishSaid() {
    const st = state.said;
    if (!st) return;
    const total = st.questions.length;
    const level = st.level.id;
    const stars = st.firstTry >= Math.ceil(total * 0.9) ? 3
      : st.firstTry >= Math.ceil(total * 0.6) ? 2 : 1;
    const nextLevel = level === 'easy' ? 'medium'
      : level === 'medium' ? 'challenge' : null;

    showResult({
      emoji: '💬',
      title: 'Excellent! You know the characters!',
      message: 'You got ' + st.firstTry + ' of ' + total + ' right on the first try.',
      stars: stars,
      score: state.score,
      replay: function () { startSaid(level); },
      next: nextLevel ? function () { startSaid(nextLevel); } : null,
      nextLabel: nextLevel ? 'Next Level ➜' : null
    });
    setHud('said', 'Finished · ' + st.firstTry + ' / ' + total, state.score);
  }

  /* ============================================================
     GAME 3 — S OR SH?
     ============================================================ */
  function startPhonics(diff) {
    clearTimers();
    hideToast();
    hideResult();

    const level = D.phonicsLevel(diff) || D.PHONICS_LEVELS[2];
    const pool = level.list
      ? level.list.map(function (id) { return D.word(id); })
      : D.PHONICS_WORDS.slice();
    const words = shuffle(pool.filter(Boolean));

    state.mode = 'phonics';
    state.difficulty = level.id;
    state.started = true;
    state.locked = false;
    state.score = 0;

    state.phonics = {
      level: level,
      words: words,
      sorted: {},
      selected: null,
      total: words.length,
      done: 0,
      mistakes: 0
    };

    showScreen('screen-phonics');
    setHud('phonics', 'Sorted 0 / ' + words.length, 0);
    renderPhonics();
  }

  function wordArtHTML(w) {
    const art = A.word(w.id);
    if (art) return '<span class="pw-art">' + art + '</span>';
    return '<span class="pw-art"><span class="pw-emoji" aria-hidden="true">' + esc(w.emoji || '🐟') + '</span></span>';
  }

  function markedWordHTML(w) {
    const word = w.word;
    const split = Math.min(w.split || 2, word.length);
    return '<span class="pw-word">' + esc(word.slice(0, split)) +
      '<b>' + esc(word.slice(split)) + '</b></span>';
  }

  function renderPhonics() {
    const p = state.phonics;
    const body = document.getElementById('body-phonics');
    if (!p || !body) return;

    const colMap = { 6: 3, 8: 4, 10: 5 };
    const trayCols = colMap[p.total] || 5;

    const sDef = D.SOUNDS.s;
    const shDef = D.SOUNDS.sh;

    body.innerHTML = '<div class="ph-wrap">' +
      '<div class="progress-wrap">' +
      '<span class="progress-text" id="ph-progress-text">Sorted 0 / ' + p.total + '</span>' +
      '<div class="progress-bar"><span id="ph-progress"></span></div>' +
      '</div>' +
      '<div class="ph-board">' +
      '<div class="ph-tray" id="ph-tray" style="--tray-cols:' + trayCols + '"></div>' +
      '<div class="ph-basins">' +
      '<button class="ph-basin" data-basin="s" type="button" style="--accent:' + sDef.accent + ';--soft:' + sDef.soft + '">' +
      '<span class="basin-head"><span class="basin-letter">S</span><span class="basin-ipa">' + esc(sDef.ipa) + '</span></span>' +
      '<span class="basin-sound">' + esc(sDef.hint) + '</span>' +
      '<span class="basin-words" id="basin-s"></span>' +
      '</button>' +
      '<button class="ph-basin" data-basin="sh" type="button" style="--accent:' + shDef.accent + ';--soft:' + shDef.soft + '">' +
      '<span class="basin-head"><span class="basin-letter">SH</span><span class="basin-ipa">' + esc(shDef.ipa) + '</span></span>' +
      '<span class="basin-sound">' + esc(shDef.hint) + '</span>' +
      '<span class="basin-words" id="basin-sh"></span>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div class="ph-tip" id="ph-tip">Tap a word, then tap S or SH.</div>' +
      '</div>';

    renderPhonicsTray();
    $$('[data-basin]', body).forEach(function (btn) {
      btn.addEventListener('click', function () { onPhonicsBasin(btn.dataset.basin); });
    });
    updatePhonicsProgress();
  }

  function renderPhonicsTray() {
    const p = state.phonics;
    const tray = document.getElementById('ph-tray');
    if (!p || !tray) return;

    tray.innerHTML = p.words.map(function (w) {
      const isSorted = !!p.sorted[w.id];
      const sel = p.selected === w.id;
      return '<button class="ph-word' + (isSorted ? ' done' : '') + (sel ? ' selected' : '') +
        '" data-word="' + w.id + '" type="button" aria-pressed="' + (sel ? 'true' : 'false') + '">' +
        wordArtHTML(w) +
        markedWordHTML(w) +
        '</button>';
    }).join('');

    $$('[data-word]', tray).forEach(function (btn) {
      btn.addEventListener('click', function () { onPhonicsWord(btn.dataset.word); });
    });
  }

  function updatePhonicsProgress() {
    const p = state.phonics;
    if (!p) return;
    const bar = document.getElementById('ph-progress');
    const text = document.getElementById('ph-progress-text');
    if (bar) bar.style.width = Math.round((p.done / p.total) * 100) + '%';
    if (text) text.textContent = 'Sorted ' + p.done + ' / ' + p.total;
    setHud('phonics', 'Sorted ' + p.done + ' / ' + p.total, state.score);
  }

  function onPhonicsWord(id) {
    const p = state.phonics;
    if (!p || state.locked) return;
    if (p.sorted[id]) return;
    p.selected = p.selected === id ? null : id;
    sfx.tap();
    renderPhonicsTray();
    const tip = document.getElementById('ph-tip');
    if (tip) tip.textContent = p.selected ? 'Now tap S or SH.' : 'Tap a word, then tap S or SH.';
    $$('.ph-basin').forEach(function (b) {
      b.classList.toggle('armed', !!p.selected);
    });
  }

  function onPhonicsBasin(kind) {
    const p = state.phonics;
    if (!p || state.locked) return;
    if (!p.selected) {
      showToast('bad', 'Tap a word first!', 1100);
      sfx.wrong();
      return;
    }
    const w = D.word(p.selected);
    if (!w) return;
    const basinEl = $('[data-basin="' + kind + '"]');

    if (w.sound === kind) {
      state.locked = true;
      p.sorted[w.id] = kind;
      p.done++;
      p.selected = null;
      state.score += 10;
      sfx.correct();
      if (basinEl) {
        basinEl.classList.remove('bad');
        basinEl.classList.add('good');
        later(function () { basinEl.classList.remove('good'); }, 520);
      }
      renderPhonicsTray();
      renderBasinChips();
      updatePhonicsProgress();
      $$('.ph-basin').forEach(function (b) { b.classList.remove('armed'); });
      const def = D.SOUNDS[kind];
      showToast('good', w.word + ' has the ' + def.label + ' sound ' + def.ipa + '.', 1400);
      const tip = document.getElementById('ph-tip');
      if (tip) tip.textContent = 'Great! ' + w.word + ' → ' + def.label + ' ' + def.ipa;

      state.locked = false;
      if (p.done === p.total) {
        state.locked = true;
        later(finishPhonics, 700);
      }
    } else {
      p.mistakes++;
      state.locked = true;
      if (basinEl) {
        basinEl.classList.add('bad');
        later(function () { basinEl.classList.remove('bad'); }, 520);
      }
      sfx.wrong();
      showToast('bad', 'Try again! Listen in your head.', 1200);
      later(function () { state.locked = false; }, 600);
    }
  }

  function renderBasinChips() {
    const p = state.phonics;
    if (!p) return;
    ['s', 'sh'].forEach(function (kind) {
      const host = document.getElementById('basin-' + kind);
      if (!host) return;
      const words = p.words.filter(function (w) { return p.sorted[w.id] === kind; });
      host.innerHTML = words.map(function (w) {
        return '<span class="basin-chip">' + esc(w.word) + '</span>';
      }).join('');
    });
  }

  function finishPhonics() {
    const p = state.phonics;
    if (!p) return;
    const stars = p.mistakes === 0 ? 3 : p.mistakes <= 2 ? 2 : 1;
    const nextLevel = p.level.id === 'easy' ? 'medium'
      : p.level.id === 'medium' ? 'challenge' : null;
    showResult({
      emoji: '🔤',
      title: 'Super phonics!',
      message: 'You sorted all ' + p.total + ' words into S /s/ and SH /ʃ/.',
      stars: stars,
      score: state.score,
      replay: function () { startPhonics(state.difficulty); },
      next: nextLevel ? function () { startPhonics(nextLevel); } : null,
      nextLabel: nextLevel ? 'Next Level ➜' : null
    });
    setHud('phonics', 'Finished!', state.score);
  }

  /* ============================================================
     Bubble background
     ============================================================ */
  function buildBubbles() {
    const host = $('#bubbles');
    if (!host) return;
    let html = '';
    for (let i = 0; i < 16; i++) {
      const size = 6 + Math.random() * 22;
      const left = 2 + Math.random() * 96;
      const dur = 11 + Math.random() * 13;
      const delay = -Math.random() * 22;
      html += '<span class="b" style="left:' + left.toFixed(1) + '%;width:' + size.toFixed(1) +
        'px;height:' + size.toFixed(1) + 'px;animation-duration:' + dur.toFixed(1) +
        's;animation-delay:' + delay.toFixed(1) + 's"></span>';
    }
    host.innerHTML = html;
  }

  /* ============================================================
     Boot
     ============================================================ */
  function init() {
    const params = (window.location.search || '');
    devMode = CONFIG.devOverride === true || /[?&]dev=1/.test(params);

    rotateEl = $('#rotate-gate');
    deviceEl = $('#device-gate');

    sizeCanvas();
    buildBubbles();
    renderMenuCast();
    renderMenuArt();
    updateSoundButtons();
    updateGates();
    showScreen('screen-menu');

    $$('.activity-card').forEach(function (card) {
      card.addEventListener('click', function () {
        sfx.tap();
        openActivity(card.dataset.activity);
      });
    });

    document.addEventListener('click', function (e) {
      const actionEl = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!actionEl) return;
      const action = actionEl.dataset.action;
      if (action === 'sound') {
        soundOn = !soundOn;
        updateSoundButtons();
        if (soundOn) sfx.tap();
        return;
      }
      if (action === 'fullscreen') { toggleFullscreen(); return; }
      if (action === 'menu') { hudTap(); goMenu(); return; }
      if (action === 'hub') { hudTap(); window.location.href = '../index.html'; return; }
      if (action === 'restart') { restartActivity(); return; }
    });

    window.addEventListener('resize', function () {
      sizeCanvas();
      updateGates();
    });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        sizeCanvas();
        updateGates();
      }, 250);
    });

    document.addEventListener('fullscreenchange', function () {
      setTimeout(function () {
        sizeCanvas();
        updateGates();
      }, 120);
    });

    document.addEventListener('webkitfullscreenchange', function () {
      setTimeout(function () {
        sizeCanvas();
        updateGates();
      }, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
