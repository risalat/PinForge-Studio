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
  kicker: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.16em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 0.88,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.82,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateMenuBoardSplit({
  title,
  subtitle,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const category = getTemplateVisualPresetCategory(preset.id);
  const imageSet = normalizeImages(images, 3);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 21;
  const titleLines = buildMenuBoardTitle(title);
  const displayKicker = subtitle?.trim() || "Featured Collection";

  const canvasBackground = mixHex(preset.palette.canvas, "#12100e", 0.1);
  const leftFrame = tintTowardsWhite(mixHex(preset.palette.band, "#ffffff", 0.7), 0.1);
  const rightPanel = pickPanelBackground(category, preset.palette);
  const panelEdge = withAlpha(tintTowardsWhite(mixHex(preset.palette.divider, rightPanel, 0.38), 0.22), 0.62);
  const titleColor = pickReadableColor(rightPanel, [
    "#fff8ef",
    "#ffffff",
    tintTowardsWhite(preset.palette.canvas, 0.88),
  ]);
  const accentColor = pickAccentColor(category, preset.palette);
  const numberColor = pickReadableColor(accentColor, ["#111111", "#1b1714", "#ffffff", "#fff8ef"]);
  const kickerColor = withAlpha(tintTowardsWhite(accentColor, 0.18), 0.92);
  const dividerColor = withAlpha(tintTowardsWhite(accentColor, 0.08), 0.82);
  const domainTextColor = pickReadableColor(rightPanel, ["#fff8ef", "#ffffff"]);

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
            "radial-gradient(circle at top left, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at bottom right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 36%)",
        }}
      />

      <FramedImage
        src={imageSet[0]}
        alt={title}
        style={{ left: 42, top: 42, width: 564, height: 1560 }}
        frameColor={leftFrame}
        shadow="0 26px 60px rgba(10, 8, 6, 0.18)"
      />

      <div
        className="absolute z-20 overflow-hidden rounded-[34px] border shadow-[0_28px_60px_rgba(8,6,5,0.24)]"
        style={{
          left: 642,
          top: 42,
          width: 396,
          height: 1182,
          backgroundColor: rightPanel,
          borderColor: panelEdge,
        }}
      >
        <div
          className="absolute left-[36px] top-[40px] h-[4px] w-[120px] rounded-full"
          style={{ backgroundColor: dividerColor }}
        />

        <div
          className="absolute left-[36px] top-[74px] flex h-[164px] w-[164px] items-center justify-center rounded-[28px]"
          style={{ backgroundColor: accentColor }}
        >
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={84}
            maxFontSize={132}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[70%] text-center"
            textColor={numberColor}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div className="absolute left-[36px] top-[286px] w-[312px]">
          <AutoFitText
            as="p"
            text={displayKicker}
            minFontSize={24}
            maxFontSize={34}
            maxLines={1}
            lineHeight={TYPOGRAPHY.kicker.lineHeight}
            className="w-full text-left"
            textColor={kickerColor}
            fontFamily={TYPOGRAPHY.kicker.fontFamily}
            fontWeight={TYPOGRAPHY.kicker.fontWeight}
            letterSpacing={TYPOGRAPHY.kicker.letterSpacing}
            textTransform={TYPOGRAPHY.kicker.textTransform}
          />
        </div>

        <div
          className="absolute left-[36px] top-[344px] h-[462px] w-[320px]"
          style={{ borderTop: `2px solid ${dividerColor}`, paddingTop: 26 }}
        >
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={54}
            maxFontSize={108}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={14}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[titleColor, titleColor, titleColor]}
          />
        </div>

        <div
          className="absolute bottom-[56px] left-[36px] right-[36px] h-[4px] rounded-full"
          style={{ backgroundColor: dividerColor }}
        />
        <div className="absolute bottom-[84px] left-[36px] right-[36px]">
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={24}
            maxLines={1}
            lineHeight={TYPOGRAPHY.domain.lineHeight}
            className="w-full text-left"
            textColor={domainTextColor}
            fontFamily={TYPOGRAPHY.domain.fontFamily}
            fontWeight={TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TYPOGRAPHY.domain.letterSpacing}
            textTransform={TYPOGRAPHY.domain.textTransform}
          />
        </div>
      </div>

      <FramedImage
        src={imageSet[1]}
        alt={title}
        style={{ left: 642, top: 1262, width: 396, height: 284 }}
        frameColor={tintTowardsWhite(mixHex(accentColor, "#fff3e8", 0.26), 0.12)}
        shadow="0 20px 42px rgba(11, 8, 6, 0.18)"
      />

      <FramedImage
        src={imageSet[2]}
        alt={title}
        style={{ left: 42, top: 1642, width: 996, height: 236 }}
        frameColor={tintTowardsWhite(mixHex(leftFrame, accentColor, 0.12), 0.04)}
        shadow="0 18px 36px rgba(11, 8, 6, 0.16)"
      />
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
      className="absolute overflow-hidden rounded-[30px] p-[14px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[22px]" />
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

function buildMenuBoardTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 5)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Chicken", "Dinner", "Recipes"];
  }

  if (words.length <= 2) {
    return [words.join(" "), "Dinner", "Recipes"];
  }

  if (words.length === 3) {
    return [words[0], words[1], words[2]];
  }

  if (words.length === 4) {
    return [`${words[0]} ${words[1]}`, words[2], words[3]];
  }

  return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, words[4]];
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pickPanelBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold") {
    return deepenHex(mixHex(palette.footer, palette.canvas, 0.26), 0.48);
  }
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(mixHex(palette.title, palette.footer, 0.4), 0.42);
  }
  if (category === "dark-drama") {
    return deepenHex(mixHex(palette.canvas, palette.footer, 0.18), 0.5);
  }
  return deepenHex(mixHex(palette.footer, palette.domain, 0.32), 0.42);
}

function pickAccentColor(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "food-bold") {
    return tintTowardsWhite(mixHex(palette.divider, palette.number, 0.54), 0.08);
  }
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return tintTowardsWhite(mixHex(palette.divider, palette.number, 0.48), 0.04);
  }
  if (category === "dark-drama") {
    return tintTowardsWhite(mixHex(palette.divider, palette.canvas, 0.4), 0.1);
  }
  return tintTowardsWhite(mixHex(palette.divider, palette.number, 0.44), 0.1);
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
