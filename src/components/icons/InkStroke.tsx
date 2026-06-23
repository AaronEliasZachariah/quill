import React from "react";

interface InkStrokeProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  /** Animate the stroke drawing itself on mount. */
  animate?: boolean;
}

/**
 * Quill's signature: a single tapered pen stroke, as if drawn by a nib in one
 * pass — heavier in the middle, lifting at both ends. It's the one memorable
 * mark of the brand, used sparingly under the wordmark and the onboarding
 * title. Inherits color from `currentColor`, so callers set it with text-*.
 */
const InkStroke: React.FC<InkStrokeProps> = ({
  width = 96,
  height = 10,
  className,
  animate = false,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 20"
    fill="none"
    aria-hidden="true"
    className={className}
    preserveAspectRatio="none"
  >
    {/* A filled brush body gives the stroke its swelling weight... */}
    <path
      d="M3 12.5 C 40 7, 78 6.5, 116 8 C 150 9.3, 178 11, 197 8.2 C 178 13.5, 150 14.6, 116 13.6 C 78 12.4, 40 13.2, 3 12.5 Z"
      fill="currentColor"
      opacity="0.92"
    />
    {/* ...and a hairline tail catches the lift of the nib. */}
    <path
      d="M3 12.5 C 40 7, 78 6.5, 116 8 C 150 9.3, 178 11, 197 8.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
      pathLength={1}
      className={animate ? "ink-stroke-draw" : undefined}
    />
  </svg>
);

export default InkStroke;
