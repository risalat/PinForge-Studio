/* eslint-disable @next/next/no-img-element */

import { AutoFitLinePair } from "@/components/AutoFitLinePair";
import { AutoFitText } from "@/components/AutoFitText";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  script: {
    fontFamily: "var(--font-parisienne), var(--font-satisfy), var(--font-segoe-script), cursive",
    fontWeight: 400,
    letterSpacing: "0",
    lineHeight: 1.04,
    textTransform: "none" as const,
  },
  title: {
    fontFamily: "var(--font-alata), var(--font-space-grotesk), sans-serif",
    fontWeight: 400,
    letterSpacing: "0.024em",
    lineHeight: 0.98,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-alata), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 0.9,
  },
  domain: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    textTransform: "none" as const,
  },
} as const;

const FALLBACK_TITLE = "Lovely Bedroom Decor Ideas";
const STOPWORDS = new Set(["a", "an", "and", "for", "in", "of", "the", "to", "with", "your"]);

export function TemplateFiveImageCenterBandNumberDomain({
  title,
  images,
  domain,
  itemNumber,
  titleLocked,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const category = presetId ? getTemplateVisualPresetCategory(presetId) : "editorial-soft";
  const imageSet = normalizeImages(images, 5);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 24;
  const compactTitle = titleLocked ? normalizeLockedCenterBandTitle(title) : compactCenterBandTitle(title);
  const titleLines = splitCenterBandTitle(compactTitle, titleLocked);
  const colors = resolveTemplateColors(category, preset.palette);

  const topGutter = 6;
  const sideInset = 10;
  const frameWidth = 1080 - sideInset * 2;
  const topTileWidth = Math.floor((frameWidth - topGutter) / 2);
  const topTileHeight = 520;
  const topRowTop = 10;
  const bandTop = topRowTop + topTileHeight + topGutter;
  const bandHeight = 736;
  const bandBottom = bandTop + bandHeight;
  const bottomTileHeight = 1920 - bandBottom;
  const bottomGutter = 6;
  const bottomTileWidth = Math.floor((frameWidth - bottomGutter * 2) / 3);
  const secondBottomLeft = sideInset + bottomTileWidth + bottomGutter;
  const thirdBottomLeft = secondBottomLeft + bottomTileWidth + bottomGutter;
  const numberCardWidth = 236;
  const numberCardHeight = 148;
  const numberCardLeft = 66;
  const numberCardTop = bandTop + 40;
  const scriptLineLeft = numberCardLeft + numberCardWidth + 28;
  const scriptLineHeight = 102;
  const scriptLineTop = numberCardTop + numberCardHeight - scriptLineHeight;
  const scriptLineWidth = frameWidth - (scriptLineLeft - sideInset) - 72;
  const titlePairLeft = 48;
  const titlePairTop = numberCardTop + numberCardHeight + 76;
  const titlePairWidth = frameWidth - 96;
  const titlePairHeight = 170;
  const domainPillWidth = 378;
  const domainPillHeight = 112;
  const domainPillTop = bandTop + 584;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: colors.canvasBackground }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{ left: sideInset, top: topRowTop, width: topTileWidth, height: topTileHeight }}
      />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{
          left: sideInset + topTileWidth + topGutter,
          top: topRowTop,
          width: topTileWidth,
          height: topTileHeight,
        }}
      />

      <div
        className="absolute z-10"
        style={{
          left: sideInset,
          top: bandTop,
          width: frameWidth,
          height: bandHeight,
          backgroundColor: colors.bandBackground,
        }}
      />

      <div
        className="absolute z-20"
        style={{
          left: sideInset,
          top: bandTop,
          width: frameWidth,
          height: 8,
          backgroundColor: colors.bandRailColor,
        }}
      />
      <div
        className="absolute z-20"
        style={{
          left: sideInset,
          top: bandBottom - 8,
          width: frameWidth,
          height: 8,
          backgroundColor: colors.bandRailColor,
        }}
      />

      <div
        className="absolute z-30 flex items-center justify-center rounded-full shadow-[0_12px_30px_rgba(67,45,24,0.08)]"
        style={{
          left: numberCardLeft,
          top: numberCardTop,
          width: numberCardWidth,
          height: numberCardHeight,
          backgroundColor: colors.numberCardBackground,
          border: `4px solid ${colors.numberCardBorder}`,
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={86}
          maxFontSize={126}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[64%] text-center"
          textColor={colors.numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute z-30 flex items-center"
        style={{
          left: scriptLineLeft,
          top: scriptLineTop,
          width: scriptLineWidth,
          height: scriptLineHeight,
        }}
      >
        <AutoFitText
          as="p"
          text={titleLines.script}
          minFontSize={62}
          maxFontSize={108}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.script.lineHeight}
          className="w-full text-center"
          textColor={colors.scriptColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.script.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.script.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.script.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.script.textTransform}
        />
      </div>

      <div
        className="absolute z-30 flex items-center"
        style={{
          left: titlePairLeft,
          top: titlePairTop,
          width: titlePairWidth,
          height: titlePairHeight,
        }}
      >
        <AutoFitLinePair
          lines={titleLines.lower}
          minFontSize={64}
          maxFontSize={112}
          lineHeight={1.08}
          gap={20}
          className="w-full"
          textAlign="center"
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          colors={[colors.titleLineTwoColor, colors.titleLineThreeColor]}
        />
      </div>

      <div
        className="absolute inset-x-0 z-30 flex justify-center"
        style={{ top: domainPillTop }}
      >
        <div
          className="flex items-center justify-center px-8 shadow-[0_8px_20px_rgba(67,45,24,0.06)]"
          style={{
            width: domainPillWidth,
            height: domainPillHeight,
            backgroundColor: colors.domainPillBackground,
            border: `2px solid ${colors.domainPillBorder}`,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={28}
            maxFontSize={40}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={colors.domainTextColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
          />
        </div>
      </div>

      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{ left: sideInset, top: bandBottom, width: bottomTileWidth, height: bottomTileHeight }}
      />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{
          left: secondBottomLeft,
          top: bandBottom,
          width: bottomTileWidth,
          height: bottomTileHeight,
        }}
      />
      <ImageTile
        src={imageSet[4]}
        alt={title}
        style={{
          left: thirdBottomLeft,
          top: bandBottom,
          width: bottomTileWidth,
          height: bottomTileHeight,
        }}
      />
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

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");

  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function compactCenterBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  const words = cutWeakClauseWords(safeTitle.split(/\s+/).filter(Boolean));
  const filtered = words.filter((word) => {
    const normalized = normalizeWord(word);
    return normalized !== "" && !STOPWORDS.has(normalized) && !/^\d+$/.test(normalized);
  });
  const pool =
    filtered.length >= 4 ? filtered : words.filter((word) => !/^\d+$/.test(normalizeWord(word)));
  const bounded = pool.slice(0, Math.min(6, pool.length));

  if (bounded.length >= 4) {
    return toTitleCase(bounded.join(" "));
  }

  if (bounded.length === 3) {
    return toTitleCase(bounded.join(" "));
  }

  if (bounded.length === 2) {
    return toTitleCase([...bounded, "Decor", "Ideas"].join(" "));
  }

  if (bounded.length === 1) {
    return toTitleCase([bounded[0], "Bedroom", "Decor", "Ideas"].join(" "));
  }

  return FALLBACK_TITLE;
}

function splitCenterBandTitle(title: string, titleLocked?: boolean) {
  return balanceThreeLines(title.split(/\s+/).filter(Boolean), titleLocked);
}

function balanceThreeLines(words: string[], titleLocked?: boolean) {
  if (words.length <= 3) {
    return {
      script: words[0] ?? "Lovely",
      lower: titleLocked
        ? [words[1] ?? "", words[2] ?? ""] as [string, string]
        : [words[1] ?? "Bedroom", words[2] ?? "Ideas"] as [string, string],
    };
  }

  let best = {
    script: words[0] ?? "Beautiful",
    lower: [
      words.slice(1, 2).join(" ") || "Bedroom",
      words.slice(2).join(" ") || "Decor Ideas",
    ] as [string, string],
  };
  let bestScore = Number.POSITIVE_INFINITY;

  const maxFirstBreak = Math.min(2, words.length - 2);
  for (let firstBreak = 1; firstBreak <= maxFirstBreak; firstBreak += 1) {
    for (let secondBreak = firstBreak + 1; secondBreak < words.length; secondBreak += 1) {
      const script = words.slice(0, firstBreak).join(" ");
      const lowerOne = words.slice(firstBreak, secondBreak).join(" ");
      const lowerTwo = words.slice(secondBreak).join(" ");
      if (!script || !lowerOne || !lowerTwo) {
        continue;
      }

      const lowerLengths = [lowerOne, lowerTwo].map((line) => line.replace(/\s+/g, "").length);
      const lowerBalance = Math.abs(lowerLengths[0] - lowerLengths[1]);
      const scriptWordCount = script.split(/\s+/).filter(Boolean).length;
      const lowerWordPenalty =
        (lowerOne.split(/\s+/).filter(Boolean).length > 2 ? 4 : 0) +
        (lowerTwo.split(/\s+/).filter(Boolean).length > 2 ? 4 : 0);
      const scriptPenalty = scriptWordCount === 2 ? 0 : scriptWordCount === 1 ? 2 : 4;
      const shortLastPenalty = lowerLengths[1] <= 4 ? 3 : 0;
      const score = lowerBalance + lowerWordPenalty + scriptPenalty + shortLastPenalty;

      if (score < bestScore) {
        bestScore = score;
        best = {
          script: toTitleCase(script),
          lower: [lowerOne, lowerTwo],
        };
      }
    }
  }

  return best;
}

function normalizeLockedCenterBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  return safeTitle.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
}

function resolveTemplateColors(
  category:
    | "editorial-soft"
    | "pastel-soft"
    | "earthy-warm"
    | "dark-drama"
    | "graphic-pop"
    | "fresh-vivid"
    | "feminine-bold"
    | "food-bold",
  palette: {
    canvas: string;
    band: string;
    footer: string;
    divider: string;
    title: string;
    subtitle: string;
    domain: string;
    number: string;
  },
) {
  const canvasBackground = mixHex("#f7f1e8", palette.canvas, 0.16);
  const bandBackground =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.28), 0.72)
      : category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold" || category === "food-bold"
        ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.38), 0.44)
        : tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.22), 0.3);
  const bandRailColor =
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.divider, palette.title, 0.24), 0.1)
      : deepenHex(mixHex(palette.divider, palette.footer, 0.2), 0.1);
  const numberCardBackground = tintTowardsWhite(mixHex(bandBackground, palette.canvas, 0.12), 0.92);
  const numberCardBorder = ensureContrastColor(
    numberCardBackground,
    deepenHex(mixHex(palette.divider, palette.footer, 0.2), 0.08),
    [deepenHex(palette.title, 0.18), "#8f7759"],
    1.8,
  );
  const numberColor = ensureContrastColor(
    numberCardBackground,
    deepenHex(mixHex(palette.number, palette.title, 0.3), 0.16),
    [deepenHex(palette.footer, 0.18), "#5b4332"],
    4.8,
  );
  const scriptColor = ensureContrastColor(
    bandBackground,
    category === "feminine-bold"
      ? deepenHex(mixHex(palette.title, palette.subtitle, 0.34), 0.08)
      : deepenHex(mixHex(palette.title, palette.footer, 0.22), 0.1),
    ["#9f6a49", "#7b5842"],
    4.8,
  );
  const titleLineTwoColor = ensureContrastColor(
    bandBackground,
    category === "dark-drama"
      ? deepenHex(tintTowardsWhite(palette.footer, 0.18), 0.36)
      : deepenHex(mixHex(palette.footer, palette.number, 0.18), 0.2),
    ["#46362d", "#5a4639"],
    4.8,
  );
  const titleLineThreeColor = ensureContrastColor(
    bandBackground,
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.number, palette.divider, 0.52), 0.12)
      : category === "feminine-bold"
        ? deepenHex(mixHex(palette.number, palette.subtitle, 0.5), 0.14)
        : deepenHex(mixHex(palette.number, palette.domain, 0.5), 0.18),
    ["#406257", "#744d35"],
    4.8,
  );
  const domainPillBackground =
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? tintTowardsWhite(mixHex(palette.domain, palette.divider, 0.52), 0.74)
      : category === "feminine-bold"
        ? tintTowardsWhite(mixHex(palette.subtitle, palette.domain, 0.48), 0.8)
        : category === "dark-drama"
          ? tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.34), 0.82)
          : tintTowardsWhite(mixHex(palette.domain, bandBackground, 0.26), 0.9);
  const domainPillBorder = ensureContrastColor(
    domainPillBackground,
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.divider, palette.domain, 0.34), 0.08)
      : category === "feminine-bold"
        ? deepenHex(mixHex(palette.subtitle, palette.title, 0.34), 0.08)
        : mixHex(numberCardBorder, palette.divider, 0.3),
    [bandRailColor, deepenHex(palette.domain, 0.16), "#b9aa98"],
    1.8,
  );
  const domainTextColor = ensureContrastColor(
    domainPillBackground,
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.footer, palette.domain, 0.24), 0.2)
      : category === "feminine-bold"
        ? deepenHex(mixHex(palette.title, palette.footer, 0.4), 0.16)
        : deepenHex(mixHex(palette.domain, palette.footer, 0.26), 0.14),
    [deepenHex(palette.title, 0.2), deepenHex(palette.footer, 0.24), "#3f322b"],
    6.2,
  );

  return {
    canvasBackground,
    bandBackground,
    bandRailColor,
    numberCardBackground,
    numberCardBorder,
    numberColor,
    scriptColor,
    titleLineTwoColor,
    titleLineThreeColor,
    domainPillBackground,
    domainPillBorder,
    domainTextColor,
  };
}

function cutWeakClauseWords(words: string[]) {
  const weakClauseWords = new Set(["that", "for", "with", "while", "when", "because", "where", "which", "from"]);
  const weakClauseIndex = words.findIndex(
    (word, index) => index >= 3 && weakClauseWords.has(word.toLowerCase().replace(/[^a-z]/g, "")),
  );
  return weakClauseIndex > 0 ? words.slice(0, weakClauseIndex) : words;
}

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function ensureContrastColor(
  backgroundHex: string,
  primaryCandidate: string,
  fallbackCandidates: string[],
  minimumContrast: number,
) {
  const candidates = [primaryCandidate, ...fallbackCandidates];
  for (const candidate of candidates) {
    if (contrastRatio(backgroundHex, candidate) >= minimumContrast) {
      return candidate;
    }
  }

  return contrastRatio(backgroundHex, "#1c1713") >= contrastRatio(backgroundHex, "#ffffff")
    ? "#1c1713"
    : "#ffffff";
}

function contrastRatio(backgroundHex: string, foregroundHex: string) {
  const background = parseHex(backgroundHex);
  const foreground = parseHex(foregroundHex);
  if (!background || !foreground) {
    return 1;
  }

  const backgroundLuminance = relativeLuminance(background);
  const foregroundLuminance = relativeLuminance(foreground);
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance([red, green, blue]: [number, number, number]) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
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

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function parseHex(value: string) {
  const normalized = value.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}
