import { useState, useEffect, useMemo } from 'react';
import { useLang } from '../i18n.jsx';

const REVIEW_KEY = 'fd_review';
const SCAN_COUNT_KEY = 'fd_scan_count';
const DEVICE_ID_KEY = 'fd_device_id';
const API = import.meta.env.VITE_API_URL || '';

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch { return `anon-${Date.now()}`; }
}

export function bumpScanCount() {
  try {
    const n = parseInt(localStorage.getItem(SCAN_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(SCAN_COUNT_KEY, String(n));
    return n;
  } catch { return 0; }
}

function shouldShow() {
  try {
    const state = localStorage.getItem(REVIEW_KEY);
    if (state === 'done') return false;
    if (state === 'later') {
      const ts = parseInt(localStorage.getItem(REVIEW_KEY + '_ts') || '0', 10);
      if (Date.now() - ts < 3 * 24 * 60 * 60 * 1000) return false;
    }
    const count = parseInt(localStorage.getItem(SCAN_COUNT_KEY) || '0', 10);
    return count === 1;
  } catch { return false; }
}

const Star = ({ filled, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`${filled ? 'selected' : ''} star`}
    style={{
      background: 'none', border: 'none', padding: 2, cursor: 'pointer',
      fontSize: 36, lineHeight: 1, transition: 'transform .15s ease',
      transform: filled ? 'scale(1.15)' : 'scale(1)',
    }}
  >
    {filled ? '⭐' : '☆'}
  </button>
);

export default function ReviewPrompt() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const deviceId = useMemo(getDeviceId, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (shouldShow()) setVisible(true); }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(REVIEW_KEY, 'later');
      localStorage.setItem(REVIEW_KEY + '_ts', String(Date.now()));
    } catch {}
    setVisible(false);
  };

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, rating, comment: comment.trim() || null }),
      });
    } catch { /* offline — still dismiss */ }
    try { localStorage.setItem(REVIEW_KEY, 'done'); } catch {}
    setSubmitted(true);
    setTimeout(() => setVisible(false), 1400);
  };

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn .25s ease',
        }}
      />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 9999, width: 'min(320px, calc(100vw - 48px))',
        background: 'var(--card)', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        overflow: 'hidden', textAlign: 'center',
        animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {submitted ? (
          <div style={{ padding: '36px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, margin: 0, color: 'var(--ink)' }}>
              {t('review_thanks')}
            </h3>
          </div>
        ) : (
          <>
            <div style={{ padding: '28px 24px 0' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, margin: '0 0 6px', color: 'var(--ink)' }}>
                {t('review_title')}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 16px', lineHeight: 1.45 }}>
                {t('review_body')}
              </p>

              {/* Star picker */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} filled={n <= rating} onClick={() => setRating(n)} />
                ))}
              </div>

              {/* Comment (shows after picking a rating) */}
              {rating > 0 && (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('review_comment_placeholder')}
                  maxLength={500}
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 15,
                    borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--line)',
                    fontFamily: 'var(--font-body)', resize: 'none',
                    background: 'var(--bg)', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>

            <div style={{ marginTop: 18, borderTop: '1px solid var(--line)' }}>
              <button
                onClick={submit}
                disabled={!rating || submitting}
                style={{
                  width: '100%', padding: '15px 0', border: 'none', background: 'none',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
                  color: rating ? 'var(--green)' : 'var(--ink-soft)',
                  borderBottom: '1px solid var(--line)',
                  opacity: rating ? 1 : 0.5,
                }}
              >
                {submitting ? '...' : t('review_submit')}
              </button>
              <button
                onClick={dismiss}
                style={{
                  width: '100%', padding: '14px 0', border: 'none', background: 'none',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
                  color: 'var(--ink-2)',
                }}
              >
                {t('review_later')}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
