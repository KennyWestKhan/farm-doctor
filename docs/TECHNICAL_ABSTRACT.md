# Farm Doctor Ghana — Technical Abstract

**Track:** Agriculture
**Repository:** https://github.com/KennyWestKhan/farm-doctor
**Live:** https://farm-doctor-seven.vercel.app

## Problem

Ghana loses an estimated 30–40% of crop yield to pests and diseases every year. Smallholder farmers, who grow over 80% of the country's food, often cannot identify what is affecting their crops until it is too late. Extension officers are spread thin — roughly one per 1,900 farmers — so qualified help rarely arrives in time. And when a farmer does reach an agro-input supplier, chemical labels are printed in English, in millilitres and ratios, not the language or the measurements farmers actually use at home. The result is delayed, incorrect, or unsafe treatment, and avoidable loss.

## Solution

Farm Doctor Ghana is an offline-first Progressive Web App that puts crop diagnosis, treatment guidance, and supplier access in a farmer's pocket — in Twi and English, using measurements farmers already understand (bottle caps, buckets, "weak tea" colour, not millilitres), and working with no internet for the core flow. It is built to run on 5–10 year old Android phones with poor cameras and patchy connectivity.

## Technical Approach

**Two-tier hybrid diagnosis.** The primary path is a camera scan: the farmer photographs the sick plant and Claude Vision identifies the crop and disease, tuned with a system prompt for blurry, badly-lit, angled photos from budget phones. When there is no connection — or by choice — the farmer instead answers a short visual yes/no symptom checklist, and an on-device weighted matcher scores it against a structured disease database and returns a diagnosis with a confidence score, entirely offline. Low-confidence offline results queue the photo in IndexedDB and get a Claude Vision second opinion once connectivity returns, so a farmer never has to choose between "diagnose now, badly" and "wait for signal."

**Offline matcher — measured.** The on-device matcher was benchmarked on 51 authored test cases (23 full-symptom profiles + 28 partial, noisy, and deliberately ambiguous farmer-style reports). It achieves 100% top-1 accuracy, 100% precision on its confident-tier predictions, and correctly defers to the AI on 100% of genuinely ambiguous cases, with well-separated confidence when right versus uncertain. These cases are authored from expert symptom knowledge — they validate the scoring and decision logic, not field-photo accuracy — and the harness (`npm run bench:matcher`) guards against regressions as the disease data grows.

**Agrochemical label translation.** A farmer photographs the label on any chemical bottle; AWS Textract extracts the printed text; Claude, via structured function calling, translates it into plain-language instructions in English and Twi using local measurement analogies (bottle cap, milk tin, knapsack sprayer), each anchored to its real metric ("one bottle cap, about 5 g") and scaled to the farmer's stated farm size and crop. To our knowledge no other tool in the Ghanaian agtech space does this.

**Counterfeit / banned pesticide check.** After translation, the extracted active ingredient is cross-referenced offline against actives banned under the Stockholm Convention or restricted by Ghana's EPA, surfacing a clear warning, a "commonly registered" reassurance, or an "ask your agro-dealer" prompt when status is unknown.

**Regional intelligence.** The disease database carries seasonal and regional-prevalence metadata, powering a home-screen banner that surfaces what is actively a risk in the farmer's region right now, and a best-time-to-spray advisory that calls Open-Meteo (a free, key-less forecast API) to warn against spraying before rain or in peak heat — falling back to static guidance offline.

**Supplier directory.** A searchable directory of real Ghanaian agro-input suppliers across ten categories (agrochemicals, fertilizer, seeds, irrigation, mechanization, and more), filterable by input type and region, defaulting to the farmer's saved region, with landline-aware tap-to-call and pre-filled WhatsApp enquiries in the farmer's language. The directory ships bundled so it works offline and syncs the latest from Supabase when online.

**Treatment validation loop.** After applying a treatment, farmers report whether it worked. Reports feed a success-rate view, building a farmer-generated evidence base that improves recommendations region by region — the project's core feedback signal, not a one-off diagnosis tool.

## Stack

React 19 + Vite PWA frontend (IndexedDB offline persistence, Workbox service worker, bilingual i18n), Node/Express backend (Anthropic Claude SDK, AWS Textract SDK), Supabase PostgreSQL for the vendor directory and farmer-generated data. Deployed on Vercel (frontend) and Render (backend). Frictionless entry via guest mode with optional anonymous or Google sign-in — no SMS cost, no literacy barrier. 100+ automated tests.

## Content Coverage

6 crops (chilli pepper, cassava, sweet potato, groundnut, ginger, cocoa), 23 diseases with symptoms, regional prevalence, seasonality and treatments, sourced from MOFA/PPRSD, CSIR-SARI, CSIR-CRI, IITA, ICRISAT, and COCOBOD/CRIG extension guidance. All 16 Ghana regions are selectable app-wide; full disease prevalence/seasonality data currently covers the 5 original MVP regions (Ashanti, Greater Accra, Western, Volta, Northern).

## Innovation

Farm Doctor is, to our knowledge, the only tool combining offline-first diagnosis, farmer-language label translation, counterfeit-pesticide screening, and a closed-loop treatment-validation system in one app designed to work with zero connectivity and no literacy assumptions beyond simple Twi/English sentences.

## Status

Functional MVP, security-reviewed (rate limiting, client- and server-side input sanitization, structural prompt-injection defense, CORS lockdown). Twi content reviewed by a native Twi speaker (July 2026). Offline matcher accuracy benchmarked (above). Live Claude Vision diagnosis running in production. Known limitations: full regional prevalence/seasonality data covers 5 of 16 regions (the app works everywhere; regional alerts are tuned for these five), and disease-reference photos for side-by-side visual comparison are being added.
