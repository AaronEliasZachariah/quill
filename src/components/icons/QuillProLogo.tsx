import React from "react";
import QuillWordmark from "./QuillWordmark";

/**
 * Onboarding lockup: the full Quill wordmark at hero size, with its signature
 * ink stroke animating in on first paint. Kept as a thin wrapper so the
 * onboarding screens can ask for the "hero" treatment without duplicating
 * sizing decisions.
 */
const QuillProLogo = ({
  width = 200,
  className,
}: {
  width?: number;
  className?: string;
}) => <QuillWordmark width={width} className={className} animateStroke />;

export default QuillProLogo;
