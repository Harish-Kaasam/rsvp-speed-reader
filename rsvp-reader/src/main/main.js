/**
 * src/main/main.js
 * Purpose: Electron main process entry point. Creates and manages the BrowserWindow,
 *          handles IPC communication, file dialogs, and app lifecycle events.
 * Exports: None (main process entry point)
 * Dependencies: electron, path, store.js
 */

'use strict';

const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { getStore } = require('./store');

// ─── Constants ────────────────────────────────────────────────────────────────
const WINDOW_MIN_WIDTH = 900;
const WINDOW_MIN_HEIGHT = 650;
const WINDOW_DEFAULT_WIDTH = 1100;
const WINDOW_DEFAULT_HEIGHT = 750;
const DEV_SERVER_URL = 'http://localhost:5173';
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged;

/** @type {BrowserWindow|null} */
let mainWindow = null;

/**
 * Creates the main application window with proper security settings.
 * @returns {BrowserWindow} The created browser window instance
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_DEFAULT_WIDTH,
    height: WINDOW_DEFAULT_HEIGHT,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hiddenInset',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../assets/icon.ico'),
  });

  // Load the app
  if (IS_DEV) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC Handlers ──────────────────────────────────────────────────────────

/**
 * Loads all persisted settings from electron-store.
 * @returns {Object} The settings object
 */
ipcMain.handle('load-settings', async () => {
  const store = getStore();
  return store.get('settings');
});

/**
 * Saves settings to electron-store.
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event
 * @param {Object} settings - The settings object to persist
 */
ipcMain.handle('save-settings', async (_event, settings) => {
  const store = getStore();
  store.set('settings', settings);
  return { success: true };
});

/**
 * Loads all bookmarks from electron-store.
 * @returns {Array} Array of bookmark objects
 */
ipcMain.handle('load-bookmarks', async () => {
  const store = getStore();
  return store.get('bookmarks', []);
});

/**
 * Saves bookmarks to electron-store.
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event
 * @param {Array} bookmarks - Array of bookmark objects to persist
 */
ipcMain.handle('save-bookmarks', async (_event, bookmarks) => {
  const store = getStore();
  store.set('bookmarks', bookmarks);
  return { success: true };
});

/**
 * Loads the last session data (text hash + position) from electron-store.
 * @returns {Object} The last session object with textHash and position
 */
ipcMain.handle('load-last-session', async () => {
  const store = getStore();
  return store.get('lastSession', { textHash: null, position: 0 });
});

/**
 * Saves the current session (text hash + position) to electron-store.
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event
 * @param {Object} session - Session object with textHash and position
 */
ipcMain.handle('save-last-session', async (_event, session) => {
  const store = getStore();
  store.set('lastSession', session);
  return { success: true };
});

/**
 * Returns the current application version from package.json.
 * @returns {string} The app version string
 */
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

/**
 * Opens a native file dialog filtered to .txt and .pdf files.
 * @returns {string|null} The selected file path, or null if cancelled
 */
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Text or PDF File',
    filters: [
      { name: 'Readable Files', extensions: ['txt', 'pdf'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

/**
 * Reads a file from disk. Returns ArrayBuffer for PDFs, string for .txt files.
 * @param {Electron.IpcMainInvokeEvent} _event - The IPC event
 * @param {string} filePath - Absolute path to the file to read
 * @returns {ArrayBuffer|string} File contents
 */
ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } else {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
});
