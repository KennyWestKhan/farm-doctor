/* eslint-disable react-refresh/only-export-components */
/**
 * Tiny bilingual layer (Twi / English).
 *
 * - UI chrome strings live in STRINGS below.
 * - Content strings (disease names, instructions) are already {en, twi} objects
 *   in the database; use `pick(obj)` to resolve them against the active language.
 *
 * Default language auto-detects from the phone: if the browser language starts
 * with "tw"/"ak" (Twi/Akan) we start in Twi, else English. The choice persists.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const LANGS = { en: 'English', twi: 'Twi' };

const STRINGS = {
  app_name: { en: 'Farm Doctor', twi: 'Farm Doctor' },
  tagline: {
    en: 'Find what is wrong with your crop',
    twi: 'Hwehwɛ deɛ ɛha wo mfudeɛ',
  },
  start: { en: 'Start', twi: 'Fi aseɛ' },
  offline: { en: 'Offline — you can still diagnose, view reports & find shops', twi: 'Intanɛt nni hɔ — wubɛtumi ahwɛ yadeɛ, ahwɛ krataa ne sotɔɔ' },
  online: { en: 'Online — all features available', twi: 'Intanɛt wɔ hɔ — biribiara yɛ adwuma' },
  choose_crop: { en: 'Which crop?', twi: 'Mfudeɛ bɛn?' },
  choose_region: { en: 'Where is your farm?', twi: 'Wo afuom wɔ he?' },
  photo_guide_title: { en: 'Take a good photo', twi: 'Twa mfonin pa' },
  photo_tip_daylight: { en: 'Stand in daylight, not shade', twi: 'Gyina awia mu, ɛnyɛ nwunu mu' },
  photo_tip_close: { en: 'Show the sick part close-up', twi: 'Kyerɛ baabi a ayare no bɛn' },
  photo_tip_compare: { en: 'Show a healthy leaf beside it', twi: 'Fa nhaban a apɔ to ho' },
  photo_tip_steady: { en: 'Hold the phone with both hands', twi: 'Fa nsa mmienu kura fon no' },
  take_photo: { en: 'Take photo', twi: 'Twa mfonin' },
  ready_take: { en: "I'm ready — take photo", twi: 'Masiesie — twa mfonin' },
  skip_photo: { en: 'Skip photo for now', twi: 'Gyae mfonin no seesei' },

  // In-app camera with framing reticle (Twi pending native review 2026-07-04)
  camera_hint: { en: 'Put the sick leaf in the box — fill the frame', twi: 'Fa nhaban a ayare no to adaka no mu — hyɛ no ma' },
  camera_use_phone: { en: 'Use my phone camera instead', twi: 'Fa me fon camera no mmom' },
  camera_denied: { en: 'The camera is blocked. Allow it in your settings, or use your phone camera.', twi: 'Wɔasi camera no kwan. Ma ho kwan wɔ settings mu, anaa fa wo fon camera no.' },
  camera_unavailable: { en: "Can't open the in-app camera here. Use your phone camera instead.", twi: 'Yɛntumi mmue app camera no ha. Fa wo fon camera no mmom.' },
  symptoms_title: { en: 'What do you see?', twi: 'Ɛdeɛn na wohunu?' },
  symptoms_help: { en: 'Tap Yes, No, or Not sure for each', twi: 'Mia Aane, Daabi, anaa Mennim wɔ biara so' },
  yes: { en: 'Yes', twi: 'Aane' },
  no: { en: 'No', twi: 'Daabi' },
  unsure: { en: 'Not sure', twi: 'Mennim' },
  see_result: { en: 'See result', twi: 'Hwɛ deɛ ɛyɛ' },
  diagnosis: { en: 'Diagnosis', twi: 'Yadeɛ no' },
  disease_about: { en: 'About this disease', twi: 'Saa yadeɛ yi ho nsɛm' },
  disease_signs: { en: 'Signs to look for', twi: 'Nsɛnkyerɛnneɛ a wobɛhwɛ' },
  disease_verify_cta: { en: 'Scan your crop to verify', twi: 'Scan wo mfudeɛ na hwɛ' },
  disease_verify_hint: { en: 'Not sure this is it? Take a photo and let us check.', twi: 'Wonnim sɛ ɛyɛ yei? Twa mfonin na ma yɛnhwɛ.' },
  confidence: { en: 'Confidence', twi: 'Ahotosoɔ' },
  uncertain_title: { en: 'Not fully sure', twi: 'Yɛnnim yie' },
  uncertain_body: {
    en: 'We will check your photo with AI when you get internet. For now, here is our best guess:',
    twi: 'Yɛde AI bɛhwɛ wo mfonin no sɛ wonya intanɛt a. Seesei deɛ, yei ne deɛ yɛsusu:',
  },
  uncertain_ai_body: {
    en: 'The AI is not fully sure from this photo. Try a clearer photo in good light, or confirm with your agro-dealer before spraying.',
    twi: 'AI nnim yie mfiri saa mfonin yi. Twa mfonin a emu da hɔ wɔ hann mu, anaa bisa wo aduro tɔnfoɔ ansa na woapete.',
  },
  no_match_title: { en: 'Could not tell', twi: 'Yɛantumi anhunu' },
  no_match_body: {
    en: 'Your answers did not match a known disease. Your photo is saved and will be checked by AI when you are online.',
    twi: 'Wo mmuaeɛ ne yadeɛ a yɛnim biara anhyia. Yɛakora wo mfonin na AI bɛhwɛ sɛ wonya intanɛt a.',
  },
  treatments: { en: 'What to use', twi: 'Deɛ wode bɛyɛ' },
  how_to_mix: { en: 'How to mix', twi: 'Sɛdeɛ wobɛfra' },
  how_much: { en: 'How much', twi: 'Dodow a wode bɛyɛ' },
  how_to_apply: { en: 'How to spray', twi: 'Sɛdeɛ wobɛpete' },
  how_often: { en: 'How often', twi: 'Mpɛn dodow' },
  price: { en: 'Price', twi: 'Boɔ' },
  success_rate: { en: 'success', twi: 'di nkonim' },
  farmers_tried: { en: 'farmers tried this', twi: 'akuafoɔ asɔ ahwɛ' },
  no_farmer_reports: { en: 'No farmer reports yet', twi: 'Akuafoɔ mmɔ ammanneɛ bi mma' },
  find_suppliers: { en: 'Find a shop near you', twi: 'Hwehwɛ sotɔɔ a ɛbɛn wo' },
  watch_video: { en: 'Watch how (video)', twi: 'Hwɛ sɛdeɛ wɔyɛ (vidyo)' },
  videos_title: { en: 'Watch & learn', twi: 'Hwɛ na sua' },
  videos_hint: { en: 'Short videos about this disease and how to treat it.', twi: 'Vidyo nketewa fa saa yadeɛ yi ne sɛdeɛ wɔsa no ho.' },
  videos_search: { en: 'Find videos on YouTube', twi: 'Hwehwɛ vidyo wɔ YouTube' },
  did_you_use: { en: 'Did you use this treatment?', twi: 'Wode saa aduro yi yɛɛ adwuma?' },
  did_it_work: { en: 'Did it work?', twi: 'Ɛyɛɛ adwuma?' },
  worked: { en: 'It worked', twi: 'Ɛyɛɛ adwuma' },
  partly: { en: 'Partly', twi: 'Kakra' },
  failed: { en: 'It failed', twi: 'Anyɛ adwuma' },
  notes_optional: { en: 'Add a note (optional)', twi: 'Ka biribi (sɛ wopɛ a)' },
  send_feedback: { en: 'Send', twi: 'Fa kɔ' },
  thanks: { en: 'Thank you for helping other farmers!', twi: 'Meda wo ase sɛ woaboa akuafoɔ foforɔ!' },
  back: { en: 'Back', twi: 'San kɔ' },
  open_whatsapp: { en: 'WhatsApp', twi: 'WhatsApp' },
  call_shop: { en: 'Call', twi: 'Frɛ' },
  away: { en: 'away', twi: 'kwan' },
  install_app: { en: 'Add to home screen', twi: 'Fa to fie kɛsɛ so' },

  // Bottom nav
  tab_home: { en: 'Home', twi: 'Fie' },
  tab_diagnose: { en: 'Diagnose', twi: 'Hwɛ' },
  tab_shops: { en: 'Shops', twi: 'Sotɔɔ' },
  tab_reports: { en: 'Reports', twi: 'Krataa' },

  // Home
  greeting_morning: { en: 'Good morning', twi: 'Maakye' },
  greeting_afternoon: { en: 'Good afternoon', twi: 'Maaha' },
  greeting_evening: { en: 'Good evening', twi: 'Maadwo' },
  home_prompt: { en: "What's wrong with your crop?", twi: 'Ɛdeɛn na ɛha wo mfudeɛ?' },
  home_diagnose_cta: { en: 'Diagnose a crop', twi: 'Hwɛ mfudeɛ ho' },
  home_browse_shops: { en: 'Agro Shops', twi: 'Hwehwɛ sotɔɔ' },
  home_recent: { en: 'Recent checks', twi: 'Nsɛm a atwam' },
  home_no_recent: { en: 'No checks yet. Start your first one!', twi: 'Biribiara nni hɔ. Fi aseɛ!' },
  home_tip_title: { en: 'Tip of the day', twi: 'Ɛnnɛ afotuo' },
  home_tip_body: { en: 'Spray in the cool morning or evening, never in hot midday sun.', twi: 'Pete anɔpa anaa anwummerɛ a ahuhuru nni hɔ, ɛnyɛ awia ketee mu.' },

  // Regional alerts
  alerts_title: { en: 'Active in your region', twi: 'Ɛrekɔ so wɔ wo mpɔtam' },
  alerts_peaking: { en: 'Peaking now', twi: 'Ɛyɛ den seesei' },
  alerts_active: { en: 'Active', twi: 'Ɛrekɔ so' },

  // Pesticide registry check
  pesticide_banned_title: { en: 'This product is banned or restricted', twi: 'Wɔabra aduro yi ho anaa wɔasi ho ban' },
  pesticide_registered_title: { en: 'Active ingredient is commonly registered', twi: 'Aduro a ɛwɔ mu no wɔakyerɛw ho din' },
  pesticide_unknown_title: { en: 'Could not verify this product', twi: 'Yɛantumi anhwɛ aduro yi mu' },
  pesticide_unknown_body: {
    en: 'We could not match this against our reference list. Ask your agro-dealer or PPRSD to confirm it is registered before you buy or use it.',
    twi: 'Yɛantumi amfa eyi ntoto yɛn list ho. Bisa wo aduro tɔnfoɔ anaa PPRSD ma ɔnhwɛ sɛ wɔakyerɛw ho din ansa na wotɔ anaa wode di dwuma.',
  },
  pesticide_disclaimer: {
    en: "This is a reference list, not the official EPA Ghana registry. When in doubt, confirm with PPRSD or your agro-dealer.",
    twi: 'Yei yɛ list a yɛakora, ɛnyɛ EPA Ghana official registry. Sɛ wonnim a, bisa PPRSD anaa wo aduro tɔnfoɔ.',
  },

  // Spray timing
  spray_title: { en: 'Best time to spray', twi: 'Berɛ pa a wobɛpete' },
  spray_rain_soon: {
    en: 'Rain is expected soon — wait until it clears, or the spray will wash off before it works.',
    twi: 'Osu bɛtɔ seesei — twɛn kosi sɛ ɛbɛgyae, anaa nsuo bɛhohoro aduro no ansa na ɛyɛ adwuma.',
  },
  spray_hot_now: {
    en: "It's hot right now — wait for the cool of evening so the spray doesn't burn the leaves.",
    twi: 'Ahuhuru wɔ hɔ seesei — twɛn anwummerɛ a ɛyɛ nwunu sɛdeɛ aduro no renhye nhaban no.',
  },
  spray_good_now: { en: 'Good conditions — cool and no rain expected. You can spray now.', twi: 'Tebea no yɛ pa — ɛyɛ nwunu na osuo nni hɔ. Wobɛtumi apete seesei.' },
  spray_ok_later: { en: 'No rain expected, but wait for cooler hours — early morning or evening.', twi: 'Osuo nni hɔ, nanso twɛn berɛ a ɛyɛ nwunu — anɔpa anaa anwummerɛ.' },
  spray_offline: { en: 'No internet for a live forecast. As a rule: spray in the cool morning or evening, never just before rain.', twi: 'Intanɛt nni hɔ ma forecast. Mmara: pete anɔpa anaa anwummerɛ a ɛyɛ nwunu, na nnyɛ ansa na osuo retɔ.' },

  // Farm size / spray quantity (hybrid: size in → suggested loads out)
  farmsize_title: { en: 'How big is your farm?', twi: 'Wo afuo yɛ kɛseɛ sɛn?' },
  farmsize_subtitle: {
    en: 'Tap your farm size — we suggest how many loads to mix for this crop',
    twi: 'Mia wo afuo kɛseɛ — yɛbɛkyerɛ mpɛn dodow a wobɛfra ama saa afifideɛ yi',
  },
  farmsize_buckets_unit: { en: 'loads to mix', twi: 'mpɛn a wobɛfra' },
  farmsize_estimate_hint: {
    en: 'Estimate for a 15 L sprayer load — use − / + if you know your own number.',
    twi: 'Yɛgyina 15 L sprayer so na abu yi — fa − / + sesa sɛ wonim wo dodow.',
  },
  farmsize_total_label: { en: 'For your whole farm', twi: 'Ma wo afuo nyinaa' },

  // Diagnosis-ready notification opt-in (Twi pending native review 2026-07-04)
  notify_cta: { en: 'Tell me when the AI check is done', twi: 'Ka kyerɛ me sɛ AI no awie' },
  notify_sub: {
    en: "We'll send a message when your result is ready — even if you close the app.",
    twi: 'Yɛbɛfa nkra abrɛ wo sɛ wo mmuae aba — sɛ woto app no mu mpo a.',
  },
  notify_on: { en: "Done — we'll message you when it's ready.", twi: 'Yɛawie — yɛbɛbɔ wo nkra sɛ aba a.' },

  // Storage tips
  storage_title: { en: 'Protect your harvest', twi: 'Bɔ wo otwa ho ban' },
  storage_drying: { en: 'Drying', twi: 'Sɛdeɛ wobɛwo' },
  storage_storage: { en: 'Storage', twi: 'Sɛdeɛ wobɛkora' },
  storage_signs: { en: 'Signs of spoilage', twi: 'Nsɛnkyerɛnne a ɛkyerɛ sɛ aporɔ' },
  storage_duration: { en: 'How long it keeps', twi: 'Ne berɛ a ɛbɛkora' },

  // Shops
  shops_title: { en: 'Input shops', twi: 'Sotɔɔ' },
  shops_subtitle: { en: 'Agro-dealers near your region', twi: 'Sotɔɔ a ɛbɛn wo mpɔtam' },
  shops_filter_all: { en: 'All regions', twi: 'Mpɔtam nyinaa' },
  shops_sells: { en: 'Sells', twi: 'Tɔn' },

  // Shop submission
  shop_submit_cta: { en: 'Know a shop? Add it here', twi: 'Wunim sotɔɔ bi? Fa ka ho' },
  shop_submit_title: { en: 'Suggest a shop', twi: 'Kyerɛ sotɔɔ bi' },
  shop_field_name: { en: 'Shop name', twi: 'Sotɔɔ din' },
  shop_field_name_hint: { en: 'e.g. "Kofi Agro Shop"', twi: 'te sɛ "Kofi Agro Shop"' },
  shop_field_region: { en: 'Region', twi: 'Mantam' },
  shop_field_region_hint: { en: 'Select region', twi: 'Paw mantam' },
  shop_field_town: { en: 'Town', twi: 'Kuro' },
  shop_field_town_hint: { en: 'e.g. "Kumasi"', twi: 'te sɛ "Kumasi"' },
  shop_field_whatsapp: { en: 'WhatsApp number', twi: 'WhatsApp nɔma' },
  shop_field_phone: { en: 'Phone number', twi: 'Fon nɔma' },
  shop_field_products: { en: 'What do they sell?', twi: 'Deɛ wɔtɔn?' },
  shop_field_products_hint: { en: 'e.g. "Mancozeb, Copper spray, seeds"', twi: 'te sɛ "Mancozeb, Copper spray, aba"' },
  shop_field_note: { en: 'Any extra info', twi: 'Nsɛm foforɔ biara' },
  shop_field_note_hint: { en: 'e.g. "Open on Saturdays, near the market"', twi: 'te sɛ "Wɔbue Memeneda, ɛbɛn aguadie"' },
  shop_submit_send: { en: 'Submit shop', twi: 'Fa sotɔɔ no kɔ' },
  shop_submit_sending: { en: 'Sending…', twi: 'Ɛrekɔ…' },
  shop_submit_error: { en: 'Could not send. Try again later.', twi: 'Yɛantumi amfa ankɔ. San sɔ hwɛ akyire yi.' },
  shop_submit_thanks: { en: 'Thank you!', twi: 'Meda wo ase!' },
  shop_submit_review_note: { en: 'We will review and add it to the list.', twi: 'Yɛbɛhwɛ mu na yɛde aka ho.' },

  // Reports
  reports_title: { en: 'My reports', twi: 'Me krataa' },
  reports_subtitle: { en: 'Crops you have checked', twi: 'Mfudeɛ a woahwɛ' },
  reports_empty: { en: 'No reports yet. Diagnose a crop to see it here.', twi: 'Krataa biara nni hɔ. Hwɛ mfudeɛ na ɛbɛba ha.' },
  reports_offline_tag: { en: 'Checked offline', twi: 'Hwɛɛ a intanɛt nni hɔ' },
  reports_pending_vision: { en: 'Will recheck with AI online', twi: 'AI bɛsan ahwɛ wɔ intanɛt so' },
  rechecked_by_ai: { en: 'Rechecked by AI', twi: 'AI asan ahwɛ' },
  ai_tag: { en: 'AI', twi: 'AI' },
  ai_observed: { en: 'What the AI saw', twi: 'Deɛ AI hunuiɛ' },
  ai_note: { en: 'AI note', twi: 'AI asɛm' },

  // Desktop gate
  gate_title: { en: 'Open on your phone', twi: 'Bue wɔ wo fon so' },
  gate_body: { en: 'Farm Doctor is built for your phone. Scan this code or open the link on your mobile.', twi: 'Wɔayɛ Farm Doctor ama wo fon. Scan kɔɔd yi anaa bue link no wɔ wo fon so.' },
  gate_dashboard_link: { en: 'View the impact dashboard →', twi: 'Hwɛ impact dashboard →' },
  view_all: { en: 'View all', twi: 'Hwɛ ne nyinaa' },

  // Location preference
  set_location: { en: 'Set location', twi: 'Si wo beaeɛ' },
  change_location: { en: 'Change location', twi: 'Sesa wo beaeɛ' },
  change: { en: 'Change', twi: 'Sesa' },

  // Report detail
  diagnosed_on: { en: 'Diagnosed', twi: 'Wɔhwɛeɛ' },
  report_recommend: { en: 'Recommended at the time', twi: 'Deɛ wɔkamfo kyerɛɛ saa berɛ no' },
  your_feedback: { en: 'Your feedback', twi: 'Wo nsɛm' },
  you_used_it: { en: 'You used this treatment', twi: 'Wode saa aduro yi diiɛ dwuma' },
  you_didnt_use: { en: "You didn't use this treatment", twi: 'Woamfa saa aduro yi anni dwuma' },
  result_label: { en: 'Result', twi: 'Deɛ ɛyɛeɛ' },
  not_found: { en: 'Report not found', twi: 'Yɛanhunu krataa no' },

  // Scan hub
  scan_title: { en: 'Scan', twi: 'Scan' },
  scan_home_cta: { en: 'Scan crop or label', twi: 'Scan mfudeɛ anaa label' },
  scan_home_desc: { en: 'Take a photo to find a crop disease or understand a chemical label.', twi: 'Twa mfonin hwehwɛ mfudeɛ yadeɛ anaa te aduro label ase.' },
  scan_hub_subtitle: { en: 'Take a photo — what do you want to scan?', twi: 'Twa mfonin — ɛdeɛn na wopɛ sɛ wo scan?' },
  scan_crop_title: { en: 'Scan my crop', twi: 'Scan me mfudeɛ' },
  scan_crop_desc: { en: 'Photograph the sick plant. We find the disease and tell you what to do.', twi: 'Twa afifideɛ a ayare no mfonin. Yɛbɛhwehwɛ yadeɛ no na yɛaka deɛ wonyɛ.' },
  scan_crop_cta: { en: 'Take photo of the crop', twi: 'Twa mfudeɛ no mfonin' },
  scan_note_label: { en: 'Describe the problem (optional)', twi: 'Kyerɛ asɛm no mu (sɛ wopɛ a)' },
  scan_note_placeholder: { en: 'e.g. "leaves turning yellow for 2 weeks"', twi: 'te sɛ "nhahan no ayɛ akokɔsrade bɛyɛ nnawɔtwe 2"' },
  scan_crop_send: { en: 'Send for diagnosis', twi: 'Fa ma yɛnhwɛ' },
  scan_crop_desc_short: { en: 'Photograph the sick plant', twi: 'Twa afifideɛ a ayare no mfonin' },
  scan_label_desc_short: { en: 'Translate a chemical label', twi: 'Kyerɛ aduro label ase' },
  scan_crop_reading: { en: 'Looking at your crop…', twi: 'Yɛrehwɛ wo mfudeɛ no…' },
  scan_step_uploading: { en: 'Uploading your photo…', twi: 'Yɛde wo mfonin no rekɔ…' },
  scan_step_analyzing: { en: 'Looking closely at your crop…', twi: 'Yɛrehwɛ wo mfudeɛ no yie…' },
  scan_step_matching: { en: 'Comparing with known diseases…', twi: 'Yɛde retoto yadeɛ a yɛnim ho…' },
  scan_step_finalizing: { en: 'Putting your result together…', twi: 'Yɛreboaboa wo nsɛm ano…' },
  scan_slow_notice: {
    en: 'This is taking a little longer than usual — please keep the app open.',
    twi: 'Eyi rekɔ akyiri sen sɛdeɛ ɛtaa yɛ — mesrɛ wo, ma app no da hɔ.',
  },
  scan_label_step_ocr: { en: 'Reading the text on the label…', twi: 'Yɛrekenkan nsɛm a ɛwɔ label no so…' },
  scan_label_step_translating: { en: 'Translating into plain language…', twi: 'Yɛredane no kasa a wote aseɛ…' },
  scan_crop_unclear: { en: 'The photo was unclear. Try again in good light, or answer questions instead.', twi: 'Mfonin no mu anna hɔ. San sɔ hwɛ wɔ hann mu, anaa bua nsɛmmisa.' },
  scan_use_questions: { en: 'Answer questions instead', twi: 'Bua nsɛmmisa mmom' },
  scan_crop_label: { en: 'Crop (change if wrong)', twi: 'Mfudeɛ (sesa sɛ ɛnyɛ)' },
  scan_detected: { en: 'We think this is', twi: 'Yɛsusu sɛ yei yɛ' },

  // Scan a label
  scan_label_title: { en: 'Scan a label', twi: 'Scan label' },
  scan_subtitle: { en: 'Photograph the writing on the chemical container — we turn it into plain words.', twi: 'Twa mfonin fa nsɛm a ɛwɔ aduro toa no so — yɛbɛdane no nsɛm a wote aseɛ.' },
  scan_cta: { en: 'Take photo of the label', twi: 'Twa label no mfonin' },
  scan_from_result: { en: 'Bought it? Scan the label', twi: 'Woatɔ? Scan label no' },
  scan_reading: { en: 'Reading the label…', twi: 'Yɛrekenkan label no…' },
  scan_needs_internet: { en: 'Scanning needs internet. Connect and try again.', twi: 'Scan hia intanɛt. Fa intanɛt na sɔ hwɛ bio.' },
  scan_failed: { en: 'Could not read the label. Try a clearer, brighter photo.', twi: 'Yɛantumi ankenkan label no. Twa mfonin a emu da hɔ.' },
  scan_timeout: {
    en: "This is taking too long and the request timed out. Check your connection and try again.",
    twi: 'Eyi rekɔ akyiri dodo na request no twaa mu. Hwɛ wo intanɛt na sɔ hwɛ bio.',
  },
  scan_network_error: {
    en: 'Could not reach the server. Check your connection and try again.',
    twi: 'Yɛantumi anka server no. Hwɛ wo intanɛt na sɔ hwɛ bio.',
  },
  scan_server_error: {
    en: 'Something went wrong on our end. Please try again in a moment.',
    twi: 'Mfomso bi asi yɛn fa. Mesrɛ wo, sɔ hwɛ bio seesei seesei.',
  },
  try_again: { en: 'Try again', twi: 'Sɔ hwɛ bio' },
  scan_unreadable: { en: 'The label was hard to read. This is general guidance — ask your agro-dealer to confirm.', twi: 'Label no kenkan yɛ den. Yei yɛ akwankyerɛ kɛkɛ — bisa wo aduro tɔnfoɔ ma ɔnhwɛ.' },
  scan_again: { en: 'Scan another', twi: 'Scan foforɔ' },
  label_product: { en: 'Product', twi: 'Aduro' },
  label_treats: { en: 'For', twi: 'Ma' },
  label_safety: { en: 'Stay safe', twi: 'Bɔ wo ho ban' },

  // Refine
  refine_title: { en: 'Make it fit your farm', twi: 'Ma ɛnfata wo afuo' },
  refine_update: { en: 'Update instructions', twi: 'Sesa akwankyerɛ no' },
  refine_farm_size: { en: 'Farm size', twi: 'Afuo no kɛseɛ' },
  refine_stage: { en: 'Crop stage', twi: 'Mfudeɛ no berɛ' },
  refine_crop: { en: 'Crop', twi: 'Mfudeɛ' },
  refine_other: { en: 'Other detail (optional)', twi: 'Biribi foforɔ (sɛ wopɛ a)' },
  farm_small: { en: 'Small', twi: 'Ketewa' },
  farm_medium: { en: 'Medium', twi: 'Ntam' },
  farm_large: { en: 'Large', twi: 'Kɛseɛ' },
  stage_seedling: { en: 'Young', twi: 'Aba foforɔ' },
  stage_flowering: { en: 'Flowering', twi: 'Regugu nhwiren' },
  stage_fruiting: { en: 'Fruiting', twi: 'Reso aba' },

  // Install / Add to Home Screen
  install_title: { en: 'Install Farm Doctor', twi: 'Fa Farm Doctor to wo fon so' },
  install_body: {
    en: 'Add it to your phone. It works offline and opens like a normal app.',
    twi: 'Fa to wo fon so. Ɛyɛ adwuma a intanɛt nni hɔ, na ɛbue te sɛ app biara.',
  },
  install_cta: { en: 'Install', twi: 'Fa to so' },
  install_later: { en: 'Not now', twi: 'Ɛnnɛ deɛ daabi' },
  install_ios_pre: { en: 'Tap', twi: 'Mia' },
  install_ios_post: { en: "then 'Add to Home Screen'", twi: "na pia 'Add to Home Screen'" },
  install_offline_perk: { en: 'Works offline', twi: 'Yɛ adwuma a intanɛt nni hɔ' },
  install_fast_perk: { en: 'Opens instantly', twi: 'Bue ntɛm' },

  // Welcome / Auth
  welcome_sign_in: { en: 'Sign in with phone', twi: 'De wo fon nɔma bra mu' },
  welcome_guest: { en: 'Continue as guest', twi: 'Kɔ so sɛ ahɔho' },
  welcome_guest_note: { en: 'Guest mode works fully offline. Sign in later to save your data across devices.', twi: 'Ahɔho kwan yɛ adwuma a intanɛt nni hɔ. Bra mu akyire na wo data bɛtra wɔ fon biara so.' },
  // Anonymous + Google auth (Twi pending native review 2026-07-04)
  welcome_get_started: { en: 'Get started', twi: 'Fi ase' },
  welcome_google: { en: 'Continue with Google', twi: 'Fa Google toa so' },
  welcome_use_phone: { en: 'Use phone number instead', twi: 'Fa fon nɔma mmom' },
  welcome_start_note: { en: 'Start free, no account needed. Sign in with Google to keep your data across phones.', twi: 'Fi ase kwa, ɛnhia akawnt. Fa Google bra mu na wo data ntena wo fon nyinaa so.' },
  welcome_privacy: { en: 'Your data stays on your device. We collect anonymous treatment feedback only with your consent.', twi: 'Wo data tra wo fon so. Yɛfa treatment nsɛm a wɔnnim onipa gye kwan a wopene so nko.' },
  welcome_phone_title: { en: 'Your phone number', twi: 'Wo fon nɔma' },
  welcome_phone_desc: { en: "We'll send a code to verify it's you.", twi: 'Yɛbɛde kɔɔd abrɛ wo de ahwɛ sɛ ɛyɛ wo.' },
  welcome_phone_invalid: { en: 'Enter a valid Ghana phone number (10 digits)', twi: 'Hyɛ Ghana fon nɔma pa (nɔma 10)' },
  welcome_send_code: { en: 'Send code', twi: 'De kɔɔd brɛ me' },
  welcome_skip: { en: 'Skip for now', twi: 'Gyae seesei' },
  welcome_verify_title: { en: 'Enter the code', twi: 'Hyɛ kɔɔd no' },
  welcome_verify_desc: { en: 'We sent a code to', twi: 'Yɛde kɔɔd abrɛ' },
  welcome_verify_btn: { en: 'Verify', twi: 'Hwɛ' },
  welcome_code_invalid: { en: 'Enter the code we sent you', twi: 'Hyɛ kɔɔd a yɛde brɛɛ wo no' },
  welcome_resend: { en: 'Send code again', twi: 'San de kɔɔd brɛ me' },

  // Profile
  profile_title: { en: 'Profile', twi: 'Wo ho nsɛm' },
  profile_signed_in: { en: 'Signed in', twi: 'Wɔabra mu' },
  profile_guest: { en: 'Guest', twi: 'Ahɔho' },
  profile_guest_desc: { en: 'Sign in to save your data across devices', twi: 'Bra mu na wo data bɛtra wɔ fon biara so' },
  profile_sign_in: { en: 'Sign in', twi: 'Bra mu' },
  profile_sign_out: { en: 'Sign out', twi: 'Fi mu' },
  profile_language: { en: 'Language', twi: 'Kasa' },
  profile_region: { en: 'Region', twi: 'Mpɔtam' },
  profile_crops: { en: 'My crops', twi: 'Me mfudeɛ' },
  profile_my_diagnoses: { en: 'My diagnoses', twi: 'Me nhwɛsoɔ' },
  profile_fav_suppliers: { en: 'Favourite shops', twi: 'Sotɔɔ a mepɛ' },
  profile_default_supplier: { en: 'My go-to shop', twi: 'Me sotɔɔ titire' },
  profile_no_favs: { en: 'No favourite shops yet. Star a shop to save it here.', twi: 'Sotɔɔ biara nni ha. Fa nsoromma to sotɔɔ so de kora no ha.' },
  profile_notes: { en: 'Notes', twi: 'Nsɛm' },
  profile_add_note: { en: 'Add a note about this shop', twi: 'Ka biribi fa saa sotɔɔ yi ho' },
  profile_set_default: { en: 'Set as my go-to shop', twi: 'Yɛ me sotɔɔ titire' },
  profile_is_default: { en: 'Your go-to shop', twi: 'Wo sotɔɔ titire' },
  profile_remove_fav: { en: 'Remove from favourites', twi: 'Yi fi me pɛ mu' },
  profile_suggest_fav: { en: 'You contact this shop often. Add to favourites?', twi: 'Wone saa sotɔɔ yi di nkutaho pii. Fa to wo pɛ mu?' },
  profile_crop_select: { en: 'Select your crops', twi: 'Paw wo mfudeɛ' },

  // Review prompt
  review_title: { en: 'Enjoying Farm Doctor?', twi: 'Wo pɛ Farm Doctor?' },
  review_body: { en: 'Your feedback helps us improve the app for farmers across Ghana.', twi: 'Wo nsɛm boa yɛn ma yɛ app no yɛ papa ma afuom nipa wɔ Ghana nyinaa.' },
  review_submit: { en: 'Submit', twi: 'Mena so' },
  review_later: { en: 'Maybe later', twi: 'Akyire yi' },
  review_thanks: { en: 'Thank you for your feedback!', twi: 'Yɛda wo ase wɔ wo nsɛm no ho!' },
  review_comment_placeholder: { en: 'Any thoughts? (optional)', twi: 'Wo adwene bi wɔ ho? (ɛnyɛ dɛ ɛsɛ)' },

  // Scan limit
  scan_limit_reached: { en: 'You have reached your daily scan limit. Try again tomorrow.', twi: 'Woadu wo scan dodow ɛnnɛ. Sɔ hwɛ ɔkyena.' },
};

const Ctx = createContext(null);

function detectDefault() {
  const saved = localStorage.getItem('fd_lang');
  if (saved && LANGS[saved]) return saved;
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('tw') || nav.startsWith('ak') ? 'twi' : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectDefault);

  useEffect(() => {
    localStorage.setItem('fd_lang', lang);
    document.documentElement.lang = lang === 'twi' ? 'ak' : 'en';
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
    const pick = (obj) => (obj == null ? '' : obj[lang] ?? obj.en ?? '');
    const toggle = () => setLang((l) => (l === 'en' ? 'twi' : 'en'));
    return { lang, setLang, toggle, t, pick };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
