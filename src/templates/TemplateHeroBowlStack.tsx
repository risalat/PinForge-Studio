import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 0.9,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.06em",
    lineHeight: 0.84,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateHeroBowlStack({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const category = getTemplateVisualPresetCategory(preset.id);
  const imageSet = normalizeImages(images, 4);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 27;
  const titleLines = buildFoodHeadlineLines(title);

  const canvasBackground = pickCanvasBackground(category, preset.palette);
  const heroFrameColor = tintTowardsWhite("#fff7f0", 0.04);
  const cardBackground = pickTitleCardBackground(category, preset.palette);
  const cardBorder = withAlpha(tintTowardsWhite(mixHex(preset.palette.band, preset.palette.canvas, 0.48), 0.42), 0.18);
  const titleColor = pickReadableColor(cardBackground, [
    "#fffaf4",
    "#ffffff",
    tintTowardsWhite(preset.palette.canvas, 0.82),
    tintTowardsWhite(preset.palette.band, 0.76),
  ]);
  const badgeBackground = pickBadgeBackground(category, preset.palette);
  const badgeTextColor = pickReadableColor(badgeBackground, [
    "#fffaf4",
    "#ffffff",
    tintTowardsWhite(preset.palette.canvas, 0.8),
  ]);
  const badgeRingColor = withAlpha(tintTowardsWhite(badgeBackground, 0.28), 0.86);
  const accentColor = tintTowardsWhite(mixHex(preset.palette.divider, preset.palette.number, 0.32), 0.12);
  const domainBackground = pickDomainBackground(category, preset.palette);
  const domainTextColor = pickReadableColor(domainBackground, [
    "#fffaf4",
    "#ffffff",
    tintTowardsWhite(preset.palette.canvas, 0.8),
  ]);
  const domainBorderColor = withAlpha(tintTowardsWhite(domainBackground, 0.22), 0.8);
  const thumbFrameColor = tintTowardsWhite(mixHex("#fff8f1", preset.palette.band, 0.22), 0.08);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: canvasBackground }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 36%), radial-gradient(circle at bottom right, rgba(81,43,20,0.10) 0%, rgba(81,43,20,0) 38%)",
        }}
      />

      <FramedImage
        src={imageSet[0]}
        alt={title}
        style={{ left: 40, top: 40, width: 1000, height: 986 }}
        frameColor={heroFrameColor}
        shadow="0 30px 72px rgba(47, 24, 12, 0.18)"
      />

      <div
        className="absolute z-30 rounded-[42px] border p-[34px] shadow-[0_26px_60px_rgba(33,18,9,0.22)]"
        style={{
          left: 118,
          top: 782,
          width: 864,
          height: 406,
          backgroundColor: cardBackground,
          borderColor: cardBorder,
        }}
      >
        <div
          className="absolute left-[232px] top-[40px] h-[16px] w-[156px] rounded-full"
          style={{ backgroundColor: withAlpha(accentColor, 0.92) }}
        />
        <div className="absolute left-[232px] top-[100px] h-[244px] w-[522px]">
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={46}
            maxFontSize={90}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={10}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[titleColor, titleColor, titleColor]}
          />
        </div>
      </div>

      <div
        className="absolute z-40 flex items-center justify-center rounded-full"
        style={{
          left: 72,
          top: 726,
          width: 220,
          height: 220,
          backgroundColor: badgeBackground,
          border: `6px solid ${badgeRingColor}`,
          boxShadow: "0 10px 18px rgba(33, 18, 9, 0.18)",
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={100}
          maxFontSize={156}
          maxLines={1}
          lineHeight={TYPOGRAPHY.number.lineHeight}
          className="w-[70%] text-center"
          textColor={badgeTextColor}
          fontFamily={TYPOGRAPHY.number.fontFamily}
          fontWeight={TYPOGRAPHY.number.fontWeight}
          letterSpacing={TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <FramedImage
        src={imageSet[1]}
        alt={title}
        style={{ left: 70, top: 1238, width: 290, height: 488 }}
        frameColor={thumbFrameColor}
        shadow="0 18px 36px rgba(46, 24, 12, 0.14)"
      />
      <FramedImage
        src={imageSet[2]}
        alt={title}
        style={{ left: 395, top: 1196, width: 290, height: 530 }}
        frameColor={thumbFrameColor}
        shadow="0 20px 40px rgba(46, 24, 12, 0.16)"
      />
      <FramedImage
        src={imageSet[3]}
        alt={title}
        style={{ left: 720, top: 1238, width: 290, height: 488 }}
        frameColor={thumbFrameColor}
        shadow="0 18px 36px rgba(46, 24, 12, 0.14)"
      />

      <div className="absolute inset-x-0 bottom-[66px] z-40 flex justify-center">
        <div
          className="flex h-[78px] min-w-[380px] max-w-[620px] items-center justify-center rounded-full border px-[34px]"
          style={{
            backgroundColor: domainBackground,
            borderColor: domainBorderColor,
            boxShadow: "0 12px 24px rgba(33, 18, 9, 0.16)",
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={20}
            maxFontSize={30}
            maxLines={1}
            lineHeight={TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainTextColor}
            fontFamily={TYPOGRAPHY.domain.fontFamily}
            fontWeight={TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TYPOGRAPHY.domain.letterSpacing}
            textTransform={TYPOGRAPHY.domain.textTransform}
          />
        </div>
      </div>
    </div>
  );
}

function FramedImage({
  src,
  alt,
  style,
  frameColor,
  shadow,
}: {
  src: string;
  alt: string;
  style: CSSProperties;
  frameColor: string;
  shadow: string;
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-[34px] p-[16px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[24px]" />
      <div
        className="pointer-events-none absolute inset-[16px] rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(73,39,20,0.10) 100%)",
        }}
      />
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

function buildFoodHeadlineLines(title: string) {
  const words = normalizeHeadlineWords(title);

  if (words.length === 0) {
    return ["Crockpot", "Soup", "Recipes"];
  }

  if (words.length === 1) {
    return [words[0], "Soup", "Recipes"];
  }

  if (words.length === 2) {
    return [words[0], words[1], "Recipes"];
  }

  if (words.length === 3) {
    return [words[0], words[1], words[2]];
  }

  if (words.length === 4) {
    return [words[0], `${words[1]} ${words[2]}`, words[3]];
  }

  return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, words[4]];
}

function normalizeHeadlineWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 5)
    .map(toDisplayCase);
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pickCanvasBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold" || category === "graphic-pop" || category === "fresh-vivid") {
    return tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.44), 0.04);
  }

  if (category === "dark-drama") {
    return tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.5), 0.1);
  }

  return tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.36), 0.08);
}

function pickTitleCardBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold") {
    return deepenHex(mixHex(palette.title, palette.footer, 0.58), 0.08);
  }

  if (category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(mixHex(palette.footer, palette.title, 0.6), 0.1);
  }

  if (category === "dark-drama") {
    return tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.38), 0.08);
  }

  return deepenHex(mixHex(palette.footer, palette.title, 0.56), 0.14);
}

function pickBadgeBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold") {
    return deepenHex(mixHex(palette.divider, palette.number, 0.52), 0.18);
  }

  if (category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold") {
    return deepenHex(mixHex(palette.divider, palette.number, 0.46), 0.14);
  }

  if (category === "dark-drama") {
    return tintTowardsWhite(mixHex(palette.divider, palette.number, 0.58), 0.18);
  }

  return deepenHex(mixHex(palette.divider, palette.number, 0.58), 0.08);
}

function pickDomainBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold" || category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(mixHex(palette.divider, palette.domain, 0.28), 0.34);
  }

  if (category === "dark-drama") {
    return tintTowardsWhite(mixHex(palette.divider, palette.domain, 0.34), 0.08);
  }

  if (category === "feminine-bold") {
    return deepenHex(mixHex(palette.divider, palette.domain, 0.18), 0.28);
  }

  return deepenHex(mixHex(palette.divider, palette.domain, 0.24), 0.22);
}

function pickReadableColor(backgroundHex: string, candidates: string[]) {
  const palette = candidates.filter((candidate) => /^#[0-9a-fA-F]{6}$/.test(candidate));
  if (!/^#[0-9a-fA-F]{6}$/.test(backgroundHex) || palette.length === 0) {
    return candidates[0] ?? "#ffffff";
  }

  return palette.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function contrastRatio(backgroundHex: string, foregroundHex: string) {
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

function mixHex(fromHex: string, toHex: string, amount: number) {
  const from = parseHex(fromHex);
  const to = parseHex(toHex);
  if (!from || !to) {
    return fromHex;
  }

  const safeAmount = Math.max(0, Math.min(1, amount));
  const mix = (left: number, right: number) => Math.round(left + (right - left) * safeAmount);

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
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alpha}`;
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
