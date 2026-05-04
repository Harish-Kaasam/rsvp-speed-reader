# RSVP Speed Reader — Setup Guide

## Overview

RSVP Speed Reader is a desktop application that uses **Rapid Serial Visual Presentation** to
help you read faster. Words appear one at a time at a fixed focal point, eliminating the need
to move your eyes across the page.

---

## Prerequisites

### 1. Install Node.js 20 LTS

1. Go to **https://nodejs.org**
2. Click **"LTS"** (Long Term Support) to download the installer
3. Run the installer with default settings
4. Verify installation by opening a terminal and running:
   ```
   node --version   → should print v20.x.x
   npm --version    → should print 10.x.x
   ```

---

## Running the App in Development Mode

### 2. Open the project folder

Open **PowerShell** or **Command Prompt** and navigate to the project folder:

```powershell
cd C:\Users\admin\Documents\RSVP\rsvp-reader
```

### 3. Install dependencies

```powershell
npm install
```

This installs all packages including Electron, React, Vite, and PDF.js.
It may take 2–5 minutes on first run.

### 4. Launch the app

```powershell
npm run dev
```

This starts both the Vite dev server and the Electron window simultaneously.
The app window will open automatically. **Hot reload is enabled** — changes to
React files update the app instantly without restarting.

---

## Building the Windows .exe Installer

### 5. Build the installer

```powershell
npm run build:win
```

This will:
1. Bundle the React app with Vite (`dist/renderer/`)
2. Run electron-builder to package everything into an NSIS installer

### 6. Find the installer

The installer will be at:
```
rsvp-reader\release\RSVP Speed Reader Setup 1.0.0.exe
```

### 7. Install and run

Double-click the `.exe` file and follow the installer wizard.
It will create desktop and Start Menu shortcuts automatically.

---

## How to Add a Custom App Icon

1. Create a **256×256** pixel `.ico` file (Windows icon format)
2. Place it at: `rsvp-reader\assets\icon.ico`
3. Also add `assets\icon.png` (for Linux) and `assets\icon.icns` (for macOS)
4. Rebuild: `npm run build:win`

**Free tools to create .ico files:**
- https://convertico.com (online converter)
- https://www.icoconverter.com

---

## Common Errors & Fixes

### ❌ "electron not found" or "Cannot find module 'electron'"
```powershell
npm install --save-dev electron
```

### ❌ Blank white window / white screen on launch
Check `vite.config.js` — make sure `base: './'` is set (not `/`).
Also verify the Vite dev server is running on port 5173 before Electron opens.

### ❌ PDF.js worker error: "Setting up fake worker failed"
This means the PDF worker script can't be found. It's resolved automatically in
production builds. In dev mode, ensure you have `pdfjs-dist` installed:
```powershell
npm install pdfjs-dist
```

### ❌ "EPERM: operation not permitted" during build
Close any running instances of the app before building.

### ❌ "concurrently not found"
```powershell
npm install --save-dev concurrently wait-on
```

### ❌ App opens but shows "Cannot GET /"
The Vite server hasn't started yet. Wait 2–3 seconds and the Electron window
will auto-reload, or press `Ctrl+R` inside the app window.

---

## Development Notes

| Command           | What it does                                      |
|-------------------|---------------------------------------------------|
| `npm run dev`     | Start dev mode (hot reload)                       |
| `npm run build`   | Build for current platform                        |
| `npm run build:win` | Build Windows NSIS installer                    |
| `npm run preview` | Preview the Vite production build in browser      |

### File structure overview
```
rsvp-reader/
├── src/main/         ← Electron main process (Node.js)
│   ├── main.js       ← Window creation, IPC handlers
│   ├── preload.js    ← Secure API bridge to renderer
│   └── store.js      ← Persistent settings (electron-store)
└── src/renderer/     ← React frontend (Vite)
    ├── App.jsx        ← Root component + screen routing
    ├── components/    ← UI components
    ├── hooks/         ← useRSVP, useKeyboard, useSettings
    └── utils/         ← PDF extraction, text processing, ETA
```

---

## Settings Location

User settings and bookmarks are stored in:
```
C:\Users\<YourName>\AppData\Roaming\rsvp-speed-reader\rsvp-reader-config.json
```

Delete this file to reset all settings to defaults.
