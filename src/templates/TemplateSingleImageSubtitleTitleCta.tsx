/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  subtitle: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.005em",
    lineHeight: 1.14,
    textTransform: "none" as const,
  },
  title: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 650,
    letterSpacing: "-0.018em",
    lineHeight: 1.18,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-lora), serif",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: 1.02,
  },
} as const;

export function TemplateSingleImageSubtitleTitleCta({
  title,
  subtitle,
  images,
  domain,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const imageUrl = images[0] ?? "/sample-images/1.jpg";
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const footerHeight = 212;
  const cardWidth = 790;
  const cardBottom = 102;
  const cardBackground = tintTowardsWhite(preset.palette.band, 0.93);
  const titleColor = ensureContrastColor(cardBackground, deepenHex(preset.palette.title, 0.06), [
    preset.palette.footer,
    preset.palette.number,
    "#111111",
  ], 4.7);
  const subtitleColor = ensureContrastColor(cardBackground, deepenHex(saturateToward(preset.palette.subtitle, "#2d6489", 0.28), 0.12), [
    preset.palette.subtitle,
    preset.palette.title,
    preset.palette.footer,
    "#2f658a",
  ], 2.6);
  const dividerColor = withAlpha(subtitleColor, 0.5);
  const footerBackground = deepenHex(preset.palette.footer, 0.28);
  const footerTextColor = ensureContrastColor(footerBackground, preset.palette.domain, [
    "#f7f1df",
    "#ffffff",
  ], 4.5);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: "#0f1216" }}
    >
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: footerHeight, backgroundColor: footerBackground }}
      />

      <div
        className="absolute left-1/2 overflow-hidden shadow-[0_36px_90px_rgba(11,12,18,0.42)]"
        style={{
          backgroundColor: cardBackground,
          width: cardWidth,
          bottom: cardBottom,
          transform: "translateX(-50%)",
        }}
      >
        <div className="px-[84px] pb-[82px] pt-[48px] text-center">
          <AutoFitText
            as="p"
            text={subtitle?.trim() || "Nocturne Blue by Sherwin-Williams"}
            minFontSize={30}
            maxFontSize={42}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
            className="mx-auto w-full max-w-[760px]"
            textColor={subtitleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
          />

          <div
            className="mx-auto mt-[28px] h-[3px] w-[264px] rounded-full"
            style={{ backgroundColor: dividerColor }}
          />

          <div className="mt-[42px]">
            <AutoFitTitle
              text={title}
              minFontSize={54}
              maxFontSize={80}
              maxLines={3}
              lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
              className="mx-auto w-full max-w-[610px] uppercase"
              textColor={titleColor}
              fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
            />
          </div>
        </div>

      </div>

      <div className="absolute inset-x-0 bottom-[34px] flex justify-center px-[80px] text-center">
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={36}
          maxFontSize={48}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
          className="w-full max-w-[620px]"
          textColor={footerTextColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
        />
      </div>
    </div>
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

function saturateToward(hex: string, targetHex: string, amount: number) {
  return mixHex(hex, targetHex, amount);
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

function pickBestContrastColor(backgroundHex: string, candidates: string[]) {
  const normalizedCandidates = candidates.filter((candidate) => isHexColor(candidate));
  if (!isHexColor(backgroundHex) || normalizedCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return normalizedCandidates.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) > getContrastRatio(best, backgroundHex)
      ? candidate
      : best,
  );
}

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  if (isHexColor(backgroundHex) && isHexColor(preferredHex)) {
    const preferredRatio = getContrastRatio(preferredHex, backgroundHex);
    if (preferredRatio >= minimumRatio) {
      return preferredHex;
    }
  }

  return pickBestContrastColor(backgroundHex, [preferredHex, ...fallbacks]);
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
