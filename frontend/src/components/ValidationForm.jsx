import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { saveValidation } from '../db/storage';

/**
 * "Did it work?" feedback. Saved locally; sync.js flushes it to the backend when
 * online. Max 3 taps to submit (use → outcome → send).
 */
export default function ValidationForm({ reportId, treatmentId, region }) {
  const { t } = useLang();
  const [used, setUsed] = useState(null); // null | true | false
  const [outcome, setOutcome] = useState(null); // 'worked' | 'partial' | 'failed'
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card center pill--ok" style={{ padding: 18 }}>
        <div style={{ fontSize: 32 }}>🙏</div>
        <strong>{t('thanks')}</strong>
      </div>
    );
  }

  const submit = async () => {
    await saveValidation({
      reportId,
      treatmentId,
      region,
      used,
      outcome, // worked | partial | failed
      notes: notes.trim() || null,
    });
    setDone(true);
  };

  return (
    <div className="card stack">
      <strong style={{ fontSize: 18 }}>{t('did_you_use')}</strong>
      <div className="row" style={{ gap: 10 }}>
        <button className={`pill pill--ok`} style={btn(used === true)} onClick={() => setUsed(true)}>
          {t('yes')}
        </button>
        <button className={`pill pill--bad`} style={btn(used === false)} onClick={() => { setUsed(false); setOutcome(null); }}>
          {t('no')}
        </button>
      </div>

      {used === true && (
        <>
          <strong style={{ fontSize: 18 }}>{t('did_it_work')}</strong>
          <div className="row" style={{ gap: 8 }}>
            <button className="pill pill--ok" style={btn(outcome === 'worked')} onClick={() => setOutcome('worked')}>
              ✅ {t('worked')}
            </button>
            <button className="pill pill--warn" style={btn(outcome === 'partial')} onClick={() => setOutcome('partial')}>
              ➗ {t('partly')}
            </button>
            <button className="pill pill--bad" style={btn(outcome === 'failed')} onClick={() => setOutcome('failed')}>
              ❌ {t('failed')}
            </button>
          </div>
          <input
            className="card"
            placeholder={t('notes_optional')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ padding: 14, fontSize: 16, fontFamily: 'var(--font-body)' }}
          />
        </>
      )}

      <button
        className="btn"
        onClick={submit}
        disabled={used === null || (used === true && !outcome)}
      >
        {t('send_feedback')}
      </button>
    </div>
  );
}

const btn = (active) => ({
  flex: 1,
  justifyContent: 'center',
  minHeight: 50,
  fontSize: 15,
  border: active ? '3px solid var(--ink)' : '3px solid transparent',
  opacity: active ? 1 : 0.65,
  cursor: 'pointer',
});
