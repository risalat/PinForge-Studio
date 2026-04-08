/* eslint-disable @next/next/no-img-element */

import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.012em",
    lineHeight: 0.9,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-league-spartan), var(--font-antonio), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 0.9,
  },
  domain: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 800,
    letterSpacing: "0.1em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

const FALLBACK_TITLE = "Bedroom Decor Ideas You'll Copy";
const JOINER_WORDS = new Set(["a", "an", "and", "for", "in", "of", "the", "to", "with", "your"]);

export function TemplateHeroArchSidebarTriptych({
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
  const imageSet = normalizeImages(images, 4);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 17;
  const compactTitle = titleLocked ? normalizeLockedTitle(title) : compactPosterTitle(title);
  const titleLines = splitPosterTitle(compactTitle);
  const colors = resolveTemplateColors(category, preset.palette);
  const titleLineColors = buildSidebarLineColors(titleLines.length, colors);

  const frameInset = 14;
  const canvasWidth = 1080;
  const canvasHeight = 1920;
  const sidebarWidth = 326;
  const heroLeft = frameInset + sidebarWidth;
  const heroRightInset = frameInset;
  const heroTop = 14;
  const heroWidth = canvasWidth - heroLeft - heroRightInset;
  const heroHeight = 1320;
  const heroBorder = 16;
  const archRadius = 290;
  const triptychTop = 1396;
  const triptychGutter = 8;
  const triptychWidth = canvasWidth - frameInset * 2;
  const triptychTileWidth = Math.floor((triptychWidth - triptychGutter * 2) / 3);
  const triptychHeight = canvasHeight - triptychTop - frameInset;
  const numberBadgeSize = 232;
  const numberBadgeLeft = frameInset + 34;
  const numberBadgeTop = 40;
  const titleFrameTop = numberBadgeTop + numberBadgeSize + 34;
  const titleFrameHeight = 620;
  const titleFrameWidth = sidebarWidth - 36;
  const titleFrameLeft = frameInset + 18;
  const domainPillWidth = sidebarWidth - 36;
  const domainPillHeight = 76;
  const domainPillLeft = frameInset + 28;
  const domainPillTop = 1232;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: colors.canvasBackground }}
    >
      <div
        className="absolute"
        style={{
          left: frameInset,
          top: frameInset,
          width: sidebarWidth,
          height: canvasHeight - frameInset * 2,
          backgroundColor: colors.sidebarBackground,
        }}
      />

      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          left: numberBadgeLeft,
          top: numberBadgeTop,
          width: numberBadgeSize,
          height: numberBadgeSize,
          backgroundColor: colors.numberBadgeBackground,
          border: `5px solid ${colors.numberBadgeBorder}`,
          boxShadow: "0 14px 30px rgba(31, 22, 19, 0.12)",
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={92}
          maxFontSize={154}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[72%] text-center"
          textColor={colors.numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute"
        style={{
          left: titleFrameLeft,
          top: titleFrameTop,
          width: titleFrameWidth,
          height: titleFrameHeight,
        }}
      >
        <AutoFitLineStack
          lines={titleLines}
          minFontSize={60}
          maxFontSize={138}
          lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
          gap={12}
          className="w-full"
          textAlign="left"
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          colors={titleLineColors}
        />
      </div>

      <div
        className="absolute z-20 flex items-center justify-center rounded-full"
        style={{
          left: domainPillLeft,
          top: domainPillTop,
          width: domainPillWidth,
          height: domainPillHeight,
          backgroundColor: colors.domainPillBackground,
          border: `3px solid ${colors.domainRuleColor}`,
          boxShadow: "0 12px 26px rgba(31, 22, 19, 0.08)",
        }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={16}
          maxFontSize={24}
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

      <div
        className="absolute overflow-hidden"
        style={{
          left: heroLeft,
          top: heroTop,
          width: heroWidth,
          height: heroHeight,
          backgroundColor: colors.heroFrameColor,
          borderTopLeftRadius: `${archRadius}px`,
          borderTopRightRadius: `${archRadius}px`,
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
        }}
      >
        <div
          className="absolute overflow-hidden"
          style={{
            left: heroBorder,
            top: heroBorder,
            width: heroWidth - heroBorder * 2,
            height: heroHeight - heroBorder * 2,
            borderTopLeftRadius: `${archRadius - heroBorder}px`,
            borderTopRightRadius: `${archRadius - heroBorder}px`,
            borderBottomLeftRadius: "0px",
            borderBottomRightRadius: "0px",
          }}
        >
          <img
            src={imageSet[0]}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(17,9,7,0.08) 100%)",
            }}
          />
        </div>
      </div>

      <TriptychTile
        src={imageSet[1]}
        alt={title}
        style={{
          left: frameInset,
          top: triptychTop,
          width: triptychTileWidth,
          height: triptychHeight,
        }}
      />
      <TriptychTile
        src={imageSet[2]}
        alt={title}
        style={{
          left: frameInset + triptychTileWidth + triptychGutter,
          top: triptychTop,
          width: triptychTileWidth,
          height: triptychHeight,
        }}
      />
      <TriptychTile
        src={imageSet[3]}
        alt={title}
        style={{
          left: frameInset + (triptychTileWidth + triptychGutter) * 2,
          top: triptychTop,
          width: triptychTileWidth,
          height: triptychHeight,
        }}
      />
    </div>
  );
}

function TriptychTile({ src, alt, style }: { src: string; alt: string; style: CSSProperties }) {
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

function compactPosterTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  const words = cutWeakClauseWords(safeTitle.split(/\s+/).filter(Boolean));
  const pool = words.filter((word) => !/^\d+$/.test(normalizeWord(word)));
  const bounded = pool.slice(0, Math.min(6, pool.length));
  return bounded.length > 0 ? toTitleCase(bounded.join(" ")) : FALLBACK_TITLE;
}

function normalizeLockedTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  return safeTitle.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
}

function splitPosterTitle(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return ["Bedroom", "Decor", "Ideas", "You'll Copy"];
  }

  const lines: string[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const normalized = normalizeWord(word);
    const nextWord = words[index + 1];
    const nextNormalized = normalizeWord(nextWord ?? "");

    if (JOINER_WORDS.has(normalized) && lines.length > 0) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
      continue;
    }

    if (nextWord && JOINER_WORDS.has(nextNormalized)) {
      lines.push(`${word} ${nextWord}`);
      index += 1;
      continue;
    }

    lines.push(word);
  }

  while (lines.length > 5) {
    const tail = lines.pop();
    if (!tail) {
      break;
    }
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${tail}`;
  }

  return lines;
}

function buildSidebarLineColors(
  count: number,
  colors: { titleLineOne: string; titleLineTwo: string; titleLineThree: string },
) {
  const palette = [colors.titleLineOne, colors.titleLineTwo, colors.titleLineThree];
  return Array.from({ length: count }, (_, index) => palette[index % palette.length]);
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
  const canvasBackground =
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.2), 0.18)
      : tintTowardsWhite(mixHex("#f6efe7", palette.canvas, 0.12), 0.08);
  const sidebarBackground =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.16), 0.08)
      : category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
        ? tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.4), 0.28)
        : tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.24), 0.42);
  const heroFrameColor =
    category === "dark-drama"
      ? deepenHex(mixHex(palette.footer, palette.divider, 0.3), 0.12)
      : deepenHex(mixHex(palette.divider, palette.canvas, 0.1), 0.06);
  const sidebarIsDark = isDarkSurface(sidebarBackground);
  const numberBadgeBackground = tintTowardsWhite(mixHex(sidebarBackground, palette.canvas, 0.22), 0.96);
  const numberBadgeBorder = ensureContrastColor(
    numberBadgeBackground,
    deepenHex(mixHex(palette.divider, palette.footer, 0.24), 0.08),
    [deepenHex(palette.title, 0.18), "#8f7759"],
    1.8,
  );
  const numberColor = ensureContrastColor(
    numberBadgeBackground,
    deepenHex(mixHex(palette.number, palette.title, 0.32), 0.14),
    [deepenHex(palette.footer, 0.18), "#4d3527"],
    4.8,
  );
  const titleLineOne = ensureContrastColor(
    sidebarBackground,
    sidebarIsDark
      ? tintTowardsWhite(mixHex(palette.canvas, palette.title, 0.18), 0.94)
      : deepenHex(mixHex(palette.title, palette.footer, 0.18), 0.14),
    sidebarIsDark
      ? [
          tintTowardsWhite(mixHex(palette.divider, palette.canvas, 0.3), 0.88),
          "#fffaf1",
        ]
      : [deepenHex(palette.footer, 0.2), "#2b211b"],
    5.2,
  );
  const titleLineTwo = ensureContrastColor(
    sidebarBackground,
    sidebarIsDark
      ? tintTowardsWhite(
          category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
            ? mixHex(palette.divider, palette.domain, 0.36)
            : mixHex(palette.number, palette.domain, 0.34),
          0.74,
        )
      : category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
        ? deepenHex(mixHex(palette.number, palette.domain, 0.42), 0.12)
        : category === "feminine-bold"
          ? deepenHex(mixHex(palette.domain, palette.subtitle, 0.4), 0.1)
          : deepenHex(mixHex(palette.domain, palette.footer, 0.28), 0.14),
    sidebarIsDark
      ? [
          tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.2), 0.92),
          "#fffaf1",
        ]
      : [deepenHex(palette.title, 0.2), "#3c2f28"],
    5.2,
  );
  const titleLineThree = ensureContrastColor(
    sidebarBackground,
    sidebarIsDark
      ? tintTowardsWhite(
          category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
            ? mixHex(palette.title, palette.divider, 0.28)
            : mixHex(palette.number, palette.title, 0.3),
          0.84,
        )
      : category === "feminine-bold"
        ? deepenHex(mixHex(palette.number, palette.title, 0.4), 0.08)
        : category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
          ? deepenHex(mixHex(palette.title, palette.divider, 0.34), 0.06)
          : deepenHex(mixHex(palette.number, palette.footer, 0.26), 0.12),
    sidebarIsDark
      ? [
          tintTowardsWhite(mixHex(palette.canvas, palette.title, 0.18), 0.94),
          "#fffaf1",
        ]
      : [deepenHex(palette.footer, 0.18), "#3a2b24"],
    5.2,
  );
  const domainRuleColor = ensureContrastColor(
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? tintTowardsWhite(mixHex(palette.domain, palette.divider, 0.52), 0.74)
      : category === "feminine-bold"
        ? tintTowardsWhite(mixHex(palette.subtitle, palette.domain, 0.48), 0.8)
        : tintTowardsWhite(mixHex(palette.domain, sidebarBackground, 0.24), 0.9),
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.divider, palette.domain, 0.3), 0.08)
      : mixHex(numberBadgeBorder, palette.divider, 0.28),
    [deepenHex(palette.domain, 0.14), "#b69b83"],
    1.8,
  );
  const domainPillBackground =
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? tintTowardsWhite(mixHex(palette.domain, palette.divider, 0.52), 0.74)
      : category === "feminine-bold"
        ? tintTowardsWhite(mixHex(palette.subtitle, palette.domain, 0.48), 0.8)
        : tintTowardsWhite(mixHex(palette.domain, sidebarBackground, 0.24), 0.9);
  const domainTextColor = ensureContrastColor(
    domainPillBackground,
    category === "graphic-pop" || category === "fresh-vivid" || category === "food-bold"
      ? deepenHex(mixHex(palette.footer, palette.domain, 0.24), 0.2)
      : deepenHex(mixHex(palette.domain, palette.footer, 0.24), 0.2),
    [deepenHex(palette.title, 0.2), "#372c25"],
    6.4,
  );

  return {
    canvasBackground,
    sidebarBackground,
    heroFrameColor,
    numberBadgeBackground,
    numberBadgeBorder,
    numberColor,
    titleLineOne,
    titleLineTwo,
    titleLineThree,
    domainPillBackground,
    domainRuleColor,
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

function isDarkSurface(hex: string) {
  const parsed = parseHex(hex);
  if (!parsed) {
    return false;
  }

  return relativeLuminance(parsed) < 0.22;
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
