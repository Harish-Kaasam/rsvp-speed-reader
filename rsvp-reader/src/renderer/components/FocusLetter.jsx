/**
 * src/renderer/components/FocusLetter.jsx
 * Purpose: Renders a single word with Spritz-style ORP (Optimal Recognition Point)
 *          letter highlighted in the accent colour. All letters are aligned so the
 *          ORP sits at a fixed horizontal anchor position.
 * Exports: FocusLetter (default)
 * Dependencies: React
 */

import React from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
/** Maximum ORP index regardless of word length */
const MAX_ORP_INDEX = 3;
/** Minimum characters to show before collapsing layout */
const MIN_DISPLAY_CHARS = 1;

/**
 * Calculates the Optimal Recognition Point index for a word.
 * Formula: floor(word.length * 0.35), capped at MAX_ORP_INDEX.
 * @param {string} word - The word to calculate ORP for
 * @returns {number} Zero-based index of the ORP letter
 */
export function calculateORP(word) {
  if (!word || word.length === 0) return 0;
  return Math.min(Math.floor(word.length * 0.35), MAX_ORP_INDEX);
}

/**
 * Renders a word with the ORP letter highlighted and aligned to a fixed point.
 * @param {Object} props
 * @param {string}  props.word        - The word to display
 * @param {string}  props.focusColour - CSS colour for the ORP letter
 * @param {number}  props.fontSize    - Font size in pixels
 * @param {boolean} props.showGuides  - Whether to show vertical guide lines
 * @returns {JSX.Element}
 */
export default function FocusLetter({ word = '', focusColour = '#e53935', fontSize = 36, showGuides = true }) {
  if (!word || word.length === 0) {
    return (
      <span className="focus-letter-container" style={{ fontSize }}>
        <span className="focus-letter__before" />
        <span className="focus-letter__orp" style={{ color: focusColour }}>{'\u00A0'}</span>
        <span className="focus-letter__after" />
      </span>
    );
  }

  const orpIndex = calculateORP(word);
  const before   = word.slice(0, orpIndex);
  const orpChar  = word[orpIndex];
  const after    = word.slice(orpIndex + 1);

  return (
    <span
      className="focus-letter-container"
      style={{ fontSize, '--focus-colour': focusColour }}
      aria-label={word}
      role="text"
    >
      {showGuides && <span className="focus-letter__guide focus-letter__guide--top" aria-hidden="true" />}

      <span className="focus-letter__word">
        <span className="focus-letter__before">{before}</span>
        <span className="focus-letter__orp" style={{ color: focusColour }}>{orpChar}</span>
        <span className="focus-letter__after">{after}</span>
      </span>

      {showGuides && <span className="focus-letter__guide focus-letter__guide--bottom" aria-hidden="true" />}

      <style>{focusLetterStyles}</style>
    </span>
  );
}

const focusLetterStyles = `
.focus-letter-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  line-height: 1.2;
  font-family: var(--font-reader, 'Courier New', monospace);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.focus-letter__word {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
}
.focus-letter__before {
  display: inline-block;
  text-align: right;
  color: var(--text-primary);
  opacity: 0.9;
}
.focus-letter__orp {
  display: inline-block;
  font-weight: 700;
  transition: color 0.1s ease;
}
.focus-letter__after {
  display: inline-block;
  text-align: left;
  color: var(--text-primary);
  opacity: 0.9;
}
.focus-letter__guide {
  position: absolute;
  left: 50%;
  width: 1.5px;
  background: var(--focus-colour, #e53935);
  opacity: 0.4;
  border-radius: 1px;
  pointer-events: none;
}
.focus-letter__guide--top {
  bottom: calc(100% + 4px);
  height: 16px;
}
.focus-letter__guide--bottom {
  top: calc(100% + 4px);
  height: 16px;
}
`;
