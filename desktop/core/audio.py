"""
audio.py — Audio capture module for TypeWiz
Records audio from the default microphone using sounddevice,
returns raw audio as WAV bytes suitable for Whisper transcription.
"""

import io
import wave
import numpy as np
import sounddevice as sd

# Audio recording settings
SAMPLE_RATE = 16000   # 16kHz — optimal for Whisper
CHANNELS = 1          # Mono
DTYPE = np.float32    # Float32 PCM


class AudioRecorder:
    """
    Manages microphone recording lifecycle.
    Call start() to begin capturing, stop() to end and retrieve audio bytes.
    """

    def __init__(self, sample_rate: int = SAMPLE_RATE, channels: int = CHANNELS):
        self.sample_rate = sample_rate
        self.channels = channels
        self._frames = []
        self._stream = None
        self._recording = False

    def _callback(self, indata, frames, time_info, status):
        """Called by sounddevice for each audio chunk."""
        if self._recording:
            self._frames.append(indata.copy())

    def start(self):
        """Start recording from the default microphone."""
        self._frames = []
        self._recording = True
        self._stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=DTYPE,
            callback=self._callback,
        )
        self._stream.start()

    def stop(self) -> bytes:
        """
        Stop recording and return captured audio as WAV bytes.
        Returns empty WAV bytes if nothing was recorded.
        """
        self._recording = False
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None

        if not self._frames:
            return _empty_wav(self.sample_rate, self.channels)

        # Concatenate all captured frames into a single numpy array
        audio_data = np.concatenate(self._frames, axis=0)

        # Convert float32 [-1, 1] to int16 PCM for WAV file
        pcm_int16 = (audio_data * 32767).astype(np.int16)

        # Prepend 150ms of silence to compensate for mic stream warmup.
        # The first ~100ms of audio is often missed as the stream initialises,
        # which causes Whisper to miss the first word. Padding with silence
        # gives Whisper correct timing context without affecting transcription.
        pad_samples = int(self.sample_rate * 0.15)
        silence_pad = np.zeros(pad_samples, dtype=np.int16)
        pcm_int16 = np.concatenate([silence_pad, pcm_int16.flatten()])

        return _numpy_to_wav(pcm_int16, self.sample_rate, self.channels)


def _numpy_to_wav(pcm_int16: np.ndarray, sample_rate: int, channels: int) -> bytes:
    """Convert a int16 numpy array to WAV bytes in memory."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_int16.tobytes())
    return buf.getvalue()


def _empty_wav(sample_rate: int, channels: int) -> bytes:
    """Return a minimal valid (silent) WAV file."""
    silence = np.zeros((0,), dtype=np.int16)
    return _numpy_to_wav(silence, sample_rate, channels)
