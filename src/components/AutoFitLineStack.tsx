"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type AutoFitLineStackProps = {
  lines: string[];
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
  colors?: string[];
};

export function AutoFitLineStack({
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
  colors = [],
}: AutoFitLineStackProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    async function fitLines() {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      const elements = lineRefs.current.filter((element): element is HTMLParagraphElement => Boolean(element));
      if (cancelled || !wrapperRef.current || elements.length === 0) {
        return;
      }

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
  }, [colors, fontFamily, fontWeight, letterSpacing, lineHeight, lines, maxFontSize, minFontSize, textTransform]);

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
      {lines.map((line, index) => (
        <p
          key={`${line}-${index}`}
          ref={(element) => {
            lineRefs.current[index] = element;
          }}
          style={{ ...sharedStyle, color: colors[index] }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
