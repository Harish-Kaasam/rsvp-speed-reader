/**
 * vite.config.js
 * Purpose: Vite build configuration for the React renderer process.
 *          base:"./" is CRITICAL for Electron's file:// protocol —
 *          without it all asset paths start with "/" and break in production.
 * Dependencies: vite, @vitejs/plugin-react
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // React source root lives in src/renderer/
  root: resolve(__dirname, 'src/renderer'),

  // CRITICAL: relative base so asset URLs work under file:// in Electron
  base: './',

  build: {
    // Output goes to dist/ at project root so electron-builder can find it
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,

    // Disable source maps in production for a smaller, faster bundle
    sourcemap: false,

    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  optimizeDeps: {
    // Electron is not available in the renderer — exclude from bundle
    exclude: ['electron'],
    // Pre-bundle pdfjs-dist so its worker URL resolves correctly
    include: ['pdfjs-dist'],
  },
});
