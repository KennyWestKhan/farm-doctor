import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';

/**
 * Compact "AI" tag for the header top-right. Tapping opens a sheet with the
 * Claude Vision details (disease, what the AI saw, any note) — replaces the
 * bulky inline "Rechecked by AI" card. Renders nothing without a vision result.
 */
export default function AiTag({ vision }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  if (!vision) return null;

  return (
    <>
      <button className="pill pill--green" onClick={() => setOpen(true)} style={{ border: 'none', whiteSpace: 'nowrap' }}>
        🤖 {t('ai_tag')}
      </button>

      {open && createPortal(
        <>
          <div className="sheet-scrim" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('rechecked_by_ai')}>
            <div className="sheet__grip" />
            <div className="between" style={{ marginBottom: 12 }}>
              <h3>🤖 {t('rechecked_by_ai')}</h3>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="stack">
              {vision.disease && (
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('diagnosis')}</div>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18, textTransform: 'capitalize' }}>{vision.disease}</strong>
                  {typeof vision.confidence === 'number' && (
                    <span className="pill pill--green" style={{ marginLeft: 8 }}>{Math.round(vision.confidence * 100)}%</span>
                  )}
                </div>
              )}
              {vision.symptoms_observed && (
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('ai_observed')}</div>
                  <div style={{ fontSize: 16 }}>{vision.symptoms_observed}</div>
                </div>
              )}
              {vision.feedback_if_unclear && (
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('ai_note')}</div>
                  <div style={{ fontSize: 16 }}>{vision.feedback_if_unclear}</div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
