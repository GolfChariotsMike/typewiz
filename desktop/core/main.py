"""
TypeWiz Core Daemon
===================
Runs as a long-lived subprocess managed by the Electron shell.
Communicates with Electron via stdin/stdout using newline-delimited JSON.

Inbound commands (from Electron → stdin):
  {"cmd": "start_recording"}       -- manual trigger (unused when hotkey active)
  {"cmd": "stop_recording"}        -- manual stop
  {"cmd": "set_config", "hotkey": "ctrl+windows", "model": "base"}
  {"cmd": "ping"}

Outbound events (stdout → Electron):
  {"event": "ready"}
  {"event": "recording_started"}
  {"event": "transcription", "text": "..."}
  {"event": "status", "message": "..."}
  {"event": "error", "message": "..."}
"""

import io
import sys
import json
import time
import threading
import os

# Configure HuggingFace cache before any faster-whisper imports
import model_manager
model_manager.configure_hf_cache()

from audio import AudioRecorder
import pyperclip
import pyautogui
import keyboard


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
# JSON I/O helpers
# ---------------------------------------------------------------------------

def emit(obj: dict):
    line = json.dumps(obj)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def read_command() -> dict | None:
    try:
        line = sys.stdin.readline()
        if not line:
            return None
        return json.loads(line.strip())
    except json.JSONDecodeError as exc:
        emit({"event": "error", "message": f"Invalid JSON command: {exc}"})
        return {}
    except Exception as exc:
        emit({"event": "error", "message": f"stdin read error: {exc}"})
        return None


# ---------------------------------------------------------------------------
# Hotkey parsing
# ---------------------------------------------------------------------------

def parse_hotkey(hotkey_str: str) -> list[str]:
    """
    Parse a hotkey string like "ctrl+windows" into a list of key names
    that the `keyboard` library understands.
    """
    mapping = {
        "windows": "windows",
        "win": "windows",
        "super": "windows",
        "ctrl": "ctrl",
        "control": "ctrl",
        "alt": "alt",
        "shift": "shift",
        "space": "space",
        "ralt": "right alt",
        "right alt": "right alt",
    }
    parts = [p.strip().lower() for p in hotkey_str.split("+")]
    return [mapping.get(p, p) for p in parts]


# ---------------------------------------------------------------------------
# Hotkey manager — hold-to-talk
# ---------------------------------------------------------------------------

class HotkeyManager:
    """
    Registers a hold-to-talk hotkey using the `keyboard` library.
    Both configured keys must be held simultaneously to record.
    Recording stops when either key is released.
    """

    def __init__(self, on_start, on_stop):
        self._on_start = on_start
        self._on_stop = on_stop
        self._keys = []
        self._held = set()
        self._recording = False
        self._hooks = []
        self._lock = threading.Lock()

    def set_hotkey(self, hotkey_str: str):
        self._unregister()
        self._keys = parse_hotkey(hotkey_str)
        self._held = set()
        self._recording = False
        self._register()
        emit({"event": "status", "message": f"Hotkey set: {hotkey_str}"})

    def _all_held(self) -> bool:
        return all(k in self._held for k in self._keys)

    def _on_key_down(self, event):
        key = event.name.lower() if event.name else ""
        with self._lock:
            self._held.add(key)
            if self._all_held() and not self._recording:
                self._recording = True
                threading.Thread(target=self._on_start, daemon=True).start()

    def _on_key_up(self, event):
        key = event.name.lower() if event.name else ""
        with self._lock:
            self._held.discard(key)
            if self._recording and not self._all_held():
                self._recording = False
                threading.Thread(target=self._on_stop, daemon=True).start()

    def _register(self):
        self._hooks = [
            keyboard.on_press(self._on_key_down),
            keyboard.on_release(self._on_key_up),
        ]

    def _unregister(self):
        for hook in self._hooks:
            try:
                keyboard.unhook(hook)
            except Exception:
                pass
        self._hooks = []


# ---------------------------------------------------------------------------
# Daemon state
# ---------------------------------------------------------------------------

class TypeWizDaemon:
    def __init__(self):
        self.model_size = "base"
        self.model = None
        self.recorder = AudioRecorder()
        self._recording = False
        self._lock = threading.Lock()
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
            emit({"event": "error", "message": f"Failed to load model: {exc}"})
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
            emit({"event": "error", "message": f"Failed to start recording: {exc}"})

    def stop_recording(self):
        with self._lock:
            if not self._recording:
                return
            self._recording = False
        try:
            emit({"event": "status", "message": "Transcribing..."})
            wav_bytes = self.recorder.stop()

            import numpy as np
            import wave as wave_module

            buf = io.BytesIO(wav_bytes)
            with wave_module.open(buf, "rb") as wf:
                frames = wf.readframes(wf.getnframes())
                audio_np = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32767.0

            if audio_np.size == 0:
                emit({"event": "transcription", "text": ""})
                return

            segments, _info = self.model.transcribe(audio_np, beam_size=5)
            text = " ".join(seg.text for seg in segments).strip()
            emit({"event": "transcription", "text": text})
            if text:
                inject_text(text)

        except Exception as exc:
            emit({"event": "error", "message": f"Transcription failed: {exc}"})

    def _hotkey_start(self):
        """Called by HotkeyManager when hold begins."""
        self.start_recording()

    def _hotkey_stop(self):
        """Called by HotkeyManager when hold ends."""
        self.stop_recording()

    def set_config(self, model: str = None, hotkey: str = None, **_kwargs):
        if hotkey:
            self.hotkey_mgr.set_hotkey(hotkey)
        if model and model != self.model_size:
            self.model_size = model
            threading.Thread(target=self.load_model, daemon=True).start()

    def run(self):
        # Load model + register default hotkey on startup
        loader = threading.Thread(target=self.load_model, daemon=True)
        loader.start()

        # Register default hotkey (Ctrl + Windows)
        self.hotkey_mgr.set_hotkey("ctrl+windows")

        while True:
            cmd = read_command()
            if cmd is None:
                break
            if not cmd:
                continue

            command = cmd.get("cmd")

            if command == "start_recording":
                threading.Thread(target=self.start_recording, daemon=True).start()
            elif command == "stop_recording":
                threading.Thread(target=self.stop_recording, daemon=True).start()
            elif command == "set_config":
                self.set_config(**{k: v for k, v in cmd.items() if k != "cmd"})
            elif command == "ping":
                emit({"event": "pong"})
            else:
                emit({"event": "error", "message": f"Unknown command: {command!r}"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)

    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0

    daemon = TypeWizDaemon()
    daemon.run()
