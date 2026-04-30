/**
 * tray.js — System tray icon and menu for TypeWiz
 *
 * Manages the tray icon lifecycle. The icon is a base64-encoded PNG
 * so no external file I/O is required at runtime.
 */

const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");

let tray = null;

// Purple microphone SVG rendered as a 32x32 PNG (base64 encoded inline)
// Generated from assets/icon.svg during build; fallback to a generated image.
function getTrayIcon() {
  try {
    const iconPath = path.join(__dirname, "..", "assets", "icon.png");
    return nativeImage.createFromPath(iconPath);
  } catch (_e) {
    // Fallback: 1x1 transparent pixel — Electron requires a valid image
    return nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
  }
}

/**
 * Create the system tray icon and context menu.
 *
 * @param {object} handlers
 * @param {Function} handlers.onSettings  — called when "Settings" is clicked
 * @param {Function} handlers.onQuit      — called when "Quit" is clicked
 * @returns {Tray}
 */
function createTray({ onSettings, onQuit }) {
  if (tray) return tray;

  const icon = getTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("TypeWiz — Hold hotkey to dictate");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "TypeWiz Running",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Settings",
      click: onSettings,
    },
    { type: "separator" },
    {
      label: "Quit TypeWiz",
      click: onQuit,
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Left-click on tray icon opens settings (Windows convention)
  tray.on("click", onSettings);

  return tray;
}

/** Update the tray tooltip to reflect current state. */
function setStatus(message) {
  if (tray) {
    tray.setToolTip(`TypeWiz — ${message}`);
  }
}

/** Destroy the tray icon (call before app quit). */
function destroy() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, setStatus, destroy };
