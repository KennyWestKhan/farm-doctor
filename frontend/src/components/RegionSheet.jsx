import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { setSavedRegion } from '../utils/prefs';

/** Slide-up region picker for changing the saved location from anywhere. */
export default function RegionSheet({ current, onPick, onClose }) {
  const { t, pick } = useLang();
  const choose = (id) => {
    setSavedRegion(id);
    onPick?.(id);
    onClose();
  };
  return (
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        <div className="between" style={{ marginBottom: 8 }}>
          <h3>{t('choose_region')}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="stack">
          {Object.entries(REGIONS).map(([id, name]) => {
            const active = id === current;
            return (
              <button
                key={id}
                className="card between"
                onClick={() => choose(id)}
                style={{ minHeight: 56, border: active ? '2px solid var(--green)' : '2px solid transparent' }}
              >
                <span className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{pick(name)}</strong>
                </span>
                {active && <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
