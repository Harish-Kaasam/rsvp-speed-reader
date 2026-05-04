/**
 * src/renderer/hooks/useKeyboard.js
 * Purpose: Attaches global keydown event listener for all RSVP keyboard shortcuts.
 *          Ignores key events when focus is on input/textarea elements.
 * Exports: useKeyboard (named)
 * Dependencies: React
 */

import { useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
/** Tags that should block keyboard shortcuts when focused */
const FOCUSABLE_INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Global keyboard shortcut handler for the RSVP reader.
 * @param {Object}   params
 * @param {boolean}  params.enabled           - Whether shortcuts are active
 * @param {Function} params.onTogglePlay      - Space: toggle pause/play
 * @param {Function} params.onRestart         - R: restart
 * @param {Function} params.onNewText         - N: go to text input
 * @param {Function} params.onToggleSettings  - S: toggle settings
 * @param {Function} params.onSkipBack        - ←: skip back 10 words
 * @param {Function} params.onSkipForward     - →: skip forward 10 words
 * @param {Function} params.onSpeedUp         - ↑: +25 WPM
 * @param {Function} params.onSpeedDown       - ↓: -25 WPM
 * @param {Function} params.onCloseSettings   - Escape: close settings
 * @param {Function} params.onBookmark        - B: drop bookmark
 */
export function useKeyboard({
  enabled,
  onTogglePlay,
  onRestart,
  onNewText,
  onToggleSettings,
  onSkipBack,
  onSkipForward,
  onSpeedUp,
  onSpeedDown,
  onCloseSettings,
  onBookmark,
}) {
  // Store callbacks in refs to avoid re-attaching listener on every render
  const cbRef = useRef({});
  cbRef.current = {
    onTogglePlay,
    onRestart,
    onNewText,
    onToggleSettings,
    onSkipBack,
    onSkipForward,
    onSpeedUp,
    onSpeedDown,
    onCloseSettings,
    onBookmark,
  };

  useEffect(() => {
    if (!enabled) return;

    /**
     * Handles a keydown event and dispatches to the appropriate callback.
     * @param {KeyboardEvent} e - The keyboard event
     */
    const handleKeyDown = (e) => {
      // Don't hijack shortcuts when typing in inputs
      if (FOCUSABLE_INPUT_TAGS.has(document.activeElement?.tagName)) return;

      // Don't interfere with browser shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const cb = cbRef.current;
      switch (e.key) {
        case ' ':
        case 'Space':
          e.preventDefault();
          cb.onTogglePlay?.();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          cb.onRestart?.();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          cb.onNewText?.();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          cb.onToggleSettings?.();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          cb.onBookmark?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          cb.onSkipBack?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          cb.onSkipForward?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          cb.onSpeedUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          cb.onSpeedDown?.();
          break;
        case 'Escape':
          e.preventDefault();
          cb.onCloseSettings?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
