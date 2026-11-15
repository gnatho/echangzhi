/*
 * Story Quiz
 * ----------
 * Quick Quiz (10 random questions) or Full Quiz (all questions).
 * Options are shuffled per question while the correct answer is placed in a
 * balanced position (A-D) across the quiz session.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var LETTERS = ['A', 'B', 'C', 'D'];

  var story = null;
  var session = null;
  var els = {};

  function init() {
    els = {
      start: $('#quiz-start'),
      play: $('#quiz-play'),
      results: $('#quiz-results'),
      quick: $('#quiz-quick'),
      full: $('#quiz-full'),
      resume: $('#quiz-resume'),
      quickBest: $('#quick-best'),
      fullBest: $('#full-best'),
      counter: $('#quiz-counter'),
      progressFill: $('#quiz-progress-fill'),
      liveScore: $('#quiz-live-score'),
      qIndex: $('#quiz-q-index'),
      qText: $('#quiz-q-text'),
      explanation: $('#quiz-explanation'),
      verdict: $('#quiz-verdict'),
      explanationText: $('#quiz-explanation-text'),
      options: $('#quiz-options'),
      submit: $('#quiz-submit'),
      next: $('#quiz-continue'),
      scorePill: $('#quiz-score-pill'),
      resultsEmoji: $('#quiz-results-emoji'),
      resultsTitle: $('#quiz-results-title'),
      resultsMessage: $('#quiz-results-message'),
      resultScore: $('#quiz-result-score'),
      resultWrong: $('#quiz-result-wrong'),
      resultPercent: $('#quiz-result-percent'),
      resultTotal: $('#quiz-result-total'),
      reviewBtn: $('#quiz-review-btn'),
      reviewList: $('#quiz-review-list'),
      again: $('#quiz-again'),
      modes: $('#quiz-modes'),
      back: $('#quiz-back')
    };

    if (els.quick) els.quick.addEventListener('click', function () { startQuiz('quick'); });
    if (els.full) els.full.addEventListener('click', function () { startQuiz('full'); });
    if (els.resume) els.resume.addEventListener('click', continueQuiz);

    if (els.options) {
      els.options.addEventListener('click', function (event) {
        var card = event.target.closest('.answer-card');
        if (!card || card.disabled) return;
        selectOption(card.getAttribute('data-value'));
      });
    }

    if (els.submit) els.submit.addEventListener('click', submitAnswer);
    if (els.next) els.next.addEventListener('click', nextQuestion);
    if (els.reviewBtn) {
      els.reviewBtn.addEventListener('click', function () {
        if (!els.reviewList) return;
        var willShow = els.reviewList.hidden;
        els.reviewList.hidden = !willShow;
        updateReviewButtonLabel();
      });
    }
    if (els.again) {
      els.again.addEventListener('click', function () {
        if (session) startQuiz(session.mode);
      });
    }
    if (els.modes) {
      els.modes.addEventListener('click', function () {
        session = null;
        showStart();
      });
    }
    if (els.back) els.back.addEventListener('click', function () { Stories.goToStory(); });
  }

  function start(storyData) {
    story = storyData;
    var quizSize = story.quiz ? story.quiz.length : 0;
    var quickSmall = document.querySelector('#quiz-quick small');
    if (quickSmall) quickSmall.textContent = Math.min(10, quizSize) + ' random questions';
    var fullSmall = document.querySelector('#quiz-full small');
    if (fullSmall) fullSmall.textContent = 'All ' + quizSize + ' questions';
    var saved = Stories.getActivityState('quiz');
    if (isValidSession(saved)) {
      session = saved;
    } else {
      session = null;
    }
    showStart();
  }

  function isValidSession(saved) {
    if (!saved || saved.finished) return false;
    if (saved.mode !== 'quick' && saved.mode !== 'full') return false;
    if (!Array.isArray(saved.questions) || !saved.questions.length) return false;
    if (typeof saved.index !== 'number' || saved.index < 0 || saved.index >= saved.questions.length) return false;
    if (!Array.isArray(saved.answers) || saved.answers.length !== saved.questions.length) return false;
    for (var i = 0; i < saved.questions.length; i++) {
      var q = saved.questions[i];
      if (!q || typeof q.q !== 'string' || !Array.isArray(q.options) || q.options.length < 2) return false;
      if (typeof q.answer !== 'string') return false;
    }
    return true;
  }

  function showStart() {
    if (!els.start || !els.play || !els.results) return;
    els.start.hidden = false;
    els.play.hidden = true;
    els.results.hidden = true;

    updateBestLabels();

    if (els.resume) {
      if (session && !session.finished) {
        els.resume.hidden = false;
        els.resume.textContent = 'Continue quiz · Question ' + (session.index + 1) + ' of ' + session.questions.length;
      } else {
        els.resume.hidden = true;
      }
    }

    if (els.scorePill) {
      var progress = Stories.getProgress('quiz');
      els.scorePill.textContent = progress && typeof progress.score === 'number'
        ? 'Last score: ' + progress.score + ' / ' + progress.total
        : 'Score: 0';
    }
  }

  function updateBestLabels() {
    var progress = Stories.getProgress('quiz');
    if (els.quickBest) {
      els.quickBest.textContent = progress && progress.mode === 'quick'
        ? 'Last score: ' + progress.score + ' / ' + progress.total
        : '';
    }
    if (els.fullBest) {
      els.fullBest.textContent = progress && progress.mode === 'full'
        ? 'Last score: ' + progress.score + ' / ' + progress.total
        : '';
    }
  }

  function continueQuiz() {
    if (!session || session.finished) {
      showStart();
      return;
    }
    showPlay();
    renderQuestion();
  }

  function startQuiz(mode) {
    if (!story || !Array.isArray(story.quiz) || !story.quiz.length) {
      Stories.toast('This story has no quiz yet.');
      return;
    }

    var requested = mode === 'full' ? story.quiz.length : 10;
    var count = Math.min(requested, story.quiz.length);
    var pool = shuffle(story.quiz).slice(0, count);
    var positionCache = {};
    var targets = pool.map(function (question, index) {
      var size = question.options.length || 4;
      if (!positionCache[size]) positionCache[size] = balancedPositions(count, size);
      return positionCache[size][index];
    });

    var questions = pool.map(function (question, index) {
      return {
        q: question.q,
        options: arrangeOptions(question, targets[index]),
        answer: question.answer,
        explanation: question.explanation
      };
    });

    session = {
      mode: mode,
      questions: questions,
      index: 0,
      answers: new Array(questions.length).fill(null),
      score: 0,
      submitted: false,
      selected: null,
      finished: false
    };

    save();
    showPlay();
    renderQuestion();
  }

  function arrangeOptions(question, target) {
    var options = question.options || [];
    if (!options.length) return [];
    var correct = question.answer;
    var distractors = shuffle(options.filter(function (option) { return option !== correct; }));
    var position = ((target % options.length) + options.length) % options.length;
    var result = [];
    var d = 0;

    for (var i = 0; i < options.length; i++) {
      if (i === position) {
        result.push(correct);
      } else {
        result.push(distractors[d]);
        d++;
      }
    }

    /* Safety net: never lose the correct answer if the data is unusual. */
    if (result.indexOf(correct) === -1) result[position] = correct;
    return result;
  }

  function balancedPositions(count, optionCount) {
    var letters = Math.max(2, optionCount || 4);
    var positions = [];
    for (var i = 0; i < count; i++) positions.push(i % letters);
    return shuffle(positions);
  }

  function showPlay() {
    if (!els.start || !els.play || !els.results) return;
    els.start.hidden = true;
    els.results.hidden = true;
    els.play.hidden = false;
  }

  function currentQuestion() {
    return session ? session.questions[session.index] : null;
  }

  function renderQuestion() {
    if (!session) return;
    var q = currentQuestion();
    if (!q) return;

    var total = session.questions.length;
    if (els.counter) els.counter.textContent = 'Question ' + (session.index + 1) + ' of ' + total;
    if (els.qIndex) els.qIndex.textContent = 'Question ' + (session.index + 1);
    if (els.qText) els.qText.textContent = q.q;
    if (els.liveScore) els.liveScore.textContent = session.score + ' correct';
    if (els.progressFill) {
      var progress = total ? ((session.index + 1) / total) * 100 : 0;
      els.progressFill.style.width = progress + '%';
    }

    renderOptions(q);
    renderFeedback(q);
    updateControls();
  }

  function renderOptions(q) {
    if (!els.options) return;
    els.options.innerHTML = '';

    q.options.forEach(function (option, index) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'answer-card';
      card.setAttribute('data-value', option);
      card.disabled = session.submitted;

      var letter = document.createElement('span');
      letter.className = 'answer-letter';
      letter.textContent = LETTERS[index] || String(index + 1);

      var text = document.createElement('span');
      text.className = 'answer-text';
      text.textContent = option;

      card.appendChild(letter);
      card.appendChild(text);

      if (session.submitted) {
        if (option === q.answer) {
          card.classList.add('correct');
        } else if (option === session.answers[session.index]) {
          card.classList.add('incorrect');
        } else {
          card.classList.add('dim');
        }
      } else if (session.selected === option) {
        card.classList.add('selected');
      }

      els.options.appendChild(card);
    });
  }

  function renderFeedback(q) {
    if (!els.explanation) return;

    if (!session.submitted) {
      els.explanation.hidden = true;
      els.explanation.classList.remove('good', 'bad');
      return;
    }

    var correct = session.selected === q.answer;
    els.explanation.hidden = false;
    els.explanation.classList.toggle('good', correct);
    els.explanation.classList.toggle('bad', !correct);

    if (els.verdict) els.verdict.textContent = correct ? 'Correct!' : 'Not quite.';
    if (els.explanationText) {
      els.explanationText.textContent = correct
        ? q.explanation
        : 'The correct answer is ' + q.answer + '. ' + q.explanation;
    }
  }

  function updateControls() {
    if (els.submit) {
      els.submit.hidden = session.submitted;
      els.submit.disabled = !session.selected;
    }
    if (els.next) els.next.hidden = !session.submitted;
    if (els.scorePill) els.scorePill.textContent = session.score + ' correct';
  }

  function selectOption(option) {
    if (!session || session.submitted) return;
    session.selected = option;
    save();
    renderOptions(currentQuestion());
    updateControls();
  }

  function submitAnswer() {
    if (!session || session.submitted || !session.selected) return;
    var q = currentQuestion();
    session.answers[session.index] = session.selected;
    session.submitted = true;
    if (session.selected === q.answer) session.score++;
    save();
    renderQuestion();
  }

  function nextQuestion() {
    if (!session || !session.submitted) return;
    if (session.index + 1 >= session.questions.length) {
      finishQuiz();
      return;
    }
    session.index++;
    session.submitted = false;
    session.selected = null;
    save();
    renderQuestion();
  }

  function finishQuiz() {
    if (!session) return;
    session.finished = true;
    save();
    showResults();
    var percent = Math.round((session.score / session.questions.length) * 100);
    if (percent >= 80) Stories.confetti();
  }

  function save() {
    if (!session) return;
    Stories.setActivityState('quiz', session);

    if (session.finished) {
      Stories.setProgress('quiz', {
        status: 'completed',
        score: session.score,
        total: session.questions.length,
        percent: Math.round((session.score / session.questions.length) * 100),
        mode: session.mode,
        updatedAt: Date.now()
      });
    } else {
      Stories.setProgress('quiz', {
        status: 'in-progress',
        answered: session.answers.filter(function (answer) { return answer !== null; }).length,
        total: session.questions.length,
        mode: session.mode,
        updatedAt: Date.now()
      });
    }
  }

  function showResults() {
    if (!els.start || !els.play || !els.results) return;
    els.start.hidden = true;
    els.play.hidden = true;
    els.results.hidden = false;

    var total = session.questions.length;
    var percent = Math.round((session.score / total) * 100);

    var feedback = resultFeedback(percent);
    if (els.resultsEmoji) els.resultsEmoji.textContent = feedback.emoji;
    if (els.resultsTitle) els.resultsTitle.textContent = feedback.title;
    if (els.resultsMessage) els.resultsMessage.textContent = feedback.message;
    if (els.resultScore) els.resultScore.textContent = String(session.score);
    if (els.resultWrong) els.resultWrong.textContent = String(total - session.score);
    if (els.resultPercent) els.resultPercent.textContent = percent + '%';
    if (els.resultTotal) els.resultTotal.textContent = String(total);

    if (els.scorePill) els.scorePill.textContent = session.score + ' / ' + total;

    if (els.reviewList) els.reviewList.hidden = true;
    renderReview();
    updateReviewButtonLabel();
  }

  function resultFeedback(percent) {
    if (percent >= 90) {
      return {
        emoji: '🌟',
        title: 'Excellent work!',
        message: 'You understand the story very well. You are ready to retell it in your own words.'
      };
    }
    if (percent >= 70) {
      return {
        emoji: '👏',
        title: 'Good effort!',
        message: 'You know the story well. Practise the parts you missed and try again.'
      };
    }
    if (percent >= 50) {
      return {
        emoji: '💪',
        title: 'Nice try!',
        message: "Let's practise the story again. Read it once more, then have another go."
      };
    }
    return {
      emoji: '🌱',
      title: 'Keep going!',
      message: 'Every reader starts somewhere. Read the story again, then try the quiz once more.'
    };
  }

  function renderReview() {
    if (!els.reviewList) return;
    els.reviewList.innerHTML = '';

    var wrong = [];
    session.questions.forEach(function (q, index) {
      if (session.answers[index] !== q.answer) {
        wrong.push({ q: q, index: index, given: session.answers[index] });
      }
    });

    if (!wrong.length) {
      var perfect = document.createElement('p');
      perfect.className = 'review-perfect';
      perfect.textContent = 'Perfect score — there are no mistakes to review.';
      els.reviewList.appendChild(perfect);
      if (els.reviewBtn) els.reviewBtn.disabled = true;
      return;
    }

    if (els.reviewBtn) els.reviewBtn.disabled = false;

    wrong.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'review-item';

      var head = document.createElement('div');
      head.className = 'review-head';
      head.appendChild(document.createTextNode('Question ' + (item.index + 1) + ': '));
      head.appendChild(document.createTextNode(item.q.q));

      var given = document.createElement('p');
      given.className = 'review-line review-given';
      given.textContent = 'Your answer: ' + (item.given === null ? 'No answer' : item.given);

      var correct = document.createElement('p');
      correct.className = 'review-line review-correct';
      correct.textContent = 'Correct answer: ' + item.q.answer;

      var why = document.createElement('p');
      why.className = 'review-line review-why';
      why.textContent = item.q.explanation;

      card.appendChild(head);
      card.appendChild(given);
      card.appendChild(correct);
      card.appendChild(why);
      els.reviewList.appendChild(card);
    });
  }

  function updateReviewButtonLabel() {
    if (!els.reviewBtn || !els.reviewList || !session) return;
    var wrong = session.questions.filter(function (q, index) {
      return session.answers[index] !== q.answer;
    }).length;

    if (els.reviewList.hidden) {
      els.reviewBtn.textContent = 'Review mistakes (' + wrong + ')';
    } else {
      els.reviewBtn.textContent = 'Hide mistakes';
    }
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

  window.Quiz = {
    init: init,
    start: start
  };
})();