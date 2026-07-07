import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import SupplierList from '../components/SupplierList.jsx';
import { VENDOR_CATEGORIES } from '../data/vendorCategories';
import { regionsInData } from '../data/suppliers';
import vendorSeed from '../data/vendors.seed.json';
import { getSavedRegion } from '../utils/prefs';
import ShopSubmitForm from '../components/ShopSubmitForm.jsx';
import ScrollToTopButton from '../components/ScrollToTopButton.jsx';

// Only show region chips for regions that actually have vendors (+ "All").
const DATA_REGIONS = regionsInData(vendorSeed);

function Chip({ active, onClick, children }) {
  return (
    <button
      className="pill"
      onClick={onClick}
      style={{
        whiteSpace: 'nowrap', minHeight: 40, padding: '8px 16px',
        background: active ? 'var(--green)' : 'var(--card)',
        color: active ? '#fff' : 'var(--ink-2)',
        boxShadow: active ? 'none' : 'var(--shadow-card)',
        border: 'none',
      }}
    >
      {children}
    </button>
  );
}

export default function Shops() {
  const { t, pick } = useLang();
  const [category, setCategory] = useState(null); // null = all types
  // Open on the farmer's saved location if we actually have suppliers there;
  // otherwise fall back to "all regions" rather than an empty-looking filter.
  const [region, setRegion] = useState(() => {
    const saved = getSavedRegion();
    return saved && DATA_REGIONS.includes(saved) ? saved : 'all';
  });
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="screen screen--flush page-enter">
      <div className="gradhead">
        <h1>{t('shops_title')}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>{t('shops_subtitle')}</p>
      </div>

      <div style={{ padding: '16px 18px 0' }}>
        {/* Category filter (primary) */}
        <div className="scroll-x" style={{ marginBottom: 10 }}>
          <Chip active={category === null} onClick={() => setCategory(null)}>
            🗂️ {t('shops_all_categories')}
          </Chip>
          {VENDOR_CATEGORIES.map((c) => (
            <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
              {c.icon} {t(c.i18n)}
            </Chip>
          ))}
        </div>

        {/* Region filter (secondary) */}
        <div className="scroll-x" style={{ marginBottom: 16 }}>
          <Chip active={region === 'all'} onClick={() => setRegion('all')}>
            📍 {t('shops_filter_all')}
          </Chip>
          {DATA_REGIONS.map((id) => (
            <Chip key={id} active={region === id} onClick={() => setRegion(id)}>
              📍 {pick(REGIONS[id])}
            </Chip>
          ))}
        </div>

        <div className="stagger">
          <SupplierList region={region} category={category} />
        </div>

        <button
          className="btn btn--tint btn--block"
          onClick={() => setShowForm(true)}
          style={{ marginTop: 20, marginBottom: 24 }}
        >
          {t('shop_submit_cta')}
        </button>
      </div>

      {showForm && (
        <ShopSubmitForm
          defaultRegion={region === 'all' ? (getSavedRegion() || '') : region}
          onClose={() => setShowForm(false)}
        />
      )}

      <ScrollToTopButton />
    </div>
  );
}
