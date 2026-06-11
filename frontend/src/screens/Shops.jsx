import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import SupplierList from '../components/SupplierList.jsx';

export default function Shops() {
  const { t, pick } = useLang();
  const [region, setRegion] = useState('ashanti');

  return (
    <div className="screen screen--flush page-enter">
      <div className="gradhead">
        <h1>{t('shops_title')}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>{t('shops_subtitle')}</p>
      </div>

      <div style={{ padding: '16px 18px 0' }}>
        {/* Region filter chips */}
        <div className="scroll-x" style={{ marginBottom: 16 }}>
          {Object.entries(REGIONS).map(([id, name]) => (
            <button
              key={id}
              className="pill"
              onClick={() => setRegion(id)}
              style={{
                whiteSpace: 'nowrap', minHeight: 40, padding: '8px 16px',
                background: region === id ? 'var(--green)' : 'var(--card)',
                color: region === id ? '#fff' : 'var(--ink-2)',
                boxShadow: region === id ? 'none' : 'var(--shadow-card)',
                border: 'none',
              }}
            >
              📍 {pick(name)}
            </button>
          ))}
        </div>

        <div className="stagger">
          <SupplierList region={region} />
        </div>
      </div>
    </div>
  );
}
