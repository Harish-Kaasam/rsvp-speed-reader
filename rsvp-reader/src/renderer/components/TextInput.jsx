/**
 * src/renderer/components/TextInput.jsx
 * Purpose: Full-screen text input screen with paste area, drag-and-drop,
 *          file browse (txt/pdf), PDF extraction progress, and word count
 *          with estimated reading times before starting.
 * Exports: TextInput (default)
 * Dependencies: React, pdfExtractor, textProcessor
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { extractTextFromPDF } from '../utils/pdfExtractor.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const SAMPLE_WPM_LIST = [200, 300, 500];
const MAX_PASTE_PREVIEW_CHARS = 500;
const ACCEPTED_EXTENSIONS = ['.txt', '.pdf'];

/**
 * TextInput screen for loading content before RSVP reading.
 * @param {Object}   props
 * @param {Function} props.onTextReady - Callback(text: string) when text is ready
 * @returns {JSX.Element}
 */
export default function TextInput({ onTextReady }) {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // ─── ETA display ──────────────────────────────────────────────────────────
  const etaFor = (wpm) => {
    if (!wordCount) return '—';
    const mins = wordCount / wpm;
    if (mins < 1) return `${Math.ceil(mins * 60)}s`;
    const m = Math.floor(mins);
    const s = Math.round((mins - m) * 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  // ─── File loading ──────────────────────────────────────────────────────────
  const loadFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    const name = file.name.toLowerCase();
    const isPDF = name.endsWith('.pdf');
    const isTXT = name.endsWith('.txt');

    if (!isPDF && !isTXT) {
      setError('Unsupported file type. Please use .txt or .pdf files.');
      return;
    }

    setIsLoading(true);
    setLoadingMsg(isPDF ? 'Reading PDF...' : 'Reading file...');

    try {
      if (isTXT) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setText(e.target.result);
          setIsLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to read the text file.');
          setIsLoading(false);
        };
        reader.readAsText(file);
      } else {
        // PDF via pdfExtractor
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const extracted = await extractTextFromPDF(
              e.target.result,
              (msg) => setLoadingMsg(msg)
            );
            setText(extracted);
          } catch (err) {
            setError(`PDF extraction failed: ${err.message}`);
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read the PDF file.');
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      setError(`Error loading file: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  // ─── Browse button (via Electron dialog) ──────────────────────────────────
  const handleBrowse = useCallback(async () => {
    if (window.electronAPI) {
      try {
        const filePath = await window.electronAPI.openFileDialog();
        if (!filePath) return;
        setIsLoading(true);
        setLoadingMsg('Reading file...');
        setError('');
        const content = await window.electronAPI.readFile(filePath);
        if (filePath.toLowerCase().endsWith('.pdf')) {
          setLoadingMsg('Extracting PDF text...');
          const extracted = await extractTextFromPDF(content, (msg) => setLoadingMsg(msg));
          setText(extracted);
        } else {
          setText(content);
        }
        setIsLoading(false);
      } catch (err) {
        setError(`Could not open file: ${err.message}`);
        setIsLoading(false);
      }
    } else {
      // Web fallback
      fileInputRef.current?.click();
    }
  }, []);

  const handleFileInputChange = useCallback((e) => {
    loadFile(e.target.files?.[0]);
    e.target.value = '';
  }, [loadFile]);

  // ─── Drag and Drop ────────────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  // ─── Begin reading ────────────────────────────────────────────────────────
  const handleBegin = useCallback(() => {
    if (text.trim().length < 10) {
      setError('Please enter or load some text first (at least 10 characters).');
      return;
    }
    onTextReady(text.trim());
  }, [text, onTextReady]);

  // ─── Sample text for demo ─────────────────────────────────────────────────
  const loadSample = () => {
    setText(`The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. Speed reading is a powerful skill that can dramatically increase your productivity and learning capacity.

Rapid Serial Visual Presentation, commonly known as RSVP, is one of the most effective speed reading techniques. By displaying words one at a time at the center of your vision, it eliminates the need for your eyes to move across the page — the single biggest bottleneck in traditional reading.

Research suggests that most adults read at around 200 to 300 words per minute, while comprehension typically remains high up to 500 WPM with practice. Elite speed readers can comfortably process 700 to 1000 words per minute with only modest comprehension loss.

The key to successful RSVP reading lies in the Optimal Recognition Point — the specific letter within each word where your brain can most efficiently decode meaning. By anchoring this point at a fixed position on screen, cognitive load is reduced and reading speed increases dramatically.

Practice consistently, start at a comfortable pace, and gradually increase your speed as your brain adapts. Within weeks, you may find yourself reading twice as fast with similar or even improved comprehension.`);
  };

  return (
    <div className="text-input-screen">
      {/* Header */}
      <div className="ti-header">
        <div className="ti-logo">
          <span className="ti-logo-icon">⚡</span>
          <div>
            <h1 className="ti-logo-title">RSVP Speed Reader</h1>
            <p className="ti-logo-sub">Read faster. Comprehend more.</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ti-content">
        {/* Drop zone / paste area */}
        <div
          className={`ti-dropzone ${isDragging ? 'ti-dropzone--active' : ''} ${isLoading ? 'ti-dropzone--loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="region"
          aria-label="Text input area — drop files here or paste text"
        >
          {isLoading ? (
            <div className="ti-loading">
              <div className="spinner" />
              <p className="ti-loading-msg">{loadingMsg}</p>
            </div>
          ) : text ? (
            <textarea
              className="ti-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Your text appears here..."
              aria-label="Text content to read"
              spellCheck={false}
            />
          ) : (
            <div className="ti-empty">
              <div className="ti-empty-icon">📄</div>
              <p className="ti-empty-title">Paste your text or drop a file here</p>
              <p className="ti-empty-sub">Supports .txt and .pdf files</p>
              <div className="ti-empty-actions">
                <button className="btn btn--primary" onClick={handleBrowse} aria-label="Browse for a file">
                  📂 Browse Files
                </button>
                <button className="btn" onClick={loadSample} aria-label="Load sample text">
                  ✨ Load Sample
                </button>
              </div>
              <p className="ti-empty-hint">or just start typing / pasting above</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="ti-error" role="alert">
            <span>⚠️ {error}</span>
            <button className="btn btn--icon ti-error-dismiss" onClick={() => setError('')} aria-label="Dismiss error">✕</button>
          </div>
        )}

        {/* Bottom bar */}
        <div className="ti-bottom">
          {/* File actions */}
          <div className="ti-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileInputChange}
              className="visually-hidden"
              aria-label="File upload"
            />
            {text && (
              <>
                <button className="btn" onClick={handleBrowse} aria-label="Browse for a different file">
                  📂 Change File
                </button>
                <button className="btn" onClick={() => { setText(''); setError(''); }} aria-label="Clear text">
                  🗑 Clear
                </button>
              </>
            )}
            {!text && (
              <button className="btn" onClick={handleBrowse} aria-label="Browse for a file">
                📂 Browse Files
              </button>
            )}
          </div>

          {/* Stats */}
          {wordCount > 0 && (
            <div className="ti-stats">
              <span className="ti-stat">
                <strong>{wordCount.toLocaleString()}</strong> words
              </span>
              <span className="ti-stat-sep">·</span>
              {SAMPLE_WPM_LIST.map(wpm => (
                <span key={wpm} className="ti-stat">
                  <strong>{etaFor(wpm)}</strong>
                  <span className="ti-stat-label"> @ {wpm} WPM</span>
                </span>
              ))}
            </div>
          )}

          {/* Begin button */}
          <button
            className="btn btn--primary ti-begin-btn"
            onClick={handleBegin}
            disabled={!text.trim() || isLoading}
            aria-label="Begin RSVP reading"
          >
            Begin Reading →
          </button>
        </div>
      </div>

      <style>{textInputStyles}</style>
    </div>
  );
}

const textInputStyles = `
.text-input-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  overflow: hidden;
}
.ti-header {
  padding: 20px 32px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}
.ti-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ti-logo-icon { font-size: 28px; }
.ti-logo-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.ti-logo-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
.ti-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 32px;
  gap: 12px;
  min-height: 0;
}
.ti-dropzone {
  flex: 1;
  border: 2px dashed var(--border);
  border-radius: 16px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
  min-height: 0;
}
.ti-dropzone--active {
  border-color: var(--accent);
  background: var(--surface-2);
}
.ti-dropzone--loading {
  border-style: solid;
  border-color: var(--border-light);
}
.ti-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}
.ti-empty-icon { font-size: 48px; opacity: 0.4; }
.ti-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.ti-empty-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
.ti-empty-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.ti-empty-hint {
  font-size: 12px;
  color: var(--text-dim);
  margin: 0;
}
.ti-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.ti-loading-msg {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  animation: pulse 1.5s ease infinite;
}
.ti-textarea {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
  padding: 20px;
  font-family: inherit;
  user-select: text;
}
.ti-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(229, 57, 53, 0.12);
  border: 1px solid rgba(229, 57, 53, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: var(--accent);
}
.ti-error-dismiss {
  width: 24px;
  height: 24px;
  font-size: 12px;
  color: var(--accent);
  border-color: transparent;
  background: transparent;
  flex-shrink: 0;
}
.ti-bottom {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.ti-actions { display: flex; gap: 8px; }
.ti-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}
.ti-stat strong { color: var(--text-primary); font-weight: 600; }
.ti-stat-label { color: var(--text-dim); }
.ti-stat-sep { color: var(--text-dim); }
.ti-begin-btn {
  margin-left: auto;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
}
`;
