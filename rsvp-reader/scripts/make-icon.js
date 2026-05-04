/**
 * scripts/make-icon.js
 * Copies the source PNG to assets/icon.png and creates assets/icon.ico
 * from it using the png-to-ico package (pure JS, no ImageMagick needed).
 *
 * Run: node scripts/make-icon.js <path-to-source.png>
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const ICON_PNG   = path.join(ASSETS_DIR, 'icon.png');
const ICON_ICO   = path.join(ASSETS_DIR, 'icon.ico');

// Accept source path as argument, default to first arg or a known location
const srcPng = process.argv[2]
  ? path.resolve(process.argv[2])
  : null;

if (!srcPng || !fs.existsSync(srcPng)) {
  console.error('Usage: node scripts/make-icon.js <path-to-icon.png>');
  process.exit(1);
}

// Ensure assets/ exists
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Copy PNG
fs.copyFileSync(srcPng, ICON_PNG);
console.log(`✔  Copied icon.png → ${ICON_PNG}`);

// Convert PNG → ICO using png-to-ico
let pngToIco;
try {
  pngToIco = require('png-to-ico');
} catch {
  console.log('Installing png-to-ico (one-time)...');
  require('child_process').execSync('npm install --no-save png-to-ico', {
    cwd: ROOT, stdio: 'inherit',
  });
  pngToIco = require('png-to-ico');
}

pngToIco(ICON_PNG)
  .then(buf => {
    fs.writeFileSync(ICON_ICO, buf);
    console.log(`✔  Created icon.ico  → ${ICON_ICO}`);
    console.log('\nDone! You can now run: npm run electron:build');
  })
  .catch(err => {
    console.error('Failed to create .ico:', err.message);
    process.exit(1);
  });
