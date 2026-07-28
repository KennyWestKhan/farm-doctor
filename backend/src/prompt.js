/**
 * Claude Vision system prompt for Ghana crop disease diagnosis.
 *
 * Critical design: the model is constrained to OUR disease catalog (IDs + visual
 * fingerprints). Free-form plant-pathology answers were mapping poorly through
 * fuzzy string matching and were wrong most of the time in field tests.
 *
 * Keep this catalog in sync with frontend/src/data/diseaseDatabase.js.
 */

/** Visual fingerprints the model must look for. IDs must match the frontend DB. */
export const DISEASE_CATALOG = {
  chilli_pepper: {
    label: 'Chilli Pepper',
    diseases: [
      {
        id: 'chilli_anthracnose',
        name: 'Anthracnose',
        look_for:
          'Sunken dark/black spots on ripening fruit (often with concentric rings); fruit soft-rotting. Fruit symptoms dominate over leaf.',
      },
      {
        id: 'chilli_bacterial_spot',
        name: 'Bacterial Leaf Spot',
        look_for:
          'Dark water-soaked spots on LEAVES with yellow halos; leaves yellowing or dropping. Fruit usually not the main symptom.',
      },
      {
        id: 'chilli_rust',
        name: 'Pepper Rust',
        look_for:
          'Orange-brown powdery pustules on the UNDERSIDE of leaves; upper surface yellowing. Not sunken fruit spots.',
      },
      {
        id: 'chilli_leaf_spot',
        name: 'Cercospora Leaf Spot',
        look_for:
          'Round "frog-eye" leaf spots: pale grey/white centres with dark brown borders. Target-like rings on leaves.',
      },
    ],
  },
  cassava: {
    label: 'Cassava',
    diseases: [
      {
        id: 'cassava_brown_streak',
        name: 'Cassava Brown Streak',
        look_for:
          'Brown streaks on green stems; chlorotic/yellow leaf patches; dry dark rot INSIDE tuber if cut open. Stem streaks are the key outdoor clue.',
      },
      {
        id: 'cassava_mosaic',
        name: 'Cassava Mosaic Disease',
        look_for:
          'Yellow-green mosaic / patchy mottling across the leaf blade; leaves narrow, twisted, or distorted; plant stunted. No stem streaks.',
      },
      {
        id: 'cassava_bacterial_blight',
        name: 'Cassava Bacterial Blight',
        look_for:
          'Angular water-soaked leaf lesions along veins; wilting; shoot tip dieback; sticky gum on stems.',
      },
      {
        id: 'cassava_green_mite',
        name: 'Cassava Green Mite',
        look_for:
          'Yellow speckled leaves; bunched/"candle" shoot tips; fine webbing or tiny mites under leaves. Dry-season look.',
      },
    ],
  },
  sweet_potato: {
    label: 'Sweet Potato',
    diseases: [
      {
        id: 'sweetpotato_weevil',
        name: 'Sweet Potato Weevil',
        look_for:
          'Holes/tunnels in tubers or vines; small dark beetles; bitter-smelling damaged roots. Damage is on the storage root.',
      },
      {
        id: 'sweetpotato_leafspot',
        name: 'Sweet Potato Leaf Spot',
        look_for:
          'Brown circular spots on leaves, sometimes with yellow halo. Plant otherwise not severely distorted.',
      },
      {
        id: 'sweetpotato_virus',
        name: 'Sweet Potato Virus Disease (SPVD)',
        look_for:
          'Yellow vein banding; leaves narrow, puckered, or feathery; strong stunting and mosaic. Whole plant looks diseased.',
      },
    ],
  },
  groundnut: {
    label: 'Groundnut',
    diseases: [
      {
        id: 'groundnut_leafspot',
        name: 'Groundnut Leaf Spot',
        look_for:
          'Dark brown/black circular spots on leaves, often with yellow halo; heavy defoliation. Spots are on the upper leaf surface.',
      },
      {
        id: 'groundnut_rust',
        name: 'Groundnut Rust',
        look_for:
          'Orange-brown pustules on the UNDERSIDE of leaflets; leaves may look rusty when flipped. Not circular dark spots alone.',
      },
      {
        id: 'groundnut_aflatoxin',
        name: 'Aflatoxin Contamination',
        look_for:
          'Green/yellow mould on pods or kernels after poor drying. Only diagnose if mould on pods/nuts is clearly visible.',
      },
      {
        id: 'groundnut_rosette',
        name: 'Groundnut Rosette',
        look_for:
          'Severely stunted bushy plants; yellow or mottled leaves bunched at the top ("rosette"). Whole plant is dwarfed.',
      },
    ],
  },
  ginger: {
    label: 'Ginger',
    diseases: [
      {
        id: 'ginger_soft_rot',
        name: 'Bacterial Soft Rot',
        look_for:
          'Soft, watery, foul-smelling rhizome; water-soaked pseudostem base; sudden collapse. Wet soft rot, not dry.',
      },
      {
        id: 'ginger_bacterial_wilt',
        name: 'Bacterial Wilt',
        look_for:
          'Leaves wilt even when soil is wet; lower leaves yellow first; cut stem may show brown vascular staining. Rhizome not yet mushy.',
      },
      {
        id: 'ginger_rhizome_rot',
        name: 'Fusarium Rhizome Rot',
        look_for:
          'Dry, dark, shrivelled rhizome rot (not watery); yellowing and stunting. Dry rot vs soft watery rot.',
      },
      {
        id: 'ginger_leaf_spot',
        name: 'Ginger Leaf Spot',
        look_for:
          'Leaf lesions with pale/white centres and brown borders. Rhizome and stem look healthy.',
      },
    ],
  },
  cocoa: {
    label: 'Cocoa',
    diseases: [
      {
        id: 'cocoa_black_pod',
        name: 'Black Pod Disease',
        look_for:
          'Black or dark brown water-soaked patches spreading on the POD surface; white mould in wet weather; beans rotting inside.',
      },
      {
        id: 'cocoa_swollen_shoot',
        name: 'Cocoa Swollen Shoot Virus (CSSV)',
        look_for:
          'Red vein-banding on young leaves; swollen shoots/roots; chronic decline. Leaf pattern, not black pods.',
      },
      {
        id: 'cocoa_capsid',
        name: 'Capsid (Mirid) Damage',
        look_for:
          'Dark sunken lesions on pods and young stems from sap-sucking bugs; shoot dieback. Lesions look like puncture damage, not fungal blotches.',
      },
      {
        id: 'cocoa_stem_borer',
        name: 'Cocoa Stem Borer',
        look_for:
          'Holes in trunk/branches with sawdust-like frass; dieback of bored branches. Stem damage, not pod blackening.',
      },
    ],
  },
};

const ALLOWED_CROPS = Object.keys(DISEASE_CATALOG);

function formatCatalog(cropFilter) {
  const entries = cropFilter
    ? [[cropFilter, DISEASE_CATALOG[cropFilter]]].filter(([, v]) => v)
    : Object.entries(DISEASE_CATALOG);

  return entries
    .map(([cropId, crop]) => {
      const lines = crop.diseases
        .map(
          (d) =>
            `  - id: "${d.id}"\n    name: ${d.name}\n    look_for: ${d.look_for}`
        )
        .join('\n');
      return `Crop id "${cropId}" (${crop.label}):\n${lines}`;
    })
    .join('\n\n');
}

/**
 * Build the system prompt.
 *
 * cropId is a SOFT prior (farmer guess), not a hard lock. Farmers misname crops
 * and sometimes don't know the English name. Always identify the plant from the
 * photo; if the farmer's pick disagrees, diagnose the crop you see and set
 * crop_mismatch true so the UI can offer a correction.
 *
 * Pass null when the farmer tapped "Not sure — detect from photo".
 */
export function buildVisionPrompt(cropId) {
  const farmerCrop = cropId && DISEASE_CATALOG[cropId] ? cropId : null;
  // Always send the full catalog so a wrong farmer pick can be overridden.
  const catalog = formatCatalog(null);

  const cropRule = farmerCrop
    ? `The farmer THINKS this is crop_id "${farmerCrop}" (${DISEASE_CATALOG[farmerCrop].label}).
Treat that as a hint only.
1. First identify crop_id from what is VISIBLE (one of the 6 allowed crops).
2. Diagnose disease_id from THAT crop's disease list (not the farmer's guess).
3. If your crop_id differs from the farmer's guess, set crop_mismatch to true.
4. If the plant could plausibly be the farmer's crop, prefer the farmer's crop
   when evidence is weak — only override when the plant is clearly different.`
    : `The farmer did not name the crop. Identify crop_id from the photo
as exactly one of: ${ALLOWED_CROPS.map((c) => `"${c}"`).join(', ')}.
Set crop_mismatch to false.
If the plant is clearly NOT one of the allowed crops, set confidence to 0
and explain in feedback_if_unclear.`;

  return `You are a plant pathologist diagnosing diseases on Ghanaian smallholder farms.

The photo may be blurry, low-resolution, badly lit, or angled — shot on a 5–10 year
old Android phone. Still try, but never invent symptoms you cannot see.

${cropRule}

ALLOWED CROPS AND DISEASES (disease_id MUST be an exact id from this list, or null):

${catalog}

Decision rules:
1. Identify the crop from the plant morphology in the photo first.
2. Then match VISIBLE symptoms to that crop's "look_for" fingerprints.
3. If two diseases are plausible, pick the better visual match and set confidence
   below 0.7.
4. If the photo shows a healthy plant, or symptoms don't match any disease,
   set disease_id to null and confidence to 0.
5. Never invent a disease outside the catalog.
6. symptoms_observed = only what you see (short phrase).
7. If confidence < 0.7, put concrete photo advice in feedback_if_unclear
   (closer, better light, show underside of leaf, show fruit/pod/stem).

Respond with ONLY valid JSON, no markdown:
{
  "crop_id": "cassava",
  "disease_id": "cassava_mosaic",
  "disease": "Cassava Mosaic Disease",
  "confidence": 0.82,
  "crop_mismatch": false,
  "symptoms_observed": "Yellow-green mosaic mottling; leaves narrow and twisted",
  "high_quality_image": false,
  "feedback_if_unclear": ""
}`;
}

/** @deprecated Prefer buildVisionPrompt(cropId). Kept for any old imports. */
export const VISION_SYSTEM_PROMPT = buildVisionPrompt(null);
