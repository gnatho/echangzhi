/*
 * Stories application shell
 * -------------------------
 * Owns navigation, the reusable story library lookup, session progress and the
 * shared modals (reader, vocabulary, confirmation, correct order).
 *
 * The three activities are separate files and talk to this file through the
 * window.Stories API at the bottom of this file.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'stories.session.v1';
  var UNIT_COUNT = 10;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = {
    bookId: null,
    unitId: null,
    storyId: null,
    screen: 'screen-books'
  };

  var session = loadSession();
  var backHandler = null;
  var toastTimer = null;
  var confirmCallback = null;

  /* ------------------------------------------------------------------ *
   * Session storage
   * ------------------------------------------------------------------ */

  function loadSession() {
    var empty = { progress: {}, activities: {} };
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return empty;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return empty;
      if (!parsed.progress) parsed.progress = {};
      if (!parsed.activities) parsed.activities = {};
      return parsed;
    } catch (err) {
      return empty;
    }
  }

  function saveSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      /* Storage may be unavailable; the activities still work in memory. */
    }
  }

  function storyKey(story) {
    if (!story) return '';
    return story.bookId + '|' + story.unitId + '|' + story.id;
  }

  function currentStory() {
    if (!state.bookId || !state.unitId || !state.storyId) return null;
    var story = StoryData.getStory(state.bookId, state.unitId, state.storyId);
    if (!story) return null;
    /* Attach ids so activities can build a stable storage key. */
    story.bookId = state.bookId;
    story.unitId = state.unitId;
    return story;
  }

  function currentBook() {
    return state.bookId ? StoryData.getBook(state.bookId) : null;
  }

  function progressFor(story) {
    var key = storyKey(story);
    if (!key) return {};
    if (!session.progress[key]) session.progress[key] = {};
    return session.progress[key];
  }

  function getProgress(activity) {
    var story = currentStory();
    if (!story) return null;
    return progressFor(story)[activity] || null;
  }

  function setProgress(activity, data) {
    var story = currentStory();
    if (!story) return;
    var progress = progressFor(story);
    if (data === null || data === undefined) {
      delete progress[activity];
    } else {
      progress[activity] = data;
    }
    saveSession();
  }

  function getActivityState(activity) {
    var story = currentStory();
    if (!story) return null;
    var key = storyKey(story);
    if (!session.activities[key]) return null;
    return session.activities[key][activity] || null;
  }

  function setActivityState(activity, data) {
    var story = currentStory();
    if (!story) return;
    var key = storyKey(story);
    if (!session.activities[key]) session.activities[key] = {};
    session.activities[key][activity] = data;
    saveSession();
  }

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function unitNumber(unitId) {
    var match = /(\d+)$/.exec(unitId || '');
    return match ? parseInt(match[1], 10) : 0;
  }

  /* ------------------------------------------------------------------ *
   * Navigation
   * ------------------------------------------------------------------ */

  function showScreen(id) {
    $$('.screen').forEach(function (screen) {
      screen.classList.toggle('active', screen.id === id);
    });
    state.screen = id;
    var active = document.getElementById(id);
    if (active) active.scrollTop = 0;
    updateVocabButton();
    updateBrand();
  }

  function updateBrand() {
    var title = 'Stories';
    if (state.screen === 'screen-units') {
      var book = currentBook();
      if (book) title = book.title;
    } else if (state.screen === 'screen-story') {
      title = 'Story';
    } else if (state.screen === 'screen-sequencer') {
      title = 'Story Sequencer';
    } else if (state.screen === 'screen-quiz') {
      title = 'Story Quiz';
    } else if (state.screen === 'screen-storyteller') {
      title = 'Interactive Storyteller';
    }
    var brand = $('#brand-title');
    if (brand) brand.textContent = title;
    document.title = title === 'Stories' ? 'Stories' : title + ' · Stories';
  }

  function setBack(handler, label) {
    backHandler = handler;
    var btn = $('#back-btn');
    if (btn) {
      btn.hidden = false;
      btn.setAttribute('aria-label', label || 'Back');
      btn.title = label || 'Back';
    }
  }

  function goBack() {
    if (typeof backHandler === 'function') {
      backHandler();
    }
  }

  function goToHub() {
    window.location.href = 'index.html';
  }

  function goToBooks() {
    state.bookId = null;
    state.unitId = null;
    state.storyId = null;
    renderBooks();
    showScreen('screen-books');
    setBack(goToHub, 'Back to the main menu');
  }

  function goToUnits() {
    if (!state.bookId) return goToBooks();
    state.unitId = null;
    state.storyId = null;
    renderUnits();
    showScreen('screen-units');
    setBack(goToBooks, 'Back to books');
  }

  function backFromStory() {
    var stories = state.bookId && state.unitId ? StoryData.getStories(state.bookId, state.unitId) : [];
    if (stories.length > 1 && state.storyId) {
      state.storyId = null;
      renderStoryList(stories);
      showScreen('screen-story');
      setBack(goToUnits, 'Back to units');
    } else {
      goToUnits();
    }
  }

  function goToStory() {
    if (!state.storyId) return goToUnits();
    renderStoryDetail();
    showScreen('screen-story');
    setBack(backFromStory, 'Back to the story');
  }

  /* ------------------------------------------------------------------ *
   * Book screen
   * ------------------------------------------------------------------ */

  function renderBooks() {
    var grid = $('#book-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var books = StoryData.books();
    books.forEach(function (book) {
      var count = StoryData.countStories(book.id);
      var card = make('button', 'book-card theme-' + (book.theme || 'level6'));
      card.type = 'button';
      card.setAttribute('aria-label', book.title + (count ? ', ' + count + ' story' : ', coming soon'));

      var spine = make('span', 'book-spine');
      var emoji = make('span', 'book-emoji', book.emoji || '📘');
      emoji.setAttribute('aria-hidden', 'true');
      var title = make('span', 'book-title', book.title);
      var meta = make('span', 'book-meta', count ? (count === 1 ? '1 story' : count + ' stories') : 'Coming soon');

      card.appendChild(spine);
      card.appendChild(emoji);
      card.appendChild(title);
      card.appendChild(meta);
      card.addEventListener('click', function () { openBook(book.id); });
      grid.appendChild(card);
    });
  }

  function openBook(bookId) {
    state.bookId = bookId;
    state.unitId = null;
    state.storyId = null;
    renderUnits();
    showScreen('screen-units');
    setBack(goToBooks, 'Back to books');
  }

  /* ------------------------------------------------------------------ *
   * Unit screen
   * ------------------------------------------------------------------ */

  function renderUnits() {
    var book = currentBook();
    if (!book) return goToBooks();

    var title = $('#units-title');
    var subtitle = $('#units-subtitle');
    if (title) title.textContent = book.title;
    if (subtitle) {
      var total = StoryData.countStories(book.id);
      subtitle.textContent = total
        ? 'Tap a unit to find a story. ' + total + (total === 1 ? ' story available.' : ' stories available.')
        : 'Tap a unit to see what is coming soon.';
    }

    var grid = $('#unit-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (var i = 0; i < UNIT_COUNT; i++) {
      (function (index) {
        var unitId = 'unit-' + index;
        var stories = StoryData.getStories(state.bookId, unitId);
        var card = make('button', 'unit-card' + (stories.length ? ' has-story' : ''));
        card.type = 'button';
        card.setAttribute('aria-label', 'Unit ' + index + (stories.length ? ', story available' : ', no story yet'));

        var number = make('span', 'unit-number', 'Unit ' + index);
        var name;
        if (!stories.length) {
          name = make('span', 'unit-name', 'No story yet');
        } else if (stories.length === 1) {
          name = make('span', 'unit-name', stories[0].title);
        } else {
          name = make('span', 'unit-name', stories.length + ' stories');
        }

        card.appendChild(number);
        card.appendChild(name);

        if (stories.length) {
          card.appendChild(make('span', 'unit-badge', '★ Story'));
        }

        card.addEventListener('click', function () { openUnit(unitId); });
        grid.appendChild(card);
      })(i);
    }
  }

  function openUnit(unitId) {
    var stories = StoryData.getStories(state.bookId, unitId);
    if (!stories.length) {
      openModal('placeholder-modal');
      return;
    }

    state.unitId = unitId;

    if (stories.length === 1) {
      state.storyId = stories[0].id;
      renderStoryDetail();
      showScreen('screen-story');
      setBack(backFromStory, 'Back to units');
    } else {
      state.storyId = null;
      renderStoryList(stories);
      showScreen('screen-story');
      setBack(goToUnits, 'Back to units');
    }
  }

  /* ------------------------------------------------------------------ *
   * Story list / detail
   * ------------------------------------------------------------------ */

  function renderStoryList(stories) {
    var list = $('#story-list');
    var listView = $('#story-list-view');
    var detailView = $('#story-detail-view');
    if (!list || !listView || !detailView) return;

    var book = currentBook();
    var title = $('#story-list-title');
    if (title) {
      title.textContent = (book ? book.title : '') + ' · Unit ' + unitNumber(state.unitId) + ' stories';
    }

    list.innerHTML = '';
    stories.forEach(function (story) {
      var card = make('button', 'story-list-card');
      card.type = 'button';

      var emoji = make('span', 'story-list-emoji', story.emoji || '📖');
      emoji.setAttribute('aria-hidden', 'true');
      var copy = make('span', 'story-list-copy');
      copy.appendChild(make('strong', '', story.title));
      copy.appendChild(make('small', '', story.blurb || ''));

      card.appendChild(emoji);
      card.appendChild(copy);
      card.appendChild(make('span', 'story-list-go', 'Start →'));
      card.addEventListener('click', function () { openStory(story.id); });
      list.appendChild(card);
    });

    listView.hidden = false;
    detailView.hidden = true;
  }

  function renderStoryDetail() {
    var story = currentStory();
    var listView = $('#story-list-view');
    var detailView = $('#story-detail-view');
    if (!story || !listView || !detailView) return;

    listView.hidden = true;
    detailView.hidden = false;

    var book = currentBook();
    var eyebrow = $('#story-eyebrow');
    if (eyebrow) {
      eyebrow.textContent = (book ? book.title : '') + ' · Unit ' + unitNumber(state.unitId);
    }
    var title = $('#story-title');
    if (title) title.textContent = story.title;
    var blurb = $('#story-blurb');
    if (blurb) blurb.textContent = story.blurb || '';

    renderActivityStatus('sequencer');
    renderActivityStatus('quiz');
    renderActivityStatus('storyteller');
    updateVocabButton();
  }

  function statusLabel(activity) {
    var progress = getProgress(activity);
    if (!progress) return 'Not started';

    if (activity === 'quiz') {
      if (progress.status === 'completed') {
        return progress.score + ' / ' + progress.total;
      }
      if (progress.status === 'in-progress') {
        return (progress.answered || 0) + ' / ' + (progress.total || 25);
      }
    }

    if (activity === 'sequencer') {
      if (progress.status === 'completed') return 'Completed · ' + progress.score + ' / ' + progress.total;
      if (progress.status === 'in-progress') return 'In progress';
    }

    if (activity === 'storyteller') {
      if (progress.status === 'completed') return 'Completed';
      if (progress.status === 'in-progress') {
        return 'In progress · ' + (progress.done || 0) + ' / ' + (progress.total || 10);
      }
    }

    return 'Not started';
  }

  function renderActivityStatus(activity) {
    var el = document.getElementById('status-' + activity);
    if (!el) return;
    var progress = getProgress(activity);
    el.textContent = statusLabel(activity);
    var card = document.getElementById('activity-' + activity);
    if (card) {
      card.classList.toggle('is-complete', !!(progress && progress.status === 'completed'));
      card.classList.toggle('is-progress', !!(progress && progress.status === 'in-progress'));
    }
  }

  function openStory(storyId) {
    state.storyId = storyId;
    renderStoryDetail();
    showScreen('screen-story');
    setBack(backFromStory, 'Back');
  }

  /* ------------------------------------------------------------------ *
   * Activities
   * ------------------------------------------------------------------ */

  function launchActivity(activity) {
    var story = currentStory();
    if (!story) return;

    if (activity === 'sequencer' && window.Sequencer) {
      showScreen('screen-sequencer');
      setBack(goToStory, 'Back to the story');
      window.Sequencer.start(story);
    } else if (activity === 'quiz' && window.Quiz) {
      showScreen('screen-quiz');
      setBack(goToStory, 'Back to the story');
      window.Quiz.start(story);
    } else if (activity === 'storyteller' && window.Storyteller) {
      showScreen('screen-storyteller');
      setBack(goToStory, 'Back to the story');
      window.Storyteller.start(story);
    }
  }

  /* ------------------------------------------------------------------ *
   * Vocabulary / reader / order modals
   * ------------------------------------------------------------------ */

  function updateVocabButton() {
    var btn = $('#vocab-btn');
    if (!btn) return;
    var show = !!currentStory() && state.screen !== 'screen-books' && state.screen !== 'screen-units';
    btn.hidden = !show;
  }

  function openVocabulary(story) {
    var target = story || currentStory();
    if (!target || !target.vocabulary || !target.vocabulary.length) {
      toast('No vocabulary for this story yet.');
      return;
    }

    var list = $('#vocab-list');
    var detail = $('#vocab-detail');
    if (!list || !detail) return;

    list.innerHTML = '';
    var words = target.vocabulary;

    function select(index) {
      $$('.vocab-word', list).forEach(function (btn, i) {
        btn.classList.toggle('selected', i === index);
      });
      detail.innerHTML = '';
      var word = make('div', 'vocab-detail-word', words[index].word);
      var text = make('p', 'vocab-detail-text', words[index].explanation);
      detail.appendChild(word);
      detail.appendChild(text);
    }

    words.forEach(function (item, index) {
      var btn = make('button', 'vocab-word', item.word);
      btn.type = 'button';
      btn.addEventListener('click', function () { select(index); });
      list.appendChild(btn);
    });

    select(0);
    openModal('vocab-modal');
  }

  function openReader(story) {
    var target = story || currentStory();
    if (!target || !target.text) return;

    var title = $('#reader-title');
    var eyebrow = $('#reader-eyebrow');
    var body = $('#reader-body');
    if (title) title.textContent = target.title;
    if (eyebrow) eyebrow.textContent = 'The complete story';

    if (body) {
      body.innerHTML = '';
      target.text.forEach(function (paragraph) {
        body.appendChild(make('p', '', paragraph));
      });
    }

    openModal('reader-modal');
    if (body) body.scrollTop = 0;
  }

  function showOrder(story) {
    var target = story || currentStory();
    if (!target || !target.sequencing) return;
    var body = $('#order-body');
    if (!body) return;
    body.innerHTML = '';
    target.sequencing.forEach(function (sentence, index) {
      var li = make('li');
      li.appendChild(make('span', 'order-number', String(index + 1)));
      li.appendChild(make('span', 'order-text', sentence));
      body.appendChild(li);
    });
    openModal('order-modal');
  }

  /* ------------------------------------------------------------------ *
   * Modal plumbing
   * ------------------------------------------------------------------ */

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (!$$('.modal').some(function (m) { return !m.hidden; })) {
      document.body.classList.remove('modal-open');
    }
  }

  function closeTopModal() {
    var open = $$('.modal').filter(function (m) { return !m.hidden; });
    if (open.length) closeModal(open[open.length - 1]);
  }

  function confirmAction(message, onConfirm, yesLabel) {
    var text = $('#confirm-text');
    var yes = $('#confirm-yes');
    if (text) text.textContent = message;
    if (yes) yes.textContent = yesLabel || 'Yes, continue';
    confirmCallback = typeof onConfirm === 'function' ? onConfirm : null;
    openModal('confirm-modal');
  }

  /* ------------------------------------------------------------------ *
   * Toast / confetti / fullscreen
   * ------------------------------------------------------------------ */

  function toast(message) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 2300);
  }

  function confetti() {
    var layer = $('#confetti');
    if (!layer) return;
    var colors = ['#ffcc33', '#ff8a3d', '#2fbf71', '#2f80ed', '#f093fb', '#ffffff'];
    for (var i = 0; i < 28; i++) {
      var piece = make('span', 'confetti-piece');
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
      piece.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      layer.appendChild(piece);
      (function (node) {
        setTimeout(function () { node.remove(); }, 2100);
      })(piece);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      var request = document.documentElement.requestFullscreen;
      if (request) {
        var result = request.call(document.documentElement);
        if (result && result.catch) result.catch(function () {});
      }
    } else if (document.exitFullscreen) {
      var exit = document.exitFullscreen();
      if (exit && exit.catch) exit.catch(function () {});
    }
  }

  /* ------------------------------------------------------------------ *
   * Global bindings / init
   * ------------------------------------------------------------------ */

  function bindGlobal() {
    var backBtn = $('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function (event) {
        event.preventDefault();
        goBack();
      });
    }

    var fsBtn = $('#fs-btn');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

    var vocabBtn = $('#vocab-btn');
    if (vocabBtn) {
      vocabBtn.addEventListener('click', function () {
        openVocabulary(currentStory());
      });
    }

    var storyVocab = $('#story-vocab');
    if (storyVocab) {
      storyVocab.addEventListener('click', function () {
        openVocabulary(currentStory());
      });
    }

    var storyRead = $('#story-read');
    if (storyRead) {
      storyRead.addEventListener('click', function () {
        openReader(currentStory());
      });
    }

    $$('.activity-card').forEach(function (card) {
      card.addEventListener('click', function () {
        launchActivity(card.getAttribute('data-activity'));
      });
    });

    $$('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal) closeModal(modal);
      });
      $$('[data-close]', modal).forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal(modal); });
      });
    });

    var confirmYes = $('#confirm-yes');
    if (confirmYes) {
      confirmYes.addEventListener('click', function () {
        var callback = confirmCallback;
        confirmCallback = null;
        closeModal($('#confirm-modal'));
        if (callback) callback();
      });
    }

    var confirmNo = $('#confirm-no');
    if (confirmNo) {
      confirmNo.addEventListener('click', function () {
        confirmCallback = null;
        closeModal($('#confirm-modal'));
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeTopModal();
    });

    /* Keep iOS Safari honest if the viewport changes while the app is open. */
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        var overlay = $('#rotate-overlay');
        if (!overlay) return;
        var portrait = window.innerHeight > window.innerWidth;
        overlay.classList.toggle('force-show', portrait);
        overlay.classList.toggle('force-hide', !portrait);
      }, 120);
    });
  }

  function init() {
    renderBooks();
    bindGlobal();
    showScreen('screen-books');
    setBack(goToHub, 'Back to the main menu');

    if (window.Sequencer && window.Sequencer.init) window.Sequencer.init();
    if (window.Quiz && window.Quiz.init) window.Quiz.init();
    if (window.Storyteller && window.Storyteller.init) window.Storyteller.init();

    document.documentElement.classList.add('stories-ready');
  }

  /* ------------------------------------------------------------------ *
   * Public API used by the activities
   * ------------------------------------------------------------------ */

  window.Stories = {
    init: init,
    showScreen: showScreen,
    goToStory: goToStory,
    getStory: currentStory,
    getBook: currentBook,
    shuffle: shuffle,
    toast: toast,
    confetti: confetti,
    openReader: openReader,
    openVocabulary: function () { openVocabulary(currentStory()); },
    showOrder: showOrder,
    confirm: confirmAction,
    getProgress: getProgress,
    setProgress: setProgress,
    getActivityState: getActivityState,
    setActivityState: setActivityState,
    activityKey: function () {
      var story = currentStory();
      return story ? storyKey(story) : '';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();