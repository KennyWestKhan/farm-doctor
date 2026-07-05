import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/theme.css';
import { LanguageProvider } from './i18n.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { startSync } from './db/sync';
import App from './App.jsx';

// When a redeployed build's service worker takes over, reload once so the
// device lands on the fresh bundle instead of a stale cached one — the usual
// cause of "the button does nothing after we shipped a fix." Guarded against
// the first install (no prior controller) and against reload loops.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    window.location.reload();
  });
}

startSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);

requestAnimationFrame(() => requestAnimationFrame(() => window.__hideSplash?.()));
