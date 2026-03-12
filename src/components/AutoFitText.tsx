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
  textTransform,
  fontStyle,
}: AutoFitTextProps) {
  const elementRef = useRef<HTMLElement>(null);
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
      const maxHeight = Math.ceil(maxLines * maxFontSize * lineHeight);

      let nextSize = maxFontSize;
      element.style.fontSize = `${nextSize}px`;
      element.style.lineHeight = String(lineHeight);
      element.style.whiteSpace = maxLines === 1 ? "nowrap" : "normal";

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
    textTransform,
    whiteSpace: maxLines === 1 ? "nowrap" : undefined,
  } satisfies CSSProperties;

  if (as === "h1") {
    return (
      <h1 ref={elementRef as RefObject<HTMLHeadingElement>} className={className} style={style}>
        {text}
      </h1>
    );
  }

  if (as === "h2") {
    return (
      <h2 ref={elementRef as RefObject<HTMLHeadingElement>} className={className} style={style}>
        {text}
      </h2>
    );
  }

  if (as === "span") {
    return (
      <span ref={elementRef as RefObject<HTMLSpanElement>} className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <p ref={elementRef as RefObject<HTMLParagraphElement>} className={className} style={style}>
      {text}
    </p>
  );
}
