import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { ImageSlot } from "@/components/ImageSlot";
import { getSplitVerticalVisualPreset, getTemplateVisualPresetCategory } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 0.92,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 0.92,
  },
} as const;

export function TemplateFourImageGridNumberTitle({
  title,
  images,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const category = getTemplateVisualPresetCategory(preset.id);
  const imageSet = normalizeImages(images);
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 25;
  const titleWords = getExactlyThreeWords(title);
  const longestWordLength = Math.max(...titleWords.map((word) => word.length));
  const titleCardWidth = clamp(330 + longestWordLength * 34, 420, 620);
  const dividerColor = category === "graphic-pop" || category === "fresh-vivid"
    ? deepenHex(preset.palette.title, 0.42)
    : deepenHex(preset.palette.footer, 0.52);
  const canvasBackground = withAlpha(dividerColor, 0.96);
  const badgeBackground = pickBestContrastColor(dividerColor, [
    tintTowardsWhite(preset.palette.canvas, 0.16),
    tintTowardsWhite(preset.palette.band, 0.22),
    "#f4d7b3",
    "#f9dfbf",
  ]);
  const badgeTextColor = pickBestContrastColor(badgeBackground, [
    preset.palette.number,
    preset.palette.subtitle,
    preset.palette.title,
    "#14698a",
    deepenHex(preset.palette.number, 0.15),
  ]);
  const titleCardBackground = pickCardBackground(preset, category);
  const titlePrimaryColor = pickBestContrastColor(titleCardBackground, [
    tintTowardsWhite(preset.palette.canvas, 0.42),
    tintTowardsWhite(preset.palette.band, 0.48),
    "#f5dcc0",
    "#fbefdf",
  ]);
  const titleAccentColor = pickBestContrastColor(titleCardBackground, [
    preset.palette.divider,
    preset.palette.subtitle,
    "#f2a444",
    tintTowardsWhite(preset.palette.divider, 0.18),
  ]);
  const titleColors = [titlePrimaryColor, titleAccentColor, titlePrimaryColor];

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden"
      style={{ backgroundColor: canvasBackground }}
    >
      <GridImage src={imageSet[0]} alt={title} className="left-0 top-0 h-[954px] w-[534px]" />
      <GridImage src={imageSet[1]} alt={title} className="right-0 top-0 h-[954px] w-[534px]" />
      <GridImage src={imageSet[2]} alt={title} className="bottom-0 left-0 h-[954px] w-[534px]" />
      <GridImage src={imageSet[3]} alt={title} className="bottom-0 right-0 h-[954px] w-[534px]" />

      <div
        className="absolute left-1/2 top-0 h-full w-[12px] -translate-x-1/2"
        style={{ backgroundColor: dividerColor }}
      />
      <div
        className="absolute left-0 top-1/2 h-[12px] w-full -translate-y-1/2"
        style={{ backgroundColor: dividerColor }}
      />

      <div
        className="absolute left-1/2 top-[504px] z-40 flex h-[312px] w-[312px] -translate-x-1/2 items-center justify-center rounded-full shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
        style={{ backgroundColor: badgeBackground }}
      >
        <span
          className="block text-center"
          style={{
            color: badgeTextColor,
            fontFamily: TEMPLATE_TYPOGRAPHY.number.fontFamily,
            fontWeight: TEMPLATE_TYPOGRAPHY.number.fontWeight,
            fontSize: displayNumber >= 100 ? "126px" : "148px",
            letterSpacing: TEMPLATE_TYPOGRAPHY.number.letterSpacing,
            lineHeight: TEMPLATE_TYPOGRAPHY.number.lineHeight,
            fontVariantNumeric: "lining-nums proportional-nums",
            transform: "translateY(-6px)",
          }}
        >
          {displayNumber}
        </span>
      </div>

      <div
        className="absolute left-1/2 top-[742px] z-30 flex -translate-x-1/2 flex-col items-center justify-center rounded-[30px] px-[34px] py-[54px] shadow-[0_26px_56px_rgba(7,20,38,0.32)]"
        style={{
          width: `${titleCardWidth}px`,
          minHeight: "630px",
          backgroundColor: titleCardBackground,
        }}
      >
        <AutoFitLineStack
          lines={titleWords}
          minFontSize={86}
          maxFontSize={114}
          lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
          gap={16}
          className="w-full"
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          colors={titleColors}
        />
      </div>
    </div>
  );
}

function GridImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <ImageSlot src={src} alt={alt} className="h-full w-full" />
    </div>
  );
}

function getExactlyThreeWords(title: string) {
  const words = normalizeWords(title);
  if (words.length >= 3) {
    return words.slice(0, 3);
  }

  if (words.length === 2) {
    return [words[0], words[1], "Ideas"];
  }

  if (words.length === 1) {
    return [words[0], "Floor", "Ideas"];
  }

  return ["Wood", "Floor", "Ideas"];
}

function normalizeWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .map((word) => toDisplayCase(word));
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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

function pickCardBackground(
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
) {
  if (category === "dark-drama") {
    return tintTowardsWhite(preset.palette.footer, 0.06);
  }

  if (category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(preset.palette.title, 0.48);
  }

  return deepenHex(preset.palette.footer, 0.58);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function stripAlphaChannel(value: string) {
  const normalized = value.replace("#", "");
  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    return `#${normalized.slice(0, 6)}`;
  }

  return value;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
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
