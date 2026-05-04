/**
 * src/renderer/utils/timeEstimator.js
 * Purpose: ETA calculation utilities for the RSVP progress bar.
 *          Computes remaining reading time based on chunks, WPM, and chunk size.
 * Exports: estimateTimeRemaining, formatTimeRemaining
 * Dependencies: None
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const MS_PER_MINUTE = 60000;
const SECONDS_PER_MINUTE = 60;

/**
 * Estimates the remaining reading time in milliseconds.
 * @param {number} currentIndex  - Current chunk index (0-based)
 * @param {number} totalChunks   - Total number of chunks
 * @param {number} wpm           - Words per minute setting
 * @param {number} chunkSize     - Words per chunk
 * @returns {number} Remaining time in milliseconds
 */
export function estimateTimeRemaining(currentIndex, totalChunks, wpm, chunkSize) {
  if (!totalChunks || !wpm || wpm <= 0) return 0;
  const chunksLeft  = Math.max(0, totalChunks - currentIndex);
  const wordsLeft   = chunksLeft * (chunkSize || 1);
  const minutesLeft = wordsLeft / wpm;
  return Math.round(minutesLeft * MS_PER_MINUTE);
}

/**
 * Formats a millisecond duration into a human-readable ETA string.
 * Examples: "~4m 12s remaining", "~30s remaining", "Done"
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
export function formatTimeRemaining(ms) {
  if (!ms || ms <= 0) return 'Done';

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds  = totalSeconds % SECONDS_PER_MINUTE;

  if (minutes === 0) {
    return `~${seconds}s remaining`;
  }
  if (seconds === 0) {
    return `~${minutes}m remaining`;
  }
  return `~${minutes}m ${seconds}s remaining`;
}

/**
 * Calculates the total estimated reading time for a text.
 * @param {number} wordCount - Total word count
 * @param {number} wpm       - Words per minute
 * @returns {string} Formatted string like "4m 30s"
 */
export function formatTotalReadingTime(wordCount, wpm) {
  if (!wordCount || !wpm || wpm <= 0) return '—';
  const totalSeconds = Math.ceil((wordCount / wpm) * SECONDS_PER_MINUTE);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
