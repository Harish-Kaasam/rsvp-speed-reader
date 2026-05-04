/**
 * src/main/store.js
 * Purpose: Initialises electron-store with a validated schema and default values.
 *          Provides a singleton getter so the store instance is shared across
 *          all IPC handlers in main.js.
 * Exports: getStore() → Store instance
 * Dependencies: electron-store
 */

'use strict';

const Store = require('electron-store');

// ─── Default Settings Schema ───────────────────────────────────────────────

/** @type {Object} Default application settings */
const DEFAULT_SETTINGS = {
  wpm: 300,
  chunkSize: 1,
  fontSize: 36,
  fontFamily: 'system',
  theme: 'dark',
  focusColour: '#e53935',
  displayWidth: 'medium',
  speedVariability: true,
  pauseAtSentences: true,
  pauseAtParagraphs: true,
  skipStopwords: false,
  stopwords: ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'to', 'it'],
};

/** @type {Object} electron-store JSON schema for type validation */
const SCHEMA = {
  settings: {
    type: 'object',
    properties: {
      wpm: { type: 'number', minimum: 100, maximum: 1000, default: 300 },
      chunkSize: { type: 'number', minimum: 1, maximum: 5, default: 1 },
      fontSize: { type: 'number', minimum: 16, maximum: 72, default: 36 },
      fontFamily: {
        type: 'string',
        enum: ['system', 'roboto', 'georgia', 'courier'],
        default: 'system',
      },
      theme: {
        type: 'string',
        enum: ['dark', 'light', 'sepia'],
        default: 'dark',
      },
      focusColour: { type: 'string', default: '#e53935' },
      displayWidth: {
        type: 'string',
        enum: ['narrow', 'medium', 'wide'],
        default: 'medium',
      },
      speedVariability: { type: 'boolean', default: true },
      pauseAtSentences: { type: 'boolean', default: true },
      pauseAtParagraphs: { type: 'boolean', default: true },
      skipStopwords: { type: 'boolean', default: false },
      stopwords: {
        type: 'array',
        items: { type: 'string' },
        default: ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'to', 'it'],
      },
    },
    default: DEFAULT_SETTINGS,
  },
  bookmarks: {
    type: 'array',
    default: [],
  },
  lastSession: {
    type: 'object',
    properties: {
      textHash: { type: ['string', 'null'], default: null },
      position: { type: 'number', default: 0 },
    },
    default: { textHash: null, position: 0 },
  },
};

/** @type {Store|null} Singleton store instance */
let storeInstance = null;

/**
 * Returns the singleton electron-store instance, creating it if needed.
 * Uses a validated JSON schema with default values for all settings.
 * @returns {Store} The electron-store instance
 */
function getStore() {
  if (!storeInstance) {
    storeInstance = new Store({
      name: 'rsvp-reader-config',
      schema: SCHEMA,
      defaults: {
        settings: DEFAULT_SETTINGS,
        bookmarks: [],
        lastSession: { textHash: null, position: 0 },
      },
    });
  }
  return storeInstance;
}

module.exports = { getStore };
