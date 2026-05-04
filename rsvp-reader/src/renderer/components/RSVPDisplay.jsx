/**
 * src/renderer/components/RSVPDisplay.jsx
 * Purpose: Core RSVP word display box. Shows the current chunk of words with
 *          focus-letter highlighting for the middle word. Wrapped in an
 *          ErrorBoundary to prevent crashes from corrupt chunks.
 * Exports: RSVPDisplay (default)
 * Dependencies: React, FocusLetter
 */

import React, { Component } from 'react';
import FocusLetter from './FocusLetter.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────
const DISPLAY_WIDTH_MAP = { narrow: '340px', medium: '520px', wide: '720px' };
const DISPLAY_HEIGHT_PX = 200;

// ─── Error Boundary ───────────────────────────────────────────────────────────
class RSVPErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rsvp-error">
          <p>Display error — please restart reading.</p>
          <small>{this.state.error?.message}</small>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * RSVPDisplay renders the current word chunk in the display box.
 * For single-word chunks, uses FocusLetter with full ORP highlighting.
 * For multi-word chunks, highlights ORP of the middle word only.
 * @param {Object}  props
 * @param {Object}  props.currentChunk  - Current chunk object {words, orpIndex, isPausePoint}
 * @param {Object}  props.settings      - User settings
 * @param {boolean} props.isPlaying     - Whether RSVP is currently playing
 * @returns {JSX.Element}
 */
export default function RSVPDisplay({ currentChunk, settings, isPlaying }) {
  const {
    fontSize     = 36,
    focusColour  = '#e53935',
    displayWidth = 'medium',
    chunkSize    = 1,
  } = settings || {};

  const boxWidth = DISPLAY_WIDTH_MAP[displayWidth] || DISPLAY_WIDTH_MAP.medium;

  // Idle state — no text loaded
  if (!currentChunk) {
    return (
      <RSVPErrorBoundary>
        <div className="rsvp-wrapper" style={{ '--box-width': boxWidth }}>
          <div className="rsvp-box rsvp-box--idle">
            <span className="rsvp-idle-text">Press ▶ to start reading</span>
          </div>
          <style>{rsvpStyles}</style>
        </div>
      </RSVPErrorBoundary>
    );
  }

  const words = currentChunk.words || [];
  const midIndex = Math.floor(words.length / 2);

  return (
    <RSVPErrorBoundary>
      <div
        className="rsvp-wrapper"
        style={{ '--box-width': boxWidth, '--font-size': `${fontSize}px` }}
        role="region"
        aria-label="RSVP word display"
        aria-live="off"
      >
        {/* Vertical guide line through the ORP column */}
        <div className="rsvp-guide-line" style={{ '--guide-colour': focusColour }} aria-hidden="true" />

        <div className={`rsvp-box ${currentChunk.isPausePoint ? 'rsvp-box--pause' : ''}`}>
          {words.length === 0 ? (
            <span className="rsvp-blank" aria-hidden="true">{'\u00A0'}</span>
          ) : words.length === 1 ? (
            <FocusLetter
              word={words[0]}
              focusColour={focusColour}
              fontSize={fontSize}
              showGuides={false}
            />
          ) : (
            <div className="rsvp-chunk" style={{ fontSize }}>
              {words.map((word, i) => (
                <span key={i} className="rsvp-chunk__word">
                  {i === midIndex ? (
                    <FocusLetter
                      word={word}
                      focusColour={focusColour}
                      fontSize={fontSize}
                      showGuides={false}
                    />
                  ) : (
                    <span className="rsvp-chunk__plain">{word}</span>
                  )}
                  {i < words.length - 1 && <span className="rsvp-chunk__space">{' '}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Playback state indicator */}
        {!isPlaying && currentChunk && (
          <div className="rsvp-paused-indicator" aria-label="Paused">⏸</div>
        )}

        <style>{rsvpStyles}</style>
      </div>
    </RSVPErrorBoundary>
  );
}

const rsvpStyles = `
.rsvp-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--box-width, 520px);
}
.rsvp-guide-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--guide-colour, #e53935) 30%,
    var(--guide-colour, #e53935) 70%,
    transparent
  );
  opacity: 0.25;
  pointer-events: none;
  z-index: 1;
}
.rsvp-box {
  width: 100%;
  height: ${DISPLAY_HEIGHT_PX}px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--display-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: border-color 0.2s ease;
}
.rsvp-box--idle {
  border-style: dashed;
  border-color: var(--border-light);
}
.rsvp-box--pause {
  border-color: var(--border-light);
}
.rsvp-idle-text {
  color: var(--text-dim);
  font-size: 16px;
  letter-spacing: 0.02em;
}
.rsvp-blank {
  display: block;
  width: 1ch;
}
.rsvp-chunk {
  display: flex;
  align-items: baseline;
  gap: 0;
  flex-wrap: nowrap;
  font-family: var(--font-reader, 'Courier New', monospace);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}
.rsvp-chunk__word {
  display: inline-flex;
  align-items: baseline;
}
.rsvp-chunk__plain {
  color: var(--text-primary);
  opacity: 0.9;
}
.rsvp-chunk__space {
  display: inline-block;
  width: 0.35em;
}
.rsvp-paused-indicator {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  color: var(--text-dim);
  opacity: 0.6;
}
.rsvp-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: ${DISPLAY_HEIGHT_PX}px;
  width: 100%;
  max-width: 520px;
  background: var(--display-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text-secondary);
  gap: 8px;
}
.rsvp-error small { color: var(--text-dim); font-size: 11px; }
`;
