import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLang } from '../i18n.jsx';
import { findSuppliers, whatsappLink } from '../data/suppliers';

// Leaflet's default marker icons break under bundlers; point them at the CDN.
const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function SupplierList({ region, productName }) {
  const { t, lang } = useLang();
  const suppliers = findSuppliers(region, productName);

  if (suppliers.length === 0) {
    return <p className="muted">No shops listed nearby yet.</p>;
  }

  const center = [suppliers[0].lat, suppliers[0].lng];

  return (
    <div className="stack">
      <div style={{ height: 200, borderRadius: 'var(--radius)', overflow: 'hidden', border: '2px solid rgba(58,42,23,0.15)' }}>
        <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {suppliers.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
              <Popup>
                <strong>{s.name}</strong><br />{s.town}<br />{s.price_range}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {suppliers.map((s) => (
        <div key={s.id} className="card stack" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: 18 }}>{s.name}</strong>
              <div className="muted" style={{ fontSize: 14 }}>{s.town} · {s.price_range}</div>
            </div>
            <span className="pill pill--soil">🏪</span>
          </div>
          <a
            className="btn btn--gold"
            href={whatsappLink(s, productName, lang)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            💬 {t('open_whatsapp')}
          </a>
        </div>
      ))}
    </div>
  );
}
