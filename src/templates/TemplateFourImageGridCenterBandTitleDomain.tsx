/* eslint-disable @next/next/no-img-element */

import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TITLE_STACK = {
  title: {
    fontFamily: "var(--font-alata), var(--font-space-grotesk), sans-serif",
    fontWeight: 400,
    letterSpacing: "0.024em",
    lineHeight: 0.98,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    textTransform: "none" as const,
  },
} as const;

const FALLBACK_TITLE = "Colorful Small Front Porch Ideas In Budget";
const STOPWORDS = new Set(["a", "an", "and", "for", "of", "the", "to", "with", "your"]);

export function TemplateFourImageGridCenterBandTitleDomain({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const category = presetId ? getTemplateVisualPresetCategory(presetId) : "editorial-soft";
  const imageSet = normalizeImages(images);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : null;
  const compactTitle = compactCenterBandTitle(title);
  const lines = splitCenterBandTitle(compactTitle, displayNumber);

  const gutter = 6;
  const tileWidth = Math.floor((1080 - gutter) / 2);
  const tileHeight = 640;
  const secondColumnLeft = tileWidth + gutter;
  const bandTop = tileHeight;
  const bandHeight = 548;
  const bottomTop = bandTop + bandHeight;
  const bottomHeight = 1920 - bottomTop - 96;
  const footerHeight = 96;
  const { bandBackground, railColor, titleColors, domainColor } = resolveColors(
    category,
    preset.palette,
  );

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: "#ffffff" }}
    >
      <ImageTile src={imageSet[0]} alt={title} style={{ left: 0, top: 0, width: tileWidth, height: tileHeight }} />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{ left: secondColumnLeft, top: 0, width: tileWidth, height: tileHeight }}
      />

      <div
        className="absolute inset-x-0 z-10"
        style={{ top: bandTop, height: bandHeight, backgroundColor: bandBackground }}
      />
      <div className="absolute inset-x-0 z-20" style={{ top: bandTop, height: 12, backgroundColor: railColor }} />
      <div
        className="absolute inset-x-0 z-20"
        style={{ top: bandTop + bandHeight - 12, height: 12, backgroundColor: railColor }}
      />

      <div
        className="absolute inset-x-0 z-30 flex flex-col items-center"
        style={{ top: bandTop + 46, height: bandHeight - 92 }}
      >
        <AutoFitLineStack
          lines={lines}
          minFontSize={72}
          maxFontSize={134}
          lineHeight={TITLE_STACK.title.lineHeight}
          gap={8}
          className="w-[95.5%]"
          textAlign="center"
          fontFamily={TITLE_STACK.title.fontFamily}
          fontWeight={TITLE_STACK.title.fontWeight}
          letterSpacing={TITLE_STACK.title.letterSpacing}
          textTransform={TITLE_STACK.title.textTransform}
          colors={titleColors}
        />
      </div>

      <ImageTile src={imageSet[2]} alt={title} style={{ left: 0, top: bottomTop, width: tileWidth, height: bottomHeight }} />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{ left: secondColumnLeft, top: bottomTop, width: tileWidth, height: bottomHeight }}
      />

      <div
        className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center px-16 text-center"
        style={{ height: footerHeight, backgroundColor: "#ffffff" }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={28}
          maxFontSize={40}
          maxLines={1}
          lineHeight={TITLE_STACK.domain.lineHeight}
          className="w-full max-w-[760px]"
          textColor={domainColor}
          fontFamily={TITLE_STACK.domain.fontFamily}
          fontWeight={TITLE_STACK.domain.fontWeight}
          letterSpacing={TITLE_STACK.domain.letterSpacing}
          textTransform={TITLE_STACK.domain.textTransform}
        />
      </div>
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

function normalizeImages(images: string[]) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");
  return [
    safeImages[0] ?? fallback,
    safeImages[1] ?? safeImages[0] ?? fallback,
    safeImages[2] ?? safeImages[1] ?? safeImages[0] ?? fallback,
    safeImages[3] ?? safeImages[2] ?? safeImages[1] ?? safeImages[0] ?? fallback,
  ];
}

function compactCenterBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  const words = cutWeakClauseWords(safeTitle.split(/\s+/).filter(Boolean));
  const filtered = words.filter((word) => {
    const normalized = normalizeWord(word);
    return normalized && !STOPWORDS.has(normalized);
  });
  const pool = filtered.length >= 4 ? filtered : words;

  return toTitleCase(pool.slice(0, Math.min(5, pool.length)).join(" "));
}

function splitCenterBandTitle(title: string, itemNumber: number | null) {
  const words = title.split(/\s+/).filter(Boolean);
  const displayWords = itemNumber ? [String(itemNumber), ...words] : words;
  return balanceThreeLines(displayWords);
}

function balanceThreeLines(words: string[]) {
  if (words.length <= 3) {
    return [
      words[0] ?? "Colorful",
      words[1] ?? "Front Porch",
      words[2] ?? "Ideas",
    ];
  }

  let best = [
    words.slice(0, 2).join(" "),
    words.slice(2, 4).join(" "),
    words.slice(4).join(" ") || words[words.length - 1],
  ];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let firstBreak = 1; firstBreak < words.length - 1; firstBreak += 1) {
    for (let secondBreak = firstBreak + 1; secondBreak < words.length; secondBreak += 1) {
      const candidate = [
        words.slice(0, firstBreak).join(" "),
        words.slice(firstBreak, secondBreak).join(" "),
        words.slice(secondBreak).join(" "),
      ];

      if (candidate.some((line) => line.length === 0)) {
        continue;
      }

      const lengths = candidate.map((line) => line.replace(/\s+/g, "").length);
      const maxLength = Math.max(...lengths);
      const minLength = Math.min(...lengths);
      const lineCountPenalty = candidate.reduce((penalty, line) => {
        const wordCount = line.split(/\s+/).filter(Boolean).length;
        return penalty + (wordCount > 2 ? 4 : 0);
      }, 0);
      const tinyLastLinePenalty = lengths[2] <= 5 ? 2 : 0;
      const score = maxLength - minLength + lineCountPenalty + tinyLastLinePenalty;

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
  }

  return best;
}

function resolveColors(
  category:
    | "editorial-soft"
    | "pastel-soft"
    | "earthy-warm"
    | "dark-drama"
    | "graphic-pop"
    | "fresh-vivid"
    | "feminine-bold",
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
  const bandBackground = "#ffffff";
  const railColor =
    category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold"
      ? palette.divider
      : mixHex(palette.divider, palette.title, 0.18);
  const titleAccentA =
    category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold"
      ? deepenHex(mixHex(palette.title, palette.divider, 0.15), 0.18)
      : deepenHex(mixHex(palette.title, palette.footer, 0.2), 0.22);
  const titleAccentB =
    category === "pastel-soft" || category === "editorial-soft"
      ? deepenHex(mixHex(palette.footer, palette.number, 0.22), 0.22)
      : category === "feminine-bold"
        ? deepenHex(mixHex(palette.footer, palette.title, 0.18), 0.18)
        : deepenHex(mixHex(palette.footer, palette.title, 0.12), 0.18);
  const titleAccentC =
    category === "dark-drama"
      ? deepenHex(tintTowardsWhite(palette.number, 0.2), 0.34)
      : category === "earthy-warm"
        ? deepenHex(mixHex(palette.divider, palette.number, 0.56), 0.1)
        : category === "feminine-bold"
          ? deepenHex(mixHex(palette.number, palette.divider, 0.7), 0.12)
          : category === "fresh-vivid" || category === "graphic-pop"
            ? deepenHex(mixHex(palette.divider, palette.number, 0.5), 0.12)
            : deepenHex(mixHex(palette.divider, palette.number, 0.62), 0.12);
  const titleColors = [
    ensureContrastColor(bandBackground, titleAccentA, ["#8c2f54", "#3a2f2a"], 4.8),
    ensureContrastColor(bandBackground, titleAccentB, ["#4c3d35", "#5a4538"], 4.8),
    ensureContrastColor(bandBackground, titleAccentC, ["#1c7f7f", "#5b4a44"], 4.8),
  ];
  const domainColor = ensureContrastColor(
    "#ffffff",
    deepenHex(mixHex(palette.domain, palette.title, 0.25), 0.16),
    ["#2f2924", deepenHex(palette.footer, 0.2)],
    7,
  );

  return {
    bandBackground,
    railColor,
    titleColors,
    domainColor,
  };
}

function cutWeakClauseWords(words: string[]) {
  const weakClauseWords = new Set(["that", "for", "with", "while", "when", "because", "where", "which"]);
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

  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  const candidates = [preferredHex, ...fallbacks].filter(
    (value, index, array) => array.indexOf(value) === index,
  );
  const passing = candidates.filter(
    (candidate) => getContrastRatio(candidate, backgroundHex) >= minimumRatio,
  );
  return passing[0] ?? candidates[0] ?? preferredHex;
}

function getContrastRatio(colorA: string, colorB: string) {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string) {
  const rgb = parseHex(hex);
  if (!rgb) {
    return 0;
  }

  const channels = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
