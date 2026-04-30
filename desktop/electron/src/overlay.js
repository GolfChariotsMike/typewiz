/**
 * overlay.js — Translucent recording indicator for TypeWiz
 *
 * Shows a small "Listening..." badge in the bottom-right corner of the
 * primary display when recording is active. Automatically hides once
 * transcription is complete.
 */

const { BrowserWindow, screen, nativeImage } = require("electron");
const path = require("path");

let overlayWindow = null;

/**
 * Create (or reuse) the overlay window.
 * The window is frameless, always-on-top, transparent, and non-interactive.
 */
function createOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 220,
    height: 60,
    x: width - 240,
    y: height - 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    movable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load inline HTML (no file I/O needed for this tiny UI)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: rgba(20, 20, 30, 0.88);
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.6);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          height: 60px;
          font-family: -apple-system, "Segoe UI", sans-serif;
          color: #fff;
          -webkit-app-region: no-drag;
          user-select: none;
        }
        .mic {
          font-size: 22px;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .label {
          font-size: 14px;
          font-weight: 500;
          color: #c4b5fd;
          letter-spacing: 0.02em;
        }
        .sub {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="mic">🎙️</div>
      <div>
        <div class="label" id="label">Listening...</div>
        <div class="sub" id="sub">Release hotkey to transcribe</div>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        // Allow main process to update label text
        window.addEventListener('message', (e) => {
          if (e.data.label) document.getElementById('label').textContent = e.data.label;
          if (e.data.sub !== undefined) document.getElementById('sub').textContent = e.data.sub;
        });
      </script>
    </body>
    </html>
  `;

  overlayWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  // Keep window position locked to bottom-right
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.hide();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

/** Show the overlay in "Listening..." state. */
function showListening() {
  const win = createOverlay();
  win.showInactive();
}

/** Update overlay to "Transcribing..." state. */
function showTranscribing() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  overlayWindow.webContents.executeJavaScript(`
    document.getElementById('label').textContent = 'Transcribing...';
    document.getElementById('sub').textContent = '';
  `).catch(() => {});
}

/** Hide the overlay after a brief delay (ms). */
function hideAfter(delayMs = 800) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  }, delayMs);
}

/** Destroy the overlay window entirely. */
function destroy() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  overlayWindow = null;
}

module.exports = { showListening, showTranscribing, hideAfter, destroy };
