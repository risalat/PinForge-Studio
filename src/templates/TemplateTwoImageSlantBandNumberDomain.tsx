/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  script: {
    fontFamily: "var(--font-segoe-script), var(--font-parisienne), var(--font-satisfy), cursive",
    fontWeight: 400,
    letterSpacing: "0",
    lineHeight: 0.88,
    textTransform: "none" as const,
  },
  title: {
    fontFamily: "var(--font-alata), var(--font-manrope), sans-serif",
    fontWeight: 400,
    letterSpacing: "0.03em",
    lineHeight: 0.84,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-alata), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 0.9,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
} as const;

const FALLBACK_TITLE = "Cozy Small Porch Ideas";
export function TemplateTwoImageSlantBandNumberDomain({
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
  const imageSet = normalizeImages(images, 3);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 95;
  const displayTitle = titleLocked ? normalizeLockedSlantBandTitle(title) : compactSlantBandTitle(title);
  const titleLines = splitSlantBandTitle(displayTitle, displayNumber);
  const colors = resolveTemplateColors(category, preset.palette);

  const topImageHeight = 944;
  const bottomImageTop = 958;
  const bottomImageHeight = 1920 - bottomImageTop;
  const bandLeft = -92;
  const bandTop = 748;
  const bandWidth = 1264;
  const bandHeight = 410;
  const bandRotation = -8;
  const badgeSize = 268;
  const badgeLeft = 26;
  const badgeTop = 642;
  const scriptTop = 44;
  const scriptLeft = 426;
  const scriptWidth = 656;
  const blockOneTop = 138;
  const blockOneLeft = 92;
  const blockOneWidth = 934;
  const blockTwoTop = 292;
  const blockTwoWidth = 742;
  const blockTwoLeft = Math.round((bandWidth - blockTwoWidth) / 2);
  const domainPillWidth = 456;
  const domainPillHeight = 72;
  const domainPillBottom = 86;
  const bottomGutter = 6;
  const bottomTileWidth = Math.floor((1080 - bottomGutter) / 2);
  const bottomSecondLeft = bottomTileWidth + bottomGutter;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: "#f7f3ef" }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{ left: 0, top: 0, width: 1080, height: topImageHeight }}
      />

      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{ left: 0, top: bottomImageTop, width: bottomTileWidth, height: bottomImageHeight }}
      />

      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{ left: bottomSecondLeft, top: bottomImageTop, width: bottomTileWidth, height: bottomImageHeight }}
      />

      <div
        className="absolute z-20 overflow-hidden shadow-[0_20px_50px_rgba(48,31,20,0.12)]"
        style={{
          left: bandLeft,
          top: bandTop,
          width: bandWidth,
          height: bandHeight,
          backgroundColor: colors.bandBackground,
          transform: `rotate(${bandRotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        <div className="absolute" style={{ left: scriptLeft, top: scriptTop, width: scriptWidth }}>
          <AutoFitText
            as="p"
            text={titleLines.script}
            minFontSize={82}
            maxFontSize={174}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.script.lineHeight}
            className="w-full text-left"
            textColor={colors.scriptColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.script.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.script.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.script.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.script.textTransform}
          />
        </div>

        <div className="absolute" style={{ left: blockOneLeft, top: blockOneTop, width: blockOneWidth }}>
          <AutoFitText
            as="p"
            text={titleLines.blockOne}
            minFontSize={72}
            maxFontSize={146}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="w-full text-center"
            textColor={colors.blockLineOneColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>

        <div className="absolute" style={{ left: blockTwoLeft, top: blockTwoTop, width: blockTwoWidth }}>
          <AutoFitText
            as="p"
            text={titleLines.blockTwo}
            minFontSize={54}
            maxFontSize={118}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="w-full text-center"
            textColor={colors.blockLineTwoColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>
      </div>

      <div
        className="absolute z-10"
        style={{
          left: bottomTileWidth,
          top: bottomImageTop,
          width: bottomGutter,
          height: bottomImageHeight,
          backgroundColor: colors.bottomDividerColor,
        }}
      />

      <div
        className="absolute z-30 flex items-center justify-center rounded-full shadow-[0_14px_34px_rgba(43,32,22,0.16)]"
        style={{
          left: badgeLeft,
          top: badgeTop,
          width: badgeSize,
          height: badgeSize,
          backgroundColor: colors.badgeBackground,
          border: `5px solid ${colors.badgeBorderColor}`,
        }}
      >
        <div
          className="absolute inset-[14px] rounded-full"
          style={{ border: `4px dotted ${colors.badgeInnerRingColor}` }}
        />

        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={92}
          maxFontSize={148}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[62%] text-center"
          textColor={colors.numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute inset-x-0 z-30 flex justify-center"
        style={{ bottom: domainPillBottom }}
      >
        <div
          className="flex items-center justify-center rounded-full px-8 shadow-[0_10px_20px_rgba(39,31,24,0.12)]"
          style={{
            width: domainPillWidth,
            height: domainPillHeight,
            backgroundColor: colors.domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={24}
            maxFontSize={38}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={colors.domainTextColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          />
        </div>
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

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");

  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function compactSlantBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  const words = safeTitle.split(/\s+/).filter(Boolean);
  const withoutWeakClause = cutWeakClauseWords(words);
  const pool = withoutWeakClause.length > 0 ? withoutWeakClause : words;
  const bounded = pool.slice(0, Math.min(6, pool.length));

  if (bounded.length >= 4) {
    return toTitleCase(bounded.join(" "));
  }

  if (bounded.length === 3) {
    return toTitleCase([...bounded, "Ideas"].join(" "));
  }

  if (bounded.length === 2) {
    return toTitleCase([...bounded, "Porch", "Ideas"].join(" "));
  }

  if (bounded.length === 1) {
    return toTitleCase([bounded[0], "Porch", "Style", "Ideas"].join(" "));
  }

  return FALLBACK_TITLE;
}

function normalizeLockedSlantBandTitle(input: string) {
  const safeTitle = input.trim() || FALLBACK_TITLE;
  return safeTitle.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
}

function splitSlantBandTitle(title: string, itemNumber: number) {
  const words = title.split(/\s+/).filter(Boolean);
  const displayWords =
    startsWithMatchingNumber(words, itemNumber) ? words.slice(1) : words;

  if (displayWords.length === 0) {
    return {
      script: "Cozy Small",
      blockOne: "PORCH",
      blockTwo: "IDEAS",
    };
  }

  if (displayWords.length === 1) {
    return {
      script: toTitleCase(displayWords[0]),
      blockOne: "PORCH",
      blockTwo: "IDEAS",
    };
  }

  if (displayWords.length === 2) {
    return {
      script: toTitleCase(displayWords[0]),
      blockOne: displayWords[1].toUpperCase(),
      blockTwo: "IDEAS",
    };
  }

  if (displayWords.length === 3) {
    return {
      script: toTitleCase(displayWords.slice(0, 2).join(" ")),
      blockOne: displayWords[2].toUpperCase(),
      blockTwo: "IDEAS",
    };
  }

  const script = toTitleCase(displayWords.slice(0, 2).join(" "));
  const remaining = displayWords.slice(2);

  if (remaining.length === 2) {
    return {
      script,
      blockOne: remaining[0].toUpperCase(),
      blockTwo: remaining[1].toUpperCase(),
    };
  }

  if (remaining.length === 3) {
    return {
      script,
      blockOne: remaining.slice(0, 2).join(" ").toUpperCase(),
      blockTwo: remaining[2].toUpperCase(),
    };
  }

  if (remaining.length >= 4) {
    return {
      script,
      blockOne: remaining.slice(0, 2).join(" ").toUpperCase(),
      blockTwo: remaining.slice(2, 4).join(" ").toUpperCase(),
    };
  }

  return {
    script,
    blockOne: "PORCH",
    blockTwo: "IDEAS",
  };
}

function resolveTemplateColors(
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
  const bandBackground = "#fffdfa";
  const badgeBackground =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.18), 0.08)
      : category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold"
        ? tintTowardsWhite(mixHex(palette.canvas, palette.divider, 0.36), 0.18)
        : tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.22), 0.16);
  const badgeBorderColor = ensureContrastColor(
    badgeBackground,
    "#111111",
    [deepenHex(palette.number, 0.18), deepenHex(palette.title, 0.18), "#1d1712"],
    1.6,
  );
  const badgeInnerRingColor = ensureContrastColor(
    badgeBackground,
    "#111111",
    [deepenHex(mixHex(palette.domain, palette.number, 0.34), 0.16), deepenHex(palette.domain, 0.28)],
    3.4,
  );
  const accentAWarmCandidates =
    category === "feminine-bold"
      ? [
          deepenHex(mixHex(palette.title, palette.footer, 0.56), 0.18),
          deepenHex(mixHex(palette.title, palette.subtitle, 0.4), 0.12),
          "#a44c6e",
          "#9a5f3f",
          "#8b5d3d",
        ]
      : category === "graphic-pop" || category === "fresh-vivid"
        ? [
            deepenHex(mixHex(palette.title, palette.divider, 0.34), 0.14),
            deepenHex(mixHex(palette.title, palette.footer, 0.22), 0.12),
            "#b55a2f",
            "#8b5d3d",
          ]
        : [
            deepenHex(mixHex(palette.title, palette.subtitle, 0.42), 0.18),
            deepenHex(mixHex(palette.title, palette.footer, 0.22), 0.18),
            "#9a5f3f",
            "#8b5d3d",
          ];
  const accentBCoolCandidates =
    category === "earthy-warm"
      ? [
          deepenHex(mixHex(palette.number, palette.domain, 0.7), 0.18),
          deepenHex(mixHex(palette.number, palette.divider, 0.54), 0.16),
          "#6b8660",
          "#4f6449",
          "#37482c",
        ]
      : category === "pastel-soft" || category === "editorial-soft"
        ? [
            deepenHex(mixHex(palette.number, palette.domain, 0.78), 0.22),
            deepenHex(mixHex(palette.number, palette.band, 0.58), 0.22),
            "#5b7f64",
            "#486951",
            "#35513e",
          ]
        : category === "feminine-bold"
          ? [
              deepenHex(mixHex(palette.number, palette.domain, 0.64), 0.14),
              deepenHex(mixHex(palette.number, palette.band, 0.56), 0.18),
              "#5b7a52",
              "#486549",
              "#35513d",
            ]
          : [
              deepenHex(mixHex(palette.number, palette.domain, 0.64), 0.16),
              deepenHex(mixHex(palette.number, palette.band, 0.5), 0.16),
              "#5b7a52",
              "#486549",
              "#35513d",
            ];

  const accentA = ensureContrastColor(
    bandBackground,
    accentAWarmCandidates[0],
    accentAWarmCandidates.slice(1),
    4.6,
  );
  const accentB = ensureDistinctContrastColor(
    bandBackground,
    accentA,
    accentBCoolCandidates,
    4.8,
    72,
  );
  const scriptColor = accentA;
  const blockLineOneColor = accentB;
  const blockLineTwoColor = accentA;
  const numberColor = accentB;
  const domainPillBackground = ensureContrastColor(
    bandBackground,
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.24), 0.18)
      : category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold"
        ? tintTowardsWhite(mixHex(palette.footer, palette.divider, 0.36), 0.12)
        : tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.28), 0.16),
    [tintTowardsWhite(mixHex(palette.band, palette.footer, 0.4), 0.14), tintTowardsWhite(palette.footer, 0.18)],
    1.2,
  );
  const domainTextColor = ensureContrastColor(
    domainPillBackground,
    deepenHex(mixHex(palette.domain, palette.title, 0.2), 0.18),
    [deepenHex(palette.domain, 0.24), deepenHex(palette.number, 0.18), deepenHex(palette.footer, 0.34), "#314227"],
    5.6,
  );
  const bottomDividerColor = category === "dark-drama"
    ? tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.38), 0.14)
    : tintTowardsWhite(mixHex(palette.divider, palette.canvas, 0.5), 0.22);

  return {
    bandBackground,
    badgeBackground,
    badgeBorderColor,
    badgeInnerRingColor,
    numberColor,
    scriptColor,
    blockLineOneColor,
    blockLineTwoColor,
    domainPillBackground,
    domainTextColor,
    bottomDividerColor,
  };
}

function cutWeakClauseWords(words: string[]) {
  const weakClauseWords = new Set(["that", "for", "with", "while", "when", "because", "where", "which"]);
  const weakClauseIndex = words.findIndex(
    (word, index) => index >= 3 && weakClauseWords.has(word.toLowerCase().replace(/[^a-z]/g, "")),
  );
  return weakClauseIndex > 0 ? words.slice(0, weakClauseIndex) : words;
}

function startsWithMatchingNumber(words: string[], itemNumber: number) {
  const firstWord = words[0]?.replace(/[^0-9]/g, "") ?? "";
  return firstWord !== "" && Number.parseInt(firstWord, 10) === itemNumber;
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

  for (const candidate of candidates) {
    if (contrastRatio(backgroundHex, candidate) >= minimumRatio) {
      return candidate;
    }
  }

  return candidates.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function ensureDistinctContrastColor(
  backgroundHex: string,
  anchorHex: string,
  candidates: string[],
  minimumRatio: number,
  minimumDistance: number,
) {
  const uniqueCandidates = candidates.filter((value, index, array) => array.indexOf(value) === index);
  const passingDistinct = uniqueCandidates.filter(
    (candidate) =>
      contrastRatio(backgroundHex, candidate) >= minimumRatio &&
      colorDistance(anchorHex, candidate) >= minimumDistance,
  );

  if (passingDistinct.length > 0) {
    return passingDistinct[0];
  }

  const passing = uniqueCandidates.filter(
    (candidate) => contrastRatio(backgroundHex, candidate) >= minimumRatio,
  );
  if (passing.length > 0) {
    return passing.reduce((best, candidate) =>
      colorDistance(anchorHex, candidate) > colorDistance(anchorHex, best) ? candidate : best,
    );
  }

  return uniqueCandidates.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function colorDistance(leftHex: string, rightHex: string) {
  const left = parseHex(leftHex);
  const right = parseHex(rightHex);
  if (!left || !right) {
    return 0;
  }

  const [lr, lg, lb] = left;
  const [rr, rg, rb] = right;
  return Math.sqrt((lr - rr) ** 2 + (lg - rg) ** 2 + (lb - rb) ** 2);
}

function contrastRatio(leftHex: string, rightHex: string) {
  const left = parseHex(leftHex);
  const right = parseHex(rightHex);
  if (!left || !right) {
    return 1;
  }

  const luminance = ([red, green, blue]: [number, number, number]) => {
    const transform = (value: number) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };

    const [r, g, b] = [transform(red), transform(green), transform(blue)];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lighter = Math.max(luminance(left), luminance(right));
  const darker = Math.min(luminance(left), luminance(right));
  return (lighter + 0.05) / (darker + 0.05);
}
