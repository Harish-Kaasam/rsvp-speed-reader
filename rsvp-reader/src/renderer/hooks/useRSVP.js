/**
 * src/renderer/hooks/useRSVP.js
 * Purpose: Core RSVP reading engine. Pre-tokenises text into chunks[], then
 *          advances through them via setInterval. Uses refs to avoid stale
 *          closures. Zero computation during the flash loop — only index increment.
 * Exports: useRSVP (named)
 * Dependencies: React, textProcessor
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { buildChunks } from '../utils/textProcessor.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_WPM     = 100;
const MAX_WPM     = 1000;
const MIN_INTERVAL_MS = 60;

/**
 * Calculates the interval in ms for a chunk given current WPM and chunk size.
 * @param {number} wpm       - Words per minute
 * @param {number} chunkSize - Number of words per chunk
 * @param {number} multiplier - Pause multiplier (1.0 normal, 2.0 sentence, 3.0 paragraph)
 * @param {number} wordLengthRatio - Length ratio for speed variability (1.0 = average)
 * @param {boolean} speedVariability - Whether to apply word-length-based timing
 * @returns {number} Interval in milliseconds
 */
function calcInterval(wpm, chunkSize, multiplier, wordLengthRatio, speedVariability) {
  const clampedWpm = Math.max(MIN_WPM, Math.min(MAX_WPM, wpm));
  let base = (60000 / clampedWpm) * chunkSize;
  if (speedVariability && wordLengthRatio !== 1) {
    base = base * (0.7 + 0.3 * wordLengthRatio);
  }
  return Math.max(MIN_INTERVAL_MS, Math.round(base * multiplier));
}

/**
 * Core RSVP reading engine hook.
 * @param {Object}  params
 * @param {string}  params.text     - The raw text to read (full document)
 * @param {Object}  params.settings - Current settings object
 * @returns {{
 *   currentChunk: Object|null,
 *   currentIndex: number,
 *   totalChunks: number,
 *   chunks: Array,
 *   isPlaying: boolean,
 *   play: Function,
 *   pause: Function,
 *   restart: Function,
 *   skipTo: Function,
 *   skipForward: Function,
 *   skipBack: Function,
 * }}
 */
export function useRSVP({ text, settings }) {
  const {
    wpm              = 300,
    chunkSize        = 1,
    speedVariability = true,
    pauseAtSentences = true,
    pauseAtParagraphs= true,
    skipStopwords    = false,
    stopwords        = [],
  } = settings || {};

  // ─── Pre-process chunks ────────────────────────────────────────────────────
  const chunks = useMemo(() => {
    if (!text || text.trim().length === 0) return [];
    return buildChunks(text, {
      chunkSize,
      skipStopwords,
      stopwords,
      pauseAtSentences,
      pauseAtParagraphs,
    });
  }, [text, chunkSize, skipStopwords, stopwords, pauseAtSentences, pauseAtParagraphs]);

  // ─── State ────────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(null);

  // ─── Refs (avoid stale closures in interval) ───────────────────────────────
  const indexRef         = useRef(0);
  const intervalRef      = useRef(null);
  const chunksRef        = useRef(chunks);
  const settingsRef      = useRef({ wpm, chunkSize, speedVariability });
  const isPlayingRef     = useRef(false);

  // Keep refs in sync
  useEffect(() => { chunksRef.current = chunks; }, [chunks]);
  useEffect(() => {
    settingsRef.current = { wpm, chunkSize, speedVariability };
  }, [wpm, chunkSize, speedVariability]);

  // ─── Reset on text / chunk-structure change ────────────────────────────────
  useEffect(() => {
    stopInterval();
    indexRef.current = 0;
    setCurrentIndex(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentChunk(chunks[0] || null);
  }, [chunks]);

  // ─── Display current chunk when index changes ──────────────────────────────
  useEffect(() => {
    setCurrentChunk(chunksRef.current[currentIndex] || null);
  }, [currentIndex]);

  // ─── Interval management ──────────────────────────────────────────────────
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Schedules the next chunk flash using a recursive setTimeout.
   * Using setTimeout instead of setInterval allows dynamic delay per chunk.
   */
  const scheduleNext = useCallback(() => {
    const idx = indexRef.current;
    const allChunks = chunksRef.current;
    if (idx >= allChunks.length) {
      // Reached end — stop
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const chunk = allChunks[idx];
    const { wpm: w, chunkSize: cs, speedVariability: sv } = settingsRef.current;

    // Calculate interval with variability and pause multipliers
    const avgWordLen = 5;
    const chunkWordLen = chunk.words.join('').length / Math.max(1, chunk.words.length);
    const lengthRatio = chunkWordLen / avgWordLen;
    const delay = calcInterval(w, cs, chunk.multiplier || 1, lengthRatio, sv);

    // Advance index
    indexRef.current = idx + 1;
    setCurrentIndex(idx);

    intervalRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        scheduleNext();
      }
    }, delay);
  }, []);

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Starts or resumes RSVP playback. */
  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    if (chunksRef.current.length === 0) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    scheduleNext();
  }, [scheduleNext]);

  /** Pauses RSVP playback, preserving current position. */
  const pause = useCallback(() => {
    stopInterval();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [stopInterval]);

  /** Restarts reading from the beginning. */
  const restart = useCallback(() => {
    stopInterval();
    indexRef.current = 0;
    setCurrentIndex(0);
    setCurrentChunk(chunksRef.current[0] || null);
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [stopInterval]);

  /**
   * Jumps to a specific chunk index.
   * @param {number} targetIndex - The chunk index to jump to
   */
  const skipTo = useCallback((targetIndex) => {
    const clamped = Math.max(0, Math.min(chunksRef.current.length - 1, targetIndex));
    stopInterval();
    indexRef.current = clamped;
    setCurrentIndex(clamped);
    setCurrentChunk(chunksRef.current[clamped] || null);
    // Resume if was playing
    if (isPlayingRef.current) {
      scheduleNext();
    }
  }, [stopInterval, scheduleNext]);

  /**
   * Skips forward by N chunks.
   * @param {number} n - Number of chunks to skip forward
   */
  const skipForward = useCallback((n = 10) => {
    skipTo(indexRef.current + n);
  }, [skipTo]);

  /**
   * Skips backward by N chunks.
   * @param {number} n - Number of chunks to skip back
   */
  const skipBack = useCallback((n = 10) => {
    skipTo(Math.max(0, indexRef.current - n - 1));
  }, [skipTo]);

  // ─── Restart interval when WPM changes while playing ──────────────────────
  useEffect(() => {
    if (isPlayingRef.current) {
      stopInterval();
      scheduleNext();
    }
  }, [wpm, speedVariability]);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => stopInterval(), []);

  return {
    currentChunk,
    currentIndex,
    totalChunks: chunks.length,
    chunks,
    isPlaying,
    play,
    pause,
    restart,
    skipTo,
    skipForward,
    skipBack,
  };
}
