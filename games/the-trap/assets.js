/* ============================================================
   THE TRAP — Story Challenge
   Original character art (inline SVG, no external images).

   Every character is drawn from the same function so that
   Lucy, Ben, Horax and Zelda look identical in all three
   activities.  No DOM access here: the module only returns
   SVG strings.

   All drawings are clipped to a 100 x 120 box, so the bottom
   ~14 units are reserved for the air bubbles / legs.
   ============================================================ */

const TRAP_ART = (function () {
  'use strict';

  let uid = 0;
  function nextId(prefix) {
    uid += 1;
    return prefix + uid;
  }

  function svg(inner, cls, label, viewBox) {
    return '<svg class="art ' + (cls || '') + '" viewBox="' + (viewBox || '0 0 100 120') +
      '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label +
      '" preserveAspectRatio="xMidYMax meet">' + inner + '</svg>';
  }

  /* ------------------------------------------------------------
     Small reusable pieces
     ------------------------------------------------------------ */
  function bubble(cx, cy, r, o) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(255,255,255,' +
      (o == null ? 0.55 : o) + ')"/>';
  }

  function eyes(cx, cy, gap, r) {
    const rr = r || 2.1;
    return '<circle cx="' + (cx - gap) + '" cy="' + cy + '" r="' + (rr + 1.15) + '" fill="#ffffff"/>' +
      '<circle cx="' + (cx + gap) + '" cy="' + cy + '" r="' + (rr + 1.15) + '" fill="#ffffff"/>' +
      '<circle cx="' + (cx - gap) + '" cy="' + cy + '" r="' + rr + '" fill="#1f2937"/>' +
      '<circle cx="' + (cx + gap) + '" cy="' + cy + '" r="' + rr + '" fill="#1f2937"/>' +
      '<circle cx="' + (cx - gap - 0.6) + '" cy="' + (cy - 0.7) + '" r="' + (rr * 0.34) + '" fill="#ffffff"/>' +
      '<circle cx="' + (cx + gap - 0.6) + '" cy="' + (cy - 0.7) + '" r="' + (rr * 0.34) + '" fill="#ffffff"/>';
  }

  function blush(cx, cy, gap) {
    return '<ellipse cx="' + (cx - gap) + '" cy="' + cy + '" rx="3.4" ry="1.9" fill="#ff9aa8" opacity="0.7"/>' +
      '<ellipse cx="' + (cx + gap) + '" cy="' + cy + '" rx="3.4" ry="1.9" fill="#ff9aa8" opacity="0.7"/>';
  }

  /**
   * Child diver (shared by Lucy and Ben).
   * opts: hair, hairStyle, suit, trim, cap, skin, tank
   */
  function childDiver(opts) {
    const suit = opts.suit;
    const trim = opts.trim;
    const tank = opts.tank;
    const capId = nextId('cap');
    let hair = '';

    if (opts.hairStyle === 'bob') {
      hair =
        '<path d="M33 42 C31 24 43 15 50 15 C57 15 69 24 67 42 C67 34 62 30 50 30 C38 30 33 34 33 42 Z" fill="' + opts.hair + '"/>' +
        '<path d="M33 40 C29 46 30 54 33 58 C34 50 34 44 36 40 Z" fill="' + opts.hair + '"/>' +
        '<path d="M67 40 C71 46 70 54 67 58 C66 50 66 44 64 40 Z" fill="' + opts.hair + '"/>' +
        '<path d="M40 20 C45 16 55 16 60 20" stroke="' + opts.hairShade + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else {
      hair =
        '<path d="M32 44 C30 22 64 10 69 35 C70 40 69 44 67 46 C65 34 56 31 44 33 C38 34 34 38 33 46 Z" fill="' + opts.hair + '"/>' +
        '<path d="M36 30 C44 19 58 17 66 30 C58 24 44 24 36 30 Z" fill="' + opts.hairShade + '"/>';
    }

    return svg(
      '<defs>' +
      '<clipPath id="' + capId + '"><circle cx="50" cy="44" r="19"/></clipPath>' +
      '</defs>' +
      /* air bubbles */
      '<g class="bubbles">' + bubble(28, 8, 2.6) + bubble(72, 5, 3.2) + bubble(35, 3, 1.8) + '</g>' +
      /* arms */
      '<rect x="22" y="59" width="9" height="26" rx="4.5" fill="' + suit + '"/>' +
      '<rect x="69" y="59" width="9" height="26" rx="4.5" fill="' + suit + '"/>' +
      '<circle cx="26.5" cy="86" r="5" fill="' + opts.skin + '"/>' +
      '<circle cx="73.5" cy="86" r="5" fill="' + opts.skin + '"/>' +
      /* wetsuit */
      '<rect x="29" y="56" width="42" height="42" rx="13" fill="' + suit + '"/>' +
      '<rect x="35" y="60" width="30" height="7" rx="3.5" fill="' + trim + '"/>' +
      /* harness */
      '<path d="M38 64 L38 98" stroke="#f8fafc" stroke-width="2.4" opacity="0.8"/>' +
      '<path d="M62 64 L62 98" stroke="#f8fafc" stroke-width="2.4" opacity="0.8"/>' +
      '<rect x="42" y="78" width="16" height="11" rx="3" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>' +
      /* legs */
      '<rect x="35" y="96" width="12" height="15" rx="5" fill="' + suit + '" opacity="0.96"/>' +
      '<rect x="53" y="96" width="12" height="15" rx="5" fill="' + suit + '" opacity="0.96"/>' +
      /* diving mask */
      '<path d="M25 52 L25 46 C25 33 36 26 50 26 C64 26 75 33 75 46 L75 52 C75 56 71 57 68 56 C64 55 62 53 50 53 C38 53 36 55 32 56 C29 57 25 56 25 52 Z" fill="' + opts.cap + '"/>' +
      '<path d="M28 47 C31 38 40 33 50 33 C60 33 69 38 72 47" stroke="rgba(255,255,255,0.55)" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      /* face + hair */
      '<circle cx="50" cy="44" r="18.5" fill="' + opts.skin + '"/>' +
      hair +
      '<g clip-path="url(#' + capId + ')">' + hair + '</g>' +
      /* eyes, cheeks, smile */
      eyes(50, 43, 6.5, 2.3) +
      blush(50, 50.5, 10) +
      '<path d="M45 50.5 Q50 55.5 55 50.5" stroke="#b4413c" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
      /* tank */
      '<rect x="41" y="82" width="18" height="24" rx="7" fill="' + tank + '" stroke="#64748b" stroke-width="1.4" transform="rotate(9 50 94)"/>' +
      '<rect x="46" y="79" width="8" height="5" rx="2" fill="#475569" transform="rotate(9 50 81)"/>' +
      /* fins */
      '<path d="M33 108 L45 108 L47 116 L31 116 Z" fill="' + trim + '"/>' +
      '<path d="M55 108 L67 108 L69 116 L53 116 Z" fill="' + trim + '"/>',
      'art-char', opts.label || 'Diver'
    );
  }

  /* ------------------------------------------------------------
     The cast
     ------------------------------------------------------------ */
  function lucy() {
    return childDiver({
      label: 'Lucy, a girl diver in purple diving clothes',
      hair: '#f6c945', hairShade: '#dba320', hairStyle: 'bob',
      suit: '#8b5cf6', trim: '#a78bfa', cap: '#6d28d9',
      skin: '#ffd9b8', tank: '#cbd5e1'
    });
  }

  function ben() {
    return childDiver({
      label: 'Ben, a boy diver in blue diving clothes',
      hair: '#2f3a52', hairShade: '#1b2233', hairStyle: 'spiky',
      suit: '#3b82f6', trim: '#0ea5e9', cap: '#1d4ed8',
      skin: '#f6cfae', tank: '#94a3b8'
    });
  }

  function horax() {
    const capId = nextId('hctx');
    let beard =
      '<path d="M36 48 C33 64 39 82 50 84 C61 82 67 64 64 48 C61 58 57 61 50 61 C43 61 39 58 36 48 Z" fill="#3a2a78"/>' +
      '<ellipse cx="50" cy="73" rx="5.4" ry="4" fill="#2a1d5e"/>';
    if (typeof horax.mouth === 'string' && horax.mouth === 'open') {
      beard =
        '<path d="M35 48 C32 66 38 84 50 86 C62 84 68 66 65 48 C62 58 58 60 50 60 C42 60 38 58 35 48 Z" fill="#3a2a78"/>' +
        '<ellipse cx="50" cy="74" rx="6" ry="5.2" fill="#7f1d1d"/>' +
        '<path d="M45 71 L48 74 M55 71 L52 74" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>';
    }
    return svg(
      '<defs>' +
      '<clipPath id="' + capId + '"><circle cx="50" cy="42" r="18.5"/></clipPath>' +
      '<radialGradient id="' + capId + 'g" cx="40%" cy="30%" r="75%">' +
      '<stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#4c1d95"/></radialGradient>' +
      '</defs>' +
      /* cloak */
      '<path d="M22 108 L26 62 C28 52 36 48 50 48 C64 48 72 52 74 62 L78 108 Z" fill="url(#' + capId + 'g)"/>' +
      '<path d="M50 52 L50 108" stroke="#3b1d71" stroke-width="2" opacity="0.7"/>' +
      '<path d="M36 52 C34 70 32 88 28 108" stroke="#3b1d71" stroke-width="1.6" fill="none" opacity="0.6"/>' +
      '<path d="M64 52 C66 70 68 88 72 108" stroke="#3b1d71" stroke-width="1.6" fill="none" opacity="0.6"/>' +
      /* hands */
      '<circle cx="15" cy="84" r="5.6" fill="#e9b38a"/>' +
      '<circle cx="85" cy="73" r="5.6" fill="#e9b38a"/>' +
      '<path d="M26 72 L17 82 M74 64 L84 71" stroke="#6d28d9" stroke-width="8" stroke-linecap="round"/>' +
      /* head */
      '<circle cx="50" cy="42" r="18.5" fill="#e9b38a"/>' +
      '<g clip-path="url(#' + capId + ')">' + beard + '</g>' +
      eyes(50, 41, 6.4, 2.05) +
      '<path d="M38 36 L46 39 M62 36 L54 39" stroke="#2a1d5e" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M41 30 L49 35 M59 30 L51 35" stroke="#2a1d5e" stroke-width="2" stroke-linecap="round"/>' +
      /* floppy hat */
      '<ellipse cx="50" cy="27" rx="30" ry="6.5" fill="#31175c"/>' +
      '<ellipse cx="50" cy="26" rx="30" ry="5.2" fill="#462085"/>' +
      '<path d="M33 26 C33 8 67 8 67 26 Z" fill="#462085"/>' +
      '<path d="M33 24 C44 20 56 20 67 24 L67 26 C56 22 44 22 33 26 Z" fill="#facc15"/>' +
      '<path d="M62 9 C70 4 76 10 70 16" stroke="#31175c" stroke-width="4" fill="none" stroke-linecap="round"/>',
      'art-char', 'Horax, a trickster in a purple hat'
    );
  }
  horax.mouth = 'open';

  function zelda() {
    return svg(
      /* hair behind */
      '<path d="M29 50 C24 24 40 12 50 12 C60 12 76 24 71 50 C70 40 62 34 50 34 C38 34 30 40 29 50 Z" fill="#6d28d9"/>' +
      '<path d="M29 44 C22 56 22 72 27 84 C29 70 30 56 32 46 Z" fill="#6d28d9"/>' +
      '<path d="M71 44 C78 56 78 72 73 84 C71 70 70 56 68 46 Z" fill="#6d28d9"/>' +
      /* coat */
      '<path d="M28 108 L31 60 C33 51 40 48 50 48 C60 48 67 51 69 60 L72 108 Z" fill="#10b981"/>' +
      '<path d="M50 52 L50 108" stroke="#047857" stroke-width="2.2" opacity="0.8"/>' +
      '<path d="M50 52 L40 66 L50 62 L60 66 Z" fill="#ecfdf5"/>' +
      '<circle cx="50" cy="86" r="3.4" fill="#facc15"/>' +
      '<circle cx="50" cy="98" r="3.4" fill="#facc15"/>' +
      /* hands */
      '<circle cx="18" cy="86" r="5.4" fill="#fbcfa8"/>' +
      '<circle cx="82" cy="86" r="5.4" fill="#fbcfa8"/>' +
      '<path d="M30 70 L19 84 M70 70 L81 84" stroke="#10b981" stroke-width="8" stroke-linecap="round"/>' +
      /* head */
      '<circle cx="50" cy="42" r="18" fill="#fbcfa8"/>' +
      '<path d="M33 40 C34 26 44 21 50 21 C56 21 66 26 67 40 C62 33 56 31 50 31 C44 31 38 33 33 40 Z" fill="#6d28d9"/>' +
      '<path d="M70 30 C76 24 82 26 80 32" stroke="#6d28d9" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      eyes(50, 42, 6.3, 2.2) +
      '<path d="M39 35 Q43.5 32 46.5 35" stroke="#1f2937" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<path d="M53.5 35 Q56.5 32 61 35" stroke="#1f2937" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      blush(50, 49.5, 9.5) +
      '<path d="M46 50 Q50 53.6 54 50" stroke="#d4626a" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
      /* earrings */
      '<circle cx="32" cy="47" r="2.4" fill="#facc15"/>' +
      '<circle cx="68" cy="47" r="2.4" fill="#facc15"/>',
      'art-char', 'Zelda, Horax’s companion in a green coat'
    );
  }

  /* Friendly octopus (helps Ben) */
  function octopus() {
    const gId = nextId('octo');
    const legs = [
      'M22 82 C12 88 10 100 16 108 C20 100 22 94 26 92 Z',
      'M30 86 C22 96 24 106 30 112 C31 104 32 96 36 92 Z',
      'M40 88 C36 100 38 110 44 114 C44 106 44 96 46 90 Z',
      'M50 88 C50 100 50 110 52 114 C56 108 56 98 54 90 Z',
      'M60 88 C64 100 62 110 56 114 C56 106 56 96 54 90 Z',
      'M70 86 C78 96 76 106 70 112 C69 104 68 96 64 92 Z',
      'M78 82 C88 88 90 100 84 108 C80 100 78 94 74 92 Z'
    ].map(function (d) {
      return '<path d="' + d + '" fill="url(#' + gId + ')" stroke="#b91c6e" stroke-width="1.2"/>';
    }).join('');

    return svg(
      '<defs><radialGradient id="' + gId + '" cx="36%" cy="28%" r="80%">' +
      '<stop offset="0%" stop-color="#fda4d4"/><stop offset="100%" stop-color="#db2777"/></radialGradient></defs>' +
      '<g class="bubbles">' + bubble(14, 34, 3) + bubble(86, 40, 2.2) + '</g>' +
      legs +
      /* head */
      '<path d="M50 6 C28 6 16 26 16 46 C16 70 30 86 50 86 C70 86 84 70 84 46 C84 26 72 6 50 6 Z" fill="url(#' + gId + ')"/>' +
      '<ellipse cx="38" cy="26" rx="8" ry="10" fill="rgba(255,255,255,0.35)" transform="rotate(-20 38 26)"/>' +
      eyes(50, 48, 12, 4.4) +
      blush(50, 60, 21) +
      '<path d="M44 60 Q50 67 56 60" stroke="#9d174d" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
      'art-char', 'A friendly purple octopus'
    );
  }

  /* Mysterious shark (also the star of the letter S) */
  function shark() {
    const sId = nextId('shark');
    return svg(
      '<defs><linearGradient id="' + sId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#64748b"/><stop offset="70%" stop-color="#334155"/>' +
      '<stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs>' +
      /* tail */
      '<path d="M14 62 L2 46 L8 62 L2 78 Z" fill="#475569"/>' +
      /* fins */
      '<path d="M50 26 L62 10 L66 34 Z" fill="#475569"/>' +
      '<path d="M58 84 L66 100 L44 84 Z" fill="#475569"/>' +
      '<path d="M30 78 C34 90 48 92 54 84" fill="#475569"/>' +
      /* body */
      '<path d="M14 60 C18 40 40 30 64 30 C80 30 92 40 96 54 C98 59 98 63 96 68 C92 82 80 92 64 92 C40 92 18 82 14 62 Z" fill="url(#' + sId + ')"/>' +
      '<path d="M20 74 C34 80 52 82 66 80 C78 78 90 72 96 66" stroke="#e2e8f0" stroke-width="2.4" fill="none" opacity="0.9"/>' +
      /* gills */
      '<path d="M70 56 L74 62 M76 56 L80 62 M82 55 L86 61" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>' +
      /* mouth + teeth */
      '<path d="M22 68 C32 80 50 82 64 76 C52 74 34 72 22 68 Z" fill="#7f1d1d"/>' +
      '<path d="M25 70 L28 75 L31 70 L34 74 L37 70 L40 73 L43 70 L46 73 L49 70 L52 72" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>' +
      /* eye */
      '<circle cx="36" cy="53" r="5.6" fill="#ffffff"/>' +
      '<circle cx="36.5" cy="53" r="3" fill="#1f2937"/>' +
      '<circle cx="35.4" cy="51.8" r="1.1" fill="#ffffff"/>' +
      '<path d="M26 45 L44 47" stroke="#334155" stroke-width="2.6" stroke-linecap="round"/>' +
      /* bubbles */
      '<g class="bubbles">' + bubble(90, 40, 2.6) + bubble(84, 32, 1.8) + bubble(96, 30, 1.4) + '</g>',
      'art-char art-shark', 'A mysterious grey shark'
    );
  }

  /* ------------------------------------------------------------
     Small story props
     ------------------------------------------------------------ */
  function shellWithLetter() {
    return svg(
      '<g transform="translate(50 68) scale(0.92) translate(-50 -68)">' +
      '<path d="M14 92 C10 62 28 40 50 40 C72 40 90 62 86 92 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="2"/>' +
      '<path d="M50 42 C46 60 44 76 46 92" stroke="#c27c3c" stroke-width="2" fill="none"/>' +
      '<path d="M50 42 C34 52 28 70 28 92" stroke="#e0a458" stroke-width="2" fill="none"/>' +
      '<path d="M50 42 C66 52 72 70 72 92" stroke="#e0a458" stroke-width="2" fill="none"/>' +
      '<path d="M14 92 Q50 100 86 92 L86 98 Q50 106 14 98 Z" fill="#f4b860" stroke="#c27c3c" stroke-width="1.6"/>' +
      '<rect x="40" y="22" width="20" height="18" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="1.4" transform="rotate(-6 50 31)"/>' +
      '<text x="50" y="37" font-size="16" font-weight="900" fill="#2563eb" text-anchor="middle" font-family="Arial, sans-serif">S</text>' +
      '</g>',
      'art-prop', 'A giant shell holding a letter'
    );
  }

  function fishSchoolS() {
    const points = [
      [30, 16], [24, 30], [24, 44], [28, 58], [36, 71], [46, 82], [58, 91],
      [70, 98], [82, 101], [92, 99], [96, 93]
    ];
    return svg(
      '<text x="50" y="112" font-size="13" font-weight="900" fill="rgba(255,255,255,0.85)" ' +
      'text-anchor="middle" font-family="Arial, sans-serif" letter-spacing="2">S</text>' +
      points.map(function (p, i) {
        const c = i % 3 === 0 ? '#fb923c' : i % 3 === 1 ? '#fdba74' : '#f59e0b';
        return '<g transform="translate(' + p[0] + ' ' + p[1] + ')">' +
          '<ellipse cx="0" cy="0" rx="6.4" ry="3.6" fill="' + c + '"/>' +
          '<path d="M-6 0 L-11 -3.6 L-11 3.6 Z" fill="' + c + '"/>' +
          '<circle cx="3" cy="-0.8" r="0.9" fill="#1f2937"/>' +
          '</g>';
      }).join(''),
      'art-prop', 'A school of fish shaped like the letter S'
    );
  }

  function cage() {
    return svg(
      '<path d="M22 44 L78 44" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M50 44 L50 28" stroke="#64748b" stroke-width="3"/>' +
      '<circle cx="50" cy="26" r="4" fill="none" stroke="#64748b" stroke-width="3"/>' +
      '<path d="M26 44 L26 96 M38 44 L38 96 M50 44 L50 96 M62 44 L62 96 M74 44 L74 96" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M22 96 L78 96" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M22 66 L78 66" stroke="#94a3b8" stroke-width="2.4"/>',
      'art-prop art-cage', 'An empty cage'
    );
  }

  /* ------------------------------------------------------------
     Story scenes for the sequencer
     ------------------------------------------------------------ */
  const SCENES = {
    shell: function () {
      return svg(
        '<ellipse cx="50" cy="104" rx="44" ry="9" fill="#fcd9a0" opacity="0.75"/>' +
        '<ellipse cx="20" cy="96" rx="7" ry="4" fill="#a78bfa" opacity="0.8"/>' +
        '<path d="M9 92 Q12 78 18 92 Z" fill="#34d399"/>' +
        '<path d="M80 94 Q84 78 90 94 Z" fill="#22c55e"/>' +
        '<g transform="translate(34 60) scale(0.5) translate(-50 -60)">' +
        '<path d="M14 92 C10 62 28 40 50 40 C72 40 90 62 86 92 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="3"/>' +
        '<path d="M50 42 C46 60 44 76 46 92 M50 42 C34 52 28 70 28 92 M50 42 C66 52 72 70 72 92" stroke="#e0a458" stroke-width="3" fill="none"/>' +
        '</g>' +
        '<g transform="translate(74 56) scale(0.42) translate(-50 -60)">' +
        '<circle cx="50" cy="42" r="18.5" fill="#ffd9b8"/>' +
        '<path d="M33 42 C31 24 43 15 50 15 C57 15 69 24 67 42 C67 34 62 30 50 30 C38 30 33 34 33 42 Z" fill="#f6c945"/>' +
        '<circle cx="43" cy="43" r="2.6" fill="#1f2937"/><circle cx="57" cy="43" r="2.6" fill="#1f2937"/>' +
        '<path d="M45 50 Q50 55 55 50" stroke="#b4413c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<rect x="29" y="56" width="42" height="42" rx="13" fill="#8b5cf6"/>' +
        '<path d="M25 52 L25 46 C25 33 36 26 50 26 C64 26 75 33 75 46 L75 52 C75 56 71 57 68 56 C64 55 62 53 50 53 C38 53 36 55 32 56 C29 57 25 56 25 52 Z" fill="#6d28d9" opacity="0.92"/>' +
        '</g>' +
        '<g transform="translate(26 62) scale(0.42) translate(-50 -60)">' +
        '<circle cx="50" cy="42" r="18.5" fill="#f6cfae"/>' +
        '<path d="M32 44 C30 22 64 10 69 35 C70 40 69 44 67 46 C65 34 56 31 44 33 C38 34 34 38 33 46 Z" fill="#2f3a52"/>' +
        '<circle cx="43" cy="43" r="2.6" fill="#1f2937"/><circle cx="57" cy="43" r="2.6" fill="#1f2937"/>' +
        '<path d="M45 50 Q50 55 55 50" stroke="#b4413c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<rect x="29" y="56" width="42" height="42" rx="13" fill="#3b82f6"/>' +
        '<path d="M25 52 L25 46 C25 33 36 26 50 26 C64 26 75 33 75 46 L75 52 C75 56 71 57 68 56 C64 55 62 53 50 53 C38 53 36 55 32 56 C29 57 25 56 25 52 Z" fill="#1d4ed8" opacity="0.92"/>' +
        '</g>' +
        '<path d="M44 18 Q50 26 56 18" stroke="#fde68a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        bubble(70, 20, 3) + bubble(80, 12, 2),
        'art-scene', 'Lucy and Ben beside a giant shell'
      );
    },

    empty: function () {
      return svg(
        '<path d="M18 96 C6 84 6 58 20 46 C34 34 52 34 60 44 C68 32 86 34 92 50 C100 70 88 94 64 98 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="2.4"/>' +
        '<path d="M20 46 C26 58 26 74 24 92 M60 44 C54 60 52 78 54 96 M92 50 C82 62 78 78 80 96" stroke="#e0a458" stroke-width="2.4" fill="none"/>' +
        '<ellipse cx="50" cy="64" rx="20" ry="14" fill="#263447" opacity="0.5"/>' +
        '<circle cx="50" cy="62" r="7" fill="#f8fafc" opacity="0.85"/>' +
        '<text x="50" y="66" font-size="11" font-weight="900" fill="#334155" text-anchor="middle" font-family="Arial, sans-serif">?</text>' +
        '<g transform="translate(18 100)">' +
        '<path d="M0 12 L10 12 L4 2 Z" fill="#22c55e"/>' +
        '<path d="M-8 12 L2 12 L-3 5 Z" fill="#16a34a"/>' +
        '</g>' +
        bubble(84, 22, 3) + bubble(90, 34, 1.8),
        'art-scene', 'An empty giant shell with a question mark'
      );
    },

    stuck: function () {
      return svg(
        '<g transform="translate(62 66) scale(0.82) translate(-50 -66)">' +
        '<g transform="scale(-1,1) translate(-100 0)">' +
        '<path d="M14 92 C10 62 28 40 50 40 C72 40 90 62 86 92 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="2.4"/>' +
        '<path d="M50 42 C46 60 44 76 46 92" stroke="#c27c3c" stroke-width="2.4" fill="none"/>' +
        '<path d="M50 42 C34 52 28 70 28 92" stroke="#e0a458" stroke-width="2.4" fill="none"/>' +
        '<path d="M14 78 C30 70 44 74 52 84 C40 90 24 90 14 84 Z" fill="#263447" opacity="0.85"/>' +
        '</g></g>' +
        '<rect x="46" y="62" width="10" height="12" rx="4" fill="#f6cfae"/>' +
        '<g transform="translate(30 62) scale(0.62) translate(-50 -60)">' +
        '<circle cx="50" cy="42" r="18.5" fill="#f6cfae"/>' +
        '<path d="M32 44 C30 22 64 10 69 35 C70 40 69 44 67 46 C65 34 56 31 44 33 C38 34 34 38 33 46 Z" fill="#2f3a52"/>' +
        '<circle cx="43" cy="43" r="2.8" fill="#1f2937"/><circle cx="57" cy="43" r="2.8" fill="#1f2937"/>' +
        '<ellipse cx="50" cy="54" rx="4" ry="3.6" fill="#b4413c"/>' +
        '<path d="M15 78 C15 40 85 40 85 78 Z" fill="#3b82f6"/>' +
        '<path d="M15 78 C10 66 18 56 24 58 M85 78 C90 66 82 56 76 58" stroke="#2563eb" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<circle cx="38" cy="86" r="10" fill="#f8fafc" opacity="0.5"/>' +
        '</g>' +
        '<text x="76" y="26" font-size="20" font-weight="900" fill="#f43f5e" text-anchor="middle" font-family="Arial, sans-serif">!</text>' +
        bubble(22, 30, 2.4),
        'art-scene', 'Ben stuck in the giant shell'
      );
    },

    villains: function () {
      return svg(
        '<g transform="translate(74 74) scale(0.42) translate(-50 -60)">' + SharkSvgOnly() + '</g>' +
        '<g transform="translate(28 76) scale(0.66) translate(-50 -60)">' + HoraxSvgOnly() + '</g>' +
        '<g transform="translate(58 80) scale(0.5) translate(-50 -60)">' + ZeldaSvgOnly() + '</g>' +
        bubble(14, 20, 3) + bubble(20, 10, 2),
        'art-scene', 'Horax, Zelda and a shark'
      );
    },

    chase: function () {
      return svg(
        '<g transform="translate(72 58) scale(0.9) translate(-50 -60)">' + SharkSvgOnly() + '</g>' +
        '<g transform="translate(30 78) scale(0.62) translate(-50 -60)">' + HoraxSvgOnly() + '</g>' +
        '<text x="30" y="22" font-size="20" font-weight="900" fill="#f43f5e" text-anchor="middle" font-family="Arial, sans-serif">Help!</text>' +
        '<path d="M46 40 L58 44 M58 40 L46 44" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>',
        'art-scene', 'The shark chases Horax who is calling for help'
      );
    },

    octo: function () {
      return svg(
        '<g transform="translate(66 58) scale(0.92) translate(-50 -60)">' + OctopusSvgOnly() + '</g>' +
        '<g transform="translate(28 74) scale(0.6) translate(-50 -60)">' +
        '<circle cx="50" cy="42" r="18.5" fill="#f6cfae"/>' +
        '<path d="M32 44 C30 22 64 10 69 35 C70 40 69 44 67 46 C65 34 56 31 44 33 C38 34 34 38 33 46 Z" fill="#2f3a52"/>' +
        '<circle cx="43" cy="43" r="2.8" fill="#1f2937"/><circle cx="57" cy="43" r="2.8" fill="#1f2937"/>' +
        '<path d="M44 51 Q50 57 56 51" stroke="#b4413c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<rect x="29" y="56" width="42" height="42" rx="13" fill="#3b82f6"/>' +
        '<path d="M25 52 L25 46 C25 33 36 26 50 26 C64 26 75 33 75 46 L75 52 C75 56 71 57 68 56 C64 55 62 53 50 53 C38 53 36 55 32 56 C29 57 25 56 25 52 Z" fill="#1d4ed8" opacity="0.9"/>' +
        '</g>' +
        '<path d="M22 34 L30 26 L38 30" stroke="#facc15" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        bubble(16, 14, 2.6),
        'art-scene', 'The friendly octopus helps Ben'
      );
    },

    letterS: function () {
      return svg(
        '<rect x="14" y="8" width="72" height="94" rx="12" fill="rgba(2,20,44,0.55)" stroke="rgba(255,255,255,0.4)" stroke-width="1.6"/>' +
        '<g transform="translate(0 2)">' + FishSchoolSvgOnly() + '</g>',
        'art-scene', 'Fish making the shape of the letter S'
      );
    }
  };

  /* inner-only helpers so scenes can nest characters */
  function innerOf(svgString) {
    return svgString.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  }
  function SharkSvgOnly() { return innerOf(shark()); }
  function OctopusSvgOnly() { return innerOf(octopus()); }
  function HoraxSvgOnly() { return innerOf(horax()); }
  function ZeldaSvgOnly() { return innerOf(zelda()); }
  function FishSchoolSvgOnly() { return innerOf(fishSchoolS()); }

  /* ------------------------------------------------------------
     Phonics word illustrations
     ------------------------------------------------------------ */
  const WORD_ART = {
    see: function () {
      return svg(
        '<path d="M12 60 C28 34 72 34 88 60 C72 86 28 86 12 60 Z" fill="#ffffff" stroke="#2563eb" stroke-width="3"/>' +
        '<circle cx="50" cy="60" r="14" fill="#60a5fa"/>' +
        '<circle cx="50" cy="60" r="6.5" fill="#1e3a8a"/>' +
        '<circle cx="46" cy="56" r="2.6" fill="#ffffff"/>' +
        '<path d="M26 44 L20 36 M74 44 L80 36 M26 76 L20 84 M74 76 L80 84" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>',
        'art-word', 'An eye looking'
      );
    },
    stuck: function () {
      return svg(
        '<path d="M14 96 C10 66 28 44 50 44 C72 44 90 66 86 96 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="2.4"/>' +
        '<path d="M50 46 C46 64 44 80 46 96" stroke="#c27c3c" stroke-width="2.4" fill="none"/>' +
        '<path d="M50 46 C34 56 28 74 28 96" stroke="#e0a458" stroke-width="2.4" fill="none"/>' +
        '<g transform="translate(50 92) scale(0.44) translate(-50 -60)">' + BenSvgOnly() + '</g>' +
        '<text x="82" y="40" font-size="18" font-weight="900" fill="#f43f5e" font-family="Arial, sans-serif">!</text>',
        'art-word', 'A diver stuck in a shell'
      );
    },
    sorry: function () {
      return svg(
        '<circle cx="30" cy="62" r="20" fill="#a5b4fc"/>' +
        '<circle cx="70" cy="62" r="20" fill="#a5b4fc"/>' +
        '<path d="M34 64 Q44 76 50 70 Q56 76 66 64" stroke="#4338ca" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="24" cy="56" r="3" fill="#1e1b4b"/><circle cx="36" cy="56" r="3" fill="#1e1b4b"/>' +
        '<circle cx="64" cy="56" r="3" fill="#1e1b4b"/><circle cx="76" cy="56" r="3" fill="#1e1b4b"/>' +
        '<path d="M26 80 Q50 96 74 80" stroke="#f43f5e" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 90 C44 84 42 80 46 77 C49 75 52 78 52 78 C52 78 55 74 58 77 C62 81 56 86 50 90 Z" fill="#fb7185"/>',
        'art-word', 'Two sad faces saying sorry'
      );
    },
    super: function () {
      return svg(
        '<path d="M50 8 L59 34 L86 34 L64 50 L72 76 L50 60 L28 76 L36 50 L14 34 L41 34 Z" fill="#facc15" stroke="#d97706" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M50 22 L55 40 L72 40 L59 50" stroke="#fef9c3" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M24 92 L34 92 L30 84 Z M58 96 L72 96 L64 82 Z" fill="#fb923c"/>',
        'art-word', 'A shining star for super'
      );
    },
    scared: function () {
      return svg(
        '<circle cx="50" cy="60" r="34" fill="#fef08a" stroke="#eab308" stroke-width="3"/>' +
        '<circle cx="39" cy="54" r="8" fill="#ffffff"/><circle cx="61" cy="54" r="8" fill="#ffffff"/>' +
        '<circle cx="39" cy="54" r="3.4" fill="#1f2937"/><circle cx="61" cy="54" r="3.4" fill="#1f2937"/>' +
        '<ellipse cx="50" cy="78" rx="6.5" ry="8" fill="#7f1d1d"/>' +
        '<path d="M26 34 L32 40 M74 34 L68 40" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M18 60 L10 58 M82 60 L90 58" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>' +
        '<text x="50" y="26" font-size="14" font-weight="900" fill="#f43f5e" text-anchor="middle" font-family="Arial, sans-serif">!</text>',
        'art-word', 'A scared face'
      );
    },
    stupid: function () {
      return svg(
        '<path d="M20 44 C26 24 74 24 80 44 C86 64 76 84 50 88 C24 84 14 64 20 44 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2.4"/>' +
        '<path d="M32 50 Q40 44 48 50" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M52 50 Q60 44 68 50" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="40" cy="60" r="3" fill="#334155"/><circle cx="60" cy="60" r="3" fill="#334155"/>' +
        '<path d="M36 76 Q50 66 64 76" stroke="#475569" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M28 26 C32 14 44 14 46 24 C50 12 62 14 62 26 Z" fill="#f97316"/>' +
        '<circle cx="54" cy="18" r="3.4" fill="#f97316"/>',
        'art-word', 'A silly face'
      );
    },
    swimming: function () {
      return svg(
        '<path d="M4 86 C20 72 34 100 50 86 C66 72 80 100 96 86" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="36" cy="46" r="10" fill="#f6cfae"/>' +
        '<path d="M28 52 C24 38 38 32 46 40 C48 46 44 54 36 54 Z" fill="#0ea5e9"/>' +
        '<path d="M28 54 L20 66 M42 56 L48 68" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M14 40 L26 44 M14 52 L24 50" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>' +
        bubble(64, 34, 3) + bubble(74, 46, 2),
        'art-word', 'A swimmer in the water'
      );
    },
    shell: function () {
      return svg(
        '<path d="M18 94 C14 64 30 40 50 40 C70 40 86 64 82 94 Z" fill="#fbd38d" stroke="#c27c3c" stroke-width="2.6"/>' +
        '<path d="M50 42 C46 60 44 78 46 94" stroke="#c27c3c" stroke-width="2.4" fill="none"/>' +
        '<path d="M50 42 C34 52 28 72 28 94" stroke="#e0a458" stroke-width="2.4" fill="none"/>' +
        '<path d="M50 42 C66 52 72 72 72 94" stroke="#e0a458" stroke-width="2.4" fill="none"/>' +
        '<path d="M18 94 Q50 102 82 94 L82 100 Q50 108 18 100 Z" fill="#f4b860" stroke="#c27c3c" stroke-width="1.6"/>' +
        '<path d="M70 34 Q78 26 84 34" stroke="#60a5fa" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
        'art-word', 'A sea shell'
      );
    },
    shark: function () {
      return svg(
        '<g transform="translate(0 6) scale(0.92) translate(4 0)">' + SharkSvgOnly() + '</g>',
        'art-word', 'A shark'
      );
    },
    fish: function () {
      return svg(
        '<path d="M16 62 C28 42 56 42 68 62 C56 82 28 82 16 62 Z" fill="#fb923c" stroke="#c2410c" stroke-width="2.4"/>' +
        '<path d="M66 62 L88 46 L84 62 L88 78 Z" fill="#f97316" stroke="#c2410c" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M38 44 C42 34 50 34 54 44" fill="#fdba74" stroke="#c2410c" stroke-width="2"/>' +
        '<circle cx="30" cy="58" r="3.4" fill="#1f2937"/>' +
        bubble(84, 28, 3) + bubble(92, 40, 2),
        'art-word', 'An orange fish'
      );
    }
  };

  function BenSvgOnly() { return innerOf(ben()); }

  /* A small sea creature used as a decorative guest on the question screen */
  function guest(id) {
    if (id === 'octopus') return octopus();
    if (id === 'shark') return shark();
    /* a little orange fish */
    return svg(
      '<path d="M14 62 C28 40 58 40 70 62 C58 84 28 84 14 62 Z" fill="#fb923c" stroke="#c2410c" stroke-width="2.4"/>' +
      '<path d="M68 62 L92 44 L88 62 L92 80 Z" fill="#f97316" stroke="#c2410c" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M38 43 C42 32 52 32 56 43" fill="#fdba74" stroke="#c2410c" stroke-width="2"/>' +
      '<circle cx="30" cy="57" r="4.2" fill="#ffffff"/>' +
      '<circle cx="30.6" cy="57" r="2.3" fill="#1f2937"/>' +
      '<path d="M20 70 Q30 76 40 70" stroke="#c2410c" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      bubble(80, 26, 3.4) + bubble(90, 38, 2.2) + bubble(72, 14, 1.8),
      'art-guest', 'A little orange fish'
    );
  }

  return {
    lucy: lucy,
    ben: ben,
    horax: horax,
    zelda: zelda,
    octopus: octopus,
    shark: shark,
    guest: guest,
    /* scenes */
    scene: function (id) {
      const fn = SCENES[id];
      return fn ? fn() : '';
    },
    /* props used by the menus */
    shellWithLetter: shellWithLetter,
    fishSchoolS: fishSchoolS,
    cage: cage,
    /* phonics word art */
    word: function (id) {
      const fn = WORD_ART[id];
      return fn ? fn() : svg('<text x="50" y="70" font-size="34" font-weight="900" fill="#1f2937" text-anchor="middle" font-family="Arial, sans-serif">' + (id || '?') + '</text>', 'art-word', id || 'word');
    },
    /* generic */
    avatar: function (id) {
      if (id === 'ben') return ben();
      if (id === 'horax') return horax();
      if (id === 'zelda') return zelda();
      if (id === 'octopus') return octopus();
      if (id === 'shark') return shark();
      return lucy();
    }
  };
})();
