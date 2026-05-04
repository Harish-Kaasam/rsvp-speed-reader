/**
 * electron/main.js
 * Purpose: Electron main process entry point. Creates the BrowserWindow,
 *          manages app lifecycle, handles all IPC calls for settings,
 *          bookmarks, file dialogs, and session persistence.
 * Exports: None (main process entry point)
 * Dependencies: electron, path, fs, ./store (via require from src/main)
 */

'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────
const WIN_WIDTH      = 1000;
const WIN_HEIGHT     = 700;
const WIN_MIN_WIDTH  = 800;
const WIN_MIN_HEIGHT = 600;
const DEV_URL        = 'http://localhost:5173';
const IS_DEV         = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ─── Resolve paths ─────────────────────────────────────────────────────────
// electron/main.js lives in the electron/ folder.
// In production: __dirname = resources/app/electron/ (inside asar)
// dist/index.html is at: __dirname/../dist/index.html
const DIST_INDEX   = path.join(__dirname, '../dist/index.html');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const ICON_PATH    = path.join(__dirname, '../assets/icon.ico');

/** @type {BrowserWindow|null} */
let mainWindow = null;

// ─── electron-store (loaded from src/main for backwards compat) ───────────
// Inline store initialization to avoid cross-folder require issues
let Store;
let store;
try {
  Store = require('electron-store');
  store = new Store({
    name: 'rsvp-reader-config',
    defaults: {
      settings: {
        wpm: 300, chunkSize: 1, fontSize: 36, fontFamily: 'system',
        theme: 'dark', focusColour: '#e53935', displayWidth: 'medium',
        speedVariability: true, pauseAtSentences: true, pauseAtParagraphs: true,
        skipStopwords: false,
        stopwords: ['the','a','an','is','are','was','were','of','in','to','it'],
      },
      bookmarks: [],
      lastSession: { textHash: null, position: 0 },
    },
  });
} catch (e) {
  console.error('electron-store failed to load:', e.message);
  // Fallback in-memory store
  const memStore = {};
  store = {
    get: (k, d) => memStore[k] ?? d,
    set: (k, v) => { memStore[k] = v; },
  };
}

// ─── Window creation ─────────────────────────────────────────────────────────

/**
 * Creates and configures the main BrowserWindow.
 * Loads the Vite dev server in development or the built index.html in production.
 * @returns {BrowserWindow}
 */
function createWindow() {
  const iconExists = fs.existsSync(ICON_PATH);

  mainWindow = new BrowserWindow({
    width:     WIN_WIDTH,
    height:    WIN_HEIGHT,
    minWidth:  WIN_MIN_WIDTH,
    minHeight: WIN_MIN_HEIGHT,
    title:     'RSVP Speed Reader',
    show:      false,                     // show after ready-to-show
    backgroundColor: '#0f0f0f',
    icon:      iconExists ? ICON_PATH : undefined,
    webPreferences: {
      nodeIntegration:  false,            // SECURITY: no Node in renderer
      contextIsolation: true,             // SECURITY: isolated context
      sandbox:          false,            // needed for preload require()
      preload:          PRELOAD_PATH,
    },
  });

  // ── Remove default menu bar ──────────────────────────────────────────────
  Menu.setApplicationMenu(null);

  // ── Load URL or file ────────────────────────────────────────────────────
  if (IS_DEV) {
    mainWindow.loadURL(DEV_URL).catch((err) => {
      console.error('Failed to load dev URL:', err.message);
    });
    // Open DevTools detached in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(DIST_INDEX).catch((err) => {
      // Show a user-friendly error dialog if the production build is missing
      dialog.showErrorBox(
        'RSVP Speed Reader — Load Error',
        `Could not load the application files.\n\nExpected: ${DIST_INDEX}\n\nError: ${err.message}\n\nPlease reinstall the application.`
      );
      app.quit();
    });
  }

  // ── Show only when fully rendered (prevents white flash) ────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked with no windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

/**
 * Returns all persisted settings from electron-store.
 * @returns {Object} Settings object
 */
ipcMain.handle('load-settings', async () => {
  return store.get('settings');
});

/**
 * Saves settings object to electron-store.
 * @param {Electron.IpcMainInvokeEvent} _ - IPC event (unused)
 * @param {Object} settings - Full settings object
 * @returns {{ success: boolean }}
 */
ipcMain.handle('save-settings', async (_, settings) => {
  store.set('settings', settings);
  return { success: true };
});

/**
 * Returns all saved bookmarks.
 * @returns {Array} Bookmarks array
 */
ipcMain.handle('load-bookmarks', async () => {
  return store.get('bookmarks', []);
});

/**
 * Saves bookmarks array to electron-store.
 * @param {Electron.IpcMainInvokeEvent} _ - IPC event (unused)
 * @param {Array} bookmarks
 * @returns {{ success: boolean }}
 */
ipcMain.handle('save-bookmarks', async (_, bookmarks) => {
  store.set('bookmarks', bookmarks);
  return { success: true };
});

/**
 * Returns last session data (text hash + word position).
 * @returns {{ textHash: string|null, position: number }}
 */
ipcMain.handle('load-last-session', async () => {
  return store.get('lastSession', { textHash: null, position: 0 });
});

/**
 * Saves last reading session.
 * @param {Electron.IpcMainInvokeEvent} _ - IPC event (unused)
 * @param {{ textHash: string, position: number }} session
 * @returns {{ success: boolean }}
 */
ipcMain.handle('save-last-session', async (_, session) => {
  store.set('lastSession', session);
  return { success: true };
});

/**
 * Returns the current app version from package.json.
 * @returns {string} Version string
 */
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

/**
 * Opens a native OS file dialog filtered to .txt and .pdf files.
 * @returns {string|null} Selected file path, or null if cancelled
 */
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Text or PDF File',
    filters: [
      { name: 'Readable Files', extensions: ['txt', 'pdf'] },
      { name: 'Text Files',     extensions: ['txt'] },
      { name: 'PDF Files',      extensions: ['pdf'] },
      { name: 'All Files',      extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

/**
 * Reads a file from disk.
 * Returns ArrayBuffer for .pdf files, UTF-8 string for .txt files.
 * @param {Electron.IpcMainInvokeEvent} _ - IPC event (unused)
 * @param {string} filePath - Absolute path to the file
 * @returns {ArrayBuffer|string}
 */
ipcMain.handle('read-file', async (_, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      const buf = fs.readFileSync(filePath);
      // Transfer the buffer as a plain ArrayBuffer (serialisable over IPC)
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read file "${path.basename(filePath)}": ${err.message}`);
  }
});
