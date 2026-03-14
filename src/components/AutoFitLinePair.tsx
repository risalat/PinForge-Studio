"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type AutoFitLinePairProps = {
  lines: [string, string];
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number;
  gap?: number;
  className?: string;
  textAlign?: CSSProperties["textAlign"];
  fontFamily?: string;
  fontWeight?: CSSProperties["fontWeight"];
  letterSpacing?: string;
  textTransform?: CSSProperties["textTransform"];
  colors: [string, string];
};

export function AutoFitLinePair({
  lines,
  minFontSize,
  maxFontSize,
  lineHeight,
  gap = 0,
  className,
  textAlign = "center",
  fontFamily,
  fontWeight,
  letterSpacing,
  textTransform,
  colors,
}: AutoFitLinePairProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineOneRef = useRef<HTMLParagraphElement>(null);
  const lineTwoRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    async function fitLines() {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      if (cancelled || !wrapperRef.current || !lineOneRef.current || !lineTwoRef.current) {
        return;
      }

      const elements = [lineOneRef.current, lineTwoRef.current];
      let nextSize = maxFontSize;

      const applySize = (size: number) => {
        for (const element of elements) {
          element.style.fontSize = `${size}px`;
        }
      };

      const fitsAtCurrentSize = () =>
        elements.every((element) => element.scrollWidth <= element.clientWidth + 2);

      applySize(nextSize);

      while (nextSize > minFontSize) {
        if (fitsAtCurrentSize()) {
          break;
        }

        nextSize -= 2;
        applySize(nextSize);
      }

      while (nextSize > 12) {
        if (fitsAtCurrentSize()) {
          break;
        }

        nextSize -= 1;
        applySize(nextSize);
      }

      if (!cancelled) {
        setFontSize(nextSize);
        setIsReady(true);
      }
    }

    void fitLines();

    return () => {
      cancelled = true;
    };
  }, [fontFamily, fontWeight, letterSpacing, lineHeight, lines, maxFontSize, minFontSize, textTransform]);

  const sharedStyle = {
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight,
    textAlign,
    textTransform,
    whiteSpace: "nowrap",
    fontSize,
  } satisfies CSSProperties;

  return (
    <div
      ref={wrapperRef}
      className={className}
      data-autofit-group="true"
      data-autofit-ready={isReady ? "true" : "false"}
      style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}
    >
      <p ref={lineOneRef} style={{ ...sharedStyle, color: colors[0] }}>
        {lines[0]}
      </p>
      <p ref={lineTwoRef} style={{ ...sharedStyle, color: colors[1] }}>
        {lines[1]}
      </p>
    </div>
  );
}
