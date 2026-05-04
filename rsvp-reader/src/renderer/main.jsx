/**
 * src/renderer/main.jsx
 * Purpose: React application entry point. Mounts the root App component
 *          into the DOM with StrictMode enabled for development warnings.
 * Exports: None (side effects only)
 * Dependencies: react, react-dom, App, global.css
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
