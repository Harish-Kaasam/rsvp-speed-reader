/**
 * src/renderer/components/BookmarksPanel.jsx
 * Purpose: Slide-in panel listing all saved bookmarks with word context preview,
 *          jump-to and delete functionality.
 * Exports: BookmarksPanel (default)
 * Dependencies: React
 */

import React from 'react';

/**
 * BookmarksPanel slide-in drawer showing saved bookmarks.
 * @param {Object}   props
 * @param {Array}    props.bookmarks   - Array of bookmark objects
 * @param {Function} props.onJump      - Callback(position) to jump to bookmark
 * @param {Function} props.onDelete    - Callback(id) to delete a bookmark
 * @param {Function} props.onClose     - Close the panel
 * @returns {JSX.Element}
 */
export default function BookmarksPanel({ bookmarks, onJump, onDelete, onClose }) {
  return (
    <>
      <div className="bm-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="bm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Bookmarks"
      >
        <div className="bm-header">
          <h2 className="bm-title">📍 Bookmarks</h2>
          <button
            className="btn btn--icon bm-close"
            onClick={onClose}
            aria-label="Close bookmarks panel"
          >✕</button>
        </div>

        <div className="bm-body">
          {bookmarks.length === 0 ? (
            <div className="bm-empty">
              <p className="bm-empty-icon">🔖</p>
              <p className="bm-empty-text">No bookmarks yet</p>
              <p className="bm-empty-hint">Press <kbd>B</kbd> while reading to save your position</p>
            </div>
          ) : (
            <ul className="bm-list" role="list">
              {bookmarks.map((bm) => (
                <li key={bm.id} className="bm-item" role="listitem">
                  <button
                    className="bm-jump-btn"
                    onClick={() => onJump(bm.position)}
                    aria-label={`Jump to bookmark at word ${bm.position + 1}: ${bm.preview}`}
                    title="Jump to this position"
                  >
                    <span className="bm-label">{bm.label}</span>
                    <span className="bm-position">Word {(bm.position + 1).toLocaleString()}</span>
                    {bm.preview && (
                      <span className="bm-preview">"{bm.preview}"</span>
                    )}
                    <span className="bm-date">{formatDate(bm.createdAt)}</span>
                  </button>
                  <button
                    className="btn btn--icon bm-delete-btn"
                    onClick={() => onDelete(bm.id)}
                    aria-label={`Delete bookmark: ${bm.label}`}
                    title="Delete bookmark"
                  >🗑</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bm-footer">
          <p className="bm-hint">Press <kbd>B</kbd> during reading to add bookmarks</p>
        </div>

        <style>{bmStyles}</style>
      </aside>
    </>
  );
}

/**
 * Formats an ISO date string to a readable format.
 * @param {string} iso - ISO date string
 * @returns {string} Formatted date (e.g., "May 4, 2:30 PM")
 */
function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const bmStyles = `
.bm-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 90;
  backdrop-filter: blur(1px);
  animation: fadeIn 0.2s ease;
}
.bm-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 90vw;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.4);
  animation: slideInRight 0.25s ease;
}
.bm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.bm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.bm-close {
  width: 32px;
  height: 32px;
  font-size: 14px;
}
.bm-body {
  flex: 1;
  overflow-y: auto;
}
.bm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  padding: 32px;
  text-align: center;
}
.bm-empty-icon { font-size: 40px; opacity: 0.4; }
.bm-empty-text { font-size: 15px; color: var(--text-secondary); margin: 0; }
.bm-empty-hint { font-size: 12px; color: var(--text-dim); margin: 0; }
.bm-list {
  list-style: none;
  padding: 8px 0;
}
.bm-item {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--border);
}
.bm-item:last-child { border-bottom: none; }
.bm-jump-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
  font-family: inherit;
}
.bm-jump-btn:hover { background: var(--surface-2); }
.bm-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.bm-position { font-size: 11px; color: var(--accent); font-weight: 500; }
.bm-preview {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}
.bm-date { font-size: 10px; color: var(--text-dim); }
.bm-delete-btn {
  width: 40px;
  border-radius: 0;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
}
.bm-delete-btn:hover { color: var(--accent); background: rgba(229,57,53,0.08); }
.bm-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.bm-hint { font-size: 12px; color: var(--text-dim); margin: 0; text-align: center; }
`;
