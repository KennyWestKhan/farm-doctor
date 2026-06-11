import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLang } from '../i18n.jsx';
import { findSuppliers, whatsappLink } from '../data/suppliers';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

/** Map + supplier cards. `productName` optional (filters + prefills WhatsApp). */
export default function SupplierList({ region, productName = '', showMap = true }) {
  const { t, lang } = useLang();
  const suppliers = findSuppliers(region, productName);

  if (suppliers.length === 0) {
    return <p className="muted center" style={{ padding: 20 }}>No shops listed nearby yet.</p>;
  }

  const center = [suppliers[0].lat, suppliers[0].lng];

  return (
    <div className="stack">
      {showMap && (
        <div style={{ height: 190, borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {suppliers.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
                <Popup><strong>{s.name}</strong><br />{s.town}<br />{s.price_range}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {suppliers.map((s) => (
        <div key={s.id} className="card stack" style={{ gap: 12 }}>
          <div className="between">
            <div>
              <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{s.name}</strong>
              <div className="muted" style={{ fontSize: 13 }}>📍 {s.town} · {s.price_range}</div>
            </div>
            <span className="pill pill--green">🏪</span>
          </div>
          {!productName && (
            <div className="muted" style={{ fontSize: 13 }}>{t('shops_sells')}: {s.products.join(', ')}</div>
          )}
          <a
            className="btn btn--block"
            href={whatsappLink(s, productName || s.products[0], lang)}
            target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', background: '#25D366', boxShadow: 'none' }}
          >
            💬 {t('open_whatsapp')}
          </a>
        </div>
      ))}
    </div>
  );
}
