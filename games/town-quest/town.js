/* ============================================================
   TOWN QUEST — Isometric town renderer
   Pure SVG string builder. No external images, no 3D engine.

   Every building is drawn from the same isometric primitives, so
   the town, the picture choices and the sentence scenes all use
   exactly the same artwork.

   Coordinate system inside a scene:
     column -> x (left to right)
     row    -> y (back to front)
   The logical grid is what the game checks; the pixels never are.
   ============================================================ */

const TQTown = (function () {
  'use strict';

  const D = TQ_DATA;
  const INK = '#22343f';
  const FONT = "'Comic Sans MS', 'Chalkboard SE', 'Segoe UI', sans-serif";

  let sceneSeq = 0;
  let gradientSeq = 0;

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function shade(hex, amount) {
    const c = hexToRgb(hex);
    const t = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    const r = Math.round((t - c.r) * p + c.r);
    const g = Math.round((t - c.g) * p + c.g);
    const b = Math.round((t - c.b) * p + c.b);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function n(v) {
    return Math.round(v * 10) / 10;
  }

  function pts(points) {
    return points.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' ');
  }

  function poly(points, fill, extra) {
    return '<polygon points="' + pts(points) + '" fill="' + fill + '"' +
      (extra ? ' ' + extra : '') + '/>';
  }

  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }

  function circle(cx, cy, r, fill, extra) {
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + fill + '"' +
      (extra ? ' ' + extra : '') + '/>';
  }

  function ellipse(cx, cy, rx, ry, fill, extra) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) +
      '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }

  function diamond(cx, cy, w, d) {
    return [
      [cx, cy - d / 2],
      [cx + w / 2, cy],
      [cx, cy + d / 2],
      [cx - w / 2, cy]
    ];
  }

  function box(cx, baseY, w, d, h, base, opts) {
    opts = opts || {};
    const top = diamond(cx, baseY - h, w, d);
    const bot = diamond(cx, baseY, w, d);
    const stroke = opts.stroke || shade(base, -0.34);
    const sw = opts.sw == null ? 1.2 : opts.sw;
    const attr = 'stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"';
    const left = opts.left || base;
    const right = opts.right || shade(base, -0.13);
    const topFill = opts.top || shade(base, 0.22);
    return poly([bot[3], bot[2], top[2], top[3]], left, attr) +
      poly([bot[2], bot[1], top[1], top[2]], right, attr) +
      poly(top, topFill, attr);
  }

  function pyramid(cx, topY, w, d, rh, color, opts) {
    opts = opts || {};
    const a = [cx, topY - d / 2];
    const b = [cx + w / 2, topY];
    const c = [cx, topY + d / 2];
    const e = [cx - w / 2, topY];
    const apex = [cx, topY - rh];
    const stroke = opts.stroke || shade(color, -0.32);
    const attr = 'stroke="' + stroke + '" stroke-width="1.2" stroke-linejoin="round"';
    return poly([e, a, apex], shade(color, 0.14), attr) +
      poly([a, b, apex], shade(color, 0.06), attr) +
      poly([b, c, apex], color, attr) +
      poly([c, e, apex], shade(color, -0.12), attr);
  }

  function facePoint(a, b, height, s, t) {
    return [
      a[0] + (b[0] - a[0]) * s,
      a[1] + (b[1] - a[1]) * s - height * t
    ];
  }

  function faceQuad(a, b, height, s0, s1, t0, t1, fill, extra) {
    return poly([
      facePoint(a, b, height, s0, t0),
      facePoint(a, b, height, s1, t0),
      facePoint(a, b, height, s1, t1),
      facePoint(a, b, height, s0, t1)
    ], fill, extra);
  }

  function faceWindows(a, b, height, cfg) {
    cfg = cfg || {};
    const rows = cfg.rows || 2;
    const cols = cfg.cols || 2;
    const s0 = cfg.s0 == null ? 0.16 : cfg.s0;
    const s1 = cfg.s1 == null ? 0.84 : cfg.s1;
    const t0 = cfg.t0 == null ? 0.32 : cfg.t0;
    const t1 = cfg.t1 == null ? 0.84 : cfg.t1;
    const gapS = cfg.gapS == null ? 0.10 : cfg.gapS;
    const gapT = cfg.gapT == null ? 0.18 : cfg.gapT;
    const fill = cfg.fill || '#c9ecff';
    const frame = cfg.frame || '#ffffff';
    let out = '';
    const rowH = (t1 - t0) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ss0 = s0 + (s1 - s0) * (c / cols) + gapS * 0.5;
        const ss1 = s0 + (s1 - s0) * ((c + 1) / cols) - gapS * 0.5;
        const tt0 = t1 - rowH * (r + 1) + gapT * 0.5;
        const tt1 = t1 - rowH * r - gapT * 0.5;
        out += faceQuad(a, b, height, ss0, ss1, tt0, tt1, fill,
          'stroke="' + frame + '" stroke-width="' + (cfg.sw || 1.6) + '"');
      }
    }
    return out;
  }

  function faceDoor(a, b, height, cfg) {
    cfg = cfg || {};
    const s0 = cfg.s0 == null ? 0.38 : cfg.s0;
    const s1 = cfg.s1 == null ? 0.62 : cfg.s1;
    const t = cfg.t == null ? 0.30 : cfg.t;
    const fill = cfg.fill || '#6b4b3a';
    let out = faceQuad(a, b, height, s0, s1, 0, t, fill,
      'stroke="' + (cfg.frame || '#ffffff') + '" stroke-width="1.6"');
    if (cfg.knob !== false) {
      const p = facePoint(a, b, height, (s0 + s1) / 2 + 0.06, t * 0.45);
      out += circle(p[0], p[1], 1.4, '#fbbf24');
    }
    return out;
  }

  function signBoard(x, y, w, h, bg, fg, text, opts) {
    opts = opts || {};
    const fs = opts.font || 13;
    return '<g class="tq-sign">' +
      rect(x - w / 2, y - h / 2, w, h, bg,
        'rx="5" stroke="' + (opts.stroke || '#ffffff') + '" stroke-width="2"') +
      '<text x="' + n(x) + '" y="' + n(y) + '" text-anchor="middle" dominant-baseline="central" ' +
      'style="font-family:' + FONT.replace(/"/g, "'") + ';font-size:' + fs + 'px;font-weight:900;' +
      'letter-spacing:.6px" fill="' + fg + '">' + esc(text) + '</text></g>';
  }

  function shadow(rx, ry, cy, opacity) {
    return ellipse(0, cy == null ? 5 : cy, rx, ry, '#12301f', 'opacity="' + (opacity || 0.16) + '"');
  }

  function tree(x, y, s, tone) {
    const dark = tone === 'autumn' ? '#d97706' : '#2f8f43';
    const mid = tone === 'autumn' ? '#f59e0b' : '#43aa53';
    const light = tone === 'autumn' ? '#fbbf24' : '#6ccc68';
    return '<g class="tq-tree">' +
      ellipse(x, y + 2, 20 * s, 7 * s, '#12301f', 'opacity=".13"') +
      rect(x - 3 * s, y - 24 * s, 6 * s, 24 * s, '#9a6b43', 'rx="2"') +
      circle(x - 12 * s, y - 30 * s, 12 * s, dark) +
      circle(x + 12 * s, y - 29 * s, 11 * s, dark) +
      circle(x, y - 40 * s, 17 * s, mid) +
      circle(x - 4 * s, y - 44 * s, 10 * s, light, 'opacity=".55"') +
      '</g>';
  }

  function bush(x, y, s, color) {
    return '<g>' + ellipse(x, y + 1, 15 * s, 5 * s, '#12301f', 'opacity=".1"') +
      circle(x - 7 * s, y - 5 * s, 8 * s, color || '#4fa85a') +
      circle(x + 7 * s, y - 5 * s, 8 * s, color || '#4fa85a') +
      circle(x, y - 9 * s, 10 * s, color ? shade(color, 0.1) : '#63bd68') + '</g>';
  }

  function flowers(x, y, color) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 7;
      out += '<line x1="' + (x + ox) + '" y1="' + y + '" x2="' + (x + ox) + '" y2="' + (y - 7) +
        '" stroke="#3f8f4b" stroke-width="1.4"/>' +
        circle(x + ox, y - 9, 3, color || '#f472b6');
    }
    return out;
  }

  function bench(x, y) {
    return '<g class="tq-bench">' +
      ellipse(x, y + 1, 17, 5, '#12301f', 'opacity=".12"') +
      rect(x - 16, y - 6, 32, 4, '#b45309', 'rx="2"') +
      rect(x - 16, y - 15, 32, 4, '#b45309', 'rx="2"') +
      rect(x - 14, y - 4, 3, 6, '#7c3f0d') +
      rect(x + 11, y - 4, 3, 6, '#7c3f0d') +
      rect(x - 14, y - 13, 3, 8, '#7c3f0d') +
      rect(x + 11, y - 13, 3, 8, '#7c3f0d') +
      '</g>';
  }

  function starPath(cx, cy, r) {
    let out = '';
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + (Math.PI / 5) * i;
      out += (i === 0 ? 'M' : 'L') + n(cx + Math.cos(a) * rr) + ' ' + n(cy + Math.sin(a) * rr);
    }
    return out + 'Z';
  }

  function star(cx, cy, r, fill, extra) {
    return '<path d="' + starPath(cx, cy, r) + '" fill="' + fill + '"' +
      (extra ? ' ' + extra : '') + '/>';
  }

  function ring(cx, cy, color, cls, rx, ry) {
    return ellipse(cx, cy + 3, rx || 58, ry || 27, 'none',
      'stroke="' + color + '" stroke-width="4" opacity=".95" class="' + cls + '"');
  }

  /* ------------------------------------------------------------------
     Building artwork — all inside a group whose origin is the
     centre of the building's plot on the ground.
     ------------------------------------------------------------------ */

  function artTrainStation(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.62, d * 0.6);
    // rails
    s += '<g class="tq-rail">';
    for (let i = 0; i < 7; i++) {
      s += rect(-52 + i * 15, -4, 9, 5, '#8d6e63', 'rx="1"');
    }
    s += rect(-56, -1, 112, 3, '#7f8c8d', 'rx="1.5"');
    s += rect(-56, 5, 112, 3, '#7f8c8d', 'rx="1.5"');
    s += '</g>';
    // little train behind the platform
    s += '<g class="tq-train">';
    s += rect(-50, -27, 30, 17, '#ef476f', 'rx="4"');
    s += rect(-19, -25, 22, 15, '#3a86ff', 'rx="4"');
    s += rect(-48, -24, 8, 6, '#dff3ff', 'rx="2"');
    s += rect(-36, -24, 8, 6, '#dff3ff', 'rx="2"');
    s += rect(-16, -22, 7, 6, '#dff3ff', 'rx="2"');
    s += rect(-6, -22, 7, 6, '#dff3ff', 'rx="2"');
    s += circle(-43, -8, 3.4, '#374151') + circle(-31, -8, 3.4, '#374151') +
      circle(-13, -8, 3.4, '#374151') + circle(-3, -8, 3.4, '#374151');
    s += rect(-50, -31, 6, 5, '#ef476f', 'rx="1.5"');
    s += '</g>';
    // platform
    s += box(8, 6, 84, 40, 6, '#e7e0d3', { stroke: '#c7bda9' });
    s += poly([[8 - 42, 6 + 20], [8 + 42, 6 + 20], [8 + 42, 6 + 24], [8 - 42, 6 + 24]],
      '#f4b740', 'opacity=".85"');
    // station house
    s += box(12, -2, 54, 32, h, a.base, { stroke: shade(a.base, -0.28) });
    s += pyramid(12, -2 - h, 58, 36, 18, a.roof);
    // door + window
    const F = [12, -2 + 16], R = [12 + 27, -2], L = [12 - 27, -2];
    s += faceDoor(F, R, h, { s0: 0.34, s1: 0.66, t: 0.26, fill: '#7a5236' });
    s += faceWindows(L, F, h, { rows: 1, cols: 1, s0: 0.24, s1: 0.76, t0: 0.42, t1: 0.76, fill: '#c9ecff' });
    s += faceWindows(F, R, h, { rows: 1, cols: 1, s0: 0.76, s1: 0.94, t0: 0.42, t1: 0.76, fill: '#c9ecff' });
    // clock
    const cp = facePoint(F, R, h, 0.78, 0.66);
    s += circle(cp[0], cp[1], 6.5, '#ffffff', 'stroke="#475569" stroke-width="1.6"');
    s += '<line x1="' + cp[0] + '" y1="' + cp[1] + '" x2="' + cp[0] + '" y2="' + (cp[1] - 4) +
      '" stroke="#334155" stroke-width="1.4"/><line x1="' + cp[0] + '" y1="' + cp[1] + '" x2="' +
      (cp[0] + 3) + '" y2="' + cp[1] + '" stroke="#334155" stroke-width="1.4"/>';
    s += signBoard(12, -2 - h - 26, 50, 16, '#ffffff', '#0f5132', 'STATION', { font: 9, stroke: '#3b82f6' });
    // bench on the platform
    s += '<g transform="translate(-30 2) scale(.8)">' + bench(0, 0) + '</g>';
    return s;
  }

  function artHospital(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.64, d * 0.6);
    s += box(0, 0, w, d, h, a.base, { stroke: '#c7d7e8' });
    s += box(0, -h, w + 5, d + 5, 8, a.roof, { stroke: '#b6c9dd' });
    const F = [0, d / 2], R = [w / 2, 0], L = [-w / 2, 0];
    // right face windows
    s += faceWindows(F, R, h, { rows: 3, cols: 2, t0: 0.30, t1: 0.80, fill: '#bfe3ff', frame: '#ffffff' });
    // left face: big cross + one window
    s += faceWindows(L, F, h, { rows: 1, cols: 1, s0: 0.28, s1: 0.72, t0: 0.76, t1: 0.86, fill: '#bfe3ff' });
    s += faceQuad(L, F, h, 0.44, 0.56, 0.36, 0.70, '#ef4444');
    s += faceQuad(L, F, h, 0.32, 0.68, 0.49, 0.57, '#ef4444');
    // entrance
    s += faceDoor(F, R, h, { s0: 0.36, s1: 0.64, t: 0.27, fill: '#7fc8e8', frame: '#e2e8f0' });
    s += faceQuad(L, F, h, 0.16, 0.38, 0, 0.12, '#dbeafe');
    // roof helipad cross
    const topY = -h - 8;
    s += ellipse(0, topY, w * 0.3, d * 0.3, '#ffffff', 'opacity=".8"');
    s += '<g stroke="#ef4444" stroke-width="7" stroke-linecap="round">' +
      '<line x1="' + (-w * 0.14) + '" y1="' + topY + '" x2="' + (w * 0.14) + '" y2="' + topY + '"/>' +
      '<line x1="0" y1="' + (topY - d * 0.2) + '" x2="0" y2="' + (topY + d * 0.2) + '"/>' +
      '</g>';
    // canopy over the entrance
    s += '<g class="tq-canopy">' +
      poly([[-18, -22], [18, -22], [12, -16], [-12, -16]], '#93c5fd', 'stroke="#60a5fa" stroke-width="1.2"') +
      rect(-14, -20, 3, 20, '#e2e8f0') + rect(11, -20, 3, 20, '#e2e8f0') +
      '</g>';
    return s;
  }

  function artMovieTheater(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.64, d * 0.6);
    s += box(0, 0, w, d, h, a.base, { stroke: shade(a.base, -0.35) });
    s += box(0, -h, w + 5, d + 5, 8, a.roof, { stroke: shade(a.roof, -0.25) });
    const F = [0, d / 2], R = [w / 2, 0], L = [-w / 2, 0];
    // facade band + film strip
    s += faceQuad(F, R, h, 0.06, 0.94, 0.62, 0.70, '#1f1235');
    s += faceQuad(L, F, h, 0.06, 0.94, 0.62, 0.70, '#2b1a49');
    for (let i = 0; i < 5; i++) {
      const s0 = 0.10 + i * 0.17;
      s += faceQuad(F, R, h, s0, s0 + 0.08, 0.63, 0.69, '#fef3c7');
    }
    for (let i = 0; i < 4; i++) {
      const s0 = 0.12 + i * 0.2;
      s += faceQuad(L, F, h, s0, s0 + 0.08, 0.63, 0.69, '#fef3c7');
    }
    // door + gold trim
    s += faceDoor(F, R, h, { s0: 0.30, s1: 0.70, t: 0.34, fill: '#2a1745', frame: '#fbbf24' });
    s += faceWindows(L, F, h, { rows: 1, cols: 2, s0: 0.2, s1: 0.8, t0: 0.18, t1: 0.30, fill: '#fde68a', frame: '#7c3aed' });
    // marquee
    s += '<g class="tq-marquee">' +
      rect(-5, -h - 16, 10, 8, '#7c3aed') +
      rect(-w / 2 + 6, -h - 36, w - 12, 20, '#dc2626', 'rx="6" stroke="#fbbf24" stroke-width="3"') +
      '<text x="0" y="' + (-h - 26) + '" text-anchor="middle" dominant-baseline="central" ' +
      'style="font-family:' + FONT.replace(/"/g, "'") + ';font-size:15px;font-weight:900;letter-spacing:3px" fill="#fef3c7">MOVIE</text>' +
      star(-w / 2 + 19, -h - 26, 6, '#fbbf24') +
      star(w / 2 - 19, -h - 26, 6, '#fbbf24') +
      '</g>';
    // red carpet + star
    s += poly([[-20, 10], [20, 10], [28, 26], [-28, 26]], '#c81e3a', 'opacity=".95"');
    s += star(0, 18, 6, '#fbbf24');
    s += '<g fill="#fde68a">' + circle(-28, -h - 14, 2.4, '#fde68a') + circle(-18, -h - 14, 2.4, '#fde68a') +
      circle(-8, -h - 14, 2.4, '#fde68a') + circle(2, -h - 14, 2.4, '#fde68a') +
      circle(12, -h - 14, 2.4, '#fde68a') + circle(22, -h - 14, 2.4, '#fde68a') + '</g>';
    return s;
  }

  function artPlayground(a) {
    const w = a.w, d = a.d;
    let s = shadow(w * 0.62, d * 0.6);
    // sand
    s += box(0, 4, w, d, 6, a.base, { stroke: '#e0bd7f' });
    // soft play mound
    s += ellipse(-26, -2, 24, 10, '#fde68a', 'opacity=".75"');
    // slide tower
    s += box(-30, 0, 24, 18, 30, '#60a5fa', { stroke: '#3b82f6' });
    s += pyramid(-30, -30, 28, 22, 10, '#f59e0b');
    // slide
    s += poly([[-24, -26], [-14, -26], [8, 2], [-6, 2]], '#facc15', 'stroke="#eab308" stroke-width="1.4"');
    s += poly([[-24, -24], [-18, -24], [2, 2], [-6, 2]], '#fde68a', 'opacity=".8"');
    // ladder
    s += '<g stroke="#92400e" stroke-width="2">' +
      '<line x1="-42" y1="0" x2="-42" y2="-24"/><line x1="-36" y1="0" x2="-36" y2="-24"/>' +
      '<line x1="-42" y1="-6" x2="-36" y2="-6"/><line x1="-42" y1="-13" x2="-36" y2="-13"/>' +
      '<line x1="-42" y1="-20" x2="-36" y2="-20"/></g>';
    // swings
    s += '<g class="tq-swings">' +
      '<line x1="16" y1="0" x2="10" y2="-42" stroke="#ef4444" stroke-width="3.6" stroke-linecap="round"/>' +
      '<line x1="46" y1="0" x2="52" y2="-42" stroke="#ef4444" stroke-width="3.6" stroke-linecap="round"/>' +
      '<line x1="10" y1="-42" x2="52" y2="-42" stroke="#ef4444" stroke-width="3.6" stroke-linecap="round"/>' +
      '<line x1="23" y1="-42" x2="23" y2="-14" stroke="#94a3b8" stroke-width="1.6"/>' +
      '<line x1="33" y1="-42" x2="33" y2="-14" stroke="#94a3b8" stroke-width="1.6"/>' +
      rect(19, -15, 18, 4, '#f59e0b', 'rx="2"') +
      '<line x1="38" y1="-42" x2="38" y2="-16" stroke="#94a3b8" stroke-width="1.6"/>' +
      '<line x1="48" y1="-42" x2="48" y2="-16" stroke="#94a3b8" stroke-width="1.6"/>' +
      rect(34, -17, 18, 4, '#22c55e', 'rx="2"') +
      '</g>';
    // bouncy rider + ball
    s += '<g><line x1="-4" y1="0" x2="-4" y2="-9" stroke="#7c3aed" stroke-width="3"/>' +
      ellipse(-4, -12, 8, 5, '#a78bfa', 'stroke="#7c3aed" stroke-width="1.2"') + '</g>';
    s += circle(14, 6, 5, '#ef4444', 'stroke="#b91c1c" stroke-width="1.2"') +
      '<path d="M11 5 Q14 9 17 5" stroke="#fff" stroke-width="1.2" fill="none"/>';
    return s;
  }

  function artCafe(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.62, d * 0.6);
    s += box(0, 0, w, d, h, a.base, { stroke: '#e3cfa8' });
    s += pyramid(0, -h, w + 6, d + 6, 18, a.roof);
    const F = [0, d / 2], R = [w / 2, 0], L = [-w / 2, 0];
    s += faceDoor(F, R, h, { s0: 0.36, s1: 0.64, t: 0.26, fill: '#7a4b2a' });
    s += faceWindows(L, F, h, { rows: 1, cols: 1, s0: 0.24, s1: 0.68, t0: 0.32, t1: 0.62, fill: '#ffe9b8', frame: '#b45309' });
    s += faceWindows(F, R, h, { rows: 1, cols: 1, s0: 0.72, s1: 0.94, t0: 0.32, t1: 0.62, fill: '#ffe9b8', frame: '#b45309' });
    // awning
    s += '<g class="tq-awning">';
    for (let i = 0; i < 6; i++) {
      s += rect(-30 + i * 10, -32, 10, 11, i % 2 ? '#ffffff' : '#ef4444');
    }
    s += rect(-32, -34, 64, 4, '#b91c1c', 'rx="2"');
    s += '</g>';
    // hanging cup sign
    s += '<g class="tq-sign">' +
      '<line x1="-34" y1="-16" x2="-34" y2="-38" stroke="#7c4a21" stroke-width="2"/>' +
      rect(-44, -50, 20, 16, '#fff7ed', 'rx="4" stroke="#b45309" stroke-width="1.6"') +
      rect(-38, -45, 8, 7, '#b45309', 'rx="1.5"') +
      '<path d="M-30 -43 q4 0 4 3 q0 3 -4 3" stroke="#b45309" stroke-width="1.6" fill="none"/>' +
      '</g>';
    // tables + umbrellas
    s += '<g class="tq-tables">';
    s += umbrella(-43, 4, 15, '#f97316');
    s += table(-43, 8, 10);
    s += umbrella(43, 11, 14, '#0ea5e9');
    s += table(43, 15, 9);
    s += '</g>';
    s += flowers(20, 14, '#f472b6') + flowers(-20, 15, '#fbbf24');
    return s;
  }

  function umbrella(x, y, r, color) {
    return '<g class="tq-umbrella">' +
      '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - 34) + '" stroke="#8a6a4a" stroke-width="2"/>' +
      '<path d="M' + (x - r) + ' ' + (y - 34) + ' Q' + x + ' ' + (y - 50) + ' ' + (x + r) + ' ' + (y - 34) +
      ' Z" fill="' + color + '" stroke="' + shade(color, -0.25) + '" stroke-width="1.4"/>' +
      '<path d="M' + x + ' ' + (y - 34) + ' Q' + x + ' ' + (y - 46) + ' ' + (x + r) + ' ' + (y - 34) + '" stroke="#fff" stroke-width="1.2" fill="none" opacity=".55"/>' +
      '</g>';
  }

  function table(x, y, r) {
    return '<g class="tq-table">' +
      ellipse(x, y + 2, r * 0.9, 3, '#12301f', 'opacity=".12"') +
      '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - 9) + '" stroke="#8a6a4a" stroke-width="2"/>' +
      ellipse(x, y - 9, r * 0.8, r * 0.42, '#fef3c7', 'stroke="#b45309" stroke-width="1.2"') +
      circle(x - 2, y - 11, 2, '#ef4444') +
      '</g>';
  }

  function artStore(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.64, d * 0.6);
    s += box(0, 0, w, d, h, a.base, { stroke: '#9fd9c3' });
    s += box(0, -h, w + 4, d + 4, 7, a.roof, { stroke: '#71c9a8' });
    const F = [0, d / 2], R = [w / 2, 0], L = [-w / 2, 0];
    // big window with produce
    s += faceQuad(F, R, h, 0.08, 0.92, 0.16, 0.60, '#d9f7ff', 'stroke="#ffffff" stroke-width="2"');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const fr = facePoint(F, R, h, 0.18 + i * 0.3, 0.28 + j * 0.18);
        s += circle(fr[0], fr[1], 3.2, ['#f97316', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#ec4899'][i * 2 + j]);
      }
    }
    s += faceQuad(F, R, h, 0.08, 0.92, 0.14, 0.17, '#ffffff');
    s += faceDoor(F, R, h, { s0: 0.36, s1: 0.64, t: 0.28, fill: '#0f766e', frame: '#ffffff' });
    s += faceWindows(L, F, h, { rows: 1, cols: 1, s0: 0.3, s1: 0.8, t0: 0.22, t1: 0.52, fill: '#d9f7ff', frame: '#ffffff' });
    // striped awning (drawn last so it sits in front of the window)
    s += '<g class="tq-awning">';
    for (let i = 0; i < 7; i++) {
      s += rect(-35 + i * 10, -40, 10, 12, i % 2 ? '#ffffff' : '#10b981');
    }
    s += rect(-37, -42, 74, 4, '#047857', 'rx="2"');
    s += '</g>';
    // shop sign
    s += signBoard(0, -h - 24, 66, 20, '#ffffff', '#065f46', 'SHOP', { font: 13, stroke: '#10b981' });
    // crates
    s += '<g class="tq-crates">' +
      rect(-36, -6, 18, 12, '#d6a26a', 'rx="2" stroke="#a9743f" stroke-width="1.2"') +
      circle(-31, -8, 3.4, '#f97316') + circle(-26, -7, 3.2, '#f59e0b') +
      rect(20, -4, 16, 11, '#d6a26a', 'rx="2" stroke="#a9743f" stroke-width="1.2"') +
      circle(24, -6, 3.2, '#22c55e') + circle(29, -6, 3.4, '#16a34a') +
      '</g>';
    return s;
  }

  function artBusStop(a) {
    const w = a.w, d = a.d;
    let s = shadow(w * 0.6, d * 0.6);
    // paving
    s += box(4, 4, w, d, 5, '#e2e8f0', { stroke: '#cbd5e1' });
    // back glass
    s += '<g class="tq-shelter">' +
      poly([[-24, -54], [30, -54], [30, -10], [-24, -10]], '#cffafe', 'opacity=".55" stroke="#7dd3fc" stroke-width="1.4"') +
      '<g stroke="#38bdf8" stroke-width="3"><line x1="-24" y1="-54" x2="-24" y2="-10"/><line x1="30" y1="-54" x2="30" y2="-10"/></g>' +
      '</g>';
    // roof
    s += box(4, -54, 76, 38, 7, '#38bdf8', { stroke: '#0284c7' });
    // posts
    s += rect(-30, -54, 5, 54, '#475569', 'rx="2"') + rect(34, -54, 5, 54, '#475569', 'rx="2"');
    // bench
    s += bench(4, -10);
    // sign pole
    s += '<g class="tq-bussign">' +
      '<line x1="46" y1="2" x2="46" y2="-50" stroke="#64748b" stroke-width="3"/>' +
      circle(46, -56, 13, '#0ea5e9', 'stroke="#ffffff" stroke-width="2.5"') +
      rect(41, -61, 10, 8, '#ffffff', 'rx="2"') +
      circle(43, -52.5, 2, '#0ea5e9') + circle(49, -52.5, 2, '#0ea5e9') +
      '</g>';
    // timetable board
    s += rect(-34, -8, 14, 10, '#ffffff', 'rx="1.5" stroke="#94a3b8" stroke-width="1"') +
      rect(-32, -6, 10, 1.2, '#94a3b8') + rect(-32, -3.5, 10, 1.2, '#94a3b8');
    return s;
  }

  function artPark(a) {
    const w = a.w, d = a.d;
    let s = shadow(w * 0.64, d * 0.6);
    s += box(0, 4, w, d, 5, a.base, { stroke: '#6fc45a' });
    // winding path
    s += '<path d="M-46 14 Q-16 2 6 6 Q30 10 44 -8" stroke="#f5deb0" stroke-width="9" fill="none" stroke-linecap="round" opacity=".95"/>';
    // trees
    s += tree(-28, 4, 1.18, 'green');
    s += tree(30, -2, 0.85, 'green');
    // fountain
    s += '<g class="tq-fountain">' +
      ellipse(4, 6, 20, 8, '#cbd5e1', 'stroke="#94a3b8" stroke-width="1.2"') +
      ellipse(4, 5, 15, 5.6, '#7dd3fc') +
      '<line x1="4" y1="5" x2="4" y2="-12" stroke="#94a3b8" stroke-width="2"/>' +
      ellipse(4, -13, 5, 2, '#e2e8f0') +
      '<path d="M4 -12 q-8 6 -10 14 M4 -12 q8 6 10 14" stroke="#bae6fd" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '</g>';
    s += bench(32, 16);
    s += flowers(-42, 18, '#f472b6') + flowers(-36, 20, '#fbbf24') + flowers(18, 18, '#60a5fa');
    s += bush(-6, 18, 0.7, '#4fa85a');
    return s;
  }

  function artSchool(a) {
    const w = a.w, d = a.d, h = a.h;
    let s = shadow(w * 0.66, d * 0.62);
    s += box(0, 0, w, d, h, a.base, { stroke: '#d59a7f' });
    s += box(0, -h, w + 4, d + 4, 7, '#fff1e6', { stroke: '#e2c8b6' });
    const F = [0, d / 2], R = [w / 2, 0], L = [-w / 2, 0];
    // brick lines
    for (let i = 1; i < 4; i++) {
      const y = -h * (i / 4);
      s += '<line x1="' + (-w / 2) + '" y1="' + (y + d / 4) + '" x2="0" y2="' + (y + d / 2) + '" stroke="#d59a7f" stroke-width="1" opacity=".7"/>';
      s += '<line x1="0" y1="' + (y + d / 2) + '" x2="' + (w / 2) + '" y2="' + (y + d / 4) + '" stroke="#d59a7f" stroke-width="1" opacity=".7"/>';
    }
    s += faceWindows(F, R, h, { rows: 2, cols: 3, t0: 0.24, t1: 0.74, fill: '#bfe3ff', frame: '#fff1e6' });
    s += faceWindows(L, F, h, { rows: 2, cols: 2, t0: 0.24, t1: 0.74, fill: '#bfe3ff', frame: '#fff1e6' });
    s += faceDoor(F, R, h, { s0: 0.40, s1: 0.60, t: 0.30, fill: '#8b5a3c', frame: '#fff1e6' });
    // steps
    s += poly([[-8, 2], [8, 2], [12, 8], [-12, 8]], '#e7d6c7', 'stroke="#cbb5a5" stroke-width="1"');
    // bell tower
    s += box(0, -h - 7, 26, 26, 30, '#f1c4ae', { stroke: '#d59a7f' });
    s += pyramid(0, -h - 37, 30, 30, 13, a.roof);
    s += circle(0, -h - 22, 6, '#fff7ed', 'stroke="#92400e" stroke-width="1.4"');
    s += '<line x1="0" y1="' + (-h - 22) + '" x2="0" y2="' + (-h - 26) + '" stroke="#92400e" stroke-width="1.2"/>' +
      '<line x1="0" y1="' + (-h - 22) + '" x2="2.6" y2="' + (-h - 22) + '" stroke="#92400e" stroke-width="1.2"/>';
    // flag
    s += '<g class="tq-flag">' +
      '<line x1="34" y1="' + (-h - 7) + '" x2="34" y2="' + (-h - 47) + '" stroke="#94a3b8" stroke-width="2"/>' +
      '<path d="M34 ' + (-h - 47) + ' L52 ' + (-h - 42) + ' L34 ' + (-h - 37) + ' Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>' +
      '</g>';
    return s;
  }

  function artSwimmingPool(a) {
    const w = a.w, d = a.d;
    let s = shadow(w * 0.66, d * 0.6);
    s += box(0, 4, w, d, 6, a.base, { stroke: '#a7e3dd' });
    const gid = 'tqWater' + (++gradientSeq);
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>';
    s += ellipse(0, -2, 43, 18, '#ffffff', 'stroke="#cbd5e1" stroke-width="2"');
    s += ellipse(0, -2, 38, 14.5, 'url(#' + gid + ')');
    s += '<g stroke="#e0f2fe" stroke-width="2" opacity=".85">' +
      '<line x1="-26" y1="-8" x2="26" y2="-8"/><line x1="-30" y1="-2" x2="30" y2="-2"/>' +
      '<line x1="-26" y1="4" x2="26" y2="4"/></g>';
    s += '<g stroke="#ffffff" stroke-width="1.6" opacity=".8" fill="none">' +
      '<path d="M-14 -12 q5 -3 10 0"/><path d="M12 6 q5 -3 10 0"/></g>';
    // ladder
    s += '<g stroke="#e2e8f0" stroke-width="2.2"><line x1="38" y1="4" x2="38" y2="-12"/><line x1="44" y1="2" x2="44" y2="-14"/>' +
      '<line x1="38" y1="-3" x2="44" y2="-5"/><line x1="38" y1="-8" x2="44" y2="-10"/></g>';
    // diving board
    s += '<g class="tq-diving">' +
      rect(-48, -4, 4, 12, '#94a3b8') +
      rect(-48, -8, 22, 4, '#f8fafc', 'rx="2" stroke="#cbd5e1" stroke-width="1"') +
      '</g>';
    // umbrella + lounger
    s += umbrella(36, 16, 17, '#ef4444');
    s += '<g class="tq-lounger">' +
      rect(12, 12, 16, 5, '#fbbf24', 'rx="2" stroke="#d97706" stroke-width="1.2" transform="rotate(-12 20 14)"') +
      '</g>';
    return s;
  }

  const ART = {
    'train-station': artTrainStation,
    'hospital': artHospital,
    'movie-theater': artMovieTheater,
    'playground': artPlayground,
    'cafe': artCafe,
    'store': artStore,
    'bus-stop': artBusStop,
    'park': artPark,
    'school': artSchool,
    'swimming-pool': artSwimmingPool
  };

  /* ------------------------------------------------------------------
     Scenery props
     ------------------------------------------------------------------ */
  function bus(x, y) {
    return '<g class="tq-bus">' +
      ellipse(x, y + 2, 34, 6, '#12301f', 'opacity=".15"') +
      rect(x - 34, y - 26, 68, 26, '#fbbf24', 'rx="8" stroke="#d97706" stroke-width="1.6"') +
      rect(x - 34, y - 26, 68, 8, '#f59e0b', 'rx="6"') +
      rect(x - 30, y - 21, 60, 9, '#d9f7ff', 'rx="3" opacity=".9"') +
      rect(x - 30, y - 12, 60, 2, '#d97706') +
      rect(x - 26, y - 9, 30, 5, '#fef3c7', 'rx="2"') +
      '<text x="' + x + '" y="' + (y - 6) + '" text-anchor="middle" dominant-baseline="central" style="font-family:' +
      FONT.replace(/"/g, "'") + ';font-size:7px;font-weight:900" fill="#92400e">BUS</text>' +
      circle(x - 22, y - 1, 6, '#3b3f46') + circle(x - 22, y - 1, 2.4, '#cbd5e1') +
      circle(x + 22, y - 1, 6, '#3b3f46') + circle(x + 22, y - 1, 2.4, '#cbd5e1') +
      '</g>';
  }

  function car(x, y, color) {
    const body = color || '#ef476f';
    return '<g class="tq-car">' +
      ellipse(x, y + 2, 22, 5, '#12301f', 'opacity=".15"') +
      rect(x - 22, y - 13, 44, 13, body, 'rx="5" stroke="' + shade(body, -0.3) + '" stroke-width="1.3"') +
      '<path d="M' + (x - 12) + ' ' + (y - 13) + ' L' + (x - 7) + ' ' + (y - 21) + ' L' + (x + 8) + ' ' + (y - 21) +
      ' L' + (x + 13) + ' ' + (y - 13) + ' Z" fill="' + shade(body, 0.12) + '" opacity=".95"/>' +
      rect(x - 6, y - 20, 12, 6, '#d9f7ff', 'rx="2" opacity=".9"') +
      circle(x - 13, y - 1, 4.6, '#3b3f46') + circle(x + 13, y - 1, 4.6, '#3b3f46') +
      circle(x - 13, y - 1, 1.8, '#cbd5e1') + circle(x + 13, y - 1, 1.8, '#cbd5e1') +
      '</g>';
  }

  function cloud(x, y, s) {
    return '<g class="tq-cloud" opacity=".92" fill="#ffffff">' +
      circle(x, y, 18 * s, '#ffffff') +
      circle(x + 20 * s, y + 4 * s, 14 * s, '#ffffff') +
      circle(x - 22 * s, y + 5 * s, 13 * s, '#ffffff') +
      rect(x - 34 * s, y + 4 * s, 70 * s, 13 * s, '#ffffff', 'rx="6"') +
      '</g>';
  }

  /* ------------------------------------------------------------------
     Scene layout helpers
     ------------------------------------------------------------------ */
  function cellCenters(cols, rows, cellW, cellH, padX, padTop) {
    return {
      x: function (col) { return padX + (col + 0.5) * cellW; },
      y: function (row) { return padTop + (row + 0.5) * cellH; }
    };
  }

  function defaultTownScenery() {
    return [
      { type: 'tree', col: -0.30, row: 0.10, s: 1.02 },
      { type: 'tree', col: 5.30, row: 0.22, s: 0.92 },
      { type: 'tree', col: -0.26, row: 1.42, s: 0.84 },
      { type: 'tree', col: 5.32, row: 1.55, s: 0.88 },
      { type: 'tree', col: -0.28, row: 2.55, s: 0.76 },
      { type: 'tree', col: 5.34, row: 2.40, s: 0.8 },
      { type: 'bush', col: 0.12, row: 0.62, s: 0.9 },
      { type: 'bush', col: 5.02, row: 1.05, s: 0.85 },
      { type: 'flowers', col: 0.18, row: 2.80, color: '#f472b6' },
      { type: 'flowers', col: 5.02, row: 2.85, color: '#fbbf24' },
      { type: 'flowers', col: 4.28, row: 2.92, color: '#60a5fa' },
      { type: 'bench', col: 0.42, row: 2.42 }
    ];
  }

  function defaultMiniScenery(cols, rows) {
    return [
      { type: 'tree', col: -0.42, row: rows - 0.38, s: 0.92 },
      { type: 'tree', col: cols - 0.10, row: 0.22, s: 0.84 },
      { type: 'bush', col: 0.08, row: rows - 0.10, s: 0.72 },
      { type: 'flowers', col: cols - 0.28, row: rows - 0.12, color: '#f472b6' },
      { type: 'flowers', col: 0.30, row: 0.14, color: '#fbbf24' }
    ];
  }

  function sceneryHTML(item, c) {
    const x = c.x(item.col);
    const y = c.y(item.row);
    if (item.type === 'tree') return tree(x, y, item.s || 1);
    if (item.type === 'bush') return bush(x, y, item.s || 1, item.color);
    if (item.type === 'flowers') return flowers(x, y, item.color);
    if (item.type === 'bench') return bench(x, y);
    return '';
  }

  /* ------------------------------------------------------------------
     Labels
     ------------------------------------------------------------------ */
  function labelHTML(x, y, text, accent, big) {
    const fs = big ? 16 : 12.5;
    const perChar = big ? 9.2 : 7.3;
    const pad = big ? 24 : 20;
    const h = big ? 25 : 21;
    const w = Math.max(big ? 68 : 58, text.length * perChar + pad);
    return '<g class="tq-label">' +
      rect(x - w / 2, y - h / 2, w, h, 'rgba(255,255,255,.95)',
        'rx="' + (h / 2) + '" stroke="' + accent + '" stroke-width="1.7"') +
      '<text x="' + n(x) + '" y="' + n(y + 0.5) + '" text-anchor="middle" dominant-baseline="central" ' +
      'style="font-family:' + FONT.replace(/"/g, "'") + ';font-size:' + fs + 'px;font-weight:900" fill="#28443a">' +
      esc(text) + '</text></g>';
  }

  /* ------------------------------------------------------------------
     Public: render a scene
     ------------------------------------------------------------------ */
  function renderScene(options) {
    const o = options || {};
    const variant = o.variant || 'town';
    const cols = o.cols || D.MAIN_TOWN.cols;
    const rows = o.rows || D.MAIN_TOWN.rows;
    const cellW = o.cellW || 150;
    const cellH = o.cellH || 132;
    const padX = o.padX == null ? 52 : o.padX;
    const padTop = o.padTop == null ? 150 : o.padTop;
    const padBottom = o.padBottom == null ? 74 : o.padBottom;
    const W = padX * 2 + cols * cellW;
    const H = padTop + rows * cellH + padBottom;
    const c = cellCenters(cols, rows, cellW, cellH, padX, padTop);
    const buildings = (o.buildings || []).slice();
    const byId = {};
    buildings.forEach(function (b) { byId[b.id] = b; });
    const highlight = o.highlight || [];
    const focus = o.focus || [];
    const dim = o.dim || [];
    const labels = !!o.labels;
    const uid = ++sceneSeq;

    const skyId = 'tqSky' + uid;
    let defs = '<defs><linearGradient id="' + skyId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#8fd7ff"/><stop offset="0.55" stop-color="#c7efff"/>' +
      '<stop offset="1" stop-color="#e8fbe6"/></linearGradient></defs>';

    let bg = '';
    if (variant !== 'icon') {
      bg += rect(0, 0, W, H, 'url(#' + skyId + ')');
      const sunX = W * 0.78;
      bg += circle(sunX, 56, 34, '#ffe680', 'opacity=".45"');
      bg += circle(sunX, 56, 24, '#ffd93d');
      bg += circle(sunX - 8, 48, 8, '#fff3b0', 'opacity=".8"');
      bg += cloud(96, 58, 1) + cloud(W * 0.5, 34, 0.7);
      bg += '<g stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".55">' +
        '<path d="M' + (W * 0.32) + ' 96 q5 -5 10 0 q5 -5 10 0"/>' +
        '<path d="M' + (W * 0.4) + ' 78 q4 -4 8 0 q4 -4 8 0"/></g>';
    }

    const islandX = padX - 16;
    const islandY = padTop - 36;
    const islandW = cols * cellW + 32;
    const islandH = rows * cellH + 74;
    let island = '';
    if (variant !== 'icon') {
      island += rect(islandX + 4, islandY + 22, islandW - 8, islandH + 6, '#264b36', 'rx="34" opacity=".13"');
      island += rect(islandX, islandY + 12, islandW, islandH + 14, '#a97450', 'rx="34"');
      island += rect(islandX, islandY + islandH - 6, islandW, 34, '#8f5d3c', 'rx="26"');
      island += rect(islandX, islandY, islandW, islandH, '#7fcf63', 'rx="34"');
      island += rect(islandX + 10, islandY + 8, islandW - 20, islandH - 16, 'none',
        'rx="26" stroke="#a6e58d" stroke-width="3" opacity=".55"');
      // mown stripes
      island += '<g opacity=".13" fill="#ffffff">';
      for (let i = 0; i < rows * 2; i++) {
        island += rect(islandX + 18, islandY + 34 + i * 62, islandW - 36, 18, '#ffffff', 'rx="9"');
      }
      island += '</g>';
    }

    // road across the front row (town only)
    let road = '';
    if (variant === 'town' && o.road !== false) {
      const roadY = c.y(rows - 1) + 6;
      const roadX = islandX + 8;
      const roadW = islandW - 16;
      road += rect(roadX, roadY - 30, roadW, 9, '#d9e7c9', 'rx="4"');
      road += rect(roadX, roadY - 23, roadW, 46, '#8b98a8', 'rx="14"');
      road += rect(roadX, roadY + 19, roadW, 9, '#d9e7c9', 'rx="4"');
      road += rect(roadX, roadY - 23, roadW, 4, '#77828f', 'rx="2"');
      let dashes = '';
      for (let i = 0; i < 14; i++) {
        dashes += rect(roadX + 16 + i * 58, roadY - 2, 26, 4, '#f8fafc', 'rx="2" opacity=".9"');
      }
      road += dashes;
      // zebra crossing
      const zx = c.x(3.35);
      for (let i = 0; i < 5; i++) {
        road += rect(zx - 34 + i * 15, roadY - 17, 8, 34, '#f8fafc', 'rx="3" opacity=".9"');
      }
      road += bus(c.x(0.52), roadY - 1);
      road += car(c.x(4.62), roadY - 1, '#ef476f');
    }

    // empty plots
    let pads = '';
    (o.empty || []).forEach(function (p) {
      const x = c.x(p.col);
      const y = c.y(p.row);
      const top = diamond(x, y - 2, 104, 46);
      const base = diamond(x, y + 3, 104, 46);
      pads += '<g class="tq-pad' + (o.emptyHint ? ' is-hint' : '') + '" data-col="' + p.col +
        '" data-row="' + p.row + '" role="button" aria-label="Empty building spot">' +
        rect(x - 58, y - 40, 116, 76, 'transparent', 'pointer-events="all"') +
        ellipse(x, y + 4, 50, 20, '#12301f', 'opacity=".07"') +
        poly([base[3], base[2], top[2], top[3]], '#d6eec2', 'stroke="#7db45f" stroke-width="1.6"') +
        poly([base[2], base[1], top[1], top[2]], '#c4e6a8', 'stroke="#7db45f" stroke-width="1.6"') +
        poly(top, '#f2fbe8', 'stroke="#7db45f" stroke-width="2.4" stroke-dasharray="8 6"') +
        '<text x="' + n(x) + '" y="' + n(y - 1) + '" text-anchor="middle" dominant-baseline="central" ' +
        'style="font-family:' + FONT.replace(/"/g, "'") + ';font-size:22px;font-weight:900" fill="#78a95e" opacity=".8">+</text>' +
        '</g>';
    });

    // scenery + buildings, painter-sorted by row
    const items = [];
    const sceneryList = (o.scenery ||
      (variant === 'town' ? defaultTownScenery() : defaultMiniScenery(cols, rows)))
      .concat(o.extraScenery || []);
    sceneryList.forEach(function (s) {
      items.push({ row: s.row, z: s.type === 'tree' ? 0 : 0.2, html: sceneryHTML(s, c) });
    });
    buildings.forEach(function (b) {
      const def = D.BY_ID[b.id];
      if (!def) return;
      const x = c.x(b.col);
      const y = c.y(b.row);
      const isDim = dim.indexOf(b.id) !== -1;
      let cls = 'tq-bld';
      if (highlight.indexOf(b.id) !== -1) cls += ' is-target';
      if (focus.indexOf(b.id) !== -1) cls += ' is-focus';
      if (isDim) cls += ' is-dim';
      if (o.pop === b.id) cls += ' is-pop';
      if (o.wrong === b.id) cls += ' is-wrong';
      let ringHTML = '';
      if (highlight.indexOf(b.id) !== -1) {
        ringHTML += ring(x, y, '#f59e0b', 'tq-ring tq-ring--gold', 60, 28);
        ringHTML += star(x, y - (def.art.top || def.art.h) - 20, 11, '#fbbf24',
          'class="tq-star" stroke="#d97706" stroke-width="1.4"');
      } else if (focus.indexOf(b.id) !== -1) {
        ringHTML += ring(x, y, '#38bdf8', 'tq-ring tq-ring--focus', 56, 26);
      }
      const art = ART[b.id](def.art);
      items.push({
        row: b.row,
        z: 1,
        html: '<g class="' + cls + '" data-id="' + b.id + '" role="button" aria-label="' +
          esc(def.label) + '">' + ringHTML +
          '<g transform="translate(' + n(x) + ',' + n(y) + ')">' + art + '</g></g>'
      });
    });
    items.sort(function (a, b) {
      if (a.row !== b.row) return a.row - b.row;
      return a.z - b.z;
    });

    let body = '';
    items.forEach(function (it) { body += it.html; });

    if (labels) {
      const bigLabels = variant === 'mini' || !!o.bigLabels;
      buildings.forEach(function (b) {
        const def = D.BY_ID[b.id];
        if (!def) return;
        const ly = def.art.labelY == null ? 11 : def.art.labelY;
        body += labelHTML(c.x(b.col), c.y(b.row) + ly, def.label, def.accent, bigLabels);
      });
    }

    const cls = 'tq-svg tq-svg--' + variant;
    return '<svg class="' + cls + '" viewBox="0 0 ' + n(W) + ' ' + n(H) +
      '" preserveAspectRatio="' + (o.slice ? 'xMidYMid slice' : 'xMidYMid meet') +
      '" xmlns="http://www.w3.org/2000/svg" aria-label="Isometric town">' +
      defs + bg + island + road + pads + body + '</svg>';
  }

  /* ------------------------------------------------------------------
     Public: single-building icon (building tray, menus, prompts)
     ------------------------------------------------------------------ */
  function renderIcon(id) {
    const def = D.BY_ID[id];
    if (!def) return '';
    const a = def.art;
    const top = a.top || a.h;
    const boxW = Math.max(a.w + 58, 116);
    const topPad = 26;
    const bottomPad = 34;
    const H = top + topPad + bottomPad;
    return '<svg class="tq-icon" viewBox="' + n(-boxW / 2) + ' ' + n(-(top + topPad)) + ' ' +
      n(boxW) + ' ' + n(H) + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g transform="translate(0,0)">' + ART[id](a) + '</g></svg>';
  }

  return {
    renderScene: renderScene,
    renderIcon: renderIcon
  };
})();
