import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';

/**
 * Floating "back to top" button. Appears once the window is scrolled past
 * `threshold`px and smooth-scrolls to the top on tap. Sits just above the fixed
 * tab bar. The page scrolls at the window level (no inner scroll container), so
 * we listen to window scroll.
 */
export default function ScrollToTopButton({ threshold = 600 }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll(); // sync in case we mount already scrolled
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  // Portaled to <body> so `position: fixed` is viewport-relative — the animated
  // (transformed) screen ancestor would otherwise become its containing block
  // and push it off-screen. `right` is clamped to the centered app column so it
  // stays 18px inside the phone frame even on a wide desktop viewport.
  return createPortal(
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('scroll_top')}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-h) + 18px + env(safe-area-inset-bottom))',
        right: 'max(18px, calc((100vw - 460px) / 2 + 18px))',
        zIndex: 40,
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--green)',
        color: '#fff',
        boxShadow: '0 6px 18px rgba(24,36,29,0.28)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)',
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity .22s ease, transform .22s cubic-bezier(0.22,0.78,0.28,1)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
      </svg>
    </button>,
    document.body
  );
}
