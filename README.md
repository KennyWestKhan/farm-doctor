# Farm Doctor Ghana 🌿🩺

AI-powered crop disease diagnosis, validated by Ghanaian farmers, **works offline**.
Built for the Ghana AI Innovation Challenge 2026.

Diagnoses crop diseases in **Twi + English**, recommends **Ghana-specific treatments
with local suppliers**, gives instructions in farmer language (bottle cap, weak-tea
colour — not ml or 1:100 ratios), and shows **regional success rates** from other
farmers. Designed for 5–10 year old Android phones with bad cameras and no internet.

## How diagnosis works (hybrid, two-tier)

1. **Offline first** — the farmer answers a visual symptom checklist. An on-device
   weighted matcher (`src/engine/symptomMatcher.js`) scores it against a local
   disease database and returns a diagnosis with a confidence score. No internet
   needed.
2. **Online fallback** — if offline confidence is below 70%, the photo is queued in
   IndexedDB and sent to **Claude Vision** (via the backend) when connectivity
   returns. The Vision prompt is tuned for blurry, low-quality photos.

## Repo layout

```
frontend/   React + Vite PWA (offline shell, IndexedDB, Leaflet map, Twi/English)
backend/    Node + Express — proxies Claude Vision, stores validations in Supabase
```

## Run it locally

```bash
# Frontend (works fully offline with no backend)
cd frontend
npm install
npm run dev            # http://localhost:5173

# Backend (optional — needed only for Claude Vision + Supabase sync)
cd backend
npm install
cp .env.example .env   # fill in keys (see below)
npm run dev            # http://localhost:3001
```

The frontend runs **without the backend** in demo/offline mode — diagnosis, treatments,
suppliers, validation all work locally. Point it at the API by setting
`VITE_API_URL` in `frontend/.env`.

## Configuration you still need to provide

| What | Where | Notes |
|------|-------|-------|
| Anthropic API key | `backend/.env` → `ANTHROPIC_API_KEY` | Get from console.anthropic.com. Without it, Vision endpoint returns 503; offline matcher still works. |
| Supabase project | `backend/.env` → `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Create a fresh project, run `backend/schema.sql`. Without it, validations stay in IndexedDB. |
| `VITE_API_URL` | `frontend/.env` | Backend base URL. Blank = offline-only. |

## ⚠️ Before showing farmers or judges

- **Twi translations are first-draft** and must be reviewed by a native speaker.
  See `TWI_REVIEW_QUEUE` in `frontend/src/data/diseaseDatabase.js`.
- **Supplier data is placeholder** (fake WhatsApp numbers `+23355000XXXX`).
  See `frontend/src/data/suppliers.js`.
- **Dashboard + success rates are seeded demo data** (`successRates.js`). They
  mirror the live Supabase aggregation shape, so swapping to real data needs no
  component changes.
- **Tutorial videos not yet filmed** — player shows placeholders ready to swap in.

## MVP content coverage

- **Crops (4):** chilli pepper, cassava, sweet potato, groundnut
- **Diseases (10):** with symptoms, regional prevalence, seasonality, treatments
- **Regions (5):** Ashanti, Greater Accra, Western, Volta, Northern
- **Suppliers (13 seeded)** across all 5 regions with WhatsApp deep links

## Deploy targets

- Frontend → Vercel (`farmdoctor-ghana.vercel.app`)
- Backend → Railway / Render
- Database → Supabase
