/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  number: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.88,
  },
  title: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 0.9,
    textTransform: "none" as const,
  },
  domain: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 600,
    letterSpacing: "0",
    lineHeight: 1,
    textTransform: "none" as const,
  },
} as const;

export function TemplateSingleImageOverlayNumberTitleDomain({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const imageUrl = images[0] ?? "/sample-images/8.jpg";
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const category = presetId ? getTemplateVisualPresetCategory(presetId) : "editorial-soft";
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 23;
  const colors = resolveOverlayColors(category, preset.palette);
  const panelLeft = 36;
  const panelTop = 1138;
  const panelWidth = 1008;
  const panelHeight = 438;
  const archWidth = 458;
  const archHeight = 236;
  const archLeft = Math.round((1080 - archWidth) / 2);
  const archTop = panelTop - 142;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: colors.canvasBackground }}
    >
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div
        className="absolute z-10 overflow-hidden rounded-[20px]"
        style={{
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          height: panelHeight,
          backgroundColor: colors.overlayBackground,
          backgroundImage: colors.overlayGradient,
          border: `1px solid ${colors.overlayBorderColor}`,
          clipPath:
            "polygon(0 21%, 32% 16%, 40% 11%, 50% 0, 60% 11%, 68% 16%, 100% 21%, 100% 100%, 0 100%)",
          backdropFilter: "blur(3px)",
          boxShadow: `0 18px 48px ${colors.overlayShadowColor}`,
        }}
      />

      <div
        className="absolute z-10 overflow-hidden"
        style={{
          left: archLeft,
          top: archTop,
          width: archWidth,
          height: archHeight,
          backgroundColor: colors.overlayBackground,
          backgroundImage: colors.overlayGradient,
          borderLeft: `1px solid ${colors.overlayBorderColor}`,
          borderRight: `1px solid ${colors.overlayBorderColor}`,
          borderTop: `1px solid ${colors.overlayBorderColor}`,
          borderTopLeftRadius: 999,
          borderTopRightRadius: 999,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backdropFilter: "blur(3px)",
          boxShadow: `0 10px 26px ${colors.overlayShadowColor}`,
        }}
      />

      <div
        className="absolute inset-x-0 z-20 flex justify-center"
        style={{ top: archTop + 30, filter: `drop-shadow(0 6px 14px ${colors.numberShadowColor})` }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={202}
          maxFontSize={316}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[420px] text-center"
          textColor={colors.numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute inset-x-0 z-20 flex justify-center px-[110px]"
        style={{ top: panelTop + 188, filter: `drop-shadow(0 3px 10px ${colors.titleShadowColor})` }}
      >
        <AutoFitTitle
          text={title}
          minFontSize={64}
          maxFontSize={124}
          maxLines={2}
          lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
          className="w-full max-w-[900px] text-center"
          textColor={colors.titleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
        />
      </div>

      <div
        className="absolute inset-x-0 z-20 flex justify-center"
        style={{ top: panelTop + 332 }}
      >
        <div
          className="h-[2px] rounded-full"
          style={{ width: 180, backgroundColor: colors.domainRuleColor }}
        />
      </div>

      <div
        className="absolute inset-x-0 z-20 flex justify-center"
        style={{ top: panelTop + 380, filter: `drop-shadow(0 2px 8px ${colors.domainShadowColor})` }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={22}
          maxFontSize={32}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
          className="w-[460px] text-center"
          textColor={colors.domainColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
        />
      </div>
    </div>
  );
}

function resolveOverlayColors(
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
  const overlayBackground =
    category === "dark-drama"
      ? withAlpha(tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.18), 0.78), 0.9)
      : category === "graphic-pop" || category === "fresh-vivid"
        ? withAlpha(tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.3), 0.84), 0.92)
        : category === "feminine-bold"
          ? withAlpha(tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.26), 0.88), 0.92)
          : withAlpha(tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.16), 0.92), 0.91);
  const flatOverlay = stripAlpha(overlayBackground);
  const overlayHighlight = withAlpha(
    tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.18), 0.96),
    category === "dark-drama" ? 0.26 : 0.54,
  );
  const overlayBase = withAlpha(
    tintTowardsWhite(mixHex(palette.canvas, palette.footer, 0.14), category === "dark-drama" ? 0.78 : 0.9),
    category === "dark-drama" ? 0.9 : 0.92,
  );

  const numberColor = ensureContrastColor(
    flatOverlay,
    deepenHex(mixHex(palette.number, palette.footer, 0.22), 0.28),
    [deepenHex(palette.band, 0.34), deepenHex(palette.domain, 0.3), "#302822"],
    5.2,
  );
  const titleColor = ensureContrastColor(
    flatOverlay,
    deepenHex(mixHex(palette.title, palette.band, 0.16), 0.3),
    [deepenHex(palette.domain, 0.28), deepenHex(palette.number, 0.34), "#3e342d"],
    6.4,
  );
  const dividerColor = withAlpha(
    ensureContrastColor(
      flatOverlay,
      mixHex(titleColor, palette.divider, 0.4),
      [titleColor, numberColor, deepenHex(palette.band, 0.28)],
      2.8,
    ),
    0.62,
  );
  const domainColor = ensureContrastColor(
    flatOverlay,
    deepenHex(mixHex(palette.domain, palette.band, 0.22), 0.22),
    [numberColor, titleColor, "#433831"],
    4.8,
  );
  const overlayBorderColor = withAlpha(
    ensureContrastColor(
      flatOverlay,
      mixHex(palette.divider, palette.band, 0.34),
      [titleColor, numberColor],
      1.6,
    ),
    category === "graphic-pop" || category === "feminine-bold" ? 0.34 : 0.2,
  );
  const overlayShadowColor = withAlpha(
    deepenHex(mixHex(palette.footer, palette.band, 0.38), 0.4),
    category === "dark-drama" ? 0.3 : 0.18,
  );
  const titleShadowColor = withAlpha(tintTowardsWhite(titleColor, 0.08), 0.16);
  const numberShadowColor = withAlpha(tintTowardsWhite(numberColor, 0.04), 0.16);
  const domainShadowColor = withAlpha(tintTowardsWhite(domainColor, 0.08), 0.14);

  return {
    canvasBackground: presetCanvas(category, palette.canvas),
    overlayBackground,
    overlayGradient: `linear-gradient(180deg, ${overlayHighlight} 0%, ${overlayBackground} 34%, ${overlayBase} 100%)`,
    overlayBorderColor,
    overlayShadowColor,
    numberColor,
    numberShadowColor,
    titleColor,
    titleShadowColor,
    dividerColor,
    domainRuleColor: dividerColor,
    domainColor,
    domainShadowColor,
  };
}

function presetCanvas(
  category:
    | "editorial-soft"
    | "pastel-soft"
    | "earthy-warm"
    | "dark-drama"
    | "graphic-pop"
    | "fresh-vivid"
    | "feminine-bold",
  canvas: string,
) {
  return category === "dark-drama" ? deepenHex(canvas, 0.2) : tintTowardsWhite(canvas, 0.08);
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

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
}

function withAlpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex;
  }

  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${normalized}${alpha}`;
}

function stripAlpha(hex: string) {
  return /^#[0-9a-fA-F]{8}$/.test(hex) ? `#${hex.slice(1, 7)}` : hex;
}

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  const candidates = [preferredHex, ...fallbacks].filter(isHexColor);
  if (!isHexColor(backgroundHex) || candidates.length === 0) {
    return preferredHex;
  }

  const preferredRatio = getContrastRatio(preferredHex, backgroundHex);
  if (preferredRatio >= minimumRatio) {
    return preferredHex;
  }

  return candidates.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) > getContrastRatio(best, backgroundHex)
      ? candidate
      : best,
  );
}

function getContrastRatio(foregroundHex: string, backgroundHex: string) {
  const foreground = getRelativeLuminance(foregroundHex);
  const background = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string) {
  const normalized = stripAlpha(hex).replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(stripAlpha(value));
}
