"""
TypeWiz Core Daemon
===================
Runs as a long-lived subprocess managed by the Electron shell.
Communicates with Electron via stdin/stdout using newline-delimited JSON.

Inbound commands (from Electron → stdin):
  {"cmd": "start_recording"}
  {"cmd": "stop_recording"}
  {"cmd": "set_config", "model": "base", "hotkey": "RAlt"}

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


# ---------------------------------------------------------------------------
# Text injection
# ---------------------------------------------------------------------------

def inject_text(text: str):
    """
    Type the transcribed text at the current cursor position.
    Uses clipboard paste for non-ASCII or long strings to avoid
    character encoding issues on Windows.
    """
    text = text.strip()
    if not text:
        return

    # Clipboard-based paste: faster and handles all Unicode
    if len(text) > 50 or any(ord(c) > 127 for c in text):
        pyperclip.copy(text)
        # Small delay to ensure the target window is focused
        time.sleep(0.05)
        pyautogui.hotkey("ctrl", "v")
    else:
        # Direct typewrite for short ASCII strings
        time.sleep(0.05)
        pyautogui.typewrite(text, interval=0.008)


# ---------------------------------------------------------------------------
# JSON I/O helpers
# ---------------------------------------------------------------------------

def emit(obj: dict):
    """Write a JSON event line to stdout."""
    line = json.dumps(obj)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def read_command() -> dict | None:
    """Read one line from stdin and parse as JSON. Returns None on EOF."""
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
# Daemon state
# ---------------------------------------------------------------------------

class TypeWizDaemon:
    def __init__(self):
        self.model_size = "base"
        self.model = None
        self.recorder = AudioRecorder()
        self._recording = False
        self._lock = threading.Lock()

    def load_model(self):
        """Load Whisper model. Blocks until ready, then emits 'ready'."""
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
                emit({"event": "error", "message": "Already recording."})
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
                emit({"event": "error", "message": "Not currently recording."})
                return
            self._recording = False

        try:
            emit({"event": "status", "message": "Transcribing..."})
            wav_bytes = self.recorder.stop()

            # Whisper accepts a numpy array or a file-like object
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

    def set_config(self, model: str = None, hotkey: str = None, **_kwargs):
        """Apply configuration changes."""
        if model and model != self.model_size:
            self.model_size = model
            # Reload model on next transcription if changed
            threading.Thread(target=self.load_model, daemon=True).start()

    def run(self):
        """Main command loop — reads JSON lines from stdin forever."""
        # Load model on startup in background so stdin loop is ready immediately
        loader = threading.Thread(target=self.load_model, daemon=True)
        loader.start()

        while True:
            cmd = read_command()
            if cmd is None:
                # stdin closed — parent process exited
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
    # Ensure stdout/stderr are in line-buffered text mode
    # (important on Windows where default is block-buffered)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)

    # Disable pyautogui failsafe (moving mouse to corner would abort on Windows)
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0  # No automatic pause between pyautogui calls

    daemon = TypeWizDaemon()
    daemon.run()
