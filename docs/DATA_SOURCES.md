# Data Sources

All datasets used in Farm Doctor Ghana, their provenance, licensing, and how they appear in the codebase.

## Primary Ghanaian Datasets

### 1. Ghana Crop Disease Knowledge Base

**Type:** Expert-curated structured dataset
**Format:** JSON (`frontend/src/data/diseaseDatabase.js`)
**Ghanaian:** Yes

A structured database of crop diseases affecting Ghanaian smallholder farms, covering:
- 6 crops: chilli pepper, cassava, sweet potato, groundnut, ginger, cocoa
- 23 diseases with symptoms, diagnostic weights, treatments, and farmer-language instructions
- Regional prevalence across the 5 MVP-covered Ghana regions (Ashanti, Greater Accra, Western, Volta, Northern). All 16 regions are selectable elsewhere in the app, but disease prevalence/seasonality data only exists for these 5.
- Seasonal patterns (peak months for each disease in Ghana's climate zones)

**Sources:**

| Disease area | Source | Reference |
|-------------|--------|-----------|
| Cassava diseases (CMD, CBB, anthracnose, brown leaf spot) | IITA Research-for-Development, CSIR-SARI extension bulletins | IITA Cassava Disease Fact Sheets; SARI Annual Reports |
| Chilli pepper diseases (anthracnose, bacterial wilt, leaf curl, Cercospora) | MOFA Directorate of Crop Services, Plant Protection and Regulatory Services Directorate (PPRSD) | MOFA Crop Health Guidelines; PPRSD Pest Alerts |
| Sweet potato diseases (virus complex, Alternaria, Fusarium) | CRI (Crops Research Institute) root and tuber publications | CRI Technical Bulletins; CSIR root crop disease guides |
| Groundnut diseases (rosette, leaf spot, Aspergillus, rust) | SARI groundnut improvement programme, ICRISAT West Africa | SARI Groundnut Research Reports; ICRISAT disease management guides |
| Ginger diseases (bacterial soft rot, bacterial wilt, Fusarium rhizome rot, leaf spot) | CSIR-CRI root and tuber publications, MOFA crop health guidance | CSIR-CRI Root & Tuber Disease Reports; MOFA Crop Health Guidelines — Ginger |
| Cocoa diseases (black pod, swollen shoot virus, capsid damage, stem borer) | COCOBOD/CRIG (Cocoa Research Institute of Ghana) management guides | COCOBOD/CRIG Black Pod, CSSV, Capsid & Pest Management Guides |
| Regional prevalence data | MOFA regional crop health reports, extension officer field reports | MOFA Annual Reports by Region |
| Treatment protocols and dosages | PPRSD approved pesticide list, extension officer field manuals | Ghana EPA registered products list; MOFA extension training materials |
| Farmer-language treatment instructions | Extension officer interviews, MOFA farmer training materials | Adapted from field-level extension communication practices |

**Data rights:** All source materials are public extension documents, research publications, or publicly available institutional reports. No proprietary data.

### 2. Farmer Treatment Validation Reports

**Type:** Self-collected primary data
**Format:** IndexedDB (device) → Supabase PostgreSQL `validations` table (synced)
**Ghanaian:** Yes — collected from Ghanaian farmers using the app

Each validation record contains:
- `treatment_id`: which treatment was applied
- `region`: farmer's region in Ghana
- `outcome`: worked / partial / failed
- `notes`: optional farmer observation (sanitized, max 280 chars)
- `created_at`: timestamp

**No personally identifiable information** is stored in validation records. Farmers submit voluntarily through the in-app feedback form.

**Collection status:** Pipeline operational; data accumulates as farmers use the app. A SQL view (`treatment_success_rates`) aggregates outcomes by treatment and region.

### 3. App Review Ratings

**Type:** Self-collected primary data
**Format:** Supabase PostgreSQL `reviews` table
**Ghanaian:** Yes — collected from app users

- `device_id`: anonymous device fingerprint (UUID, not linked to phone number)
- `rating`: 1-5 stars
- `comment`: optional text (sanitized, max 500 chars)

## Secondary Data

### OpenStreetMap Tile Data

**Type:** Map tiles for supplier locations
**Source:** OpenStreetMap contributors
**License:** ODbL (Open Database License)
**Usage:** Runtime map rendering via Leaflet; tiles cached by service worker for offline use
**Attribution:** Displayed in map component per ODbL requirements

### Open-Meteo Weather Forecast

**Type:** Hourly temperature + precipitation probability for spray-timing advice
**Source:** [Open-Meteo](https://open-meteo.com) (free, no API key or account required)
**License:** CC BY 4.0
**Usage:** Live fetch per region (one representative coordinate per region) on the Result screen; not cached, not stored. Falls back to static guidance when offline or the request fails.

### Agro-Input Supplier Directory

**Type:** Compiled directory of real Ghanaian agro-input suppliers
**Format:** Bundled JSON offline baseline (`frontend/src/data/vendors.seed.json`) + Supabase `vendors` table (live sync)
**Ghanaian:** Yes — Ghana-based agro-input businesses

A directory of 69 real agro-input suppliers across ten categories (agrochemicals, fertilizer, seeds, irrigation, mechanization, tools, drone spraying, vehicles, logistics, labour), each with business name, phone(s), address, region, and input categories. Compiled from an agro-input vendor listing, then cleaned by a reproducible pipeline (`scripts/build-vendors.py`): de-duplicated across categories, phone numbers parsed and classified (mobile numbers are WhatsApp-capable, landlines are call-only), and addresses geocoded at build time via OpenStreetMap/Nominatim.

**Privacy handling:** the bundled offline copy is redacted — it carries business name, phones, address and categories, but **not** contact-person names or emails. The raw source file and the full database seed are excluded from version control. Contact-person and email fields, where shown, are served only at runtime.

**Status:** Functional in production, filterable by input type and region. Rights to publish specific contact details are being confirmed; the directory is presented as a demonstration of the supplier-linkage capability, and individual contacts can be restricted or replaced without code changes.

## Data Ethics

- Phone OTP authentication is optional; full app functionality available in guest mode
- Validation reports contain no names, phone numbers, or location coordinates
- All user-submitted text is sanitized on both client and server before storage or model input
- Farmer notes sent to Claude Vision are structurally separated and labelled as untrusted input
- Review ratings use anonymous device IDs, not phone numbers
- We will obtain written informed consent before any formal field study
- Data handling follows Ghana Data Protection Act (Act 843) principles

## Bias & Fairness Mitigation

- **Uneven regional coverage.** Disease prevalence and seasonality data currently exists for only 5 of Ghana's 16 regions (Ashanti, Greater Accra, Western, Volta, Northern). Farmers in the other 11 regions still get full diagnosis, supplier, and report functionality, but won't see a regional risk note or home-screen alert — the app does not claim regional confidence it doesn't have, and this gap is documented in the README's Known Limitations rather than silently masked.
- **Crop coverage skew.** 6 crops are covered in depth (23 diseases); major staples like maize, rice, plantain, and tomato are not yet included. The offline matcher and Claude Vision prompt both explicitly reject crops outside this list rather than guessing, to avoid confidently misdiagnosing an unsupported crop.
- **Translation quality.** Twi content across the app has been reviewed by a native Twi speaker (July 2026), so Twi-speaking farmers get guidance of comparable quality to English. New strings added after a review pass are checked before release.
- **Photo-quality bias.** The Claude Vision prompt is explicitly tuned for low-resolution, badly-lit, angled photos from older budget Android phones (common across rural Ghana) rather than assuming high-end camera hardware, to avoid the system underperforming for farmers with older devices.
- **Confidence thresholding.** Both the offline matcher and Claude Vision diagnoses surface a confidence score and explicitly label low-confidence results as "not fully sure" rather than presenting a guess as certain — this is a deliberate design choice to avoid false confidence driving an incorrect (and potentially costly or unsafe) chemical treatment decision.
- **No demographic data collected.** The app does not collect age, gender, education level, or income data from farmers, so it cannot — and does not attempt to — personalize or restrict recommendations based on those attributes.

## Reproducibility

The disease knowledge base ships as part of the frontend bundle. The complete dataset, including all symptom weights, treatment protocols, regional prevalence maps, and seasonal patterns, is inspectable at:

```
frontend/src/data/diseaseDatabase.js
```

The validation pipeline stores data in the Supabase instance documented in the backend configuration. The aggregation view is defined in:

```
backend/schema.sql → treatment_success_rates
```

The supplier directory is regenerated from source by:

```
scripts/build-vendors.py   →  frontend/src/data/vendors.seed.json + supabase/vendors.sql
```

## Offline Matcher — Accuracy Benchmark

The on-device symptom matcher is evaluated against a labelled case set (23 full-symptom profiles + 28 partial/noisy/ambiguous farmer-style reports). Metrics and the labelled cases are defined in `frontend/src/engine/matcherBench.js`; run the report with:

```
cd frontend && npm run bench:matcher
```

Latest results (51 cases): 100% top-1 accuracy, 100% precision on confident-tier predictions, 100% defer-to-AI recall on ambiguous cases, well-separated confidence when correct vs uncertain. These cases are authored from expert symptom knowledge, so they validate the matcher's scoring and decision logic — not real-world field-photo accuracy, which the Claude Vision tier and the farmer validation loop address. The benchmark also runs in CI as a regression guard.
