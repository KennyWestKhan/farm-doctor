import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { saveValidation } from '../db/storage';
import { sanitizeText, LIMITS } from '../utils/sanitize';

/** "Did it work?" feedback. Saved locally; synced to backend when online. */
export default function ValidationForm({ reportId, treatmentId, region }) {
  const { t } = useLang();
  const [used, setUsed] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card center stack" style={{ background: 'var(--green-tint)' }}>
        <div style={{ fontSize: 32 }}>🙏</div>
        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--green-deep)' }}>{t('thanks')}</strong>
      </div>
    );
  }

  const submit = async () => {
    // Sanitize the free-text note before it is stored or later synced to the backend.
    const cleanNote = sanitizeText(notes, LIMITS.note);
    await saveValidation({ reportId, treatmentId, region, used, outcome, notes: cleanNote || null });
    setDone(true);
  };

  return (
    <div className="card stack">
      <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{t('did_you_use')}</strong>
      <div className="row" style={{ gap: 10 }}>
        <button className="pill pill--green" style={btn(used === true)} onClick={() => setUsed(true)}>{t('yes')}</button>
        <button className="pill pill--bad" style={btn(used === false)} onClick={() => { setUsed(false); setOutcome(null); }}>{t('no')}</button>
      </div>

      {used === true && (
        <>
          <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>{t('did_it_work')}</strong>
          <div className="row" style={{ gap: 8 }}>
            <button className="pill pill--green" style={btn(outcome === 'worked')} onClick={() => setOutcome('worked')}>✅ {t('worked')}</button>
            <button className="pill pill--warn" style={btn(outcome === 'partial')} onClick={() => setOutcome('partial')}>➗ {t('partly')}</button>
            <button className="pill pill--bad" style={btn(outcome === 'failed')} onClick={() => setOutcome('failed')}>❌ {t('failed')}</button>
          </div>
          <input
            placeholder={t('notes_optional')} value={notes} onChange={(e) => setNotes(e.target.value)}
            maxLength={LIMITS.note}
            style={{ padding: 14, fontSize: 16, fontFamily: 'var(--font-body)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', outline: 'none' }}
          />
        </>
      )}

      <button className="btn btn--block" onClick={submit} disabled={used === null || (used === true && !outcome)}>
        {t('send_feedback')}
      </button>
    </div>
  );
}

const btn = (active) => ({
  flex: 1, justifyContent: 'center', minHeight: 48, fontSize: 15,
  border: active ? '2.5px solid var(--ink)' : '2.5px solid transparent',
  opacity: active ? 1 : 0.65,
});
