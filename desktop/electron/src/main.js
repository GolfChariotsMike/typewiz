/**
 * main.js — Electron main process for TypeWiz
 *
 * Hotkey handling is done entirely in Python (keyboard lib supports true
 * keydown/keyup events). Electron just manages the tray, overlay, and
 * passes config to Python.
 */

"use strict";

const {
  app,
  ipcMain,
  Notification,
  dialog,
} = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

let Store;
let store;
let trayModule;
let settingsModule;
let overlayModule;

const DEFAULTS = {
  hotkey: "ctrl+windows",
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
let intentionalQuit = false;

function getPythonCorePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "core");
  }
  return path.join(__dirname, "..", "..", "core");
}

function getPythonExecutable() {
  const corePath = getPythonCorePath();
  // Packaged: use compiled PyInstaller exe
  const compiledExe = path.join(corePath, "typewiz-core.exe");
  if (fs.existsSync(compiledExe)) return compiledExe;
  // Dev: use venv or system Python
  const venvPython = path.join(corePath, "..", "core", "venv", "Scripts", "python.exe");
  if (fs.existsSync(venvPython)) return venvPython;
  return process.platform === "win32" ? "python" : "python3";
}

function sendCommand(cmd) {
  if (!pythonProcess || !pythonReady) {
    console.warn("[TypeWiz] Python not ready, dropping command:", cmd);
    return;
  }
  pythonProcess.stdin.write(JSON.stringify(cmd) + "\n");
}

function handlePythonEvent(event) {
  const { event: name, text, message } = event;
  switch (name) {
    case "ready":
      pythonReady = true;
      restartCount = 0;
      trayModule && trayModule.setStatus("Ready");
      overlayModule && overlayModule.showReady();
      console.log("[TypeWiz] Python core ready.");
      // Open settings on very first launch so user knows the app is running
      if (store && store.get("firstLaunch", true)) {
        store.set("firstLaunch", false);
        setTimeout(() => settingsModule && settingsModule.openSettings(store, onSettingsSave), 500);
      }
      // Send saved config (hotkey + model) to Python on startup
      sendCommand({
        cmd: "set_config",
        hotkey: store.get("hotkey", "ctrl+windows"),
        model: store.get("model", "base"),
      });
      break;

    case "recording_started":
      overlayModule && overlayModule.showListening();
      trayModule && trayModule.setStatus("Recording...");
      break;

    case "transcription":
      overlayModule && overlayModule.showTranscribing();
      overlayModule && overlayModule.hideAfter(600);
      trayModule && trayModule.setStatus("Ready");
      if (text) console.log("[TypeWiz] Transcribed:", text);
      break;

    case "status":
      console.log("[TypeWiz] Status:", message);
      break;

    case "error":
      console.error("[TypeWiz] Python error:", message);
      overlayModule && overlayModule.hideAfter(0);
      trayModule && trayModule.setStatus("Ready");
      break;

    default:
      console.log("[TypeWiz] Python event:", name, event);
  }
}

function startPython() {
  const pythonExe = getPythonExecutable();
  const corePath = getPythonCorePath();
  const mainScript = path.join(corePath, "main.py");

  const compiledExe = path.join(corePath, "typewiz-core.exe");
  if (!fs.existsSync(compiledExe) && !fs.existsSync(mainScript)) {
    dialog.showErrorBox(
      "TypeWiz — Setup Required",
      `TypeWiz core not found at:\n${corePath}\n\nPlease reinstall TypeWiz.`
    );
    app.quit();
    return;
  }

  const isCompiled = pythonExe.endsWith("typewiz-core.exe");
  const args = isCompiled ? [] : [mainScript];
  console.log(`[TypeWiz] Starting core: ${pythonExe}`, args);

  pythonProcess = spawn(pythonExe, args, {
    cwd: corePath,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  let lineBuffer = "";

  pythonProcess.stdout.on("data", (chunk) => {
    lineBuffer += chunk.toString("utf8");
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        handlePythonEvent(JSON.parse(trimmed));
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
    // Don't restart or show error if we quit intentionally
    if (intentionalQuit) return;
    if (restartCount < MAX_RESTART_ATTEMPTS) {
      restartCount++;
      const delay = Math.min(1000 * restartCount, 10000);
      console.log(`[TypeWiz] Restarting Python in ${delay}ms (attempt ${restartCount})...`);
      restartTimer = setTimeout(startPython, delay);
    } else {
      dialog.showErrorBox(
        "TypeWiz — Core Crash",
        "The TypeWiz Python core crashed repeatedly.\nPlease re-run install.bat and restart the app."
      );
    }
  });
}

function stopPython() {
  intentionalQuit = true;
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
  restartCount = MAX_RESTART_ATTEMPTS;
  if (pythonProcess) { pythonProcess.kill(); pythonProcess = null; }
  pythonReady = false;
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

app.on("second-instance", () => {
  if (settingsModule) settingsModule.openSettings(store, onSettingsSave);
});

app.setAppUserModelId("ai.typewiz.app");

app.on("ready", async () => {
  app.on("window-all-closed", (e) => e.preventDefault());

  Store = require("electron-store");
  store = new Store({ defaults: DEFAULTS });

  trayModule = require("./tray");
  settingsModule = require("./settings");
  overlayModule = require("./overlay");

  settingsModule.registerIpcHandlers(store, onSettingsSave);

  trayModule.createTray({
    onSettings: () => settingsModule.openSettings(store, onSettingsSave),
    onQuit: () => {
      stopPython();
      trayModule.destroy();
      overlayModule.destroy();
      app.exit(0);
    },
  });

  startPython();

  // firstLaunch is now handled in the Python "ready" handler so the pill is visible first
});

app.on("will-quit", () => { stopPython(); });

// ---------------------------------------------------------------------------
// Settings save handler
// ---------------------------------------------------------------------------
function onSettingsSave(config) {
  console.log("[TypeWiz] Settings saved:", config);
  // Push new config to Python (it re-registers the hotkey)
  sendCommand({
    cmd: "set_config",
    hotkey: config.hotkey,
    language: config.language || "en",
    model: config.model,
  });
}
