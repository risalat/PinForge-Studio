import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { getRuntimeContrastRatio } from "@/lib/runtime-templates/contrast";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TYPOGRAPHY = {
  kicker: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.18em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.038em",
    lineHeight: 0.94,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.055em",
    lineHeight: 0.84,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateRecipeCardCarousel({
  title,
  subtitle,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const category = getTemplateVisualPresetCategory(preset.id);
  const imageSet = normalizeImages(images, 3);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 25;
  const titleLines = buildRecipeCardTitle(title);
  const kicker = subtitle?.trim() || "Featured Collection";
  const roleColors = resolveRecipeCarouselRoleColors(category, preset);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: roleColors.canvasBackground }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at top left, ${withAlpha(roleColors.decorativeTintA, 0.26)} 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at bottom right, ${withAlpha(roleColors.decorativeTintB, 0.2)} 0%, rgba(66,28,14,0) 38%), linear-gradient(180deg, ${withAlpha(
              tintTowardsWhite(preset.palette.canvas, 0.34),
              0.14,
            )} 0%, rgba(255,255,255,0) 30%, ${withAlpha(deepenHex(preset.palette.footer, 0.1), 0.06)} 100%)`,
        }}
      />

      <div
        className="absolute left-[70px] top-[88px] z-0 h-[320px] w-[320px] rounded-full blur-[64px]"
        style={{ backgroundColor: withAlpha(roleColors.decorativeTintA, 0.28) }}
      />
      <div
        className="absolute bottom-[148px] right-[70px] z-0 h-[280px] w-[280px] rounded-full blur-[58px]"
        style={{ backgroundColor: withAlpha(roleColors.decorativeTintB, 0.22) }}
      />

      <PhotoCard
        src={imageSet[0]}
        alt={title}
        style={{ left: 40, top: 96, width: 698, height: 826, transform: "rotate(-4.2deg)" }}
        frameColor={roleColors.backFrameFill}
        shadow={roleColors.backShadow}
      />
      <PhotoCard
        src={imageSet[1]}
        alt={title}
        style={{ left: 336, top: 298, width: 704, height: 834, transform: "rotate(3.4deg)" }}
        frameColor={roleColors.frontFrameFill}
        shadow={roleColors.frontShadow}
      />
      <PhotoCard
        src={imageSet[2]}
        alt={title}
        style={{ left: 90, top: 1184, width: 900, height: 596, transform: "rotate(-0.8deg)" }}
        frameColor={roleColors.frontFrameFill}
        shadow={roleColors.frontShadow}
      />

      <div
        className="absolute z-30 overflow-hidden rounded-[38px] border shadow-[0_30px_70px_rgba(32,16,10,0.2)]"
        style={{
          left: 80,
          top: 780,
          width: 900,
          height: 442,
          backgroundColor: roleColors.titleCardFill,
          borderColor: roleColors.border,
          boxShadow: roleColors.cardShadow,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at top left, ${withAlpha(roleColors.decorativeTintA, 0.18)} 0%, rgba(255,255,255,0) 28%)`,
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[118px]"
          style={{
            background: `linear-gradient(180deg, ${withAlpha(roleColors.headerStripFill, 0.82)} 0%, ${withAlpha(roleColors.headerStripFill, 0.22)} 100%)`,
          }}
        />
        <div
          className="absolute left-[34px] top-[20px] flex h-[82px] w-[194px] items-center justify-center rounded-[24px] border px-[24px]"
          style={{ backgroundColor: roleColors.numberBadgeFill, borderColor: roleColors.numberBadgeBorder }}
        >
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={50}
            maxFontSize={78}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[64%] text-center"
            textColor={roleColors.numberBadgeText}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div
          className="absolute right-[34px] top-[24px] flex h-[60px] min-w-[250px] max-w-[390px] items-center justify-center rounded-full border px-[28px]"
          style={{ backgroundColor: roleColors.roundupPillFill, borderColor: roleColors.roundupPillBorder }}
        >
          <AutoFitText
            as="p"
            text={kicker}
            minFontSize={16}
            maxFontSize={22}
            maxLines={1}
            lineHeight={TYPOGRAPHY.kicker.lineHeight}
            className="w-full text-center"
            textColor={roleColors.roundupPillText}
            fontFamily={TYPOGRAPHY.kicker.fontFamily}
            fontWeight={TYPOGRAPHY.kicker.fontWeight}
            letterSpacing={TYPOGRAPHY.kicker.letterSpacing}
            textTransform={TYPOGRAPHY.kicker.textTransform}
          />
        </div>

        <div
          className="absolute left-[58px] right-[58px] top-[112px]"
          style={{
            borderTop: `2px solid ${withAlpha(roleColors.dividerLine, 0.24)}`,
            height: 248,
            paddingTop: 22,
          }}
        >
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={38}
            maxFontSize={74}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={14}
            className="h-full w-full"
            textAlign="center"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[roleColors.titleText, roleColors.titleText, roleColors.titleText]}
          />
        </div>
      </div>

      <div
        className="absolute left-[138px] right-[138px] top-[1840px] z-10 h-[4px] rounded-full"
        style={{ backgroundColor: withAlpha(roleColors.footerAnchorLine, 0.18) }}
      />

      <div className="absolute inset-x-0 top-[1766px] z-40 flex justify-center">
        <div
          className="flex h-[76px] min-w-[340px] max-w-[520px] items-center justify-center rounded-full border px-[34px]"
          style={{
            backgroundColor: roleColors.domainPillFill,
            borderColor: roleColors.domainPillBorder,
            boxShadow: roleColors.domainShadow,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={28}
            maxLines={1}
            lineHeight={TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={roleColors.domainPillText}
            fontFamily={TYPOGRAPHY.domain.fontFamily}
            fontWeight={TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TYPOGRAPHY.domain.letterSpacing}
            textTransform={TYPOGRAPHY.domain.textTransform}
          />
        </div>
      </div>
    </div>
  );
}

function PhotoCard({
  src,
  alt,
  style,
  frameColor,
  shadow,
}: {
  src: string;
  alt: string;
  style: CSSProperties;
  frameColor: string;
  shadow: string;
}) {
  return (
    <div
      className="absolute z-10 overflow-hidden rounded-[34px] p-[16px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[24px]" />
      <div
        className="pointer-events-none absolute inset-[16px] rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(60,28,15,0.08) 100%)",
        }}
      />
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

function buildRecipeCardTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 5)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Crockpot", "Soup", "Recipes"];
  }

  if (words.length === 1) {
    return [words[0], "Soup", "Recipes"];
  }

  if (words.length === 2) {
    return [words[0], words[1], "Recipes"];
  }

  if (words.length === 3) {
    return [words[0], words[1], words[2]];
  }

  if (words.length === 4) {
    return [`${words[0]} ${words[1]}`, words[2], words[3]];
  }

  return [words[0], `${words[1]} ${words[2]}`, `${words[3]} ${words[4]}`];
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

type RecipeCarouselRoleColors = {
  canvasBackground: string;
  decorativeTintA: string;
  decorativeTintB: string;
  backFrameFill: string;
  frontFrameFill: string;
  titleCardFill: string;
  titleText: string;
  numberBadgeFill: string;
  numberBadgeText: string;
  numberBadgeBorder: string;
  roundupPillFill: string;
  roundupPillText: string;
  roundupPillBorder: string;
  headerStripFill: string;
  domainPillFill: string;
  domainPillText: string;
  domainPillBorder: string;
  border: string;
  dividerLine: string;
  footerAnchorLine: string;
  backShadow: string;
  frontShadow: string;
  cardShadow: string;
  domainShadow: string;
};

// Binding strategy:
// - title text carries the strongest preset accent
// - title card stays contrasting and usually light to avoid heavy saturated blocks
// - number badge uses a darker accent than the title card for hierarchy
// - roundup pill uses a quieter, secondary surface
// - domain pill uses a deeper footer/domain tone so it anchors the composition
// - soft presets get darker text and stronger shadows; strong presets get lighter cards and quieter support pills
function resolveRecipeCarouselRoleColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): RecipeCarouselRoleColors {
  const { palette } = preset;
  const accents = [
    palette.title,
    palette.number,
    palette.domain,
    ...(preset.supportingColors ?? []),
  ];
  const boldAccent = deepenHex(
    pickMostChromaticColor(accents),
    category === "food-bold" || category === "graphic-pop" || category === "fresh-vivid" ? 0.16 : 0.12,
  );
  const warmBias = isCoolPresetFamily(preset) ? 0.18 : 0.08;
  const provisionalInk = ensureContrastColor(
    tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.24), 0.78),
    boldAccent,
    [deepenHex(palette.title, 0.28), deepenHex(palette.number, 0.26), deepenHex(palette.domain, 0.22), "#1d1711"],
    4.8,
  );

  const titleCardFill = warmSurface(
    pickSurfaceAgainstText(
      provisionalInk,
      [
        tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.22), 0.72),
        tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.34), 0.82),
        tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.16), 0.8),
        tintTowardsWhite(palette.band, 0.6),
      ],
      4.8,
    ),
    warmBias,
  );
  const titleText = ensureContrastColor(
    titleCardFill,
    boldAccent,
    [
      tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.22), 0.72),
      deepenHex(palette.title, 0.28),
      deepenHex(palette.number, 0.26),
      deepenHex(palette.domain, 0.22),
      "#1d1711",
    ],
    5.1,
  );

  const canvasBackground = ensureSurfaceSeparation(
    titleCardFill,
    [
      warmSurface(tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.22), 0.08), warmBias * 0.7),
      warmSurface(tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.18), 0.12), warmBias * 0.7),
      warmSurface(tintTowardsWhite(mixHex(palette.canvas, preset.supportingColors?.[0] ?? palette.divider, 0.12), 0.22), warmBias * 0.6),
    ],
    1.14,
  );

  const numberBadgeFill = ensureContrastColor(
    canvasBackground,
    deepenHex(mixHex(palette.number, boldAccent, 0.58), 0.1),
    [deepenHex(palette.number, 0.24), deepenHex(boldAccent, 0.18), deepenHex(palette.domain, 0.22)],
    2.6,
  );
  const numberBadgeText = ensureContrastColor(
    numberBadgeFill,
    "#fffaf4",
    ["#fffaf4", "#ffffff", "#17120e"],
    5.6,
  );

  const roundupPillFill = ensureSurfaceSeparation(
    titleCardFill,
    [
      warmSurface(tintTowardsWhite(mixHex(palette.subtitle, palette.band, 0.28), 0.54), warmBias * 0.8),
      warmSurface(tintTowardsWhite(mixHex(palette.domain, palette.band, 0.22), 0.66), warmBias * 0.8),
      warmSurface(tintTowardsWhite(mixHex(palette.divider, palette.band, 0.2), 0.7), warmBias * 0.8),
    ],
    1.1,
  );
  const roundupPillText = ensureContrastColor(
    roundupPillFill,
    deepenHex(mixHex(palette.subtitle, titleText, 0.42), 0.1),
    [titleText, deepenHex(palette.domain, 0.2), "#1d1711"],
    4.5,
  );

  const domainPillFill = ensureContrastColor(
    canvasBackground,
    deepenHex(mixHex(palette.domain, boldAccent, 0.42), 0.18),
    [deepenHex(palette.domain, 0.32), deepenHex(palette.footer, 0.36), deepenHex(boldAccent, 0.26)],
    3.2,
  );
  const domainPillText = ensureContrastColor(
    domainPillFill,
    "#fffaf4",
    ["#fffaf4", "#ffffff"],
    7,
  );

  const decorativeTintA = tintTowardsWhite(mixHex(palette.divider, preset.supportingColors?.[0] ?? palette.number, 0.34), 0.54);
  const decorativeTintB = warmSurface(
    tintTowardsWhite(mixHex(palette.canvas, preset.supportingColors?.[1] ?? palette.domain, 0.22), 0.36),
    warmBias * 0.6,
  );
  const backFrameFill = tintTowardsWhite(mixHex(titleCardFill, palette.canvas, 0.4), 0.22);
  const frontFrameFill = tintTowardsWhite(mixHex(titleCardFill, palette.band, 0.34), 0.12);
  const border = withAlpha(
    ensureContrastColor(titleCardFill, mixHex(palette.divider, palette.domain, 0.35), [palette.divider, titleText], 1.6),
    0.36,
  );
  const dividerLine = ensureContrastColor(titleCardFill, mixHex(palette.divider, titleText, 0.22), [palette.divider, titleText], 1.4);
  const headerStripFill = warmSurface(
    ensureSurfaceSeparation(
      titleCardFill,
      [
        tintTowardsWhite(mixHex(numberBadgeFill, titleCardFill, 0.72), 0.18),
        tintTowardsWhite(mixHex(roundupPillFill, titleCardFill, 0.64), 0.12),
      ],
      1.04,
    ),
    warmBias * 0.45,
  );
  const footerAnchorLine = warmSurface(mixHex(domainPillFill, canvasBackground, 0.76), warmBias * 0.5);

  const shadowBase = category === "pastel-soft" || category === "editorial-soft"
    ? withAlpha(deepenHex(mixHex(palette.footer, boldAccent, 0.32), 0.42), 0.18)
    : category === "food-bold" || category === "graphic-pop" || category === "fresh-vivid"
      ? withAlpha(deepenHex(mixHex(palette.footer, boldAccent, 0.44), 0.54), 0.16)
      : withAlpha(deepenHex(mixHex(palette.footer, boldAccent, 0.38), 0.48), 0.17);

  return {
    canvasBackground,
    decorativeTintA,
    decorativeTintB,
    backFrameFill,
    frontFrameFill,
    titleCardFill,
    titleText,
    numberBadgeFill,
    numberBadgeText,
    numberBadgeBorder: withAlpha(tintTowardsWhite(numberBadgeFill, 0.08), 0.72),
    roundupPillFill,
    roundupPillText,
    roundupPillBorder: withAlpha(tintTowardsWhite(roundupPillFill, 0.18), 0.64),
    headerStripFill,
    domainPillFill,
    domainPillText,
    domainPillBorder: withAlpha(tintTowardsWhite(domainPillFill, 0.14), 0.7),
    border,
    dividerLine,
    footerAnchorLine,
    backShadow: `0 18px 42px ${shadowBase}`,
    frontShadow: `0 26px 56px ${withAlpha(stripAlpha(shadowBase), 0.22)}`,
    cardShadow: `0 28px 64px ${withAlpha(stripAlpha(shadowBase), 0.22)}`,
    domainShadow: `0 14px 28px ${withAlpha(stripAlpha(shadowBase), 0.18)}`,
  };
}

function pickSurfaceAgainstText(titleText: string, candidates: string[], minimumContrast: number) {
  const match = candidates.find((candidate) => contrastRatio(candidate, titleText) >= minimumContrast);
  return match ?? candidates[0];
}

function ensureSurfaceSeparation(background: string, candidates: string[], minimumContrast: number) {
  const match = candidates
    .map((candidate) => ({ candidate, score: contrastRatio(candidate, background) }))
    .sort((left, right) => right.score - left.score)
    .find((entry) => entry.score >= minimumContrast);
  return match?.candidate ?? candidates[0];
}

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumContrast: number,
) {
  const candidates = [preferredHex, ...fallbacks].filter((candidate) => /^#[0-9a-fA-F]{6}$/.test(candidate));
  const match = candidates.find((candidate) => contrastRatio(backgroundHex, candidate) >= minimumContrast);
  if (match) {
    return match;
  }

  return pickReadableColor(backgroundHex, candidates);
}

function pickReadableColor(backgroundHex: string, candidates: string[]) {
  const palette = candidates.filter((candidate) => /^#[0-9a-fA-F]{6}$/.test(candidate));
  if (!/^#[0-9a-fA-F]{6}$/.test(backgroundHex) || palette.length === 0) {
    return candidates[0] ?? "#ffffff";
  }

  return palette.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function pickMostChromaticColor(colors: string[]) {
  const validColors = colors.filter((color) => /^#[0-9a-fA-F]{6}$/.test(color));
  if (validColors.length === 0) {
    return "#8a5a3b";
  }

  return validColors.reduce((best, current) => {
    const bestHsl = hexToHsl(best);
    const currentHsl = hexToHsl(current);
    return currentHsl.s > bestHsl.s ? current : best;
  }, validColors[0]);
}

function contrastRatio(backgroundHex: string, foregroundHex: string) {
  return getRuntimeContrastRatio(foregroundHex, backgroundHex);
}

function mixHex(fromHex: string, toHex: string, amount: number) {
  const from = parseHex(stripAlpha(fromHex));
  const to = parseHex(stripAlpha(toHex));
  if (!from || !to) {
    return stripAlpha(fromHex);
  }

  const safeAmount = Math.max(0, Math.min(1, amount));
  const mix = (left: number, right: number) => Math.round(left + (right - left) * safeAmount);

  return `#${[mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2])]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function withAlpha(hex: string, opacity: number) {
  const normalized = stripAlpha(hex).replace("#", "");
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alpha}`;
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

function hexToHsl(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      default:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s,
    l,
  };
}

function stripAlpha(hex: string) {
  return /^#[0-9a-fA-F]{8}$/.test(hex) ? `#${hex.slice(1, 7)}` : hex;
}

function warmSurface(hex: string, amount: number) {
  return mixHex(hex, "#fff1e3", Math.max(0, Math.min(0.22, amount)));
}

function isCoolPresetFamily(preset: ReturnType<typeof getSplitVerticalVisualPreset>) {
  const coolCandidates = [preset.palette.title, preset.palette.number, preset.palette.domain];
  return coolCandidates.some((color) => {
    const { h, s } = hexToHsl(color);
    return s > 0.12 && h >= 185 && h <= 285;
  });
}
