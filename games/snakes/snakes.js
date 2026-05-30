(function () {
  var STATES = {
    SETUP: "SETUP",
    WAITING_ROLL: "WAITING_ROLL",
    ROLLING: "ROLLING",
    MOVING: "MOVING",
    SNAKE_LADDER: "SNAKE_LADDER",
    QUESTION: "QUESTION",
    GAME_OVER: "GAME_OVER"
  };

  var gameState = STATES.SETUP;
  var gridSize = 6;
  var boardSize = 36;
  var difficultyLevel = 6;
  var missTurnIfWrong = true;
  var soundEnabled = true;
  var playerCount = 2;
  var players = [];
  var currentPlayerIndex = 0;
  var waitingForRoll = false;
  var snakes = [];
  var ladders = [];
  var audioCtx = null;
  var cellPositions = {};
  var tokenElements = {};
  var resizeTimer = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      switch (type) {
        case "roll":
          playTone(ctx, 400, 0.1, "sine");
          break;
        case "move":
          playTone(ctx, 350, 0.08, "sine");
          break;
        case "snake":
          playDescendingBuzz(ctx, 200, 0.4);
          break;
        case "ladder":
          playArpeggio(ctx, [300, 420, 560, 700], 0.1, "sine");
          break;
        case "correct":
          playArpeggio(ctx, [523, 659, 784], 0.15, "sine");
          break;
        case "wrong":
          playTone(ctx, 180, 0.35, "sawtooth");
          break;
        case "win":
          playArpeggio(ctx, [523, 659, 784, 1047], 0.2, "sine");
          break;
      }
    } catch (e) {}
  }

  function playTone(ctx, freq, duration, type) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playDescendingBuzz(ctx, startFreq, duration) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playArpeggio(ctx, freqs, noteDuration, type) {
    freqs.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      var startTime = ctx.currentTime + i * noteDuration;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  window.playSound = playSound;

  function showScreen(id) {
    var screens = document.querySelectorAll(".screen-overlay");
    screens.forEach(function (s) { s.style.display = "none"; });
    var target = document.getElementById(id);
    if (target) target.style.display = "flex";
  }

  function getCellNumber(row, col) {
    var actualRow = gridSize - 1 - row;
    var num;
    if (actualRow % 2 === 0) {
      num = actualRow * gridSize + col + 1;
    } else {
      num = actualRow * gridSize + (gridSize - col);
    }
    return num;
  }

  function getCellCoords(cellNum) {
    var actualRow = Math.floor((cellNum - 1) / gridSize);
    var posInRow = (cellNum - 1) % gridSize;
    var row, col;
    if (actualRow % 2 === 0) {
      row = gridSize - 1 - actualRow;
      col = posInRow;
    } else {
      row = gridSize - 1 - actualRow;
      col = gridSize - 1 - posInRow;
    }
    return { row: row, col: col };
  }

  function createBoard() {
    var boardEl = document.getElementById("board");
    if (!boardEl) return;
    boardEl.replaceChildren();
    boardEl.style.gridTemplateColumns = "repeat(" + gridSize + ", 1fr)";
    boardEl.style.gridTemplateRows = "repeat(" + gridSize + ", 1fr)";

    var fragment = document.createDocumentFragment();
    for (var row = 0; row < gridSize; row++) {
      for (var col = 0; col < gridSize; col++) {
        var cellNum = getCellNumber(row, col);
        var cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.cell = cellNum;

        var isLight = (row + col) % 2 === 0;
        cell.classList.add(isLight ? "cell-light" : "cell-dark");

        var isSnakeHead = snakes.some(function (s) { return s.start === cellNum; });
        var isLadderBase = ladders.some(function (l) { return l.start === cellNum; });

        if (isSnakeHead) cell.classList.add("cell-snake");
        if (isLadderBase) cell.classList.add("cell-ladder");
        if (cellNum === 1) cell.classList.add("cell-start");
        if (cellNum === boardSize) cell.classList.add("cell-finish");

        var numSpan = document.createElement("span");
        numSpan.className = "cell-number";
        numSpan.textContent = cellNum;
        cell.appendChild(numSpan);

        if (cellNum === 1) {
          var startLabel = document.createElement("span");
          startLabel.className = "cell-label";
          startLabel.textContent = "START";
          cell.appendChild(startLabel);
        }
        if (cellNum === boardSize) {
          var finishIcon = document.createElement("span");
          finishIcon.className = "cell-label finish-icon";
          finishIcon.textContent = "\uD83C\uDFC6";
          cell.appendChild(finishIcon);
        }

        cellPositions[cellNum] = { row: row, col: col };
        fragment.appendChild(cell);
      }
    }
    boardEl.appendChild(fragment);
  }

  function generateSnakesAndLadders() {
    var scale = (gridSize * gridSize) / 100;
    var snakeCount = SNAKES_LADDERS_CONFIG.snakeCountByGrid[gridSize] || 4;
    var ladderCount = SNAKES_LADDERS_CONFIG.ladderCountByGrid[gridSize] || 4;

    snakes = [];
    ladders = [];
    var usedCells = {};
    usedCells[1] = true;
    usedCells[boardSize] = true;

    var allSnakes = SNAKES_LADDERS_CONFIG.defaultSnakes.slice();
    var allLadders = SNAKES_LADDERS_CONFIG.defaultLadders.slice();

    for (var si = 0; si < snakeCount && si < allSnakes.length; si++) {
      var s = allSnakes[si];
      var start = Math.max(2, Math.round(s.start * scale));
      var end = Math.max(1, Math.round(s.end * scale));
      if (start >= boardSize) start = boardSize - 1;
      if (end >= start) end = Math.max(1, start - 2);
      if (!usedCells[start] && !usedCells[end] && start !== end) {
        snakes.push({ start: start, end: end });
        usedCells[start] = true;
        usedCells[end] = true;
      }
    }

    for (var li = 0; li < ladderCount && li < allLadders.length; li++) {
      var l = allLadders[li];
      var lStart = Math.max(2, Math.round(l.start * scale));
      var lEnd = Math.min(boardSize - 1, Math.round(l.end * scale));
      if (lStart >= boardSize) lStart = boardSize - 2;
      if (lEnd <= lStart) lEnd = Math.min(boardSize - 1, lStart + 3);
      if (!usedCells[lStart] && !usedCells[lEnd] && lStart !== lEnd) {
        ladders.push({ start: lStart, end: lEnd });
        usedCells[lStart] = true;
        usedCells[lEnd] = true;
      }
    }
  }

  function getCellCenter(cellNum) {
    var boardEl = document.getElementById("board");
    var wrapper = document.getElementById("board-wrapper");
    if (!boardEl || !wrapper) return { x: 0, y: 0 };
    var cell = boardEl.querySelector('[data-cell="' + cellNum + '"]');
    if (!cell) return { x: 0, y: 0 };
    var boardRect = boardEl.getBoundingClientRect();
    var wrapRect = wrapper.getBoundingClientRect();
    var cellRect = cell.getBoundingClientRect();
    return {
      x: cellRect.left + cellRect.width / 2 - wrapRect.left,
      y: cellRect.top + cellRect.height / 2 - wrapRect.top
    };
  }

  function drawSVGOverlay() {
    var wrapper = document.getElementById("board-wrapper");
    var svgEl = document.getElementById("board-svg");
    if (!wrapper || !svgEl) return;

    var rect = wrapper.getBoundingClientRect();
    svgEl.setAttribute("width", rect.width);
    svgEl.setAttribute("height", rect.height);
    svgEl.setAttribute("viewBox", "0 0 " + rect.width + " " + rect.height);
    svgEl.replaceChildren();

    var snakeColors = [
      { body: "#cc3333", outline: "#881111", belly: "#ff9999" },
      { body: "#8833cc", outline: "#551188", belly: "#bb99ee" },
      { body: "#cc7733", outline: "#885511", belly: "#ffbb88" },
      { body: "#339988", outline: "#116655", belly: "#88ccbb" },
      { body: "#3366cc", outline: "#113388", belly: "#88aaff" }
    ];

    var ladderColors = [
      { rail: "#cc9900", rung: "#ffcc44", highlight: "#ffe888" },
      { rail: "#8B6914", rung: "#B8942A", highlight: "#D4B84E" },
      { rail: "#3366aa", rung: "#5588cc", highlight: "#88aadd" },
      { rail: "#338833", rung: "#55bb55", highlight: "#88dd88" }
    ];

    ladders.forEach(function (ladder, idx) {
      drawLadder(svgEl, ladder, ladderColors[idx % ladderColors.length]);
    });

    snakes.forEach(function (snake, idx) {
      drawSnake(svgEl, snake, snakeColors[idx % snakeColors.length]);
    });
  }

  function drawSnake(svgEl, snake, colors) {
    var headPos = getCellCenter(snake.start);
    var tailPos = getCellCenter(snake.end);
    var dx = tailPos.x - headPos.x;
    var dy = tailPos.y - headPos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    var numWaves = 5;
    var amplitude = Math.min(35, dist * 0.15);
    var nx = -dy / dist;
    var ny = dx / dist;

    var pathD = "M " + headPos.x.toFixed(1) + " " + headPos.y.toFixed(1);
    for (var wi = 0; wi < numWaves; wi++) {
      var t0 = wi / numWaves;
      var t1 = (wi + 0.5) / numWaves;
      var t2 = (wi + 1) / numWaves;
      var sign = (wi % 2 === 0) ? 1 : -1;
      var cp1x = headPos.x + dx * t1 + nx * amplitude * sign * 1.35;
      var cp1y = headPos.y + dy * t1 + ny * amplitude * sign * 1.35;
      var ex = headPos.x + dx * t2;
      var ey = headPos.y + dy * t2;
      pathD += " Q " + cp1x.toFixed(1) + " " + cp1y.toFixed(1) + ", " + ex.toFixed(1) + " " + ey.toFixed(1);
    }

    var outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("d", pathD);
    outline.setAttribute("stroke", colors.outline);
    outline.setAttribute("stroke-width", "10");
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke-linecap", "round");
    svgEl.appendChild(outline);

    var body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    body.setAttribute("d", pathD);
    body.setAttribute("stroke", colors.body);
    body.setAttribute("stroke-width", "7");
    body.setAttribute("fill", "none");
    body.setAttribute("stroke-linecap", "round");
    svgEl.appendChild(body);

    var belly = document.createElementNS("http://www.w3.org/2000/svg", "path");
    belly.setAttribute("d", pathD);
    belly.setAttribute("stroke", colors.belly);
    belly.setAttribute("stroke-width", "3");
    belly.setAttribute("fill", "none");
    belly.setAttribute("stroke-linecap", "round");
    belly.setAttribute("stroke-dasharray", "4 6");
    svgEl.appendChild(belly);

    var headR = 8;
    var headCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    headCircle.setAttribute("cx", headPos.x);
    headCircle.setAttribute("cy", headPos.y);
    headCircle.setAttribute("r", headR);
    headCircle.setAttribute("fill", colors.body);
    headCircle.setAttribute("stroke", colors.outline);
    headCircle.setAttribute("stroke-width", "2");
    svgEl.appendChild(headCircle);

    var eyeOffset = 3;
    var angle = Math.atan2(dy, dx);
    var perpAngle = angle + Math.PI / 2;

    [1, -1].forEach(function (side) {
      var ex = headPos.x + Math.cos(perpAngle) * eyeOffset * side + Math.cos(angle) * 2;
      var ey = headPos.y + Math.sin(perpAngle) * eyeOffset * side + Math.sin(angle) * 2;
      var eye = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      eye.setAttribute("cx", ex);
      eye.setAttribute("cy", ey);
      eye.setAttribute("r", "2.5");
      eye.setAttribute("fill", "white");
      svgEl.appendChild(eye);

      var pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pupil.setAttribute("cx", ex + Math.cos(angle) * 1);
      pupil.setAttribute("cy", ey + Math.sin(angle) * 1);
      pupil.setAttribute("r", "1.2");
      pupil.setAttribute("fill", "black");
      svgEl.appendChild(pupil);
    });

    var tongueLen = 10;
    var tongueBase = { x: headPos.x + Math.cos(angle) * headR, y: headPos.y + Math.sin(angle) * headR };
    var tongueMid = { x: tongueBase.x + Math.cos(angle) * tongueLen * 0.6, y: tongueBase.y + Math.sin(angle) * tongueLen * 0.6 };
    var forkLen = tongueLen * 0.4;
    var forkAngle = 0.5;

    [forkAngle, -forkAngle].forEach(function (fa) {
      var fork = document.createElementNS("http://www.w3.org/2000/svg", "line");
      fork.setAttribute("x1", tongueMid.x);
      fork.setAttribute("y1", tongueMid.y);
      fork.setAttribute("x2", tongueMid.x + Math.cos(angle + fa) * forkLen);
      fork.setAttribute("y2", tongueMid.y + Math.sin(angle + fa) * forkLen);
      fork.setAttribute("stroke", "#cc0000");
      fork.setAttribute("stroke-width", "1.5");
      fork.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(fork);
    });

    var tongueLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tongueLine.setAttribute("x1", tongueBase.x);
    tongueLine.setAttribute("y1", tongueBase.y);
    tongueLine.setAttribute("x2", tongueMid.x);
    tongueLine.setAttribute("y2", tongueMid.y);
    tongueLine.setAttribute("stroke", "#cc0000");
    tongueLine.setAttribute("stroke-width", "1.5");
    tongueLine.setAttribute("stroke-linecap", "round");
    svgEl.appendChild(tongueLine);
  }

  function drawLadder(svgEl, ladder, colors) {
    var basePos = getCellCenter(ladder.start);
    var topPos = getCellCenter(ladder.end);
    var dx = topPos.x - basePos.x;
    var dy = topPos.y - basePos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    var nx = -dy / dist;
    var ny = dx / dist;
    var railOffset = 8;

    var leftBase = { x: basePos.x + nx * railOffset, y: basePos.y + ny * railOffset };
    var rightBase = { x: basePos.x - nx * railOffset, y: basePos.y - ny * railOffset };
    var leftTop = { x: topPos.x + nx * railOffset, y: topPos.y + ny * railOffset };
    var rightTop = { x: topPos.x - nx * railOffset, y: topPos.y - ny * railOffset };

    var shadowOff = 3;
    [["left", leftBase, leftTop], ["right", rightBase, rightTop]].forEach(function (rail) {
      var shadow = document.createElementNS("http://www.w3.org/2000/svg", "line");
      shadow.setAttribute("x1", rail[1].x + shadowOff);
      shadow.setAttribute("y1", rail[1].y + shadowOff);
      shadow.setAttribute("x2", rail[2].x + shadowOff);
      shadow.setAttribute("y2", rail[2].y + shadowOff);
      shadow.setAttribute("stroke", "rgba(0,0,0,0.2)");
      shadow.setAttribute("stroke-width", "5");
      shadow.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(shadow);

      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", rail[1].x);
      line.setAttribute("y1", rail[1].y);
      line.setAttribute("x2", rail[2].x);
      line.setAttribute("y2", rail[2].y);
      line.setAttribute("stroke", colors.rail);
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(line);

      var highlight = document.createElementNS("http://www.w3.org/2000/svg", "line");
      highlight.setAttribute("x1", rail[1].x - 1);
      highlight.setAttribute("y1", rail[1].y - 1);
      highlight.setAttribute("x2", rail[2].x - 1);
      highlight.setAttribute("y2", rail[2].y - 1);
      highlight.setAttribute("stroke", colors.highlight);
      highlight.setAttribute("stroke-width", "1.5");
      highlight.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(highlight);
    });

    var rungCount = Math.max(3, Math.floor(dist / 28));
    for (var i = 1; i < rungCount; i++) {
      var t = i / rungCount;
      var lx = leftBase.x + (leftTop.x - leftBase.x) * t;
      var ly = leftBase.y + (leftTop.y - leftBase.y) * t;
      var rx = rightBase.x + (rightTop.x - rightBase.x) * t;
      var ry = rightBase.y + (rightTop.y - rightBase.y) * t;

      var rungShadow = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rungShadow.setAttribute("x1", lx + shadowOff);
      rungShadow.setAttribute("y1", ly + shadowOff);
      rungShadow.setAttribute("x2", rx + shadowOff);
      rungShadow.setAttribute("y2", ry + shadowOff);
      rungShadow.setAttribute("stroke", "rgba(0,0,0,0.2)");
      rungShadow.setAttribute("stroke-width", "4");
      rungShadow.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(rungShadow);

      var rung = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rung.setAttribute("x1", lx);
      rung.setAttribute("y1", ly);
      rung.setAttribute("x2", rx);
      rung.setAttribute("y2", ry);
      rung.setAttribute("stroke", colors.rung);
      rung.setAttribute("stroke-width", "3");
      rung.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(rung);
    }
  }

  function placeToken(playerIndex) {
    var player = players[playerIndex];
    if (!player) return;
    var cellNum = player.position;
    var boardEl = document.getElementById("board");
    if (!boardEl) return;

    var token = tokenElements[playerIndex];
    if (!token) return;

    var cell = boardEl.querySelector('[data-cell="' + cellNum + '"]');
    if (!cell) return;

    var tokensOnCell = players.reduce(function (acc, p, idx) {
      if (p.position === cellNum) acc.push(idx);
      return acc;
    }, []);

    var myIndex = tokensOnCell.indexOf(playerIndex);
    var total = tokensOnCell.length;

    token.className = "token";

    if (total === 1) {
      token.classList.add("solo");
    } else {
      token.classList.add("pos-" + myIndex + "-of-" + total);
    }

    token.textContent = player.token.emoji;

    cell.appendChild(token);
  }

  function placeAllTokens() {
    players.forEach(function (_, idx) {
      placeToken(idx);
    });
  }

  function animateMove(playerIndex, fromCell, toCell, callback) {
    var player = players[playerIndex];
    var token = tokenElements[playerIndex];
    if (!token || !player) { if (callback) callback(); return; }

    gameState = STATES.MOVING;

    var step = fromCell < toCell ? 1 : -1;
    var current = fromCell;
    var boardEl = document.getElementById("board");

    function doStep() {
      current += step;
      if ((step > 0 && current > toCell) || (step < 0 && current < toCell)) {
        if (callback) callback();
        return;
      }

      player.position = current;

      token.classList.add("moving");
      token.classList.remove("solo");

      var cell = boardEl.querySelector('[data-cell="' + current + '"]');
      if (cell) cell.appendChild(token);

      playSound("move");

      setTimeout(function () {
        token.classList.remove("moving");
        placeAllTokens();
        if (current === toCell) {
          if (callback) callback();
        } else {
          doStep();
        }
      }, 200);
    }

    doStep();
  }

  function animateSlide(playerIndex, fromCell, toCell, callback) {
    var player = players[playerIndex];
    var token = tokenElements[playerIndex];
    var boardEl = document.getElementById("board");
    var wrapper = document.getElementById("board-wrapper");
    if (!token || !player || !boardEl || !wrapper) { if (callback) callback(); return; }

    var fromCellEl = boardEl.querySelector('[data-cell="' + fromCell + '"]');
    var toCellEl = boardEl.querySelector('[data-cell="' + toCell + '"]');
    if (!fromCellEl || !toCellEl) {
      player.position = toCell;
      placeAllTokens();
      if (callback) callback();
      return;
    }

    var wrapRect = wrapper.getBoundingClientRect();
    var fromRect = fromCellEl.getBoundingClientRect();
    var toRect = toCellEl.getBoundingClientRect();

    var startX = fromRect.left + fromRect.width / 2 - wrapRect.left;
    var startY = fromRect.top + fromRect.height / 2 - wrapRect.top;
    var endX = toRect.left + toRect.width / 2 - wrapRect.left;
    var endY = toRect.top + toRect.height / 2 - wrapRect.top;

    var tokenSize = Math.min(fromRect.width, fromRect.height) * 0.6;

    token.className = "token sliding";
    token.style.position = "absolute";
    token.style.width = tokenSize + "px";
    token.style.height = tokenSize + "px";
    token.style.left = (startX - tokenSize / 2) + "px";
    token.style.top = (startY - tokenSize / 2) + "px";
    token.style.fontSize = (tokenSize * 0.7) + "px";
    token.style.zIndex = "10";

    wrapper.appendChild(token);

    requestAnimationFrame(function () {
      token.style.left = (endX - tokenSize / 2) + "px";
      token.style.top = (endY - tokenSize / 2) + "px";
    });

    player.position = toCell;

    setTimeout(function () {
      token.className = "token";
      token.style.position = "";
      token.style.width = "";
      token.style.height = "";
      token.style.left = "";
      token.style.top = "";
      token.style.fontSize = "";
      token.style.zIndex = "";
      placeAllTokens();
      if (callback) callback();
    }, 500);
  }

  function showMessage(text, duration) {
    return new Promise(function (resolve) {
      var msgEl = document.getElementById("game-message");
      if (!msgEl) { resolve(); return; }
      msgEl.textContent = text;
      msgEl.classList.add("show");
      setTimeout(function () {
        msgEl.classList.remove("show");
        resolve();
      }, duration);
    });
  }

  function showQuestion() {
    gameState = STATES.QUESTION;
    var level = Math.min(difficultyLevel, snakesQuestions.length) - 1;
    if (level < 0) level = 0;
    var qSet = snakesQuestions[level];
    var q = qSet.questions[Math.floor(Math.random() * qSet.questions.length)];

    var modal = document.getElementById("question-modal");
    var levelBadge = document.getElementById("question-level");
    var questionText = document.getElementById("question-text");
    var resultEl = document.getElementById("question-result");

    if (levelBadge) levelBadge.textContent = qSet.name;
    if (questionText) questionText.textContent = q;
    if (resultEl) {
      resultEl.textContent = "";
      resultEl.className = "question-result";
    }
    if (modal) modal.style.display = "flex";

    window.answerCorrect = function () {
      if (gameState !== STATES.QUESTION) return;
      playSound("correct");
      if (resultEl) {
        resultEl.textContent = "\u2714 Correct!";
        resultEl.className = "question-result correct";
      }
      setTimeout(function () {
        if (modal) modal.style.display = "none";
        advanceTurn();
      }, 900);
    };

    window.answerWrong = function () {
      if (gameState !== STATES.QUESTION) return;
      playSound("wrong");
      if (missTurnIfWrong) {
        players[currentPlayerIndex].skipNext = true;
      }
      if (resultEl) {
        resultEl.textContent = "\u2718 Wrong!" + (missTurnIfWrong ? " Skip next turn." : "");
        resultEl.className = "question-result wrong";
      }
      setTimeout(function () {
        if (modal) modal.style.display = "none";
        advanceTurn();
      }, 900);
    };
  }

  function advanceTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updatePlayerCards();
    updateTurnIndicator();
    waitingForRoll = true;
    gameState = STATES.WAITING_ROLL;
  }

  function endGame(winnerIndex) {
    gameState = STATES.GAME_OVER;
    playSound("win");

    var winScreen = document.getElementById("win-screen");
    var winHeading = document.getElementById("win-heading");
    var winList = document.getElementById("win-list");

    if (winHeading) winHeading.textContent = "Player " + (winnerIndex + 1) + " Wins!";

    if (winList) {
      winList.replaceChildren();
      var sorted = players.map(function (p, i) { return { player: p, index: i }; });
      sorted.sort(function (a, b) { return b.player.position - a.player.position; });

      var medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
      sorted.forEach(function (entry, rank) {
        var li = document.createElement("li");
        li.className = "win-player" + (entry.index === winnerIndex ? " winner" : "");
        var medal = rank < 3 ? medals[rank] + " " : "";
        li.textContent = medal + "Player " + (entry.index + 1) + " (" + entry.player.token.emoji + ") — Square " + entry.player.position;
        winList.appendChild(li);
      });
    }

    showScreen("win-screen");
  }

  function updateTurnIndicator() {
    var indicator = document.getElementById("turn-indicator");
    if (indicator) {
      var p = players[currentPlayerIndex];
      if (p) {
        indicator.textContent = "Player " + (currentPlayerIndex + 1) + "'s turn (" + p.token.emoji + ")";
      }
    }
  }

  function updatePlayerCards() {
    var footer = document.getElementById("player-cards");
    if (!footer) return;
    footer.replaceChildren();

    players.forEach(function (player, idx) {
      var card = document.createElement("div");
      card.className = "player-card" + (idx === currentPlayerIndex ? " active" : "");
      card.setAttribute("aria-live", "polite");

      var emoji = document.createElement("span");
      emoji.className = "card-emoji";
      emoji.textContent = player.token.emoji;

      var name = document.createElement("span");
      name.className = "card-name";
      name.textContent = "Player " + (idx + 1);

      var pos = document.createElement("span");
      pos.className = "card-position";
      pos.textContent = "Square " + player.position;

      card.appendChild(emoji);
      card.appendChild(name);
      card.appendChild(pos);
      footer.appendChild(card);
    });
  }

  function onDiceRoll(value) {
    if (gameState !== STATES.ROLLING) return;

    var player = players[currentPlayerIndex];
    if (!player) return;

    var newPosition = player.position + value;

    if (newPosition > boardSize) {
      var needed = boardSize - player.position;
      showMessage("Need " + needed + " to finish!", 1200).then(function () {
        showQuestion();
      });
      return;
    }

    var oldPosition = player.position;

    animateMove(currentPlayerIndex, oldPosition, newPosition, function () {
      if (newPosition === boardSize) {
        endGame(currentPlayerIndex);
        return;
      }

      var snake = snakes.find(function (s) { return s.start === newPosition; });
      var ladder = ladders.find(function (l) { return l.start === newPosition; });

      if (snake) {
        gameState = STATES.SNAKE_LADDER;
        showMessage("\uD83D\uDC0D Snake! Sliding down\u2026", 600).then(function () {
          playSound("snake");
          animateSlide(currentPlayerIndex, snake.start, snake.end, function () {
            showQuestion();
          });
        });
      } else if (ladder) {
        gameState = STATES.SNAKE_LADDER;
        showMessage("\uD83E\uDE9C Ladder! Climbing up!", 600).then(function () {
          playSound("ladder");
          animateSlide(currentPlayerIndex, ladder.start, ladder.end, function () {
            showQuestion();
          });
        });
      } else {
        showQuestion();
      }
    });
  }

  function handleDiceClick() {
    if (!waitingForRoll || gameState !== STATES.WAITING_ROLL) return;
    if (DiceController.getIsRolling()) return;

    var player = players[currentPlayerIndex];
    if (player && player.skipNext) {
      player.skipNext = false;
      waitingForRoll = false;
      gameState = STATES.MOVING;
      showMessage("Player " + (currentPlayerIndex + 1) + " skips this turn!", 1200).then(function () {
        advanceTurn();
      });
      return;
    }

    gameState = STATES.ROLLING;
    waitingForRoll = false;
    DiceController.roll().then(function (value) {
      onDiceRoll(value);
    });
  }

  function createTokenElements() {
    tokenElements = {};
    players.forEach(function (player, idx) {
      var token = document.createElement("div");
      token.className = "token solo";
      token.textContent = player.token.emoji;
      tokenElements[idx] = token;
    });
  }

  function startGame() {
    playerCount = parseInt(document.getElementById("setting-players").value, 10);
    gridSize = parseInt(document.getElementById("setting-grid").value, 10);
    boardSize = gridSize * gridSize;
    difficultyLevel = parseInt(document.getElementById("setting-difficulty").value, 10);
    missTurnIfWrong = document.getElementById("setting-miss-turn").checked;
    soundEnabled = document.getElementById("setting-sound").checked;

    var selectedTokens = [];
    for (var i = 0; i < playerCount; i++) {
      var select = document.getElementById("token-select-" + i);
      if (select) {
        var tokenId = select.value;
        var tokenData = SNAKES_LADDERS_CONFIG.playerTokens.find(function (t) { return t.id === tokenId; });
        if (tokenData) selectedTokens.push(tokenData);
      }
    }

    players = [];
    for (var j = 0; j < playerCount; j++) {
      players.push({
        position: 1,
        token: selectedTokens[j] || SNAKES_LADDERS_CONFIG.playerTokens[j],
        skipNext: false
      });
    }

    currentPlayerIndex = 0;
    generateSnakesAndLadders();
    createBoard();

    setTimeout(function () {
      drawSVGOverlay();
    }, 100);

    createTokenElements();
    placeAllTokens();
    updatePlayerCards();
    updateTurnIndicator();

    waitingForRoll = true;
    gameState = STATES.WAITING_ROLL;

    showScreen("game-screen");
  }

  function buildTokenPickers() {
    var container = document.getElementById("token-pickers");
    if (!container) return;
    container.replaceChildren();

    var playerCountVal = parseInt(document.getElementById("setting-players").value, 10);

    for (var p = 0; p < playerCountVal; p++) {
      var pickerDiv = document.createElement("div");
      pickerDiv.className = "token-picker";

      var label = document.createElement("label");
      label.textContent = "Player " + (p + 1) + " Token:";
      label.setAttribute("for", "token-select-" + p);
      pickerDiv.appendChild(label);

      var select = document.createElement("select");
      select.id = "token-select-" + p;
      select.className = "token-select";

      SNAKES_LADDERS_CONFIG.playerTokens.forEach(function (token, idx) {
        var opt = document.createElement("option");
        opt.value = token.id;
        opt.textContent = token.emoji + " " + token.name;
        if (idx === p) opt.selected = true;
        select.appendChild(opt);
      });

      pickerDiv.appendChild(select);
      container.appendChild(pickerDiv);
    }

    enforceTokenUniqueness();
  }

  function enforceTokenUniqueness() {
    var selects = document.querySelectorAll(".token-select");
    var taken = {};

    selects.forEach(function (sel) {
      taken[sel.value] = true;
    });

    selects.forEach(function (sel) {
      var currentVal = sel.value;
      var options = sel.querySelectorAll("option");
      options.forEach(function (opt) {
        if (opt.value === currentVal) {
          opt.disabled = false;
          opt.selected = true;
        } else if (taken[opt.value]) {
          opt.disabled = true;
        } else {
          opt.disabled = false;
        }
      });
    });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen().catch(function () {});
    }
  }

  function initDOM() {
    showScreen("start-screen");

    var playerSelect = document.getElementById("setting-players");
    if (playerSelect) {
      playerSelect.addEventListener("change", function () {
        buildTokenPickers();
      });
    }

    var gridSelect = document.getElementById("setting-grid");
    if (gridSelect) {
      gridSelect.addEventListener("change", function () {});
    }

    buildTokenPickers();

    var tokenContainer = document.getElementById("token-pickers");
    if (tokenContainer) {
      tokenContainer.addEventListener("change", function (e) {
        if (e.target.classList.contains("token-select")) {
          enforceTokenUniqueness();
        }
      });
    }

    DiceController.initDiceController();

    var headerDice = document.getElementById("header-dice");
    if (headerDice) {
      headerDice.addEventListener("click", function () {
        handleDiceClick();
      });
    }

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (gameState !== STATES.SETUP && gameState !== STATES.GAME_OVER) {
          drawSVGOverlay();
        }
      }, 200);
    });
  }

  window.startGame = startGame;
  window.toggleFullscreen = toggleFullscreen;
  window.goToStart = function () {
    gameState = STATES.SETUP;
    showScreen("start-screen");
  };

  document.addEventListener("DOMContentLoaded", function () {
    initDOM();
  });
})();
