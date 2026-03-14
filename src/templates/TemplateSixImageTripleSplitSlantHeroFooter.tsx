/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const DEFAULT_COLORS = {
  bandBackground: "#f6eedf",
  footerBackground: "#f1e3cf",
  title: "#5f371f",
  accent: "#d85637",
  subtitle: "#74432a",
  divider: "#b69176",
  domain: "#4f2f1f",
  gutter: "#251c16",
} as const;

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 1.04,
    textTransform: "none" as const,
  },
  titleAccent: {
    fontFamily: "var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    textTransform: "none" as const,
  },
  subtitle: {
    fontFamily: "var(--font-satisfy), cursive",
    fontWeight: 400,
    letterSpacing: "0",
    lineHeight: 1.08,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateSixImageTripleSplitSlantHeroFooter({
  title,
  subtitle,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = presetId ? getSplitVerticalVisualPreset(presetId) : null;
  const imageSet = normalizeImages(images, 6);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const topStripHeight = 612;
  const topStripGap = 8;
  const middleBandTop = topStripHeight;
  const middleBandHeight = 446;
  const heroImageTop = middleBandTop + middleBandHeight;
  const footerHeight = 120;
  const heroHeight = 1920 - heroImageTop - footerHeight;
  const topImageFilter = "saturate(1.04) contrast(1.03)";
  const middleBandBackground = preset
    ? mixHex(DEFAULT_COLORS.bandBackground, tintTowardsWhite(preset.palette.band, 0.82), 0.46)
    : DEFAULT_COLORS.bandBackground;
  const footerBackground = preset
    ? mixHex(DEFAULT_COLORS.footerBackground, tintTowardsWhite(preset.palette.canvas, 0.78), 0.4)
    : DEFAULT_COLORS.footerBackground;
  const gutterColor = preset
    ? mixHex(DEFAULT_COLORS.gutter, deepenHex(preset.palette.footer, 0.46), 0.35)
    : DEFAULT_COLORS.gutter;
  const titleColor = ensureContrastColor(
    middleBandBackground,
    preset ? deepenHex(preset.palette.title, 0.34) : DEFAULT_COLORS.title,
    [DEFAULT_COLORS.title, deepenHex(DEFAULT_COLORS.gutter, 0.08), "#231812"],
    5.8,
  );
  const accentColor = ensureContrastColor(
    middleBandBackground,
    preset ? mixHex(DEFAULT_COLORS.accent, mixHex(preset.palette.divider, "#ef5333", 0.45), 0.58) : DEFAULT_COLORS.accent,
    [DEFAULT_COLORS.accent, "#d3472d", titleColor],
    3.2,
  );
  const subtitleColor = ensureContrastColor(
    middleBandBackground,
    preset ? deepenHex(mixHex(DEFAULT_COLORS.subtitle, preset.palette.subtitle, 0.42), 0.08) : DEFAULT_COLORS.subtitle,
    [DEFAULT_COLORS.subtitle, titleColor, "#744632"],
    3.4,
  );
  const dividerColor = ensureContrastColor(
    middleBandBackground,
    preset ? mixHex(DEFAULT_COLORS.divider, preset.palette.divider, 0.5) : DEFAULT_COLORS.divider,
    [DEFAULT_COLORS.divider, subtitleColor],
    2.1,
  );
  const domainColor = ensureContrastColor(
    footerBackground,
    preset ? deepenHex(mixHex(DEFAULT_COLORS.domain, preset.palette.footer, 0.28), 0.18) : DEFAULT_COLORS.domain,
    [DEFAULT_COLORS.domain, titleColor, "#241916"],
    5.6,
  );
  const { primaryLine, accentLine } = splitHeadlineTwoLines(title, displayNumber);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[22px]"
      style={{ backgroundColor: middleBandBackground }}
    >
      <div
        className="absolute inset-x-0 top-0 flex"
        style={{ height: topStripHeight, gap: `${topStripGap}px`, backgroundColor: gutterColor }}
      >
        {imageSet.slice(0, 3).map((src, index) => (
          <div key={`top-${index}`} className="relative h-full flex-1 overflow-hidden">
            <img
              src={src}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ filter: topImageFilter }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.08) 100%)",
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute inset-x-0"
        style={{ top: middleBandTop, height: middleBandHeight, backgroundColor: middleBandBackground }}
      />

      <TiltedPhoto
        src={imageSet[3]}
        alt={title}
        width={326}
        height={254}
        left={154}
        top={392}
        rotate={-11}
        zIndex={20}
      />
      <TiltedPhoto
        src={imageSet[4]}
        alt={title}
        width={326}
        height={254}
        left={418}
        top={420}
        rotate={7}
        zIndex={22}
      />

      <div className="absolute inset-x-0 z-30 text-center" style={{ top: 734 }}>
        <div className="mx-auto flex max-w-[908px] flex-col items-center px-14">
          <AutoFitText
            as="p"
            text={primaryLine}
            minFontSize={80}
            maxFontSize={90}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="w-full text-center"
            textColor={titleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />

          <AutoFitText
            as="p"
            text={accentLine}
            minFontSize={108}
            maxFontSize={122}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.titleAccent.lineHeight}
            className="mt-[10px] w-full text-center"
            textColor={accentColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.titleAccent.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.titleAccent.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.titleAccent.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.titleAccent.textTransform}
          />

          <div
            className="mt-[24px] h-[4px] w-[264px] rounded-full"
            style={{ backgroundColor: withAlpha(dividerColor, 0.78) }}
          />

          <AutoFitText
            as="p"
            text={subtitle?.trim() || "That Wow from Every Angle"}
            minFontSize={40}
            maxFontSize={56}
            maxLines={2}
            lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
            className="mt-[18px] max-w-[760px]"
            textColor={subtitleColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 overflow-hidden" style={{ top: heroImageTop, height: heroHeight }}>
        <img
          src={imageSet[5]}
          alt={cleanedDomain}
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ filter: "saturate(1.05) contrast(1.03)" }}
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center px-12 text-center"
        style={{ height: footerHeight, backgroundColor: footerBackground }}
      >
        <AutoFitText
          as="p"
          text={cleanedDomain}
          minFontSize={30}
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

function TiltedPhoto({
  src,
  alt,
  width,
  height,
  left,
  top,
  rotate,
  zIndex,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: number;
  zIndex: number;
}) {
  return (
    <div
      className="absolute overflow-hidden bg-white p-[10px] shadow-[0_22px_42px_rgba(31,17,11,0.22)]"
      style={{
        left,
        top,
        width,
        height,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "center center",
        zIndex,
      }}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover object-center" />
    </div>
  );
}

function splitHeadline(title: string) {
  const safeTitle = title.trim() || "Gorgeous Lakehouse Exterior Ideas";
  const words = safeTitle.split(/\s+/).filter(Boolean);

  if (words.length <= 3) {
    return {
      primaryTitle: safeTitle,
      accentTitle: "Ideas",
    };
  }

  const candidateCounts = [2, 1, 3].filter((count) => count < words.length);
  let bestSplit = {
    primaryTitle: words.slice(0, -2).join(" "),
    accentTitle: words.slice(-2).join(" "),
    score: Number.POSITIVE_INFINITY,
  };

  for (const accentWordCount of candidateCounts) {
    const primaryTitle = words.slice(0, -accentWordCount).join(" ");
    const accentTitle = words.slice(-accentWordCount).join(" ");
    const score = Math.abs(primaryTitle.length - accentTitle.length * 1.45);

    if (score < bestSplit.score) {
      bestSplit = { primaryTitle, accentTitle, score };
    }
  }

  return {
    primaryTitle: bestSplit.primaryTitle,
    accentTitle: bestSplit.accentTitle,
  };
}

function splitHeadlineTwoLines(title: string, displayNumber: number) {
  const { primaryTitle, accentTitle } = splitHeadline(title);
  return {
    primaryLine: `${displayNumber} ${primaryTitle}`.trim(),
    accentLine: accentTitle,
  };
}

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");
  return Array.from({ length: count }).map((_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback);
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
