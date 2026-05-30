(function(){
  var registry = {
    "hub":{"n":"Hub Page","v":"1.0.0","d":"2026-05-07"},
    "phonics-app":{"n":"Phonics App","v":"1.0.0","d":"2026-05-07"},
    "spin-wheel":{"n":"Spin Wheel","v":"1.0.0","d":"2026-05-07"},
    "spin-pen":{"n":"Spin the Pen","v":"1.0.0","d":"2026-05-07"},
    "soundboard":{"n":"Soundboard","v":"1.0.0","d":"2026-05-07"},
    "key-tester":{"n":"Key Tester","v":"1.0.0","d":"2026-05-07"},
    "pair-selector-uni":{"n":"Student Pair Selector (Uni)","v":"1.0.0","d":"2026-05-07"},
    "pair-selector-mid":{"n":"Student Pair Selector (Mid)","v":"1.0.0","d":"2026-05-07"},
    "games-hub":{"n":"Games Hub","v":"1.0.0","d":"2026-05-07"},
    "car-game":{"n":"Arcade Bumpers","v":"1.0.0","d":"2026-05-07"},
    "chooser-game":{"n":"Word Chooser","v":"1.0.0","d":"2026-05-07"},
    "memory-game":{"n":"Memory Game","v":"1.0.0","d":"2026-05-07"},
    "shooter-game":{"n":"Crosshair Assault","v":"1.0.0","d":"2026-05-07"},
    "snakes-game":{"n":"Snakes & Ladders","v":"1.0.0","d":"2026-05-07"},
    "bomberman-game":{"n":"Bomber Battle","v":"1.0.0","d":"2026-05-07"},
    "scrambler-game":{"n":"Sentence Scrambler","v":"1.0.0","d":"2026-05-07"},
    "baamboozle-game":{"n":"ESL Baamboozle","v":"1.0.0","d":"2026-05-07"},
    "quiz-game":{"n":"Grammar Quiz","v":"1.1.0","d":"2026-05-30"},
    "data-phonems":{"n":"Phoneme Data","v":"1.0.0","d":"2026-05-07"},
    "data-level-words":{"n":"Level Words Data","v":"1.0.0","d":"2026-05-07"},
    "data-grammar-ex":{"n":"Grammar Exercises Data","v":"1.0.0","d":"2026-05-07"},
    "data-students":{"n":"Student Roster","v":"1.0.1","d":"2026-05-07"}
  };

  function init() {
    var componentId = document.documentElement.getAttribute('data-component');
    if (!componentId) return;
    var entry = registry[componentId];
    if (!entry) return;

    var style = document.createElement('style');
    style.textContent = '#kv-badge{position:fixed;bottom:6px;right:8px;z-index:2147483647;pointer-events:none;font-family:"SF Mono",Consolas,Monaco,monospace;font-size:9px;line-height:1.3;color:rgba(255,255,255,0.38);background:rgba(0,0,0,0.22);padding:3px 7px;border-radius:4px;letter-spacing:0.02em;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);transition:opacity 0.4s;opacity:0.5}#kv-badge:hover{opacity:0.95}';
    document.head.appendChild(style);

    var badge = document.createElement('div');
    badge.id = 'kv-badge';
    badge.textContent = entry.n + '  v' + entry.v + ' (' + entry.d + ')';
    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
