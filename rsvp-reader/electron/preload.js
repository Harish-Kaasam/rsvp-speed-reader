/**
 * electron/preload.js
 * Purpose: Secure contextBridge preload script. Exposes only a minimal,
 *          safe API to the renderer process. No raw Node.js APIs are exposed.
 * Exports: window.electronAPI (via contextBridge)
 * Dependencies: electron (contextBridge, ipcRenderer)
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a safe subset of Electron/Node APIs to the renderer.
 * All values are read-only; no arbitrary IPC channels are exposed.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Current OS platform string (e.g. "win32", "darwin", "linux") */
  platform: process.platform,

  /** Electron and Node version info */
  versions: {
    node:     process.versions.node,
    chrome:   process.versions.chrome,
    electron: process.versions.electron,
  },

  /**
   * Loads persisted settings from electron-store.
   * @returns {Promise<Object>}
   */
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  /**
   * Saves settings to electron-store.
   * @param {Object} settings
   * @returns {Promise<{success: boolean}>}
   */
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  /**
   * Loads all bookmarks from electron-store.
   * @returns {Promise<Array>}
   */
  loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),

  /**
   * Saves bookmarks to electron-store.
   * @param {Array} bookmarks
   * @returns {Promise<{success: boolean}>}
   */
  saveBookmarks: (bookmarks) => ipcRenderer.invoke('save-bookmarks', bookmarks),

  /**
   * Loads last session data (text hash + position).
   * @returns {Promise<{textHash: string|null, position: number}>}
   */
  loadLastSession: () => ipcRenderer.invoke('load-last-session'),

  /**
   * Saves current session for resume functionality.
   * @param {{textHash: string, position: number}} session
   * @returns {Promise<{success: boolean}>}
   */
  saveLastSession: (session) => ipcRenderer.invoke('save-last-session', session),

  /**
   * Returns the application version string.
   * @returns {Promise<string>}
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * Opens a native file picker dialog.
   * @returns {Promise<string|null>} Selected file path or null
   */
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  /**
   * Reads a file from disk. Returns ArrayBuffer for PDF, string for TXT.
   * @param {string} filePath
   * @returns {Promise<ArrayBuffer|string>}
   */
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
