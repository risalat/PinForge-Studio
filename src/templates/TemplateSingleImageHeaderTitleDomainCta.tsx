/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  subtitle: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.004em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1.08,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.01em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
} as const;

export function TemplateSingleImageHeaderTitleDomainCta({
  title,
  subtitle,
  images,
  domain,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const imageUrl = images[0] ?? "/sample-images/1.jpg";
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const subtitleText = subtitle?.trim() || "A Complete Guide";
  const ctaText = `Read More on ${cleanedDomain}`;
  const headerBackground = withAlpha("#ffffff", 0.89);
  const inkColor = ensureContrastColor(
    "#ffffff",
    deepenHex(preset.palette.title, 0.32),
    [deepenHex(preset.palette.number, 0.42), "#3f2f26", "#2b241f"],
    7,
  );
  const secondaryInk = ensureContrastColor(
    "#ffffff",
    deepenHex(preset.palette.subtitle, 0.26),
    [inkColor, "#5a4639"],
    5.2,
  );
  const dividerColor = withAlpha(inkColor, 0.62);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: "#ddd7cf" }}
    >
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div
        className="absolute inset-x-0 top-0 backdrop-blur-[3px]"
        style={{
          height: 768,
          backgroundColor: headerBackground,
        }}
      />

      <div className="absolute inset-x-0 top-0 flex justify-center px-[86px] pt-[72px]">
        <div className="w-full max-w-[820px] text-center">
          <AutoFitText
            as="p"
            text={subtitleText}
            minFontSize={34}
            maxFontSize={62}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
            className="mx-auto w-full max-w-[760px]"
            textColor={secondaryInk}
            fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
          />

          <div
            className="mx-auto mt-[26px] h-[3px] rounded-full"
            style={{
              width: 560,
              maxWidth: "100%",
              backgroundColor: dividerColor,
            }}
          />

          <div className="mt-[66px]">
            <AutoFitTitle
              text={title}
              minFontSize={60}
              maxFontSize={102}
              maxLines={3}
              lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
              className="mx-auto w-full max-w-[860px]"
              textColor={inkColor}
              fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
            />
          </div>

          <div
            className="mx-auto mt-[64px] h-[3px] rounded-full"
            style={{
              width: 560,
              maxWidth: "100%",
              backgroundColor: dividerColor,
            }}
          />

          <div className="mt-[28px] px-[24px]">
            <AutoFitText
              as="p"
              text={ctaText}
              minFontSize={24}
              maxFontSize={42}
              maxLines={1}
              lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
              className="mx-auto w-full max-w-[760px]"
              textColor={secondaryInk}
              fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
            />
          </div>
        </div>
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
