/* eslint-disable @next/next/no-img-element */

import { AutoFitTitle } from "@/components/AutoFitTitle";
import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-alata), sans-serif",
    fontWeight: 400,
    letterSpacing: "0.08em",
    lineHeight: 1.25,
    textTransform: "none" as const,
  },
  number: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 0.92,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: 1,
  },
} as const;

export function TemplateFourImageGridNumberTitleDomain({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const frameInset = 10;
  const gutter = 8;
  const frameWidth = 1080 - frameInset * 2;
  const topRowHeight = 970;
  const lowerRowHeight = 490;
  const topLeftWidth = 680;
  const topRightWidth = frameWidth - topLeftWidth - gutter;
  const lowerLeftWidth = 338;
  const lowerRightWidth = frameWidth - lowerLeftWidth - gutter;
  const lowerRowTop = frameInset + topRowHeight + gutter;
  const titleBandTop = lowerRowTop + lowerRowHeight;
  const circleSize = 302;
  const circleOverlap = Math.round(circleSize * 0.35);
  const circleTop = titleBandTop - (circleSize - circleOverlap);
  const domainPillWidth = 312;
  const domainPillHeight = 56;
  const domainPillBottom = 26;
  const frameColor = withAlpha(deepenHex(preset.palette.divider, 0.06), 0.98);
  const titleBandBackground = preset.palette.footer;
  const titleColor = pickBestContrastColor(titleBandBackground, [
    preset.palette.canvas,
    preset.palette.domain,
    preset.palette.band,
    preset.palette.title,
    deepenHex(preset.palette.footer, 0.32),
    "#172033",
    "#fffaf2",
  ]);
  const circleBackground = pickBestContrastColor(frameColor, [
    preset.palette.canvas,
    preset.palette.band,
    tintTowardsWhite(preset.palette.canvas, 0.12),
    "#fff6df",
  ]);
  const circleTextColor = pickBestContrastColor(circleBackground, [
    preset.palette.number,
    preset.palette.title,
    deepenHex(preset.palette.footer, 0.22),
    "#6f4310",
  ]);
  const domainPillBackground = pickBestContrastColor(titleBandBackground, [
    preset.palette.canvas,
    preset.palette.band,
    tintTowardsWhite(preset.palette.canvas, 0.16),
    "#fffbe9",
  ]);
  const domainTextColor = pickBestContrastColor(domainPillBackground, [
    preset.palette.footer,
    preset.palette.title,
    preset.palette.domain,
    "#d86531",
  ]);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[26px]"
      style={{ backgroundColor: frameColor }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{
          left: frameInset,
          top: frameInset,
          width: topLeftWidth,
          height: topRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{
          right: frameInset,
          top: frameInset,
          width: topRightWidth,
          height: topRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{
          left: frameInset,
          top: lowerRowTop,
          width: lowerLeftWidth,
          height: lowerRowHeight,
        }}
      />
      <ImageTile
        src={imageSet[3]}
        alt={title}
        style={{
          right: frameInset,
          top: lowerRowTop,
          width: lowerRightWidth,
          height: lowerRowHeight,
        }}
      />

      <div
        className="absolute inset-x-[10px] bottom-[10px] z-10 rounded-b-[22px]"
        style={{
          top: titleBandTop,
          backgroundColor: titleBandBackground,
        }}
      />

      <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: circleTop }}>
        <div
          className="flex items-center justify-center rounded-full shadow-[0_20px_42px_rgba(51,24,11,0.18)]"
          style={{
            width: circleSize,
            height: circleSize,
            backgroundColor: circleBackground,
          }}
        >
          <span
            className="block text-center"
            style={{
              color: circleTextColor,
              fontFamily: TEMPLATE_TYPOGRAPHY.number.fontFamily,
              fontWeight: TEMPLATE_TYPOGRAPHY.number.fontWeight,
              fontSize: displayNumber >= 100 ? "138px" : "160px",
              letterSpacing: TEMPLATE_TYPOGRAPHY.number.letterSpacing,
              lineHeight: TEMPLATE_TYPOGRAPHY.number.lineHeight,
              transform: "translateY(-6px)",
              fontVariantNumeric: "lining-nums proportional-nums",
            }}
          >
            {displayNumber}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 z-20 flex justify-center" style={{ top: titleBandTop + 124 }}>
        <div className="w-[960px]">
          <AutoFitTitle
            text={title}
            minFontSize={54}
            maxFontSize={74}
            maxLines={3}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="w-full text-center"
            textColor={titleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 z-40 flex justify-center" style={{ bottom: domainPillBottom }}>
        <div
          className="flex items-center justify-center rounded-full px-6 shadow-[0_12px_24px_rgba(52,23,11,0.16)]"
          style={{
            width: domainPillWidth,
            height: domainPillHeight,
            backgroundColor: domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={24}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainTextColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          />
        </div>
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
    <div className="absolute overflow-hidden rounded-none" style={style}>
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
  const normalizedBackground = stripAlphaChannel(backgroundHex);
  const normalizedCandidates = candidates
    .map((candidate) => stripAlphaChannel(candidate))
    .filter((candidate) => isHexColor(candidate));

  if (!isHexColor(normalizedBackground) || normalizedCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return normalizedCandidates.reduce((best, candidate) =>
    getContrastRatio(candidate, normalizedBackground) >
    getContrastRatio(best, normalizedBackground)
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
