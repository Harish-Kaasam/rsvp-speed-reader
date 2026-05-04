# RSVP Speed Reader

> A production-ready Rapid Serial Visual Presentation speed reading desktop application
> built with Electron + React. Read 2–3× faster with Spritz-style focus letter highlighting.

---

## Features

### 📄 Text Loading
- Paste text directly into the full-screen text area
- Drag-and-drop `.txt` or `.pdf` files
- Browse files via native OS dialog
- PDF extraction with header/footer removal, hyphenation correction
- Word count + estimated reading times at 200 / 300 / 500 WPM before starting

### ⚡ RSVP Reading Engine
- Words displayed one chunk at a time in a clean, centred display box
- **Spritz-style ORP highlighting**: focus letter shown in accent colour at fixed position
- Vertical guide lines above/below the optimal recognition point
- Chunk sizes: 1–5 words per flash
- **Speed variability**: shorter words flash faster, longer words slower (maintains average WPM)
- Automatic pauses: 2× at sentence ends (. ! ?), 3× at paragraph breaks
- Smooth playback up to 1000 WPM using recursive setTimeout (zero computation in loop)

### 🎛️ Controls & Shortcuts
- Play / Pause / Restart / New Text / Settings / Bookmarks toolbar
- Full keyboard control (see shortcuts below)
- WPM adjuster with inline −/+ buttons and click-to-edit

### 📊 Progress Bar
- Full-width animated bar with word count and percentage
- **ETA display**: "~4m 12s remaining"
- **Click-to-seek**: click anywhere to jump to that position
- Hover tooltip shows word preview at cursor position

### ⚙️ Settings Panel
- Slide-in drawer (right side) — no modal, non-blocking
- WPM slider + number input (100–1000, step 25)
- Chunk size segmented control (1–5)
- Speed variability, sentence/paragraph pause toggles
- Font size slider (16–72px)
- Font family (System / Roboto / Georgia / Courier)
- Theme switcher (Dark / Light / Sepia) — live, no restart
- Focus letter colour picker
- Display width (Narrow / Medium / Wide)
- Stopword skip with editable word list
- Full keyboard shortcuts reference

### 🔖 Bookmarks
- Press `B` to drop a bookmark at current position
- Auto-saves position every 30 seconds
- Resume prompt on re-opening the same text
- Bookmarks panel with word preview and jump-to

### 💾 Persistence
- All settings saved to disk via electron-store
- Bookmarks and last session position persist across app restarts
- Settings location: `%AppData%\rsvp-speed-reader\`

---

## Keyboard Shortcuts

| Key        | Action                          |
|------------|---------------------------------|
| `Space`    | Toggle Pause / Resume           |
| `R`        | Restart from beginning          |
| `N`        | New Text (pauses reading)       |
| `S`        | Toggle Settings panel           |
| `B`        | Drop a Bookmark at current word |
| `← Arrow`  | Skip back 10 words              |
| `→ Arrow`  | Skip forward 10 words           |
| `↑ Arrow`  | Increase WPM by 25              |
| `↓ Arrow`  | Decrease WPM by 25              |
| `Escape`   | Close Settings / Bookmarks      |

---

## Themes

| Theme | Background | Display Box | Accent |
|-------|-----------|-------------|--------|
| Dark (default) | `#0f0f0f` | `#111111` | `#e53935` |
| Light | `#f5f5f5` | `#fafafa` | `#c62828` |
| Sepia | `#f4ecd8` | `#f9f3e3` | `#8b0000` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 28+ |
| UI framework | React 18 |
| Bundler | Vite 5 |
| Packaging | electron-builder (NSIS for Windows) |
| PDF parsing | pdfjs-dist (Mozilla PDF.js) |
| Settings storage | electron-store |
| Styling | Plain CSS with CSS custom properties |
| IPC | contextBridge (no nodeIntegration) |

---

## Project Structure

```
rsvp-reader/
├── package.json
├── electron-builder.yml
├── vite.config.js
├── SETUP.md
├── README.md
├── assets/
│   └── icon.ico              ← App icon (replace with your own)
└── src/
    ├── main/
    │   ├── main.js           ← Electron main process
    │   ├── preload.js        ← contextBridge API
    │   └── store.js          ← electron-store schema
    └── renderer/
        ├── index.html
        ├── main.jsx
        ├── App.jsx
        ├── styles/global.css
        ├── components/
        │   ├── RSVPDisplay.jsx
        │   ├── FocusLetter.jsx
        │   ├── Controls.jsx
        │   ├── ProgressBar.jsx
        │   ├── SettingsPanel.jsx
        │   ├── TextInput.jsx
        │   └── BookmarksPanel.jsx
        ├── hooks/
        │   ├── useRSVP.js
        │   ├── useKeyboard.js
        │   └── useSettings.js
        └── utils/
            ├── pdfExtractor.js
            ├── textProcessor.js
            └── timeEstimator.js
```

---

## Quick Start

```powershell
cd rsvp-reader
npm install
npm run dev
```

## Build Windows Installer

```powershell
npm run build:win
# Installer → release/RSVP Speed Reader Setup 1.0.0.exe
```

---

## License

MIT — free for personal and commercial use.
