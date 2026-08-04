export function SilhouetteSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="s-deer" viewBox="0 0 64 64">
          <path d="M32 23c6.6 0 11 4.6 11 11.4 0 5-1.9 8.9-4.6 11.3-2 1.8-2.6 3.3-2.8 5.6-.1 1.7-1.4 2.7-3.6 2.7s-3.5-1-3.6-2.7c-.2-2.3-.8-3.8-2.8-5.6C22.9 43.3 21 39.4 21 34.4 21 27.6 25.4 23 32 23z" />
          <path d="M21.6 27.4c-3.4-2.6-8-4-12.2-3.6.9 4.2 4.6 7.6 9.6 8.6zM42.4 27.4c3.4-2.6 8-4 12.2-3.6-.9 4.2-4.6 7.6-9.6 8.6z" />
          <path d="M24 22 19 8M19 13l-6-3M23 13l4-6M40 22l5-14M45 13l6-3M41 13l-4-6" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        </symbol>
        <symbol id="s-boar" viewBox="0 0 64 64">
          <path d="M14 34c0-8.8 7.4-15 17-15 3.6 0 6.8.8 9.4 2.2l4-5.4c.6 2.2.4 4.4-.4 6.4 4.6 3 7 7.6 7 12.8 0 9-7.6 15-19 15-11.6 0-18-6.6-18-16z" />
          <path d="M14 34c-4.6-.6-8.6 1-10.6 3.8 2 3 5.6 4.4 9.2 3.6zM14 30c-4-2-8.6-1.6-11 .8 1.6 3.2 5.4 5 9.2 4z" />
          <path d="M44 20.8 55 18l-8.6 6.6z" />
          <path d="M24 36c4.6-3.4 10.6-4 16-2-2.6 5-8 7.6-13.4 6.4z" fill="#fff" opacity=".4" />
        </symbol>
        <symbol id="s-fox" viewBox="0 0 64 64">
          <path d="M32 24c7.2 0 12 5 12 12.6C44 44.8 38.8 50 32 50s-12-5.2-12-13.4C20 29 24.8 24 32 24z" />
          <path d="M22 28c-3-7-2-14.6 1.6-20 3.4 5.6 4.6 12.4 2.6 19.4zM42 28c3-7 2-14.6-1.6-20-3.4 5.6-4.6 12.4-2.6 19.4z" />
          <path d="M25 42c2.4 3 4.4 3.6 7 3.6s4.6-.6 7-3.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </symbol>
        <symbol id="s-badger" viewBox="0 0 64 64">
          <path d="M32 22c8 0 14 5.6 14 14 0 7-5.2 14-14 14s-14-7-14-14c0-8.4 6-14 14-14z" />
          <path d="M20 30c-4-4-9-6-14-5.6 1.2 5.4 5.8 9 12 9.4z" />
          <path d="M44 30c4-4 9-6 14-5.6-1.2 5.4-5.8 9-12 9.4z" />
          <path d="M26 33a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM38 33a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#fff" />
        </symbol>
        <symbol id="s-raccoon" viewBox="0 0 64 64">
          <path d="M32 22c8.4 0 14.6 5.4 14.6 13.4 0 7.6-5.8 14.6-14.6 14.6S17.4 43 17.4 35.4C17.4 27.4 23.6 22 32 22z" />
          <path d="M19 30c-3.2-3.6-7.6-5.4-12-4.8 1 5 5.4 8.6 10.8 8.4z" />
          <path d="M45 30c3.2-3.6 7.6-5.4 12-4.8-1 5-5.4 8.6-10.8 8.4z" />
          <ellipse cx="26" cy="33" rx="4.5" ry="3.5" fill="#fff" opacity=".4" />
          <ellipse cx="38" cy="33" rx="4.5" ry="3.5" fill="#fff" opacity=".4" />
        </symbol>
        <symbol id="s-fasan" viewBox="0 0 64 64">
          <path d="M14 34c0-8.8 7.4-15 17-15 3.6 0 6.8.8 9.4 2.2l4-5.4c.6 2.2.4 4.4-.4 6.4 4.6 3 7 7.6 7 12.8 0 9-7.6 15-19 15-11.6 0-18-6.6-18-16z" />
          <path d="M44 20.8 55 18l-8.6 6.6z" />
          <path d="M24 36c4.6-3.4 10.6-4 16-2-2.6 5-8 7.6-13.4 6.4z" fill="#fff" opacity=".4" />
        </symbol>
        <symbol id="s-duck" viewBox="0 0 64 64">
          <path d="M4 40c8-1 13.6-4.4 18-10.4C25 25.4 28 22 33 22c4 0 7 2.4 7 6.2 0 2-.8 3.6-2 4.8 6 .4 10.6 3.4 14 8.6-4.4 3.6-10 5.4-17 5.4H16c-5 0-9-2-12-7z" />
          <path d="M40 24.4 48 22l-7.4 5z" />
        </symbol>
        <symbol id="s-hare" viewBox="0 0 64 64">
          <path d="M32 26c8 0 13 5.4 13 13.2C45 47.4 39.6 53 32 53s-13-5.6-13-13.8C19 31.4 24 26 32 26z" />
          <path d="M24 24c-3-6-3.6-12.6-1.4-19 4.6 4.6 6.6 11 6 19zM40 24c3-6 3.6-12.6 1.4-19-4.6 4.6-6.6 11-6 19z" />
        </symbol>
        <symbol id="s-goose" viewBox="0 0 64 64">
          <path d="M4 40c8-1 13.6-4.4 18-10.4C25 25.4 28 22 33 22c4 0 7 2.4 7 6.2 0 2-.8 3.6-2 4.8 6 .4 10.6 3.4 14 8.6-4.4 3.6-10 5.4-17 5.4H16c-5 0-9-2-12-7z" />
          <path d="M40 24.4 48 22l-7.4 5z" />
        </symbol>
      </defs>
    </svg>
  );
}

export function Silhouette({
  icon,
  size,
  fill,
  className,
}: {
  icon: string;
  size: number;
  fill: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill={fill}
      aria-hidden="true"
      className={className}
    >
      <use href={`#s-${icon}`} />
    </svg>
  );
}
