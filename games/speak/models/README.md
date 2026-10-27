# Speak & Disappear — speech model

The game uses **vosk-model-en-us-0.22-lgraph**, the dynamic-graph model required for grammar mode.

## How the game finds the model

On Start, the game checks these sources in order:

1. An already cached model in the browser's `Vosklet` Cache Storage.
2. `games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz` if it exists on the server.
3. Otherwise, it builds the archive in the browser from the extracted model folder at
   `games/speak/models/vosk-model-en-us-0.22-lgraph/`.

Source 3 is what makes the game work on GitHub Pages: the 130 MB `.tar.gz` is larger than GitHub's 100 MB per-file limit, but the extracted model files are individual files and can be deployed normally. The browser downloads them once, builds a USTAR `.tar.gz` in memory, and hands it to Vosklet. Vosklet then caches the model in Cache Storage.

## Local development

You can use either form:

- Keep the extracted folder:
  `games/speak/models/vosk-model-en-us-0.22-lgraph/`
- Or keep the prepared archive:
  `games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz`

The archive is faster on first start. It is listed in `.gitignore` because it is too large for GitHub.

If the archive is absent, the browser builds it from the extracted folder. The first start is slower, then the model is cached.

## Remote / GitHub Pages

Commit the extracted folder, **not** the 130 MB archive:

```text
games/speak/models/vosk-model-en-us-0.22-lgraph/
├── am/
├── conf/
├── graph/
└── ivector/
```

The deployed page must be served over HTTPS or from `localhost`; microphone access and service workers are unavailable on plain HTTP LAN URLs.

First start on a new tablet downloads the extracted model files (about 214 MB), builds a ~130 MB gzip archive, and caches it. Later starts load from the cache and work offline. The first start can take a minute on a classroom Wi-Fi network.

## Preparing the archive manually

Download `vosk-model-en-us-0.22-lgraph.zip` from:

https://alphacephei.com/vosk/models

Extract it, then repack with USTAR:

### Windows (PowerShell)

```powershell
$src = "$env:USERPROFILE\Downloads"

tar --format=ustar -czf "games\speak\models\vosk-model-en-us-0.22-lgraph.tar.gz" `
  -C $src "vosk-model-en-us-0.22-lgraph"
```

### macOS / Linux

```bash
tar --format=ustar -czf games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz \
  -C /path/to/extracted vosk-model-en-us-0.22-lgraph
```

Verify:

```bash
tar -tzf games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz
```

## Updating the model

- If you replace the model, update `MODEL_ID` in `script.js` so Vosklet invalidates its old cache.
- If you change the game shell (`index.html`, `style.css`, `script.js`), bump `VERSION` in `coi-sw.js` so the service worker refreshes its cached copy.
