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
    letterSpacing: "0.14em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 0.92,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.06em",
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

export function TemplateNeonDinerStack({
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
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 27;
  const titleLines = buildNeonTitleLines(title);
  const kicker = subtitle?.trim() || "Featured Collection";
  const colors = resolveNeonDinerColors(category, preset);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[28px]"
      style={{ backgroundColor: colors.canvasBackground }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at top left, ${withAlpha(colors.glowA, 0.28)} 0%, rgba(0,0,0,0) 30%),
            radial-gradient(circle at 82% 16%, ${withAlpha(colors.glowB, 0.24)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.22)} 0%, rgba(0,0,0,0) 34%),
            linear-gradient(180deg, ${withAlpha(tintTowardsWhite(colors.canvasBackground, 0.08), 0.18)} 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0.18) 100%)
          `,
        }}
      />

      <div
        className="absolute left-[72px] top-[80px] h-[8px] w-[252px] rounded-full"
        style={{ backgroundColor: colors.accentLine }}
      />
      <div
        className="absolute right-[72px] top-[98px] h-[8px] w-[164px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.secondaryAccent, 0.86) }}
      />

      <PhotoCard
        src={imageSet[0]}
        alt={title}
        style={{ left: 124, top: 112, width: 876, height: 940 }}
        frameColor={colors.heroFrame}
        shadow={colors.heroShadow}
      />

      <div
        className="absolute z-40 rounded-[40px] border"
        style={{
          left: 30,
          top: 748,
          width: 1020,
          height: 388,
          transform: "rotate(-4.6deg)",
          transformOrigin: "center center",
          backgroundColor: colors.bandFill,
          borderColor: colors.bandBorder,
          boxShadow: colors.bandShadow,
        }}
      >
        <div
          className="absolute left-[28px] top-[26px] h-[12px] w-[236px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLine, 0.84) }}
        />
        <div
          className="absolute right-[44px] top-[26px] flex h-[60px] min-w-[280px] max-w-[420px] items-center justify-center rounded-full border px-[28px]"
          style={{
            backgroundColor: colors.kickerPillFill,
            borderColor: colors.kickerPillBorder,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 14px rgba(0,0,0,0.08)",
          }}
        >
          <AutoFitText
            as="p"
            text={kicker}
            minFontSize={17}
            maxFontSize={24}
            maxLines={1}
            lineHeight={TYPOGRAPHY.kicker.lineHeight}
            className="w-full text-center"
            textColor={colors.kickerPillText}
            fontFamily={TYPOGRAPHY.kicker.fontFamily}
            fontWeight={TYPOGRAPHY.kicker.fontWeight}
            letterSpacing={TYPOGRAPHY.kicker.letterSpacing}
            textTransform={TYPOGRAPHY.kicker.textTransform}
          />
        </div>

        <div
          className="absolute left-[30px] top-[64px] flex h-[150px] w-[176px] items-center justify-center rounded-[28px] border"
          style={{
            backgroundColor: colors.numberBlockFill,
            borderColor: colors.numberBlockBorder,
            boxShadow:
              "0 3px 0 rgba(24,14,10,0.16), 0 10px 18px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={88}
            maxFontSize={142}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[72%] text-center"
            textColor={colors.numberBlockText}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div
          className="absolute left-[224px] right-[42px] top-[116px] h-[194px]"
          style={{
            borderTop: `4px solid ${withAlpha(colors.accentLine, 0.7)}`,
            paddingTop: 22,
          }}
        >
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={36}
            maxFontSize={66}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={10}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[colors.titleText, colors.titleText, colors.titleText]}
          />
        </div>

        <div
          className="absolute bottom-[30px] left-[224px] right-[48px] h-[10px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${withAlpha(colors.secondaryAccent, 0.94)} 0%, ${withAlpha(colors.accentLine, 0.48)} 100%)`,
          }}
        />
      </div>

      <PhotoCard
        src={imageSet[1]}
        alt={title}
        style={{ left: 62, top: 1234, width: 438, height: 546, transform: "rotate(-2.8deg)" }}
        frameColor={colors.supportFrame}
        shadow={colors.supportShadow}
      />
      <PhotoCard
        src={imageSet[2]}
        alt={title}
        style={{ left: 582, top: 1234, width: 438, height: 546, transform: "rotate(2.6deg)" }}
        frameColor={colors.supportFrame}
        shadow={colors.supportShadow}
      />

      <div
        className="absolute left-[128px] right-[128px] top-[1822px] h-[4px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.footerLine, 0.4) }}
      />
      <div className="absolute inset-x-0 bottom-[54px] z-40 flex justify-center">
        <div
          className="flex h-[78px] min-w-[390px] max-w-[560px] items-center justify-center rounded-full border px-[34px]"
          style={{
            backgroundColor: colors.domainPillFill,
            borderColor: colors.domainPillBorder,
            boxShadow: colors.domainShadow,
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
            textColor={colors.domainPillText}
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

function PhotoCard({
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
      className="absolute z-10 overflow-hidden rounded-[34px] p-[14px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[24px]" />
      <div
        className="pointer-events-none absolute inset-[14px] rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(14,10,7,0.10) 100%)",
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

function buildNeonTitleLines(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Easy Dinner", "Recipes"];
  }
  if (words.length === 1) {
    return [words[0], "Recipes"];
  }
  if (words.length === 2) {
    return [words[0], words[1]];
  }
  if (words.length === 3) {
    return [words[0], `${words[1]} ${words[2]}`];
  }
  if (words.length === 4) {
    return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`];
  }
  if (words.length === 5) {
    return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]} ${words[4]}`];
  }

  return [`${words[0]} ${words[1]} ${words[2]}`, `${words[3]} ${words[4]} ${words[5]}`];
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

type NeonDinerColors = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  heroFrame: string;
  supportFrame: string;
  bandFill: string;
  bandBorder: string;
  titleText: string;
  kickerPillFill: string;
  kickerPillText: string;
  kickerPillBorder: string;
  numberBlockFill: string;
  numberBlockText: string;
  numberBlockBorder: string;
  domainPillFill: string;
  domainPillText: string;
  domainPillBorder: string;
  accentLine: string;
  secondaryAccent: string;
  footerLine: string;
  heroShadow: string;
  supportShadow: string;
  bandShadow: string;
  domainShadow: string;
};

function resolveNeonDinerColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): NeonDinerColors {
  const { palette } = preset;
  const accents = [palette.title, palette.number, palette.domain];
  const primaryAccent = pickMostChromaticColor(accents);
  const hotAccent =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(primaryAccent, palette.divider, 0.34), 0.06)
      : deepenHex(mixHex(primaryAccent, palette.divider, 0.28), 0.1);
  const panelFill =
    category === "food-bold" || category === "graphic-pop" || category === "fresh-vivid"
      ? deepenHex(mixHex(palette.footer, hotAccent, 0.46), 0.18)
      : deepenHex(mixHex(palette.footer, hotAccent, 0.28), 0.26);
  const canvasBackground = deepenHex(mixHex(palette.canvas, palette.footer, 0.76), 0.44);
  const titleText = pickReadableColor(panelFill, [
    "#fff8ef",
    "#ffffff",
    tintTowardsWhite(palette.canvas, 0.82),
    tintTowardsWhite(palette.band, 0.74),
  ]);
  const heroFrame = tintTowardsWhite(mixHex(palette.band, canvasBackground, 0.12), 0.08);
  const supportFrame = tintTowardsWhite(mixHex(palette.band, hotAccent, 0.18), 0.04);
  const numberBlockFill = deepenHex(mixHex(hotAccent, palette.number, 0.46), 0.22);
  const sharpenedNumberBlockFill = enforceFillSeparation(numberBlockFill, panelFill, {
    minimumContrast: 1.42,
    prefer: "away",
  });
  const numberBlockText = pickReadableColor(sharpenedNumberBlockFill, [
    "#fff8ef",
    "#ffffff",
    "#17120e",
  ]);
  const kickerPillFill = tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.18), 0.18);
  const kickerPillText = pickReadableColor(kickerPillFill, [
    deepenHex(palette.domain, 0.22),
    deepenHex(palette.title, 0.24),
    "#1d1711",
  ]);
  const domainPillFill = enforceFillSeparation(
    deepenHex(mixHex(palette.domain, hotAccent, 0.34), 0.32),
    canvasBackground,
    {
      minimumContrast: 1.34,
      prefer: "away",
    },
  );
  const domainPillText = pickReadableColor(domainPillFill, ["#fff8ef", "#ffffff"]);
  const accentLine = tintTowardsWhite(mixHex(hotAccent, palette.divider, 0.24), 0.04);
  const secondaryAccent = tintTowardsWhite(mixHex(palette.number, palette.band, 0.28), 0.18);
  const shadowBase =
    category === "dark-drama"
      ? "rgba(0,0,0,0.42)"
      : category === "food-bold" || category === "graphic-pop"
        ? "rgba(20,10,6,0.32)"
        : "rgba(20,10,6,0.26)";

  return {
    canvasBackground,
    glowA: tintTowardsWhite(mixHex(hotAccent, palette.canvas, 0.24), 0.12),
    glowB: tintTowardsWhite(mixHex(palette.number, palette.divider, 0.42), 0.08),
    glowC: tintTowardsWhite(mixHex(palette.domain, hotAccent, 0.34), 0.06),
    heroFrame,
    supportFrame,
    bandFill: panelFill,
    bandBorder: withAlpha(tintTowardsWhite(mixHex(panelFill, hotAccent, 0.2), 0.16), 0.74),
    titleText,
    kickerPillFill,
    kickerPillText,
    kickerPillBorder: withAlpha(tintTowardsWhite(kickerPillFill, 0.22), 0.68),
    numberBlockFill: sharpenedNumberBlockFill,
    numberBlockText,
    numberBlockBorder: withAlpha(tintTowardsWhite(sharpenedNumberBlockFill, 0.08), 0.9),
    domainPillFill,
    domainPillText,
    domainPillBorder: withAlpha(tintTowardsWhite(domainPillFill, 0.08), 0.92),
    accentLine,
    secondaryAccent,
    footerLine: tintTowardsWhite(mixHex(domainPillFill, canvasBackground, 0.72), 0.18),
    heroShadow: `0 30px 72px ${shadowBase}`,
    supportShadow: `0 22px 48px ${shadowBase}`,
    bandShadow: `0 26px 64px ${shadowBase}, 0 0 0 1px ${withAlpha(hotAccent, 0.16)}`,
    domainShadow: `0 3px 0 rgba(24,14,10,0.14), 0 10px 20px ${shadowBase}, inset 0 1px 0 rgba(255,255,255,0.14)`,
  };
}

function enforceFillSeparation(
  foregroundHex: string,
  backgroundHex: string,
  options: {
    minimumContrast: number;
    prefer: "away";
  },
) {
  let candidate = foregroundHex;
  let guard = 0;

  while (contrastRatio(candidate, backgroundHex) < options.minimumContrast && guard < 8) {
    const foregroundLuminance = getRelativeLuminance(candidate);
    const backgroundLuminance = getRelativeLuminance(backgroundHex);

    candidate =
      foregroundLuminance >= backgroundLuminance
        ? tintTowardsWhite(candidate, 0.14)
        : deepenHex(candidate, 0.14);
    guard += 1;
  }

  return candidate;
}

function pickMostChromaticColor(colors: string[]) {
  return colors.reduce((best, current) => {
    const bestHsl = hexToHsl(best);
    const currentHsl = hexToHsl(current);
    return currentHsl.s > bestHsl.s ? current : best;
  }, colors[0] ?? "#b04419");
}

function pickReadableColor(backgroundHex: string, candidates: string[]) {
  const valid = candidates.filter((candidate) => /^#[0-9a-fA-F]{6}$/.test(candidate));
  if (!/^#[0-9a-fA-F]{6}$/.test(backgroundHex) || valid.length === 0) {
    return candidates[0] ?? "#ffffff";
  }

  return valid.reduce((best, candidate) =>
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

function hexToHsl(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      default:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s,
    l,
  };
}
