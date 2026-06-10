import { useLang } from '../i18n.jsx';
import { BrandMark } from '../components/CropArt.jsx';

export default function Home({ onStart, onDashboard }) {
  const { t } = useLang();
  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="center" style={{ marginTop: 12 }}>
        <div className="float" style={{ display: 'inline-block', filter: 'drop-shadow(0 12px 18px rgba(58,42,23,0.25))' }}>
          <BrandMark size={148} />
        </div>
      </div>

      <div className="center" style={{ marginTop: 18 }}>
        <h1>{t('app_name')}</h1>
        <div className="kente-rule" style={{ width: 120, margin: '14px auto' }} />
        <p className="muted" style={{ fontSize: 20, maxWidth: 340, margin: '0 auto' }}>
          {t('tagline')}
        </p>
      </div>

      <div className="stack" style={{ marginTop: 28 }}>
        <button className="btn" onClick={onStart} style={{ fontSize: 22 }}>
          📷 {t('start')}
        </button>
        <button className="btn btn--ghost" onClick={onDashboard}>
          📊 Dashboard
        </button>
      </div>

      <div className="row center" style={{ marginTop: 'auto', justifyContent: 'center', gap: 8, color: 'var(--ink-soft)', fontSize: 14, paddingTop: 24 }}>
        <span className="pill pill--ok">✓ {t('offline')}</span>
        <span className="pill pill--soil">📱 Any phone</span>
      </div>
    </div>
  );
}
