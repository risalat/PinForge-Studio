import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    lineHeight: 0.94,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    lineHeight: 0.9,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.14em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateColorPopLadderNumberCard({
  title,
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
  const titleLines = splitTitleIntoThreeLines(title);

  const frameColor = pickFrameColor(category, preset.palette);
  const heroBorderColor = withAlpha(frameColor, 0.92);
  const titleCardBackground = pickTitleCardBackground(category, preset.palette);
  const numberTileBackground = pickNumberTileBackground(category, preset.palette);
  const numberColor = pickReadableColor(numberTileBackground, [
    preset.palette.footer,
    preset.palette.title,
    "#141d2e",
    "#391f11",
  ]);
  const titleColor = pickReadableColor(titleCardBackground, [
    tintTowardsWhite(preset.palette.canvas, 0.42),
    tintTowardsWhite(preset.palette.band, 0.5),
    "#fff7f0",
  ]);
  const titleAccentStripe = pickAccentStripeColor(category, preset.palette);
  const titleAccentText = pickReadableColor(titleAccentStripe, [
    deepenHex(preset.palette.footer, 0.18),
    deepenHex(preset.palette.title, 0.22),
    "#1b1522",
  ]);
  const domainPillBackground = pickDomainPillBackground(titleCardBackground, preset.palette);
  const domainColor = pickReadableColor(domainPillBackground, [
    preset.palette.footer,
    preset.palette.title,
    "#101623",
  ]);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden"
      style={{ backgroundColor: frameColor }}
    >
      <div className="absolute left-[34px] top-[36px] h-[888px] w-[1012px] overflow-hidden rounded-b-[52px] rounded-t-[34px]">
        <ImageSlot src={imageSet[0]} alt={title} className="h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,24,39,0.06) 0%, rgba(14,24,39,0) 24%, rgba(14,24,39,0.18) 100%)",
          }}
        />
      </div>

      <div
        className="absolute left-[72px] top-[1028px] h-[606px] w-[396px] overflow-hidden rounded-[34px] border-[12px]"
        style={{ borderColor: heroBorderColor }}
      >
        <ImageSlot src={imageSet[1]} alt={title} className="h-full w-full" />
      </div>

      <div
        className="absolute left-[496px] top-[940px] h-[794px] w-[518px] overflow-hidden rounded-[34px] border-[12px]"
        style={{ borderColor: heroBorderColor }}
      >
        <ImageSlot src={imageSet[2]} alt={title} className="h-full w-full" />
      </div>

      <div
        className="absolute left-[84px] top-[706px] z-30 flex h-[188px] w-[188px] -rotate-[4deg] items-center justify-center rounded-[34px] shadow-[0_22px_44px_rgba(12,22,38,0.22)]"
        style={{ backgroundColor: numberTileBackground }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={86}
          maxFontSize={124}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[138px] text-center"
          textColor={numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute left-[118px] top-[808px] z-20 h-[404px] w-[844px] -rotate-[4deg] rounded-[38px] px-[56px] py-[48px] shadow-[0_28px_58px_rgba(9,19,33,0.30)]"
        style={{ backgroundColor: titleCardBackground }}
      >
        <div
          className="absolute left-[46px] top-[164px] h-[98px] w-[500px] rounded-[28px]"
          style={{ backgroundColor: titleAccentStripe }}
        />
        <div className="relative z-10 h-full w-full rotate-[4deg]">
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={62}
            maxFontSize={92}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            gap={14}
            className="w-full"
            textAlign="left"
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
            colors={[titleColor, titleAccentText, titleColor]}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[72px] z-40 flex justify-center">
        <div
          className="flex h-[74px] min-w-[328px] max-w-[620px] items-center justify-center rounded-full px-[30px] shadow-[0_12px_26px_rgba(10,18,29,0.18)]"
          style={{ backgroundColor: domainPillBackground }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={20}
            maxFontSize={28}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.domain.textTransform}
          />
        </div>
      </div>
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

function splitTitleIntoThreeLines(title: string) {
  const words = normalizeWords(title);

  if (words.length <= 3) {
    return [words[0] ?? "Color", words[1] ?? "Pop", words[2] ?? "Ideas"];
  }

  if (words.length === 4) {
    return [words[0], words[1], `${words[2]} ${words[3]}`];
  }

  return [words[0], words[1], words.slice(2, 4).join(" ")];
}

function normalizeWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .map(toDisplayCase);
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pickFrameColor(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(mixHex(palette.divider, palette.footer, 0.42), 0.22);
  }

  if (category === "feminine-bold") {
    return deepenHex(mixHex(palette.title, palette.footer, 0.58), 0.16);
  }

  return deepenHex(mixHex(palette.footer, palette.title, 0.52), 0.24);
}

function pickTitleCardBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return deepenHex(mixHex(palette.footer, palette.title, 0.62), 0.12);
  }

  if (category === "feminine-bold") {
    return deepenHex(mixHex(palette.footer, palette.title, 0.58), 0.14);
  }

  return deepenHex(mixHex(palette.footer, palette.title, 0.5), 0.18);
}

function pickNumberTileBackground(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return tintTowardsWhite(mixHex(palette.divider, palette.canvas, 0.2), 0.08);
  }

  if (category === "feminine-bold") {
    return tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.4), 0.1);
  }

  return tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.48), 0.12);
}

function pickAccentStripeColor(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  if (category === "graphic-pop" || category === "fresh-vivid") {
    return mixHex(palette.divider, "#ffb13b", 0.3);
  }

  if (category === "feminine-bold") {
    return mixHex(palette.divider, "#ffb65c", 0.36);
  }

  return mixHex(palette.divider, "#ffb864", 0.42);
}

function pickDomainPillBackground(
  titleCardBackground: string,
  palette: ReturnType<typeof getSplitVerticalVisualPreset>["palette"],
) {
  return tintTowardsWhite(mixHex(titleCardBackground, palette.canvas, 0.72), 0.1);
}

function pickReadableColor(backgroundHex: string, candidates: string[]) {
  const valid = candidates.filter(isHexColor);
  if (!isHexColor(backgroundHex) || valid.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return valid.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) >
    getContrastRatio(best, backgroundHex)
      ? candidate
      : best,
  );
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
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
