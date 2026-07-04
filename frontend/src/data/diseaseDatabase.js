/**
 * Farm Doctor Ghana — Disease Database
 *
 * This is the offline-first knowledge base. It ships inside the app bundle and is
 * precached by the service worker, so the entire diagnosis flow works with zero
 * internet.
 *
 * STRUCTURE
 *  crops[]            — the 6 MVP crops (chilli, cassava, sweet potato, groundnut, ginger, cocoa)
 *    diseases[]       — diseases that affect that crop
 *      symptoms[]     — checklist questions the offline matcher scores against.
 *                       `weight` is how strongly a YES answer points at THIS disease
 *                       (0..1). `key` is shared across diseases so one answered
 *                       question can score several diseases at once.
 *      treatments[]   — what to buy and how to use it, in farmer language.
 *
 * ✅ TWI REVIEW: completed by a native Twi speaker in July 2026 (most strings
 *  confirmed). Strings written AFTER that review are listed in
 *  TWI_REVIEW_QUEUE.pending at the bottom of this file until signed off.
 *
 * Regions used in MVP: ashanti, greater_accra, western, volta, northern
 */

// Shared symptom checklist questions. Each disease references these by `key` and
// assigns its own weight. Keeping questions shared means one tap by the farmer
// can inform several candidate diseases.
export const SYMPTOM_QUESTIONS = {
  // Leaves
  yellow_leaves: {
    en: 'Are the leaves turning yellow?',
    twi: 'Nhaban no rebebro yɛ akokɔsradeɛ?',
  },
  leaf_spots_brown: {
    en: 'Are there brown or dark spots on the leaves?',
    twi: 'Nsisii tuntum anaa kɔkɔɔ wɔ nhaban no so?',
  },
  leaf_spots_target: {
    en: 'Do the spots have rings inside them, like a target?',
    twi: 'Nsisii no wɔ kanko mu te sɛ deɛ wɔaka ahyɛ mu?',
  },
  leaf_curling: {
    en: 'Are the leaves curling or twisting?',
    twi: 'Nhaban no rekuru anaa rekyinkyim?',
  },
  leaf_wilting: {
    en: 'Are the leaves wilting or drooping even when soil is wet?',
    twi: 'Nhaban no rewu anaa rebrɛ wɔ ɛberɛ a asaase no yɛ fɔkyee?',
  },
  yellow_halo: {
    en: 'Is there a yellow ring around the dark spots?',
    twi: 'Akokɔsradeɛ kanko atwa nsisii tuntum no ho ahyia?',
  },
  white_powder: {
    en: 'Is there a white or grey powder on the leaves?',
    twi: 'Mfutuma fitaa anaa nsonso wɔ nhaban no so?',
  },
  rust_pustules: {
    en: 'Are there orange or rusty-brown bumps under the leaves?',
    twi: 'Mpɔmpɔ a ɛyɛ akutu anaa nkannare kɔkɔɔ wɔ nhaban no ase?',
  },
  mosaic_pattern: {
    en: 'Do leaves show a patchy yellow-and-green mosaic pattern?',
    twi: 'Nhaban no kyerɛ akokɔsradeɛ ne ahabammono nsensaneɛ a ɛyɛ nsisii nsisii?',
  },
  leaf_narrow_distorted: {
    en: 'Are new leaves narrow, shrunken or misshapen?',
    twi: 'Nhaban foforɔ no yɛ teateaa, akɔ ase anaa ɛnyɛ sɛdeɛ ɛsɛ?',
  },
  // Fruit / pods / roots / stem
  fruit_sunken_spots: {
    en: 'Are there sunken dark spots on the fruit?',
    twi: 'Nsisii tuntum a akɔ mu wɔ aba no so?',
  },
  fruit_rotting: {
    en: 'Is the fruit rotting or developing soft patches?',
    twi: 'Aba no reporɔ anaa baabi ayɛ bɛtɛɛ?',
  },
  stem_streaks: {
    en: 'Are there brown streaks on the stem when you scratch it?',
    twi: 'Sɛ wotwitwa dua no a, ntwitwaeɛ kɔkɔɔ wɔ mu?',
  },
  root_tunnels: {
    en: 'When you cut a root/tuber, are there tunnels or holes inside?',
    twi: 'Sɛ wotwa ntini/bayerɛ no mu a, akwan anaa ntokuro wɔ mu?',
  },
  root_dark_rot: {
    en: 'Is the inside of the root dark, dry and rotted?',
    twi: 'Ntini no mu ayɛ tuntum, awo na aporɔ?',
  },
  small_insects: {
    en: 'Can you see small insects, weevils or grubs on the plant?',
    twi: 'Wohunu mmoawa nketewa, ntɛferɛ anaa asunson wɔ afifideɛ no so?',
  },
  mold_on_pods: {
    en: 'Is there greenish or yellow mould on the pods/nuts?',
    twi: 'Ntotoeɛ ahabammono anaa akokɔsradeɛ wɔ aba/nkateɛ no so?',
  },
  stunted_growth: {
    en: 'Is the whole plant stunted or growing poorly?',
    twi: 'Afifideɛ no nyinaa anyini yie anaa ɛrenyini?',
  },
  vein_yellowing: {
    en: 'Are the leaf veins turning yellow or clearing (going pale)?',
    twi: 'Nhaban no ntini no rebebro yɛ akokɔsradeɛ anaa ɛrehyerɛn?',
  },
  angular_lesions: {
    en: 'Are there angular, water-soaked patches that stop at the leaf veins?',
    twi: 'Nsisii a nsuo wɔ mu a ɛyɛ ntɔkwa na ɛgyae wɔ nhaban ntini ho?',
  },
  shoot_dieback: {
    en: 'Are the shoot tips or young branches dying back?',
    twi: 'Mman foforɔ no anaa ne mmaa no rewuwu?',
  },
  gum_oozing: {
    en: 'Is gum or sticky liquid oozing from the stem?',
    twi: 'Ahyehyɛdeɛ anaa nsuo a ɛyɛ taa firi dua no mu reba?',
  },
  webbing_mites: {
    en: 'Is there fine webbing or tiny moving dots under the leaves?',
    twi: 'Ntoma fitaa anaa nkakra nketewa a ɛkeka wɔ nhaban no ase?',
  },
  leaves_bunched: {
    en: 'Are leaves bunched, small and crowded at the shoot tips?',
    twi: 'Nhaban no aboaboa ano, yɛ nketewa na ahyia wɔ mman no atifi?',
  },
  // Ginger
  pseudostem_watersoaked: {
    en: 'Are there water-soaked patches at the base of the stems that turn brown?',
    twi: 'Nsuo wɔ mu nsisii wɔ dua no ase a ɛdane kɔkɔɔ?',
  },
  rhizome_soft_rot: {
    en: 'When you dig up the rhizome, is it soft, watery and bad-smelling?',
    twi: 'Sɛ wotu rhizome no a, ɛyɛ mmrɛ, nsuo wɔ mu na ɛbɔn?',
  },
  // Cocoa
  pod_black_patches: {
    en: 'Are there black, water-soaked patches spreading across the pod?',
    twi: 'Nsisii tuntum a nsuo wɔ mu trɛw fa aba no so?',
  },
  pod_mummified: {
    en: 'Have pods turned hard, black and shrivelled (mummified) on the tree?',
    twi: 'Aba no ayɛ den, tuntum na akusa wɔ dua so?',
  },
  red_vein_banding: {
    en: 'Do young leaves show red or purple banding along the veins?',
    twi: 'Nhaban foforɔ kyerɛ kɔkɔɔ anaa beredum nsensaneɛ wɔ ntini ho?',
  },
  capsid_lesions: {
    en: 'Are there dark sunken lesions on pods and young stems where insects have fed?',
    twi: 'Akwammoeɛ tuntum a akɔ mu wɔ aba ne mman foforɔ so baabi a mmoawa adidi?',
  },
  stem_borer_holes: {
    en: 'Are there small holes in the stem or branches with sawdust-like material around them?',
    twi: 'Ntokuro nketewa wɔ dua anaa mman so a dua mfutuma da ho?',
  },
};

// All 16 of Ghana's regions (post-2018 split). Disease content (symptoms,
// regional_prevalence, treatments) currently only covers the original 5 MVP
// regions — the rest are selectable so farmers everywhere can use diagnosis,
// shops and reports, but won't see a regional risk note or alert banner
// until that data is added. Degrades gracefully (lookups just return
// undefined), same pattern as everywhere else region data is optional.
export const REGIONS = {
  ashanti: { en: 'Ashanti', twi: 'Asante' },
  greater_accra: { en: 'Greater Accra', twi: 'Greater Accra' },
  western: { en: 'Western', twi: 'Atɔeɛ' },
  western_north: { en: 'Western North', twi: 'Western North' },
  central: { en: 'Central', twi: 'Central' },
  eastern: { en: 'Eastern', twi: 'Eastern' },
  volta: { en: 'Volta', twi: 'Volta' },
  oti: { en: 'Oti', twi: 'Oti' },
  northern: { en: 'Northern', twi: 'Atifi' },
  north_east: { en: 'North East', twi: 'North East' },
  savannah: { en: 'Savannah', twi: 'Savannah' },
  upper_east: { en: 'Upper East', twi: 'Upper East' },
  upper_west: { en: 'Upper West', twi: 'Upper West' },
  bono: { en: 'Bono', twi: 'Bono' },
  bono_east: { en: 'Bono East', twi: 'Bono East' },
  ahafo: { en: 'Ahafo', twi: 'Ahafo' },
};

export const CROPS = [
  {
    id: 'chilli_pepper',
    name: { en: 'Chilli Pepper', twi: 'Mako' },
    emoji: '🌶️',
    diseases: [
      {
        id: 'chilli_anthracnose',
        name: { en: 'Anthracnose', twi: 'Aba Porɔeɛ (Anthracnose)' },
        pathogen: 'Colletotrichum spp.',
        description: {
          en: 'A fungus that causes sunken dark spots on ripening fruit, rotting it before harvest.',
          twi: 'Honam bi a ɛma nsisii tuntum a akɔ mu ba aba a ɛrebere so, na ɛma ɛporɔ ansa na wɔatwa.',
        },
        symptoms: [
          { key: 'fruit_sunken_spots', weight: 1.0 },
          { key: 'fruit_rotting', weight: 0.8 },
          { key: 'leaf_spots_brown', weight: 0.4 },
          { key: 'yellow_halo', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'high', greater_accra: 'medium', western: 'high', volta: 'medium', northern: 'low',
        },
        seasonal_months: [6, 7, 8, 9, 10],
        peak_month: 8,
        sources: ['MOFA Crop Health Guidelines', 'PPRSD Pest Alerts — Capsicum Diseases'],
        treatments: [
          {
            id: 'chilli_anthracnose_copper',
            name: 'Copper Hydroxide (Kocide)',
            price_range: 'GHc 45–70',
            technical_instruction: 'Dilute per label (~1:100), spray 10L per hectare every 7 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix the powder into water until it looks like weak tea — not clear, not dark.',
                amount: 'Use one bottle cap of powder for one bucket of water.',
                application: 'Spray the fruit and leaves until water just begins to drip off them.',
                frequency: 'Spray once every week, and again after heavy rain.',
              },
              twi: {
                mixing: 'Fra mfutuma no ​nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den — ɛnyɛ kann, ɛnyɛ tuntum.',
                amount: 'Fa toa ano ​mfutuma baako gu bokiti nsuo baako mu.',
                application: 'Pete gu aba ne nhaban no so kosi sɛ nsuo no bɛfiri so atɔ fam.',
                frequency: 'Pete pɛnkoro dapɛn biara, na sane yɛ bio osutɔ akyi.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_anthracnose_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Dilute per label, spray every 7–10 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray all over the plant, especially the fruit, until leaves drip.',
                frequency: 'Every week. Stop 2 weeks before you harvest.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so, titiriw aba no, kosi sɛ nhaban no bɛsɔ.',
                frequency: 'Dapɛn biara. Gyae nnawɔtwe mmienu ansa na woatwa.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'chilli_bacterial_spot',
        name: { en: 'Bacterial Leaf Spot', twi: 'Nhaban Nsisii (Bacteria)' },
        pathogen: 'Xanthomonas spp.',
        description: {
          en: 'Bacteria causing dark, water-soaked spots with yellow halos on leaves; leaves drop early.',
          twi: 'Bacteria a ɛma nsisii tuntum a nsuo wɔ mu a akokɔsradeɛ atwa ho; nhaban no tɔ ntɛm.',
        },
        symptoms: [
          { key: 'leaf_spots_brown', weight: 0.8 },
          { key: 'yellow_halo', weight: 1.0 },
          { key: 'yellow_leaves', weight: 0.4 },
          { key: 'leaf_wilting', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'high', western: 'medium', volta: 'high', northern: 'medium',
        },
        seasonal_months: [4, 5, 6, 7, 8],
        peak_month: 6,
        sources: ['PPRSD Pest Alerts — Bacterial Diseases of Capsicum','MOFA Extension Training Materials'],
        treatments: [
          {
            id: 'chilli_bacterial_copper',
            name: 'Copper Hydroxide (Kocide)',
            price_range: 'GHc 45–70',
            technical_instruction: 'Copper-based bactericide, spray every 7 days at first sign.',
            farmer_instruction: {
              en: {
                mixing: 'Mix powder into water until it looks like weak tea.',
                amount: 'One bottle cap of powder per bucket of water.',
                application: 'Spray both the top and underside of leaves until they drip.',
                frequency: 'Once a week, starting as soon as you see the first spots.',
              },
              twi: {
                mixing: 'Fra mfutuma no nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma baako wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no atifi ne aseɛ nyinaa kosi sɛ ɛbɛsɔ.',
                frequency: 'Pɛnkoro dapɛn biara, firi ɛberɛ a wohunu nsisii a ɛdi kan no.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_bacterial_mancozeb_copper',
            name: 'Mancozeb + Copper Mix',
            price_range: 'GHc 50–80',
            technical_instruction: 'Combine Mancozeb and Copper Hydroxide for broader protection.',
            farmer_instruction: {
              en: {
                mixing: 'Mix one bottle cap of Mancozeb and one bottle cap of Copper powder together into a bucket of water.',
                amount: 'One bottle cap of each powder for one bucket of water.',
                application: 'Spray the whole plant, both sides of leaves, until they drip.',
                frequency: 'Every week. Best to start before the disease shows, when the rains begin.',
              },
              twi: {
                mixing: 'Fra toa ano mfutuma baako Mancozeb ne toa ano baako Copper bom gu bokiti nsuo mu.',
                amount: 'Toa ano mfutuma baako wɔ biara mu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so, nhaban no afa mmienu, kosi sɛ ɛbɛsɔ.',
                frequency: 'Dapɛn biara. Eye sɛ wofiri ansa na yadeɛ no bɛba, ɛberɛ a osu bɛfiri aseɛ.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_bacterial_remove',
            name: 'Remove Sick Leaves + Spacing (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Remove infected leaves, improve air circulation, avoid overhead watering.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed for this method.',
                amount: 'Pick off every leaf that has dark water-soaked spots and burn them.',
                application: 'Give plants more space so air flows through and leaves dry quickly after rain.',
                frequency: 'Check every few days and remove new spotted leaves quickly.',
              },
              twi: {
                mixing: 'Aduro nhia wɔ saa ɛkwan yi mu.',
                amount: 'Teɛ nhaban biara a nsisii tuntum a nsuo wɔ mu wɔ so na hye no.',
                application: 'Ma afifideɛ no ntam nna hɔ sɛdeɛ mframa bɛfa mu na nhaban no bɛwo ntɛm osu akyi.',
                frequency: 'Hwɛ nnafua kakra biara na yi nhaban foforɔ a nsisii wɔ so ntɛm.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'chilli_rust',
        name: { en: 'Pepper Rust', twi: 'Nkannare (Rust)' },
        pathogen: 'Puccinia spp.',
        description: {
          en: 'Orange-brown pustules on the underside of leaves; leaves yellow and fall.',
          twi: 'Mpɔmpɔ akutu-kɔkɔɔ wɔ nhaban no ase; nhaban no yɛ akokɔsradeɛ na ɛtɔ.',
        },
        symptoms: [
          { key: 'rust_pustules', weight: 1.0 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'leaf_spots_brown', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'medium', volta: 'medium', northern: 'high',
        },
        seasonal_months: [9, 10, 11, 12],
        peak_month: 11,
        sources: ['MOFA Crop Health Guidelines — Fungal Diseases','PPRSD Registered Pesticide List'],
        treatments: [
          {
            id: 'chilli_rust_sulfur',
            name: 'Wettable Sulfur',
            price_range: 'GHc 30–50',
            technical_instruction: 'Sulfur fungicide, spray every 7–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray under the leaves where the rusty bumps are, until they drip.',
                frequency: 'Every week while you still see the rusty bumps.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a mpɔmpɔ no wɔ no kosi sɛ ɛbɛsɔ.',
                frequency: 'Dapɛn biara mmerɛ a woda so hunu mpɔmpɔ no.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_rust_tebuconazole',
            name: 'Tebuconazole 250 EC',
            price_range: 'GHc 55–85',
            technical_instruction: 'Systemic fungicide, spray every 10–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Shake the bottle well. Mix until water is a very light tea colour.',
                amount: 'Half a bottle cap of liquid per bucket of water.',
                application: 'Spray the whole plant, top and bottom of leaves, until dripping.',
                frequency: 'Every 10 days. Stop 3 weeks before harvest.',
              },
              twi: {
                mixing: 'Woso toa no yie. Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a emu hare paa.',
                amount: 'Toa ano nsuo fa wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so, nhaban atifi ne ase, kosi sɛ ɛbɛsɔ.',
                frequency: 'Nnafua 10 biara. Gyae nnawɔtwe 3 ansa na woatwa.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_rust_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Protectant fungicide, spray every 7–10 days as preventive.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray the whole plant before rust appears, or at very first sign.',
                frequency: 'Every week during the rust season (September–December).',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so ansa na nkannare aba, anaa sɛ wofiri aseɛ hunu bi.',
                frequency: 'Dapɛn biara wɔ nkannare berɛ mu (September–December).',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'chilli_leaf_spot',
        name: { en: 'Cercospora Leaf Spot', twi: 'Nhaban Nsisii (Cercospora)' },
        pathogen: 'Cercospora capsici',
        description: {
          en: 'Round spots with pale grey centres and dark edges ("frog-eye"); badly hit leaves drop.',
          twi: 'Nsisii a ɛyɛ kurukuruwa a ne mfimfini yɛ nsonso na n\'ano yɛ tuntum; nhaban a ayare paa no tɔ.',
        },
        symptoms: [
          { key: 'leaf_spots_brown', weight: 0.8 },
          { key: 'leaf_spots_target', weight: 1.0 },
          { key: 'yellow_leaves', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'medium', western: 'high', volta: 'medium', northern: 'low',
        },
        seasonal_months: [5, 6, 7, 8, 9],
        peak_month: 7,
        sources: ['MOFA Directorate of Crop Services','PPRSD Pest Alerts — Cercospora'],
        treatments: [
          {
            id: 'chilli_leafspot_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Protectant fungicide, spray every 7–10 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray the whole plant, especially older leaves, until they drip.',
                frequency: 'Every week while new spots keep appearing.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so, titiriw nhaban dada no, kosi sɛ ɛbɛsɔ.',
                frequency: 'Dapɛn biara mmerɛ a nsisii foforɔ da so pue.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_leafspot_copper',
            name: 'Copper Hydroxide (Kocide)',
            price_range: 'GHc 45–70',
            technical_instruction: 'Copper fungicide, spray every 7 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix powder into water until it looks like weak tea.',
                amount: 'One bottle cap of powder per bucket of water.',
                application: 'Spray all the leaves, top and bottom, until dripping.',
                frequency: 'Once a week. Works best when you start early, before spots spread.',
              },
              twi: {
                mixing: 'Fra mfutuma no nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma baako wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no nyinaa so, atifi ne ase, kosi sɛ ɛbɛsɔ.',
                frequency: 'Pɛnkoro dapɛn biara. Eye sɛ wofiri aseɛ ntɛm, ansa na nsisii atrɛw.',
              },
            },
            video_url: null,
          },
          {
            id: 'chilli_leafspot_remove',
            name: 'Remove Spotted Leaves (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Remove and destroy affected leaves to reduce spore spread.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed.',
                amount: 'Pick off leaves that have the ring-shaped spots and burn them away from the farm.',
                application: 'Do not leave fallen spotted leaves on the ground — they spread the disease.',
                frequency: 'Check every few days and remove new spotted leaves.',
              },
              twi: {
                mixing: 'Aduro nhia.',
                amount: 'Teɛ nhaban a nsisii kurukuruwa wɔ so no na kɔhye no akyiri firi afuom.',
                application: 'Nnyaa nhaban a nsisii wɔ so wɔ fam — ɛtrɛw yadeɛ no.',
                frequency: 'Hwɛ nnafua kakra biara na yi nhaban foforɔ a nsisii wɔ so.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
  {
    id: 'cassava',
    name: { en: 'Cassava', twi: 'Bankye' },
    emoji: '🌿',
    diseases: [
      {
        id: 'cassava_brown_streak',
        name: { en: 'Cassava Brown Streak', twi: 'Bankye Ntwitwaeɛ Kɔkɔɔ' },
        pathogen: 'Cassava brown streak virus (CBSV)',
        description: {
          en: 'A virus spread by whiteflies. Brown streaks on stems and dark dry rot inside the tuber.',
          twi: 'Virus a nwansena fitaa de trɛ. Ntwitwaeɛ kɔkɔɔ wɔ dua no so na bayerɛ no mu aporɔ.',
        },
        symptoms: [
          { key: 'stem_streaks', weight: 1.0 },
          { key: 'root_dark_rot', weight: 0.9 },
          { key: 'leaf_spots_brown', weight: 0.4 },
          { key: 'yellow_leaves', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'medium', western: 'high', volta: 'high', northern: 'low',
        },
        seasonal_months: [1, 2, 3, 11, 12],
        peak_month: 2,
        sources: ['IITA Cassava Disease Fact Sheets','CSIR-SARI Annual Reports'],
        // Curated authoritative video(s). Add YouTube IDs to embed; others fall
        // back to a YouTube search. (F_LEL7G2SjA: "How to identify Cassava Brown Streak".)
        videos: ['F_LEL7G2SjA'],
        treatments: [
          {
            id: 'cassava_cbsd_rogue',
            name: 'Roguing + Clean Cuttings (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Remove infected plants; plant certified virus-free cuttings.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine to mix. This virus cannot be sprayed away.',
                amount: 'Pull out and burn every sick plant so it does not spread.',
                application: 'For next season, get clean cuttings from a trusted source, not from sick plants.',
                frequency: 'Check your farm every week and remove any new sick plants quickly.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ a wode bɛfra. Wontumi mpete nkum saa virus yi.',
                amount: 'Tu s​afifideɛ a ayare no nyinaa na hye no sɛdeɛ ɛrentrɛ.',
                application: 'Ɛberɛ a ɛreba no, fa bankye a ɛho teɛ firi baabi a wogye di, ɛnyɛ afifideɛ a ayare.',
                frequency: 'Hwɛ wo afuom dapɛn biara na yi afifideɛ foforɔ a ayare ntɛm.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cbsd_neem',
            name: 'Neem Seed Extract (whitefly control)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem extract repels whiteflies that spread the virus. Not a cure, but slows spread.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds and soak in a bucket of water overnight.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Strain the water through cloth and spray on both sides of leaves to chase away whiteflies.',
                frequency: 'Every 5 days during the season when whiteflies are many.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako na fa to bokiti nsuo mu nnera.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Sene nsuo no fa ntama mu na pete gu nhaban afa mmienu so na ɛbɛpam nwansena fitaa.',
                frequency: 'Nnafua 5 biara wɔ ɛberɛ a nwansena fitaa dɔɔso.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cbsd_early_harvest',
            name: 'Early Harvest (damage reduction)',
            price_range: 'Free',
            technical_instruction: 'Harvest at 9–10 months instead of 12+ to salvage tubers before rot worsens.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about timing your harvest.',
                amount: 'If you know the virus is in your field, do not wait the full 12 months.',
                application: 'Harvest at 9 to 10 months — the rot gets worse the longer you leave it.',
                frequency: 'Check tubers by cutting one open. If rot is starting, harvest everything now.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa wo twa berɛ ho.',
                amount: 'Sɛ wunim sɛ virus no wɔ wo afuom a, ntwɛn bosome 12 nyinaa.',
                application: 'Twa wɔ bosome 9 kosi 10 — porɔeɛ no yɛ den sɛ wogyaa no.',
                frequency: 'Hwɛ bayerɛ no mu fa biako twa mu. Sɛ porɔeɛ afiri aseɛ a, twa no nyinaa seisei.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cassava_mosaic',
        name: { en: 'Cassava Mosaic Disease', twi: 'Bankye Mosaic Yadeɛ' },
        pathogen: 'Cassava mosaic virus (CMV)',
        description: {
          en: 'A virus giving leaves a yellow-green patchy pattern; leaves shrink and the plant is stunted.',
          twi: 'Virus a ɛma nhaban yɛ akokɔsradeɛ-ahabammono nsisii; nhaban no kɔ ase na afifideɛ no nnyini.',
        },
        symptoms: [
          { key: 'mosaic_pattern', weight: 1.0 },
          { key: 'leaf_narrow_distorted', weight: 0.8 },
          { key: 'stunted_growth', weight: 0.7 },
          { key: 'yellow_leaves', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'high', greater_accra: 'high', western: 'high', volta: 'medium', northern: 'medium',
        },
        seasonal_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        peak_month: 5,
        sources: ['IITA CMD Management Guide','CSIR-SARI Extension Bulletins'],
        videos: ['Qqy9NYNqKTU'], // IITA: cassava mosaic & brown streak threat
        treatments: [
          {
            id: 'cassava_cmd_resistant',
            name: 'Resistant Varieties + Roguing (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Plant resistant varieties; remove infected plants.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine to mix for this disease.',
                amount: 'Pull out the worst-affected plants so whiteflies do not carry it to healthy ones.',
                application: 'Next season, plant improved varieties that resist mosaic (ask your extension officer).',
                frequency: 'Walk your farm weekly and remove badly affected plants.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ a wode bɛfra ma saa yadeɛ yi.',
                amount: 'Tu afifideɛ a ayare paa no na nwansena fitaa amfa ankɔ deɛ aho yɛ den so.',
                application: 'Ɛberɛ foforɔ no, dua bankye a wɔasiesie a ɛko tia mosaic (bisa wo extension officer).',
                frequency: 'Nantew wo afuom dapɛn biara na yi afifideɛ a ayare paa.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cmd_neem',
            name: 'Neem Spray (whitefly control)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem repels whiteflies that spread the virus. Reduces new infections.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds, soak in a bucket of water overnight, then strain.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Spray on the underside of leaves where whiteflies gather.',
                frequency: 'Every 5 days when you see many whiteflies.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako, fa to bokiti nsuo mu nnera, na sene no.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a nwansena fitaa hyia.',
                frequency: 'Nnafua 5 biara sɛ wohunu nwansena fitaa pii a.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cmd_intercrop',
            name: 'Intercropping with Maize (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Tall crops between cassava rows confuse whiteflies and reduce landing rates.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is a planting method.',
                amount: 'Plant rows of maize between your cassava rows.',
                application: 'The tall maize confuses the whiteflies so fewer land on your cassava.',
                frequency: 'Do this every season. You also get a maize harvest.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi yɛ adua ɛkwan bi.',
                amount: 'Dua aburo ntini wɔ wo bankye ntini ntam.',
                application: 'Aburo tenten no ma nwansena fitaa no yera kwan na kakra bi tena wo bankye so.',
                frequency: 'Yɛ eyi ɛberɛ biara. Wunya aburo nso ka ho.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cassava_bacterial_blight',
        name: { en: 'Cassava Bacterial Blight', twi: 'Bankye Bacteria Yadeɛ' },
        pathogen: 'Xanthomonas axonopodis pv. manihotis',
        description: {
          en: 'Bacteria causing angular water-soaked leaf spots, wilting, shoot dieback and gum on stems.',
          twi: 'Bacteria a ɛma nhaban nsisii a nsuo wɔ mu, nwuwuo, mman wuo ne ahyehyɛdeɛ wɔ dua so.',
        },
        symptoms: [
          { key: 'angular_lesions', weight: 1.0 },
          { key: 'leaf_wilting', weight: 0.7 },
          { key: 'shoot_dieback', weight: 0.6 },
          { key: 'gum_oozing', weight: 0.5 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'medium', volta: 'high', northern: 'medium',
        },
        seasonal_months: [4, 5, 6, 7, 8],
        peak_month: 6,
        sources: ['IITA Cassava Disease Fact Sheets','MOFA Extension Training Materials'],
        treatments: [
          {
            id: 'cassava_cbb_clean',
            name: 'Clean Cuttings + Field Hygiene (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Use disease-free cuttings, remove infected plants, rotate.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine to spray for this bacteria.',
                amount: 'Cut out and burn affected plants so it does not spread in the rain.',
                application: 'Plant only clean cuttings from healthy farms; do not take cuttings from sick plants.',
                frequency: 'Check weekly in the rainy season and remove sick plants early.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ a wode bɛpete saa bacteria yi.',
                amount: 'Twa afifideɛ a ayare no na hye no sɛdeɛ ɛrentrɛ wɔ osutɔ mu.',
                application: 'Dua bankye a ɛho teɛ firi afuom a apɔ; mfa bankye mfiri afifideɛ a ayare.',
                frequency: 'Hwɛ dapɛn biara wɔ osutɔ berɛ mu na yi afifideɛ a ayare ntɛm.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cbb_copper',
            name: 'Copper Hydroxide (preventive spray)',
            price_range: 'GHc 45–70',
            technical_instruction: 'Copper reduces bacterial spread on leaf surfaces. Not a cure, but slows it.',
            farmer_instruction: {
              en: {
                mixing: 'Mix powder into water until it looks like weak tea.',
                amount: 'One bottle cap of powder per bucket of water.',
                application: 'Spray the healthy plants around the sick ones to protect them.',
                frequency: 'Every week during the rainy season when the disease is spreading.',
              },
              twi: {
                mixing: 'Fra mfutuma no nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma baako wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ a ɛho yɛ den a ɛbɛn deɛ ayare no ho na wobɛbɔ ho ban.',
                frequency: 'Dapɛn biara wɔ osutɔ berɛ mu ɛberɛ a yadeɛ no retrɛw.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_cbb_rotation',
            name: 'Crop Rotation (prevention)',
            price_range: 'Free',
            technical_instruction: 'Rotate cassava with non-host crops for 1–2 seasons to break disease cycle.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is a farming method.',
                amount: 'After cassava, plant a different crop (groundnut, maize, or cowpea) for one season.',
                application: 'The bacteria dies in the soil when there is no cassava to live on.',
                frequency: 'Do not plant cassava in the same field two seasons in a row.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi yɛ afuo adwuma ɛkwan bi.',
                amount: 'Bankye akyi, dua afifideɛ foforɔ (nkateɛ, aburo, anaa adua) ɛberɛ baako.',
                application: 'Bacteria no wu wɔ asaase no mu sɛ bankye biara nni hɔ a ɛbɛtena so.',
                frequency: 'Nnua bankye wɔ afuo koro no so ɛberɛ mmienu a ɛdi nsɔ.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cassava_green_mite',
        name: { en: 'Cassava Green Mite', twi: 'Bankye Mmoawa Mono' },
        pathogen: 'Mononychellus tanajoa',
        description: {
          en: 'Tiny mites under leaves cause yellow speckling, bunched shoot tips and stunting in the dry season.',
          twi: 'Mmoawa nketewa a ɛwɔ nhaban ase ma akokɔsradeɛ nsisii, mman atifi boaboa ano ne anyiniabɔne wɔ ɔpɛ berɛ mu.',
        },
        symptoms: [
          { key: 'webbing_mites', weight: 1.0 },
          { key: 'leaves_bunched', weight: 0.8 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'stunted_growth', weight: 0.5 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'high', western: 'low', volta: 'medium', northern: 'high',
        },
        seasonal_months: [11, 12, 1, 2, 3],
        peak_month: 1,
        sources: ['IITA Biological Control Programme','CSIR-SARI Pest Management Reports'],
        treatments: [
          {
            id: 'cassava_mite_resistant',
            name: 'Tolerant Varieties + Mulching (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Plant tolerant varieties; mulch to keep soil moist; predators usually control it.',
            farmer_instruction: {
              en: {
                mixing: 'No spraying needed — natural predator insects usually clear the mites.',
                amount: 'Spread dry grass/leaves (mulch) around plants to hold moisture in the dry season.',
                application: 'Next season, plant tolerant varieties (ask your extension officer).',
                frequency: 'Water and mulch through the dry months; the plant recovers when rains return.',
              },
              twi: {
                mixing: 'Ɛho nhia sɛ wopete aduro — mmoawa a wɔdi mmoawa no usually sɛe wɔn.',
                amount: 'Trɛw ɛserɛ/nhaban a awo gu afifideɛ no ho na fɔkyee ntena ɔpɛ berɛ mu.',
                application: 'Berɛ foforɔ no, dua bankye a ɛtumi gyina mu (bisa extension officer).',
                frequency: 'Gugu nsuo na fa mulch ɔpɛ bosome mu; afifideɛ no ka ne ho sɛ osu ba.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_mite_neem',
            name: 'Neem Seed Extract (mite spray)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem oil/extract disrupts mite feeding. Safe alternative to synthetic acaricides.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds and soak overnight in a bucket of water. Strain through cloth.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Spray the underside of leaves early in the morning when mites are active.',
                frequency: 'Every 5 days during the dry season when mites are worst.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako na fa to bokiti nsuo mu nnera. Sene no fa ntama mu.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase anɔpa tutuutu ɛberɛ a mmoawa no yɛ adwuma.',
                frequency: 'Nnafua 5 biara wɔ ɔpɛ berɛ mu ɛberɛ a mmoawa no yɛ den.',
              },
            },
            video_url: null,
          },
          {
            id: 'cassava_mite_sulfur',
            name: 'Wettable Sulfur (acaricide)',
            price_range: 'GHc 30–50',
            technical_instruction: 'Sulfur kills mites on contact. Spray when infestation is heavy.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of sulfur powder per bucket of water.',
                application: 'Spray under the leaves where the webbing and tiny mites are.',
                frequency: 'Every week during heavy attack. Stop when you see new healthy leaves growing.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a ntoma fitaa ne mmoawa nketewa no wɔ.',
                frequency: 'Dapɛn biara ɛberɛ a ɛyɛ den. Gyae sɛ wohunu nhaban foforɔ a ɛho yɛ den refi.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
  {
    id: 'sweet_potato',
    name: { en: 'Sweet Potato', twi: 'Santom / Bayerɛ' },
    emoji: '🍠',
    diseases: [
      {
        id: 'sweetpotato_weevil',
        name: { en: 'Sweet Potato Weevil', twi: 'Santom Ntɛferɛ' },
        pathogen: 'Cylas spp.',
        description: {
          en: 'A small beetle whose grubs tunnel through tubers, leaving holes and a bitter smell.',
          twi: 'Mmoawa ketewa bi a ne mma tu akwan fa bayerɛ no mu, na ɛgya ntokuro ne hua bɔne.',
        },
        symptoms: [
          { key: 'root_tunnels', weight: 1.0 },
          { key: 'small_insects', weight: 0.8 },
          { key: 'stunted_growth', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'high', western: 'medium', volta: 'high', northern: 'high',
        },
        seasonal_months: [11, 12, 1, 2, 3],
        peak_month: 1,
        sources: ['CRI Root Crop Technical Bulletins','CSIR Root Crop Disease Guides'],
        treatments: [
          {
            id: 'sweetpotato_weevil_earthup',
            name: 'Earthing-up + Clean Vines (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Cover exposed tubers with soil; use weevil-free planting vines; rotate crops.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. The trick is to keep the weevils away from the tubers.',
                amount: 'Heap soil over any tuber you can see poking out of the ground.',
                application: 'Plant only clean vines, and do not plant sweet potato in the same spot two seasons running.',
                frequency: 'Earth-up every 2 weeks and harvest on time — do not leave mature tubers in the ground.',
              },
              twi: {
                mixing: 'Aduro nhia. Ɛkwan no ne sɛ wobɛma ntɛferɛ no ne bayerɛ no ntam akwan.',
                amount: 'Boa dɔteɛ gu bayerɛ biara a wohunu sɛ apue afiri fam.',
                application: 'Dua santom a ɛho teɛ nko, na nnua santom wɔ baabi koro mmerɛ mmienu.',
                frequency: 'Boa dɔteɛ no nnawɔtwe mmienu biara na twa no berɛ pa mu — nnyaa bayerɛ a abu wɔ fam.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_weevil_neem',
            name: 'Neem Seed Extract (weevil repellent)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem deters adult weevils from laying eggs near tubers.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds, soak in a bucket of water overnight, strain through cloth.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Pour the neem water around the base of the plants where tubers form.',
                frequency: 'Every week during the dry season when weevils are most active.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako, fa to bokiti nsuo mu nnera, sene no fa ntama mu.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Hwie neem nsuo no gu afifideɛ no ase ho baabi a bayerɛ no yɛ.',
                frequency: 'Dapɛn biara wɔ ɔpɛ berɛ mu ɛberɛ a ntɛferɛ yɛ adwuma paa.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_weevil_chlorpyrifos',
            name: 'Chlorpyrifos Dust (insecticide)',
            price_range: 'GHc 35–55',
            technical_instruction: 'Dust at base of plants and in planting holes. Kills weevil larvae in soil.',
            farmer_instruction: {
              en: {
                mixing: 'No mixing needed. This is a dry powder you sprinkle directly.',
                amount: 'A pinch (three-finger pinch) of powder at the base of each plant.',
                application: 'Sprinkle the powder around the base of the plant and on top of the soil mound.',
                frequency: 'Once when you earth-up, and once more 2 weeks later.',
              },
              twi: {
                mixing: 'Ɛho nhia sɛ wofra. Eyi yɛ mfutuma a wopete gu so tẽẽ.',
                amount: 'Nsatea nsa mmiensa so mfutuma wɔ afifideɛ biara ase.',
                application: 'Pete mfutuma no gu afifideɛ no ase ho ne dɔteɛ a woaboa no atifi.',
                frequency: 'Pɛnkoro sɛ woboa dɔteɛ, na bio nnawɔtwe mmienu akyiri.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'sweetpotato_leafspot',
        name: { en: 'Sweet Potato Leaf Spot', twi: 'Santom Nhaban Nsisii' },
        pathogen: 'Cercospora spp.',
        description: {
          en: 'Fungal spots on leaves reduce the plant\'s strength and lower tuber yield.',
          twi: 'Honam nsisii wɔ nhaban no so a ɛtew afifideɛ no ahooden so na ɛma bayerɛ no so dodow tew.',
        },
        symptoms: [
          { key: 'leaf_spots_brown', weight: 0.9 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'yellow_halo', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'medium', western: 'high', volta: 'medium', northern: 'low',
        },
        seasonal_months: [5, 6, 7, 8, 9],
        peak_month: 7,
        sources: ['CRI Root Crop Technical Bulletins','MOFA Crop Health Guidelines'],
        treatments: [
          {
            id: 'sweetpotato_leafspot_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Protectant fungicide, spray every 10–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray over the leaves until they drip, in the cool of morning or evening.',
                frequency: 'Every week to two weeks while spots are spreading.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no so kosi sɛ ɛbɛsɔ, anɔpa anaa anwummerɛ a ahuhuru nni hɔ.',
                frequency: 'Dapɛn baako kosi mmienu biara mmerɛ a nsisii no retrɛ.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_leafspot_copper',
            name: 'Copper Hydroxide (Kocide)',
            price_range: 'GHc 45–70',
            technical_instruction: 'Copper-based fungicide, spray every 7–10 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix powder into water until it looks like weak tea.',
                amount: 'One bottle cap of powder per bucket of water.',
                application: 'Spray the leaves top and bottom until dripping.',
                frequency: 'Every week, especially during the rainy season.',
              },
              twi: {
                mixing: 'Fra mfutuma no nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma baako wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no atifi ne ase kosi sɛ ɛbɛsɔ.',
                frequency: 'Dapɛn biara, titiriw osutɔ berɛ mu.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_leafspot_remove',
            name: 'Remove Sick Leaves + Spacing (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Remove infected leaves and improve plant spacing for air flow.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed.',
                amount: 'Pick off heavily spotted leaves and burn them away from the farm.',
                application: 'Give plants more space so air flows through and leaves dry quickly.',
                frequency: 'Check every few days and remove spotted leaves.',
              },
              twi: {
                mixing: 'Aduro nhia.',
                amount: 'Teɛ nhaban a nsisii pii wɔ so no na kɔhye no akyiri firi afuom.',
                application: 'Ma afifideɛ no ntam nna hɔ sɛdeɛ mframa bɛfa mu na nhaban bɛwo ntɛm.',
                frequency: 'Hwɛ nnafua kakra biara na yi nhaban a nsisii wɔ so.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'sweetpotato_virus',
        name: { en: 'Sweet Potato Virus Disease (SPVD)', twi: 'Santom Virus Yadeɛ' },
        pathogen: 'SPCSV + SPFMV (spread by whiteflies/aphids)',
        description: {
          en: 'Whitefly-spread viruses that yellow the veins, pucker and shrink leaves, and stunt the plant.',
          twi: 'Virus a nwansena fitaa de trɛ a ɛma ntini yɛ akokɔsradeɛ, nhaban kuru na afifideɛ no nnyini.',
        },
        symptoms: [
          { key: 'vein_yellowing', weight: 1.0 },
          { key: 'leaf_narrow_distorted', weight: 0.8 },
          { key: 'stunted_growth', weight: 0.7 },
          { key: 'mosaic_pattern', weight: 0.5 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'high', western: 'medium', volta: 'high', northern: 'medium',
        },
        seasonal_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        peak_month: 4,
        sources: ['CRI Root Crop Technical Bulletins','CSIR Seed Certification Programme'],
        treatments: [
          {
            id: 'sweetpotato_virus_clean',
            name: 'Clean Vines + Roguing (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Use virus-free vines; remove infected plants.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine to mix for this virus.',
                amount: 'Pull out and destroy badly affected plants so whiteflies do not spread it.',
                application: 'Plant only clean vines from a healthy field, not from sick-looking plants.',
                frequency: 'Walk the farm weekly and remove sick plants as soon as you see them.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ a wode bɛfra ma saa virus yi.',
                amount: 'Tu afifideɛ a ayare paa no na sɛe no sɛdeɛ nwansena fitaa amfa antrɛw.',
                application: 'Dua santom a ɛho teɛ firi afuo a apɔ mu, ɛnyɛ afifideɛ a ɛyare.',
                frequency: 'Nantew afuom dapɛn biara na yi afifideɛ a ayare ɛberɛ a wohunu.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_virus_neem',
            name: 'Neem Spray (whitefly/aphid control)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem repels the whiteflies and aphids that spread the virus.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds, soak in a bucket of water overnight, strain.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Spray under the leaves where whiteflies and aphids gather.',
                frequency: 'Every 5 days to keep the insects away and slow the virus.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako, fa to bokiti nsuo mu nnera, sene no.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a nwansena fitaa ne ntɛferɛ hyia.',
                frequency: 'Nnafua 5 biara na ɛbɛpam mmoawa no na abrɛ virus no ase.',
              },
            },
            video_url: null,
          },
          {
            id: 'sweetpotato_virus_resistant',
            name: 'Resistant Varieties (prevention)',
            price_range: 'Free – GHc 20',
            technical_instruction: 'Plant SPVD-tolerant varieties from certified sources.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about choosing the right variety.',
                amount: 'Ask your extension officer or seed supplier for virus-resistant sweet potato vines.',
                application: 'Replace sick vines with resistant ones. Some improved varieties also give better yield.',
                frequency: 'Every new planting season, use only clean, resistant vines.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa bankye suban pa a wobɛpaw ho.',
                amount: 'Bisa wo extension officer anaa aba tɔnfo ma santom a ɛko tia virus.',
                application: 'Sesa santom a ayare no ma deɛ ɛko tia. Bi nso ma aba pii.',
                frequency: 'Ɛberɛ foforɔ biara a wodua no, fa santom a ɛho teɛ a ɛko tia nko.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
  {
    id: 'groundnut',
    name: { en: 'Groundnut', twi: 'Nkateɛ' },
    emoji: '🥜',
    diseases: [
      {
        id: 'groundnut_leafspot',
        name: { en: 'Groundnut Leaf Spot (Early & Late)', twi: 'Nkateɛ Nhaban Nsisii' },
        pathogen: 'Cercospora / Cercosporidium',
        description: {
          en: 'Dark spots, sometimes with yellow halos, that defoliate the plant and cut pod yield.',
          twi: 'Nsisii tuntum, ɛtɔ da a akokɔsradeɛ atwa ho, a ɛma nhaban tɔ na aba no so dodow tew.',
        },
        symptoms: [
          { key: 'leaf_spots_brown', weight: 1.0 },
          { key: 'yellow_halo', weight: 0.6 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'leaf_spots_target', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'low', volta: 'medium', northern: 'high',
        },
        seasonal_months: [6, 7, 8, 9, 10],
        peak_month: 8,
        sources: ['SARI Groundnut Research Reports','ICRISAT Disease Management Guides'],
        treatments: [
          {
            id: 'groundnut_leafspot_chlorothalonil',
            name: 'Chlorothalonil / Mancozeb',
            price_range: 'GHc 40–65',
            technical_instruction: 'Protectant fungicide, spray every 14 days from 30 days after planting.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray the whole plant until the leaves drip.',
                frequency: 'Every 2 weeks, starting about one month after planting.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so kosi sɛ nhaban no bɛsɔ.',
                frequency: 'Nnawɔtwe mmienu biara, firi bɛyɛ bosome baako wɔ adua akyi.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_leafspot_tebuconazole',
            name: 'Tebuconazole 250 EC',
            price_range: 'GHc 55–85',
            technical_instruction: 'Systemic fungicide, spray every 14 days. Cures and protects.',
            farmer_instruction: {
              en: {
                mixing: 'Shake the bottle well. Mix until water is a very light tea colour.',
                amount: 'Half a bottle cap of liquid per bucket of water.',
                application: 'Spray the whole plant, especially the lower leaves where spots start.',
                frequency: 'Every 2 weeks. Stop 3 weeks before harvest.',
              },
              twi: {
                mixing: 'Woso toa no yie. Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a emu hare paa.',
                amount: 'Toa ano nsuo fa wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so, titiriw nhaban a ɛwɔ ase a nsisii firi hɔ.',
                frequency: 'Nnawɔtwe mmienu biara. Gyae nnawɔtwe 3 ansa na woatwa.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_leafspot_rotation',
            name: 'Crop Rotation + Resistant Varieties (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Rotate with cereals for 2 seasons; plant leaf-spot tolerant varieties.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This prevents the disease from building up in the soil.',
                amount: 'After groundnut, plant maize or sorghum for one or two seasons before groundnut again.',
                application: 'Ask your extension officer for groundnut varieties that resist leaf spot.',
                frequency: 'Do not grow groundnut on the same plot more than once every 3 seasons.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi bɔ yadeɛ no ho ban sɛ ɛrenhyɛ asaase no mu ma.',
                amount: 'Nkateɛ akyi, dua aburo anaa aburoo ɛberɛ baako anaa mmienu ansa na woasan adua nkateɛ.',
                application: 'Bisa wo extension officer ma nkateɛ suban a ɛko tia nhaban nsisii.',
                frequency: 'Nnua nkateɛ wɔ afuo koro no so mmerɛ a ɛboro pɛnkoro wɔ ɛberɛ 3 mu.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'groundnut_rust',
        name: { en: 'Groundnut Rust', twi: 'Nkateɛ Nkannare' },
        pathogen: 'Puccinia arachidis',
        description: {
          en: 'Orange-brown pustules on the underside of leaves; severe attacks shrivel the whole plant.',
          twi: 'Mpɔmpɔ akutu-kɔkɔɔ wɔ nhaban no ase; sɛ ɛyɛ den a afifideɛ no nyinaa kawee.',
        },
        symptoms: [
          { key: 'rust_pustules', weight: 1.0 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'leaf_spots_brown', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'low', greater_accra: 'low', western: 'low', volta: 'medium', northern: 'high',
        },
        seasonal_months: [8, 9, 10, 11],
        peak_month: 10,
        sources: ['SARI Groundnut Improvement Programme','ICRISAT West Africa Reports'],
        treatments: [
          {
            id: 'groundnut_rust_sulfur',
            name: 'Wettable Sulfur',
            price_range: 'GHc 30–50',
            technical_instruction: 'Spray at first pustules, repeat every 10–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray under the leaves where the rusty bumps are, until they drip.',
                frequency: 'Every week or two until the rust stops spreading.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a mpɔmpɔ no wɔ no kosi sɛ ɛbɛsɔ.',
                frequency: 'Dapɛn baako anaa mmienu biara kosi sɛ nkannare no bɛgyae trɛ.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_rust_tebuconazole',
            name: 'Tebuconazole 250 EC',
            price_range: 'GHc 55–85',
            technical_instruction: 'Systemic fungicide, curative and protective. Spray every 10–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Shake the bottle well. Mix until water is a very light tea colour.',
                amount: 'Half a bottle cap of liquid per bucket of water.',
                application: 'Spray the whole plant — top and bottom of leaves.',
                frequency: 'Every 10 days. Stop 3 weeks before harvest.',
              },
              twi: {
                mixing: 'Woso toa no yie. Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a emu hare paa.',
                amount: 'Toa ano nsuo fa wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so — nhaban atifi ne ase.',
                frequency: 'Nnafua 10 biara. Gyae nnawɔtwe 3 ansa na woatwa.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_rust_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Protectant fungicide, spray preventively every 10–14 days.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray all over the plant before rust appears, or at first sign.',
                frequency: 'Every 10 days during the rust season.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so ansa na nkannare aba, anaa sɛ wofiri aseɛ hunu bi.',
                frequency: 'Nnafua 10 biara wɔ nkannare berɛ mu.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'groundnut_aflatoxin',
        name: { en: 'Aflatoxin Contamination', twi: 'Aflatoxin (Nkateɛ Ntotoeɛ)' },
        pathogen: 'Aspergillus flavus',
        description: {
          en: 'A mould on poorly-dried nuts that produces a poison. Dangerous to eat or sell.',
          twi: 'Ntotoeɛ a ɛba nkateɛ a wɔanwowee yie so na ɛyɛ awuduro. Ɛyɛ hu sɛ wobedi anaa wobetɔn.',
        },
        symptoms: [
          { key: 'mold_on_pods', weight: 1.0 },
          { key: 'small_insects', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'medium', western: 'low', volta: 'medium', northern: 'high',
        },
        seasonal_months: [10, 11, 12, 1],
        peak_month: 11,
        sources: ['SARI Aflatoxin Research','ICRISAT Groundnut Research — Pre-harvest Management'],
        treatments: [
          {
            id: 'groundnut_aflatoxin_drying',
            name: 'Proper Drying & Storage (prevention)',
            price_range: 'Free',
            technical_instruction: 'No cure once contaminated. Prevent by drying nuts fast and storing dry.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine. Once the poison is there, the nuts must be thrown away.',
                amount: 'Dry the nuts fully in the sun on a raised mat until they crack cleanly.',
                application: 'Store dried nuts in clean, dry sacks off the ground, away from damp.',
                frequency: 'Check stored nuts every week. Throw away any with green-yellow mould.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ. Sɛ awuduro no ba a, ɛsɛ sɛ wotow nkateɛ no gu.',
                amount: 'Wowɔ nkateɛ no wɔ awia mu wɔ kɛtɛ a ɛkorɔn so kosi sɛ ɛbɛpae fann.',
                application: 'Fa nkateɛ a awo no sie wɔ kotokuo a ɛho teɛ a ɛnni fam, baabi a fɔkyee nni.',
                frequency: 'Hwɛ nkateɛ a woakora no dapɛn biara. Tow biara a ntotoeɛ ahabammono-akokɔsradeɛ wɔ so gu.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_aflatoxin_aflasafe',
            name: 'Aflasafe (biocontrol)',
            price_range: 'GHc 30–50',
            technical_instruction: 'Apply Aflasafe GH01/GH02 granules to soil 2–3 weeks before flowering. IITA product.',
            farmer_instruction: {
              en: {
                mixing: 'No mixing needed. Aflasafe comes as small grains you scatter on the soil.',
                amount: 'Scatter two handfuls of Aflasafe grains per row of groundnut plants.',
                application: 'Spread the grains on the soil between the rows about 2 weeks before flowering.',
                frequency: 'Once per season is enough. The good mould in the grains pushes out the bad one.',
              },
              twi: {
                mixing: 'Ɛho nhia sɛ wofra. Aflasafe ba sɛ aba nketewa a wopete gu asaase so.',
                amount: 'Pete nsatea mmienu Aflasafe aba wɔ nkateɛ ntini biara mu.',
                application: 'Trɛw aba no gu asaase so wɔ ntini no ntam bɛyɛ nnawɔtwe 2 ansa na ɛbɛfefew.',
                frequency: 'Pɛnkoro ɛberɛ biara yɛ. Ntotoeɛ pa a ɛwɔ aba no mu pam deɛ ɛyɛ bɔne no.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_aflatoxin_harvest_timing',
            name: 'Timely Harvest + Sorting (prevention)',
            price_range: 'Free',
            technical_instruction: 'Harvest at maturity, dry within 48 hours, sort and discard damaged pods.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. Timing and sorting are key.',
                amount: 'Harvest as soon as the pods are mature — do not leave them in wet ground.',
                application: 'Dry within 2 days of harvest. Sort out any cracked, discoloured, or insect-damaged pods.',
                frequency: 'Sort again before selling or eating. Throw away any pod that smells bad or has mould.',
              },
              twi: {
                mixing: 'Aduro nhia. Ɛberɛ pa mu twa ne paw yɛ adeɛ titiriw.',
                amount: 'Twa sɛ aba no abu — nnyaa no wɔ asaase fɔkyee so.',
                application: 'Wowɔ no wɔ nnafua 2 mu wɔ twa akyi. Yi biara a apae, ne kɔkɔɔ asakyera, anaa mmoawa adi.',
                frequency: 'San paw bio ansa na wobɛtɔn anaa woadi. Tow biara a ɛbɔn anaa ntotoeɛ wɔ so gu.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'groundnut_rosette',
        name: { en: 'Groundnut Rosette', twi: 'Nkateɛ Rosette Yadeɛ' },
        pathogen: 'Groundnut rosette virus (spread by aphids)',
        description: {
          en: 'Aphid-spread virus: leaves go yellow and bunched, plants are badly stunted, pods fail to fill.',
          twi: 'Virus a ntɛferɛ de trɛ: nhaban yɛ akokɔsradeɛ na ɛboaboa ano, afifideɛ no nnyini, aba no nyɛ.',
        },
        symptoms: [
          { key: 'yellow_leaves', weight: 0.8 },
          { key: 'leaves_bunched', weight: 1.0 },
          { key: 'stunted_growth', weight: 0.9 },
          { key: 'leaf_narrow_distorted', weight: 0.5 },
        ],
        regional_prevalence: {
          ashanti: 'low', greater_accra: 'low', western: 'low', volta: 'medium', northern: 'high',
        },
        seasonal_months: [6, 7, 8, 9, 10],
        peak_month: 8,
        sources: ['SARI Groundnut Research Reports','ICRISAT Rosette Virus Studies'],
        treatments: [
          {
            id: 'groundnut_rosette_dense',
            name: 'Early + Dense Planting + Roguing (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Plant early and densely to deter aphids; remove infected plants.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine to mix; the trick is to keep aphids from spreading it.',
                amount: 'Plant early in the season and space plants close together so aphids settle less.',
                application: 'Pull out and bury any bunched, stunted plants as soon as you see them.',
                frequency: 'Check weekly for the first 6 weeks after planting — that is when it spreads most.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ a wode bɛfra; ɛkwan no ne sɛ wobɛsiw ntɛferɛ kwan.',
                amount: 'Dua ntɛm wɔ berɛ no mu na ma afifideɛ no mmɛn ho sɛdeɛ ntɛferɛ ntena so.',
                application: 'Tu afifideɛ a aboaboa ano na anyini no na sie no ɛberɛ a wohunu.',
                frequency: 'Hwɛ dapɛn biara wɔ nnawɔtwe 6 a ɛdi kan akyi — saa berɛ no na ɛtrɛw kɛse.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_rosette_neem',
            name: 'Neem Spray (aphid control)',
            price_range: 'GHc 20–40',
            technical_instruction: 'Neem repels the aphids that spread rosette virus.',
            farmer_instruction: {
              en: {
                mixing: 'Crush a handful of neem seeds, soak in a bucket of water overnight, strain through cloth.',
                amount: 'One handful of crushed neem seeds per bucket of water.',
                application: 'Spray under the leaves where aphids cluster, especially on young plants.',
                frequency: 'Every 5 days for the first 6 weeks after planting when aphids are worst.',
              },
              twi: {
                mixing: 'Dwira neem aba nsatea biako, fa to bokiti nsuo mu nnera, sene no fa ntama mu.',
                amount: 'Nsatea biako neem aba a adwira wɔ bokiti nsuo baako mu.',
                application: 'Pete gu nhaban no ase baabi a ntɛferɛ hyia, titiriw afifideɛ nkumaa so.',
                frequency: 'Nnafua 5 biara wɔ nnawɔtwe 6 a ɛdi kan adua akyi ɛberɛ a ntɛferɛ yɛ den.',
              },
            },
            video_url: null,
          },
          {
            id: 'groundnut_rosette_resistant',
            name: 'Resistant Varieties (prevention)',
            price_range: 'Free – GHc 20',
            technical_instruction: 'Plant rosette-resistant varieties from SARI or certified seed suppliers.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. Choose the right groundnut variety.',
                amount: 'Ask your extension officer or SARI for rosette-resistant groundnut seed.',
                application: 'Resistant varieties still grow and yield even when aphids visit.',
                frequency: 'Use resistant seed every season, especially in Northern Region where rosette hits hardest.',
              },
              twi: {
                mixing: 'Aduro nhia. Paw nkateɛ suban pa.',
                amount: 'Bisa wo extension officer anaa SARI ma nkateɛ aba a ɛko tia rosette.',
                application: 'Suban a ɛko tia no da so nyin na ɛma aba sɛ ntɛferɛ ba mpo.',
                frequency: 'Fa aba a ɛko tia no di dwuma ɛberɛ biara, titiriw Northern Region baabi a rosette yɛ den.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
  {
    id: 'ginger',
    name: { en: 'Ginger', twi: 'Kakaduro' },
    emoji: '🫚',
    diseases: [
      {
        id: 'ginger_soft_rot',
        name: { en: 'Bacterial Soft Rot', twi: 'Kakaduro Mmrɛ Porɔeɛ' },
        pathogen: 'Pythium spp. / Ralstonia spp.',
        description: {
          en: 'A fast-moving rot that turns the rhizome soft, watery and foul-smelling; stems yellow and collapse.',
          twi: 'Porɔeɛ a ɛyɛ ntɛm a ɛma rhizome no yɛ mmrɛ, nsuo wɔ mu na ɛbɔn; dua no yɛ akokɔsradeɛ na ɛhwe.',
        },
        symptoms: [
          { key: 'rhizome_soft_rot', weight: 1.0 },
          { key: 'pseudostem_watersoaked', weight: 0.7 },
          { key: 'leaf_wilting', weight: 0.6 },
          { key: 'yellow_leaves', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'low', volta: 'high', northern: 'low',
        },
        seasonal_months: [5, 6, 7, 8, 9],
        peak_month: 7,
        sources: ['MOFA Crop Health Guidelines — Ginger', 'CSIR-CRI Root & Tuber Disease Reports'],
        treatments: [
          {
            id: 'ginger_softrot_drainage',
            name: 'Drainage + Field Sanitation (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure once rotting starts. Improve drainage, remove and burn infected plants, avoid waterlogging.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This disease spreads fastest where water sits.',
                amount: 'Dig small channels so rain water drains away from the ginger beds.',
                application: 'Pull out and burn any plant with soft, smelly rhizomes — do not compost it.',
                frequency: 'Check after every heavy rain and remove sick plants immediately.',
              },
              twi: {
                mixing: 'Aduro nhia. Saa yadeɛ yi trɛw ntɛm baabi a nsuo gyina.',
                amount: 'Tu akwan nketewa ma osu nsuo nya kwan firi kakaduro mfuo no mu.',
                application: 'Tu afifideɛ a rhizome no yɛ mmrɛ na ɛbɔn na hye no — mfa nyɛ compost.',
                frequency: 'Hwɛ osutɔ kɛseɛ biara akyi na yi afifideɛ a ayare ntɛm.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_softrot_clean_seed',
            name: 'Clean Seed Rhizomes (prevention)',
            price_range: 'Free – GHc 20',
            technical_instruction: 'Plant only disease-free rhizomes from a trusted source; treat seed rhizomes with hot water or copper before planting.',
            farmer_instruction: {
              en: {
                mixing: 'Mix one bottle cap of copper powder into a bucket of water.',
                amount: 'Dip seed rhizomes in the copper water for a few minutes before planting.',
                application: 'Let the rhizomes dry in shade before putting them in the ground.',
                frequency: 'Do this once, just before every new planting.',
              },
              twi: {
                mixing: 'Fra toa ano copper mfutuma baako gu bokiti nsuo mu.',
                amount: 'Fa rhizome no nyɛ ho wɔ copper nsuo no mu simma kakra ansa na woadua.',
                application: 'Ma rhizome no wo wɔ nwunu mu ansa na wode gu fam.',
                frequency: 'Yɛ eyi pɛnkoro, ansa na woadua foforɔ biara.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_softrot_rotation',
            name: 'Crop Rotation (prevention)',
            price_range: 'Free',
            technical_instruction: 'Rotate ginger with cereals for 2–3 seasons to reduce soil-borne pathogen build-up.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is a planting method.',
                amount: 'After ginger, plant maize or another cereal on that land for 2–3 seasons.',
                application: 'Do not replant ginger on the same plot right away.',
                frequency: 'Follow this rotation every cycle, especially on land that has had rot before.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi yɛ adua ɛkwan bi.',
                amount: 'Kakaduro akyi, dua aburo wɔ asaase no so ɛberɛ 2–3.',
                application: 'Nnua kakaduro wɔ asaase koro no so ntɛm ara.',
                frequency: 'Di saa ɛkwan yi akyi ɛberɛ biara, titiriw asaase a porɔeɛ aba so dada.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'ginger_bacterial_wilt',
        name: { en: 'Bacterial Wilt', twi: 'Kakaduro Nwuwuo (Bacteria)' },
        pathogen: 'Ralstonia solanacearum',
        description: {
          en: 'Bacteria blocking the stem\'s water vessels; lower leaves yellow and wilt even with wet soil, and the rhizome shows brown discolouration.',
          twi: 'Bacteria a ɛsi nsuo akwan wɔ dua mu; nhaban a ɛwɔ ase yɛ akokɔsradeɛ na ɛhwe wɔ ɛberɛ a asaase yɛ fɔkyee, na rhizome no sesa kɔ kɔkɔɔ mu.',
        },
        symptoms: [
          { key: 'leaf_wilting', weight: 1.0 },
          { key: 'pseudostem_watersoaked', weight: 0.6 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'stunted_growth', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'medium', volta: 'high', northern: 'low',
        },
        seasonal_months: [4, 5, 6, 7],
        peak_month: 6,
        sources: ['CSIR-CRI Root & Tuber Disease Reports', 'MOFA Extension Training Materials'],
        treatments: [
          {
            id: 'ginger_wilt_rogue',
            name: 'Roguing + Clean Tools (cultural control)',
            price_range: 'Free',
            technical_instruction: 'No chemical cure. Remove infected plants immediately; disinfect cutlasses between plants.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. Clean your cutlass with fire or bleach between plants.',
                amount: 'Pull out and burn every wilted plant as soon as you see it.',
                application: 'Wash tools after touching a sick plant before touching a healthy one.',
                frequency: 'Check the field every few days during the wet season.',
              },
              twi: {
                mixing: 'Aduro nhia. Fa ogya anaa bleach hohoro wo sekan ho ɛberɛ a wode afifideɛ biara di dwuma.',
                amount: 'Tu afifideɛ biara a ahwe na hye no ɛberɛ a wohunu.',
                application: 'Hohoro wo nnwuma akode wɔ deɛ ɛkaa afifideɛ a ayare akyi ansa na woaka deɛ ɛho yɛ den.',
                frequency: 'Hwɛ afuom no nnafua kakra biara wɔ osutɔ berɛ mu.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_wilt_clean_seed',
            name: 'Clean Seed Rhizomes (prevention)',
            price_range: 'Free – GHc 20',
            technical_instruction: 'Use certified disease-free seed rhizomes; avoid planting material from wilted fields.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about choosing healthy planting material.',
                amount: 'Get seed rhizomes from a farm that has never had wilting.',
                application: 'Inspect every rhizome before planting and discard any with brown rings inside.',
                frequency: 'Every planting season.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa adua mu nneɛma pa a wobɛpaw ho.',
                amount: 'Nya rhizome firi afuo a wuwuo mmaa hɔ da.',
                application: 'Hwɛ rhizome biara ansa na woadua na tow biara a kanko kɔkɔɔ wɔ mu gu.',
                frequency: 'Adua berɛ biara.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_wilt_rotation',
            name: 'Crop Rotation + Drainage (prevention)',
            price_range: 'Free',
            technical_instruction: 'Rotate with non-host crops for 3+ seasons; avoid waterlogged fields.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is a farming method.',
                amount: 'Do not plant ginger on the same land for at least 3 seasons after wilt appears.',
                application: 'Choose well-drained land, not low areas where water collects.',
                frequency: 'Plan your rotation every season.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi yɛ afuo adwuma ɛkwan bi.',
                amount: 'Nnua kakaduro wɔ asaase koro no so kɔsi ɛberɛ 3 akyi sɛ nwuwuo aba.',
                application: 'Paw asaase a nsuo nnyina so, ɛnyɛ baabi a nsuo boa so.',
                frequency: 'Hyehyɛ wo adua nhyehyɛeɛ ɛberɛ biara.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'ginger_rhizome_rot',
        name: { en: 'Fusarium Rhizome Rot', twi: 'Kakaduro Rhizome Porɔeɛ' },
        pathogen: 'Fusarium oxysporum',
        description: {
          en: 'A dry rot that darkens and shrinks the rhizome in storage or in the field; plants yellow and stunt.',
          twi: 'Porɔeɛ a ɛyɛ wo a ɛma rhizome no yɛ tuntum na ɛkusa wɔ store mu anaa afuom; afifideɛ no yɛ akokɔsradeɛ na ɛnnyini.',
        },
        symptoms: [
          { key: 'root_dark_rot', weight: 1.0 },
          { key: 'yellow_leaves', weight: 0.5 },
          { key: 'stunted_growth', weight: 0.5 },
          { key: 'leaf_wilting', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'low', volta: 'medium', northern: 'low',
        },
        seasonal_months: [10, 11, 12, 1],
        peak_month: 12,
        sources: ['CSIR-CRI Root & Tuber Disease Reports', 'MOFA Crop Health Guidelines — Ginger'],
        treatments: [
          {
            id: 'ginger_rhizomerot_dryingstore',
            name: 'Proper Curing + Storage (prevention)',
            price_range: 'Free',
            technical_instruction: 'Cure harvested rhizomes in shade for 2–3 days before storing; store in a cool, dry, ventilated place.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about handling after harvest.',
                amount: 'Let rhizomes dry in the shade for 2–3 days before bagging them.',
                application: 'Store in a cool, airy place, not in a sealed sack on bare ground.',
                frequency: 'Check stored rhizomes every week and remove any going soft or dark.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa sɛdeɛ wobɛhwɛ no wɔ otwa akyi.',
                amount: 'Ma rhizome no wo wɔ nwunu mu nnafua 2–3 ansa na woakora.',
                application: 'Kora wɔ baabi a mframa wɔ mu na ɛyɛ nwunu, ɛnyɛ kotokuo a wɔasɔ ano wɔ fam.',
                frequency: 'Hwɛ deɛ woakora no dapɛn biara na yi biara a ɛreyɛ mmrɛ anaa atuntum.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_rhizomerot_copper',
            name: 'Copper Hydroxide Seed Treatment',
            price_range: 'GHc 45–70',
            technical_instruction: 'Dip seed rhizomes in copper solution before planting to reduce Fusarium load.',
            farmer_instruction: {
              en: {
                mixing: 'Mix one bottle cap of copper powder into a bucket of water.',
                amount: 'Dip rhizome pieces in the mixture for a few minutes.',
                application: 'Dry in shade before planting.',
                frequency: 'Once, just before planting.',
              },
              twi: {
                mixing: 'Fra toa ano copper mfutuma baako gu bokiti nsuo mu.',
                amount: 'Fa rhizome asinasin nyɛ ho wɔ mu simma kakra.',
                application: 'Ma ɛwo wɔ nwunu mu ansa na woadua.',
                frequency: 'Pɛnkoro, ansa na woadua.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_rhizomerot_rotation',
            name: 'Crop Rotation (prevention)',
            price_range: 'Free',
            technical_instruction: 'Rotate with cereals for 2–3 seasons; avoid reusing infected fields.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed.',
                amount: 'Plant maize or another cereal on the land for 2–3 seasons after rot appears.',
                application: 'Avoid replanting ginger on the same spot right away.',
                frequency: 'Every rotation cycle.',
              },
              twi: {
                mixing: 'Aduro nhia.',
                amount: 'Dua aburo wɔ asaase no so ɛberɛ 2–3 sɛ porɔeɛ aba akyi.',
                application: 'Ntɛm nnua kakaduro wɔ baabi koro no.',
                frequency: 'Ɛberɛ biara a wobɛsesa adua.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'ginger_leaf_spot',
        name: { en: 'Ginger Leaf Spot', twi: 'Kakaduro Nhaban Nsisii' },
        pathogen: 'Phyllosticta zingiberi',
        description: {
          en: 'Small water-soaked spots that enlarge into white-centred lesions with brown borders, weakening the plant.',
          twi: 'Nsisii nketewa a nsuo wɔ mu a ɛyɛ kɛse kɔyɛ akwammoeɛ a emu yɛ fitaa a kɔkɔɔ atwa ho, a ɛma afifideɛ no ahoɔden tew.',
        },
        symptoms: [
          { key: 'leaf_spots_brown', weight: 0.8 },
          { key: 'leaf_spots_target', weight: 0.6 },
          { key: 'yellow_leaves', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'low', greater_accra: 'low', western: 'low', volta: 'medium', northern: 'low',
        },
        seasonal_months: [6, 7, 8, 9],
        peak_month: 8,
        sources: ['MOFA Crop Health Guidelines — Ginger', 'CSIR-CRI Annual Reports'],
        treatments: [
          {
            id: 'ginger_leafspot_mancozeb',
            name: 'Mancozeb 80% WP',
            price_range: 'GHc 40–60',
            technical_instruction: 'Protectant fungicide, spray every 10–14 days during wet season.',
            farmer_instruction: {
              en: {
                mixing: 'Mix until the water looks like weak tea.',
                amount: 'Two bottle caps of powder per bucket of water.',
                application: 'Spray the whole plant until leaves drip.',
                frequency: 'Every 10–14 days while spots keep appearing.',
              },
              twi: {
                mixing: 'Fra no kosi sɛ nsuo no bɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Toa ano mfutuma mmienu wɔ bokiti nsuo baako mu.',
                application: 'Pete gu afifideɛ no nyinaa so kosi sɛ nhaban no bɛsɔ.',
                frequency: 'Nnafua 10–14 biara mmerɛ a nsisii foforɔ da so pue.',
              },
            },
            video_url: null,
          },
          {
            id: 'ginger_leafspot_remove',
            name: 'Remove Spotted Leaves (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Remove and destroy heavily spotted leaves to slow spread.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed.',
                amount: 'Pick off leaves with many spots and burn them away from the farm.',
                application: 'Improve spacing so air can dry the leaves after rain.',
                frequency: 'Check every few days during the rainy season.',
              },
              twi: {
                mixing: 'Aduro nhia.',
                amount: 'Teɛ nhaban a nsisii pii wɔ so na kɔhye no akyiri firi afuom.',
                application: 'Ma afifideɛ no ntam nna hɔ sɛdeɛ mframa bɛwo nhaban no osu akyi.',
                frequency: 'Hwɛ nnafua kakra biara wɔ osutɔ berɛ mu.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
  {
    id: 'cocoa',
    name: { en: 'Cocoa', twi: 'Kokoɔ' },
    emoji: '🍫',
    diseases: [
      {
        id: 'cocoa_black_pod',
        name: { en: 'Black Pod Disease', twi: 'Kokoɔ Aba Tuntum Yadeɛ' },
        pathogen: 'Phytophthora palmivora / P. megakarya',
        description: {
          en: 'A fungus causing black, water-soaked patches on pods that spread fast in wet weather, rotting the beans inside.',
          twi: 'Honam bi a ɛma aba no so nsisii tuntum a nsuo wɔ mu a ɛtrɛw ntɛm wɔ osutɔ berɛ mu, na ɛma aba no mu porɔ.',
        },
        symptoms: [
          { key: 'pod_black_patches', weight: 1.0 },
          { key: 'fruit_rotting', weight: 0.7 },
          { key: 'mold_on_pods', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'high', greater_accra: 'low', western: 'high', volta: 'medium', northern: 'low',
        },
        seasonal_months: [5, 6, 7, 8, 9, 10],
        peak_month: 7,
        sources: ['COCOBOD/CRIG Black Pod Management Guide', 'MOFA Crop Health Guidelines — Cocoa'],
        treatments: [
          {
            id: 'cocoa_blackpod_copper',
            name: 'Copper Fungicide (Kocide / Fungikill)',
            price_range: 'GHc 50–80',
            technical_instruction: 'Spray copper-based fungicide every 3–4 weeks through the rainy season, per CRIG calendar.',
            farmer_instruction: {
              en: {
                mixing: 'Mix the powder into water until it looks like weak tea.',
                amount: 'Follow the bottle/sachet measure for one knapsack sprayer (15L).',
                application: 'Spray all pods and the lower canopy until they are well covered.',
                frequency: 'Every 3–4 weeks during the rainy season, starting when pods are small.',
              },
              twi: {
                mixing: 'Fra mfutuma no nsuo mu kosi sɛ ɛbɛyɛ sɛ tii a ɛnyɛ den.',
                amount: 'Di sɛdeɛ wɔakyerɛ wɔ toa/sache so ma sprayer (15L) baako.',
                application: 'Pete gu aba no nyinaa ne nnua no ase fa so kosi sɛ ɛbɛsɔ yie.',
                frequency: 'Nnawɔtwe 3–4 biara wɔ osutɔ berɛ mu, firi ɛberɛ a aba no sua.',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_blackpod_sanitation',
            name: 'Remove Diseased Pods (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Harvest and destroy infected pods weekly (CPS — capsid/black pod sanitation); break shade to reduce humidity.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed for this step.',
                amount: 'Cut off every black pod, even small ones, and bury or burn them away from the trees.',
                application: 'Prune overhanging branches so more air and light reach the pods.',
                frequency: 'Walk the farm and remove black pods every week during the rains.',
              },
              twi: {
                mixing: 'Aduro nhia wɔ saa ɛkwan yi mu.',
                amount: 'Twa aba tuntum biara, mpo nketewa, na sie anaa hye no akyiri firi nnua no.',
                application: 'Twitwa mman a ɛkata so sɛdeɛ mframa ne hann bɛduru aba no so.',
                frequency: 'Nantew afuom na yi aba tuntum nnawɔtwe biara wɔ osutɔ berɛ mu.',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_blackpod_drainage',
            name: 'Drainage + Spacing (prevention)',
            price_range: 'Free',
            technical_instruction: 'Improve field drainage and canopy spacing to reduce the humid conditions the fungus needs.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about farm conditions.',
                amount: 'Clear small channels so rain water does not sit between the trees.',
                application: 'Thin out very dense shade trees to let the farm dry faster after rain.',
                frequency: 'Check drainage at the start of every rainy season.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa afuom tebea ho.',
                amount: 'Yi akwan nketewa ma osu nsuo nnyina nnua no ntam.',
                application: 'Yi nnua a ɛkata kɛse no bi sɛdeɛ afuom no bɛwo ntɛm osu akyi.',
                frequency: 'Hwɛ akwan no ɛberɛ biara a osutɔ berɛ rebɛfiri aseɛ.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cocoa_swollen_shoot',
        name: { en: 'Cocoa Swollen Shoot Virus (CSSV)', twi: 'Kokoɔ Mman Hono Virus' },
        pathogen: 'Cacao swollen shoot virus (spread by mealybugs)',
        description: {
          en: 'A mealybug-spread virus causing red vein-banding on young leaves, swollen shoots/roots, and a slow decline that kills the tree within a few years.',
          twi: 'Virus a mmoawa nketewa de trɛ a ɛma nhaban foforɔ kɔkɔɔ nsensaneɛ, mman/ntini hono, na ɛkum dua no nkakrankakra wɔ mfeɛ kakra mu.',
        },
        symptoms: [
          { key: 'red_vein_banding', weight: 1.0 },
          { key: 'leaves_bunched', weight: 0.5 },
          { key: 'stunted_growth', weight: 0.6 },
          { key: 'yellow_leaves', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'high', greater_accra: 'low', western: 'medium', volta: 'low', northern: 'low',
        },
        seasonal_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        peak_month: 3,
        sources: ['COCOBOD/CRIG CSSV Containment Programme', 'MOFA Crop Health Guidelines — Cocoa'],
        treatments: [
          {
            id: 'cocoa_cssv_remove',
            name: 'Remove & Replace Infected Trees (mandatory containment)',
            price_range: 'Free (government cutting-out exercise)',
            technical_instruction: 'No cure exists. Report to COCOBOD/CRIG; infected and ring of surrounding trees are cut out and replaced with resistant hybrids.',
            farmer_instruction: {
              en: {
                mixing: 'There is no medicine for this virus. It cannot be sprayed away.',
                amount: 'Report any tree with red vein-banding or swollen shoots to your COCOBOD extension officer.',
                application: 'Allow the cutting-out team to remove the sick tree and the ones close to it.',
                frequency: 'Walk your farm monthly looking for the red banding on young leaves.',
              },
              twi: {
                mixing: 'Aduro biara nni hɔ ma saa virus yi. Wontumi mpete nkum no.',
                amount: 'Ka dua biara a kɔkɔɔ nsensaneɛ anaa mman hono wɔ so kyerɛ wo COCOBOD extension officer.',
                application: 'Ma wɔn a wɔbɛtwa no tu dua a ayare ne deɛ ɛbɛn no.',
                frequency: 'Nantew wo afuom bosome biara hwɛ nhaban foforɔ no kɔkɔɔ nsensaneɛ.',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_cssv_mealybug',
            name: 'Mealybug Control (slows spread)',
            price_range: 'GHc 60–100',
            technical_instruction: 'Systemic insecticide on nursery/young trees can reduce mealybug vectors, though it does not cure infected trees.',
            farmer_instruction: {
              en: {
                mixing: 'Follow the label measure for one knapsack sprayer.',
                amount: 'Mix as directed on the insecticide label.',
                application: 'Spray young trees and nursery seedlings where small white insects cluster on shoots.',
                frequency: 'As advised by your extension officer, usually every few weeks in the nursery.',
              },
              twi: {
                mixing: 'Di sɛdeɛ wɔakyerɛ wɔ label so ma sprayer baako.',
                amount: 'Fra sɛdeɛ wɔakyerɛ wɔ aduro label so.',
                application: 'Pete gu nnua nkumaa ne nursery aba so baabi a mmoawa fitaa nketewa hyia wɔ mman so.',
                frequency: 'Sɛdeɛ wo extension officer akyerɛ, mpɛn pii nnawɔtwe kakra biara wɔ nursery mu.',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_cssv_resistant',
            name: 'Plant CRIG-Resistant Hybrid Seedlings',
            price_range: 'Free – GHc 5 per seedling (COCOBOD subsidy)',
            technical_instruction: 'Replant cut-out areas with CSSV-tolerant hybrid varieties from CRIG/COCOBOD nurseries.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This is about choosing the right seedlings.',
                amount: 'Collect free or subsidised hybrid seedlings from your COCOBOD district office.',
                application: 'Plant them in the cut-out areas once the land has been cleared.',
                frequency: 'Whenever you replant after a cutting-out exercise.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi fa aba pa a wobɛpaw ho.',
                amount: 'Kɔfa hybrid aba a ɛyɛ free anaa subsidy firi wo COCOBOD district office.',
                application: 'Dua wɔ baabi a wɔatwa no sɛ wɔate asaase no.',
                frequency: 'Ɛberɛ biara a wobɛsan adua wɔ twa akyi.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cocoa_capsid',
        name: { en: 'Capsid (Mirid) Damage', twi: 'Kokoɔ Capsid Mmoawa' },
        pathogen: 'Sahlbergella singularis / Distantiella theobroma',
        description: {
          en: 'Sap-sucking bugs that leave dark sunken lesions on pods and young stems; heavy attacks cause dieback and let fungi enter.',
          twi: 'Mmoawa a wɔnom dua no nsuo a ɛgya akwammoeɛ tuntum a akɔ mu wɔ aba ne mman foforɔ so; sɛ ɛyɛ den a mman wuwu na ɛma ntotoeɛ kɔ mu.',
        },
        symptoms: [
          { key: 'capsid_lesions', weight: 1.0 },
          { key: 'shoot_dieback', weight: 0.6 },
          { key: 'small_insects', weight: 0.4 },
        ],
        regional_prevalence: {
          ashanti: 'high', greater_accra: 'low', western: 'high', volta: 'medium', northern: 'low',
        },
        seasonal_months: [11, 12, 1, 2, 3],
        peak_month: 1,
        sources: ['COCOBOD/CRIG Capsid Management Guide', 'MOFA Crop Health Guidelines — Cocoa'],
        treatments: [
          {
            id: 'cocoa_capsid_spray',
            name: 'COCOBOD-Approved Insecticide (e.g. Confidor, Actara)',
            price_range: 'GHc 40–70',
            technical_instruction: 'Apply approved capsid insecticide as part of the mass cocoa spraying programme, twice in the dry season.',
            farmer_instruction: {
              en: {
                mixing: 'Mix as directed on the insecticide sachet/bottle label.',
                amount: 'Follow the measure for one knapsack sprayer (15L).',
                application: 'Spray the trunk, branches and pods, focusing where dark lesions appear.',
                frequency: 'Twice during the dry season (November–February) as advised by your spraying gang.',
              },
              twi: {
                mixing: 'Fra sɛdeɛ wɔakyerɛ wɔ sache/toa label so.',
                amount: 'Di sɛdeɛ wɔakyerɛ ma sprayer (15L) baako.',
                application: 'Pete gu dua no ho, mman ne aba so, titiriw baabi a akwammoeɛ tuntum wɔ.',
                frequency: 'Mprenu wɔ ɔpɛ berɛ mu (November–February) sɛdeɛ wo spraying gang akyerɛ.',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_capsid_shade',
            name: 'Shade Management (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Capsids prefer sunny, poorly-shaded farms; maintaining moderate shade reduces populations.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed. This changes the farm conditions capsids like.',
                amount: 'Keep some shade trees rather than clearing the farm completely open.',
                application: 'Avoid heavy pruning that lets too much direct sun onto the cocoa canopy.',
                frequency: 'Manage shade levels every dry season.',
              },
              twi: {
                mixing: 'Aduro nhia. Eyi sesa afuom tebea a capsid pɛ.',
                amount: 'Gyaa nnua a ɛkata bi sɛn deɛ wobɛyi afuom no nyinaa fi hɔ koraa.',
                application: 'Nyi mman pii sɛdeɛ owia bɛduru kokoɔ no so tẽẽ.',
                frequency: 'Hwɛ shade tebea ɔpɛ berɛ biara.',
              },
            },
            video_url: null,
          },
        ],
      },
      {
        id: 'cocoa_stem_borer',
        name: { en: 'Cocoa Stem Borer', twi: 'Kokoɔ Dua Mu Mmoawa' },
        pathogen: 'Eulophonotus myrmeleon (and related borers)',
        description: {
          en: 'Larvae that tunnel inside trunks and branches, leaving holes with sawdust-like frass; weakens the tree and can kill branches.',
          twi: 'Mmoawa mma a wotu akwan wɔ dua mu ne mman mu, na ɛgya ntokuro a dua mfutuma da ho; ɛma dua no ahoɔden tew na ɛtumi kum mman.',
        },
        symptoms: [
          { key: 'stem_borer_holes', weight: 1.0 },
          { key: 'shoot_dieback', weight: 0.6 },
          { key: 'stunted_growth', weight: 0.3 },
        ],
        regional_prevalence: {
          ashanti: 'medium', greater_accra: 'low', western: 'medium', volta: 'low', northern: 'low',
        },
        seasonal_months: [2, 3, 4, 5],
        peak_month: 4,
        sources: ['COCOBOD/CRIG Pest Management Guide', 'MOFA Crop Health Guidelines — Cocoa'],
        treatments: [
          {
            id: 'cocoa_borer_prune',
            name: 'Prune & Burn Infested Branches (cultural control)',
            price_range: 'Free',
            technical_instruction: 'Cut out and burn branches with borer holes before adults emerge to spread further.',
            farmer_instruction: {
              en: {
                mixing: 'No medicine needed for this step.',
                amount: 'Cut off any branch with a borer hole well below the damaged part.',
                application: 'Burn the cut branches away from the farm so the larvae inside cannot survive.',
                frequency: 'Check trees every 2 weeks during the borer season (February–May).',
              },
              twi: {
                mixing: 'Aduro nhia wɔ saa ɛkwan yi mu.',
                amount: 'Twa man biara a ntokuro wɔ so wɔ baabi a ɛkɔ aseɛ sen baabi a adam no wɔ.',
                application: 'Hye mman a watwa no akyiri firi afuom sɛdeɛ mmoawa a ɛwɔ mu no renya nkwa.',
                frequency: 'Hwɛ nnua no nnawɔtwe mmienu biara wɔ borer berɛ mu (February–May).',
              },
            },
            video_url: null,
          },
          {
            id: 'cocoa_borer_insecticide',
            name: 'COCOBOD-Approved Insecticide Injection/Spray',
            price_range: 'GHc 50–80',
            technical_instruction: 'Apply approved systemic insecticide to trunk holes or as cover spray during heavy infestation.',
            farmer_instruction: {
              en: {
                mixing: 'Mix as directed on the insecticide label.',
                amount: 'Follow the measure for one knapsack sprayer, or inject directly into fresh holes if advised by your officer.',
                application: 'Apply to the trunk and branches where holes and frass are visible.',
                frequency: 'As advised by your extension officer when infestation is heavy.',
              },
              twi: {
                mixing: 'Fra sɛdeɛ wɔakyerɛ wɔ aduro label so.',
                amount: 'Di sɛdeɛ wɔakyerɛ ma sprayer baako, anaa hyɛ tẽẽ wɔ ntokuro foforɔ mu sɛ wo officer kyerɛ.',
                application: 'Fa gu dua no ho ne mman so baabi a ntokuro ne mfutuma wɔ.',
                frequency: 'Sɛdeɛ wo extension officer akyerɛ ɛberɛ a ɛyɛ den.',
              },
            },
            video_url: null,
          },
        ],
      },
    ],
  },
];

// Flat lookups for the matcher and UI.
export const ALL_DISEASES = CROPS.flatMap((crop) =>
  crop.diseases.map((d) => ({ ...d, cropId: crop.id, cropName: crop.name }))
);

export function getCrop(cropId) {
  return CROPS.find((c) => c.id === cropId) || null;
}

export function getDisease(diseaseId) {
  return ALL_DISEASES.find((d) => d.id === diseaseId) || null;
}

/** Map a free-text crop name (e.g. from Claude Vision) to one of our crop ids. */
export function matchCropByName(name) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  for (const c of CROPS) {
    const cn = c.name.en.toLowerCase();
    if (cn === n || cn.includes(n) || n.includes(cn)) return c.id;
  }
  for (const c of CROPS) {
    if (c.name.en.toLowerCase().split(/\s+/).some((w) => w.length > 3 && n.includes(w))) return c.id;
  }
  return null;
}

/**
 * Map a free-text disease name (e.g. from Claude Vision) to one of THIS crop's
 * disease ids, so an AI recheck can reuse our structured treatments/suppliers.
 * Returns the id or null when nothing matches confidently.
 */
export function matchDiseaseByName(cropId, name) {
  const crop = getCrop(cropId);
  if (!crop || !name) return null;
  const n = name.toLowerCase().trim();

  // 1. Whole-name containment either direction (handles "anthracnose" ⊂ "Anthracnose").
  for (const d of crop.diseases) {
    const dn = d.name.en.toLowerCase();
    if (dn === n || dn.includes(n) || n.includes(dn)) return d.id;
  }
  // 2. Significant-word overlap (e.g. "brown streak virus" → "Cassava Brown Streak").
  const words = n.split(/\s+/).filter((w) => w.length > 3);
  for (const d of crop.diseases) {
    const dn = d.name.en.toLowerCase();
    if (words.some((w) => dn.includes(w))) return d.id;
  }
  return null;
}

// Questions relevant to a given crop (union of its diseases' symptom keys),
// preserving SYMPTOM_QUESTIONS order for a stable checklist.
export function getQuestionsForCrop(cropId) {
  const crop = getCrop(cropId);
  if (!crop) return [];
  const keys = new Set();
  crop.diseases.forEach((d) => d.symptoms.forEach((s) => keys.add(s.key)));
  return Object.keys(SYMPTOM_QUESTIONS)
    .filter((k) => keys.has(k))
    .map((k) => ({ key: k, ...SYMPTOM_QUESTIONS[k] }));
}

/**
 * Twi review tracker. The July 2026 native-speaker review covered the disease
 * database and app UI strings that existed at the time; anything added after
 * that review goes in `pending` until it's signed off too.
 */
export const TWI_REVIEW_QUEUE = {
  status: 'REVIEWED — native Twi speaker review completed July 2026 (most strings confirmed)',
  scope: 'All twi/*_twi fields in SYMPTOM_QUESTIONS, CROPS[].diseases[].name/description, and treatments[].farmer_instruction.twi',
  pending: [
    'i18n.jsx: farmsize_title / farmsize_subtitle / farmsize_buckets_unit / farmsize_estimate_hint (rewritten 2026-07-02 for the hybrid farm-size picker)',
    'farmSize.js: purchaseNote() "Deɛ wobɛtɔ…" totals and MATERIAL_TWI words (new 2026-07-02)',
  ],
};
