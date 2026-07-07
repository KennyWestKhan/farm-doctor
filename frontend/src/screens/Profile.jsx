import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth/useAuth.js';
import { LangToggle } from '../components/Chrome.jsx';
import { CROPS, REGIONS } from '../data/diseaseDatabase';
import { getVendors } from '../db/vendors';
import { getSavedRegion, setSavedRegion, getSavedCrops, setSavedCrops } from '../utils/prefs';
import { getFavourites, toggleFavourite, setDefaultSupplier, updateSupplierNote, getSuggestedFavourites } from '../db/favorites';
import RegionSheet from '../components/RegionSheet.jsx';

/* ── tiny SVG icons ─────────────────────────────────────────────────────── */

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--green)" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
);

const StarFilled = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--star)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>
);

/* ── section header ─────────────────────────────────────────────────────── */

function SectionLabel({ children, style }) {
  return (
    <h4 style={{
      fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      color: 'var(--ink-soft)', margin: '22px 0 8px', fontFamily: 'var(--font-display)',
      ...style,
    }}>
      {children}
    </h4>
  );
}

/* ── setting row (language / region style) ──────────────────────────────── */

function SettingRow({ icon, label, value, action, onClick, last = false }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '15px 0', background: 'none', border: 'none', textAlign: 'left',
        borderBottom: last ? 'none' : '1px solid var(--line)',
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: 12, background: 'var(--green-tint)',
        display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{label}</div>
        {value && <div className="muted" style={{ fontSize: 13, marginTop: 1 }}>{value}</div>}
      </div>
      {action || (onClick && <ChevronRight />)}
    </Wrapper>
  );
}

/* ── favourite supplier card ────────────────────────────────────────────── */

function FavSupplierCard({ fav, supplier, onToggle, onSetDefault, onSaveNote, t, pick }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(fav.notes || '');

  if (!supplier) return null;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header strip */}
      <div style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: fav.isDefault ? 'var(--green-tint)' : 'var(--card)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: fav.isDefault ? 'var(--green)' : 'var(--green-tint)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 20, filter: fav.isDefault ? 'brightness(10)' : 'none' }}>🏪</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {supplier.name}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            📍 {supplier.addressText || '—'}{supplier.region ? ` · ${pick(REGIONS[supplier.region])}` : ''}
          </div>
        </div>
        <button
          onClick={() => onToggle(fav.supplierId)}
          aria-label="Remove favourite"
          style={{ background: 'none', border: 'none', padding: 4, flexShrink: 0 }}
        >
          <StarFilled />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px 14px' }}>
        {fav.isDefault && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-display)', color: 'var(--green-deep)',
            background: 'var(--green-tint)', borderRadius: 999, padding: '4px 10px', marginBottom: 10,
          }}>
            <PinIcon /> {t('profile_is_default')}
          </div>
        )}

        {fav.notes && !editing && (
          <div style={{
            padding: '9px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
            fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 10,
          }}>
            {fav.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {!fav.isDefault && (
            <button
              onClick={() => onSetDefault(fav.supplierId)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--green-tint-2)',
                background: 'var(--card)', fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 13, color: 'var(--green-deep)',
              }}
            >
              <PinIcon /> {t('profile_set_default')}
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--line)',
              background: 'var(--card)', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 13, color: 'var(--ink-2)',
            }}
          >
            📝 {t('profile_notes')}
          </button>
        </div>

        {editing && (
          <div style={{ marginTop: 10 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('profile_add_note')}
              maxLength={200}
              rows={2}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 15, borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--green-tint-2)', fontFamily: 'var(--font-body)',
                resize: 'none', background: 'var(--bg)', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '8px 16px', borderRadius: 999, border: '1.5px solid var(--line)',
                  background: 'var(--card)', fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 13, color: 'var(--ink-soft)',
                }}
              >
                {t('back')}
              </button>
              <button
                onClick={() => { onSaveNote(fav.supplierId, note); setEditing(false); }}
                style={{
                  padding: '8px 16px', borderRadius: 999, border: 'none',
                  background: 'var(--green)', fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 13, color: '#fff',
                }}
              >
                ✓ {t('send_feedback')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── suggestion banner ──────────────────────────────────────────────────── */

function SuggestBanner({ suggestion, supplier, onAdd, t }) {
  if (!supplier) return null;
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, var(--warn-tint) 0%, #fff8ec 100%)',
      border: '1.5px solid rgba(217,138,31,0.18)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--warn)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
        💡 {t('profile_suggest_fav')}
      </div>
      <div className="between">
        <div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{supplier.name}</strong>
          <div className="muted" style={{ fontSize: 12 }}>📍 {supplier.addressText || '—'}</div>
        </div>
        <button
          onClick={() => onAdd(suggestion.supplierId)}
          style={{
            padding: '8px 16px', borderRadius: 999, border: 'none',
            background: 'var(--green)', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ⭐ {t('yes')}
        </button>
      </div>
    </div>
  );
}

/* ── main profile screen ────────────────────────────────────────────────── */

export default function Profile() {
  const { t, pick, lang, toggle } = useLang();
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [region, setRegion] = useState(getSavedRegion());
  const [showRegion, setShowRegion] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState(() => getSavedCrops());
  const [favs, setFavs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [vendorsById, setVendorsById] = useState({});

  const refreshFavs = useCallback(async () => {
    const [f, s] = await Promise.all([getFavourites(), getSuggestedFavourites()]);
    setFavs(f);
    setSuggestions(s);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async IDB read
  useEffect(() => { refreshFavs(); }, [refreshFavs]);

  // Load the vendor directory once to resolve favourite/suggested supplier ids.
  useEffect(() => {
    let live = true;
    getVendors().then((list) => {
      if (live) setVendorsById(Object.fromEntries(list.map((v) => [v.id, v])));
    });
    return () => { live = false; };
  }, []);

  const handleToggleCrop = (cropId) => {
    setSelectedCrops((prev) => {
      const next = prev.includes(cropId) ? prev.filter((c) => c !== cropId) : [...prev, cropId];
      setSavedCrops(next);
      return next;
    });
  };

  const handleRegionPick = (r) => { setRegion(r); setSavedRegion(r); };
  const handleToggleFav = async (id) => { await toggleFavourite(id); await refreshFavs(); };
  const handleSetDefault = async (id) => { await setDefaultSupplier(id); await refreshFavs(); };
  const handleSaveNote = async (id, notes) => { await updateSupplierNote(id, notes); await refreshFavs(); };
  const handleSignOut = async () => { await signOut(); nav('/'); };

  const defaultFav = favs.find((f) => f.isDefault);
  const otherFavs = favs.filter((f) => !f.isDefault);

  return (
    <div className="screen screen--flush page-enter">
      {/* ── gradient header with avatar ──────────────────────────────────── */}
      <div className="gradhead" style={{ paddingBottom: 28, textAlign: 'center' }}>
        <div className="between" style={{ marginBottom: 16 }}>
          <button
            className="icon-btn icon-btn--on-grad"
            onClick={() => nav(-1)}
            aria-label="Back"
          >
            ←
          </button>
          <LangToggle onGradient />
        </div>

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 10px',
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          display: 'grid', placeItems: 'center', fontSize: 32,
          border: '3px solid rgba(255,255,255,0.35)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {user ? '👤' : '👋'}
        </div>

        {user ? (
          <>
            <h2 style={{ fontSize: 20 }}>{user.phone}</h2>
            <div style={{ opacity: 0.8, fontSize: 14, marginTop: 2 }}>{t('profile_signed_in')}</div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20 }}>{t('profile_guest')}</h2>
            <div style={{ opacity: 0.8, fontSize: 14, marginTop: 2, maxWidth: 240, margin: '2px auto 0' }}>
              {t('profile_guest_desc')}
            </div>
          </>
        )}

        {/* Auth CTA */}
        <div style={{ marginTop: 14 }}>
          {user ? (
            <button
              onClick={handleSignOut}
              style={{
                padding: '9px 22px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 14, backdropFilter: 'blur(4px)',
              }}
            >
              {t('profile_sign_out')}
            </button>
          ) : (
            <button
              onClick={() => nav('/welcome')}
              style={{
                padding: '10px 24px', borderRadius: 999, border: 'none',
                background: '#fff', color: 'var(--green-deep)', fontFamily: 'var(--font-display)',
                fontWeight: 800, fontSize: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
            >
              📱 {t('profile_sign_in')}
            </button>
          )}
        </div>
      </div>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <div className="stagger" style={{ padding: '0 18px' }}>

        {/* Preferences group */}
        <SectionLabel>{t('profile_title')}</SectionLabel>

        <div className="card" style={{ padding: '2px 16px' }}>
          <SettingRow
            icon="🌐"
            label={t('profile_language')}
            value={lang === 'en' ? 'English' : 'Twi'}
            action={
              <button className="pill pill--green" onClick={toggle} style={{ border: 'none', fontSize: 12 }}>
                {lang === 'en' ? '🇬🇭 Twi' : '🇬🇧 English'}
              </button>
            }
          />
          <SettingRow
            icon="📍"
            label={t('profile_region')}
            value={region ? pick(REGIONS[region]) : t('set_location')}
            onClick={() => setShowRegion(true)}
          />
          <SettingRow
            icon="📋"
            label={t('profile_my_diagnoses')}
            value={t('reports_subtitle')}
            onClick={() => nav('/reports')}
            last
          />
        </div>

        {/* Crop preferences */}
        <SectionLabel>{t('profile_crops')}</SectionLabel>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {CROPS.map((crop) => {
              const on = selectedCrops.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  onClick={() => handleToggleCrop(crop.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                    border: on ? '2px solid var(--green)' : '2px solid var(--line)',
                    background: on ? 'var(--green-tint)' : 'var(--card)',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 14, color: on ? 'var(--green-deep)' : 'var(--ink-2)',
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{crop.emoji}</span>
                  {pick(crop.name)}
                  {on && (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'var(--green)',
                      display: 'grid', placeItems: 'center', fontSize: 11, color: '#fff', marginLeft: 2,
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favourite suppliers */}
        <SectionLabel style={{ marginTop: 26 }}>{t('profile_fav_suppliers')}</SectionLabel>

        {suggestions.map((s) => (
          <SuggestBanner key={s.supplierId} suggestion={s} supplier={vendorsById[s.supplierId]} onAdd={handleToggleFav} t={t} />
        ))}

        {defaultFav && (
          <FavSupplierCard fav={defaultFav} supplier={vendorsById[defaultFav.supplierId]} onToggle={handleToggleFav} onSetDefault={handleSetDefault} onSaveNote={handleSaveNote} t={t} pick={pick} />
        )}

        {otherFavs.map((fav) => (
          <FavSupplierCard key={fav.supplierId} fav={fav} supplier={vendorsById[fav.supplierId]} onToggle={handleToggleFav} onSetDefault={handleSetDefault} onSaveNote={handleSaveNote} t={t} pick={pick} />
        ))}

        {favs.length === 0 && suggestions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '28px 20px', borderRadius: 'var(--radius-lg)',
            background: 'var(--card)', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
            <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              {t('profile_no_favs')}
            </p>
            <button
              onClick={() => nav('/shops')}
              style={{
                marginTop: 14, padding: '10px 20px', borderRadius: 999,
                border: 'none', background: 'var(--green-tint)',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 14, color: 'var(--green-deep)',
              }}
            >
              {t('home_browse_shops')} →
            </button>
          </div>
        )}

        {/* Bottom spacer */}
        <div style={{ height: 20 }} />
      </div>

      {showRegion && (
        <RegionSheet current={region} onPick={handleRegionPick} onClose={() => setShowRegion(false)} />
      )}
    </div>
  );
}
