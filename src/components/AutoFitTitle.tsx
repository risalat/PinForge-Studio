"use client";

import { useLayoutEffect, useRef, useState } from "react";

type AutoFitTitleProps = {
  text: string;
  className?: string;
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number;
  maxLines: number;
  textColor?: string;
};

export function AutoFitTitle({
  text,
  className,
  minFontSize,
  maxFontSize,
  lineHeight,
  maxLines,
  textColor,
}: AutoFitTitleProps) {
  const elementRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    let cancelled = false;

    async function fitText() {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      if (cancelled || !elementRef.current) {
        return;
      }

      const element = elementRef.current;
      element.dataset.autofitReady = "false";
      const maxHeight = Math.ceil(maxLines * maxFontSize * lineHeight);

      let nextSize = maxFontSize;
      element.style.fontSize = `${nextSize}px`;
      element.style.lineHeight = String(lineHeight);

      while (nextSize > minFontSize) {
        const computedLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
        const allowedHeight = Math.ceil(computedLineHeight * maxLines);

        if (
          element.scrollHeight <= allowedHeight + 2 &&
          element.scrollWidth <= element.clientWidth + 2 &&
          element.scrollHeight <= maxHeight + 2
        ) {
          break;
        }

        nextSize -= 2;
        element.style.fontSize = `${nextSize}px`;
      }

      if (!cancelled) {
        setFontSize(nextSize);
        element.dataset.autofitReady = "true";
      }
    }

    void fitText();

    return () => {
      cancelled = true;
    };
  }, [lineHeight, maxFontSize, maxLines, minFontSize, text]);

  return (
    <h1
      ref={elementRef}
      data-autofit="true"
      data-autofit-ready="false"
      className={className}
      style={{
        fontSize,
        lineHeight,
        color: textColor,
      }}
    >
      {text}
    </h1>
  );
}
