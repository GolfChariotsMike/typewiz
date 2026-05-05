"""
TypeWiz Core Daemon
===================
Communicates with Electron via stdin/stdout (newline-delimited JSON).
Hold-to-talk: uses keyboard hooks for press + Win32 polling for release.
"""

import io, sys, json, time, threading, ctypes
import model_manager
model_manager.configure_hf_cache()

from audio import AudioRecorder
import pyperclip, pyautogui, keyboard

# ---------------------------------------------------------------------------
# Win32 key state — poll-based release detection
# Windows eats the Win key keyup event so we must poll GetAsyncKeyState.
# ---------------------------------------------------------------------------

VK_MAP = {
    "ctrl":      [0x11, 0xA2, 0xA3],
    "alt":       [0x12, 0xA4, 0xA5],
    "shift":     [0x10, 0xA0, 0xA1],
    "windows":   [0x5B, 0x5C],
    "right alt": [0xA5],
    "space":     [0x20],
}

def is_key_held(key_name: str) -> bool:
    vks = VK_MAP.get(key_name.lower(), [])
    for vk in vks:
        if ctypes.windll.user32.GetAsyncKeyState(vk) & 0x8000:
            return True
    return False

def any_trigger_key_released(keys: list) -> bool:
    """Returns True if ANY of the hotkey keys is no longer held."""
    return any(not is_key_held(k) for k in keys)


# ---------------------------------------------------------------------------
# Text injection
# ---------------------------------------------------------------------------

def inject_text(text: str):
    text = text.strip()
    if not text:
        return
    if len(text) > 50 or any(ord(c) > 127 for c in text):
        pyperclip.copy(text)
        time.sleep(0.05)
        pyautogui.hotkey("ctrl", "v")
    else:
        time.sleep(0.05)
        pyautogui.typewrite(text, interval=0.008)


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
    }
    return [mapping.get(p.strip().lower(), p.strip().lower()) for p in s.split("+")]


# ---------------------------------------------------------------------------
# Hotkey manager
# Strategy:
#   1. keyboard.on_press detects when all hotkey keys are pressed
#   2. A polling thread then waits MIN_HOLD_MS before checking for release
#   3. Polls every POLL_MS until ANY key is released
#   4. If Windows key is in combo, treat Ctrl release as the stop signal
#      (Win key state is unreliable via GetAsyncKeyState on some machines)
# ---------------------------------------------------------------------------

MIN_HOLD_MS = 250    # ignore releases before this (debounce / accidental taps)
POLL_MS     = 50     # how often to check key state
MAX_HOLD_S  = 120    # safety cutoff

class HotkeyManager:
    def __init__(self, on_start, on_stop):
        self._on_start = on_start
        self._on_stop  = on_stop
        self._keys     = []
        self._recording = False
        self._lock      = threading.Lock()
        self._hooks     = []
        self._stop_poll = threading.Event()

    def set_hotkey(self, hotkey_str: str):
        self._unregister()
        self._keys = parse_hotkey(hotkey_str)
        self._recording = False
        self._register()
        emit({"event": "status", "message": f"Hotkey set: {hotkey_str} → keys: {self._keys}"})

    def _trigger_keys_for_release(self) -> list:
        """
        Keys to watch for release.
        If Windows key is in the combo, watch Ctrl instead —
        GetAsyncKeyState for Win is unreliable on many machines.
        """
        if "windows" in self._keys:
            # Use Ctrl as the reliable release signal
            return ["ctrl"]
        return self._keys

    def _on_key_down(self, event):
        with self._lock:
            if self._recording:
                return
            # Check all configured keys are held
            if all(is_key_held(k) for k in self._keys):
                self._recording = True
                threading.Thread(target=self._on_start, daemon=True).start()
                self._stop_poll.clear()
                threading.Thread(target=self._poll_release, daemon=True).start()

    def _poll_release(self):
        start = time.time()
        watch_keys = self._trigger_keys_for_release()

        # Wait minimum hold time before watching for release
        time.sleep(MIN_HOLD_MS / 1000.0)

        deadline = start + MAX_HOLD_S
        while not self._stop_poll.is_set() and time.time() < deadline:
            if any_trigger_key_released(watch_keys):
                with self._lock:
                    if self._recording:
                        self._recording = False
                        threading.Thread(target=self._on_stop, daemon=True).start()
                break
            time.sleep(POLL_MS / 1000.0)
        else:
            # Safety cutoff
            with self._lock:
                if self._recording:
                    self._recording = False
                    threading.Thread(target=self._on_stop, daemon=True).start()

    def _register(self):
        self._hooks = [keyboard.on_press(self._on_key_down)]

    def _unregister(self):
        self._stop_poll.set()
        for h in self._hooks:
            try:
                keyboard.unhook(h)
            except Exception:
                pass
        self._hooks = []


# ---------------------------------------------------------------------------
# Daemon
# ---------------------------------------------------------------------------

class TypeWizDaemon:
    def __init__(self):
        self.model_size = "base"
        self.model      = None
        self.recorder   = AudioRecorder()
        self._recording = False
        self._lock      = threading.Lock()
        self.hotkey_mgr = HotkeyManager(
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
            emit({"event": "status", "message": f"Audio captured: {duration_s:.1f}s"})

            if audio_np.size == 0 or duration_s < 0.3:
                emit({"event": "transcription", "text": ""})
                return

            segments, _info = self.model.transcribe(audio_np, beam_size=5)
            text = " ".join(seg.text for seg in segments).strip()
            emit({"event": "transcription", "text": text})
            if text:
                inject_text(text)

        except Exception as exc:
            emit({"event": "error", "message": f"Transcription failed: {exc}"})

    def _hotkey_start(self): self.start_recording()
    def _hotkey_stop(self):  self.stop_recording()

    def set_config(self, model=None, hotkey=None, **_):
        if hotkey:
            self.hotkey_mgr.set_hotkey(hotkey)
        if model and model != self.model_size:
            self.model_size = model
            threading.Thread(target=self.load_model, daemon=True).start()

    def run(self):
        threading.Thread(target=self.load_model, daemon=True).start()
        self.hotkey_mgr.set_hotkey("ctrl+windows")
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
