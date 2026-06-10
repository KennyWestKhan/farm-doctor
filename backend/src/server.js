/**
 * Farm Doctor backend.
 *
 * Two jobs:
 *  1. Proxy Claude Vision (the API key must never live in the PWA).
 *  2. Receive validation feedback and store it in Supabase.
 *
 * Both Supabase and Anthropic are optional at boot: if env vars are missing the
 * server still runs and the relevant endpoint returns a clear 503, so the
 * frontend works in local/offline demo mode without any cloud setup.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { VISION_SYSTEM_PROMPT } from './prompt.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

const VISION_MODEL = process.env.VISION_MODEL || 'claude-haiku-4-5-20251001';

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, vision: !!anthropic, db: !!supabase });
});

/**
 * POST /api/diagnose
 * Accepts a base64 image (JSON: { imageBase64, mediaType, reportId }).
 * Returns the parsed Vision diagnosis JSON.
 */
app.post('/api/diagnose', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'Vision not configured (missing ANTHROPIC_API_KEY)' });
  }
  const { imageBase64, mediaType = 'image/jpeg' } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    const message = await anthropic.messages.create({
      model: VISION_MODEL,
      max_tokens: 400,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Diagnose this crop. Respond with only the JSON object.' },
          ],
        },
      ],
    });

    const text = message.content.find((c) => c.type === 'text')?.text ?? '{}';
    let parsed;
    try {
      parsed = JSON.parse(text.trim().replace(/^```json?/i, '').replace(/```$/, '').trim());
    } catch {
      return res.status(502).json({ error: 'Model did not return valid JSON', raw: text });
    }
    res.json(parsed);
  } catch (err) {
    console.error('diagnose error', err);
    res.status(500).json({ error: 'Vision request failed' });
  }
});

/**
 * POST /api/validations
 * Stores a "did the treatment work?" report. No-op-safe without Supabase.
 */
app.post('/api/validations', async (req, res) => {
  const v = req.body || {};
  if (!supabase) {
    return res.status(503).json({ error: 'DB not configured', echoed: v });
  }
  try {
    const { error } = await supabase.from('validations').insert({
      report_id: v.reportId ?? null,
      treatment_id: v.treatmentId ?? null,
      region: v.region ?? null,
      treatment_worked: v.outcome === 'worked',
      outcome: v.outcome ?? null,
      notes: v.notes ?? null,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('validation insert error', err);
    res.status(500).json({ error: 'Could not store validation' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Farm Doctor API on :${PORT}`));
