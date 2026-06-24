import React from "react";

interface QuillMarkProps {
  size?: number | string;
  className?: string;
  /** Play the "writing" entrance: the feather settles and the nib lays down its ink stroke. */
  animate?: boolean;
}

/**
 * Quill's logo mark — a feather quill caught the instant its nib lays down ink.
 *
 * The mark IS the brand idea: the same signature ink stroke that lives under the
 * wordmark is here drawn by the nib, so the icon explains itself ("this is the
 * thing that writes"). The vane is filled with an ink gradient — lighter at the
 * plume, deepening toward the loaded nib — and every color is a theme token, so
 * it inverts cleanly between the light "page" and the dark "inkwell". The
 * entrance animation respects `prefers-reduced-motion`.
 */
const QuillMark: React.FC<QuillMarkProps> = ({
  size = 36,
  className,
  animate = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={`${animate ? "quill-write" : ""} ${className ?? ""}`.trim()}
  >
    <defs>
      <linearGradient
        id="quill-vane-grad"
        x1="50"
        y1="12"
        x2="26"
        y2="51"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="var(--color-logo-primary)" />
        <stop offset="1" stopColor="var(--color-logo-stroke)" />
      </linearGradient>
    </defs>

    {/* The ink the nib is laying down — the brand's signature stroke. */}
    <path
      className={animate ? "quill-ink" : undefined}
      d="M13 56 C 24 53.4, 40 53.4, 51 55"
      stroke="var(--color-logo-primary)"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      pathLength={1}
    />

    {/* The quill itself: vane, spine, barbs and a loaded nib. */}
    <g className={animate ? "quill-feather" : undefined}>
      <path
        d="M50 12 C 53 24, 44 40, 26 51 C 34 40, 40 22, 50 12 Z"
        fill="url(#quill-vane-grad)"
      />
      {/* rachis (the feather's spine) */}
      <path
        d="M25.5 50.5 C 33 38, 41 24, 49 13.5"
        stroke="var(--color-logo-stroke)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* barbs — feather texture, kept faint so it doesn't muddy at small sizes */}
      <g
        stroke="var(--color-logo-stroke)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      >
        <path d="M30 44 C 35 42, 39 39, 42 35" />
        <path d="M35 35 C 40 33, 43 30, 46 26" />
        <path d="M40 26 C 44 24, 46 22, 48 18.5" />
      </g>
      {/* nib — tapered to a split point sitting on the ink line */}
      <path
        d="M21.5 49.5 L 28.5 49.5 L 24.8 56 Z"
        fill="var(--color-logo-stroke)"
      />
      <path
        d="M24.9 51.5 L 24.9 55"
        stroke="var(--color-surface)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export default QuillMark;
