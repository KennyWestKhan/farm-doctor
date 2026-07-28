import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { sanitizeText, LIMITS } from '../utils/sanitize.js';
import { apiFetch } from '../utils/apiFetch.js';

const API = import.meta.env.VITE_API_URL || '';

const fieldStyle = {
  width: '100%', padding: 12, fontSize: 15,
  fontFamily: 'var(--font-body)',
  border: '2px solid var(--line)', borderRadius: 'var(--radius)',
  background: '#fff', color: 'var(--ink)',
};

export default function ShopSubmitForm({ defaultRegion, onClose }) {
  const { t, pick } = useLang();

  const [name, setName] = useState('');
  const [region, setRegion] = useState(defaultRegion || '');
  const [town, setTown] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [products, setProducts] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    if (cleanName.length < 2) return;

    setStatus('sending');
    try {
      const res = await apiFetch('/api/shop-submissions', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: localStorage.getItem('fd_device_id') || 'anon',
          name: cleanName,
          region: sanitizeText(region, 32),
          town: sanitizeText(town, 60) || undefined,
          whatsapp: sanitizeText(whatsapp, 20) || undefined,
          phone: sanitizeText(phone, 20) || undefined,
          products: sanitizeText(products, 200) || undefined,
          note: sanitizeText(note, LIMITS.note) || undefined,
        }),
      });
      if (!res.ok) throw new Error('submit failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
          <div className="center stack" style={{ padding: '32px 0' }}>
            <div style={{ fontSize: 52 }}>🎉</div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{t('shop_submit_thanks')}</strong>
            <p className="muted" style={{ margin: 0 }}>{t('shop_submit_review_note')}</p>
            <button className="btn btn--block" onClick={onClose} style={{ marginTop: 16 }}>{t('back')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{t('shop_submit_title')}</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--ink-2)', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_name')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(sanitizeText(e.target.value, 100, { trim: false }))}
              placeholder={t('shop_field_name_hint')}
              required
              minLength={2}
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_region')} *</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} required style={{ ...fieldStyle, fontWeight: 700 }}>
              <option value="" disabled>{t('shop_field_region_hint')}</option>
              {Object.entries(REGIONS).map(([id, n]) => (
                <option key={id} value={id}>{pick(n)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_town')}</label>
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(sanitizeText(e.target.value, 60, { trim: false }))}
              placeholder={t('shop_field_town_hint')}
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_whatsapp')}</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 20))}
              placeholder="+233 55 000 1234"
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 20))}
              placeholder="+233 24 000 5678"
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_products')}</label>
            <input
              type="text"
              value={products}
              onChange={(e) => setProducts(sanitizeText(e.target.value, 200, { trim: false }))}
              placeholder={t('shop_field_products_hint')}
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="muted" style={labelStyle}>{t('shop_field_note')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(sanitizeText(e.target.value, LIMITS.note, { trim: false }))}
              placeholder={t('shop_field_note_hint')}
              rows={2}
              maxLength={LIMITS.note}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </div>

          {status === 'error' && (
            <div style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 12, fontWeight: 700, fontSize: 14 }}>
              {t('shop_submit_error')}
            </div>
          )}

          <button type="submit" className="btn btn--block" disabled={status === 'sending' || !name.trim() || !region || !API}>
            {status === 'sending' ? t('shop_submit_sending') : t('shop_submit_send')}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.04em', display: 'block', marginBottom: 4,
};

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
};

const sheetStyle = {
  background: 'var(--bg)', borderRadius: '20px 20px 0 0',
  padding: '20px 18px 28px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px) + 70px)',
  width: '100%', maxWidth: 480,
  maxHeight: '88vh', overflowY: 'auto',
};
