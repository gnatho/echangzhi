# Speak & Disappear — speech models

The game is English-only. Choose a book and unit on the start screen; the words for that unit are loaded and used as the recognition grammar.

| Mode | Model | Size | Use |
| --- | --- | --- | --- |
| Fast | `vosk-model-small-en-us-0.15` | ~40 MB | Tablets and low-end CPUs |
| Accurate | `vosk-model-en-us-0.22-lgraph` | ~130 MB archive / 214 MB extracted | Desktop and strong CPUs |

The English small model is the default because speech recognition runs in WebAssembly on the tablet CPU, not on the GPU. The larger English `-lgraph` model is much heavier and can cause long recognition delays on low-end tablets. English grammar mode restricts recognition to the words of the selected unit, so the small model works well for this game.

To force the accurate English model, open:

```text
games/speak/index.html?model=accurate
```

## Vocabulary

Words come from `data/level_words.js` (books `0`–`6`, units `0`–`9` per book). `data/word_icons.js` maps each unit's words to pictures in `static/imgs/words/fl_big/` where an image exists. The start screen offers three display modes: **Pictures** (image, or the written word when no image exists), **Text**, and **Blank** (hidden words).

## Model files

```text
games/speak/models/
├── vosk-model-small-en-us-0.15.tar.gz      committed, ~40 MB
├── vosk-model-en-us-0.22-lgraph/           committed, extracted files
├── vosk-model-en-us-0.22-lgraph.tar.gz     local only, ignored, ~130 MB
└── vosk-model-small-pl-0.22/               unused, kept for reference
```

The small English archive is under GitHub's 100 MB per-file limit and is served directly.

The large English archive is over the limit, so it is listed in `.gitignore`. For remote/accurate mode, the game builds the archive in the browser from the committed extracted folder.

## How the game selects a model

1. The game uses the small English model if its archive is cached or exists on the server.
2. If the English small model is unavailable, it falls back to the lgraph model.
3. `?model=accurate` forces the English lgraph model. It uses the archive if present; otherwise it builds the archive from the extracted folder.

After a model is loaded, Vosklet stores it in the browser's `Vosklet` Cache Storage. Later starts do not download it again.

## Remote / GitHub Pages

Deploy the small English archive and — if you want accurate English mode remotely — the extracted lgraph folder.

First start in English downloads about 40 MB. First start in accurate English mode downloads about 214 MB of extracted files, builds a ~130 MB archive in the browser, then caches it. These first starts can take a minute on classroom Wi-Fi.

The page must be served over HTTPS or from `localhost`; microphone access and service workers are unavailable on plain HTTP LAN URLs.

## Performance notes

- The fast models are the main fix for tablet latency. The lgraph model is CPU-heavy in WebAssembly.
- Recognition results are handled on partial results, so a card can disappear without waiting for Vosk to finalize the utterance.
- The audio context requests 16 kHz, which is Vosk's native rate and avoids extra resampling.
- The UI avoids `backdrop-filter` and shadow animations, which are expensive on weak tablet GPUs.

## Updating a model

- Replace the relevant `.tar.gz` or extracted folder and update the matching model `key` in `script.v2.js` so Vosklet invalidates its old cache.
- If you change the game shell (`index.html`, `style.v2.css`, `script.v2.js`), bump `VERSION` in `coi-sw.js` so the service worker refreshes its cached copy.
- `style.css` and `script.js` are tiny compatibility shims for pages cached by older service-worker versions; keep them in place when changing the shell.

## Preparing an archive manually

Download the model from https://alphacephei.com/vosk/models, extract it, then repack with USTAR:

```powershell
$src = "$env:USERPROFILE\Downloads"

tar --format=ustar -czf "games\speak\models\vosk-model-small-pl-0.22.tar.gz" `
  -C $src "vosk-model-small-pl-0.22"
```

```bash
tar --format=ustar -czf games/speak/models/vosk-model-small-pl-0.22.tar.gz \
  -C /path/to/extracted vosk-model-small-pl-0.22
```
