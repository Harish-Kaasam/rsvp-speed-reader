/**
 * src/renderer/components/ProgressBar.jsx
 * Purpose: Animated reading progress bar with word count, percentage,
 *          ETA display, and click-to-seek functionality.
 * Exports: ProgressBar (default)
 * Dependencies: React, timeEstimator
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { formatTimeRemaining, estimateTimeRemaining } from '../utils/timeEstimator.js';

/**
 * ProgressBar component showing reading progress with seek support.
 * @param {Object}   props
 * @param {number}   props.currentIndex  - Current chunk index (0-based)
 * @param {number}   props.totalChunks   - Total number of chunks
 * @param {number}   props.wpm           - Current words per minute
 * @param {number}   props.chunkSize     - Words per chunk
 * @param {Array}    props.chunks        - Full chunks array (for tooltip preview)
 * @param {Function} props.onSeek        - Callback(index) to jump to position
 * @returns {JSX.Element}
 */
export default function ProgressBar({ currentIndex, totalChunks, wpm, chunkSize, chunks, onSeek }) {
  const barRef = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { x, index, preview }

  const pct = totalChunks > 0 ? Math.round((currentIndex / totalChunks) * 100) : 0;
  const wordsRead = currentIndex * (chunkSize || 1);
  const totalWords = totalChunks * (chunkSize || 1);

  const etaMs = estimateTimeRemaining(currentIndex, totalChunks, wpm, chunkSize || 1);
  const etaStr = formatTimeRemaining(etaMs);

  // ─── Seek on click ────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (!barRef.current || totalChunks === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetIndex = Math.round(ratio * totalChunks);
    onSeek?.(targetIndex);
  }, [totalChunks, onSeek]);

  // ─── Tooltip on hover ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!barRef.current || !chunks || chunks.length === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.min(Math.round(ratio * totalChunks), totalChunks - 1);
    const chunk = chunks[idx];
    const preview = chunk ? chunk.words.join(' ') : '';
    setTooltip({ x: e.clientX - rect.left, index: idx, preview });
  }, [chunks, totalChunks]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="progress-outer" role="region" aria-label="Reading progress">
      {/* Stats row */}
      <div className="progress-stats" aria-live="polite" aria-atomic="true">
        <span className="progress-stat">
          {wordsRead.toLocaleString()} / {totalWords.toLocaleString()} words
        </span>
        <span className="progress-stat progress-stat--pct">{pct}%</span>
        <span className="progress-stat progress-stat--eta">{etaStr}</span>
      </div>

      {/* Bar track */}
      <div
        ref={barRef}
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${pct}%`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        title="Click to jump to position"
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />

        {/* Scrubber tooltip */}
        {tooltip && (
          <div
            className="progress-tooltip"
            style={{ left: Math.max(4, Math.min(tooltip.x, barRef.current?.offsetWidth - 120)) }}
          >
            <span className="progress-tooltip__index">Word {(tooltip.index * (chunkSize || 1) + 1).toLocaleString()}</span>
            {tooltip.preview && (
              <span className="progress-tooltip__preview">"{tooltip.preview}"</span>
            )}
          </div>
        )}
      </div>

      <style>{progressStyles}</style>
    </div>
  );
}

const progressStyles = `
.progress-outer {
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 6px 16px 0;
}
.progress-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 4px;
}
.progress-stat {
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
.progress-stat--pct {
  font-weight: 600;
  color: var(--text-primary);
}
.progress-stat--eta {
  margin-left: auto;
  color: var(--text-dim);
}
.progress-track {
  position: relative;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  cursor: pointer;
  overflow: visible;
  transition: height 0.15s ease;
}
.progress-track:hover { height: 6px; }
.progress-fill {
  height: 100%;
  background: var(--progress, #e53935);
  border-radius: 2px;
  transition: width 0.1s linear;
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--progress, #e53935);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.progress-track:hover .progress-fill::after { opacity: 1; }
.progress-tooltip {
  position: absolute;
  bottom: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
  max-width: 220px;
  transform: translateX(-50%);
  z-index: 20;
}
.progress-tooltip__index {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}
.progress-tooltip__preview {
  font-size: 10px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;
