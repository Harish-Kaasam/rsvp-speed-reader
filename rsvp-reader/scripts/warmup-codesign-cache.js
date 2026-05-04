/**
 * scripts/warmup-codesign-cache.js
 *
 * Pre-warms the electron-builder winCodeSign binary cache using the
 * app-builder executable (which handles macOS symlinks gracefully).
 *
 * On Windows, 7-Zip cannot create symlinks without Developer Mode enabled,
 * so electron-builder's own extraction of winCodeSign-2.6.0.7z fails.
 * The app-builder binary handles this correctly — it returns the cached path
 * without error even when some symlink entries are skipped.
 *
 * This script runs before electron-builder so the cache is populated.
 * Run: node scripts/warmup-codesign-cache.js
 */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const os   = require('os');
const fs   = require('fs');

// Only needed on Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

const ROOT       = path.resolve(__dirname, '..');
const APP_BUILDER = path.join(ROOT, 'node_modules', 'app-builder-bin', 'win', 'x64', 'app-builder.exe');

if (!fs.existsSync(APP_BUILDER)) {
  console.warn('⚠  app-builder.exe not found, skipping winCodeSign cache warm-up.');
  console.warn('   Run: npm install  to restore devDependencies.');
  process.exit(0);
}

console.log('🔧  Warming up winCodeSign cache (run once, cached afterwards)...');

try {
  const result = execFileSync(APP_BUILDER, ['download-artifact', '--name', 'winCodeSign-2.6.0'], {
    encoding: 'utf-8',
    timeout: 120_000,
  }).trim();

  if (result && fs.existsSync(result)) {
    console.log(`✔  winCodeSign cache ready: ${result}`);
  } else {
    console.warn('⚠  Unexpected output from app-builder:', result);
  }
} catch (err) {
  // Non-fatal — electron-builder may still succeed or show a better error
  console.warn('⚠  winCodeSign cache warm-up failed (non-fatal):', err.message);
}
