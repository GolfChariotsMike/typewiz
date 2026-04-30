/**
 * main.js — Electron main process for TypeWiz
 *
 * Responsibilities:
 *  - Spawn and manage the Python core daemon (stdin/stdout JSON IPC)
 *  - Register global hotkey (hold to record, release to transcribe)
 *  - System tray icon with Settings and Quit
 *  - Show overlay during recording
 *  - Auto-restart Python process on crash
 *  - Open settings on first launch
 */

"use strict";

const {
  app,
  globalShortcut,
  ipcMain,
  Notification,
  dialog,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Lazy-require modules that need app to be ready
let Store;
let store;
let trayModule;
let settingsModule;
let overlayModule;

// ---------------------------------------------------------------------------
// Config — loaded after app is ready
// ---------------------------------------------------------------------------
const DEFAULTS = {
  hotkey: "RAlt",
  model: "base",
  licenseKey: "",
  firstLaunch: true,
};

// ---------------------------------------------------------------------------
// Python process management
// ---------------------------------------------------------------------------
let pythonProcess = null;
let pythonReady = false;
let restartTimer = null;
const MAX_RESTART_ATTEMPTS = 5;
let restartCount = 0;

/**
 * Resolve the path to the Python core directory.
 * In packaged builds, extraResources puts "core" next to the app.
 * In dev, it's at ../../core relative to this file.
 */
function getPythonCorePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "core");
  }
  return path.join(__dirname, "..", "..", "core");
}

/**
 * Find the Python executable. On Windows, prefer python.exe in the venv
 * created by install.bat, otherwise fall back to system python.
 */
function getPythonExecutable() {
  const corePath = getPythonCorePath();

  // Check for bundled venv (created by install.bat)
  const venvPython = path.join(corePath, "venv", "Scripts", "python.exe");
  if (fs.existsSync(venvPython)) return venvPython;

  // System python
  return process.platform === "win32" ? "python" : "python3";
}

/** Send a JSON command to the Python daemon. */
function sendCommand(cmd) {
  if (!pythonProcess || !pythonReady) {
    console.warn("[TypeWiz] Python not ready, dropping command:", cmd);
    return;
  }
  const line = JSON.stringify(cmd) + "\n";
  pythonProcess.stdin.write(line);
}

/** Handle a parsed JSON event from the Python daemon. */
function handlePythonEvent(event) {
  const { event: name, text, message } = event;

  switch (name) {
    case "ready":
      pythonReady = true;
      restartCount = 0;
      trayModule && trayModule.setStatus("Ready");
      console.log("[TypeWiz] Python core ready.");
      break;

    case "recording_started":
      overlayModule && overlayModule.showListening();
      break;

    case "transcription":
      overlayModule && overlayModule.showTranscribing();
      overlayModule && overlayModule.hideAfter(600);
      if (text) {
        console.log("[TypeWiz] Transcribed:", text);
        // Python core already injected the text via pyautogui
      }
      break;

    case "status":
      console.log("[TypeWiz] Status:", message);
      break;

    case "error":
      console.error("[TypeWiz] Python error:", message);
      overlayModule && overlayModule.hideAfter(0);
      break;

    default:
      console.log("[TypeWiz] Python event:", name, event);
  }
}

/** Spawn the Python core daemon. */
function startPython() {
  const pythonExe = getPythonExecutable();
  const corePath = getPythonCorePath();
  const mainScript = path.join(corePath, "main.py");

  if (!fs.existsSync(mainScript)) {
    dialog.showErrorBox(
      "TypeWiz — Setup Required",
      `Python core not found at:\n${mainScript}\n\nPlease run install.bat first.`
    );
    app.quit();
    return;
  }

  console.log(`[TypeWiz] Starting Python: ${pythonExe} ${mainScript}`);

  pythonProcess = spawn(pythonExe, [mainScript], {
    cwd: corePath,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  let lineBuffer = "";

  pythonProcess.stdout.on("data", (chunk) => {
    lineBuffer += chunk.toString("utf8");
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop(); // incomplete last line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        handlePythonEvent(event);
      } catch (e) {
        console.log("[TypeWiz] Python stdout (non-JSON):", trimmed);
      }
    }
  });

  pythonProcess.stderr.on("data", (chunk) => {
    console.error("[TypeWiz] Python stderr:", chunk.toString().trim());
  });

  pythonProcess.on("exit", (code, signal) => {
    console.warn(`[TypeWiz] Python exited (code=${code}, signal=${signal})`);
    pythonReady = false;
    pythonProcess = null;

    if (restartCount < MAX_RESTART_ATTEMPTS) {
      restartCount++;
      const delay = Math.min(1000 * restartCount, 10000);
      console.log(`[TypeWiz] Restarting Python in ${delay}ms (attempt ${restartCount})...`);
      restartTimer = setTimeout(startPython, delay);
    } else {
      dialog.showErrorBox(
        "TypeWiz — Core Crash",
        "The TypeWiz Python core crashed repeatedly and could not restart.\nPlease re-run install.bat and restart the app."
      );
    }
  });

  // Send initial config once Python is ready (it will emit "ready" event)
  // Config is sent via set_config after the ready event is received in handlePythonEvent
}

/** Stop the Python process gracefully. */
function stopPython() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
  restartCount = MAX_RESTART_ATTEMPTS; // prevent auto-restart
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
  pythonReady = false;
}

// ---------------------------------------------------------------------------
// Hotkey management
// ---------------------------------------------------------------------------
let registeredHotkey = null;
let isRecording = false;

/** Map our stored hotkey names to Electron accelerator strings. */
function toAccelerator(hotkey) {
  const map = {
    RAlt: "AltRight",          // Electron uses AltRight for Right Alt
    "CmdOrCtrl+Space": "CmdOrCtrl+Space",
    "CmdOrCtrl+Super": "CmdOrCtrl+Super",
    F13: "F13",
  };
  return map[hotkey] || hotkey;
}

function registerHotkey(hotkey) {
  // Unregister previous hotkey
  if (registeredHotkey) {
    globalShortcut.unregister(registeredHotkey);
    registeredHotkey = null;
  }

  const accelerator = toAccelerator(hotkey);

  // Electron's globalShortcut fires on key-down only (no key-up event).
  // We simulate hold-to-record by toggling state on each press.
  const success = globalShortcut.register(accelerator, () => {
    if (!pythonReady) return;

    if (!isRecording) {
      isRecording = true;
      sendCommand({ cmd: "start_recording" });
    } else {
      isRecording = false;
      sendCommand({ cmd: "stop_recording" });
    }
  });

  if (success) {
    registeredHotkey = accelerator;
    console.log(`[TypeWiz] Hotkey registered: ${accelerator}`);
  } else {
    console.error(`[TypeWiz] Failed to register hotkey: ${accelerator}`);
    dialog.showMessageBox({
      type: "warning",
      title: "TypeWiz — Hotkey Conflict",
      message: `Could not register hotkey "${hotkey}". It may be in use by another app.\nPlease change it in Settings.`,
    });
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  // User opened a second instance — open settings instead
  if (settingsModule) {
    settingsModule.openSettings(store, onSettingsSave);
  }
});

// Don't show in taskbar (tray-only app)
app.setAppUserModelId("ai.typewiz.app");

app.on("ready", async () => {
  // Prevent app from quitting when all windows are closed (tray app)
  app.on("window-all-closed", (e) => e.preventDefault());

  // Load modules now that app is ready
  Store = require("electron-store");
  store = new Store({ defaults: DEFAULTS });

  trayModule = require("./tray");
  settingsModule = require("./settings");
  overlayModule = require("./overlay");

  // Register IPC handlers for settings
  settingsModule.registerIpcHandlers(store, onSettingsSave);

  // Create system tray
  trayModule.createTray({
    onSettings: () => settingsModule.openSettings(store, onSettingsSave),
    onQuit: () => {
      stopPython();
      trayModule.destroy();
      overlayModule.destroy();
      globalShortcut.unregisterAll();
      app.exit(0);
    },
  });

  // Register configured hotkey
  registerHotkey(store.get("hotkey", "RAlt"));

  // Start the Python daemon
  startPython();

  // Open settings on first launch
  if (store.get("firstLaunch", true)) {
    store.set("firstLaunch", false);
    settingsModule.openSettings(store, onSettingsSave);
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopPython();
});

// ---------------------------------------------------------------------------
// Settings save handler
// ---------------------------------------------------------------------------

function onSettingsSave(config) {
  console.log("[TypeWiz] Settings saved:", config);

  // Re-register hotkey if changed
  if (config.hotkey !== registeredHotkey) {
    registerHotkey(config.hotkey);
  }

  // Notify Python of model change
  if (config.model) {
    sendCommand({ cmd: "set_config", model: config.model });
  }
}
