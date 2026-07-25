# Disease reference photos

Drop licensed close-up photos of each disease here, named by **disease id**:

    public/photos/diseases/<diseaseId>.jpg   e.g. cocoa_black_pod.jpg

Then enable the id in `frontend/src/data/photos.js` → `AVAILABLE_DISEASE_PHOTOS`.

These show on the disease info page and diagnosis results so a farmer can
visually compare their leaf with a known example — often enough to identify a
disease without using the AI (saving a Vision call).

Keep files small (<120 KB, ~800px wide) for cheap phones. Use only licensed /
CC0 images (PlantVillage CC0, Wikimedia Commons, or your own field photos) and
note the source beside the id in photos.js.

The 23 disease ids are listed (commented) in AVAILABLE_DISEASE_PHOTOS.
