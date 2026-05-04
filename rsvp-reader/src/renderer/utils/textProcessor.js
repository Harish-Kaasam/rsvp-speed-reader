/**
 * src/renderer/utils/textProcessor.js
 * Purpose: Tokenises raw text into chunk objects for the RSVP engine.
 *          Handles sentence detection, paragraph breaks, ORP calculation,
 *          stopword filtering, and pause multiplier assignment.
 * Exports: buildChunks, tokeniseWords, calculateORP
 * Dependencies: None
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const SENTENCE_END_CHARS  = new Set(['.', '!', '?']);
const PARAGRAPH_MARKER    = '\n\n';
const PAUSE_MULTIPLIER_SENTENCE   = 2.0;
const PAUSE_MULTIPLIER_PARAGRAPH  = 3.0;
const PAUSE_MULTIPLIER_NORMAL     = 1.0;
const MAX_ORP_INDEX               = 3;

/** Common abbreviations that end with a period but are NOT sentence ends */
const ABBREVIATIONS = new Set([
  'mr','mrs','ms','dr','prof','sr','jr','vs','etc','ie','eg',
  'jan','feb','mar','apr','jun','jul','aug','sep','oct','nov','dec',
  'st','ave','blvd','dept','est','govt','approx','corp','inc','ltd',
]);

/**
 * Calculates the Optimal Recognition Point index for a word.
 * Formula: floor(word.length * 0.35), capped at MAX_ORP_INDEX.
 * @param {string} word - The word (stripped of punctuation)
 * @returns {number} Zero-based ORP index
 */
export function calculateORP(word) {
  if (!word || word.length === 0) return 0;
  const clean = word.replace(/[^a-zA-Z0-9]/g, '');
  return Math.min(Math.floor(clean.length * 0.35), MAX_ORP_INDEX);
}

/**
 * Determines if a token ends a sentence.
 * Handles abbreviations to avoid false positives.
 * @param {string} token - The raw token (may include trailing punctuation)
 * @returns {boolean}
 */
function isSentenceEnd(token) {
  if (!token) return false;
  const last = token[token.length - 1];
  if (!SENTENCE_END_CHARS.has(last)) return false;
  // Check if it's an abbreviation (word ends with period)
  if (last === '.') {
    const word = token.slice(0, -1).toLowerCase().replace(/[^a-z]/g, '');
    if (ABBREVIATIONS.has(word)) return false;
    if (word.length <= 2) return false; // Short abbreviations like "U.S."
  }
  return true;
}

/**
 * Checks if a token represents a paragraph break marker.
 * @param {string} token - The token to check
 * @returns {boolean}
 */
function isParagraphBreak(token) {
  return token === '__PARAGRAPH__';
}

/**
 * Tokenises raw text into individual word tokens, preserving paragraph markers.
 * Joins hyphenated line-breaks, normalises whitespace, inserts paragraph markers.
 * @param {string} text - Raw input text
 * @returns {string[]} Array of tokens (words + '__PARAGRAPH__' markers)
 */
export function tokeniseWords(text) {
  if (!text) return [];

  let processed = text
    // Normalise Windows line endings
    .replace(/\r\n/g, '\n')
    // Join hyphenated line breaks: "word-\nword" → "wordword"
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // Normalise unicode dashes and quotes
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace paragraph breaks (2+ newlines) with a marker
    .replace(/\n{2,}/g, ' __PARAGRAPH__ ')
    // Replace single newlines with spaces
    .replace(/\n/g, ' ')
    // Normalise multiple spaces
    .replace(/  +/g, ' ')
    .trim();

  return processed.split(' ').filter(t => t.length > 0);
}

/**
 * Builds the complete chunks array from raw text for RSVP playback.
 * Pre-computes ORP index, pause multiplier, and word arrays for every chunk.
 * @param {string}  text                    - Raw input text
 * @param {Object}  options                 - Build options
 * @param {number}  options.chunkSize       - Words per chunk (1–5)
 * @param {boolean} options.skipStopwords   - Whether to filter stopwords
 * @param {string[]}options.stopwords       - Array of stopwords to skip
 * @param {boolean} options.pauseAtSentences  - Double pause at sentence ends
 * @param {boolean} options.pauseAtParagraphs - Triple pause at paragraph breaks
 * @returns {Array<{words: string[], orpIndex: number, isPausePoint: boolean, multiplier: number}>}
 */
export function buildChunks(text, options = {}) {
  const {
    chunkSize        = 1,
    skipStopwords    = false,
    stopwords        = [],
    pauseAtSentences = true,
    pauseAtParagraphs= true,
  } = options;

  const stopwordSet = new Set(stopwords.map(w => w.toLowerCase()));
  const tokens = tokeniseWords(text);

  if (tokens.length === 0) return [];

  // ─── Filter stopwords (keep paragraph markers) ─────────────────────────
  const filtered = skipStopwords
    ? tokens.filter(t => isParagraphBreak(t) || !stopwordSet.has(t.toLowerCase().replace(/[^a-z]/g, '')))
    : tokens;

  // ─── Build word list with pause metadata ──────────────────────────────
  const words = [];
  for (const token of filtered) {
    if (isParagraphBreak(token)) {
      // Insert paragraph pause on the previous word
      if (words.length > 0) {
        words[words.length - 1].paragraphBreak = true;
      }
    } else {
      words.push({
        word: token,
        sentenceEnd: isSentenceEnd(token),
        paragraphBreak: false,
      });
    }
  }

  if (words.length === 0) return [];

  // ─── Chunk words into groups ─────────────────────────────────────────
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const group = words.slice(i, i + chunkSize);
    const lastWord = group[group.length - 1];

    // Determine pause multiplier from the last word in chunk
    let multiplier = PAUSE_MULTIPLIER_NORMAL;
    let isPausePoint = false;

    if (lastWord.paragraphBreak && pauseAtParagraphs) {
      multiplier = PAUSE_MULTIPLIER_PARAGRAPH;
      isPausePoint = true;
    } else if (lastWord.sentenceEnd && pauseAtSentences) {
      multiplier = PAUSE_MULTIPLIER_SENTENCE;
      isPausePoint = true;
    }

    // ORP for center word of chunk
    const midIdx = Math.floor(group.length / 2);
    const midWord = group[midIdx]?.word || '';
    const orpIndex = calculateORP(midWord.replace(/[^a-zA-Z0-9]/g, ''));

    chunks.push({
      words: group.map(w => w.word),
      orpIndex,
      isPausePoint,
      multiplier,
    });

    i += chunkSize;
  }

  return chunks;
}
