import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useLang } from '../i18n.jsx';

// Routes that are allowed on desktop (judges view the dashboard on a big screen).
const DESKTOP_ALLOWED = ['/dashboard'];

// "Desktop" = wide viewport AND no coarse (touch) pointer. This lets real phones
// (even large ones) through while gating laptops/monitors.
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 700px) and (pointer: fine)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

export default function MobileGate({ children }) {
  const isDesktop = useIsDesktop();
  const { pathname } = useLocation();

  const allowed = DESKTOP_ALLOWED.some((p) => pathname.startsWith(p));
  if (isDesktop && !allowed) return <OpenOnPhone />;
  return children;
}

function OpenOnPhone() {
  const { t } = useLang();
  const [qr, setQr] = useState('');
  const url = window.location.origin;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: '#1b5638', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--grad-green)', padding: 24, textAlign: 'center', color: '#fff',
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 56 }}>🌱🩺</div>
        <h1 style={{ color: '#fff', marginTop: 8 }}>Farm Doctor</h1>
        <h2 style={{ color: '#fff', fontWeight: 700, marginTop: 18 }}>{t('gate_title')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>{t('gate_body')}</p>

        <div style={{ background: '#fff', borderRadius: 28, padding: 22, margin: '24px auto', width: 'fit-content', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
          {qr ? <img src={qr} alt="QR code to open Farm Doctor" width={220} height={220} /> : <div style={{ width: 220, height: 220 }} />}
          <div style={{ color: 'var(--green-deep)', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 8, fontSize: 14, wordBreak: 'break-all' }}>
            {url.replace(/^https?:\/\//, '')}
          </div>
        </div>

        <Link to="/dashboard" style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--font-display)', textDecoration: 'underline' }}>
          {t('gate_dashboard_link')}
        </Link>
      </div>
    </div>
  );
}
