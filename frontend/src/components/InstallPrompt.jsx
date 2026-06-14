import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';

/**
 * Custom "Add to Home Screen" prompt.
 *
 * Two paths because the platforms differ:
 *  - Android/Chromium fires `beforeinstallprompt`. We capture & defer it, then
 *    trigger the real OS install dialog from our own button.
 *  - iOS/Safari has no such API — install is always manual via Share → Add to
 *    Home Screen, so we show illustrated steps instead.
 *
 * Shown once on first eligible visit; dismissal/instal is remembered so we don't
 * nag. Never shows when already running installed (standalone display mode).
 */

const SEEN_KEY = 'fd_install_seen';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

const isIOSSafari = () =>
  isIOS() && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

// iOS share glyph (square with up arrow).
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
    <path d="M12 16V4" /><path d="m8 8 4-4 4 4" />
    <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
  </svg>
);

export default function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState(null);
  const [mode, setMode] = useState(null); // 'android' | 'ios' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(SEEN_KEY)) return;

    let timer;
    const onBIP = (e) => {
      e.preventDefault(); // stop Chrome's default mini-infobar
      setDeferred(e);
      setMode('android');
      timer = setTimeout(() => setVisible(true), 1500);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // iOS never fires the event; offer manual instructions instead.
    if (isIOSSafari()) {
      setMode('ios');
      timer = setTimeout(() => setVisible(true), 1500);
    }

    const onInstalled = () => { remember(); setVisible(false); };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(timer);
    };
  }, []);

  const remember = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ } };

  const close = () => { remember(); setVisible(false); };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    remember();
    setVisible(false);
    setDeferred(null);
  };

  if (!visible || !mode) return null;

  return (
    <>
      <div className="sheet-scrim" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('install_title')}>
        <div className="sheet__grip" />

        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <img src="/icons/icon-192.png" alt="" width={56} height={56} style={{ borderRadius: 14, boxShadow: 'var(--shadow-card)' }} />
          <div style={{ flex: 1 }}>
            <h3>{t('install_title')}</h3>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{t('install_body')}</p>
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="pill pill--green">📴 {t('install_offline_perk')}</span>
          <span className="pill pill--green">⚡ {t('install_fast_perk')}</span>
        </div>

        {mode === 'android' ? (
          <div className="stack" style={{ marginTop: 18 }}>
            <button className="btn btn--block" onClick={install}>⬇️ {t('install_cta')}</button>
            <button className="btn btn--tint btn--block" onClick={close}>{t('install_later')}</button>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 18 }}>
            <div className="card--tint" style={{ borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span>{t('install_ios_pre')}</span>
              <ShareIcon />
              <span>{t('install_ios_post')}</span>
            </div>
            <button className="btn btn--tint btn--block" onClick={close}>{t('install_later')}</button>
          </div>
        )}
      </div>
    </>
  );
}
