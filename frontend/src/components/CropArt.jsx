/**
 * Hand-drawn-style inline SVG crop illustrations + a few shared bits of art.
 * Inline SVG keeps everything offline, themeable (uses CSS vars), and crisp on
 * any screen with zero extra network requests.
 */

const S = ({ children, size = 96, label }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label}>
    {children}
  </svg>
);

export function ChilliArt({ size }) {
  return (
    <S size={size} label="Chilli pepper">
      <path d="M38 18c4-6 12-7 16-2" fill="none" stroke="var(--leaf-deep)" strokeWidth="5" strokeLinecap="round" />
      <path d="M54 16c2 10-2 18-2 18" fill="none" stroke="var(--leaf)" strokeWidth="5" strokeLinecap="round" />
      <path d="M50 30c14 2 24 16 20 34-3 14-16 24-26 20-8-3-9-14-4-22 6-10 4-24 10-32z" fill="var(--clay)" stroke="var(--clay-deep)" strokeWidth="3" />
      <path d="M52 40c8 4 12 14 10 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" />
    </S>
  );
}

export function CassavaArt({ size }) {
  return (
    <S size={size} label="Cassava">
      <g stroke="var(--leaf-deep)" strokeWidth="4" strokeLinecap="round" fill="var(--leaf)">
        <path d="M50 14C40 22 36 30 38 40c8-2 14-10 12-26z" />
        <path d="M50 14c10 8 14 16 12 26-8-2-14-10-12-26z" />
        <path d="M50 18C44 28 40 32 32 34c4 8 14 8 18-16z" />
        <path d="M50 18c6 10 10 14 18 16-4 8-14 8-18-16z" />
      </g>
      <path d="M48 40h4l3 30c0 6-10 6-10 0z" fill="var(--soil-3)" stroke="var(--soil)" strokeWidth="3" />
      <ellipse cx="50" cy="78" rx="13" ry="8" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="3" />
    </S>
  );
}

export function SweetPotatoArt({ size }) {
  return (
    <S size={size} label="Sweet potato">
      <path d="M30 60c-6-14 4-26 18-26 4-8 16-8 20 2 10 2 12 16 4 24-6 14-30 18-42 0z" fill="var(--clay-deep)" stroke="var(--soil)" strokeWidth="3" />
      <path d="M40 50c6-4 16-3 22 4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
      <g stroke="var(--leaf-deep)" strokeWidth="4" fill="var(--leaf)" strokeLinecap="round">
        <path d="M40 30c-4-8-2-14 2-18 6 4 6 12-2 18z" />
        <path d="M52 26c0-8 4-12 10-14 2 8-2 14-10 14z" />
      </g>
    </S>
  );
}

export function GroundnutArt({ size }) {
  return (
    <S size={size} label="Groundnut">
      <path d="M42 22c10 0 14 8 12 16 8 2 12 12 8 22-4 12-22 12-26 0-2-6 0-10 4-14-8-4-10-16-2-22 1-1 3-2 4-2z" fill="var(--gold-soft)" stroke="var(--gold-deep)" strokeWidth="3" />
      <g stroke="var(--gold-deep)" strokeWidth="2" opacity="0.6" fill="none">
        <path d="M38 30c8 2 12 2 18 0" />
        <path d="M36 44c10 3 16 3 24 0" />
        <path d="M38 58c8 2 12 2 18 0" />
      </g>
      <circle cx="47" cy="34" r="3" fill="var(--soil)" opacity="0.5" />
      <circle cx="50" cy="52" r="3" fill="var(--soil)" opacity="0.5" />
    </S>
  );
}

const CROP_ART = {
  chilli_pepper: ChilliArt,
  cassava: CassavaArt,
  sweet_potato: SweetPotatoArt,
  groundnut: GroundnutArt,
};

export function CropArt({ cropId, size = 96 }) {
  const Art = CROP_ART[cropId];
  return Art ? <Art size={size} /> : null;
}

/** The brand mark: a leaf cradling a gold "+" — used on the home hero. */
export function BrandMark({ size = 140 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Farm Doctor">
      <circle cx="60" cy="60" r="54" fill="var(--leaf)" />
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--leaf-deep)" strokeWidth="4" />
      <path d="M60 26c-26 0-44 22-44 48 26 0 44-15 48-41 4 26-4 45-26 59 22 0 44-19 44-48 0-11-7-18-22-18z" fill="var(--paper)" />
      <rect x="53" y="60" width="14" height="36" rx="5" fill="var(--gold)" />
      <rect x="42" y="71" width="36" height="14" rx="5" fill="var(--gold)" />
    </svg>
  );
}

/** Thin woven kente rule as a component (for places a div isn't handy). */
export function KenteRule({ style }) {
  return <div className="kente-rule" style={style} />;
}
