/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  lineOne: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.01em",
    lineHeight: 0.96,
    textTransform: "uppercase" as const,
  },
  lineTwo: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 0.98,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-libre-baskerville), var(--font-lora), serif",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 0.9,
  },
} as const;

const FALLBACK_TITLE = "Classy Bedroom Ideas";
const COMMON_SUFFIX_PAIRS = [
  ["decor", "ideas"],
  ["bedroom", "ideas"],
  ["porch", "ideas"],
  ["paint", "colors"],
  ["wall", "ideas"],
  ["makeover", "ideas"],
  ["makeovers", "ideas"],
  ["exterior", "ideas"],
  ["bathroom", "ideas"],
  ["kitchen", "ideas"],
] as const;
const FILLER_WORDS = new Set(["a", "an", "and", "for", "of", "the", "to", "with", "your"]);

export function TemplateFourImageSplitBandNumber({
  title,
  images,
  itemNumber,
  titleLocked,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const presetCategory = presetId ? getTemplateVisualPresetCategory(presetId) : "editorial-soft";
  const imageSet = normalizeImages(images);
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 23;
  const displayTitle = titleLocked ? normalizeLockedSplitBandTitle(title) : compactTitleToThreeWords(title);
  const [lineOne, lineTwo] = splitIntoOneAndTwoWords(displayTitle, titleLocked);

  const gutter = 6;
  const topRowHeight = 764;
  const bandHeight = 518;
  const bottomRowTop = topRowHeight + bandHeight;
  const bottomRowHeight = 1920 - bottomRowTop;
  const tileWidth = Math.floor((1080 - gutter) / 2);
  const rightLeft = tileWidth + gutter;
  const bandBackground = "#050505";
  const badgeSize = 286;
  const badgeTop = topRowHeight - 164;
  const badgeLeft = Math.round((1080 - badgeSize) / 2);
  const { badgeBackground, badgeBorder, numberColor, firstLineColor, secondLineColor } =
    resolveSplitBandColors(
      presetCategory,
      preset.palette,
      bandBackground,
    );

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: "#ffffff" }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{ left: 0, top: 0, width: tileWidth, height: topRowHeight }}
      />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{ left: rightLeft, top: 0, width: tileWidth, height: topRowHeight }}
      />

      <div
        className="absolute inset-x-0 z-10"
        style={{ top: topRowHeight, height: bandHeight, backgroundColor: bandBackground }}
      />

      <div
        className="absolute z-30 flex items-center justify-center rounded-full border-[6px] shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
        style={{
          left: badgeLeft,
          top: badgeTop,
          width: badgeSize,
          height: badgeSize,
          backgroundColor: badgeBackground,
          borderColor: badgeBorder,
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={110}
          maxFontSize={172}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[72%] text-center"
          textColor={numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute inset-x-0 z-20 flex flex-col items-center"
        style={{ top: topRowHeight + 148, height: bandHeight - 180 }}
      >
        <AutoFitText
          as="p"
          text={lineOne}
          minFontSize={84}
          maxFontSize={170}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.lineOne.lineHeight}
          className="w-[85%] text-center"
          textColor={firstLineColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.lineOne.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.lineOne.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.lineOne.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.lineOne.textTransform}
        />
        <div className="h-[18px]" />
        <AutoFitText
          as="p"
          text={lineTwo}
          minFontSize={68}
          maxFontSize={136}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.lineTwo.lineHeight}
          className="w-[85%] text-center"
          textColor={secondLineColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.lineTwo.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.lineTwo.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.lineTwo.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.lineTwo.textTransform}
        />
      </div>

      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{ left: 0, top: bottomRowTop, width: tileWidth, height: bottomRowHeight }}
      />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{ left: rightLeft, top: bottomRowTop, width: tileWidth, height: bottomRowHeight }}
      />
    </div>
  );
}

function resolveSplitBandColors(
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
  bandBackground: string,
) {
  const baseBadgeBackground =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.22), 0.08)
      : category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold" || category === "food-bold"
        ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.36), 0.2)
        : category === "earthy-warm"
          ? tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.3), 0.16)
          : tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.18), 0.18);

  const badgeBorder = ensureContrastColor(
    baseBadgeBackground,
    tintTowardsWhite(palette.divider, 0.44),
    [
      tintTowardsWhite(palette.title, 0.58),
      tintTowardsWhite(palette.number, 0.52),
      "#f3e3cf",
      "#d8c2a6",
    ],
    1.45,
  );

  const numberColor = ensureContrastColor(
    baseBadgeBackground,
    category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold" || category === "food-bold"
      ? deepenHex(mixHex(palette.number, palette.domain, 0.42), 0.16)
      : deepenHex(mixHex(palette.number, palette.title, 0.28), 0.2),
    [
      deepenHex(palette.domain, 0.26),
      deepenHex(palette.title, 0.3),
      "#151112",
      "#23160d",
    ],
    6.4,
  );

  const firstLineColor = ensureContrastColor(
    bandBackground,
    "#fffaf7",
    ["#ffffff", tintTowardsWhite(palette.canvas, 0.9), "#f8f4ef"],
    9,
  );

  const secondLinePreferred =
    category === "dark-drama"
      ? tintTowardsWhite(palette.divider, 0.18)
      : category === "earthy-warm"
        ? mixHex(tintTowardsWhite(palette.divider, 0.28), palette.title, 0.18)
        : category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
          ? tintTowardsWhite(mixHex(palette.divider, palette.title, 0.18), 0.1)
          : category === "feminine-bold"
            ? tintTowardsWhite(mixHex(palette.divider, palette.title, 0.14), 0.14)
            : tintTowardsWhite(mixHex(palette.divider, palette.title, 0.24), 0.2);

  const secondLineColor = ensureContrastColor(
    bandBackground,
    secondLinePreferred,
    [
      tintTowardsWhite(palette.divider, 0.24),
      tintTowardsWhite(palette.title, 0.42),
      tintTowardsWhite(palette.number, 0.38),
      "#ffe28a",
      "#9fe4db",
      "#ffffff",
    ],
    4.7,
  );

  return {
    badgeBackground: baseBadgeBackground,
    badgeBorder,
    numberColor,
    firstLineColor,
    secondLineColor,
  };
}

function ImageTile({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style: CSSProperties;
}) {
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

function splitIntoOneAndTwoWords(title: string, titleLocked?: boolean) {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    return titleLocked
      ? [words[0]?.toUpperCase() ?? "", words.slice(1).join(" ").toUpperCase()]
      : ["CLASSY", "BEDROOM IDEAS"];
  }

  if (titleLocked) {
    return [words[0].toUpperCase(), words.slice(1).join(" ").toUpperCase()];
  }

  return [words[0].toUpperCase(), `${words[1]} ${words[2]}`.toUpperCase()];
}

function compactTitleToThreeWords(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  const words = safeTitle.split(/\s+/).filter(Boolean);
  const normalized = words.map(normalizeWord);
  const meaningful = words.filter((word, index) => {
    const normalizedWord = normalized[index];
    return normalizedWord.length > 0 && !/^\d+$/.test(normalizedWord) && !FILLER_WORDS.has(normalizedWord);
  });
  const pool = meaningful.length >= 3 ? meaningful : words.filter((word) => normalizeWord(word).length > 0);

  if (pool.length === 3) {
    return toTitleCase(pool.join(" "));
  }

  if (pool.length === 2) {
    return toTitleCase(`${pool[0]} ${pool[1]} Ideas`);
  }

  if (pool.length === 1) {
    return toTitleCase(`${pool[0]} Style Ideas`);
  }

  const normalizedPool = pool.map(normalizeWord);
  for (const suffix of COMMON_SUFFIX_PAIRS) {
    const suffixStart = normalizedPool.length - 2;
    if (
      suffixStart >= 1 &&
      normalizedPool[suffixStart] === suffix[0] &&
      normalizedPool[suffixStart + 1] === suffix[1]
    ) {
      return toTitleCase([pool[0], pool[suffixStart], pool[suffixStart + 1]].join(" "));
    }
  }

  if (pool.length > 3) {
    const candidate = [pool[0], pool[1], pool[2]];
    return toTitleCase(candidate.join(" "));
  }

  return FALLBACK_TITLE;
}

function normalizeLockedSplitBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  return safeTitle.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
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

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
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

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  const candidates = [preferredHex, ...fallbacks].filter((value, index, array) => array.indexOf(value) === index);
  const passing = candidates.filter((candidate) => getContrastRatio(candidate, backgroundHex) >= minimumRatio);
  if (passing.length > 0) {
    return passing[0];
  }
  return candidates[0] ?? preferredHex;
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
