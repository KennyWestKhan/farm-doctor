import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';

// Crisp SVG icons (unambiguous, sharp at any size — no emoji).
const LeafCamIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 8c0 6-4 9-9 9-3 0-5-1-5-1s2-9 9-10c3-.4 5 0 5 2z" fill="rgba(255,255,255,0.18)" />
    <path d="M6 16c2-3 5-5 9-6" />
  </svg>
);
const LabelIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" fill="rgba(255,255,255,0.18)" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

export default function Scan() {
  const { t } = useLang();
  const nav = useNavigate();

  const Choice = ({ icon, title, desc, to, bg }) => (
    <button className="card" onClick={() => nav(to)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18, textAlign: 'left' }}>
      <span style={{ width: 64, height: 64, borderRadius: 18, background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 19, display: 'block' }}>{title}</strong>
        <span className="muted" style={{ fontSize: 14 }}>{desc}</span>
      </span>
      <span style={{ fontSize: 22, color: 'var(--green)' }}>→</span>
    </button>
  );

  return (
    <div className="screen page-enter">
      <Header title={t('scan_title')} onBack={() => nav('/')} />
      <p className="muted" style={{ marginTop: 0 }}>{t('scan_hub_subtitle')}</p>
      <div className="stagger stack" style={{ marginTop: 8 }}>
        <Choice
          icon={<LeafCamIcon />}
          title={t('scan_crop_title')}
          desc={t('scan_crop_desc')}
          to="/scan/crop"
          bg="var(--green)"
        />
        <Choice
          icon={<LabelIcon />}
          title={t('scan_label_title')}
          desc={t('scan_subtitle')}
          to="/scan/label"
          bg="var(--gold-deep, #c97e0a)"
        />
      </div>
    </div>
  );
}
