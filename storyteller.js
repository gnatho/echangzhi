/*
 * Interactive Storyteller
 * -----------------------
 * Students build their own version of the story by choosing one sentence from
 * each of ten stages. The story preview updates immediately. There are no wrong
 * answers: every option is grammatical and appropriate for the story.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var story = null;
  var stages = [];
  var state = null;
  var advanceTimer = null;
  var els = {};

  function init() {
    els = {
      progressPill: $('#st-progress-pill'),
      random: $('#st-random'),
      editor: $('#st-editor'),
      reading: $('#st-reading'),
      steps: $('#st-steps'),
      stageKicker: $('#st-stage-kicker'),
      stageTitle: $('#st-stage-title'),
      stageQuestion: $('#st-stage-question'),
      options: $('#st-options'),
      skip: $('#st-skip'),
      count: $('#st-count'),
      preview: $('#st-preview'),
      read: $('#st-read'),
      restart: $('#st-restart'),
      readingTitle: $('#st-reading-title'),
      readingBody: $('#st-reading-body'),
      copy: $('#st-copy'),
      print: $('#st-print'),
      edit: $('#st-edit'),
      restart2: $('#st-restart-2'),
      done: $('#st-done')
    };

    if (els.steps) {
      els.steps.addEventListener('click', function (event) {
        var chip = event.target.closest('.st-step');
        if (!chip || chip.disabled) return;
        goToStage(parseInt(chip.getAttribute('data-stage'), 10));
      });
    }

    if (els.options) {
      els.options.addEventListener('click', function (event) {
        var option = event.target.closest('.st-option');
        if (!option) return;
        selectOption(state.current, parseInt(option.getAttribute('data-option'), 10));
      });
    }

    if (els.skip) els.skip.addEventListener('click', skipStage);
    if (els.random) els.random.addEventListener('click', randomize);
    if (els.read) els.read.addEventListener('click', readStory);
    if (els.restart) els.restart.addEventListener('click', restart);
    if (els.restart2) els.restart2.addEventListener('click', restart);
    if (els.edit) els.edit.addEventListener('click', editStory);
    if (els.done) els.done.addEventListener('click', function () { Stories.goToStory(); });
    if (els.copy) els.copy.addEventListener('click', copyStory);
    if (els.print) els.print.addEventListener('click', printStory);
  }

  function start(storyData) {
    story = storyData;
    stages = story.storyteller || [];

    var subtitle = $('#st-subtitle');
    if (subtitle) {
      subtitle.textContent = 'Choose your favourite sentences and create your own version of ' + story.title + '!';
    }

    var saved = Stories.getActivityState('storyteller');
    if (saved && isValidState(saved)) {
      state = {
        choices: saved.choices.slice(),
        skipped: saved.skipped.slice(),
        maxUnlocked: saved.maxUnlocked,
        current: saved.current,
        reading: !!saved.reading
      };
    } else {
      state = {
        choices: new Array(stages.length).fill(null),
        skipped: new Array(stages.length).fill(false),
        maxUnlocked: 0,
        current: 0,
        reading: false
      };
      save();
    }

    render();
  }

  function isValidState(saved) {
    if (!saved || !Array.isArray(saved.choices) || !Array.isArray(saved.skipped)) return false;
    if (saved.choices.length !== stages.length || saved.skipped.length !== stages.length) return false;
    for (var i = 0; i < stages.length; i++) {
      var choice = saved.choices[i];
      if (choice !== null && choice !== undefined) {
        if (typeof choice !== 'number' || choice < 0 || choice >= stages[i].options.length) return false;
      }
    }
    saved.maxUnlocked = Math.max(0, Math.min(stages.length - 1, saved.maxUnlocked || 0));
    saved.current = Math.max(0, Math.min(stages.length - 1, saved.current || 0));
    return true;
  }

  function save() {
    Stories.setActivityState('storyteller', {
      choices: state.choices,
      skipped: state.skipped,
      maxUnlocked: state.maxUnlocked,
      current: state.current,
      reading: state.reading
    });

    var done = doneCount();
    if (done === stages.length && stages.length > 0) {
      Stories.setProgress('storyteller', {
        status: 'completed',
        done: done,
        total: stages.length,
        updatedAt: Date.now()
      });
    } else if (done > 0) {
      Stories.setProgress('storyteller', {
        status: 'in-progress',
        done: done,
        total: stages.length,
        updatedAt: Date.now()
      });
    } else {
      Stories.setProgress('storyteller', null);
    }
  }

  function doneCount() {
    return state.choices.filter(function (choice, index) {
      return choice !== null && choice !== undefined ? true : !!state.skipped[index];
    }).length;
  }

  function allDone() {
    return stages.length > 0 && doneCount() === stages.length;
  }

  function render() {
    if (!els.editor || !els.reading) return;
    if (state.reading) {
      els.editor.hidden = true;
      els.reading.hidden = false;
      renderReading();
    } else {
      els.reading.hidden = true;
      els.editor.hidden = false;
      renderEditor();
    }
  }

  function renderEditor() {
    renderSteps();

    var stage = stages[state.current];
    if (!stage) return;

    if (els.progressPill) {
      els.progressPill.textContent = 'Step ' + (state.current + 1) + ' of ' + stages.length;
    }
    if (els.stageKicker) {
      els.stageKicker.textContent = 'Step ' + (state.current + 1) + ' of ' + stages.length;
    }
    if (els.stageTitle) els.stageTitle.textContent = stage.title;
    if (els.stageQuestion) els.stageQuestion.textContent = stage.question;

    renderOptions(stage);
    renderPreview();

    if (els.skip) {
      els.skip.textContent = state.skipped[state.current] ? 'Undo skip' : 'Skip this step';
      els.skip.disabled = false;
    }
  }

  function renderSteps() {
    if (!els.steps) return;
    els.steps.innerHTML = '';

    stages.forEach(function (stage, index) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'st-step';
      chip.setAttribute('data-stage', String(index));
      chip.setAttribute('aria-label', 'Step ' + (index + 1) + ': ' + stage.title);

      if (index === state.current) chip.classList.add('current');
      if (state.choices[index] !== null && state.choices[index] !== undefined) chip.classList.add('done');
      if (state.skipped[index] && state.choices[index] === null) chip.classList.add('skipped');
      if (index > state.maxUnlocked) {
        chip.classList.add('locked');
        chip.disabled = true;
        chip.textContent = '🔒';
      } else if (state.choices[index] !== null && state.choices[index] !== undefined) {
        chip.textContent = '✓';
      } else if (state.skipped[index]) {
        chip.textContent = '–';
      } else {
        chip.textContent = String(index + 1);
      }

      els.steps.appendChild(chip);
    });
  }

  function renderOptions(stage) {
    if (!els.options) return;
    els.options.innerHTML = '';

    stage.options.forEach(function (option, index) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'st-option';
      card.setAttribute('data-option', String(index));
      if (state.choices[state.current] === index) card.classList.add('selected');

      var marker = document.createElement('span');
      marker.className = 'st-option-marker';
      marker.textContent = state.choices[state.current] === index ? '✓' : '○';

      var text = document.createElement('span');
      text.className = 'st-option-text';
      text.textContent = option;

      card.appendChild(marker);
      card.appendChild(text);
      els.options.appendChild(card);
    });
  }

  function renderPreview() {
    if (!els.preview) return;
    els.preview.innerHTML = '';

    var sentences = selectedSentences();

    if (!sentences.length) {
      var empty = document.createElement('p');
      empty.className = 'preview-empty';
      empty.textContent = 'Your story will appear here as you choose sentences.';
      els.preview.appendChild(empty);
    } else {
      var title = document.createElement('h3');
      title.className = 'preview-title';
      title.textContent = story.title;
      els.preview.appendChild(title);

      sentences.forEach(function (sentence) {
        var p = document.createElement('p');
        p.className = 'preview-sentence';
        p.textContent = sentence;
        els.preview.appendChild(p);
      });
    }

    if (els.count) {
      els.count.textContent = doneCount() + ' of ' + stages.length + ' steps';
    }
    if (els.read) els.read.disabled = !allDone();

    /* Keep the newest sentence in view. */
    els.preview.scrollTop = els.preview.scrollHeight;
  }

  function selectedSentences() {
    var sentences = [];
    state.choices.forEach(function (choice, index) {
      if (choice !== null && choice !== undefined) {
        sentences.push(stages[index].options[choice]);
      }
    });
    return sentences;
  }

  function goToStage(index) {
    if (index < 0 || index >= stages.length || index > state.maxUnlocked) return;
    clearTimeout(advanceTimer);
    state.current = index;
    state.reading = false;
    save();
    render();
  }

  function selectOption(stageIndex, optionIndex) {
    if (stageIndex < 0 || stageIndex >= stages.length) return;
    if (stageIndex > state.maxUnlocked) return;

    clearTimeout(advanceTimer);

    state.choices[stageIndex] = optionIndex;
    state.skipped[stageIndex] = false;
    state.maxUnlocked = Math.max(state.maxUnlocked, Math.min(stageIndex + 1, stages.length - 1));
    state.current = stageIndex;
    state.reading = false;

    save();
    render();

    if (stageIndex < stages.length - 1) {
      var expectedChoice = optionIndex;
      advanceTimer = setTimeout(function () {
        if (state.choices[stageIndex] !== expectedChoice) return;
        if (state.current !== stageIndex) return;
        state.current = stageIndex + 1;
        state.maxUnlocked = Math.max(state.maxUnlocked, Math.min(stageIndex + 1, stages.length - 1));
        save();
        render();
      }, 600);
    }
  }

  function skipStage() {
    clearTimeout(advanceTimer);
    var index = state.current;
    if (index < 0 || index >= stages.length) return;

    if (state.skipped[index] && state.choices[index] === null) {
      state.skipped[index] = false;
      save();
      render();
      return;
    }

    state.skipped[index] = true;
    state.choices[index] = null;
    state.maxUnlocked = Math.max(state.maxUnlocked, Math.min(index + 1, stages.length - 1));
    save();
    render();

    if (index < stages.length - 1) {
      advanceTimer = setTimeout(function () {
        if (state.current !== index) return;
        if (!state.skipped[index]) return;
        state.current = index + 1;
        save();
        render();
      }, 280);
    }
  }

  function randomize() {
    clearTimeout(advanceTimer);
    state.choices = stages.map(function (stage) {
      return Math.floor(Math.random() * stage.options.length);
    });
    state.skipped = new Array(stages.length).fill(false);
    state.maxUnlocked = stages.length - 1;
    state.current = stages.length - 1;
    state.reading = true;
    save();
    render();
    Stories.confetti();
  }

  function restart() {
    Stories.confirm('Start again? This will clear your story.', function () {
      clearTimeout(advanceTimer);
      state = {
        choices: new Array(stages.length).fill(null),
        skipped: new Array(stages.length).fill(false),
        maxUnlocked: 0,
        current: 0,
        reading: false
      };
      save();
      render();
    }, 'Start again');
  }

  function readStory() {
    if (!allDone()) {
      Stories.toast('Finish all ten steps first, or tap Random story.');
      return;
    }
    state.reading = true;
    save();
    render();
  }

  function editStory() {
    state.reading = false;
    var firstOpen = state.choices.findIndex(function (choice) { return choice === null || choice === undefined; });
    state.current = firstOpen === -1 ? 0 : firstOpen;
    save();
    render();
  }

  function renderReading() {
    if (!els.readingTitle || !els.readingBody) return;

    els.readingTitle.textContent = story.title;
    els.readingBody.innerHTML = '';

    var sentences = selectedSentences();
    if (!sentences.length) {
      var empty = document.createElement('p');
      empty.textContent = 'Your story is empty. Tap Edit story to choose some sentences.';
      els.readingBody.appendChild(empty);
      return;
    }

    sentences.forEach(function (sentence) {
      var p = document.createElement('p');
      p.textContent = sentence;
      els.readingBody.appendChild(p);
    });
  }

  function buildStoryText() {
    return story.title + '\n\n' + selectedSentences().join('\n\n');
  }

  function copyStory() {
    var text = buildStoryText();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        Stories.toast('Story copied!');
      }, function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      copied = false;
    }

    document.body.removeChild(area);
    Stories.toast(copied ? 'Story copied!' : 'Could not copy the story.');
  }

  function printStory() {
    var area = document.getElementById('print-area');
    if (!area) return;

    area.innerHTML = '';
    var title = document.createElement('h1');
    title.textContent = story.title;
    area.appendChild(title);

    selectedSentences().forEach(function (sentence) {
      var p = document.createElement('p');
      p.textContent = sentence;
      area.appendChild(p);
    });

    window.print();
  }

  window.Storyteller = {
    init: init,
    start: start
  };
})();