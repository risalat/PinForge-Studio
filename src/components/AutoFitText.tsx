"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

type AutoFitTextProps = {
  as?: "h1" | "h2" | "p" | "span";
  text: string;
  className?: string;
  minFontSize: number;
  maxFontSize: number;
  lineHeight: number;
  maxLines: number;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: CSSProperties["fontWeight"];
  letterSpacing?: string;
  textAlign?: CSSProperties["textAlign"];
  textTransform?: CSSProperties["textTransform"];
  fontStyle?: CSSProperties["fontStyle"];
};

export function AutoFitText({
  as = "p",
  text,
  className,
  minFontSize,
  maxFontSize,
  lineHeight,
  maxLines,
  textColor,
  fontFamily,
  fontWeight,
  letterSpacing,
  textAlign,
  textTransform,
  fontStyle,
}: AutoFitTextProps) {
  const elementRef = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isReady, setIsReady] = useState(false);

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
      const maxHeight = Math.ceil(maxLines * maxFontSize * lineHeight);
      const fitsAtCurrentSize = () => {
        const widthFits = element.scrollWidth <= element.clientWidth + 2;
        if (maxLines === 1) {
          return widthFits;
        }

        const computedLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
        const allowedHeight = Math.ceil(computedLineHeight * maxLines);

        return (
          widthFits &&
          element.scrollHeight <= allowedHeight + 2 &&
          element.scrollHeight <= maxHeight + 2
        );
      };

      let nextSize = maxFontSize;
      element.style.fontSize = `${nextSize}px`;
      element.style.lineHeight = String(lineHeight);
      element.style.whiteSpace = maxLines === 1 ? "nowrap" : "normal";

      while (nextSize > minFontSize) {
        if (fitsAtCurrentSize()) {
          break;
        }

        nextSize -= 2;
        element.style.fontSize = `${nextSize}px`;
      }

      while (nextSize > 12) {
        if (fitsAtCurrentSize()) {
          break;
        }

        nextSize -= 1;
        element.style.fontSize = `${nextSize}px`;
      }

      if (!cancelled) {
        setFontSize(nextSize);
        setIsReady(true);
      }
    }

    void fitText();

    return () => {
      cancelled = true;
    };
  }, [
    fontFamily,
    fontStyle,
    fontWeight,
    letterSpacing,
    lineHeight,
    maxFontSize,
    maxLines,
    minFontSize,
    text,
    textAlign,
    textTransform,
  ]);

  const style = {
    color: textColor,
    fontFamily,
    fontSize,
    fontStyle,
    fontWeight,
    letterSpacing,
    lineHeight,
    textAlign,
    textTransform,
    whiteSpace: maxLines === 1 ? "nowrap" : undefined,
  } satisfies CSSProperties;

  if (as === "h1") {
    return (
      <h1
        ref={elementRef as RefObject<HTMLHeadingElement>}
        className={className}
        style={style}
        data-autofit="true"
        data-autofit-ready={isReady ? "true" : "false"}
      >
        {text}
      </h1>
    );
  }

  if (as === "h2") {
    return (
      <h2
        ref={elementRef as RefObject<HTMLHeadingElement>}
        className={className}
        style={style}
        data-autofit="true"
        data-autofit-ready={isReady ? "true" : "false"}
      >
        {text}
      </h2>
    );
  }

  if (as === "span") {
    return (
      <span
        ref={elementRef as RefObject<HTMLSpanElement>}
        className={className}
        style={style}
        data-autofit="true"
        data-autofit-ready={isReady ? "true" : "false"}
      >
        {text}
      </span>
    );
  }

  return (
    <p
      ref={elementRef as RefObject<HTMLParagraphElement>}
      className={className}
      style={style}
      data-autofit="true"
      data-autofit-ready={isReady ? "true" : "false"}
    >
      {text}
    </p>
  );
}
