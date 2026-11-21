/* ============================================================
   TOWN QUEST — Where Is Everything?
   Shared content + spatial logic. No DOM access in this file.

   Grid convention (used by every activity):
     col grows left -> right  (same row = NEXT TO)
     row grows back -> front  (same col = BEHIND / IN FRONT OF)
     BETWEEN = the single cell exactly in the middle of two
               buildings on the same row or the same column.
   ============================================================ */

const TQ_DATA = (function () {
  'use strict';

  /* ------------------------------------------------------------
     Config
     ------------------------------------------------------------ */
  const CONFIG = {
    // Set to true to play/test on any computer or phone.
    // (You can also add ?dev=1 to the page URL.)
    devOverride: false,
    // Text-to-speech is off. Set to true to show the Listen buttons again.
    tts: false,
    // Smallest side of the screen (CSS px) that counts as a tablet.
    minTabletShortSide: 600
  };

  const REL = {
    NEXT_TO: 'next-to',
    BEHIND: 'behind',
    IN_FRONT: 'in-front',
    BETWEEN: 'between'
  };

  const REL_WORD = {
    'next-to': 'next to',
    'behind': 'behind',
    'in-front': 'in front of',
    'between': 'between'
  };

  /* ------------------------------------------------------------
     The ten places from the lesson
     ------------------------------------------------------------ */
  const BUILDINGS = [
    {
      id: 'train-station', name: 'train station', label: 'Train station',
      emoji: '🚉', accent: '#3b82f6',
      art: { w: 58, d: 34, h: 42, top: 80, labelY: -46, base: '#f7e3c1', roof: '#e05d4f', trim: '#3b82f6' }
    },
    {
      id: 'hospital', name: 'hospital', label: 'Hospital',
      emoji: '🏥', accent: '#ef4444',
      art: { w: 78, d: 44, h: 84, top: 98, labelY: -66, base: '#f7fbff', roof: '#dbe8f7', trim: '#ef4444' }
    },
    {
      id: 'movie-theater', name: 'movie theater', label: 'Movie theater',
      emoji: '🎬', accent: '#8b5cf6',
      art: { w: 88, d: 46, h: 66, top: 104, labelY: -52, base: '#7c5cc4', roof: '#5b3fa0', trim: '#fbbf24' }
    },
    {
      id: 'playground', name: 'playground', label: 'Playground',
      emoji: '🎠', accent: '#f59e0b',
      art: { w: 100, d: 46, h: 46, top: 50, labelY: 10, base: '#f6d9a0', roof: '#f59e0b', trim: '#ef4444' }
    },
    {
      id: 'cafe', name: 'café', label: 'Café',
      emoji: '☕', accent: '#d97706',
      art: { w: 64, d: 36, h: 44, top: 64, labelY: -40, base: '#fdf0d5', roof: '#d97746', trim: '#b45309' }
    },
    {
      id: 'store', name: 'store', label: 'Store',
      emoji: '🏪', accent: '#10b981',
      art: { w: 78, d: 42, h: 52, top: 88, labelY: -48, base: '#e8fbf3', roof: '#a7f3d0', trim: '#10b981' }
    },
    {
      id: 'bus-stop', name: 'bus stop', label: 'Bus stop',
      emoji: '🚏', accent: '#0ea5e9',
      art: { w: 72, d: 36, h: 54, top: 62, labelY: -46, base: '#e0f2fe', roof: '#0ea5e9', trim: '#0369a1' }
    },
    {
      id: 'park', name: 'park', label: 'Park',
      emoji: '🌳', accent: '#22c55e',
      art: { w: 102, d: 48, h: 60, top: 66, labelY: 10, base: '#8bdb6e', roof: '#22c55e', trim: '#15803d' }
    },
    {
      id: 'school', name: 'school', label: 'School',
      emoji: '🏫', accent: '#f97316',
      art: { w: 100, d: 48, h: 56, top: 112, labelY: -42, base: '#f5d0b5', roof: '#c2410c', trim: '#fff1e6' }
    },
    {
      id: 'swimming-pool', name: 'swimming pool', label: 'Swimming pool',
      emoji: '🏊', accent: '#06b6d4',
      art: { w: 102, d: 48, h: 28, top: 44, labelY: 10, base: '#e6fffb', roof: '#06b6d4', trim: '#0e7490' }
    }
  ];

  const BY_ID = {};
  BUILDINGS.forEach(function (b) { BY_ID[b.id] = b; });

  /* ------------------------------------------------------------
     The fixed town used by Explore the Town and Make a Sentence
     ------------------------------------------------------------ */
  const MAIN_TOWN = {
    cols: 6,
    rows: 4,
    buildings: [
      { id: 'school', col: 1, row: 0 },
      { id: 'park', col: 2, row: 0 },
      { id: 'train-station', col: 3, row: 0 },
      { id: 'store', col: 4, row: 0 },

      { id: 'hospital', col: 1, row: 1 },
      { id: 'cafe', col: 2, row: 1 },
      { id: 'movie-theater', col: 3, row: 1 },
      { id: 'swimming-pool', col: 4, row: 1 },

      { id: 'playground', col: 1, row: 2 },
      { id: 'bus-stop', col: 2, row: 2 }
    ]
  };

  function positionsOf(layout) {
    const map = {};
    (layout.buildings || layout).forEach(function (b) {
      map[b.id] = { col: b.col, row: b.row };
    });
    return map;
  }

  const MAIN_POS = positionsOf(MAIN_TOWN);

  /* ------------------------------------------------------------
     Spatial logic
     ------------------------------------------------------------ */
  function isBetweenFact(fact, p) {
    const a = p[fact.a], b = p[fact.b], c = p[fact.c];
    if (!a || !b || !c) return false;
    if (a.row === b.row && b.row === c.row) {
      return Math.abs(b.col - c.col) === 2 && a.col === (b.col + c.col) / 2;
    }
    if (a.col === b.col && b.col === c.col) {
      return Math.abs(b.row - c.row) === 2 && a.row === (b.row + c.row) / 2;
    }
    return false;
  }

  function factIsTrue(fact, positions) {
    const p = positions || MAIN_POS;
    if (!fact) return false;
    const a = p[fact.a], b = p[fact.b];
    if (!a || !b) return false;
    if (fact.type === REL.NEXT_TO) {
      return a.row === b.row && Math.abs(a.col - b.col) === 1;
    }
    if (fact.type === REL.BEHIND) {
      return a.col === b.col && a.row === b.row - 1;
    }
    if (fact.type === REL.IN_FRONT) {
      return a.col === b.col && a.row === b.row + 1;
    }
    if (fact.type === REL.BETWEEN) {
      return isBetweenFact(fact, p);
    }
    return false;
  }

  function factSentence(fact, options) {
    const opts = options || {};
    const a = BY_ID[fact.a] ? BY_ID[fact.a].name : fact.a;
    const b = BY_ID[fact.b] ? BY_ID[fact.b].name : fact.b;
    const c = fact.c && BY_ID[fact.c] ? BY_ID[fact.c].name : fact.c;
    const subject = opts.alt ? "It's" : 'The ' + a + ' is';

    if (fact.type === REL.NEXT_TO) return subject + ' next to the ' + b + '.';
    if (fact.type === REL.BEHIND) return subject + ' behind the ' + b + '.';
    if (fact.type === REL.IN_FRONT) return subject + ' in front of the ' + b + '.';
    if (fact.type === REL.BETWEEN) {
      return subject + ' between the ' + b + ' and the ' + c + '.';
    }
    return '';
  }

  function whereQuestion(fact) {
    return 'Where is the ' + BY_ID[fact.a].name + '?';
  }

  /* Candidate cells for a "put X next to / behind / in front of / between"
     instruction. Returns every empty cell that would satisfy the relation. */
  function candidateCells(rel, positions, cols, rows) {
    const p = positions || MAIN_POS;
    const out = [];
    function push(col, row) {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return;
      out.push({ col: col, row: row });
    }

    if (rel.type === REL.NEXT_TO) {
      const ref = p[rel.ref];
      if (!ref) return out;
      push(ref.col - 1, ref.row);
      push(ref.col + 1, ref.row);
    } else if (rel.type === REL.BEHIND) {
      const ref = p[rel.ref];
      if (ref) push(ref.col, ref.row - 1);
    } else if (rel.type === REL.IN_FRONT) {
      const ref = p[rel.ref];
      if (ref) push(ref.col, ref.row + 1);
    } else if (rel.type === REL.BETWEEN) {
      const b = p[rel.refs[0]], c = p[rel.refs[1]];
      if (!b || !c) return out;
      if (b.row === c.row && Math.abs(b.col - c.col) === 2) {
        push((b.col + c.col) / 2, b.row);
      } else if (b.col === c.col && Math.abs(b.row - c.row) === 2) {
        push(b.col, (b.row + c.row) / 2);
      }
    }
    return out;
  }

  /* ------------------------------------------------------------
     Explore the Town — Find the Place
     ------------------------------------------------------------ */
  const FIND_IDS = BUILDINGS.map(function (b) { return b.id; });

  /* ------------------------------------------------------------
     Explore the Town — Look and Describe
     Every "wrong" sentence below is checked against MAIN_TOWN
     at start-up, so there can only ever be one true option.
     ------------------------------------------------------------ */
  const DESCRIBE = [
    {
      type: 'pick',
      fact: { type: 'next-to', a: 'hospital', b: 'cafe' },
      wrong: [
        { type: 'behind', a: 'hospital', b: 'cafe' },
        { type: 'in-front', a: 'hospital', b: 'cafe' },
        { type: 'between', a: 'hospital', b: 'park', c: 'store' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'in-front', a: 'playground', b: 'hospital' },
      wrong: [
        { type: 'behind', a: 'playground', b: 'hospital' },
        { type: 'next-to', a: 'playground', b: 'school' },
        { type: 'between', a: 'playground', b: 'cafe', c: 'bus-stop' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'between', a: 'train-station', b: 'park', c: 'store' },
      wrong: [
        { type: 'in-front', a: 'train-station', b: 'movie-theater' },
        { type: 'behind', a: 'train-station', b: 'school' },
        { type: 'next-to', a: 'train-station', b: 'cafe' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'next-to', a: 'swimming-pool', b: 'movie-theater' },
      wrong: [
        { type: 'behind', a: 'swimming-pool', b: 'movie-theater' },
        { type: 'in-front', a: 'swimming-pool', b: 'movie-theater' },
        { type: 'behind', a: 'swimming-pool', b: 'store' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'next-to', a: 'park', b: 'school' },
      wrong: [
        { type: 'behind', a: 'park', b: 'school' },
        { type: 'in-front', a: 'park', b: 'school' },
        { type: 'between', a: 'park', b: 'cafe', c: 'bus-stop' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'in-front', a: 'bus-stop', b: 'cafe' },
      wrong: [
        { type: 'behind', a: 'bus-stop', b: 'cafe' },
        { type: 'next-to', a: 'bus-stop', b: 'cafe' },
        { type: 'between', a: 'bus-stop', b: 'hospital', c: 'cafe' }
      ]
    },
    {
      type: 'pick',
      fact: { type: 'between', a: 'cafe', b: 'park', c: 'bus-stop' },
      wrong: [
        { type: 'next-to', a: 'cafe', b: 'park' },
        { type: 'behind', a: 'cafe', b: 'store' },
        { type: 'in-front', a: 'cafe', b: 'bus-stop' }
      ]
    },
    {
      type: 'pair',
      fact: { type: 'next-to', a: 'hospital', b: 'cafe' }
    },
    {
      type: 'pair',
      fact: { type: 'behind', a: 'store', b: 'swimming-pool' }
    },
    {
      type: 'pair',
      fact: { type: 'in-front', a: 'playground', b: 'hospital' }
    }
  ];

  /* ------------------------------------------------------------
     Build the Town — three levels
     Every mission is checked at start-up: there must be exactly
     ONE empty cell that satisfies the instruction.
     ------------------------------------------------------------ */
  const BUILD_LEVELS = [
    {
      id: 'level-1',
      name: 'Level 1',
      subtitle: 'One instruction at a time',
      cols: 5,
      rows: 3,
      preplaced: [
        { id: 'school', col: 1, row: 1 },
        { id: 'store', col: 2, row: 1 }
      ],
      missions: [
        { building: 'hospital', rel: { type: 'next-to', ref: 'school' } },
        { building: 'cafe', rel: { type: 'next-to', ref: 'store' } },
        { building: 'playground', rel: { type: 'behind', ref: 'school' } }
      ]
    },
    {
      id: 'level-2',
      name: 'Level 2',
      subtitle: 'Look around the town',
      cols: 5,
      rows: 3,
      preplaced: [
        { id: 'train-station', col: 0, row: 1 },
        { id: 'school', col: 2, row: 1 },
        { id: 'hospital', col: 4, row: 1 },
        { id: 'cafe', col: 3, row: 2 }
      ],
      missions: [
        { building: 'swimming-pool', rel: { type: 'between', refs: ['train-station', 'school'] } },
        { building: 'bus-stop', rel: { type: 'in-front', ref: 'hospital' } },
        { building: 'park', rel: { type: 'behind', ref: 'cafe' } }
      ]
    },
    {
      id: 'level-3',
      name: 'Level 3',
      subtitle: 'Read, think, and build',
      cols: 5,
      rows: 3,
      preplaced: [
        { id: 'school', col: 2, row: 1 },
        { id: 'store', col: 3, row: 1 },
        { id: 'movie-theater', col: 4, row: 1 },
        { id: 'cafe', col: 0, row: 2 },
        { id: 'train-station', col: 2, row: 2 }
      ],
      missions: [
        { building: 'hospital', rel: { type: 'next-to', ref: 'school' }, prefix: 'First, ' },
        { building: 'playground', rel: { type: 'behind', ref: 'school' }, prefix: 'Now ' },
        { building: 'swimming-pool', rel: { type: 'between', refs: ['cafe', 'train-station'] } },
        { building: 'bus-stop', rel: { type: 'in-front', ref: 'movie-theater' } }
      ]
    }
  ];

  function buildInstruction(mission) {
    const b = BY_ID[mission.building].name;
    const rel = mission.rel;
    let core;
    if (rel.type === REL.NEXT_TO) {
      core = 'Put the ' + b + ' next to the ' + BY_ID[rel.ref].name + '.';
    } else if (rel.type === REL.BEHIND) {
      core = 'Put the ' + b + ' behind the ' + BY_ID[rel.ref].name + '.';
    } else if (rel.type === REL.IN_FRONT) {
      core = 'Put the ' + b + ' in front of the ' + BY_ID[rel.ref].name + '.';
    } else {
      core = 'Put the ' + b + ' between the ' + BY_ID[rel.refs[0]].name +
        ' and the ' + BY_ID[rel.refs[1]].name + '.';
    }
    if (!mission.prefix) return core;
    return mission.prefix + core.charAt(0).toLowerCase() + core.slice(1);
  }

  /* ------------------------------------------------------------
     Which Picture?
     Easy / Medium use a single clause; Challenge adds "between"
     and two-clause sentences with hand-built distractor layouts.
     ------------------------------------------------------------ */
  const PICTURE_QUESTIONS = [
    // Easy
    { level: 'easy', clauses: [{ type: 'next-to', a: 'hospital', b: 'school' }] },
    { level: 'easy', clauses: [{ type: 'behind', a: 'playground', b: 'school' }] },
    { level: 'easy', clauses: [{ type: 'in-front', a: 'swimming-pool', b: 'cafe' }] },
    { level: 'easy', clauses: [{ type: 'next-to', a: 'bus-stop', b: 'movie-theater' }] },
    { level: 'easy', clauses: [{ type: 'behind', a: 'park', b: 'school' }] },
    { level: 'easy', clauses: [{ type: 'in-front', a: 'hospital', b: 'store' }] },

    // Medium
    { level: 'medium', clauses: [{ type: 'next-to', a: 'cafe', b: 'school' }] },
    { level: 'medium', clauses: [{ type: 'behind', a: 'hospital', b: 'store' }] },
    { level: 'medium', clauses: [{ type: 'in-front', a: 'train-station', b: 'cafe' }] },
    { level: 'medium', clauses: [{ type: 'between', a: 'cafe', b: 'school', c: 'movie-theater' }] },
    { level: 'medium', clauses: [{ type: 'between', a: 'swimming-pool', b: 'store', c: 'park' }] },
    { level: 'medium', clauses: [{ type: 'behind', a: 'playground', b: 'hospital' }] },

    // Challenge
    { level: 'challenge', clauses: [{ type: 'between', a: 'train-station', b: 'school', c: 'swimming-pool' }] },
    { level: 'challenge', clauses: [{ type: 'between', a: 'hospital', b: 'park', c: 'store' }] },
    {
      level: 'challenge',
      clauses: [
        { type: 'next-to', a: 'hospital', b: 'school' },
        { type: 'behind', a: 'park', b: 'school' }
      ],
      layouts: [
        [
          { id: 'school', col: 1, row: 1 },
          { id: 'hospital', col: 2, row: 1 },
          { id: 'park', col: 1, row: 0 }
        ],
        [
          { id: 'school', col: 1, row: 1 },
          { id: 'hospital', col: 1, row: 0 },
          { id: 'park', col: 2, row: 1 }
        ],
        [
          { id: 'school', col: 1, row: 1 },
          { id: 'hospital', col: 1, row: 2 },
          { id: 'park', col: 2, row: 1 }
        ]
      ]
    },
    {
      level: 'challenge',
      clauses: [
        { type: 'between', a: 'cafe', b: 'school', c: 'store' },
        { type: 'behind', a: 'park', b: 'cafe' }
      ],
      layouts: [
        [
          { id: 'school', col: 0, row: 1 },
          { id: 'store', col: 2, row: 1 },
          { id: 'cafe', col: 1, row: 1 },
          { id: 'park', col: 1, row: 0 }
        ],
        [
          { id: 'school', col: 0, row: 1 },
          { id: 'store', col: 2, row: 1 },
          { id: 'cafe', col: 1, row: 2 },
          { id: 'park', col: 1, row: 1 }
        ],
        [
          { id: 'school', col: 0, row: 1 },
          { id: 'store', col: 2, row: 1 },
          { id: 'cafe', col: 1, row: 1 },
          { id: 'park', col: 2, row: 0 }
        ]
      ]
    },
    { level: 'challenge', clauses: [{ type: 'between', a: 'bus-stop', b: 'school', c: 'park' }] },
    {
      level: 'challenge',
      clauses: [
        { type: 'in-front', a: 'swimming-pool', b: 'cafe' },
        { type: 'next-to', a: 'bus-stop', b: 'cafe' }
      ],
      layouts: [
        [
          { id: 'cafe', col: 1, row: 1 },
          { id: 'swimming-pool', col: 1, row: 2 },
          { id: 'bus-stop', col: 2, row: 1 }
        ],
        [
          { id: 'cafe', col: 1, row: 1 },
          { id: 'swimming-pool', col: 2, row: 1 },
          { id: 'bus-stop', col: 1, row: 0 }
        ],
        [
          { id: 'cafe', col: 1, row: 1 },
          { id: 'swimming-pool', col: 1, row: 0 },
          { id: 'bus-stop', col: 1, row: 2 }
        ]
      ]
    }
  ];

  function pictureSentence(clauses) {
    if (clauses.length === 1) return factSentence(clauses[0]);
    return factSentence(clauses[0]).replace(/\.$/, '') + ', and ' +
      factSentence(clauses[1]).replace(/^The /, 'the ');
  }

  /* Build three arrangements for a single-clause question.
     The reference building always stays in the same place so the
     only thing that changes is where the target building is. */
  function pictureLayouts(clause) {
    const layouts = [];
    if (clause.type === REL.NEXT_TO) {
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 2, row: 1 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 0 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 2 }
      ]);
    } else if (clause.type === REL.BEHIND) {
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 0 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 2, row: 1 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 2 }
      ]);
    } else if (clause.type === REL.IN_FRONT) {
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 2 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 2, row: 1 }
      ]);
      layouts.push([
        { id: clause.b, col: 1, row: 1 },
        { id: clause.a, col: 1, row: 0 }
      ]);
    } else {
      layouts.push([
        { id: clause.b, col: 0, row: 1 },
        { id: clause.c, col: 2, row: 1 },
        { id: clause.a, col: 1, row: 1 }
      ]);
      layouts.push([
        { id: clause.b, col: 0, row: 1 },
        { id: clause.c, col: 2, row: 1 },
        { id: clause.a, col: 2, row: 0 }
      ]);
      layouts.push([
        { id: clause.b, col: 0, row: 1 },
        { id: clause.c, col: 2, row: 1 },
        { id: clause.a, col: 0, row: 2 }
      ]);
    }
    return layouts;
  }

  /* ------------------------------------------------------------
     Make a Sentence
     ------------------------------------------------------------ */
  const SENTENCE_QUESTIONS = [
    // Easy — short, no extra tiles
    { level: 'easy', fact: { type: 'next-to', a: 'hospital', b: 'cafe' }, extras: [] },
    { level: 'easy', fact: { type: 'behind', a: 'park', b: 'cafe' }, extras: [] },
    { level: 'easy', fact: { type: 'in-front', a: 'playground', b: 'hospital' }, extras: [] },
    { level: 'easy', fact: { type: 'next-to', a: 'bus-stop', b: 'playground' }, extras: [] },
    { level: 'easy', fact: { type: 'behind', a: 'train-station', b: 'movie-theater' }, extras: [] },
    { level: 'easy', fact: { type: 'next-to', a: 'store', b: 'train-station' }, extras: [] },

    // Medium — all four structures, a few distractor tiles
    { level: 'medium', fact: { type: 'in-front', a: 'swimming-pool', b: 'store' }, extras: ['behind', 'next'] },
    { level: 'medium', fact: { type: 'in-front', a: 'movie-theater', b: 'train-station' }, extras: ['between', 'next'] },
    { level: 'medium', fact: { type: 'behind', a: 'cafe', b: 'bus-stop' }, extras: ['next', 'between'] },
    { level: 'medium', fact: { type: 'next-to', a: 'hospital', b: 'cafe' }, alt: true, extras: ['behind', 'between'] },
    { level: 'medium', fact: { type: 'behind', a: 'hospital', b: 'playground' }, extras: ['next', 'in'] },
    { level: 'medium', fact: { type: 'behind', a: 'school', b: 'hospital' }, extras: ['between', 'next'] },

    // Challenge — between + longer sentences + more distractors
    { level: 'challenge', fact: { type: 'between', a: 'movie-theater', b: 'cafe', c: 'swimming-pool' }, extras: ['behind', 'next', 'to'] },
    { level: 'challenge', fact: { type: 'between', a: 'hospital', b: 'school', c: 'playground' }, extras: ['next', 'behind', 'to'] },
    { level: 'challenge', fact: { type: 'between', a: 'cafe', b: 'park', c: 'bus-stop' }, extras: ['behind', 'front', 'of'] },
    { level: 'challenge', fact: { type: 'between', a: 'park', b: 'school', c: 'train-station' }, extras: ['next', 'to', 'behind'] },
    { level: 'challenge', fact: { type: 'between', a: 'train-station', b: 'park', c: 'store' }, extras: ['in', 'front', 'next'] }
  ];

  function sentenceWords(fact, alt) {
    return factSentence(fact, { alt: alt }).split(' ');
  }

  function sceneForFact(fact) {
    if (fact.type === REL.BETWEEN) {
      return [
        { id: fact.b, col: 0, row: 1 },
        { id: fact.c, col: 2, row: 1 },
        { id: fact.a, col: 1, row: 1 }
      ];
    }
    if (fact.type === REL.BEHIND) {
      return [
        { id: fact.b, col: 0, row: 1 },
        { id: fact.a, col: 0, row: 0 }
      ];
    }
    if (fact.type === REL.IN_FRONT) {
      return [
        { id: fact.b, col: 0, row: 0 },
        { id: fact.a, col: 0, row: 1 }
      ];
    }
    return [
      { id: fact.b, col: 0, row: 1 },
      { id: fact.a, col: 1, row: 1 }
    ];
  }

  /* ------------------------------------------------------------
     Start-up validation (used by the game and by tests)
     ------------------------------------------------------------ */
  function validateContent() {
    const issues = [];

    // Town
    const seen = {};
    MAIN_TOWN.buildings.forEach(function (b) {
      if (!BY_ID[b.id]) issues.push('Unknown building in town: ' + b.id);
      if (seen[b.col + ',' + b.row]) issues.push('Two buildings share cell ' + b.col + ',' + b.row);
      seen[b.col + ',' + b.row] = true;
      if (b.col < 0 || b.row < 0 || b.col >= MAIN_TOWN.cols || b.row >= MAIN_TOWN.rows) {
        issues.push('Building outside town: ' + b.id);
      }
    });

    // Describe questions
    DESCRIBE.forEach(function (q, i) {
      if (!factIsTrue(q.fact, MAIN_POS)) {
        issues.push('Describe #' + (i + 1) + ' correct sentence is false: ' + factSentence(q.fact));
      }
      (q.wrong || []).forEach(function (f) {
        if (factIsTrue(f, MAIN_POS)) {
          issues.push('Describe #' + (i + 1) + ' wrong sentence is actually true: ' + factSentence(f));
        }
      });
      if (q.type === 'pair' && q.fact.type === REL.BETWEEN) {
        issues.push('Describe #' + (i + 1) + ' pair question cannot use between');
      }
    });

    // Build levels
    BUILD_LEVELS.forEach(function (level) {
      const occupied = {};
      level.preplaced.forEach(function (b) {
        if (occupied[b.col + ',' + b.row]) {
          issues.push(level.id + ': pre-placed buildings overlap at ' + b.col + ',' + b.row);
        }
        occupied[b.col + ',' + b.row] = b.id;
      });
      level.missions.forEach(function (mission, mi) {
        const pos = {};
        Object.keys(occupied).forEach(function (key) {
          const parts = key.split(',');
          pos[occupied[key]] = { col: Number(parts[0]), row: Number(parts[1]) };
        });
        const all = candidateCells(mission.rel, pos, level.cols, level.rows)
          .filter(function (c) { return !occupied[c.col + ',' + c.row]; });
        if (all.length !== 1) {
          issues.push(level.id + ' mission ' + (mi + 1) + ': ' + all.length +
            ' possible cells for "' + buildInstruction(mission) + '"');
        } else {
          occupied[all[0].col + ',' + all[0].row] = mission.building;
        }
      });
    });

    // Picture questions
    PICTURE_QUESTIONS.forEach(function (q, i) {
      const label = 'Picture #' + (i + 1) + ' (' + q.level + ')';
      if (q.layouts) {
        let okCount = 0;
        q.layouts.forEach(function (layout) {
          const pos = positionsOf(layout);
          if (layout.length !== new Set(layout.map(function (b) { return b.col + ',' + b.row; })).size) {
            issues.push(label + ': two buildings share a cell');
          }
          const allTrue = q.clauses.every(function (clause) { return factIsTrue(clause, pos); });
          if (allTrue) okCount++;
        });
        if (okCount !== 1) {
          issues.push(label + ': ' + okCount + ' correct layouts (expected 1)');
        }
      } else {
        if (q.clauses.length !== 1) {
          issues.push(label + ': multi-clause question needs explicit layouts');
          return;
        }
        const layouts = pictureLayouts(q.clauses[0]);
        let okCount = 0;
        layouts.forEach(function (layout) {
          const pos = positionsOf(layout);
          if (factIsTrue(q.clauses[0], pos)) okCount++;
        });
        if (okCount !== 1) {
          issues.push(label + ': ' + okCount + ' correct generated layouts (expected 1)');
        }
      }
    });

    // Sentence questions
    SENTENCE_QUESTIONS.forEach(function (q, i) {
      if (!factIsTrue(q.fact, MAIN_POS)) {
        issues.push('Sentence #' + (i + 1) + ' fact is false in the town: ' + factSentence(q.fact));
      }
      const words = sentenceWords(q.fact, q.alt);
      (q.extras || []).forEach(function (w) {
        if (words.indexOf(w) !== -1) {
          issues.push('Sentence #' + (i + 1) + ': extra tile "' + w + '" is already in the sentence');
        }
      });
    });

    return issues;
  }

  return {
    CONFIG: CONFIG,
    REL: REL,
    REL_WORD: REL_WORD,
    BUILDINGS: BUILDINGS,
    BY_ID: BY_ID,
    MAIN_TOWN: MAIN_TOWN,
    MAIN_POS: MAIN_POS,
    FIND_IDS: FIND_IDS,
    DESCRIBE: DESCRIBE,
    BUILD_LEVELS: BUILD_LEVELS,
    PICTURE_QUESTIONS: PICTURE_QUESTIONS,
    SENTENCE_QUESTIONS: SENTENCE_QUESTIONS,
    positionsOf: positionsOf,
    factIsTrue: factIsTrue,
    factSentence: factSentence,
    whereQuestion: whereQuestion,
    candidateCells: candidateCells,
    buildInstruction: buildInstruction,
    pictureSentence: pictureSentence,
    pictureLayouts: pictureLayouts,
    sentenceWords: sentenceWords,
    sceneForFact: sceneForFact,
    validateContent: validateContent
  };
})();


