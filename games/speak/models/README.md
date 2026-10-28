# Speak & Disappear — speech models

The game supports English and Polish, and each language has its own Vosk model.

| Language | Mode | Model | Size | Use |
| --- | --- | --- | --- | --- |
| English (default) | Fast | `vosk-model-small-en-us-0.15` | ~40 MB | Tablets and low-end CPUs |
| English (accurate) | Accurate | `vosk-model-en-us-0.22-lgraph` | ~130 MB archive / 214 MB extracted | Desktop and strong CPUs |
| Polish | Fast | `vosk-model-small-pl-0.22` | ~54 MB archive / 86 MB extracted | Tablets and low-end CPUs |

The English small model is the default because speech recognition runs in WebAssembly on the tablet CPU, not on the GPU. The larger English `-lgraph` model is much heavier and can cause long recognition delays on low-end tablets. English grammar mode restricts recognition to the 20 target words, so the small model works well for this game.

To force the accurate English model, open:

```text
games/speak/index.html?model=accurate
```

The language can be chosen on the start screen. Deep links are also supported:

```text
games/speak/index.html?lang=en
games/speak/index.html?lang=pl
```

## Polish recognition

The Polish small model has no `graph/words.txt`, so the browser cannot build a Vosk grammar from the target words. Polish therefore uses free-form recognition and the game matches recognised words with diacritic-insensitive, tolerant matching (for example `piłkę` also matches `piłka`). English keeps grammar mode for tighter recognition.

## Model files

```text
games/speak/models/
├── vosk-model-small-en-us-0.15.tar.gz      committed, ~40 MB
├── vosk-model-en-us-0.22-lgraph/           committed, extracted files
├── vosk-model-en-us-0.22-lgraph.tar.gz     local only, ignored, ~130 MB
├── vosk-model-small-pl-0.22/               committed, extracted files
└── vosk-model-small-pl-0.22.tar.gz         built in the browser on first Polish start
```

The small English archive is under GitHub's 100 MB per-file limit and is served directly.

The large English archive is over the limit, so it is listed in `.gitignore`. For remote/accurate mode, the game builds the archive in the browser from the committed extracted folder.

The Polish extracted folder is committed. On the first Polish start the game downloads the extracted files, builds a ~54 MB archive in the browser, and caches it. Later starts reuse the browser cache.

## How the game selects a model

1. The chosen language decides which model folder is used.
2. English uses the small model if its archive is cached or exists on the server.
3. If the English small model is unavailable, it falls back to the lgraph model.
4. `?model=accurate` forces the English lgraph model. It uses the archive if present; otherwise it builds the archive from the extracted folder.
5. Polish uses the small Polish archive if cached, otherwise it builds it from the extracted folder.

After a model is loaded, Vosklet stores it in the browser's `Vosklet` Cache Storage. Later starts do not download it again.

## Remote / GitHub Pages

Deploy the small English archive, the extracted Polish folder, and — if you want accurate English mode remotely — the extracted lgraph folder.

First start in English downloads about 40 MB. First start in accurate English mode downloads about 214 MB of extracted files, builds a ~130 MB archive in the browser, then caches it. First start in Polish downloads about 86 MB of extracted files, builds a ~54 MB archive, then caches it. These first starts can take a minute on classroom Wi-Fi.

The page must be served over HTTPS or from `localhost`; microphone access and service workers are unavailable on plain HTTP LAN URLs.

## Performance notes

- The fast models are the main fix for tablet latency. The lgraph model is CPU-heavy in WebAssembly.
- Recognition results are handled on partial results, so a card can disappear without waiting for Vosk to finalize the utterance.
- The audio context requests 16 kHz, which is Vosk's native rate and avoids extra resampling.
- The UI avoids `backdrop-filter` and shadow animations, which are expensive on weak tablet GPUs.

## Updating a model

- Replace the relevant `.tar.gz` or extracted folder and update the matching model `key` in `script.js` so Vosklet invalidates its old cache.
- If you change the game shell (`index.html`, `style.css`, `script.js`), bump `VERSION` in `coi-sw.js` so the service worker refreshes its cached copy.

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
