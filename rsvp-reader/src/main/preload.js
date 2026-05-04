/**
 * src/main/preload.js
 * Purpose: Electron preload script that safely exposes main-process APIs
 *          to the renderer via contextBridge. No Node.js APIs are directly
 *          exposed — all communication goes through typed IPC channels.
 * Exports: window.electronAPI (object with all safe API methods)
 * Dependencies: electron (contextBridge, ipcRenderer)
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * The electronAPI object exposed on window in the renderer process.
 * All methods return Promises. No raw IPC channels are exposed.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Loads persisted settings from electron-store.
   * @returns {Promise<Object>} Settings object with all user preferences
   */
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  /**
   * Saves settings to electron-store for persistence across sessions.
   * @param {Object} settings - The complete settings object to save
   * @returns {Promise<{success: boolean}>}
   */
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  /**
   * Loads all user bookmarks from electron-store.
   * @returns {Promise<Array>} Array of bookmark objects
   */
  loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),

  /**
   * Saves bookmarks array to electron-store.
   * @param {Array} bookmarks - Array of bookmark objects to persist
   * @returns {Promise<{success: boolean}>}
   */
  saveBookmarks: (bookmarks) => ipcRenderer.invoke('save-bookmarks', bookmarks),

  /**
   * Loads last reading session (text hash + word position).
   * @returns {Promise<{textHash: string|null, position: number}>}
   */
  loadLastSession: () => ipcRenderer.invoke('load-last-session'),

  /**
   * Saves current reading session for resume functionality.
   * @param {{textHash: string, position: number}} session
   * @returns {Promise<{success: boolean}>}
   */
  saveLastSession: (session) => ipcRenderer.invoke('save-last-session', session),

  /**
   * Returns the application version string from package.json.
   * @returns {Promise<string>} Version string (e.g., "1.0.0")
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * Opens a native OS file dialog filtered to .txt and .pdf files.
   * @returns {Promise<string|null>} Selected file path, or null if cancelled
   */
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  /**
   * Reads a file from the given absolute path.
   * Returns ArrayBuffer for .pdf files, string for .txt files.
   * @param {string} filePath - Absolute path to file
   * @returns {Promise<ArrayBuffer|string>}
   */
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
