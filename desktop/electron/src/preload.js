/**
 * preload.js — Electron context bridge for TypeWiz renderer pages
 *
 * Exposes a minimal, safe API to renderer windows without enabling
 * full nodeIntegration (which is a security risk).
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("typewiz", {
  /** Save settings to main process / electron-store */
  saveSettings: (config) => ipcRenderer.send("save-settings", config),

  /** Open the TypeWiz account page in default browser */
  openAccount: () => ipcRenderer.send("open-account"),

  /** Activate a license key */
  activateLicense: (key) => ipcRenderer.send("activate-license", key),

  /** Get current config */
  getConfig: () => ipcRenderer.invoke("get-config"),

  /** Listen for config loaded event */
  onLoadConfig: (callback) => {
    ipcRenderer.on("load-config", (_event, config) => callback(config));
  },

  /** Listen for license activation result */
  onLicenseResult: (callback) => {
    ipcRenderer.on("license-result", (_event, result) => callback(result));
  },
});
