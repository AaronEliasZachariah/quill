import React from "react";
import InkStroke from "./InkStroke";

/**
 * Quill wordmark — the name set in Fraunces (optical size up, a touch of SOFT
 * so it reads as ink), underlined by the signature pen stroke in the live ink
 * accent. Type-led on purpose: no icon, so the letterforms and the stroke
 * carry the identity. `width` scales the whole lockup. Colors come from theme
 * tokens, so it adapts to light/dark automatically.
 */
const QuillWordmark = ({
  width = 120,
  className,
  animateStroke = false,
}: {
  width?: number;
  className?: string;
  animateStroke?: boolean;
}) => {
  const fontSize = width * 0.44;

  return (
    <div
      className={`inline-flex flex-col items-center ${className ?? ""}`}
      style={{ width }}
    >
      {/* eslint-disable i18next/no-literal-string */}
      <span
        className="font-wordmark text-logo-stroke leading-none"
        style={{ fontSize }}
      >
        Quill
      </span>
      {/* eslint-enable i18next/no-literal-string */}
      <InkStroke
        className="text-logo-primary -mt-[0.06em]"
        width={fontSize * 1.78}
        height={Math.max(7, fontSize * 0.17)}
        animate={animateStroke}
      />
    </div>
  );
};

export default QuillWordmark;
