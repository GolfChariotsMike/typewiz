# TypeWiz Desktop (Windows)

> Stop typing. Just speak.

TypeWiz is a Windows desktop app that transcribes your voice and types it at your cursor in any application — hold a hotkey, speak, release, text appears.

---

## Architecture

```
desktop/
├── core/                  # Python daemon (audio + Whisper + text injection)
│   ├── main.py            # IPC daemon — communicates with Electron via stdin/stdout JSON
│   ├── audio.py           # Microphone recording (sounddevice → WAV bytes)
│   ├── model_manager.py   # Whisper model download + cache management
│   └── requirements.txt   # Python dependencies
│
├── electron/              # Electron shell (system tray, hotkey, settings UI)
│   ├── package.json       # npm config + electron-builder settings
│   ├── assets/
│   │   └── icon.svg       # Source icon (needs to be built to .ico/.png)
│   └── src/
│       ├── main.js        # Electron main process
│       ├── tray.js        # System tray icon + menu
│       ├── settings.js    # Settings window manager
│       ├── settings.html  # Settings UI (dark theme)
│       ├── overlay.js     # Recording indicator overlay
│       └── preload.js     # Electron context bridge (IPC for renderer)
│
├── install.bat            # One-time Windows setup script
└── README.md              # This file
```

### How it works

1. **Electron** starts and spawns the **Python core daemon** as a child process
2. Python loads the **Whisper model** into memory (once at startup, ~2–5 seconds)
3. When you **hold the hotkey** → Electron sends `{"cmd": "start_recording"}` to Python via stdin
4. Python captures audio from the **default microphone** using `sounddevice`
5. When you **release the hotkey** → Electron sends `{"cmd": "stop_recording"}`
6. Python runs **faster-whisper** transcription on the captured audio
7. Python **injects the transcribed text** at the current cursor position using `pyautogui` (clipboard paste for Unicode/long text)
8. Python sends `{"event": "transcription", "text": "..."}` back to Electron (for the overlay/notifications)

All audio processing happens locally — **no data leaves your machine**.

---

## Requirements

- **Windows 10 or 11** (64-bit)
- **Python 3.10+** — [download here](https://www.python.org/downloads/)
  - Tick "Add Python to PATH" during install
- **Node.js 18+** — [download here](https://nodejs.org/)
- ~500MB disk space (Whisper base model + Python packages)
- A working microphone

---

## Setup (First Time)

### Step 1 — Run the installer

Double-click `install.bat` in the `desktop/` folder.

This will:
1. Check Python is installed
2. Create a virtual environment at `core/venv/`
3. Install Python dependencies (`faster-whisper`, `sounddevice`, `pyautogui`, etc.)
4. Download the Whisper `base` model (~150MB, one-time)

### Step 2 — Install Node.js dependencies

```cmd
cd desktop\electron
npm install
```

### Step 3 — Generate the app icon

See `electron/assets/README.md` for instructions on converting `icon.svg` to `icon.ico` and `icon.png`.

---

## Running in Dev Mode

```cmd
cd desktop\electron
npm start
```

TypeWiz will appear in the system tray. Settings open automatically on first launch.

**Default hotkey:** Right Alt — hold to record, release to transcribe.

### Changing the hotkey

The default (Right Alt) uses a toggle-style press since Electron's globalShortcut only fires on key-down. Each press of the hotkey toggles recording on/off.

You can change it to `Ctrl+Space` or another combo in Settings for a more natural hold-style feel (though the toggle behaviour remains either way).

---

## Building the Windows Installer

```cmd
cd desktop\electron
npm run build
```

This produces a `dist/TypeWiz Setup 1.0.0.exe` NSIS installer. The Python `core/` folder is bundled as an extra resource.

**Note:** The installer does NOT bundle Python itself. Users need Python installed separately (or you can add a Python embedded distribution to `extraResources`).

---

## Configuration

Config is stored in `%APPDATA%\typewiz\config.json` (managed by `electron-store`).

| Key | Default | Options |
|-----|---------|---------|
| `hotkey` | `RAlt` | `RAlt`, `CmdOrCtrl+Space`, `CmdOrCtrl+Super`, `F13` |
| `model` | `base` | `tiny`, `base`, `small` |
| `licenseKey` | `""` | Your TypeWiz license key |

Model files are cached at `%USERPROFILE%\.typewiz\models\`.

---

## Whisper Model Sizes

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| tiny | ~75MB | Fastest | Basic |
| base | ~150MB | Fast | Good ✓ |
| small | ~500MB | Slower | Best |

Changing the model in Settings will trigger a background download if not already cached.

---

## IPC Protocol

The Electron shell communicates with the Python daemon via **stdin/stdout newline-delimited JSON**.

### Commands (Electron → Python)

```json
{"cmd": "start_recording"}
{"cmd": "stop_recording"}
{"cmd": "set_config", "model": "base", "hotkey": "RAlt"}
{"cmd": "ping"}
```

### Events (Python → Electron)

```json
{"event": "ready"}
{"event": "recording_started"}
{"event": "transcription", "text": "Hello world"}
{"event": "status", "message": "Loading model..."}
{"event": "error", "message": "Something went wrong"}
{"event": "pong"}
```

---

## Troubleshooting

**"Python not found"** — Re-run `install.bat`, ensure Python is in your PATH.

**"Core not found"** — The `core/` folder must be present next to the `electron/` folder. In packaged builds, it's automatically included.

**Hotkey not working** — Another application may be using the same hotkey. Change it in Settings.

**Text not appearing** — Ensure the target application has focus before releasing the hotkey. Some apps (UAC dialogs, some games) block `pyautogui` input.

**Model download fails** — Ensure you have internet access and ~500MB free disk space. Models are cached in `%USERPROFILE%\.typewiz\models\`.

---

## License

TypeWiz is a commercial product. A valid license key is required for production use.  
Visit [typewiz.ai](https://typewiz.ai) to purchase.
