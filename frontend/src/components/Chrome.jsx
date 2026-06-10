import { useLang } from '../i18n.jsx';
import { useOnline } from './useOnline';

/** Top bar: app name, online/offline status, language toggle. */
export function TopBar() {
  const { t, lang, toggle } = useLang();
  const online = useOnline();
  return (
    <>
      <div className={`netbar ${online ? 'netbar--on' : 'netbar--off'}`}>
        <span>{online ? '🟢' : '⚪'}</span>
        <span>{online ? t('online') : t('offline')}</span>
      </div>
      <header className="row" style={{ justifyContent: 'space-between', padding: '12px 18px 0' }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
          🌱 {t('app_name')}
        </strong>
        <button
          className="pill pill--soil"
          onClick={toggle}
          aria-label="Switch language"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          {lang === 'en' ? '🇬🇭 Twi' : '🇬🇧 English'}
        </button>
      </header>
    </>
  );
}

export function BackButton({ onClick }) {
  const { t } = useLang();
  if (!onClick) return null;
  return (
    <button className="btn btn--ghost" onClick={onClick} style={{ marginBottom: 16 }}>
      ← {t('back')}
    </button>
  );
}
