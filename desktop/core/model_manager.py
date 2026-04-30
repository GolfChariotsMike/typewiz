"""
model_manager.py — Whisper model download and cache management for TypeWiz.

faster-whisper uses the HuggingFace Hub to download models automatically.
This module wraps that behaviour and reports progress back via stdout JSON.
Models are cached at ~/.typewiz/models/ (pointed to via HF_HOME env var).
"""

import os
import sys
import json
import pathlib

# Supported model sizes (mapped to HuggingFace model IDs)
SUPPORTED_MODELS = {
    "tiny":  "Systran/faster-whisper-tiny",
    "base":  "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
}

DEFAULT_MODEL = "base"


def get_cache_dir() -> pathlib.Path:
    """Return the TypeWiz model cache directory, creating it if needed."""
    home = pathlib.Path.home()
    cache_dir = home / ".typewiz" / "models"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def configure_hf_cache():
    """
    Point HuggingFace Hub to the TypeWiz cache directory so models are
    downloaded there rather than the default ~/.cache/huggingface/.
    Must be called before importing faster-whisper.
    """
    cache_dir = get_cache_dir()
    os.environ.setdefault("HF_HOME", str(cache_dir))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(cache_dir / "hub"))


def emit(obj: dict):
    """Write a JSON event to stdout (flush immediately)."""
    print(json.dumps(obj), flush=True)


def is_model_cached(model_size: str) -> bool:
    """
    Check whether the given model has already been downloaded.
    faster-whisper stores models as directories inside the HF hub cache.
    """
    cache_dir = get_cache_dir() / "hub"
    if not cache_dir.exists():
        return False

    model_id = SUPPORTED_MODELS.get(model_size, SUPPORTED_MODELS[DEFAULT_MODEL])
    # HF stores models as "models--<org>--<repo>" directories
    folder_name = "models--" + model_id.replace("/", "--")
    model_path = cache_dir / folder_name
    return model_path.exists() and any(model_path.iterdir())


def load_model(model_size: str = DEFAULT_MODEL):
    """
    Load (and download if necessary) the specified faster-whisper model.
    Emits progress events to stdout so the Electron shell can show status.

    Returns the loaded WhisperModel instance.
    """
    from faster_whisper import WhisperModel  # imported late so HF env is set first

    if model_size not in SUPPORTED_MODELS:
        emit({"event": "error", "message": f"Unknown model size '{model_size}'. Choose: {list(SUPPORTED_MODELS)}"})
        model_size = DEFAULT_MODEL

    cached = is_model_cached(model_size)
    if not cached:
        emit({"event": "status", "message": f"Downloading Whisper '{model_size}' model (~150MB for base)..."})

    # faster-whisper downloads automatically on first use
    # Use CPU with int8 quantisation for broad Windows compatibility
    model = WhisperModel(
        model_size,
        device="cpu",
        compute_type="int8",
        download_root=str(get_cache_dir() / "hub"),
    )

    if not cached:
        emit({"event": "status", "message": f"Model '{model_size}' downloaded and ready."})

    return model
