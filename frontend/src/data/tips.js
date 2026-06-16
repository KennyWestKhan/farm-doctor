/**
 * Farmer "tip of the day" pool (EN + Twi). One is shown per day, chosen by the
 * day of the year so it's stable within a day and rotates over time.
 *
 * ⚠️ Twi is first-draft — needs native-speaker review (see TWI_REVIEW_QUEUE).
 */
export const TIPS = [
  { en: 'Spray in the cool morning or evening, never in hot midday sun.', twi: 'Pete anɔpa anaa anwummerɛ a ahuhuru nni hɔ, ɛnyɛ awia ketee mu.' },
  { en: 'Wash your hands and face with soap after spraying any chemical.', twi: 'Hohoro wo nsa ne w\'anim wɔ samina mu wɔ aduro biara pete akyi.' },
  { en: 'Remove and burn badly diseased plants so the sickness does not spread.', twi: 'Tu afifideɛ a ayare paa no na hye no sɛdeɛ yadeɛ no rentrɛw.' },
  { en: 'Do not spray just before rain — the rain washes the medicine away.', twi: 'Mpete ansa na osu atɔ — osu no hohoro aduro no kɔ.' },
  { en: 'Rotate your crops each season to keep pests and disease away.', twi: 'Sesa mfudeɛ a wodua afe biara na mmoawa ne nyarewa mmɛn.' },
  { en: 'Keep children and animals away from the farm for a while after spraying.', twi: 'Ma mmɔfra ne mmoa mmɛn afuom kakra wɔ aduro pete akyi.' },
  { en: 'Tie a cloth over your nose and mouth when mixing or spraying chemicals.', twi: 'Fa ntoma kata wo hwene ne w\'ano ɛberɛ a worefra anaa worepete aduro.' },
  { en: 'Check your farm every week — catching disease early saves the harvest.', twi: 'Hwɛ wo afuom dapɛn biara — sɛ wohunu yadeɛ ntɛm a, wogye wo nnɔbaeɛ.' },
  { en: 'Use clean, disease-free seeds and cuttings to start a healthy farm.', twi: 'Fa aba ne dua a yadeɛ nni mu fi ase na wo afuo ahooden.' },
  { en: 'Store harvested groundnuts dry — damp nuts grow a dangerous mould.', twi: 'Kora nkateɛ a woatwa wɔ baabi a awo — nkateɛ a fɔkyee wɔ mu ma ntotoeɛ a ɛyɛ hu ba.' },
  { en: 'Mix only what you can spray today — leftover mixture loses its strength.', twi: 'Fra deɛ wobɛtumi apete ɛnnɛ nko ara — deɛ aka no ahooden sa.' },
  { en: 'Spray under the leaves too — many pests hide on the underside.', twi: 'Pete gu nhaban no ase nso — mmoawa pii hintaw ase hɔ.' },
];

/** The tip for a given date (defaults to today), stable within the day. */
export function tipOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return TIPS[dayOfYear % TIPS.length];
}
