"""
TypeWiz Core Daemon
===================
Communicates with Electron via stdin/stdout (newline-delimited JSON).

Hotkey detection: pure Win32 GetAsyncKeyState polling every 30ms.
No keyboard hooks, no admin required, rock solid.

Text injection: always via clipboard paste (Ctrl+V). Most reliable method.
"""

import io, sys, json, time, threading, ctypes, ctypes.wintypes
import model_manager
model_manager.configure_hf_cache()

from audio import AudioRecorder
import pyperclip
import pyautogui

# ---------------------------------------------------------------------------
# Win32 key state
# ---------------------------------------------------------------------------

VK_MAP = {
    "ctrl":      [0x11, 0xA2, 0xA3],   # VK_CONTROL, L, R
    "alt":       [0x12, 0xA4, 0xA5],   # VK_MENU, L, R
    "shift":     [0x10, 0xA0, 0xA1],
    "windows":   [0x5B, 0x5C],         # VK_LWIN, VK_RWIN
    "right alt": [0xA5],
    "space":     [0x20],
    "f13":       [0x7C],
}

def is_key_held(key_name: str) -> bool:
    for vk in VK_MAP.get(key_name.lower(), []):
        if ctypes.windll.user32.GetAsyncKeyState(vk) & 0x8000:
            return True
    return False


# ---------------------------------------------------------------------------
# Text injection — always clipboard paste, most reliable on Windows
# ---------------------------------------------------------------------------

def inject_text(text: str):
    text = text.strip()
    if not text:
        return
    try:
        # Save existing clipboard content
        try:
            old = pyperclip.paste()
        except Exception:
            old = ""
        pyperclip.copy(text)
        time.sleep(0.08)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(0.12)
        # Restore clipboard
        try:
            if old:
                pyperclip.copy(old)
        except Exception:
            pass
    except Exception as exc:
        emit({"event": "error", "message": f"Text inject failed: {exc}"})


# ---------------------------------------------------------------------------
# JSON I/O
# ---------------------------------------------------------------------------

def emit(obj: dict):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()

def read_command():
    try:
        line = sys.stdin.readline()
        if not line:
            return None
        return json.loads(line.strip())
    except json.JSONDecodeError as exc:
        emit({"event": "error", "message": f"Invalid JSON: {exc}"})
        return {}
    except Exception as exc:
        emit({"event": "error", "message": f"stdin error: {exc}"})
        return None


# ---------------------------------------------------------------------------
# Hotkey parsing
# ---------------------------------------------------------------------------

def parse_hotkey(s: str) -> list:
    mapping = {
        "windows": "windows", "win": "windows", "super": "windows",
        "ctrl": "ctrl", "control": "ctrl",
        "alt": "alt", "shift": "shift", "space": "space",
        "ralt": "right alt", "right alt": "right alt",
        "f13": "f13",
    }
    return [mapping.get(p.strip().lower(), p.strip().lower()) for p in s.split("+")]


# ---------------------------------------------------------------------------
# Hotkey manager — pure polling, no hooks, no admin needed
# Polls GetAsyncKeyState every 30ms. Detects press and release reliably.
# ---------------------------------------------------------------------------

POLL_INTERVAL = 0.03   # 30ms — fast enough to feel instant
MIN_HOLD_S    = 0.15   # ignore releases within 150ms (debounce)
MAX_HOLD_S    = 120    # safety cutoff

class HotkeyManager:
    def __init__(self, on_start, on_stop):
        self._on_start  = on_start
        self._on_stop   = on_stop
        self._keys      = []
        self._active    = False
        self._running   = False
        self._thread    = None
        self._lock      = threading.Lock()

    def set_hotkey(self, hotkey_str: str):
        self._keys = parse_hotkey(hotkey_str)
        emit({"event": "status", "message": f"Hotkey set: {hotkey_str} keys={self._keys}"})

    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _all_held(self) -> bool:
        return all(is_key_held(k) for k in self._keys)

    def _poll_loop(self):
        hold_start = None
        while self._running:
            held = self._all_held()
            with self._lock:
                if held and not self._active:
                    self._active = True
                    hold_start = time.time()
                    threading.Thread(target=self._on_start, daemon=True).start()
                elif not held and self._active:
                    duration = time.time() - hold_start if hold_start else 0
                    if duration >= MIN_HOLD_S:
                        self._active = False
                        threading.Thread(target=self._on_stop, daemon=True).start()
                    elif not held:
                        # Released too fast — cancel without transcribing
                        self._active = False
                elif self._active and hold_start and (time.time() - hold_start) > MAX_HOLD_S:
                    self._active = False
                    threading.Thread(target=self._on_stop, daemon=True).start()
            time.sleep(POLL_INTERVAL)


# ---------------------------------------------------------------------------
# Daemon
# ---------------------------------------------------------------------------

class TypeWizDaemon:
    def __init__(self):
        self.model_size  = "small"
        self.language    = "en"
        self.model       = None
        self.recorder    = AudioRecorder()
        self._recording  = False
        self._lock       = threading.Lock()
        self.hotkey_mgr  = HotkeyManager(
            on_start=self._hotkey_start,
            on_stop=self._hotkey_stop,
        )

    def load_model(self):
        try:
            emit({"event": "status", "message": f"Loading Whisper '{self.model_size}' model..."})
            self.model = model_manager.load_model(self.model_size)
            emit({"event": "ready"})
        except Exception as exc:
            emit({"event": "error", "message": f"Model load failed: {exc}"})
            sys.exit(1)

    def start_recording(self):
        with self._lock:
            if self._recording:
                return
            self._recording = True
        try:
            self.recorder.start()
            emit({"event": "recording_started"})
        except Exception as exc:
            with self._lock:
                self._recording = False
            emit({"event": "error", "message": f"Record start failed: {exc}"})

    def stop_recording(self):
        with self._lock:
            if not self._recording:
                return
            self._recording = False
        try:
            emit({"event": "status", "message": "Transcribing..."})
            wav_bytes = self.recorder.stop()

            import numpy as np, wave as wave_module
            buf = io.BytesIO(wav_bytes)
            with wave_module.open(buf, "rb") as wf:
                frames = wf.readframes(wf.getnframes())
                audio_np = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32767.0

            duration_s = len(audio_np) / 16000
            emit({"event": "status", "message": f"Captured {duration_s:.1f}s of audio"})

            if audio_np.size == 0 or duration_s < 0.08:
                emit({"event": "transcription", "text": ""})
                return

            segments, _info = self.model.transcribe(
                audio_np,
                language=self.language,    # user-configured language (None = auto-detect)
                beam_size=5,
                best_of=5,
                condition_on_previous_text=False,  # no hallucinated context
                no_speech_threshold=0.45,          # reject if probably silence
                log_prob_threshold=-1.2,           # reject low-confidence output
                compression_ratio_threshold=2.4,
            )
            text = " ".join(seg.text for seg in segments).strip()
            emit({"event": "transcription", "text": text})
            if text:
                inject_text(text)

        except Exception as exc:
            emit({"event": "error", "message": f"Transcription failed: {exc}"})
        finally:
            # Always reset for next use
            try:
                self.recorder = AudioRecorder()
            except Exception:
                pass
            with self._lock:
                self._recording = False

    def _hotkey_start(self): self.start_recording()
    def _hotkey_stop(self):  self.stop_recording()

    def set_config(self, model=None, hotkey=None, language=None, **_):
        if hotkey:
            self.hotkey_mgr.set_hotkey(hotkey)
        if language:
            self.language = language if language != "auto" else None
        if model and model != self.model_size:
            self.model_size = model
            threading.Thread(target=self.load_model, daemon=True).start()

    def run(self):
        threading.Thread(target=self.load_model, daemon=True).start()
        self.hotkey_mgr.set_hotkey("ctrl+windows")
        self.hotkey_mgr.start()

        while True:
            cmd = read_command()
            if cmd is None:
                break
            if not cmd:
                continue
            c = cmd.get("cmd")
            if   c == "start_recording": threading.Thread(target=self.start_recording, daemon=True).start()
            elif c == "stop_recording":  threading.Thread(target=self.stop_recording,  daemon=True).start()
            elif c == "set_config":      self.set_config(**{k:v for k,v in cmd.items() if k != "cmd"})
            elif c == "ping":            emit({"event": "pong"})
            else:                        emit({"event": "error", "message": f"Unknown cmd: {c!r}"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0
    TypeWizDaemon().run()
