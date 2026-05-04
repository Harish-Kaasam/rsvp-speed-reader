/**
 * src/renderer/App.jsx
 * Purpose: Root application component. Manages screen routing between the
 *          TextInput screen and the RSVP reading screen. Applies theme and
 *          font-family data attributes to the document root for CSS variable switching.
 * Exports: App (default)
 * Dependencies: React, useSettings, TextInput, RSVPDisplay, Controls,
 *               ProgressBar, SettingsPanel, BookmarksPanel, Toast
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './hooks/useSettings.js';
import { useRSVP } from './hooks/useRSVP.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import TextInput from './components/TextInput.jsx';
import RSVPDisplay from './components/RSVPDisplay.jsx';
import Controls from './components/Controls.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import BookmarksPanel from './components/BookmarksPanel.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────
const SCREEN_INPUT  = 'input';
const SCREEN_READER = 'reader';
const AUTO_SAVE_INTERVAL_MS = 30000;

/**
 * Root application component.
 * @returns {JSX.Element}
 */
export default function App() {
  const { settings, updateSettings } = useSettings();

  // ─── Screen state ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState(SCREEN_INPUT);
  const [rawText, setRawText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [toast, setToast] = useState(null);
  const [resumePrompt, setResumePrompt] = useState(null);
  const autoSaveRef = useRef(null);

  // ─── Apply theme + font to <html> ─────────────────────────────────────────
  useEffect(() => {
    if (!settings) return;
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    document.documentElement.setAttribute('data-font', settings.fontFamily || 'system');
  }, [settings?.theme, settings?.fontFamily]);

  // ─── RSVP Engine ──────────────────────────────────────────────────────────
  const rsvp = useRSVP({ text: rawText, settings });

  // ─── Load bookmarks on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.loadBookmarks().then(setBookmarks).catch(console.error);
  }, []);

  // ─── Auto-save position every 30 seconds ──────────────────────────────────
  useEffect(() => {
    if (screen !== SCREEN_READER || !rawText) return;
    autoSaveRef.current = setInterval(() => {
      if (!window.electronAPI) return;
      const hash = simpleHash(rawText.slice(0, 200));
      window.electronAPI.saveLastSession({ textHash: hash, position: rsvp.currentIndex });
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(autoSaveRef.current);
  }, [screen, rawText, rsvp.currentIndex]);

  // ─── Check resume on text load ─────────────────────────────────────────────
  const handleTextReady = useCallback(async (text) => {
    setRawText(text);
    if (!window.electronAPI) {
      setScreen(SCREEN_READER);
      return;
    }
    try {
      const session = await window.electronAPI.loadLastSession();
      const hash = simpleHash(text.slice(0, 200));
      if (session?.textHash === hash && session.position > 10) {
        setResumePrompt({ position: session.position, hash });
        setScreen(SCREEN_READER);
      } else {
        setScreen(SCREEN_READER);
      }
    } catch {
      setScreen(SCREEN_READER);
    }
  }, []);

  const handleResumeYes = useCallback(() => {
    if (resumePrompt) {
      rsvp.skipTo(resumePrompt.position);
    }
    setResumePrompt(null);
  }, [resumePrompt, rsvp]);

  const handleResumeNo = useCallback(() => {
    setResumePrompt(null);
  }, []);

  // ─── Bookmark management ───────────────────────────────────────────────────
  const dropBookmark = useCallback(() => {
    const words = rawText.split(/\s+/).slice(rsvp.currentIndex, rsvp.currentIndex + 6).join(' ');
    const newBm = {
      id: Date.now(),
      position: rsvp.currentIndex,
      label: `Word ${rsvp.currentIndex + 1}`,
      preview: words,
      createdAt: new Date().toISOString(),
    };
    const updated = [...bookmarks, newBm];
    setBookmarks(updated);
    window.electronAPI?.saveBookmarks(updated);
    showToast('📍 Bookmark saved');
  }, [bookmarks, rsvp.currentIndex, rawText]);

  const deleteBookmark = useCallback((id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    window.electronAPI?.saveBookmarks(updated);
  }, [bookmarks]);

  const jumpToBookmark = useCallback((position) => {
    rsvp.skipTo(position);
    setBookmarksOpen(false);
  }, [rsvp]);

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboard({
    enabled: screen === SCREEN_READER,
    onTogglePlay:    () => rsvp.isPlaying ? rsvp.pause() : rsvp.play(),
    onRestart:       () => rsvp.restart(),
    onNewText:       () => { rsvp.pause(); setScreen(SCREEN_INPUT); },
    onToggleSettings:() => setSettingsOpen(v => !v),
    onSkipBack:      () => rsvp.skipBack(10),
    onSkipForward:   () => rsvp.skipForward(10),
    onSpeedUp:       () => updateSettings({ wpm: Math.min(1000, (settings?.wpm || 300) + 25) }),
    onSpeedDown:     () => updateSettings({ wpm: Math.max(100,  (settings?.wpm || 300) - 25) }),
    onCloseSettings: () => setSettingsOpen(false),
    onBookmark:      () => dropBookmark(),
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {screen === SCREEN_INPUT && (
        <TextInput onTextReady={handleTextReady} />
      )}

      {screen === SCREEN_READER && (
        <>
          {/* Top bar */}
          <header className="top-bar" role="banner">
            <div className="top-bar__logo">
              <span className="top-bar__logo-icon">⚡</span>
              <span className="top-bar__logo-text">RSVP Speed Reader</span>
            </div>
            <div className="top-bar__wpm-control">
              <button
                className="btn btn--icon wpm-btn"
                aria-label="Decrease WPM by 25"
                onClick={() => updateSettings({ wpm: Math.max(100, (settings?.wpm || 300) - 25) })}
              >−</button>
              <button
                className="wpm-display"
                aria-label={`Current speed: ${settings?.wpm || 300} words per minute. Click to edit.`}
                onClick={(e) => {
                  const val = parseInt(prompt('Enter WPM (100–1000):', settings?.wpm || 300));
                  if (!isNaN(val)) updateSettings({ wpm: Math.max(100, Math.min(1000, val)) });
                }}
                title="Click to edit WPM"
              >
                <span className="wpm-number">{settings?.wpm || 300}</span>
                <span className="wpm-label">WPM</span>
              </button>
              <button
                className="btn btn--icon wpm-btn"
                aria-label="Increase WPM by 25"
                onClick={() => updateSettings({ wpm: Math.min(1000, (settings?.wpm || 300) + 25) })}
              >+</button>
            </div>
          </header>

          {/* Progress bar */}
          <ProgressBar
            currentIndex={rsvp.currentIndex}
            totalChunks={rsvp.totalChunks}
            wpm={settings?.wpm || 300}
            chunkSize={settings?.chunkSize || 1}
            chunks={rsvp.chunks}
            onSeek={rsvp.skipTo}
          />

          {/* RSVP Display */}
          <main className="reader-main" role="main">
            <RSVPDisplay
              currentChunk={rsvp.currentChunk}
              settings={settings}
              isPlaying={rsvp.isPlaying}
            />
          </main>

          {/* Controls toolbar */}
          <Controls
            isPlaying={rsvp.isPlaying}
            onPlay={rsvp.play}
            onPause={rsvp.pause}
            onRestart={rsvp.restart}
            onNewText={() => { rsvp.pause(); setScreen(SCREEN_INPUT); }}
            onToggleSettings={() => setSettingsOpen(v => !v)}
            onToggleBookmarks={() => setBookmarksOpen(v => !v)}
          />

          {/* Settings panel */}
          {settingsOpen && (
            <SettingsPanel
              settings={settings}
              onUpdate={updateSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}

          {/* Bookmarks panel */}
          {bookmarksOpen && (
            <BookmarksPanel
              bookmarks={bookmarks}
              onJump={jumpToBookmark}
              onDelete={deleteBookmark}
              onClose={() => setBookmarksOpen(false)}
            />
          )}

          {/* Resume prompt toast */}
          {resumePrompt && (
            <div className="toast" role="alert">
              <p>Resume from where you left off? (word {resumePrompt.position + 1})</p>
              <div className="toast-actions">
                <button className="btn btn--primary" onClick={handleResumeYes}>Yes</button>
                <button className="btn" onClick={handleResumeNo}>No</button>
              </div>
            </div>
          )}

          {/* General toast */}
          {toast && !resumePrompt && (
            <div className="toast" role="status" aria-live="polite">
              <p>{toast}</p>
            </div>
          )}
        </>
      )}

      <style>{appStyles}</style>
    </div>
  );
}

// ─── Simple hash for text identity ────────────────────────────────────────────
/**
 * Generates a simple hash string from text for session resume matching.
 * @param {string} str - Input string (first 200 chars recommended)
 * @returns {string} Hex hash string
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ─── Inline layout styles (structural, not themed) ────────────────────────────
const appStyles = `
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 10;
}
.top-bar__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.top-bar__logo-icon { font-size: 18px; }
.top-bar__logo-text { letter-spacing: -0.01em; }
.top-bar__wpm-control {
  display: flex;
  align-items: center;
  gap: 4px;
}
.wpm-btn {
  width: 28px;
  height: 28px;
  font-size: 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.wpm-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--btn-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
  color: var(--text-primary);
  min-width: 64px;
}
.wpm-display:hover { background: var(--btn-hover); }
.wpm-number { font-size: 18px; font-weight: 700; line-height: 1; }
.wpm-label  { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); }
.reader-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 24px;
}
`;
