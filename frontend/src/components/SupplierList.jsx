import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLang } from '../i18n.jsx';
import { findSuppliers, whatsappLink, telLink } from '../data/suppliers';
import { getFavourites, toggleFavourite, setDefaultSupplier } from '../db/favorites';
import { recordContact } from '../db/favorites';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

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

export default function SupplierList({ region, productName = '', showMap = true }) {
  const { t, lang } = useLang();
  const suppliers = findSuppliers(region, productName);
  const [favIds, setFavIds] = useState(new Set());
  const [defaultId, setDefaultId] = useState(null);

  const refreshFavs = useCallback(async () => {
    const favs = await getFavourites();
    setFavIds(new Set(favs.map((f) => f.supplierId)));
    const def = favs.find((f) => f.isDefault);
    setDefaultId(def?.supplierId ?? null);
  }, []);

  useEffect(() => { refreshFavs(); }, [refreshFavs]);

  const handleStar = async (supplierId) => {
    await toggleFavourite(supplierId);
    await refreshFavs();
  };

  const handleWhatsAppClick = (supplierId) => {
    recordContact(supplierId);
  };

  const handleCallClick = (supplierId) => {
    recordContact(supplierId);
  };

  if (suppliers.length === 0) {
    return <p className="muted center" style={{ padding: 20 }}>No shops listed nearby yet.</p>;
  }

  // Sort: default supplier first, then favourites, then the rest
  const sorted = [...suppliers].sort((a, b) => {
    if (a.id === defaultId) return -1;
    if (b.id === defaultId) return 1;
    const aFav = favIds.has(a.id) ? 1 : 0;
    const bFav = favIds.has(b.id) ? 1 : 0;
    return bFav - aFav;
  });

  const center = [sorted[0].lat, sorted[0].lng];

  return (
    <div className="stack">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        borderRadius: 'var(--radius-sm)', background: 'var(--warn-tint)',
        fontSize: 12, fontWeight: 700, color: 'var(--warn)',
      }}>
        <span>⚠️</span> Demo contacts — numbers are placeholders for the competition
      </div>
      {showMap && (
        <div style={{ height: 190, borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {sorted.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
                <Popup><strong>{s.name}</strong><br />{s.town}<br />{s.price_range}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {sorted.map((s) => (
        <div key={s.id} className="card stack" style={{ gap: 12 }}>
          <div className="between">
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 6 }}>
                <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{s.name}</strong>
                {s.id === defaultId && (
                  <span className="pill pill--green" style={{ fontSize: 10, padding: '2px 6px' }}>📌</span>
                )}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>📍 {s.town} · {s.price_range}</div>
            </div>
            <button
              onClick={() => handleStar(s.id)}
              style={{ background: 'none', border: 'none', fontSize: 22, flexShrink: 0, padding: 4 }}
              aria-label={favIds.has(s.id) ? 'Remove from favourites' : 'Add to favourites'}
            >
              {favIds.has(s.id) ? '⭐' : '☆'}
            </button>
          </div>
          {!productName && (
            <div className="muted" style={{ fontSize: 13 }}>{t('shops_sells')}: {s.products.join(', ')}</div>
          )}
          <div className="row" style={{ gap: 12 }}>
            <a className="contact-btn" href={telLink(s)} style={{ background: 'var(--green)' }}
              onClick={() => handleCallClick(s.id)}
              aria-label={`${t('call_shop')} ${s.name}`}>
              <PhoneIcon /><span>{t('call_shop')}</span>
            </a>
            <a className="contact-btn" href={whatsappLink(s, productName || s.products[0], lang)}
              target="_blank" rel="noopener noreferrer" style={{ background: '#128C7E' }}
              onClick={() => handleWhatsAppClick(s.id)}
              aria-label={`${t('open_whatsapp')} ${s.name}`}>
              <WhatsAppIcon /><span>{t('open_whatsapp')}</span>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
