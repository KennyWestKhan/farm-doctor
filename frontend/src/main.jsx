import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/theme.css';
import { LanguageProvider } from './i18n.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { startSync } from './db/sync';
import App from './App.jsx';

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
