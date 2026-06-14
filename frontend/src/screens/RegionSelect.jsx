import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { Header } from '../components/Chrome.jsx';
import { setSavedRegion } from '../utils/prefs';

export default function RegionSelect({ onPick, onBack }) {
  const { t, pick } = useLang();
  // Remember the choice so we don't ask again on the next diagnosis.
  const choose = (id) => { setSavedRegion(id); onPick(id); };
  return (
    <div className="screen page-enter">
      <Header title={t('choose_region')} onBack={onBack} />
      <div className="stagger stack" style={{ marginTop: 6 }}>
        {Object.entries(REGIONS).map(([id, name]) => (
          <button key={id} className="card between" onClick={() => choose(id)} style={{ minHeight: 'var(--tap-min)' }}>
            <span className="row" style={{ gap: 12 }}>
              <span style={{ fontSize: 22 }}>📍</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{pick(name)}</strong>
            </span>
            <span style={{ fontSize: 20, color: 'var(--green)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
