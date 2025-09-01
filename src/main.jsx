// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './Styles/tailwind.css';
import App from './App.jsx';

// ⚠️ solo cargar el shim cuando NO estamos en Electron
if (!(window.runtime?.isElectron || window.env?.versions?.electron)) {
  import('./devAuthShim');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
