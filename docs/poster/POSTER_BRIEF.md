# Poster brief (verified facts, for building the A1 poster)

Everything here is checked. Do not add claims that aren't in this file. If you
want to add something, confirm it first.

## What the poster is for

An A1 print poster for Farm Doctor Ghana, presented at the Ghana AI Innovation
Challenge 2026 (Agriculture track). It has to cover four required sections:

1. Visual summary of the solution
2. Data processing and model architecture
3. Results with key performance metrics
4. Implementation pathway and scalability

Judging weights: Impact 30%, Technical Soundness 25%, Innovation 20%,
Scalability 15%, Presentation 10%.

## Design direction

Use the older "emerald / earthen" look, not the field-guide serif one. Starting
point is `docs/poster/poster-emerald-v1.src.html` (has `__IMG_HOME__` and
`__IMG_DASH__` placeholders for base64 screenshots). Keep that layout and palette:
deep green header band, warm cream ground, one gold accent, phone screenshot as
the hero, a four-step flow, a results block, an architecture diagram, a
scalability section, a footer.

The one real change: swap the generic system-sans typeface for a professional
one. Artifact CSP blocks font CDNs, so embed the font as a base64 `@font-face`
data URI (don't link a CDN). Good professional choices: IBM Plex Sans or Libre
Franklin or Source Sans 3 for body, paired with a stronger display face (IBM
Plex Serif, Source Serif 4, or Fraunces) for headings. Pick one pairing and use
it consistently.

## Verified metrics (real, ours)

- Offline symptom matcher, benchmarked on 51 labelled cases (23 clean + 28
  partial/noisy/ambiguous): 100% top-1 accuracy (47/47 labelled), 100% precision
  on confident-tier predictions (43/43), 100% correct defer-to-AI on ambiguous
  cases (4/4). Reproducible: `cd frontend && npm run bench:matcher`. Honest
  caveat: cases are authored from expert symptom knowledge, so they test the
  scoring/decision logic, not field-photo accuracy.
- Live Claude Vision diagnosis is working in production (verified end-to-end).
- About 90 real people have signed up and used it (auth.users count, ~91).
- 104 automated tests pass.
- Content: 6 crops, 23 diseases, 69 real agro-input suppliers, 16 regions
  selectable, Twi and English.
- Two-tier hybrid: on-device weighted matcher first (offline), Claude Vision as a
  second opinion when the offline confidence is below 70% or for the camera path.

## Cited external stats (use these numbers, cite in small font at the bottom)

1. Pests and diseases cut 20 to 40% of crop yields per year. Source: FAO.
   https://www.fao.org/pest-and-pesticide-management/about/understanding-the-context/en/
2. Over 80% of Ghana's farm output comes from smallholders on under one hectare.
   Source: MoFA, Agriculture in Ghana: Facts & Figures.
   https://mofa.gov.gh/site/images/pdf/AGRICULTURE%20IN%20GHANA%20(Facts%20&%20Figures)%202021.pdf
3. Ghana targets one extension officer per 500 farmers and has fallen short for
   years (about 1:1,908 in 2016, roughly 1:750 by 2023 per MoFA). Frame it around
   the 1:500 target and the shortfall, don't assert a single current number.
   Source: MoFA / MoFEP program-based budget.
   https://mofep.gov.gh/sites/default/files/pbb-estimates/2024/2024-PBB-MOFA.pdf
4. Giving smallholders pest alerts raised their yield and income by 18 to 26% in
   a study across four African countries including Ghana. This one backs our
   approach directly, worth featuring. Source: study via NCBI PMC.
   https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12713714/

Do not use the old "1 : 1,900" stat on its own. It's a 2016 figure and is stale.

## Disease data sources (real)

Built from Ghana's own research and reviewed by our agronomist (Kelvin, an agric
engineer on the team): MoFA/PPRSD, CSIR-SARI, CSIR-CRI, IITA, ICRISAT, COCOBOD/CRIG.

## Business model (confirmed)

Free for farmers. Revenue from the other side of the market: agro-input companies
and distributors who want real reach, plus NGOs and government extension who
already spend to reach these farmers and get a channel that shows what's working.
The treatment-validation loop ("did it work?") builds region-by-region evidence.

## Team

- Ken Boamponsem, Senior Software Engineer
- Kelvin Boamponsem, Business Development Manager and Agric Engineer

## Links and assets

- Live app: https://farm-doctor-seven.vercel.app  (put a QR to this on the poster)
- Repo: https://github.com/KennyWestKhan/farm-doctor
- Screenshots to embed as base64: `docs/screenshots/home.png`, `dashboard.png`,
  `diagnose.png`, `welcome.png`
- QR: generate locally (npm `qrcode` -> SVG) and inline it. Don't hotlink a QR API.

## Build constraints

- A1 portrait. `@page { size: A1 portrait }` for print. Add screen-only scaling
  (a `zoom` media-query ladder) so it isn't clipped when viewed in a normal
  window; keep `zoom:1` in print.
- Convert any non-ASCII to HTML entities so it renders regardless of charset.
- No em dashes. Straight quotes only. Run the copy through the `humanizer` skill
  (`.claude/skills/humanizer`).
- Self-contained HTML: inline all CSS, embed images/fonts/QR as data URIs. No
  external requests (artifact CSP blocks them).
