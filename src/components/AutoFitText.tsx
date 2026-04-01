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

type CandidateResult = {
  text: string;
  fontSize: number;
  lineCount: number;
  balanceScore: number;
  areaCoverage: number;
};

function getLineBalanceScore(candidateText: string) {
  const lines = candidateText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return 0;
  }

  const longest = Math.max(...lines.map((line) => line.length));
  const shortest = Math.min(...lines.map((line) => line.length));

  if (longest <= 0) {
    return 0;
  }

  return shortest / longest;
}

function getTextCandidates(text: string, maxLines: number) {
  const trimmed = text.trim();

  if (!trimmed || maxLines <= 1) {
    return [trimmed];
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return [trimmed];
  }

  const results = new Set<string>([trimmed]);
  const maxBreaks = Math.min(maxLines - 1, words.length - 1);
  const breakPositions: number[] = [];

  const buildCandidate = () => {
    const breaks = new Set(breakPositions);
    const lines: string[] = [];
    let current: string[] = [];

    words.forEach((word, index) => {
      current.push(word);
      if (breaks.has(index)) {
        lines.push(current.join(" "));
        current = [];
      }
    });

    if (current.length > 0) {
      lines.push(current.join(" "));
    }

    if (lines.length > 1 && lines.length <= maxLines) {
      results.add(lines.join("\n"));
    }
  };

  const visit = (start: number, depth: number) => {
    if (results.size >= 64) {
      return;
    }

    for (let index = start; index < words.length - 1; index += 1) {
      breakPositions.push(index);
      buildCandidate();

      if (depth + 1 < maxBreaks) {
        visit(index + 1, depth + 1);
      }

      breakPositions.pop();
    }
  };

  visit(0, 0);

  return Array.from(results);
}

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
  const [displayText, setDisplayText] = useState(text);
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
      const parent = element.parentElement;
      const availableWidth = Math.max(
        1,
        Math.round(parent?.clientWidth || element.clientWidth || 0),
      );
      const availableHeight = Math.max(
        1,
        Math.round(parent?.clientHeight || element.clientHeight || 0),
      );

      const measureNode = document.createElement(as === "span" ? "span" : "div");
      measureNode.style.position = "absolute";
      measureNode.style.left = "-99999px";
      measureNode.style.top = "0";
      measureNode.style.visibility = "hidden";
      measureNode.style.pointerEvents = "none";
      measureNode.style.width = `${availableWidth}px`;
      measureNode.style.maxWidth = `${availableWidth}px`;
      measureNode.style.margin = "0";
      measureNode.style.padding = "0";
      measureNode.style.display = "block";
      measureNode.style.fontFamily = fontFamily ?? "inherit";
      measureNode.style.fontWeight = String(fontWeight ?? "400");
      measureNode.style.fontStyle = String(fontStyle ?? "normal");
      measureNode.style.letterSpacing = letterSpacing ?? "normal";
      measureNode.style.textAlign = textAlign ?? "left";
      measureNode.style.textTransform = String(textTransform ?? "none");
      document.body.appendChild(measureNode);

      const applySize = (size: number, candidateText: string) => {
        measureNode.textContent = candidateText;
        measureNode.style.fontSize = `${size}px`;
        measureNode.style.lineHeight = String(lineHeight);
        if (maxLines === 1) {
          measureNode.style.width = "auto";
          measureNode.style.maxWidth = "none";
          measureNode.style.display = "inline-block";
          measureNode.style.whiteSpace = "nowrap";
          measureNode.style.overflowWrap = "normal";
        } else if (candidateText.includes("\n")) {
          measureNode.style.width = `${availableWidth}px`;
          measureNode.style.maxWidth = `${availableWidth}px`;
          measureNode.style.display = "block";
          measureNode.style.whiteSpace = "pre-wrap";
          measureNode.style.overflowWrap = "normal";
        } else {
          measureNode.style.width = `${availableWidth}px`;
          measureNode.style.maxWidth = `${availableWidth}px`;
          measureNode.style.display = "block";
          measureNode.style.whiteSpace = maxLines === 1 ? "nowrap" : "normal";
          measureNode.style.overflowWrap = maxLines === 1 ? "normal" : "break-word";
        }
        measureNode.style.wordBreak = "normal";
      };

      const fitsAtSize = (size: number, candidateText: string) => {
        applySize(size, candidateText);

        const computed = window.getComputedStyle(measureNode);
        const computedLineHeight = Number.parseFloat(computed.lineHeight);
        const fallbackLineHeight = size * lineHeight;
        const lineHeightPx = Number.isFinite(computedLineHeight)
          ? computedLineHeight
          : fallbackLineHeight;
        const scrollHeight = Math.ceil(measureNode.scrollHeight);
        const scrollWidth =
          maxLines === 1
            ? Math.ceil(measureNode.getBoundingClientRect().width)
            : Math.ceil(measureNode.scrollWidth);
        const explicitLineCount = maxLines === 1
          ? 1
          : candidateText.includes("\n")
          ? candidateText.split("\n").filter(Boolean).length
          : null;
        const lineCount = explicitLineCount ?? Math.max(1, Math.ceil(scrollHeight / lineHeightPx));

        const heightFits =
          scrollHeight <= availableHeight + 2 &&
          lineCount <= maxLines;

        if (maxLines === 1) {
          return scrollWidth <= availableWidth + 2 && heightFits;
        }

        return heightFits;
      };

      const candidates = getTextCandidates(text, maxLines);
      let bestCandidate: CandidateResult = {
        text,
        fontSize: minFontSize,
        lineCount: 1,
        balanceScore: 0,
        areaCoverage: 0,
      };

      for (const candidateText of candidates) {
        let low = minFontSize;
        let high = maxFontSize;
        let best = minFontSize;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (fitsAtSize(mid, candidateText)) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        applySize(best, candidateText);
        const computed = window.getComputedStyle(measureNode);
        const computedLineHeight = Number.parseFloat(computed.lineHeight);
        const fallbackLineHeight = best * lineHeight;
        const lineHeightPx = Number.isFinite(computedLineHeight)
          ? computedLineHeight
          : fallbackLineHeight;
        const scrollHeight = Math.ceil(measureNode.scrollHeight);
        const explicitLineCount = maxLines === 1
          ? 1
          : candidateText.includes("\n")
          ? candidateText.split("\n").filter(Boolean).length
          : null;
        const lineCount = explicitLineCount ?? Math.max(1, Math.ceil(scrollHeight / lineHeightPx));
        const widthUsage = Math.min(1, Math.ceil(measureNode.scrollWidth) / availableWidth);
        const heightUsage = Math.min(1, scrollHeight / availableHeight);
        const candidateResult: CandidateResult = {
          text: candidateText,
          fontSize: best,
          lineCount,
          balanceScore: getLineBalanceScore(candidateText),
          areaCoverage: widthUsage * heightUsage,
        };

        const currentScore =
          bestCandidate.fontSize +
          bestCandidate.areaCoverage * 120 +
          Math.max(0, bestCandidate.lineCount - 1) * 6 +
          bestCandidate.balanceScore * 10;
        const nextScore =
          candidateResult.fontSize +
          candidateResult.areaCoverage * 120 +
          Math.max(0, candidateResult.lineCount - 1) * 6 +
          candidateResult.balanceScore * 10;

        if (nextScore > currentScore + 1) {
          bestCandidate = candidateResult;
        }
      }

      measureNode.remove();

      element.style.fontSize = `${bestCandidate.fontSize}px`;
      element.style.lineHeight = String(lineHeight);
      element.style.whiteSpace = bestCandidate.text.includes("\n")
        ? "pre-wrap"
        : maxLines === 1
          ? "nowrap"
          : "normal";
      element.style.overflowWrap = bestCandidate.text.includes("\n")
        ? "normal"
        : maxLines === 1
          ? "normal"
          : "break-word";
      element.style.wordBreak = "normal";

      if (!cancelled) {
        setDisplayText(bestCandidate.text);
        setFontSize(bestCandidate.fontSize);
        setIsReady(true);
      }
    }

    void fitText();

    return () => {
      cancelled = true;
    };
  }, [
    as,
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
    whiteSpace: displayText.includes("\n")
      ? "pre-wrap"
      : maxLines === 1
        ? "nowrap"
        : undefined,
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
        {displayText}
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
        {displayText}
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
        {displayText}
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
      {displayText}
    </p>
  );
}
