/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

type HeroTextTripleSplitFooterProps = TemplateRenderProps & {
  bandTone?: "soft" | "balanced" | "boosted";
};

const DEFAULT_COLORS = {
  bandBackground: "#ff6d2a",
  footerBackground: "#8c480c",
  gutter: "#ffbe2f",
  subtitle: "#fff8ef",
  title: "#fff7ef",
  divider: "#ffe9cb",
  domain: "#fff2dc",
} as const;

const TEMPLATE_TYPOGRAPHY = {
  subtitle: {
    fontFamily: "var(--font-libre-baskerville), var(--font-lora), serif",
    fontWeight: 700,
    letterSpacing: "-0.015em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
  title: {
    fontFamily: "var(--font-cormorant-garamond), var(--font-lora), serif",
    fontWeight: 700,
    letterSpacing: "-0.028em",
    lineHeight: 1.04,
    textTransform: "none" as const,
  },
  domain: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    textTransform: "none" as const,
  },
} as const;

export function TemplateHeroTextTripleSplitFooter({
  title,
  subtitle,
  images,
  domain,
  visualPreset,
  colorPreset,
  bandTone,
}: HeroTextTripleSplitFooterProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const effectiveBandTone =
    bandTone ?? (presetId && getTemplateVisualPresetCategory(presetId) === "editorial-soft" ? "soft" : "balanced");
  const imageSet = normalizeImages(images, 4);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");

  const topHeroHeight = 694;
  const textBandTop = topHeroHeight;
  const textBandHeight = 480;
  const bottomStripTop = textBandTop + textBandHeight;
  const bottomStripHeight = 1920 - bottomStripTop;
  const footerHeight = 96;
  const bottomImagesHeight = bottomStripHeight;
  const gutter = 8;

  const bandBackground = createPunchyBandBackground(
    preset.palette.footer,
    preset.palette.title,
    preset.palette.band,
    effectiveBandTone,
  );
  const footerBackground = ensureContrastTone(
    createFooterBackground(bandBackground, preset.palette.footer, effectiveBandTone),
    "#ffffff",
    7.4,
  );
  const gutterColor = mixHex(
    tintTowardsWhite(preset.palette.divider, 0.14),
    DEFAULT_COLORS.gutter,
    0.58,
  );
  const titleColor = pickReadableColor(
    bandBackground,
    [
      mixHex(tintTowardsWhite(preset.palette.title, 0.88), DEFAULT_COLORS.title, 0.76),
      mixHex(tintTowardsWhite(preset.palette.domain, 0.84), DEFAULT_COLORS.title, 0.58),
      "#fff8f0",
    ],
    [
      mixHex(deepenHex(preset.palette.title, 0.28), "#20130f", 0.45),
      "#23160d",
    ],
    5.9,
  );
  const subtitleColor = pickReadableColor(
    bandBackground,
    [
      mixHex(tintTowardsWhite(preset.palette.subtitle, 0.82), DEFAULT_COLORS.subtitle, 0.7),
      mixHex(tintTowardsWhite(preset.palette.divider, 0.82), DEFAULT_COLORS.subtitle, 0.42),
      "#fff5e9",
    ],
    [
      mixHex(deepenHex(preset.palette.subtitle, 0.22), "#2b1810", 0.42),
      mixHex(deepenHex(preset.palette.title, 0.18), "#23160d", 0.38),
    ],
    4.7,
  );
  const dividerColor = pickReadableColor(
    bandBackground,
    [
      mixHex(tintTowardsWhite(preset.palette.divider, 0.8), DEFAULT_COLORS.divider, 0.72),
      "#fff1da",
    ],
    [
      mixHex(deepenHex(preset.palette.divider, 0.1), "#492915", 0.4),
      "#5e3218",
    ],
    2.2,
  );
  const domainColor = pickReadableColor(
    footerBackground,
    [
      mixHex(tintTowardsWhite(preset.palette.domain, 0.82), DEFAULT_COLORS.domain, 0.72),
      "#fff6eb",
    ],
    [
      mixHex(deepenHex(preset.palette.domain, 0.18), "#25150d", 0.4),
      "#23160d",
    ],
    6.8,
  );

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[22px]"
      style={{ backgroundColor: bandBackground }}
    >
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: topHeroHeight }}>
        <img
          src={imageSet[0]}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ filter: "saturate(1.03) contrast(1.02)" }}
        />
      </div>

      <div
        className="absolute inset-x-0 z-10"
        style={{
          top: textBandTop,
          height: textBandHeight,
          backgroundColor: bandBackground,
        }}
      />

      <div
        className="absolute inset-x-0 z-20 flex flex-col items-center text-center"
        style={{ top: textBandTop, height: textBandHeight }}
      >
        <div className="w-full max-w-[980px] px-[54px] pt-[42px]">
          <AutoFitText
            as="p"
            text={subtitle?.trim() || "Quick & Easy Fall Living Room Decor"}
            minFontSize={34}
            maxFontSize={56}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
            className="w-full"
            textColor={subtitleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
          />

          <div
            className="mx-auto mt-[16px] h-[4px] w-[320px] rounded-full"
            style={{ backgroundColor: withAlpha(dividerColor, 0.94) }}
          />
        </div>

        <div className="mt-[38px] flex w-full flex-1 items-start justify-center px-[28px]">
          <AutoFitTitle
            text={title}
            minFontSize={72}
            maxFontSize={98}
            maxLines={2}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="w-full max-w-[1020px] text-center"
            textColor={titleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>
      </div>

      <div
        className="absolute inset-x-0 z-0 flex"
        style={{
          top: bottomStripTop,
          height: bottomImagesHeight,
          gap: `${gutter}px`,
          backgroundColor: gutterColor,
          paddingBottom: `${footerHeight}px`,
        }}
      >
        {imageSet.slice(1).map((src, index) => (
          <div key={`bottom-${index}`} className="relative h-full flex-1 overflow-hidden">
            <img
              src={src}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ filter: "saturate(1.04) contrast(1.02)" }}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center px-12 text-center"
        style={{ height: footerHeight, backgroundColor: footerBackground }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={28}
          maxFontSize={42}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
          className="w-full max-w-[760px]"
          textColor={domainColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
        />
      </div>
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

function ensureContrastTone(colorHex: string, backgroundHex: string, minimumRatio: number) {
  if (!isHexColor(colorHex) || !isHexColor(backgroundHex)) {
    return colorHex;
  }

  if (getContrastRatio(colorHex, backgroundHex) >= minimumRatio) {
    return colorHex;
  }

  const darkerCandidate = shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#000000");
  const lighterCandidate = shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#ffffff");

  if (!darkerCandidate) {
    return lighterCandidate ?? colorHex;
  }

  if (!lighterCandidate) {
    return darkerCandidate;
  }

  return colorDistance(colorHex, darkerCandidate) <= colorDistance(colorHex, lighterCandidate)
    ? darkerCandidate
    : lighterCandidate;
}

function pickReadableColor(
  backgroundHex: string,
  lightCandidates: string[],
  darkCandidates: string[],
  minimumRatio: number,
) {
  const prefersLight = getRelativeLuminance(backgroundHex) < 0.42;
  const ordered = prefersLight
    ? [...lightCandidates, ...darkCandidates]
    : [...darkCandidates, ...lightCandidates];

  const normalized = ordered.filter(isHexColor);

  if (normalized.length === 0) {
    return prefersLight ? "#fff8f0" : "#23160d";
  }

  const passing = normalized.filter(
    (candidate) => getContrastRatio(candidate, backgroundHex) >= minimumRatio,
  );
  const candidates = passing.length > 0 ? passing : normalized;

  return candidates.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) > getContrastRatio(best, backgroundHex)
      ? candidate
      : best,
  );
}

function createPunchyBandBackground(
  footerHex: string,
  titleHex: string,
  bandHex: string,
  tone: "soft" | "balanced" | "boosted",
) {
  if (tone === "soft") {
    return tintTowardsWhite(mixHex(bandHex, footerHex, 0.2), 0.14);
  }

  const footerLuminance = getRelativeLuminance(footerHex);
  const titleLuminance = getRelativeLuminance(titleHex);
  const isFooterTooSoft = footerLuminance > 0.42 && Math.abs(footerLuminance - titleLuminance) < 0.18;

  if (isFooterTooSoft) {
    return tone === "boosted"
      ? deepenHex(mixHex(footerHex, titleHex, 0.64), 0.12)
      : deepenHex(mixHex(footerHex, titleHex, 0.58), 0.06);
  }

  if (footerLuminance > 0.62) {
    return tone === "boosted"
      ? deepenHex(mixHex(footerHex, titleHex, 0.48), 0.3)
      : deepenHex(mixHex(footerHex, bandHex, 0.42), 0.22);
  }

  if (footerLuminance > 0.48) {
    return tone === "boosted"
      ? deepenHex(mixHex(footerHex, titleHex, 0.46), 0.22)
      : deepenHex(mixHex(footerHex, titleHex, 0.34), 0.14);
  }

  return tone === "boosted"
    ? deepenHex(mixHex(footerHex, bandHex, 0.02), 0.08)
    : mixHex(footerHex, bandHex, 0.08);
}

function createFooterBackground(
  bandBackground: string,
  footerHex: string,
  tone: "soft" | "balanced" | "boosted",
) {
  if (tone === "soft") {
    return deepenHex(mixHex(bandBackground, footerHex, 0.42), 0.06);
  }

  if (tone === "boosted") {
    return deepenHex(mixHex(bandBackground, footerHex, 0.8), 0.2);
  }

  return deepenHex(mixHex(bandBackground, footerHex, 0.72), 0.14);
}

function shiftTowardContrast(
  colorHex: string,
  backgroundHex: string,
  minimumRatio: number,
  targetHex: string,
) {
  for (let step = 1; step <= 12; step += 1) {
    const candidate = mixHex(colorHex, targetHex, step * 0.08);
    if (getContrastRatio(candidate, backgroundHex) >= minimumRatio) {
      return candidate;
    }
  }

  return null;
}

function colorDistance(leftHex: string, rightHex: string) {
  const left = parseHex(leftHex);
  const right = parseHex(rightHex);

  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    Math.pow(left[0] - right[0], 2) +
      Math.pow(left[1] - right[1], 2) +
      Math.pow(left[2] - right[2], 2),
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
  const normalized = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((index) => normalized.slice(index, index + 2))
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
