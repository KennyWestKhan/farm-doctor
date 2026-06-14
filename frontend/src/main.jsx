import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/theme.css';
import { LanguageProvider } from './i18n.jsx';
import { startSync } from './db/sync';
import App from './App.jsx';

// Flush offline queues to the backend whenever we have connectivity.
startSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);

// Dismiss the static splash once the first app frame has actually painted
// (two rAFs = after layout + paint). The inline fallback timer covers edge cases.
requestAnimationFrame(() => requestAnimationFrame(() => window.__hideSplash?.()));
