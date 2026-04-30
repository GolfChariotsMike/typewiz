@echo off
REM ============================================================
REM  TypeWiz — Windows Setup Script
REM  Checks Python, installs dependencies, downloads Whisper model
REM ============================================================

setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "CORE_DIR=%SCRIPT_DIR%core"
set "VENV_DIR=%CORE_DIR%\venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

echo.
echo  ██████████████████████████████████
echo   TypeWiz — Setup
echo  ██████████████████████████████████
echo.

REM --- 1. Check Python ---
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo Make sure to tick "Add Python to PATH" during installation.
    pause
    exit /b 1
)

for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python found: %PYVER%

REM --- 2. Create virtual environment ---
if not exist "%VENV_DIR%" (
    echo.
    echo [SETUP] Creating virtual environment...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
) else (
    echo [OK] Virtual environment already exists.
)

REM --- 3. Install Python dependencies ---
echo.
echo [SETUP] Installing Python dependencies...
echo         This may take a few minutes on first run.
echo.

"%VENV_PYTHON%" -m pip install --upgrade pip --quiet
"%VENV_PYTHON%" -m pip install -r "%CORE_DIR%\requirements.txt"
if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection and try again.
    pause
    exit /b 1
)
echo.
echo [OK] Dependencies installed.

REM --- 4. Download Whisper base model ---
echo.
echo [SETUP] Pre-downloading Whisper 'base' model (~150MB)...
echo         This only happens once. Future launches will be instant.
echo.

"%VENV_PYTHON%" -c "
import sys, os
sys.path.insert(0, r'%CORE_DIR:\=/%')
import model_manager
model_manager.configure_hf_cache()
print('Downloading model...')
model = model_manager.load_model('base')
print('Model ready.')
del model
"

if errorlevel 1 (
    echo [WARNING] Model download failed. TypeWiz will attempt to download on first use.
    echo           Make sure you have an internet connection when first running the app.
) else (
    echo [OK] Whisper model downloaded and cached.
)

REM --- 5. Done ---
echo.
echo  ============================================
echo   Setup complete!
echo.
echo   To run TypeWiz:
echo     npm install   (in the electron/ folder, one time)
echo     npm start     (in the electron/ folder)
echo.
echo   Or build the installer:
echo     npm run build (in the electron/ folder)
echo  ============================================
echo.
pause
