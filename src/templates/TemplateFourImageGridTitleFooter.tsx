/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.22,
    textTransform: "none" as const,
  },
  domain: {
    fontFamily: "var(--font-libre-baskerville), var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    textTransform: "none" as const,
  },
} as const;

export function TemplateFourImageGridTitleFooter({
  title,
  images,
  domain,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const gutter = 6;
  const frameInset = 0;
  const tileWidth = Math.floor((1080 - frameInset * 2 - gutter) / 2);
  const topRowHeight = 945;
  const titleBandHeight = 340;
  const footerHeight = 126;
  const bottomRowHeight = 1920 - topRowHeight - titleBandHeight - footerHeight - gutter * 2;
  const rightTileLeft = frameInset + tileWidth + gutter;
  const bottomRowTop = topRowHeight + titleBandHeight + gutter * 2;
  const titleBandTop = topRowHeight + gutter;
  const titleBandBackground = withAlpha(
    tintTowardsWhite(preset.palette.canvas, 0.86),
    0.9,
  );
  const titleColor = ensureContrastColor(
    stripAlphaChannel(titleBandBackground),
    deepenHex(saturateToward(preset.palette.title, "#0c6a92", 0.22), 0.08),
    ["#0b6289", "#1d6f93", deepenHex(preset.palette.footer, 0.24), "#135f7d"],
    4.6,
  );
  const footerBackground = ensureContrastColor(
    "#ffffff",
    deepenHex(saturateToward(preset.palette.footer, "#4b7288", 0.16), 0.02),
    ["#4f7488", "#476a7e", "#3d6175"],
    4.5,
  );
  const dividerColor = withAlpha(footerBackground, 0.58);
  const domainColor = ensureContrastColor(
    footerBackground,
    tintTowardsWhite(preset.palette.domain, 0.78),
    ["#f2ede4", "#ffffff", tintTowardsWhite(preset.palette.canvas, 0.72)],
    7.2,
  );

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: footerBackground }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{
          left: frameInset,
          top: frameInset,
          width: tileWidth,
          height: topRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{
          left: rightTileLeft,
          top: frameInset,
          width: tileWidth,
          height: topRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{
          left: frameInset,
          top: bottomRowTop,
          width: tileWidth,
          height: bottomRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{
          left: rightTileLeft,
          top: bottomRowTop,
          width: tileWidth,
          height: bottomRowHeight,
        }}
      />

      <div
        className="absolute inset-x-0 z-20"
        style={{
          top: titleBandTop,
          height: titleBandHeight,
          backgroundColor: titleBandBackground,
        }}
      />

      <div
        className="absolute inset-x-0 z-30 flex items-center justify-center px-[38px]"
        style={{
          top: titleBandTop,
          height: titleBandHeight,
        }}
      >
            <AutoFitTitle
              text={title}
              minFontSize={62}
              maxFontSize={104}
              maxLines={2}
              lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
          className="w-full max-w-[1008px] text-center"
          textColor={titleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center px-[72px] text-center"
        style={{
          height: footerHeight,
          backgroundColor: footerBackground,
          borderTop: `1px solid ${dividerColor}`,
        }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={26}
          maxFontSize={40}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
          className="w-full max-w-[540px]"
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

function ensureContrastColor(
  backgroundHex: string,
  preferredHex: string,
  fallbacks: string[],
  minimumRatio: number,
) {
  const normalizedBackground = stripAlphaChannel(backgroundHex);
  const candidates = [preferredHex, ...fallbacks]
    .map((candidate) => stripAlphaChannel(candidate))
    .filter(isHexColor);

  if (!isHexColor(normalizedBackground) || candidates.length === 0) {
    return preferredHex;
  }

  if (getContrastRatio(stripAlphaChannel(preferredHex), normalizedBackground) >= minimumRatio) {
    return preferredHex;
  }

  return candidates.reduce((best, candidate) =>
    getContrastRatio(candidate, normalizedBackground) > getContrastRatio(best, normalizedBackground)
      ? candidate
      : best,
  );
}

function stripAlphaChannel(value: string) {
  const normalized = value.replace("#", "");
  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    return `#${normalized.slice(0, 6)}`;
  }

  return value;
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
