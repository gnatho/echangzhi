# Speak & Disappear — speech model

The game expects this exact file:

```
games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz
```

`script.js` points to it with:

```js
const MODEL_FILE = 'models/vosk-model-en-us-0.22-lgraph.tar.gz';
const MODEL_ID = 'vosk-model-en-us-0.22-lgraph';
```

## 1. Download the model

Download the **vosk-model-en-us-0.22-lgraph** model (about 128 MB) from the official Vosk model page:

https://alphacephei.com/vosk/models

File: `vosk-model-en-us-0.22-lgraph.zip`

The `-lgraph` model has a dynamic graph, which is required for grammar mode. It is more accurate than `vosk-model-small-en-us-0.15` and practical on 8 GB tablets.

## 2. Extract and repack

Vosklet loads a gzip-compressed tar archive (`.tar.gz`) and expects USTAR format. The extracted Vosk model folder should stay as the top-level folder inside the archive.

### Windows (PowerShell, uses the built-in `tar.exe`)

```powershell
# Change this to the folder where you extracted the zip
$src = "$env:USERPROFILE\Downloads"

tar --format=ustar -czf "games\speak\models\vosk-model-en-us-0.22-lgraph.tar.gz" -C $src "vosk-model-en-us-0.22-lgraph"
```

### macOS / Linux

```bash
tar --format=ustar -czf games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz \
  -C /path/to/extracted vosk-model-en-us-0.22-lgraph
```

## 3. Verify the archive

```bash
tar -tzf games/speak/models/vosk-model-en-us-0.22-lgraph.tar.gz
```

The first entries should look like:

```
vosk-model-en-us-0.22-lgraph/
vosk-model-en-us-0.22-lgraph/am/
vosk-model-en-us-0.22-lgraph/am/final.mdl
vosk-model-en-us-0.22-lgraph/conf/
vosk-model-en-us-0.22-lgraph/graph/
...
```

Do **not** extract the model files directly into `models/`. The `.tar.gz` file itself is what the game downloads and caches.

## 4. Offline behaviour

- The game shell (HTML, CSS, JS, Vosklet JS/WASM) is cached by `coi-sw.js` in the `speak-shell-1.0.3` cache.
- The model is downloaded once by Vosklet and stored in the `Vosklet` cache in the browser's Cache Storage.
- After both are cached, the game runs offline.
- Clearing site data / browser storage removes the cached model, and it will download again on the next start.
- If you replace the model file with a different model, also change `MODEL_ID` in `script.js`. Vosklet uses that ID to decide whether an existing cached model is still valid.

## Hosting note

GitHub rejects individual Git files larger than 100 MB, so the 128 MB `-lgraph` archive cannot be committed normally to GitHub. If the game is deployed on GitHub Pages, either:

- host `vosk-model-en-us-0.22-lgraph.tar.gz` on a static file host (for example Cloudflare R2, S3, or another CDN) and change `MODEL_FILE` in `script.js` to its full URL; the model is still cached offline after the first download, or
- use `vosk-model-small-en-us-0.15.tar.gz` (about 40 MB) instead, which still supports grammar mode, and update both `MODEL_FILE` and `MODEL_ID` in `script.js`.

The external host must send CORS headers (`Access-Control-Allow-Origin`) and be available over HTTPS. The page itself must also be served over HTTPS or from `localhost`; plain HTTP on a LAN IP cannot use the microphone or service workers in Chrome.

If the game is copied directly to classroom tablets or served from a normal web server that accepts large files, keeping the model in this folder is the simplest option.
