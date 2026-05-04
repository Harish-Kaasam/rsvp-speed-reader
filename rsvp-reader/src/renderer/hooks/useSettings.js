/**
 * src/renderer/hooks/useSettings.js
 * Purpose: Loads settings from electron-store on mount, provides a merged
 *          update function, and auto-persists changes. Falls back to defaults
 *          when running in a browser without Electron.
 * Exports: useSettings (named)
 * Dependencies: React
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Default Settings ─────────────────────────────────────────────────────────
/** @type {Object} Full settings object with all defaults */
const DEFAULT_SETTINGS = {
  wpm:              300,
  chunkSize:        1,
  fontSize:         36,
  fontFamily:       'system',
  theme:            'dark',
  focusColour:      '#e53935',
  displayWidth:     'medium',
  speedVariability: true,
  pauseAtSentences: true,
  pauseAtParagraphs:true,
  skipStopwords:    false,
  stopwords:        ['the','a','an','is','are','was','were','of','in','to','it'],
};

/** Debounce delay for persisting settings to disk in ms */
const PERSIST_DEBOUNCE_MS = 500;

/**
 * Settings management hook. Loads from electron-store on mount,
 * merges updates, and debounce-persists to disk.
 * @returns {{ settings: Object, updateSettings: Function, isLoaded: boolean }}
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  // ─── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) {
      setIsLoaded(true);
      return;
    }
    window.electronAPI.loadSettings()
      .then((saved) => {
        if (saved && typeof saved === 'object') {
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setIsLoaded(true);
      });
  }, []);

  /**
   * Merges partial settings update and debounce-saves to disk.
   * @param {Partial<Object>} partial - Partial settings object to merge
   */
  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };

      // Debounce persist
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        window.electronAPI?.saveSettings(next).catch(console.error);
      }, PERSIST_DEBOUNCE_MS);

      return next;
    });
  }, []);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  return { settings, updateSettings, isLoaded };
}
