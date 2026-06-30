# Farm Doctor Ghana — Technical Abstract

**Track:** Agriculture
**Repository:** https://github.com/KennyWestKhan/farm-doctor

## Problem

Ghana loses an estimated 30–40% of crop yield to pests and diseases annually. Smallholder farmers, who produce over 80% of the country's food, often cannot identify what is affecting their crops until it is too late. Extension officers are spread thin — roughly one per 1,900 farmers — and when farmers do reach an agro-input supplier, chemical labels are printed in English with metric units that do not translate to the tools or language farmers actually use. The result is delayed, incorrect, or unsafe treatment, and avoidable crop loss.

## Solution

Farm Doctor Ghana is an offline-first Progressive Web App that puts crop diagnosis, treatment guidance, and supplier access directly in a farmer's pocket — in Twi and English, using measurements farmers already understand (bottle caps, buckets, "weak tea" colour, not millilitres or ratios), and working with zero internet connection for the core flow.

## Technical Approach

**Two-tier hybrid diagnosis.** A farmer answers a short visual symptom checklist; an on-device, rule-based weighted matcher scores the answers against a structured disease database (`frontend/src/data/diseaseDatabase.js`) and returns a diagnosis with a confidence score — entirely offline. When offline confidence is below 70%, the photo is queued in IndexedDB and sent to Claude Vision once connectivity returns, using a system prompt specifically tuned for blurry, low-quality photos from budget Android phones. A direct camera-scan path skips the checklist entirely and sends the photo straight to Claude Vision.

**Agrochemical label translation.** No other tool in the Ghanaian agtech space does this: a farmer photographs the label on any chemical bottle, AWS Textract extracts the printed text, and Claude (via structured function calling) translates it into plain-language instructions in English and Twi, using local measurement analogies and adjusting dosage guidance to the farmer's stated farm size, crop, and growth stage.

**Counterfeit/banned pesticide check.** After translation, the extracted product name and active ingredient are cross-referenced offline against a curated list of actives banned under the Stockholm Convention or restricted by Ghana's EPA, flagging a clear warning, a "commonly registered" reassurance, or an "ask your agro-dealer" prompt when status can't be determined.

**Regional intelligence.** The disease database carries seasonal and regional-prevalence metadata for each disease, which powers a home-screen banner surfacing what is actively a risk in the farmer's region right now, and a "best time to spray" advisory that calls Open-Meteo (a free, key-less forecast API) to warn against spraying right before rain or during peak heat — falling back to static guidance offline.

**Treatment validation loop.** After applying a treatment, farmers report whether it worked. These reports sync to a Supabase PostgreSQL database and feed a live success-rate view, building a farmer-generated evidence base that improves recommendations over time — this is the project's core feedback signal, not a one-off diagnosis tool.

## Stack

React 19 + Vite PWA frontend (IndexedDB offline persistence, Workbox service worker, bilingual i18n context), Node/Express backend (Anthropic Claude SDK, AWS Textract SDK), Supabase PostgreSQL for farmer-generated data, deployed on Vercel + Render.

## Content Coverage

6 crops (chilli pepper, cassava, sweet potato, groundnut, ginger, cocoa), 23 diseases with symptoms, regional prevalence, seasonality and treatments, sourced from MOFA, CSIR-SARI, CSIR-CRI, IITA, ICRISAT, and COCOBOD/CRIG extension guidance. All 16 Ghana regions are selectable app-wide; disease prevalence/seasonality data currently covers the 5 original MVP regions in full (Ashanti, Greater Accra, Western, Volta, Northern).

## Innovation

Farm Doctor is, to our knowledge, the only tool in this space that combines offline-first diagnosis, farmer-language label translation, counterfeit-pesticide screening, and a closed-loop treatment-validation system in a single app designed to function with zero connectivity and zero literacy assumptions beyond reading simple Twi/English sentences.

## Status

Functional MVP, security-reviewed (rate limiting, input sanitization on client and server, structural prompt-injection defense, CORS lockdown). Known limitations: Twi translations are first-draft pending native-speaker review; supplier directory and treatment success-rate seed data are demo placeholders pending real partnerships; offline rule-based matcher accuracy benchmarking against field-confirmed cases is in progress.
