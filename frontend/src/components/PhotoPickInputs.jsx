/**
 * Dual file inputs for phone vs laptop photo pick.
 *
 * On Android/iOS, `capture="environment"` forces the camera and blocks the
 * gallery. Laptop browsers ignore `capture` and open a file picker either way.
 * So we keep two hidden inputs:
 *   - camera: capture → take a new shot
 *   - gallery: no capture → upload an existing photo
 */
import { useRef } from 'react';

export default function PhotoPickInputs({ onFile, cameraRef, galleryRef }) {
  const localCamera = useRef(null);
  const localGallery = useRef(null);
  const cam = cameraRef || localCamera;
  const gal = galleryRef || localGallery;

  const handle = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFile(file);
  };

  return (
    <>
      <input
        ref={cam}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handle}
      />
      <input
        ref={gal}
        type="file"
        accept="image/*"
        hidden
        onChange={handle}
      />
    </>
  );
}

/** Open the camera-only picker (phones) / file dialog (desktop). */
export function openCamera(ref) {
  ref?.current?.click();
}

/** Open the gallery / file picker — works on phones without forcing camera. */
export function openGallery(ref) {
  ref?.current?.click();
}
