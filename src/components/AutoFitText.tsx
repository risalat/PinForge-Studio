"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

type AutoFitTextProps = {
  as?: "h1" | "h2" | "p" | "span";
  text: string;
  className?: string;
  style?: CSSProperties;
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

function countRenderedLines(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rects = Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .sort((left, right) => left.top - right.top);

  if (rects.length === 0) {
    return 1;
  }

  const lineTops: number[] = [];
  for (const rect of rects) {
    const top = Math.round(rect.top * 10) / 10;
    if (!lineTops.some((existingTop) => Math.abs(existingTop - top) <= 1)) {
      lineTops.push(top);
    }
  }

  return Math.max(1, lineTops.length);
}

export function AutoFitText({
  as = "p",
  text,
  className,
  style: customStyle,
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
  const content = text.trim();
  const elementRef = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    let fitVersion = 0;
    let resizeObserver: ResizeObserver | null = null;

    async function fitText() {
      const currentVersion = ++fitVersion;
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      if (cancelled || currentVersion !== fitVersion || !elementRef.current) {
        return;
      }

      const element = elementRef.current;
      const parent = element.parentElement;
      const availableWidth = Math.max(
        1,
        Math.round(element.clientWidth || parent?.clientWidth || 0),
      );
      const availableHeight = Math.max(
        1,
        Math.round(element.clientHeight || parent?.clientHeight || 0),
      );

      if (!content) {
        if (!cancelled && currentVersion === fitVersion) {
          setFontSize(minFontSize);
          setIsReady(true);
        }
        return;
      }

      const measureRoot = document.createElement("div");
      const measureText = document.createElement("span");
      measureRoot.style.position = "absolute";
      measureRoot.style.left = "-99999px";
      measureRoot.style.top = "0";
      measureRoot.style.visibility = "hidden";
      measureRoot.style.pointerEvents = "none";
      measureRoot.style.margin = "0";
      measureRoot.style.padding = "0";
      measureRoot.style.display = "block";
      measureRoot.style.overflow = "hidden";

      measureText.textContent = content;
      measureText.style.margin = "0";
      measureText.style.padding = "0";
      measureText.style.fontFamily = fontFamily ?? "inherit";
      measureText.style.fontWeight = String(fontWeight ?? "400");
      measureText.style.fontStyle = String(fontStyle ?? "normal");
      measureText.style.letterSpacing = letterSpacing ?? "normal";
      measureText.style.textAlign = textAlign ?? "left";
      measureText.style.textTransform = String(textTransform ?? "none");

      measureRoot.appendChild(measureText);
      document.body.appendChild(measureRoot);

      const applySize = (size: number) => {
        measureText.style.fontSize = `${size}px`;
        measureText.style.lineHeight = String(lineHeight);
        if (maxLines === 1) {
          measureRoot.style.width = "auto";
          measureRoot.style.maxWidth = "none";
          measureText.style.display = "inline-block";
          measureText.style.whiteSpace = "nowrap";
          measureText.style.overflowWrap = "normal";
        } else {
          measureRoot.style.width = `${availableWidth}px`;
          measureRoot.style.maxWidth = `${availableWidth}px`;
          measureText.style.display = "inline";
          measureText.style.whiteSpace = "pre-wrap";
          measureText.style.overflowWrap = "break-word";
        }
        measureText.style.wordBreak = "normal";
      };

      const fitsAtSize = (size: number) => {
        applySize(size);

        const textWidth = Math.ceil(measureText.getBoundingClientRect().width);
        const textHeight =
          maxLines === 1
            ? Math.ceil(measureText.getBoundingClientRect().height)
            : Math.ceil(measureRoot.scrollHeight);
        const lineCount = maxLines === 1 ? 1 : countRenderedLines(measureText);

        const widthFits = maxLines === 1 ? textWidth <= availableWidth + 2 : true;
        const heightFits = textHeight <= availableHeight + 2;

        return widthFits && heightFits && lineCount <= maxLines;
      };

      let low = minFontSize;
      let high = maxFontSize;
      let best = minFontSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (fitsAtSize(mid)) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      measureRoot.remove();

      element.style.fontSize = `${best}px`;
      element.style.lineHeight = String(lineHeight);
      element.style.whiteSpace = maxLines === 1 ? "nowrap" : "pre-wrap";
      element.style.overflowWrap = maxLines === 1 ? "normal" : "break-word";
      element.style.wordBreak = "normal";

      if (!cancelled && currentVersion === fitVersion) {
        setFontSize(best);
        setIsReady(true);
      }
    }

    const scheduleFit = () => {
      setIsReady(false);
      void fitText();
    };

    scheduleFit();

    if (typeof ResizeObserver !== "undefined" && elementRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        scheduleFit();
      });
      resizeObserver.observe(elementRef.current.parentElement);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [
    as,
    content,
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
    ...customStyle,
    color: textColor,
    display: "block",
    fontFamily,
    fontSize,
    fontStyle,
    fontWeight,
    letterSpacing,
    lineHeight,
    margin: 0,
    overflowWrap: maxLines === 1 ? "normal" : "break-word",
    textAlign,
    textTransform,
    wordBreak: "normal",
    whiteSpace: maxLines === 1 ? "nowrap" : "pre-wrap",
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
        {content}
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
        {content}
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
        {content}
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
      {content}
    </p>
  );
}
