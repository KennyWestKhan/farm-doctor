/**
 * The one YouTube button used everywhere, so the app never shows two different
 * "watch on YouTube" treatments. Solid YouTube red with the play-badge logo —
 * the universally recognised cue that this opens YouTube.
 */
export default function YouTubeButton({ href, label, className = '' }) {
  return (
    <a
      className={`btn btn--block btn--youtube ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="30" height="21" viewBox="0 0 30 21" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect width="30" height="21" rx="5.5" fill="#fff" />
        <path d="M12 6 L12 15 L20 10.5 Z" fill="#FF0000" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
