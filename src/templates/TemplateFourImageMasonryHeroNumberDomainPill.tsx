/* eslint-disable @next/next/no-img-element */

import { AutoFitTitle } from "@/components/AutoFitTitle";
import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-league-spartan), sans-serif",
    fontWeight: 650,
    letterSpacing: "0.005em",
    lineHeight: 1.16,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-league-spartan), sans-serif",
    fontWeight: 650,
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: 1,
  },
} as const;

export function TemplateFourImageMasonryHeroNumberDomainPill({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const imageSet = normalizeImages(images);
  const frameBackground = preset.palette.canvas;
  const frameInset = 10;
  const dividerThickness = 8;
  const collageTop = 10;
  const titleCardWidth = 864;
  const titleCardHeight = 270;
  const titleCardTop = 760;
  const titleCardBackground = preset.palette.divider;
  const titleColor = pickBestContrastColor(titleCardBackground, [
    preset.palette.title,
    preset.palette.footer,
    preset.palette.domain,
    preset.palette.canvas,
    "#3d2414",
  ]);
  const circleSize = 288;
  const circleTop = 514;
  const circleBackground = preset.palette.canvas;
  const circleBorderColor = withAlpha(preset.palette.divider, 0.96);
  const circleTextColor = pickBestContrastColor(circleBackground, [
    preset.palette.number,
    preset.palette.title,
    preset.palette.footer,
    preset.palette.domain,
    preset.palette.band,
    "#6d3810",
  ]);
  const domainPillWidth = 258;
  const domainPillHeight = 36;
  const domainPillTop = titleCardTop + titleCardHeight - 8;
  const domainPillBackground = withAlpha(preset.palette.footer, 0.94);
  const domainTextColor = pickBestContrastColor(domainPillBackground, [
    preset.palette.domain,
    preset.palette.footer,
    preset.palette.divider,
    preset.palette.number,
    preset.palette.canvas,
    preset.palette.band,
    preset.palette.title,
    "#172033",
    "#ffffff",
  ]);
  const collageHeight = 1920 - frameInset * 2;
  const leftTopHeight = Math.round(collageHeight * 0.35);
  const leftBottomHeight = collageHeight - leftTopHeight - dividerThickness;
  const rightTopHeight = Math.round(collageHeight * 0.65);
  const rightBottomHeight = collageHeight - rightTopHeight - dividerThickness;
  const leftColumnWidth = (1080 - frameInset * 2 - dividerThickness) / 2;
  const rightColumnWidth = leftColumnWidth;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[26px]"
      style={{ backgroundColor: frameBackground }}
    >
      <div
        className="absolute overflow-hidden rounded-[22px]"
        style={{
          left: frameInset,
          top: collageTop,
          width: 1080 - frameInset * 2,
          height: collageHeight,
          backgroundColor: preset.palette.divider,
        }}
      >
        <ImagePanel
          src={imageSet[0]}
          alt={title}
          style={{
            left: 0,
            top: 0,
            width: leftColumnWidth,
            height: leftTopHeight,
          }}
        />
        <ImagePanel
          src={imageSet[1]}
          alt={title}
          style={{
            right: 0,
            top: 0,
            width: rightColumnWidth,
            height: rightTopHeight,
          }}
        />
        <ImagePanel
          src={imageSet[2]}
          alt={title}
          style={{
            left: 0,
            bottom: 0,
            width: leftColumnWidth,
            height: leftBottomHeight,
          }}
        />
        <ImagePanel
          src={imageSet[3]}
          alt={title}
          style={{
            right: 0,
            bottom: 0,
            width: rightColumnWidth,
            height: rightBottomHeight,
          }}
        />
      </div>

      <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: circleTop }}>
        <div
          className="relative flex items-center justify-center rounded-full shadow-[0_18px_34px_rgba(92,55,18,0.22)]"
          style={{
            width: circleSize,
            height: circleSize,
            backgroundColor: circleBackground,
            border: `8px solid ${circleBorderColor}`,
          }}
        >
          <span
            className="relative block w-full text-center leading-none"
            style={{
              color: circleTextColor,
              fontFamily: TEMPLATE_TYPOGRAPHY.number.fontFamily,
              fontWeight: TEMPLATE_TYPOGRAPHY.number.fontWeight,
              fontSize: displayNumber >= 100 ? "122px" : "142px",
              letterSpacing: TEMPLATE_TYPOGRAPHY.number.letterSpacing,
              lineHeight: TEMPLATE_TYPOGRAPHY.number.lineHeight,
              fontVariantNumeric: "lining-nums proportional-nums",
              transform: "translateX(1px) translateY(-2px)",
            }}
          >
            {displayNumber}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 z-20 flex justify-center" style={{ top: titleCardTop }}>
        <div
          className="relative overflow-hidden text-center shadow-[0_18px_34px_rgba(105,60,10,0.18)]"
          style={{
            width: titleCardWidth,
            height: titleCardHeight,
            backgroundColor: titleCardBackground,
          }}
        >
          <div className="absolute inset-x-[22px] bottom-[28px] top-[72px] flex items-center justify-center">
            <AutoFitTitle
              text={title}
              minFontSize={48}
              maxFontSize={74}
              maxLines={2}
              lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
              className="mx-auto w-full uppercase"
              textColor={titleColor}
              fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 z-40 flex justify-center" style={{ top: domainPillTop }}>
        <div
          className="flex items-center justify-center rounded-[6px] px-5 shadow-[0_10px_16px_rgba(89,57,23,0.12)]"
          style={{
            width: domainPillWidth,
            height: domainPillHeight,
            backgroundColor: domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={13}
            maxFontSize={16}
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

function ImagePanel({
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
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.03) 100%)",
        }}
      />
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

function pickBestContrastColor(backgroundHex: string, candidates: string[]) {
  const normalizedBackground = stripAlphaChannel(backgroundHex);
  const normalizedCandidates = candidates
    .map((candidate) => stripAlphaChannel(candidate))
    .filter((candidate) => isHexColor(candidate));

  if (!isHexColor(normalizedBackground) || normalizedCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return normalizedCandidates.reduce((best, candidate) =>
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
