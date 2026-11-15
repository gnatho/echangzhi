/*
 * Story Sequencer
 * ---------------
 * Two-tap placement game (no drag and drop):
 *   1. Tap a sentence in the bank.
 *   2. Tap a numbered position.
 * Tapping a placed sentence selects it; tapping another position swaps or moves it.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var story = null;
  var cards = [];
  var positions = [];
  var bank = [];
  var selected = null; /* { from: 'bank' | 'slot', id, index } */
  var history = [];
  var checked = false;
  var score = null;
  var completed = false;

  var els = {};

  function init() {
    els = {
      slots: $('#seq-slots'),
      bank: $('#seq-bank'),
      score: $('#seq-score'),
      placed: $('#seq-placed'),
      instruction: $('#seq-instruction'),
      feedback: $('#seq-feedback'),
      feedbackTitle: $('#seq-feedback-title'),
      feedbackText: $('#seq-feedback-text'),
      read: $('#seq-read'),
      undo: $('#seq-undo'),
      reset: $('#seq-reset'),
      check: $('#seq-check'),
      correct: $('#seq-correct'),
      shuffle: $('#seq-shuffle'),
      help: $('#seq-help-btn')
    };

    if (els.slots) {
      els.slots.addEventListener('click', function (event) {
        var slot = event.target.closest('.slot');
        if (!slot) return;
        onSlotClick(parseInt(slot.getAttribute('data-index'), 10));
      });
    }

    if (els.bank) {
      els.bank.addEventListener('click', function (event) {
        var card = event.target.closest('.sentence-card');
        if (!card) return;
        onBankClick(parseInt(card.getAttribute('data-id'), 10));
      });
    }

    if (els.undo) els.undo.addEventListener('click', undo);
    if (els.reset) els.reset.addEventListener('click', reset);
    if (els.check) els.check.addEventListener('click', check);
    if (els.correct) els.correct.addEventListener('click', function () { Stories.showOrder(story); });
    if (els.shuffle) els.shuffle.addEventListener('click', shuffleBank);
    if (els.read) els.read.addEventListener('click', function () { Stories.openReader(story); });
    if (els.help) {
      els.help.addEventListener('click', function () {
        var modal = document.getElementById('seq-help-modal');
        if (modal) modal.hidden = false;
        document.body.classList.add('modal-open');
      });
    }
  }

  function start(storyData) {
    story = storyData;
    cards = story.sequencing.map(function (text, index) {
      return { id: index, text: text };
    });

    var saved = Stories.getActivityState('sequencer');
    if (saved && isValidState(saved)) {
      positions = saved.positions.slice();
      bank = saved.bank.slice();
      checked = !!saved.checked;
      score = typeof saved.score === 'number' ? saved.score : null;
      completed = !!saved.completed && score === cards.length;
      selected = null;
      history = [];
    } else {
      resetState(true);
    }

    render();
  }

  function isValidState(saved) {
    if (!saved || !Array.isArray(saved.positions) || !Array.isArray(saved.bank)) return false;
    if (saved.positions.length !== cards.length) return false;

    var seen = {};
    var i;
    for (i = 0; i < saved.positions.length; i++) {
      var pos = saved.positions[i];
      if (pos === null || pos === undefined) continue;
      if (typeof pos !== 'number' || pos < 0 || pos >= cards.length || seen[pos]) return false;
      seen[pos] = true;
    }
    for (i = 0; i < saved.bank.length; i++) {
      var id = saved.bank[i];
      if (typeof id !== 'number' || id < 0 || id >= cards.length || seen[id]) return false;
      seen[id] = true;
    }
    return Object.keys(seen).length === cards.length;
  }

  function resetState(shouldSave) {
    positions = new Array(cards.length).fill(null);
    bank = shuffle(cards.map(function (card) { return card.id; }));
    selected = null;
    history = [];
    checked = false;
    score = null;
    completed = false;
    if (shouldSave !== false) save();
  }

  function save() {
    Stories.setActivityState('sequencer', {
      positions: positions,
      bank: bank,
      checked: checked,
      score: score,
      completed: completed
    });

    if (completed) {
      Stories.setProgress('sequencer', {
        status: 'completed',
        score: score,
        total: cards.length,
        updatedAt: Date.now()
      });
    } else if (checked && score !== null) {
      Stories.setProgress('sequencer', {
        status: 'in-progress',
        score: score,
        total: cards.length,
        updatedAt: Date.now()
      });
    } else if (positions.some(function (id) { return id !== null; })) {
      Stories.setProgress('sequencer', {
        status: 'in-progress',
        score: null,
        total: cards.length,
        updatedAt: Date.now()
      });
    } else {
      Stories.setProgress('sequencer', null);
    }
  }

  function pushHistory() {
    history.push({ positions: positions.slice(), bank: bank.slice() });
    if (history.length > 80) history.shift();
  }

  function clearFeedback() {
    if (!checked) return;
    checked = false;
    score = null;
    completed = false;
  }

  function onBankClick(id) {
    if (completed) {
      Stories.toast('Tap Reset to start again.');
      return;
    }
    clearFeedback();

    if (selected && selected.from === 'bank' && selected.id === id) {
      selected = null;
    } else {
      selected = { from: 'bank', id: id };
    }
    save();
    render();
  }

  function onSlotClick(index) {
    if (completed) {
      Stories.toast('Tap Reset to start again.');
      return;
    }

    clearFeedback();

    if (!selected) {
      if (positions[index] === null || positions[index] === undefined) {
        Stories.toast('Tap a sentence in the bank first.');
        return;
      }
      selected = { from: 'slot', id: positions[index], index: index };
      save();
      render();
      return;
    }

    if (selected.from === 'bank') {
      var cardId = selected.id;
      var occupant = positions[index];
      pushHistory();
      positions[index] = cardId;
      bank = bank.filter(function (id) { return id !== cardId; });
      if (occupant !== null && occupant !== undefined) bank.push(occupant);
      selected = null;
    } else {
      if (selected.index === index) {
        selected = null;
        save();
        render();
        return;
      }

      pushHistory();
      var moving = positions[selected.index];
      var target = positions[index];
      positions[index] = moving;
      positions[selected.index] = (target === undefined ? null : target);
      selected = null;
    }

    save();
    render();
  }

  function undo() {
    if (!history.length) {
      Stories.toast('Nothing to undo yet.');
      return;
    }
    var snap = history.pop();
    positions = snap.positions;
    bank = snap.bank;
    selected = null;
    checked = false;
    score = null;
    completed = false;
    save();
    render();
  }

  function reset() {
    Stories.confirm('Reset the sequencer and start again?', doReset, 'Reset');
  }

  function doReset() {
    resetState(true);
    render();
  }

  function shuffleBank() {
    if (completed) {
      Stories.toast('Tap Reset to start again.');
      return;
    }
    if (!bank.length) {
      Stories.toast('All sentences are already placed.');
      return;
    }
    bank = shuffle(bank);
    selected = null;
    checked = false;
    score = null;
    save();
    render();
  }

  function check() {
    if (completed) return;
    if (positions.some(function (id) { return id === null || id === undefined; })) {
      Stories.toast('Place all ' + cards.length + ' sentences first.');
      return;
    }

    score = positions.reduce(function (total, id, index) {
      return total + (id === index ? 1 : 0);
    }, 0);
    checked = true;
    completed = score === cards.length;

    save();
    render();

    if (completed) {
      Stories.confetti();
    }
  }

  function render() {
    renderSlots();
    renderBank();
    renderChrome();
    renderFeedback();
  }

  function renderSlots() {
    if (!els.slots) return;
    els.slots.innerHTML = '';

    positions.forEach(function (cardId, index) {
      var slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'slot ' + (cardId === null || cardId === undefined ? 'empty' : 'filled');
      slot.setAttribute('data-index', String(index));
      slot.setAttribute('aria-label', 'Position ' + (index + 1) + (cardId === null || cardId === undefined ? ', empty' : ', ' + cards[cardId].text));

      if (selected) slot.classList.add('available');
      if (selected && selected.from === 'slot' && selected.index === index) slot.classList.add('selected');

      if (checked && cardId !== null && cardId !== undefined) {
        slot.classList.add(cardId === index ? 'correct' : 'incorrect');
      } else if (checked) {
        slot.classList.add('incorrect');
      }

      var number = document.createElement('span');
      number.className = 'slot-number';
      number.textContent = String(index + 1);

      var text = document.createElement('span');
      text.className = 'slot-text';
      text.textContent = (cardId === null || cardId === undefined)
        ? 'Tap here'
        : cards[cardId].text;

      slot.appendChild(number);
      slot.appendChild(text);
      els.slots.appendChild(slot);
    });
  }

  function renderBank() {
    if (!els.bank) return;
    els.bank.innerHTML = '';

    bank.forEach(function (id) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'sentence-card';
      card.setAttribute('data-id', String(id));
      if (selected && selected.from === 'bank' && selected.id === id) {
        card.classList.add('selected');
      }
      card.textContent = cards[id].text;
      els.bank.appendChild(card);
    });

    if (!bank.length) {
      var empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'All sentences are placed. Tap a sentence in the story line to move it.';
      els.bank.appendChild(empty);
    }
  }

  function renderChrome() {
    var placed = positions.filter(function (id) { return id !== null && id !== undefined; }).length;
    if (els.placed) els.placed.textContent = placed + ' / ' + cards.length + ' placed';
    if (els.score) {
      els.score.textContent = checked && score !== null
        ? 'Score: ' + score + ' / ' + cards.length
        : 'Score: –';
      els.score.classList.toggle('good', completed);
    }

    if (els.instruction) {
      if (completed) {
        els.instruction.textContent = 'Perfect! You put the whole story in order.';
      } else if (selected) {
        els.instruction.textContent = 'Now tap a numbered position to place the sentence.';
      } else {
        els.instruction.textContent = 'Tap a sentence, then tap where you want to place it.';
      }
    }

    if (els.undo) els.undo.disabled = history.length === 0 || completed;
    if (els.check) els.check.disabled = completed;
    if (els.shuffle) els.shuffle.disabled = completed || bank.length === 0;
  }

  function renderFeedback() {
    if (!els.feedback) return;

    if (!checked || score === null) {
      els.feedback.hidden = true;
      els.feedback.classList.remove('ok', 'warn');
      return;
    }

    els.feedback.hidden = false;
    els.feedback.classList.toggle('ok', completed);
    els.feedback.classList.toggle('warn', !completed);

    if (els.feedbackTitle) {
      els.feedbackTitle.textContent = completed
        ? 'Perfect — ' + cards.length + ' out of ' + cards.length + '!'
        : 'Good try!';
    }
    if (els.feedbackText) {
      els.feedbackText.textContent = completed
        ? 'You put all ' + cards.length + ' sentences in the correct order. Read the complete story and practise retelling it.'
        : 'You scored ' + score + ' out of ' + cards.length + '. Look at the red sentences and try again.';
    }
    if (els.read) els.read.hidden = !completed;
  }

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

  window.Sequencer = {
    init: init,
    start: start
  };
})();