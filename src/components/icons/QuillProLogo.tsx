import React from "react";
import QuillMark from "./QuillMark";
import QuillWordmark from "./QuillWordmark";

/**
 * The full Quill lockup: the animated quill mark above the wordmark. This is the
 * brand's primary logo — used at hero size on the onboarding screens and at a
 * smaller size in the sidebar. The mark "writes" its ink stroke on first paint,
 * so the wordmark drops its own underline to keep a single, deliberate stroke.
 * `width` scales the whole lockup; colors come from theme tokens.
 */
const QuillProLogo = ({
  width = 200,
  className,
}: {
  width?: number;
  className?: string;
}) => (
  <div
    className={`inline-flex flex-col items-center ${className ?? ""}`.trim()}
    style={{ gap: width * 0.05 }}
  >
    <QuillMark size={width * 0.4} animate />
    <QuillWordmark width={width * 0.78} showStroke={false} />
  </div>
);

export default QuillProLogo;
