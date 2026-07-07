import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';
import { REGIONS } from '../data/diseaseDatabase';
import { telLink, whatsappLink } from '../data/suppliers';
import { VENDOR_CATEGORIES } from '../data/vendorCategories';
import { recordContact } from '../db/favorites';

const CAT_LABEL = Object.fromEntries(VENDOR_CATEGORIES.map((c) => [c.key, c]));

/** A labelled block in the detail sheet (hidden when its rows are empty). */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: 'var(--ink-soft)', marginBottom: 5, fontFamily: 'var(--font-display)',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/**
 * Full-detail slide-up sheet for one vendor: everything the compact card omits —
 * contact person, every phone number (with per-number call/WhatsApp), all emails,
 * categories, services and crops. Portaled to body like SupplierSheet.
 */
export default function VendorDetailSheet({ vendor: v, category, keyword, onClose }) {
  const { t, lang, pick } = useLang();
  if (!v) return null;

  return createPortal(
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__grip" />
        <div className="between" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>{v.name}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
          📍 {v.addressText || '—'}{v.region ? ` · ${pick(REGIONS[v.region])}` : ''}
        </p>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {v.contactPerson && (
            <Field label={t('shops_contact')}>
              <div style={{ fontSize: 15 }}>👤 {v.contactPerson}</div>
            </Field>
          )}

          {v.phones.length > 0 && (
            <Field label={t('shops_phone')}>
              <div className="stack" style={{ gap: 8 }}>
                {v.phones.map((p) => {
                  const isWa = v.whatsapp.includes(p);
                  return (
                    <div key={p} className="between" style={{ gap: 8 }}>
                      <a href={telLink(p)} onClick={() => recordContact(v.id)}
                        style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>
                        📞 {p}
                      </a>
                      <div className="row" style={{ gap: 6 }}>
                        <a className="pill" href={telLink(p)} onClick={() => recordContact(v.id)}
                          style={{ fontSize: 12, padding: '4px 12px', background: 'var(--green)', color: '#fff', border: 'none' }}>
                          {t('call_shop')}
                        </a>
                        {isWa && (
                          <a className="pill" href={whatsappLink(v, { number: p, treatment: keyword, category, lang })}
                            target="_blank" rel="noopener noreferrer" onClick={() => recordContact(v.id)}
                            style={{ fontSize: 12, padding: '4px 12px', background: '#128C7E', color: '#fff', border: 'none' }}>
                            {t('open_whatsapp')}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Field>
          )}

          {v.emails.length > 0 && (
            <Field label={t('shops_email')}>
              <div className="stack" style={{ gap: 6 }}>
                {v.emails.map((e) => (
                  <a key={e} href={`mailto:${e}`} style={{ fontSize: 15, color: 'var(--green)', wordBreak: 'break-all' }}>
                    ✉️ {e}
                  </a>
                ))}
              </div>
            </Field>
          )}

          {v.categories.length > 0 && (
            <Field label={t('shops_offers')}>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {v.categories.map((c) => (
                  <span key={c} className="pill" style={{ fontSize: 12, padding: '4px 10px', background: 'var(--green-tint)', color: 'var(--green)', border: 'none' }}>
                    {CAT_LABEL[c]?.icon} {t(CAT_LABEL[c]?.i18n || c)}
                  </span>
                ))}
              </div>
            </Field>
          )}

          {v.services.length > 0 && (
            <Field label={t('shops_provides')}>
              <div style={{ fontSize: 15 }}>{v.services.join(', ')}</div>
            </Field>
          )}

          {v.crops.length > 0 && (
            <Field label={t('shops_seeds_for')}>
              <div style={{ fontSize: 15 }}>{v.crops.join(', ')}</div>
            </Field>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
