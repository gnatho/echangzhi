# Speak & Disappear — speech models

The game supports two English Vosk models:

| Mode | Model | Size | Use |
| --- | --- | --- | --- |
| Fast (default) | `vosk-model-small-en-us-0.15` | ~40 MB | Tablets and low-end CPUs |
| Accurate | `vosk-model-en-us-0.22-lgraph` | ~130 MB archive / 214 MB extracted | Desktop and strong CPUs |

The fast model is the default because speech recognition runs in WebAssembly on the tablet CPU, not on the GPU. The larger `-lgraph` model is much heavier and can cause long recognition delays on low-end tablets. Grammar mode still restricts recognition to the 20 target words, so the small model works well for this game.

To force the accurate model, open:

```text
games/speak/index.html?model=accurate
```

## Model files

```text
games/speak/models/
├── vosk-model-small-en-us-0.15.tar.gz      committed, ~40 MB
├── vosk-model-en-us-0.22-lgraph/           committed, extracted files
└── vosk-model-en-us-0.22-lgraph.tar.gz     local only, ignored, ~130 MB
```

The small model archive is under GitHub's 100 MB per-file limit and is served directly.

The large model archive is over the limit, so it is listed in `.gitignore`. For remote/accurate mode, the game builds the archive in the browser from the committed extracted folder.

## How the game selects a model

1. If `?model=accurate` is present, the game uses the lgraph model.
   - It uses the archive if present.
   - Otherwise it builds the archive from the extracted folder.
2. Otherwise it uses the small model if its archive is cached or exists on the server.
3. If the small model is unavailable, it falls back to the lgraph model.

After a model is loaded, Vosklet stores it in the browser's `Vosklet` Cache Storage. Later starts do not download it again.

## Remote / GitHub Pages

Deploy the small model archive and, if you want accurate mode remotely, the extracted lgraph folder.

First start with the fast model downloads about 40 MB. First start in accurate mode downloads about 214 MB of extracted files, builds a ~130 MB archive in the browser, then caches it. Accurate mode can take a minute on classroom Wi-Fi.

The page must be served over HTTPS or from `localhost`; microphone access and service workers are unavailable on plain HTTP LAN URLs.

## Performance notes

- The fast model is the main fix for tablet latency. The lgraph model is CPU-heavy in WebAssembly.
- Recognition results are handled on partial results, so a card can disappear without waiting for Vosk to finalize the utterance.
- The audio context requests 16 kHz, which is Vosk's native rate and avoids extra resampling.
- The UI avoids `backdrop-filter` and shadow animations, which are expensive on weak tablet GPUs.

## Updating a model

- Replace the relevant `.tar.gz` and update `SMALL_MODEL_ID` or `MODEL_ID` in `script.js` so Vosklet invalidates its old cache.
- If you change the game shell (`index.html`, `style.css`, `script.js`), bump `VERSION` in `coi-sw.js` so the service worker refreshes its cached copy.

## Preparing the large archive manually

Download `vosk-model-en-us-0.22-lgraph.zip` from https://alphacephei.com/vosk/models, extract it, then repack with USTAR:

```powershell
$src = "$env:USERPROFILE\Downloads"

tar --format=ustar -czf "games\speak\models\vosk-model-en-us-0.22-lgraph.tar.gz" `
  -C $src "vosk-model-en-us-0.22-lgraph"
```

```bash
tar --format=ustar -czf games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz \
  -C /path/to/extracted vosk-model-en-us-0.22-lgraph
```
