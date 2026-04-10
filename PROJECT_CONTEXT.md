# Project Context Summary

## Project Identity

- **Name**: Phonics Game / Word Grid Game
- **Core Purpose**: Educational HTML5 web application for teaching phonics, vocabulary, spelling, and grammar to children
- **Tech Stack**: Plain HTML5, CSS3, Vanilla JavaScript (no frameworks, no build system)

---

## Architecture Map

```
PHONICS GAME/
├── index.html              # Main Word Grid Game entry point
├── script.js               # Main game logic (1420 lines)
├── data.js                 # Word data, phoneme sets, grammar units
├── styles.css              # All styling (1101 lines)
├── keys.html               # Keyboard helper page
├── words_data.json         # Word vocabulary data
├── amity.db               # SQLite database (likely for progress tracking)
├── games/                  # Additional mini-games
│   ├── index.html          # Game chooser/launcher
│   ├── chooser/            # Grammar word-choosing game (2-player)
│   ├── memory/             # Memory matching game
│   ├── shooter/            # Target shooting game
│   ├── snakes/             # Snakes & Ladders board game
│   └── bomberman/          # Bomberman-style game (WIP)
└── static/
    ├── audio/              # MP3 audio files for words
    └── imgs/               # Image assets (words/)
```

### Key Files
| File | Purpose |
|------|---------|
| `script.js:1-82` | Audio synthesizer (Web Audio API) |
| `script.js:85-117` | Word formatting, grid layout calculation |
| `script.js:230-325` | Word grid generation and cell click handling |
| `script.js:329-508` | Spin wheel feature |
| `script.js:510-908` | Grammar activities (reorder, fill-in-blank) |
| `script.js:910-1420` | Spelling activity with keyboard |
| `data.js:2-110` | Phoneme sets (short vowels, long vowels, digraphs, blends, etc.) |
| `data.js:112-197` | Level-based vocabulary units (levels 0-6) |
| `data.js:202-386` | Grammar units with sentence reorder/fill activities |

---

## Coding Standards

### Pattern Preferences
- **Vanilla JS only** - No frameworks, no build tools
- **ES6+ features** - Classes in bomberman game use `import`/`export`
- **DOM-first** - Direct DOM manipulation via `document.getElementById`, `createElement`
- **Event-driven** - Click handlers, addEventListener patterns
- **CSS Grid/Flexbox** - Responsive layouts, no external CSS frameworks

### Error Handling Style
- Minimal error handling - graceful degradation for missing audio/images
- `try/catch` rarely used; failures handled via `.catch()` on Promises
- Audio fallback: `speechSynthesis` TTS if audio file missing

### Styling Conventions
- Force light mode (dark mode override in CSS)
- Mobile-first responsive design
- Touch-friendly (large tap targets, `touch-action: manipulation`)
- Portrait lock via CSS transform for landscape-only games
- CSS custom properties NOT used - hardcoded colors throughout

### Audio System
- Web Audio API for synthesized sounds (tones, arpeggios)
- HTML5 Audio for word pronunciation MP3s
- Speech Synthesis fallback for spelling words

---

## Current Status

### Fully Functional
- ✅ **Main Word Grid Game** - Core phonics game with modes: Phonics, Levels, Grammar
- ✅ **Spin Wheel** - Reward/spin mechanic with animations
- ✅ **Grammar Activities**:
  - Sentence reordering (drag words to form sentences)
  - Fill-in-the-blank (multiple choice)
  - Spelling activity with picture hints and audio
- ✅ **Audio System** - Synthesized effects + word pronunciation
- ✅ **Responsive UI** - Works on tablets/mobile
- ✅ **Game Chooser** - Launcher for mini-games

### Work-In-Progress
- 🔄 **Bomberman game** - ES6 module structure started (`map.js` visible in editor)
- 🔄 **Additional mini-games** - Memory, shooter, snakes mostly complete

---

## Entry Points

### Run the Main App
```
# Open directly in browser (no server needed)
index.html
```

### Run Game Chooser
```
games/index.html
```

### Testing/Development
- No build commands required
- No npm install or test runners
- Simply open HTML files in modern browser (Chrome, Firefox, Edge)
- For ES6 module games (bomberman), may need local server:
  ```bash
  python -m http.server 8000
  # or
  npx serve
  ```

### Key Features to Test
1. Select phonics mode → choose vowel/digraph/blend set → tap words for scores
2. Spin wheel → random reward (+1 to +3, 0, -1)
3. Grammar mode → sentence reorder OR fill-in-blank OR spelling
4. Spelling with picture toggle and audio playback

---

## Notes for Future Sessions

- Active development appears to be on the bomberman game (ES6 modules)
- Main game is stable but could benefit from refactoring (1400+ line script.js)
- Audio files stored as `static/audio/{word}.mp3`
- Word images expected at `static/imgs/words/{word}.jpg`
