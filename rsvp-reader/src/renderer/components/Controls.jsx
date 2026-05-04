/**
 * src/renderer/components/Controls.jsx
 * Purpose: Toolbar at the bottom of the RSVP screen with playback controls
 *          (play/pause, restart, new text, settings, bookmarks).
 * Exports: Controls (default)
 * Dependencies: React
 */

import React from 'react';

/**
 * Controls toolbar with all playback and navigation buttons.
 * @param {Object}   props
 * @param {boolean}  props.isPlaying          - Current playback state
 * @param {Function} props.onPlay             - Start playback
 * @param {Function} props.onPause            - Pause playback
 * @param {Function} props.onRestart          - Restart from beginning
 * @param {Function} props.onNewText          - Navigate to text input screen
 * @param {Function} props.onToggleSettings   - Open/close settings panel
 * @param {Function} props.onToggleBookmarks  - Open/close bookmarks panel
 * @returns {JSX.Element}
 */
export default function Controls({
  isPlaying,
  onPlay,
  onPause,
  onRestart,
  onNewText,
  onToggleSettings,
  onToggleBookmarks,
}) {
  return (
    <footer className="controls-toolbar" role="toolbar" aria-label="Playback controls">
      {/* Play / Pause */}
      <button
        className={`ctrl-btn ctrl-btn--primary ${isPlaying ? 'ctrl-btn--pause' : 'ctrl-btn--play'}`}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause reading (Space)' : 'Start reading (Space)'}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        <span className="ctrl-btn__icon" aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
        <span className="ctrl-btn__label">{isPlaying ? 'Pause' : 'Start'}</span>
      </button>

      <div className="controls-divider" aria-hidden="true" />

      {/* Restart */}
      <button
        className="ctrl-btn"
        onClick={onRestart}
        aria-label="Restart reading from beginning (R)"
        title="Restart (R)"
      >
        <span className="ctrl-btn__icon" aria-hidden="true">⟳</span>
        <span className="ctrl-btn__label">Restart</span>
      </button>

      {/* New Text */}
      <button
        className="ctrl-btn"
        onClick={onNewText}
        aria-label="Load new text (N)"
        title="New Text (N)"
      >
        <span className="ctrl-btn__icon" aria-hidden="true">✕</span>
        <span className="ctrl-btn__label">New Text</span>
      </button>

      {/* Bookmarks */}
      <button
        className="ctrl-btn"
        onClick={onToggleBookmarks}
        aria-label="Open bookmarks panel (B)"
        title="Bookmarks (B)"
      >
        <span className="ctrl-btn__icon" aria-hidden="true">📍</span>
        <span className="ctrl-btn__label">Bookmarks</span>
      </button>

      <div className="controls-spacer" aria-hidden="true" />

      {/* Keyboard help shortcut hint */}
      <div className="controls-hints" aria-label="Keyboard shortcuts hint">
        <span className="hint-key" title="Skip back 10 words">←</span>
        <span className="hint-key" title="Skip forward 10 words">→</span>
        <span className="hint-key" title="Speed up">↑</span>
        <span className="hint-key" title="Speed down">↓</span>
        <span className="hint-sep" aria-hidden="true">·</span>
        <span className="hint-key" title="Bookmark">B</span>
      </div>

      {/* Settings */}
      <button
        className="ctrl-btn"
        onClick={onToggleSettings}
        aria-label="Open settings panel (S)"
        title="Settings (S)"
      >
        <span className="ctrl-btn__icon" aria-hidden="true">⚙</span>
        <span className="ctrl-btn__label">Settings</span>
      </button>

      <style>{controlsStyles}</style>
    </footer>
  );
}

const controlsStyles = `
.controls-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  height: 56px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.controls-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}
.controls-spacer { flex: 1; }
.ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
  font-family: inherit;
}
.ctrl-btn:hover {
  background: var(--btn-hover);
  color: var(--text-primary);
  border-color: var(--border);
}
.ctrl-btn:active { transform: scale(0.96); }
.ctrl-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ctrl-btn--primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
  min-width: 100px;
  justify-content: center;
}
.ctrl-btn--primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  color: #fff;
}
.ctrl-btn__icon { font-size: 15px; line-height: 1; }
.ctrl-btn__label { font-size: 12px; }
.controls-hints {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}
.hint-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--btn-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-dim);
  cursor: default;
}
.hint-sep { color: var(--text-dim); font-size: 10px; }
@media (max-width: 700px) {
  .ctrl-btn__label { display: none; }
  .controls-hints { display: none; }
}
`;
