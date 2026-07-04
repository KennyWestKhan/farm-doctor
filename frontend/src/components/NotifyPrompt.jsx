import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { canNotify, ensureNotifyPermission } from '../utils/notify.js';

/**
 * Opt-in shown on a result that is still awaiting the Claude Vision recheck.
 * The farmer taps to be notified when the AI answer lands (which may be after
 * they've left the screen). Requesting permission on a real tap — not on page
 * load — is both better UX and far less likely to be auto-blocked.
 *
 * Renders nothing when there's no pending recheck, when notifications aren't
 * supported, or when the farmer previously denied them.
 */
export default function NotifyPrompt({ show }) {
  const { t } = useLang();
  const [state, setState] = useState(() => {
    if (!canNotify()) return 'off';
    if (Notification.permission === 'granted') return 'on';
    if (Notification.permission === 'denied') return 'off';
    return 'ask';
  });

  if (!show || state === 'off') return null;

  if (state === 'on') {
    return (
      <div className="card card--tint" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 24 }}>🔔</span>
        <strong style={{ color: 'var(--green-deep)', fontSize: 14, fontFamily: 'var(--font-display)' }}>{t('notify_on')}</strong>
      </div>
    );
  }

  return (
    <button
      className="card"
      onClick={async () => setState((await ensureNotifyPermission()) ? 'on' : 'off')}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 14 }}
    >
      <span style={{ fontSize: 28 }}>🔔</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{t('notify_cta')}</strong>
        <div className="muted" style={{ fontSize: 13 }}>{t('notify_sub')}</div>
      </div>
    </button>
  );
}
