"""
TypeWiz Core Daemon
===================
Communicates with Electron via stdin/stdout (newline-delimited JSON).
Cloud mode: OpenAI Whisper API (default).
Local mode: faster-whisper on-device.
"""

import io, sys, json, time, threading, ctypes

# ── JSON I/O (must be first so we can emit errors during import) ───────────
def emit(obj):
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

# ── Safe imports ───────────────────────────────────────────────────────────
try:
    import pyperclip
except Exception as e:
    emit({"event": "error", "message": f"pyperclip import failed: {e}"})
    pyperclip = None

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0
except Exception as e:
    emit({"event": "error", "message": f"pyautogui import failed: {e}"})
    pyautogui = None

try:
    import requests
    _session = requests.Session()
except Exception as e:
    emit({"event": "error", "message": f"requests import failed: {e}"})
    requests = None
    _session = None

try:
    from audio import AudioRecorder
except Exception as e:
    emit({"event": "error", "message": f"audio import failed: {e}"})
    AudioRecorder = None

# ── Win32 key polling ──────────────────────────────────────────────────────
VK_MAP = {
    "ctrl":      [0x11, 0xA2, 0xA3],
    "alt":       [0x12, 0xA4, 0xA5],
    "shift":     [0x10, 0xA0, 0xA1],
    "windows":   [0x5B, 0x5C],
    "right alt": [0xA5],
    "space":     [0x20],
    "f13":       [0x7C],
}

def is_key_held(key_name):
    try:
        for vk in VK_MAP.get(key_name.lower(), []):
            if ctypes.windll.user32.GetAsyncKeyState(vk) & 0x8000:
                return True
    except Exception:
        pass
    return False

# ── Text injection ─────────────────────────────────────────────────────────
def inject_text(text):
    text = text.strip()
    if not text:
        return
    try:
        old = ""
        if pyperclip:
            try:
                old = pyperclip.paste()
            except Exception:
                pass
            pyperclip.copy(text)
        time.sleep(0.04)
        if pyautogui:
            pyautogui.hotkey("ctrl", "v")
        time.sleep(0.05)
        if pyperclip and old:
            try:
                pyperclip.copy(old)
            except Exception:
                pass
    except Exception as exc:
        emit({"event": "error", "message": f"Inject failed: {exc}"})

# ── Hotkey parsing ─────────────────────────────────────────────────────────
def parse_hotkey(s):
    mapping = {
        "windows": "windows", "win": "windows", "super": "windows",
        "ctrl": "ctrl", "control": "ctrl",
        "alt": "alt", "shift": "shift", "space": "space",
        "ralt": "right alt", "right alt": "right alt", "f13": "f13",
    }
    return [mapping.get(p.strip().lower(), p.strip().lower()) for p in s.split("+")]

# ── Hotkey manager (pure Win32 polling) ───────────────────────────────────
POLL_INTERVAL = 0.03
MIN_HOLD_S    = 0.15
MAX_HOLD_S    = 120

class HotkeyManager:
    def __init__(self, on_start, on_stop):
        self._on_start = on_start
        self._on_stop  = on_stop
        self._keys     = ["ctrl", "windows"]
        self._active   = False
        self._running  = False
        self._lock     = threading.Lock()

    def set_hotkey(self, hotkey_str):
        self._keys = parse_hotkey(hotkey_str)
        emit({"event": "status", "message": f"Hotkey: {hotkey_str} -> {self._keys}"})

    def start(self):
        self._running = True
        threading.Thread(target=self._poll_loop, daemon=True).start()
        emit({"event": "status", "message": "Hotkey polling started"})

    def _all_held(self):
        return all(is_key_held(k) for k in self._keys)

    def _poll_loop(self):
        hold_start = None
        while self._running:
            try:
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
                        else:
                            self._active = False
                    elif self._active and hold_start and (time.time() - hold_start) > MAX_HOLD_S:
                        self._active = False
                        threading.Thread(target=self._on_stop, daemon=True).start()
            except Exception as exc:
                emit({"event": "error", "message": f"Poll error: {exc}"})
            time.sleep(POLL_INTERVAL)

# ── Cloud transcription ────────────────────────────────────────────────────
def transcribe_cloud(wav_bytes, api_key, language="en"):
    lang_param = language if language and language != "auto" else None
    files = {"file": ("audio.wav", io.BytesIO(wav_bytes), "audio/wav")}
    data  = {"model": "whisper-1"}
    if lang_param:
        data["language"] = lang_param
    headers = {"Authorization": f"Bearer {api_key}"}
    sess = _session if _session else requests.Session()
    resp = sess.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers=headers, files=files, data=data, timeout=30
    )
    resp.raise_for_status()
    return resp.json().get("text", "").strip()

# ── Local transcription ────────────────────────────────────────────────────
def transcribe_local(wav_bytes, model, language="en"):
    import numpy as np, wave as wave_module
    buf = io.BytesIO(wav_bytes)
    with wave_module.open(buf, "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        audio_np = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32767.0
    if audio_np.size == 0 or len(audio_np) / 16000 < 0.08:
        return ""
    lang = language if language and language != "auto" else None
    segments, _ = model.transcribe(audio_np, language=lang, beam_size=5, best_of=5,
        condition_on_previous_text=False, no_speech_threshold=0.45,
        log_prob_threshold=-1.2, compression_ratio_threshold=2.4)
    return " ".join(seg.text for seg in segments).strip()

# ── Daemon ─────────────────────────────────────────────────────────────────
class TypeWizDaemon:
    def __init__(self):
        self.mode       = "cloud"
        self.api_key    = ""
        self.model_size = "small"
        self.language   = "en"
        self.model      = None
        self.recorder   = AudioRecorder() if AudioRecorder else None
        self._recording = False
        self._lock      = threading.Lock()
        self.hotkey_mgr = HotkeyManager(
            on_start=self._hotkey_start,
            on_stop=self._hotkey_stop,
        )

    def load_model(self):
        try:
            import model_manager
            model_manager.configure_hf_cache()
            emit({"event": "status", "message": f"Loading local model '{self.model_size}'..."})
            self.model = model_manager.load_model(self.model_size)
            emit({"event": "status", "message": "Local model ready."})
        except Exception as exc:
            emit({"event": "error", "message": f"Model load failed: {exc}"})

    def start_recording(self):
        with self._lock:
            if self._recording:
                return
            self._recording = True
        try:
            if not self.recorder:
                self.recorder = AudioRecorder()
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

            if self.mode == "cloud":
                if not self.api_key:
                    emit({"event": "error", "message": "No API key. Add your OpenAI key in Settings."})
                    return
                text = transcribe_cloud(wav_bytes, self.api_key, self.language)
            else:
                if self.model is None:
                    emit({"event": "error", "message": "Local model not loaded yet."})
                    return
                text = transcribe_local(wav_bytes, self.model, self.language)

            emit({"event": "transcription", "text": text})
            if text:
                inject_text(text)

        except Exception as exc:
            emit({"event": "error", "message": f"Transcription failed: {exc}"})
        finally:
            try:
                self.recorder = AudioRecorder() if AudioRecorder else None
            except Exception:
                pass
            with self._lock:
                self._recording = False

    def _hotkey_start(self): self.start_recording()
    def _hotkey_stop(self):  self.stop_recording()

    def set_config(self, mode=None, api_key=None, model=None, hotkey=None, language=None, **_):
        if hotkey:
            self.hotkey_mgr.set_hotkey(hotkey)
        if language:
            self.language = language if language != "auto" else None
        if mode:
            prev_mode = self.mode
            self.mode = mode
            if mode == "local" and self.model is None:
                threading.Thread(target=self.load_model, daemon=True).start()
        if api_key is not None:
            self.api_key = api_key
        if model:
            self.model_size = model

    def warmup(self):
        try:
            if _session:
                _session.head("https://api.openai.com", timeout=5)
        except Exception:
            pass

    def run(self):
        emit({"event": "ready"})
        self.hotkey_mgr.set_hotkey("ctrl+windows")
        self.hotkey_mgr.start()
        threading.Thread(target=self.warmup, daemon=True).start()

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

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)
    TypeWizDaemon().run()
