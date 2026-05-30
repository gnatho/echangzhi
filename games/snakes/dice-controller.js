var DiceController = (function () {
  var isRolling = false;
  var diceOverlay = null;
  var diceResult = null;
  var headerDice = null;
  var headerDiceValue = null;
  var DICE_FACES = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

  var scene, camera, renderer, diceMesh, animFrameId;
  var threeReady = false;
  var overlayVisible = false;

  var FACE_ROTATIONS = {
    1: { x: 0, y: 0, z: 0 },
    2: { x: -Math.PI / 2, y: 0, z: 0 },
    3: { x: 0, y: 0, z: Math.PI / 2 },
    4: { x: 0, y: 0, z: -Math.PI / 2 },
    5: { x: Math.PI / 2, y: 0, z: 0 },
    6: { x: Math.PI, y: 0, z: 0 }
  };

  function createFaceTexture(value) {
    var size = 256;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");

    var r = 18;
    ctx.fillStyle = "#f5f0e8";
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#c8b89a";
    ctx.lineWidth = 3;
    ctx.stroke();

    var dotPositions = {
      1: [[0.5, 0.5]],
      2: [[0.27, 0.27], [0.73, 0.73]],
      3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
      4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
      5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
      6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]]
    };

    var dotR = size * 0.072;
    ctx.fillStyle = "#1a1a2e";
    var positions = dotPositions[value];
    for (var i = 0; i < positions.length; i++) {
      ctx.beginPath();
      ctx.arc(positions[i][0] * size, positions[i][1] * size, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  function initThreeScene() {
    if (threeReady) return;
    var overlay = document.getElementById("dice-3d-container");
    if (!overlay || typeof THREE === "undefined") return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 3.5, 3.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    overlay.appendChild(renderer.domElement);
    renderer.domElement.style.borderRadius = "16px";

    resizeRenderer();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 20;
    scene.add(dirLight);

    var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 3, -2);
    scene.add(fillLight);

    var geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);

    var faceValues = [3, 4, 1, 6, 2, 5];
    var materials = [];
    for (var fi = 0; fi < 6; fi++) {
      var texCanvas = createFaceTexture(faceValues[fi]);
      var texture = new THREE.CanvasTexture(texCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.35,
        metalness: 0.0
      }));
    }

    diceMesh = new THREE.Mesh(geometry, materials);
    diceMesh.castShadow = true;
    diceMesh.receiveShadow = true;
    scene.add(diceMesh);

    var floorGeo = new THREE.PlaneGeometry(10, 10);
    var floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    threeReady = true;
  }

  function resizeRenderer() {
    if (!renderer || !camera) return;
    var container = document.getElementById("dice-3d-container");
    if (!container) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w < 1 || h < 1) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function initDiceController() {
    diceOverlay = document.getElementById("dice-overlay");
    diceResult = document.getElementById("dice-result");
    headerDice = document.getElementById("header-dice");
    headerDiceValue = document.getElementById("header-dice-value");
    setupDiceKeyboardSupport();
  }

  function setupDiceKeyboardSupport() {
    if (headerDice) {
      headerDice.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          rollDice();
        }
      });
    }
  }

  function rollDice() {
    if (isRolling) return Promise.reject(new Error("Already rolling"));
    return DiceController.roll();
  }

  function rollDiceForce(value) {
    if (isRolling) return Promise.reject(new Error("Already rolling"));
    return DiceController.roll(value);
  }

  function updateHeaderDiceValue(value) {
    if (headerDiceValue) {
      headerDiceValue.textContent = value;
      headerDiceValue.setAttribute("aria-label", "Dice: " + value);
    }
    if (headerDice) {
      headerDice.textContent = DICE_FACES[value - 1];
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBounce(t) {
    var n1 = 7.5625;
    var d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }

  function DiceRoller(forcedResult) {
    return new Promise(function (resolve) {
      isRolling = true;
      var finalValue = forcedResult || (Math.floor(Math.random() * 6) + 1);

      if (diceOverlay) diceOverlay.classList.add("active");
      overlayVisible = true;
      if (diceResult) diceResult.classList.remove("show");

      initThreeScene();

      if (!threeReady) {
        fallbackRoll(finalValue, resolve);
        return;
      }

      resizeRenderer();

      var targetRot = FACE_ROTATIONS[finalValue];
      var extraSpinsX = (3 + Math.floor(Math.random() * 3)) * Math.PI * 2;
      var extraSpinsZ = (2 + Math.floor(Math.random() * 3)) * Math.PI * 2;

      var startRot = { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2 };
      diceMesh.rotation.set(startRot.x, startRot.y, startRot.z);
      diceMesh.position.set(0, 0, 0);

      var endRot = {
        x: targetRot.x + extraSpinsX,
        y: targetRot.y + Math.random() * Math.PI,
        z: targetRot.z + extraSpinsZ
      };

      var duration = 1800;
      var startTime = null;
      var soundPlayed = false;

      function animate(timestamp) {
        if (!overlayVisible) return;

        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var rawT = Math.min(elapsed / duration, 1);
        var t = easeOutCubic(rawT);

        diceMesh.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
        diceMesh.rotation.z = startRot.z + (endRot.z - startRot.z) * t;

        if (rawT < 0.55) {
          var bounceT = rawT / 0.55;
          var height = Math.sin(bounceT * Math.PI * 3) * (1 - bounceT) * 2.0;
          diceMesh.position.y = Math.max(0, height);
        } else {
          var landT = (rawT - 0.55) / 0.45;
          var landBounce = easeOutBounce(landT);
          var smallBounce = Math.abs(Math.sin(landBounce * Math.PI)) * (1 - landT) * 0.3;
          diceMesh.position.y = smallBounce;

          if (!soundPlayed && rawT >= 0.55) {
            if (typeof playSound === "function") playSound("roll");
            soundPlayed = true;
          }
        }

        if (rawT > 0.5) {
          diceMesh.rotation.y = startRot.y + (endRot.y - startRot.y) * easeOutCubic((rawT - 0.5) / 0.5);
        } else {
          diceMesh.rotation.y = startRot.y + (endRot.y - startRot.y) * rawT;
        }

        renderer.render(scene, camera);

        if (rawT < 1) {
          animFrameId = requestAnimationFrame(animate);
        } else {
          diceMesh.rotation.set(targetRot.x, endRot.y, targetRot.z);
          diceMesh.position.y = 0;
          renderer.render(scene, camera);
          finishRoll(finalValue, resolve);
        }
      }

      animFrameId = requestAnimationFrame(animate);
    });
  }

  function finishRoll(finalValue, resolve) {
    setTimeout(function () {
      if (diceResult) {
        diceResult.textContent = finalValue;
        diceResult.classList.add("show");
      }
      updateHeaderDiceValue(finalValue);

      var srAnnounce = document.createElement("div");
      srAnnounce.className = "sr-only";
      srAnnounce.setAttribute("role", "status");
      srAnnounce.textContent = "Dice rolled: " + finalValue;
      document.body.appendChild(srAnnounce);
      setTimeout(function () {
        if (srAnnounce.parentNode) srAnnounce.parentNode.removeChild(srAnnounce);
      }, 1000);

      setTimeout(function () {
        if (diceOverlay) diceOverlay.classList.remove("active");
        overlayVisible = false;
        if (diceResult) diceResult.classList.remove("show");
        isRolling = false;
        resolve(finalValue);
      }, 700);
    }, 150);
  }

  function fallbackRoll(finalValue, resolve) {
    var totalDuration = 900;
    var steps = [];
    var delay = 50;
    var accumulated = 0;
    while (accumulated < totalDuration) {
      steps.push(delay);
      accumulated += delay;
      if (accumulated > totalDuration * 0.4) delay = Math.min(delay + 15, 180);
    }
    var stepIndex = 0;
    var diceDisplay = document.getElementById("dice-display");

    function doStep() {
      if (stepIndex >= steps.length) {
        if (typeof playSound === "function") playSound("roll");
        finishRoll(finalValue, resolve);
        return;
      }
      var faceIdx = Math.floor(Math.random() * 6);
      if (diceDisplay) diceDisplay.textContent = DICE_FACES[faceIdx];
      stepIndex++;
      setTimeout(doStep, steps[stepIndex - 1]);
    }
    doStep();
  }

  DiceController = {
    roll: DiceRoller,
    initDiceController: initDiceController,
    rollDice: rollDice,
    rollDiceForce: rollDiceForce,
    handleRollResult: updateHeaderDiceValue,
    setupDiceKeyboardSupport: setupDiceKeyboardSupport,
    getIsRolling: function () { return isRolling; }
  };

  return DiceController;
})();

window.initDiceController = DiceController.initDiceController;
window.rollDice = DiceController.rollDice;
window.rollDiceForce = DiceController.rollDiceForce;
window.handleRollResult = DiceController.handleRollResult;
window.setupDiceKeyboardSupport = DiceController.setupDiceKeyboardSupport;
