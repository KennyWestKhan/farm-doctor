import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { getVendors } from '../db/vendors';
import {
  filterVendors, whatsappLink, telLink, primaryPhone, primaryWhatsapp,
} from '../data/suppliers';
import { VENDOR_CATEGORIES } from '../data/vendorCategories';
import { getFavourites, toggleFavourite, recordContact } from '../db/favorites';
import VendorDetailSheet from './VendorDetailSheet.jsx';

// How many vendor cards to show per "page" before the Show-more button.
const PAGE_SIZE = 8;

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const CAT_LABEL = Object.fromEntries(VENDOR_CATEGORIES.map((c) => [c.key, c]));

const PhoneIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.38c-.3-.15-1.76-.87-2.03-.97s-.47-.15-.67.15-.77.96-.94 1.16-.35.22-.64.07a8.13 8.13 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.06c-.17-.3 0-.46.13-.6s.3-.35.44-.52a2 2 0 0 0 .3-.5.55.55 0 0 0-.03-.52c-.07-.15-.67-1.6-.92-2.2s-.48-.5-.67-.5h-.57a1.1 1.1 0 0 0-.8.37 3.35 3.35 0 0 0-1.04 2.49 5.8 5.8 0 0 0 1.22 3.08 13.3 13.3 0 0 0 5.1 4.5c.71.31 1.27.5 1.7.63a4.1 4.1 0 0 0 1.87.12c.57-.09 1.76-.72 2-1.41s.25-1.28.18-1.41-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.52 15.3L2 22l4.8-1.26A10 10 0 1 0 12 2z" />
  </svg>
);

/**
 * Renders vendors filtered by `region` + `category`, best-effort ranked by
 * `keyword` (e.g. a diagnosed treatment). If a region filter yields nothing, we
 * transparently fall back to all regions so the farmer is never left empty.
 */
export default function SupplierList({ region = 'all', category = null, keyword = '', showMap = true }) {
  const { t, lang, pick } = useLang();
  const [vendors, setVendors] = useState(null); // null = loading
  const [favIds, setFavIds] = useState(new Set());
  const [defaultId, setDefaultId] = useState(null);
  const [visible, setVisible] = useState(PAGE_SIZE); // pagination window
  const [detail, setDetail] = useState(null); // vendor shown in the detail modal

  // Collapse back to the first page whenever the filter inputs change, so a new
  // search doesn't start scrolled deep into a previous, longer result set. Done
  // during render (not in an effect) so there's no extra pass showing stale rows.
  const filterKey = `${region}|${category}|${keyword}|${vendors?.length ?? 'x'}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setVisible(PAGE_SIZE);
  }

  useEffect(() => {
    let live = true;
    getVendors().then((v) => { if (live) setVendors(v); });
    return () => { live = false; };
  }, []);

  const refreshFavs = useCallback(async () => {
    const favs = await getFavourites();
    setFavIds(new Set(favs.map((f) => f.supplierId)));
    setDefaultId(favs.find((f) => f.isDefault)?.supplierId ?? null);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async IDB read, not synchronous
  useEffect(() => { refreshFavs(); }, [refreshFavs]);

  const handleStar = async (id) => { await toggleFavourite(id); await refreshFavs(); };

  if (vendors === null) {
    return <p className="muted center" style={{ padding: 20 }}>{t('shops_loading')}</p>;
  }

  let list = filterVendors(vendors, { region, category, keyword });
  let regionFallback = false;
  if (list.length === 0 && region && region !== 'all') {
    list = filterVendors(vendors, { region: 'all', category, keyword });
    regionFallback = true;
  }

  if (list.length === 0) {
    return <p className="muted center" style={{ padding: 20 }}>{t('shops_none')}</p>;
  }

  // Sort: default supplier first, then favourites, then the keyword ranking.
  const sorted = [...list].sort((a, b) => {
    if (a.id === defaultId) return -1;
    if (b.id === defaultId) return 1;
    return (favIds.has(b.id) ? 1 : 0) - (favIds.has(a.id) ? 1 : 0);
  });

  const pinned = sorted.filter((s) => s.lat != null && s.lng != null);
  const paged = sorted.slice(0, visible);
  const remaining = sorted.length - paged.length;

  return (
    <div className="stack">
      {regionFallback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          borderRadius: 'var(--radius-sm)', background: 'var(--green-tint)',
          fontSize: 12, fontWeight: 700, color: 'var(--green)',
        }}>
          <span>ℹ️</span> {t('shops_region_fallback')}
        </div>
      )}

      {showMap && pinned.length > 0 && (
        <div style={{ height: 190, borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <MapContainer center={[pinned[0].lat, pinned[0].lng]} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {pinned.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
                <Popup>
                  <strong>{s.name}</strong><br />{s.addressText}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {paged.map((s) => {
        const phone = primaryPhone(s);
        const wa = primaryWhatsapp(s);
        return (
          <div key={s.id} className="card stack" style={{ gap: 10 }}>
            <div className="between">
              <button
                onClick={() => setDetail(s)}
                style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}
                aria-label={`${t('shops_details')} — ${s.name}`}
              >
                <div className="row" style={{ gap: 6 }}>
                  <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{s.name}</strong>
                  {s.id === defaultId && (
                    <span className="pill pill--green" style={{ fontSize: 10, padding: '2px 6px' }}>📌</span>
                  )}
                  <span style={{ color: 'var(--ink-soft)', fontSize: 15 }}>›</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  📍 {s.addressText || '—'}{s.region ? ` · ${pick(REGIONS[s.region])}` : ''}
                </div>
                {s.contactPerson && (
                  <div className="muted" style={{ fontSize: 13 }}>👤 {s.contactPerson}</div>
                )}
              </button>
              <button
                onClick={() => handleStar(s.id)}
                style={{ background: 'none', border: 'none', fontSize: 22, flexShrink: 0, padding: 4 }}
                aria-label={favIds.has(s.id) ? 'Remove from favourites' : 'Add to favourites'}
              >
                {favIds.has(s.id) ? '⭐' : '☆'}
              </button>
            </div>

            {/* category tags — hidden when the list is already filtered to one */}
            {!category && s.categories.length > 0 && (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {s.categories.map((c) => (
                  <span key={c} className="pill" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--green-tint)', color: 'var(--green)', border: 'none' }}>
                    {CAT_LABEL[c]?.icon} {t(CAT_LABEL[c]?.i18n || c)}
                  </span>
                ))}
              </div>
            )}

            {s.services.length > 0 && (
              <div className="muted" style={{ fontSize: 13 }}>🔧 {t('shops_provides')}: {s.services.join(', ')}</div>
            )}
            {s.crops.length > 0 && (
              <div className="muted" style={{ fontSize: 13 }}>🌱 {t('shops_seeds_for')}: {s.crops.join(', ')}</div>
            )}

            <div className="row" style={{ gap: 12 }}>
              {phone && (
                <a className="contact-btn" href={telLink(phone)} style={{ background: 'var(--green)' }}
                  onClick={() => recordContact(s.id)}
                  aria-label={`${t('call_shop')} ${s.name}`}>
                  <PhoneIcon /><span>{t('call_shop')}</span>
                </a>
              )}
              {wa && (
                <a className="contact-btn" href={whatsappLink(s, { number: wa, treatment: keyword, category, lang })}
                  target="_blank" rel="noopener noreferrer" style={{ background: '#128C7E' }}
                  onClick={() => recordContact(s.id)}
                  aria-label={`${t('open_whatsapp')} ${s.name}`}>
                  <WhatsAppIcon /><span>{t('open_whatsapp')}</span>
                </a>
              )}
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <button
          className="btn btn--tint btn--block"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          style={{ marginTop: 4 }}
        >
          {t('shops_show_more')} ({remaining})
        </button>
      )}
      <p className="muted center" style={{ fontSize: 12, margin: '2px 0 0' }}>
        {t('shops_showing')} {paged.length}/{sorted.length}
      </p>

      {detail && (
        <VendorDetailSheet
          vendor={detail}
          category={category}
          keyword={keyword}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
