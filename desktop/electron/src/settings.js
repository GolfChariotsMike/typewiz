/**
 * settings.js — Settings window manager for TypeWiz
 *
 * Opens the settings HTML page in a dedicated BrowserWindow.
 * Communicates with the main process via ipcMain/ipcRenderer.
 */

const { BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

let settingsWindow = null;

/**
 * Open (or focus) the settings window.
 *
 * @param {object} store  — electron-store instance for persisted config
 * @param {Function} onSave  — callback(config) invoked when user saves
 */
function openSettings(store, onSave) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 560,
    title: "TypeWiz Settings",
    resizable: false,
    minimizable: false,
    maximizable: false,
    center: true,
    show: false,
    backgroundColor: "#0f0f17",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, "settings.html"));

  settingsWindow.once("ready-to-show", () => {
    // Send current config to the renderer
    const config = {
      mode: store.get("mode", "cloud"),
      apiKey: store.get("apiKey", ""),
      hotkey: store.get("hotkey", "ctrl+windows"),
      language: store.get("language", "en"),
      model: store.get("model", "small"),
      licenseKey: store.get("licenseKey", ""),
    };
    settingsWindow.webContents.send("load-config", config);
    settingsWindow.show();
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

/**
 * Register IPC handlers for settings window communication.
 * Call once during app startup.
 *
 * @param {object} store  — electron-store instance
 * @param {Function} onSave  — callback(config) when settings are saved
 */
function registerIpcHandlers(store, onSave) {
  // Save settings from renderer
  ipcMain.on("save-settings", (_event, config) => {
    store.set("mode", config.mode || "cloud");
    store.set("apiKey", config.apiKey || "");
    store.set("hotkey", config.hotkey);
    store.set("language", config.language || "en");
    store.set("model", config.model);
    store.set("licenseKey", config.licenseKey);
    if (typeof onSave === "function") onSave(config);
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
  });

  // Open typewiz.ai in the user's default browser
  ipcMain.on("open-account", () => {
    shell.openExternal("https://typewiz.ai");
  });

  // Activate license key (placeholder — implement API call when ready)
  ipcMain.on("activate-license", (_event, key) => {
    // TODO: POST to https://typewiz.ai/api/activate with { key }
    // For now just store it
    store.set("licenseKey", key);
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send("license-result", {
        success: true,
        message: "License key saved.",
      });
    }
  });

  // Renderer requests current config
  ipcMain.handle("get-config", () => ({
    mode: store.get("mode", "cloud"),
    apiKey: store.get("apiKey", ""),
    hotkey: store.get("hotkey", "ctrl+windows"),
    language: store.get("language", "en"),
    model: store.get("model", "small"),
    licenseKey: store.get("licenseKey", ""),
  }));
}

/** Close the settings window if it's open. */
function close() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
}

module.exports = { openSettings, registerIpcHandlers, close };
