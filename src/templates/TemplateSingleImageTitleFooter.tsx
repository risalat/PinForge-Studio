/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  subtitle: {
    fontFamily: "var(--font-cormorant-garamond), var(--font-lora), serif",
    fontWeight: 600,
    letterSpacing: "0.01em",
    lineHeight: 1.08,
    textTransform: "none" as const,
    fontStyle: "italic" as const,
  },
  title: {
    fontFamily: "var(--font-libre-baskerville), var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.032em",
    lineHeight: 1.2,
    textTransform: "none" as const,
  },
  cta: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.01em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
  domain: {
    fontFamily: "var(--font-manrope), var(--font-space-grotesk), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.008em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
} as const;

export function TemplateSingleImageTitleFooter({
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
  const subtitleText = subtitle?.trim() || "Minimalist Magic";
  const darkPanel = ensureContrastColor(
    "#ffffff",
    deepenHex(preset.palette.footer, 0.56),
    ["#050505", "#111111", deepenHex(preset.palette.title, 0.72)],
    12,
  );
  const subtitleBand = tintTowardsWhite(preset.palette.band, 0.97);
  const subtitleColor = ensureContrastColor(
    subtitleBand,
    deepenHex(preset.palette.subtitle, 0.32),
    [deepenHex(preset.palette.title, 0.26), "#4f4f4f"],
    5,
  );
  const titleColor = ensureContrastColor(
    darkPanel,
    tintTowardsWhite(preset.palette.domain, 0.82),
    ["#ffffff", "#f5f0e8", tintTowardsWhite(preset.palette.title, 0.68)],
    8,
  );
  const accentColor = "#ff6b61";
  const domainColor = ensureContrastColor(darkPanel, titleColor, ["#ffffff"], 8);
  const dividerColor = withAlpha(domainColor, 0.34);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: darkPanel }}
    >
      <img
        src={imageUrl}
        alt={title}
        className="absolute left-0 top-0 h-[1320px] w-full object-cover object-center"
      />

      <div
        className="absolute inset-x-0"
        style={{
          top: 1320,
          height: 24,
          backgroundColor: darkPanel,
        }}
      />

      <div
        className="absolute inset-x-0 flex items-center justify-center px-[60px] text-center"
        style={{
          top: 1344,
          height: 92,
          backgroundColor: subtitleBand,
        }}
      >
        <AutoFitText
          as="p"
          text={subtitleText}
          minFontSize={36}
          maxFontSize={58}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
          className="w-full max-w-[760px]"
          textColor={subtitleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
          fontStyle={TEMPLATE_TYPOGRAPHY.subtitle.fontStyle}
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: 1428,
          backgroundColor: darkPanel,
        }}
      >
        <div className="px-[52px] pb-[88px] pt-[82px] text-center">
          <AutoFitTitle
            text={title}
            minFontSize={62}
            maxFontSize={96}
            maxLines={2}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="mx-auto w-full max-w-[900px]"
            textColor={titleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />

          <div className="mt-[110px] flex w-full items-center">
            <div className="flex min-w-[220px] items-center gap-[18px] text-left">
              <ReadMoreArrowMark color={accentColor} />
              <AutoFitText
                as="p"
                text="Read more"
                minFontSize={22}
                maxFontSize={28}
                maxLines={1}
                lineHeight={TEMPLATE_TYPOGRAPHY.cta.lineHeight}
                className="w-[150px] text-left"
                textColor={titleColor}
                fontFamily={TEMPLATE_TYPOGRAPHY.cta.fontFamily}
                fontWeight={TEMPLATE_TYPOGRAPHY.cta.fontWeight}
                letterSpacing={TEMPLATE_TYPOGRAPHY.cta.letterSpacing}
                textTransform={TEMPLATE_TYPOGRAPHY.cta.textTransform}
              />
            </div>

            <div className="mx-[26px] h-[2px] flex-1 rounded-full" style={{ backgroundColor: dividerColor }} />

            <div className="flex min-w-0 max-w-[320px] flex-1 items-center justify-end gap-[12px] text-right">
              <DomainGlobeMark color={accentColor} />
              <AutoFitText
                as="p"
                text={cleanedDomain}
                minFontSize={18}
                maxFontSize={26}
                maxLines={1}
                lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
                className="min-w-0 flex-1 text-right"
                textColor={domainColor}
                fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
                fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
                letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
                textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadMoreArrowMark({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[30px] w-[30px] shrink-0"
      fill="none"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M6.5 7.2 16.8 17.5" />
      <path d="M10.2 17.5h6.6V10.9" />
    </svg>
  );
}

function DomainGlobeMark({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[30px] w-[30px] shrink-0"
      fill="none"
      stroke={color}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.9 12h16.2" />
      <path d="M12 3.8c2.4 2.1 3.8 5.1 3.8 8.2 0 3.1-1.4 6.1-3.8 8.2-2.4-2.1-3.8-5.1-3.8-8.2 0-3.1 1.4-6.1 3.8-8.2Z" />
    </svg>
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
