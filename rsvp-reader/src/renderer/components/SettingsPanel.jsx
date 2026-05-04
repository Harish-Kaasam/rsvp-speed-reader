/**
 * src/renderer/components/SettingsPanel.jsx
 * Purpose: Slide-in settings drawer (right side) with all user-configurable
 *          options: reading speed, chunk size, display, theme, advanced.
 *          Changes are applied live without restart.
 * Exports: SettingsPanel (default)
 * Dependencies: React
 */

import React, { useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const WPM_MIN   = 100;
const WPM_MAX   = 1000;
const WPM_STEP  = 25;
const FONT_SIZE_MIN = 16;
const FONT_SIZE_MAX = 72;

const CHUNK_SIZES  = [1, 2, 3, 4, 5];
const FONT_OPTIONS = [
  { value: 'system',  label: 'System Default' },
  { value: 'roboto',  label: 'Roboto' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'courier', label: 'Courier' },
];
const THEME_OPTIONS = ['dark', 'light', 'sepia'];
const WIDTH_OPTIONS = ['narrow', 'medium', 'wide'];

const DEFAULT_SETTINGS = {
  wpm: 300, chunkSize: 1, fontSize: 36, fontFamily: 'system',
  theme: 'dark', focusColour: '#e53935', displayWidth: 'medium',
  speedVariability: true, pauseAtSentences: true, pauseAtParagraphs: true,
  skipStopwords: false,
  stopwords: ['the','a','an','is','are','was','were','of','in','to','it'],
};

const KEYBOARD_SHORTCUTS = [
  ['Space',     'Toggle Pause / Resume'],
  ['R',         'Restart from beginning'],
  ['N',         'New Text (pauses)'],
  ['S',         'Toggle Settings panel'],
  ['B',         'Drop a Bookmark'],
  ['← Arrow',   'Skip back 10 words'],
  ['→ Arrow',   'Skip forward 10 words'],
  ['↑ Arrow',   'Increase WPM by 25'],
  ['↓ Arrow',   'Decrease WPM by 25'],
  ['Escape',    'Close Settings panel'],
];

/**
 * Settings panel slide-in drawer.
 * @param {Object}   props
 * @param {Object}   props.settings  - Current settings object
 * @param {Function} props.onUpdate  - Callback(partialSettings) to merge updates
 * @param {Function} props.onClose   - Close the panel
 * @returns {JSX.Element}
 */
export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const s = settings || DEFAULT_SETTINGS;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [stopwordsText, setStopwordsText] = useState(
    (s.stopwords || []).join(', ')
  );

  const set = useCallback((key, value) => onUpdate({ [key]: value }), [onUpdate]);

  const handleStopwordsSave = () => {
    const words = stopwordsText.split(',').map(w => w.trim()).filter(Boolean);
    set('stopwords', words);
  };

  const handleReset = () => {
    onUpdate({ ...DEFAULT_SETTINGS });
    setStopwordsText(DEFAULT_SETTINGS.stopwords.join(', '));
  };

  return (
    <>
      {/* Backdrop */}
      <div className="settings-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <aside
        className="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="settings-header">
          <h2 className="settings-title">⚙ Settings</h2>
          <button
            className="btn btn--icon settings-close"
            onClick={onClose}
            aria-label="Close settings (Escape)"
          >✕</button>
        </div>

        <div className="settings-body">

          {/* ── Reading ── */}
          <section className="settings-section" aria-labelledby="sec-reading">
            <h3 className="settings-section-title" id="sec-reading">Reading</h3>

            {/* WPM */}
            <div className="settings-row">
              <label className="settings-label" htmlFor="wpm-slider">Speed (WPM)</label>
              <div className="settings-control settings-control--wpm">
                <input
                  id="wpm-slider"
                  type="range"
                  min={WPM_MIN} max={WPM_MAX} step={WPM_STEP}
                  value={s.wpm}
                  onChange={e => set('wpm', Number(e.target.value))}
                  aria-label={`WPM: ${s.wpm}`}
                />
                <input
                  type="number"
                  min={WPM_MIN} max={WPM_MAX} step={WPM_STEP}
                  value={s.wpm}
                  onChange={e => {
                    const v = Math.max(WPM_MIN, Math.min(WPM_MAX, Number(e.target.value)));
                    set('wpm', v);
                  }}
                  className="settings-number-input"
                  aria-label="WPM value"
                />
              </div>
            </div>

            {/* Chunk size */}
            <div className="settings-row">
              <label className="settings-label">Chunk Size (words)</label>
              <div className="settings-segmented" role="group" aria-label="Chunk size">
                {CHUNK_SIZES.map(n => (
                  <button
                    key={n}
                    className={`seg-btn ${s.chunkSize === n ? 'seg-btn--active' : ''}`}
                    onClick={() => set('chunkSize', n)}
                    aria-pressed={s.chunkSize === n}
                    aria-label={`${n} word${n > 1 ? 's' : ''} per chunk`}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {[
              ['speedVariability',  'Speed Variability',    'Shorter words flash faster'],
              ['pauseAtSentences',  'Pause at Sentences',   'Double interval at . ! ?'],
              ['pauseAtParagraphs', 'Pause at Paragraphs',  'Triple interval at paragraph breaks'],
            ].map(([key, label, desc]) => (
              <div className="settings-row settings-row--toggle" key={key}>
                <div>
                  <div className="settings-label">{label}</div>
                  <div className="settings-desc">{desc}</div>
                </div>
                <label className="toggle-switch" aria-label={label}>
                  <input
                    type="checkbox"
                    checked={!!s[key]}
                    onChange={e => set(key, e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </section>

          {/* ── Display ── */}
          <section className="settings-section" aria-labelledby="sec-display">
            <h3 className="settings-section-title" id="sec-display">Display</h3>

            {/* Font size */}
            <div className="settings-row">
              <label className="settings-label" htmlFor="font-size-slider">
                Font Size ({s.fontSize}px)
              </label>
              <input
                id="font-size-slider"
                type="range"
                min={FONT_SIZE_MIN} max={FONT_SIZE_MAX} step={2}
                value={s.fontSize}
                onChange={e => set('fontSize', Number(e.target.value))}
                aria-label={`Font size: ${s.fontSize}px`}
              />
            </div>

            {/* Font family */}
            <div className="settings-row">
              <label className="settings-label" htmlFor="font-family-select">Font Family</label>
              <select
                id="font-family-select"
                value={s.fontFamily}
                onChange={e => set('fontFamily', e.target.value)}
                className="settings-select"
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div className="settings-row">
              <label className="settings-label">Theme</label>
              <div className="settings-segmented" role="group" aria-label="Theme">
                {THEME_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`seg-btn ${s.theme === t ? 'seg-btn--active' : ''}`}
                    onClick={() => set('theme', t)}
                    aria-pressed={s.theme === t}
                    aria-label={`${t} theme`}
                  >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
            </div>

            {/* Focus colour */}
            <div className="settings-row">
              <label className="settings-label" htmlFor="focus-colour-picker">Focus Letter Colour</label>
              <div className="settings-colour-row">
                <input
                  id="focus-colour-picker"
                  type="color"
                  value={s.focusColour}
                  onChange={e => set('focusColour', e.target.value)}
                  className="settings-colour-picker"
                  aria-label="Focus letter colour"
                />
                <span className="settings-colour-hex">{s.focusColour}</span>
              </div>
            </div>

            {/* Display width */}
            <div className="settings-row">
              <label className="settings-label">Display Width</label>
              <div className="settings-segmented" role="group" aria-label="Display width">
                {WIDTH_OPTIONS.map(w => (
                  <button
                    key={w}
                    className={`seg-btn ${s.displayWidth === w ? 'seg-btn--active' : ''}`}
                    onClick={() => set('displayWidth', w)}
                    aria-pressed={s.displayWidth === w}
                    aria-label={`${w} display width`}
                  >{w.charAt(0).toUpperCase() + w.slice(1)}</button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Advanced ── */}
          <section className="settings-section" aria-labelledby="sec-advanced">
            <h3 className="settings-section-title" id="sec-advanced">Advanced</h3>

            {/* Skip stopwords */}
            <div className="settings-row settings-row--toggle">
              <div>
                <div className="settings-label">Skip Stopwords</div>
                <div className="settings-desc">Skip common words for faster reading</div>
              </div>
              <label className="toggle-switch" aria-label="Skip stopwords">
                <input
                  type="checkbox"
                  checked={!!s.skipStopwords}
                  onChange={e => set('skipStopwords', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {s.skipStopwords && (
              <div className="settings-stopwords">
                <label className="settings-label" htmlFor="stopwords-input">
                  Stopwords (comma-separated)
                </label>
                <textarea
                  id="stopwords-input"
                  className="settings-textarea"
                  value={stopwordsText}
                  onChange={e => setStopwordsText(e.target.value)}
                  onBlur={handleStopwordsSave}
                  rows={3}
                  aria-label="Stopwords list"
                />
              </div>
            )}

            {/* Keyboard shortcuts */}
            <div className="settings-row">
              <button
                className="btn settings-shortcuts-btn"
                onClick={() => setShowShortcuts(v => !v)}
                aria-expanded={showShortcuts}
                aria-controls="shortcuts-table"
              >
                {showShortcuts ? '▲' : '▼'} Keyboard Shortcuts
              </button>
            </div>

            {showShortcuts && (
              <table className="shortcuts-table" id="shortcuts-table" aria-label="Keyboard shortcuts">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {KEYBOARD_SHORTCUTS.map(([key, action]) => (
                    <tr key={key}>
                      <td><kbd>{key}</kbd></td>
                      <td>{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="btn" onClick={handleReset} aria-label="Reset all settings to defaults">
            Reset Defaults
          </button>
          <button className="btn btn--primary" onClick={onClose} aria-label="Save settings and close">
            Save & Close
          </button>
        </div>

        <style>{settingsStyles}</style>
      </aside>
    </>
  );
}

const settingsStyles = `
.settings-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 90;
  backdrop-filter: blur(1px);
  animation: fadeIn 0.2s ease;
}
.settings-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  max-width: 90vw;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.4);
  animation: slideInRight 0.25s ease;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.settings-close {
  width: 32px;
  height: 32px;
  font-size: 14px;
  border-radius: 6px;
}
.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 8px;
}
.settings-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.settings-section:last-child { border-bottom: none; }
.settings-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-bottom: 14px;
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.settings-row:last-child { margin-bottom: 0; }
.settings-row--toggle { align-items: flex-start; }
.settings-label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  flex-shrink: 0;
}
.settings-desc {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}
.settings-control--wpm {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.settings-control--wpm input[type="range"] { flex: 1; }
.settings-number-input {
  width: 60px;
  padding: 4px 8px;
  font-size: 13px;
  text-align: center;
  flex-shrink: 0;
}
.settings-select {
  flex: 1;
  max-width: 160px;
  padding: 6px 10px;
  font-size: 13px;
}
.settings-segmented {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px;
}
.seg-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}
.seg-btn:hover { color: var(--text-primary); }
.seg-btn--active {
  background: var(--accent);
  color: #fff;
}
.settings-colour-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.settings-colour-picker {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: var(--input-bg);
}
.settings-colour-hex {
  font-size: 12px;
  font-family: monospace;
  color: var(--text-secondary);
}
.settings-stopwords {
  margin-top: 8px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.settings-textarea {
  width: 100%;
  resize: vertical;
  min-height: 60px;
  font-size: 12px;
  padding: 8px;
  line-height: 1.5;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: monospace;
}
.settings-shortcuts-btn {
  width: 100%;
  justify-content: flex-start;
  font-size: 12px;
  color: var(--text-secondary);
}
.shortcuts-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 12px;
}
.shortcuts-table th {
  text-align: left;
  padding: 4px 8px;
  color: var(--text-dim);
  font-weight: 500;
  border-bottom: 1px solid var(--border);
}
.shortcuts-table td {
  padding: 5px 8px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.shortcuts-table tr:last-child td { border-bottom: none; }
kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--btn-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: var(--text-primary);
}
.settings-footer {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.settings-footer .btn { flex: 1; justify-content: center; }
`;
