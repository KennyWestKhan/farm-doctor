/**
 * Post-harvest storage guidance, keyed by cropId. Shown after a confident
 * diagnosis so farmers don't lose their harvest to poor drying/storage.
 *
 * Sources: CSIR/CRI post-harvest guidelines, PICS bag research (Purdue/IITA).
 * ⚠️ TWI REVIEW NEEDED — same review queue as diseaseDatabase.js.
 */
export const STORAGE_TIPS = {
  cassava: {
    drying: {
      en: 'Peel and process within 24–48 hours of harvest — fresh cassava rots fast. Slice or grate, then sun-dry on a raised mat, or ferment for gari/agbelima.',
      twi: 'Yi ho na yɛ ho adwuma wɔ nnɔnhwere 24–48 mu wɔ otwa akyi — bankye foforɔ porɔ ntɛm. Twitwa anaa yam, na wo wɔ awia mu wɔ kɛtɛ a ɛkorɔn so, anaa fa yɛ gari/agbelima.',
    },
    storage: {
      en: 'Store dried chips or gari in clean, dry sacks off the ground. Fresh roots do not store — only dry/processed cassava keeps.',
      twi: 'Fa bankye a awo anaa gari sie wɔ kotokuo a ɛho teɛ a ɛnni fam. Bankye foforɔ ntena — deɛ awo anaa wɔayɛ no nko na ɛtena.',
    },
    signs_of_spoilage: {
      en: 'Blue-black streaks inside the root, a sour smell, or soft mushy patches mean it has started to rot.',
      twi: 'Ntwitwaeɛ tuntum-bruu wɔ ntini no mu, hua a ɛyɛ kɔkɔɔ, anaa baabi a ayɛ bɛtɛɛ kyerɛ sɛ aporɔ afiri aseɛ.',
    },
    duration: {
      en: 'Fresh roots: 2–3 days only. Dried chips or gari: 6–12 months if kept dry.',
      twi: 'Ntini foforɔ: nnafua 2–3 pɛ. Deɛ awo anaa gari: bosome 6–12 sɛ wokora no yie a fɔkyee nni ho.',
    },
  },
  groundnut: {
    drying: {
      en: 'Sun-dry pods on a raised mat (not directly on bare ground) until they crack cleanly and the moisture is around 8%.',
      twi: 'Wowɔ aba no wɔ kɛtɛ a ɛkorɔn so (ɛnyɛ asaase tẽẽ so) kosi sɛ ɛbɛpae fann na fɔkyee no bɛyɛ 8%.',
    },
    storage: {
      en: 'Store in PICS (triple-layer) hermetic bags, or clean dry sacks raised off the ground. Keep away from damp walls.',
      twi: 'Fa sie wɔ PICS kotokuo (a ɛwɔ ntoma mmiɛnsa) anaa kotokuo a ɛho teɛ a ɛkorɔn fam. Twe ho firi afasuo a fɔkyee wɔ ho.',
    },
    signs_of_spoilage: {
      en: 'Green-yellow mould, a musty smell, or shrivelled discoloured kernels — this can mean aflatoxin. Discard immediately, do not eat or sell.',
      twi: 'Ntotoeɛ ahabammono-akokɔsradeɛ, hua bɔne, anaa aba a akusa na ne kɔla asesa — ebia aflatoxin. Tow gu ntɛm, nnidi anaa wontɔn.',
    },
    duration: {
      en: 'Properly dried nuts in PICS bags: up to 6–8 months without losing quality.',
      twi: 'Nkateɛ a awo yie wɔ PICS kotokuo mu: bosome 6–8 a ne su nsesa.',
    },
  },
  sweet_potato: {
    drying: {
      en: 'Do not wash before storing. Cure tubers for 4–7 days in a warm, well-ventilated, shaded spot to heal small cuts and toughen the skin.',
      twi: 'Nhohoro ho ansa na woasie. Fa nnafua 4–7 sie wɔ baabi a hyew kakra na mframa wɔ mu na hyiamu wɔ ho, ma akwaa nketewa ayɛ yie na honam no ayɛ den.',
    },
    storage: {
      en: 'Store cured tubers in a cool, dark, ventilated place — a shaded barn or box with dry sand/sawdust between layers works well.',
      twi: 'Fa bayerɛ a awo sie wɔ baabi a ɛyɛ nwunu, esum na mframa wɔ mu — baabi a hyiamu wɔ ho anaa adaka a anwea/dua mfutuma da ntam yɛ papa.',
    },
    signs_of_spoilage: {
      en: 'Soft watery patches, a sweet fermented smell, or visible mould mean spoilage has started — sort these out immediately.',
      twi: 'Baabi a ayɛ bɛtɛɛ a nsuo wɔ mu, hua a ɛte sɛ deɛ aporɔ, anaa ntotoeɛ a wohunu kyerɛ sɛ aporɔ afiri aseɛ — yi eyi firi mu ntɛm.',
    },
    duration: {
      en: 'Cured and stored well: 3–6 months. Uncured, uncovered tubers spoil within 1–2 weeks.',
      twi: 'Sɛ wowo yie na wosie yie: bosome 3–6. Deɛ wonwoo na enki no, ɛporɔ wɔ nnawɔtwe 1–2 mu.',
    },
  },
  chilli_pepper: {
    drying: {
      en: 'Pick ripe, undamaged pods and sun-dry whole on a raised mat or string them up, turning daily, until brittle.',
      twi: 'Te aba a abere yie a ɛho nyɛɛ dɛm na wo no nyinaa wɔ kɛtɛ a ɛkorɔn so anaa kyekyere no twa, dane no daa, kosi sɛ ɛbɛyɛ den.',
    },
    storage: {
      en: 'Store fully dried pods in an airtight container or sealed jar, away from sunlight and moisture.',
      twi: 'Fa aba a awo yie sie wɔ adaka anaa toa a wɔasɔ ano yie, twe ho firi owia ne fɔkyee ho.',
    },
    signs_of_spoilage: {
      en: 'White or grey mould spots, a musty smell, or pods that feel soft instead of brittle mean they have absorbed moisture and are spoiling.',
      twi: 'Ntotoeɛ fitaa anaa nsonso wɔ so, hua bɔne, anaa aba a ayɛ bɛtɛɛ sɛ deɛ ɛyɛ den kyerɛ sɛ fɔkyee akɔ mu na ɛreporɔ.',
    },
    duration: {
      en: 'Fully dried and sealed: 6–12 months. Loses potency and colour faster if exposed to light or air.',
      twi: 'Sɛ awo yie na wɔasɔ ano: bosome 6–12. Sɛ ɛkɔ hann anaa mframa mu a ne ahoɔden ne kɔla bɛsesa ntɛm.',
    },
  },
};
