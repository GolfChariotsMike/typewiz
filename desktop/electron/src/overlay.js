/**
 * overlay.js - Persistent floating pill for TypeWiz
 * Always visible. Idle / listening / transcribing states. Draggable.
 */

const { BrowserWindow, screen } = require("electron");

let overlayWindow = null;

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: transparent;
    overflow: hidden;
    font-family: -apple-system, "Segoe UI", sans-serif;
    user-select: none;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px 6px 9px;
    border-radius: 999px;
    background: rgba(20, 20, 28, 0.80);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow: none;
    -webkit-app-region: drag;
    cursor: grab;
    white-space: nowrap;
    transition: background 0.25s, border-color 0.25s;
  }
  .pill.listening    { background: rgba(200,30,30,0.82); border-color: rgba(255,255,255,0.18); }
  .pill.transcribing { background: rgba(20,20,28,0.90); border-color: rgba(139,92,246,0.45); }
  .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: rgba(255,255,255,0.28);
    flex-shrink: 0;
    transition: background 0.25s;
  }
  .listening .dot    { background: #fff; animation: blink 0.75s ease-in-out infinite; }
  .transcribing .dot { display: none; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .bars { display: none; align-items: center; gap: 2px; height: 14px; }
  .listening .bars { display: flex; }
  .bar { width: 3px; border-radius: 2px; background: rgba(255,255,255,0.9); animation: wave 0.55s ease-in-out infinite; }
  .bar:nth-child(1){animation-delay:0s;   height:5px}
  .bar:nth-child(2){animation-delay:0.1s; height:11px}
  .bar:nth-child(3){animation-delay:0.2s; height:7px}
  .bar:nth-child(4){animation-delay:0.15s;height:13px}
  .bar:nth-child(5){animation-delay:0.05s;height:5px}
  @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.25)} }
  .spinner { display:none; width:11px; height:11px; border:1.5px solid rgba(139,92,246,0.3); border-top-color:#a78bfa; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
  .transcribing .spinner { display:block; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .label { font-size:11.5px; font-weight:500; color:rgba(255,255,255,0.65); letter-spacing:0.01em; transition:color 0.25s; }
  .listening .label    { color:#fff; }
  .transcribing .label { color:#c4b5fd; }
</style>
</head>
<body>
<div class="pill" id="pill">
  <div class="dot"></div>
  <div class="spinner"></div>
  <div class="bars">
    <div class="bar"></div><div class="bar"></div><div class="bar"></div>
    <div class="bar"></div><div class="bar"></div>
  </div>
  <div class="label" id="lbl">TypeWiz</div>
</div>
<script>
  window.setState = (state, text) => {
    document.getElementById('pill').className = 'pill' + (state ? ' ' + state : '');
    document.getElementById('lbl').textContent = text || 'TypeWiz';
  };
</script>
</body>
</html>`;

function getInitialPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { x: Math.round(width / 2) - 70, y: height - 72 };
}

function createOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow;

  const pos = getInitialPosition();

  overlayWindow = new BrowserWindow({
    width: 160,
    height: 38,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(HTML));
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  // Allow dragging
  overlayWindow.setIgnoreMouseEvents(false);

  overlayWindow.on("closed", () => { overlayWindow = null; });

  return overlayWindow;
}

function _setState(state, text) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const js = `window.setState(${JSON.stringify(state)}, ${JSON.stringify(text)})`;
  overlayWindow.webContents.executeJavaScript(js).catch(() => {});
}

function showReady() {
  const win = createOverlay();
  win.showInactive();
  _setState(null, "TypeWiz");
}

function showListening() {
  createOverlay().showInactive();
  _setState("listening", "Listening...");
}

function showTranscribing() {
  _setState("transcribing", "Transcribing...");
}

function hideAfter(delayMs) {
  setTimeout(() => { _setState(null, "TypeWiz"); }, delayMs || 600);
}

function destroy() {
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close();
  overlayWindow = null;
}

module.exports = { showReady, showListening, showTranscribing, hideAfter, destroy };
