import { useLang } from '../i18n.jsx';
import { useOnline } from './useOnline';

/** Small language toggle pill — green tint on light, ghost on gradient headers. */
export function LangToggle({ onGradient = false }) {
  const { lang, toggle } = useLang();
  return (
    <button
      className={`pill ${onGradient ? 'pill--ghost' : 'pill--green'}`}
      onClick={toggle}
      aria-label="Switch language"
      style={{ border: 'none' }}
    >
      {lang === 'en' ? '🇬🇭 Twi' : '🇬🇧 English'}
    </button>
  );
}

/** Online/offline dot — subtle, used in headers. */
export function NetDot({ onGradient = false }) {
  const { t } = useLang();
  const online = useOnline();
  return (
    <span
      className={`pill ${onGradient ? 'pill--ghost' : 'pill--green'}`}
      style={{ fontSize: 12 }}
      title={online ? t('online') : t('offline')}
    >
      {online ? '🟢' : '⚪'} {online ? t('online') : t('offline')}
    </span>
  );
}

/**
 * Detail-screen header: circular back button, centered title, optional right
 * action. White by default; pass `gradient` to sit on a gradient block.
 */
export function Header({ title, onBack, action, gradient = false }) {
  return (
    <div className="between" style={{ padding: gradient ? 0 : '4px 0 14px' }}>
      {onBack ? (
        <button className={`icon-btn ${gradient ? 'icon-btn--on-grad' : ''}`} onClick={onBack} aria-label="Back">
          ←
        </button>
      ) : (
        <span style={{ width: 44 }} />
      )}
      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: gradient ? '#fff' : 'var(--ink)' }}>
        {title}
      </strong>
      <span style={{ minWidth: 44, display: 'flex', justifyContent: 'flex-end' }}>{action}</span>
    </div>
  );
}
