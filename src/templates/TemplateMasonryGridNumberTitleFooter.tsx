/* eslint-disable @next/next/no-img-element */

import { AutoFitLinePair } from "@/components/AutoFitLinePair";
import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-antonio), sans-serif",
    fontWeight: 400,
    letterSpacing: "0",
    lineHeight: 1.4,
  },
  number: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 0.92,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: 1,
  },
} as const;

export function TemplateMasonryGridNumberTitleFooter({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images, 8);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const { primaryLine, accentLine } = splitHeadlineTwoLines(title);

  const divider = 12;
  const canvasWidth = 1080;
  const topGridHeight = 960;
  const titleStripHeight = 384;
  const bottomRowHeight = 576;
  const colWidth = Math.round((canvasWidth - divider * 2) / 3);
  const sideTileHeight = Math.round((topGridHeight - divider) / 2);
  const centerTopHeight = Math.round((topGridHeight - divider) * 0.65);
  const centerBottomHeight = topGridHeight - divider - centerTopHeight;
  const upperBottomTop = sideTileHeight + divider;
  const centerBottomTop = centerTopHeight + divider;
  const titleStripTop = topGridHeight;
  const bottomTop = titleStripTop + titleStripHeight;
  const bottomTileWidth = Math.round((canvasWidth - divider) / 2);
  const numberBoxSize = 242;
  const numberOverlapIntoTitle = Math.round(numberBoxSize * 0.3);
  const numberTop = titleStripTop - (numberBoxSize - numberOverlapIntoTitle);
  const numberRadius = 24;
  const titleBlockTop = titleStripTop + 88;
  const titleBlockWidth = 948;
  const pillWidth = 336;
  const pillHeight = 58;
  const pillBottom = 52;

  const backgroundColor = preset.palette.footer;
  const accentSurface = pickReadableColor(backgroundColor, [
    tintTowardsWhite(preset.palette.divider, 0.2),
    tintTowardsWhite(preset.palette.title, 0.18),
    preset.palette.divider,
    preset.palette.title,
    preset.palette.subtitle,
    "#ffbf57",
  ], { minContrast: 3.1 });
  const dividerColor = mixHex(backgroundColor, accentSurface, 0.28);
  const cardBackground = pickBestContrastColor(backgroundColor, [
    preset.palette.canvas,
    preset.palette.band,
    tintTowardsWhite(preset.palette.canvas, 0.08),
    "#f6f3e9",
  ]);
  const numberTextColor = pickBestContrastColor(cardBackground, [
    preset.palette.number,
    preset.palette.title,
    preset.palette.footer,
    "#311f2c",
  ]);
  const accentTitleColor = accentSurface;
  const lightTitleColor = pickReadableColor(backgroundColor, [
    preset.palette.canvas,
    preset.palette.band,
    preset.palette.domain,
    preset.palette.title,
    "#f4efe5",
    "#172033",
  ], { minContrast: 4.8 });
  const domainPillBackground = pickReadableColor(backgroundColor, [
    preset.palette.divider,
    deepenHex(preset.palette.divider, 0.1),
    tintTowardsWhite(preset.palette.divider, 0.08),
    preset.palette.title,
    "#ef6d2d",
    "#d86c2c",
  ], { minContrast: 2.4 });
  const domainTextColor = pickReadableColor(domainPillBackground, [
    preset.palette.footer,
    preset.palette.title,
    preset.palette.domain,
    "#172033",
    "#fff8ee",
  ], { minContrast: 5.2 });

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[20px]"
      style={{ backgroundColor }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{ left: 0, top: 0, width: colWidth, height: sideTileHeight }}
      />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{ left: colWidth + divider, top: 0, width: colWidth, height: centerTopHeight }}
      />
      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{ right: 0, top: 0, width: colWidth, height: sideTileHeight }}
      />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{ left: 0, top: upperBottomTop, width: colWidth, height: sideTileHeight }}
      />
      <ImageTile
        src={imageSet[4]}
        alt={title}
        style={{ left: colWidth + divider, top: centerBottomTop, width: colWidth, height: centerBottomHeight }}
      />
      <ImageTile
        src={imageSet[5]}
        alt={title}
        style={{ right: 0, top: upperBottomTop, width: colWidth, height: sideTileHeight }}
      />
      <ImageTile
        src={imageSet[6]}
        alt={title}
        style={{ left: 0, top: bottomTop, width: bottomTileWidth, height: bottomRowHeight }}
      />
      <ImageTile
        src={imageSet[7]}
        alt={title}
        style={{ right: 0, top: bottomTop, width: bottomTileWidth, height: bottomRowHeight }}
      />

      <div
        className="absolute inset-x-0 z-[5]"
        style={{
          top: titleStripTop,
          height: titleStripHeight,
          backgroundColor,
        }}
      />

      <div
        className="absolute left-1/2 z-20 -translate-x-1/2 shadow-[0_18px_40px_rgba(20,10,18,0.18)]"
        style={{
          top: numberTop,
          width: numberBoxSize,
          height: numberBoxSize,
          borderRadius: `${numberRadius}px`,
          backgroundColor: cardBackground,
        }}
      >
        <span
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{
            color: numberTextColor,
            fontFamily: TEMPLATE_TYPOGRAPHY.number.fontFamily,
            fontWeight: TEMPLATE_TYPOGRAPHY.number.fontWeight,
            fontSize: displayNumber >= 100 ? "132px" : "154px",
            letterSpacing: TEMPLATE_TYPOGRAPHY.number.letterSpacing,
            lineHeight: TEMPLATE_TYPOGRAPHY.number.lineHeight,
            transform: "translateY(-4px)",
            fontVariantNumeric: "lining-nums proportional-nums",
          }}
        >
          {displayNumber}
        </span>
      </div>

      <div className="absolute inset-x-0 z-20 flex justify-center" style={{ top: titleBlockTop }}>
        <div style={{ width: titleBlockWidth }}>
          <AutoFitLinePair
            lines={[primaryLine, accentLine]}
            minFontSize={64}
            maxFontSize={88}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            gap={20}
            className="w-full"
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            colors={[accentTitleColor, lightTitleColor]}
          />
        </div>
      </div>

      <div
        className="absolute inset-x-0 z-40 flex justify-center"
        style={{ top: bottomTop + bottomRowHeight - pillHeight - pillBottom }}
      >
        <div
          className="flex items-center justify-center rounded-full px-6"
          style={{
            width: pillWidth,
            height: pillHeight,
            backgroundColor: domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={20}
            maxFontSize={26}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainTextColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          />
        </div>
      </div>

      <Divider style={{ left: colWidth, top: 0, width: divider, height: sideTileHeight }} color={dividerColor} />
      <Divider style={{ left: colWidth + divider + colWidth, top: 0, width: divider, height: sideTileHeight }} color={dividerColor} />
      <Divider style={{ left: colWidth, top: upperBottomTop, width: divider, height: sideTileHeight }} color={dividerColor} />
      <Divider style={{ left: colWidth + divider + colWidth, top: upperBottomTop, width: divider, height: sideTileHeight }} color={dividerColor} />
      <Divider style={{ left: colWidth, top: centerBottomTop, width: divider, height: centerBottomHeight }} color={dividerColor} />
      <Divider style={{ left: colWidth + divider + colWidth, top: centerBottomTop, width: divider, height: centerBottomHeight }} color={dividerColor} />
      <Divider style={{ left: 0, top: sideTileHeight, width: colWidth, height: divider }} color={dividerColor} />
      <Divider style={{ left: colWidth + divider + colWidth + divider, top: sideTileHeight, width: colWidth, height: divider }} color={dividerColor} />
      <Divider style={{ left: colWidth + divider, top: centerTopHeight, width: colWidth, height: divider }} color={dividerColor} />
      <Divider style={{ left: bottomTileWidth, top: bottomTop, width: divider, height: bottomRowHeight }} color={dividerColor} />
    </div>
  );
}

function ImageTile({ src, alt, style }: { src: string; alt: string; style: CSSProperties }) {
  return (
    <div className="absolute overflow-hidden" style={style}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
    </div>
  );
}

function Divider({ style, color }: { style: CSSProperties; color: string }) {
  return <div className="absolute z-10" style={{ ...style, backgroundColor: color }} />;
}

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");
  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

const EMPHASIS_SINGLE_WORDS = new Set(["ideas", "colors", "decor", "looks", "styles", "style"]);
const EMPHASIS_TWO_WORD_SUFFIXES = [
  ["paint", "colors"],
  ["exterior", "ideas"],
  ["wall", "ideas"],
  ["accent", "walls"],
  ["accent", "wall"],
] as const;

function splitHeadlineTwoLines(title: string) {
  const safeTitle = title.trim() || "Earthy Bedroom Style";
  const words = safeTitle.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return {
      primaryLine: safeTitle,
      accentLine: "",
    };
  }

  if (words.length === 2) {
    return {
      primaryLine: words[0],
      accentLine: words[1],
    };
  }

  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z]/g, ""));
  let bestBreakIndex = Math.ceil(words.length / 2);
  let bestScore = Number.POSITIVE_INFINITY;

  for (let breakIndex = 1; breakIndex < words.length; breakIndex += 1) {
    const primaryLine = words.slice(0, breakIndex).join(" ");
    const accentLine = words.slice(breakIndex).join(" ");
    const primaryLength = primaryLine.replace(/[\s&-]+/g, "").length;
    const accentLength = accentLine.replace(/[\s&-]+/g, "").length;
    let score = Math.abs(primaryLength - accentLength) * 2 + Math.max(primaryLength, accentLength) * 0.18;

    if (breakIndex === 1 || breakIndex === words.length - 1) {
      score += 14;
    }
    if (primaryLength < 8 || accentLength < 8) {
      score += 10;
    }
    if (words[breakIndex - 1] === "&" || words[breakIndex] === "&") {
      score += 18;
    }
    if (hasEmphasisEnding(normalizedWords.slice(breakIndex))) {
      score -= 6;
    }

    if (score < bestScore) {
      bestBreakIndex = breakIndex;
      bestScore = score;
    }
  }

  return {
    primaryLine: words.slice(0, bestBreakIndex).join(" "),
    accentLine: words.slice(bestBreakIndex).join(" "),
  };
}

function hasEmphasisEnding(words: string[]) {
  if (words.length === 0) {
    return false;
  }

  const lastWord = words.at(-1);
  if (lastWord && EMPHASIS_SINGLE_WORDS.has(lastWord)) {
    return true;
  }

  return EMPHASIS_TWO_WORD_SUFFIXES.some(
    (suffix) => words.at(-2) === suffix[0] && words.at(-1) === suffix[1],
  );
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function mixHex(fromHex: string, toHex: string, amount: number) {
  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  if (!from || !to) {
    return fromHex;
  }
  const mix = (left: number, right: number) =>
    Math.round(left + (right - left) * Math.max(0, Math.min(1, amount)));
  return `#${[mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2])]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHex(value: string) {
  const normalized = value.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16)) as [number, number, number];
}

function pickBestContrastColor(backgroundHex: string, candidates: string[]) {
  const normalizedBackground = stripAlpha(backgroundHex);
  const validCandidates = candidates.map(stripAlpha).filter(isHexColor);
  if (!isHexColor(normalizedBackground) || validCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }
  return validCandidates.reduce((best, candidate) =>
    getContrastRatio(candidate, normalizedBackground) > getContrastRatio(best, normalizedBackground)
      ? candidate
      : best,
  );
}

function pickReadableColor(
  backgroundHex: string,
  candidates: string[],
  options?: {
    minContrast?: number;
  },
) {
  const minContrast = options?.minContrast ?? 4.5;
  const variants = buildReadableVariants(backgroundHex, candidates);

  if (!isHexColor(backgroundHex) || variants.length === 0) {
    return candidates.find(isHexColor) ?? candidates[0] ?? backgroundHex;
  }

  return variants
    .map(({ color, sourceIndex, variantIndex }) => {
      const contrast = getContrastRatio(color, backgroundHex);
      const meetsContrast = contrast >= minContrast;
      const score = (meetsContrast ? 1000 : contrast * 140) - sourceIndex * 6 - variantIndex;

      return { color, score };
    })
    .sort((left, right) => right.score - left.score)[0]?.color ?? candidates[0] ?? backgroundHex;
}

function buildReadableVariants(backgroundHex: string, candidates: string[]) {
  const targetHex = getRelativeLuminance(backgroundHex) < 0.42 ? "#fffdf8" : "#111111";
  const mixAmounts = [0, 0.16, 0.32, 0.48, 0.64];
  const variants: Array<{ color: string; sourceIndex: number; variantIndex: number }> = [];
  const seen = new Set<string>();

  candidates.filter(isHexColor).forEach((candidate, sourceIndex) => {
    mixAmounts.forEach((amount, variantIndex) => {
      const color = amount === 0 ? candidate : mixHex(candidate, targetHex, amount);
      if (seen.has(color)) {
        return;
      }

      seen.add(color);
      variants.push({ color, sourceIndex, variantIndex });
    });
  });

  return variants;
}

function stripAlpha(value: string) {
  const normalized = value.replace("#", "");
  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    return `#${normalized.slice(0, 6)}`;
  }
  return value;
}

function getContrastRatio(foregroundHex: string, backgroundHex: string) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string) {
  const normalized = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
