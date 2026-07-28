# Disease reference photo attributions

Enabled disease reference photos and their sources. CC0 images need no
attribution; CC BY / BY-SA images must keep the credit below (and in
`frontend/src/data/photos.js` → `DISEASE_PHOTO_CREDITS`).

| File | Disease | Source / Author | License |
|------|---------|-----------------|---------|
| `cocoa_black_pod.jpg` | Cocoa black pod (Phytophthora) | Scot Nelson, via Wikimedia Commons | CC0 / Public Domain |
| `cassava_brown_streak.jpg` | Cassava brown streak disease | Phillip Abidrabo, via Wikimedia Commons | CC BY-SA 3.0 |

Source pages:
- Cocoa black pod: https://commons.wikimedia.org/wiki/File:Cacao_black_pod_rot_38577373995.jpg
- Cassava brown streak: https://commons.wikimedia.org/wiki/File:Distribution_of_cassava_brown_streak_disease_(CBSD)_symptoms_on_cassava.JPG

Images are resized/recompressed for mobile (~800px, <120 KB). CC BY-SA images
remain under CC BY-SA — the licence applies to the image, not the app code.

## Adding more

Best source for the rest is the team's own field photos from Ghana (real local
cases, no licensing questions, more credible to judges). Drop a file named
`<diseaseId>.jpg` here and enable its id in `photos.js` → `AVAILABLE_DISEASE_PHOTOS`.
The 23 disease ids are listed there. Keep files small (<120 KB, ~800px). If using
web images, use only CC0/CC-BY sources and add a row above.
