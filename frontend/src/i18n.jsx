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
  offline: { en: 'Offline — still works', twi: 'Intanɛt nni hɔ — ɛda so yɛ adwuma' },
  online: { en: 'Online', twi: 'Intanɛt wɔ hɔ' },
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
  symptoms_title: { en: 'What do you see?', twi: 'Ɛdeɛn na wohunu?' },
  symptoms_help: { en: 'Tap Yes, No, or Not sure for each', twi: 'Mia Aane, Daabi, anaa Mennim wɔ biara so' },
  yes: { en: 'Yes', twi: 'Aane' },
  no: { en: 'No', twi: 'Daabi' },
  unsure: { en: 'Not sure', twi: 'Mennim' },
  see_result: { en: 'See result', twi: 'Hwɛ deɛ ɛyɛ' },
  diagnosis: { en: 'Diagnosis', twi: 'Yadeɛ no' },
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
  home_browse_shops: { en: 'Find input shops', twi: 'Hwehwɛ sotɔɔ' },
  home_recent: { en: 'Recent checks', twi: 'Nsɛm a atwam' },
  home_no_recent: { en: 'No checks yet. Start your first one!', twi: 'Biribiara nni hɔ. Fi aseɛ!' },
  home_tip_title: { en: 'Tip of the day', twi: 'Ɛnnɛ afotuo' },
  home_tip_body: { en: 'Spray in the cool morning or evening, never in hot midday sun.', twi: 'Pete anɔpa anaa anwummerɛ a ahuhuru nni hɔ, ɛnyɛ awia ketee mu.' },

  // Shops
  shops_title: { en: 'Input shops', twi: 'Sotɔɔ' },
  shops_subtitle: { en: 'Agro-dealers near your region', twi: 'Sotɔɔ a ɛbɛn wo mpɔtam' },
  shops_filter_all: { en: 'All regions', twi: 'Mpɔtam nyinaa' },
  shops_sells: { en: 'Sells', twi: 'Tɔn' },

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
  scan_crop_reading: { en: 'Looking at your crop…', twi: 'Yɛrehwɛ wo mfudeɛ no…' },
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
