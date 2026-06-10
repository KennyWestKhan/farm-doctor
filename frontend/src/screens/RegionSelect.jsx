import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { BackButton } from '../components/Chrome.jsx';

export default function RegionSelect({ onPick, onBack }) {
  const { t, pick } = useLang();
  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <div>
        <h2>{t('choose_region')}</h2>
        <div className="kente-rule" style={{ width: 80, margin: '12px 0 4px' }} />
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {Object.entries(REGIONS).map(([id, name]) => (
          <button
            key={id}
            className="card row"
            onClick={() => onPick(id)}
            style={{ cursor: 'pointer', justifyContent: 'space-between', minHeight: 'var(--tap-min)' }}
          >
            <span className="row" style={{ gap: 12 }}>
              <span style={{ fontSize: 26 }}>📍</span>
              <strong style={{ fontSize: 19 }}>{pick(name)}</strong>
            </span>
            <span style={{ fontSize: 22, color: 'var(--leaf)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
