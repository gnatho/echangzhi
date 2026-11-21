/* ============================================================
   THE TRAP — Story Challenge
   Story content, dialogue bank and phonics words.
   No DOM access in this file.

   The story, dialogue and phonics words follow the textbook
   story "The Trap" (Superminds : Lucy, Ben, Horax, Zelda, an
   octopus, a shark and the mysterious letter S).
   ============================================================ */

const TRAP_DATA = (function () {
  'use strict';

  /* ------------------------------------------------------------
     Config
     ------------------------------------------------------------ */
  const CONFIG = {
    // Set to true to play/test on any computer or phone.
    // (You can also add ?dev=1 to the page URL.)
    devOverride: false,
    // Synthetic sound effects only. There is no speech of any kind.
    sound: true,
    // Story Sequencer: false = TEXT ONLY cards.
    // The illustrations are still built and kept in the page, they are just
    // hidden (disabled) so nothing overlaps the sentences. Set to true to
    // bring the pictures back.
    sequenceArt: false,
    // Smallest side of the screen (CSS px) that counts as a tablet.
    minTabletShortSide: 600
  };

  /* ------------------------------------------------------------
     Characters
     ------------------------------------------------------------ */
  const CHARACTERS = [
    {
      id: 'lucy', name: 'Lucy', role: 'Girl diver', accent: '#8b5cf6', soft: '#f5f3ff',
      fact: 'Blonde hair and purple diving clothes.'
    },
    {
      id: 'ben', name: 'Ben', role: 'Boy diver', accent: '#3b82f6', soft: '#eff6ff',
      fact: 'Dark hair and blue diving clothes.'
    },
    {
      id: 'horax', name: 'Horax', role: 'Trickster', accent: '#7c3aed', soft: '#f3e8ff',
      fact: 'A purple hat and a big beard.'
    },
    {
      id: 'zelda', name: 'Zelda', role: 'Horax’s companion', accent: '#10b981', soft: '#ecfdf5',
      fact: 'Purple hair and a green coat.'
    }
  ];

  const CHARACTERS_BY_ID = {};
  CHARACTERS.forEach(function (c) { CHARACTERS_BY_ID[c.id] = c; });

  /* ------------------------------------------------------------
     The eight story events, in the correct order
     ------------------------------------------------------------ */
  const ALL_EVENTS = [
    {
      id: 1, scene: 'shell', short: 'The giant shell',
      text: 'Lucy and Ben find a giant shell.',
      hint: 'Ben points at the shell. "What about that giant shell over there?"'
    },
    {
      id: 2, scene: 'empty', short: 'No letter',
      text: 'They look inside the shell, but there is no letter.',
      hint: 'The shell is empty. "Let\u2019s look in a different place."'
    },
    {
      id: 3, scene: 'stuck', short: 'Ben gets stuck',
      text: 'Ben gets stuck in the shell!',
      hint: '"Help, Lucy! I can\u2019t get my arm out. I\u2019m stuck."'
    },
    {
      id: 4, scene: 'villains', short: 'Horax and Zelda',
      text: 'Horax and Zelda appear with a shark.',
      hint: '"Oh, no! It\u2019s Horax and Zelda." "And a shark! I\u2019m scared."'
    },
    {
      id: 5, scene: 'chase', short: 'The shark attacks',
      text: 'The shark turns against Horax.',
      hint: '"I don\u2019t think the shark is very happy with us, Horax."'
    },
    {
      id: 6, scene: 'chase', short: 'Horax needs help',
      text: 'Horax is in trouble! The shark chases him.',
      hint: '"Help! Help!" The shark does not like Horax.'
    },
    {
      id: 7, scene: 'octo', short: 'The octopus helps',
      text: 'The octopus helps Ben escape.',
      hint: '"Thank you, octopus. You\u2019re very helpful."'
    },
    {
      id: 8, scene: 'letterS', short: 'The mysterious letter S',
      text: 'The fish make the letter S!',
      hint: '"It\u2019s the letter S!" "Now we have our fourth letter."'
    }
  ];

  /* Which of the eight events each difficulty uses */
  const LEVELS = [
    {
      id: 'easy', name: 'Easy', count: 4,
      desc: '4 story events · big, clear pictures',
      events: [1, 3, 5, 8]
    },
    {
      id: 'medium', name: 'Medium', count: 6,
      desc: '6 story events · the whole adventure',
      events: [1, 2, 3, 5, 7, 8]
    },
    {
      id: 'challenge', name: 'Challenge', count: 8,
      desc: 'All 8 story events · story master',
      events: [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ];

  /* ------------------------------------------------------------
     Who Said It? — dialogue straight from the story
     tags:  l = longer sentence (Challenge)
            t = tricky: easy to confuse with another character
     ------------------------------------------------------------ */
  const DIALOGUE = [
    { id: 1, who: 'lucy', text: 'I can\u2019t see a letter.', tags: [] },
    { id: 2, who: 'ben', text: 'What about that giant shell over there?', tags: [] },
    { id: 3, who: 'lucy', text: 'Let\u2019s look in a different place.', tags: [] },
    { id: 4, who: 'ben', text: 'Help, Lucy! I can\u2019t get my arm out. I\u2019m stuck.', tags: ['l'] },
    { id: 5, who: 'lucy', text: 'I\u2019m sorry, Ben. I can\u2019t open the shell.', tags: ['t'] },
    { id: 6, who: 'ben', text: 'Oh, no! It\u2019s Horax and Zelda.', tags: [] },
    { id: 7, who: 'lucy', text: 'And a shark! I\u2019m scared.', tags: ['t'] },
    { id: 8, who: 'horax', text: 'Come out, my beauty.', tags: [] },
    { id: 9, who: 'zelda', text: 'I don\u2019t think the shark is very happy with us, Horax.', tags: ['l'] },
    { id: 10, who: 'horax', text: 'What! Not me, you stupid shark. The children. Get the children!', tags: ['l'] },
    { id: 11, who: 'horax', text: 'Help! Help!', tags: [] },
    { id: 12, who: 'ben', text: 'That shark doesn\u2019t like Horax.', tags: ['t'] },
    { id: 13, who: 'lucy', text: 'I don\u2019t think he was happy in Horax\u2019s cage.', tags: ['l'] },
    { id: 14, who: 'ben', text: 'Thank you, octopus. You\u2019re very helpful.', tags: [] },
    { id: 15, who: 'lucy', text: 'Finally. Now we can go and find that letter.', tags: ['t'] },
    { id: 16, who: 'lucy', text: 'Look! Look at the fish.', tags: [] },
    { id: 17, who: 'ben', text: 'It\u2019s the letter S!', tags: [] },
    { id: 18, who: 'lucy', text: 'Now we have our fourth letter.', tags: [] }
  ];

  /*
   * Rounds are about 10 questions. Line counts are uneven
   * (Zelda only speaks once), so the pools are shaped like this:
   *   easy      - short, clear lines only, 3 characters   (12 lines)
   *   medium    - every line from the story, 4 characters (18 lines)
   *   challenge - long lines + lines that could be
   *               confused with another character         (13 lines)
   */
  const SAID_LEVELS = [
    {
      id: 'easy', name: 'Easy', desc: '3 characters · short, clear lines', round: 10,
      characters: ['lucy', 'ben', 'horax'],
      filter: function (q) { return q.tags.indexOf('l') === -1 && q.tags.indexOf('t') === -1; }
    },
    {
      id: 'medium', name: 'Medium', desc: '4 characters · full story dialogue', round: 10,
      characters: ['lucy', 'ben', 'horax', 'zelda'],
      filter: function () { return true; }
    },
    {
      id: 'challenge', name: 'Challenge', desc: '4 characters · long, tricky lines', round: 10,
      characters: ['lucy', 'ben', 'horax', 'zelda'],
      filter: function (q) { return q.tags.length > 0; }
    }
  ];

  /* ------------------------------------------------------------
     S or SH? — words from the story and its phonics page
     ------------------------------------------------------------ */
  const PHONICS_WORDS = [
    { id: 'see', word: 'See', sound: 's', split: 1, emoji: '👀' },
    { id: 'stuck', word: 'Stuck', sound: 's', split: 2, emoji: '🪨' },
    { id: 'sorry', word: 'Sorry', sound: 's', split: 1, emoji: '😢' },
    { id: 'super', word: 'Super', sound: 's', split: 1, emoji: '⭐' },
    { id: 'scared', word: 'Scared', sound: 's', split: 2, emoji: '😨' },
    { id: 'stupid', word: 'Stupid', sound: 's', split: 2, emoji: '🤪' },
    { id: 'swimming', word: 'Swimming', sound: 's', split: 2, emoji: '🏊' },
    { id: 'shell', word: 'Shell', sound: 'sh', split: 3, emoji: '🐚' },
    { id: 'shark', word: 'Shark', sound: 'sh', split: 2, emoji: '🦈' },
    { id: 'fish', word: 'Fish', sound: 'sh', split: 2, emoji: '🐠' }
  ];

  const SOUNDS = {
    s: { id: 's', label: 'S', ipa: '/s/', word: 'Ssss…', hint: 'A snake sound: Ssss…', accent: '#2563eb', soft: '#dbeafe' },
    sh: { id: 'sh', label: 'SH', ipa: '/ʃ/', word: 'Shhh…', hint: 'Be quiet: Shhh…', accent: '#db2777', soft: '#fce7f3' }
  };

  const PHONICS_LEVELS = [
    {
      id: 'easy', name: 'Easy', desc: '6 words · 2 big sorting areas', words: 6,
      list: ['see', 'shell', 'fish', 'stuck', 'shark', 'sorry']
    },
    {
      id: 'medium', name: 'Medium', desc: '8 words · all the story sounds', words: 8,
      list: ['see', 'stuck', 'sorry', 'super', 'scared', 'shell', 'shark', 'fish']
    },
    {
      id: 'challenge', name: 'Challenge', desc: 'All 10 words · tricky endings', words: 10,
      list: null
    }
  ];

  /* ------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------ */
  function byId(list, id) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  return {
    CONFIG: CONFIG,
    CHARACTERS: CHARACTERS,
    CHARACTERS_BY_ID: CHARACTERS_BY_ID,
    character: function (id) { return CHARACTERS_BY_ID[id] || null; },
    ALL_EVENTS: ALL_EVENTS,
    event: function (id) { return byId(ALL_EVENTS, id); },
    LEVELS: LEVELS,
    level: function (id) { return byId(LEVELS, id); },
    DIALOGUE: DIALOGUE,
    SAID_LEVELS: SAID_LEVELS,
    saidLevel: function (id) { return byId(SAID_LEVELS, id); },
    PHONICS_WORDS: PHONICS_WORDS,
    PHONICS_LEVELS: PHONICS_LEVELS,
    phonicsLevel: function (id) { return byId(PHONICS_LEVELS, id); },
    word: function (id) { return byId(PHONICS_WORDS, id); },
    SOUNDS: SOUNDS
  };
})();
