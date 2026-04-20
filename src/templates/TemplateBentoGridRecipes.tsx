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
    letterSpacing: "-0.045em",
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
    letterSpacing: "0.12em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateBentoGridRecipes({
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
  const imageSet = normalizeImages(images, 6);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 18;
  const titleLines = buildBentoTitle(title);
  const kicker = subtitle?.trim() || "Featured Collection";
  const colors = resolveColors(category, preset);

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
            radial-gradient(circle at top left, ${withAlpha(colors.glowA, 0.26)} 0%, rgba(0,0,0,0) 34%),
            radial-gradient(circle at top right, ${withAlpha(colors.glowB, 0.18)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.18)} 0%, rgba(0,0,0,0) 38%)
          `,
        }}
      />

      <div
        className="absolute inset-[36px] rounded-[42px]"
        style={{
          background: colors.boardFill,
          boxShadow: colors.boardShadow,
        }}
      />

      <div
        className="absolute left-[82px] top-[86px] h-[8px] w-[198px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.decorativeLineLeft, 0.84) }}
      />
      <div
        className="absolute right-[82px] top-[86px] h-[8px] w-[144px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.decorativeLineRight, 0.76) }}
      />

      <div
        className="absolute inset-[64px] grid"
        style={{
          gridTemplateColumns: "1.15fr 0.85fr",
          gridTemplateRows: "308px 308px 308px 308px 488px",
          gap: "18px",
        }}
      >
        <TitleCell
          style={{ gridColumn: "1 / 2", gridRow: "1 / 3" }}
          titleLines={titleLines}
          kicker={kicker}
          displayNumber={displayNumber}
          colors={colors}
        />
        <BentoCell
          src={imageSet[0]}
          alt={title}
          style={{ gridColumn: "2 / 3", gridRow: "1 / 2" }}
          frameColor={colors.frameFill}
          shadow={colors.frameShadow}
        />
        <BentoCell
          src={imageSet[1]}
          alt={title}
          style={{ gridColumn: "2 / 3", gridRow: "2 / 3" }}
          frameColor={colors.frameFill}
          shadow={colors.frameShadow}
        />
        <HeroCell
          src={imageSet[2]}
          alt={title}
          style={{ gridColumn: "1 / 2", gridRow: "3 / 4" }}
          frameColor={colors.heroFrameFill}
          shadow={colors.heroFrameShadow}
        />
        <BentoCell
          src={imageSet[3]}
          alt={title}
          style={{ gridColumn: "2 / 3", gridRow: "3 / 5" }}
          frameColor={colors.frameFill}
          shadow={colors.frameShadow}
        />
        <BentoCell
          src={imageSet[4]}
          alt={title}
          style={{ gridColumn: "1 / 2", gridRow: "4 / 5" }}
          frameColor={colors.frameFill}
          shadow={colors.frameShadow}
        />
        <FooterImageCell
          src={imageSet[5]}
          alt={title}
          domain={cleanedDomain}
          style={{ gridColumn: "1 / 3", gridRow: "5 / 6" }}
          frameColor={colors.heroFrameFill}
          shadow={colors.heroFrameShadow}
          colors={colors}
        />
      </div>
    </div>
  );
}

function TitleCell({
  style,
  titleLines,
  kicker,
  displayNumber,
  colors,
}: {
  style: CSSProperties;
  titleLines: string[];
  kicker: string;
  displayNumber: number;
  colors: BentoColors;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[34px] border"
      style={{
        ...style,
        backgroundColor: colors.titleCardFill,
        borderColor: colors.titleCardBorder,
        boxShadow: colors.titleCardShadow,
      }}
    >
      <div
        className="absolute left-[26px] top-[26px] h-[7px] w-[180px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.topStripAccent, 0.92) }}
      />

      <div
        className="absolute left-[28px] top-[54px] flex h-[118px] w-[136px] items-center justify-center rounded-[28px] border"
        style={{
          backgroundColor: colors.badgeFill,
          borderColor: colors.badgeBorder,
          boxShadow: colors.badgeShadow,
          zIndex: 3,
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={78}
          maxFontSize={118}
          maxLines={1}
          lineHeight={TYPOGRAPHY.number.lineHeight}
          className="w-[72%] text-center"
          textColor={colors.badgeText}
          fontFamily={TYPOGRAPHY.number.fontFamily}
          fontWeight={TYPOGRAPHY.number.fontWeight}
          letterSpacing={TYPOGRAPHY.number.letterSpacing}
          style={{ transform: "translateY(-8px)" }}
        />
      </div>

      <div
        className="absolute right-[28px] top-[50px] flex h-[54px] max-w-[300px] items-center justify-center rounded-full border px-[22px]"
        style={{
          backgroundColor: colors.kickerFill,
          borderColor: colors.kickerBorder,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(33,18,12,0.08)",
          zIndex: 3,
        }}
      >
        <AutoFitText
          as="p"
          text={kicker}
          minFontSize={14}
          maxFontSize={20}
          maxLines={1}
          lineHeight={TYPOGRAPHY.kicker.lineHeight}
          className="w-full text-center"
          textColor={colors.kickerText}
          fontFamily={TYPOGRAPHY.kicker.fontFamily}
          fontWeight={TYPOGRAPHY.kicker.fontWeight}
          letterSpacing={TYPOGRAPHY.kicker.letterSpacing}
          textTransform={TYPOGRAPHY.kicker.textTransform}
        />
      </div>

      <div
        className="absolute left-[28px] right-[28px] top-[228px] h-[5px] rounded-full"
        style={{ backgroundColor: withAlpha(colors.divider, 0.72), zIndex: 1 }}
      />

      <div className="absolute left-[40px] right-[40px] top-[256px] h-[344px]" style={{ zIndex: 2 }}>
        <AutoFitLineStack
          lines={titleLines}
          minFontSize={24}
          maxFontSize={56}
          lineHeight={TYPOGRAPHY.title.lineHeight}
          gap={10}
          className="h-full w-full"
          textAlign="left"
          fontFamily={TYPOGRAPHY.title.fontFamily}
          fontWeight={TYPOGRAPHY.title.fontWeight}
          letterSpacing={TYPOGRAPHY.title.letterSpacing}
          textTransform={TYPOGRAPHY.title.textTransform}
          colors={[colors.titleText, colors.titleText]}
        />
      </div>

      <div
        className="absolute bottom-[22px] left-[28px] right-[28px] h-[9px] rounded-full"
        style={{
          background: `linear-gradient(90deg, ${withAlpha(colors.secondaryAccent, 0.24)} 0%, ${withAlpha(colors.secondaryAccent, 0.94)} 24%, ${withAlpha(colors.secondaryAccent, 0.94)} 76%, ${withAlpha(colors.secondaryAccent, 0.24)} 100%)`,
        }}
      />
    </div>
  );
}

function HeroCell({
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
      className="relative overflow-hidden rounded-[32px] border p-[14px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.18), 0.88),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[24px]" />
    </div>
  );
}

function BentoCell({
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
      className="relative overflow-hidden rounded-[28px] border p-[10px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.18), 0.86),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[20px]" />
    </div>
  );
}

function FooterImageCell({
  src,
  alt,
  domain,
  style,
  frameColor,
  shadow,
  colors,
}: {
  src: string;
  alt: string;
  domain: string;
  style: CSSProperties;
  frameColor: string;
  shadow: string;
  colors: BentoColors;
}) {
  return (
    <div
        className="relative overflow-hidden rounded-[30px] border p-[12px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.16), 0.88),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[22px]" />
      <div
        className="absolute left-[30px] right-[30px] bottom-[44px] h-[8px] rounded-full"
        style={{
          background: `linear-gradient(90deg, ${withAlpha(colors.footerRule, 0.14)} 0%, ${withAlpha(colors.footerRule, 0.62)} 20%, ${withAlpha(colors.footerRule, 0.62)} 80%, ${withAlpha(colors.footerRule, 0.14)} 100%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-[56px] flex items-center justify-center">
        <div
          className="flex h-[64px] min-w-[360px] max-w-[560px] items-center justify-center rounded-full border px-[30px]"
          style={{
            backgroundColor: colors.domainFill,
            borderColor: colors.domainBorder,
            boxShadow: colors.domainShadow,
          }}
        >
          <AutoFitText
            as="p"
            text={domain}
            minFontSize={20}
            maxFontSize={28}
            maxLines={1}
            lineHeight={TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={colors.domainText}
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

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");

  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function buildBentoTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Meal Prep", "Lunch", "Recipes"];
  }

  if (words.length === 1) {
    return [words[0], "Recipe", "Ideas"];
  }

  if (words.length === 2) {
    return [words[0], words[1]];
  }

  if (words.length === 3) {
    return [words[0], words[1], words[2]];
  }

  if (words.length === 4) {
    return [words[0], words[1], words[2], words[3]];
  }

  if (words.length === 5) {
    return [`${words[0]} ${words[1]}`, words[2], words[3], words[4]];
  }

  return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, words[4], words[5]];
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

type BentoColors = {
  canvasBackground: string;
  boardFill: string;
  boardShadow: string;
  glowA: string;
  glowB: string;
  glowC: string;
  decorativeLineLeft: string;
  decorativeLineRight: string;
  heroFrameFill: string;
  heroFrameShadow: string;
  frameFill: string;
  frameShadow: string;
  titleCardFill: string;
  titleCardBorder: string;
  titleCardShadow: string;
  titleText: string;
  badgeFill: string;
  badgeText: string;
  badgeBorder: string;
  badgeShadow: string;
  kickerFill: string;
  kickerText: string;
  kickerBorder: string;
  divider: string;
  secondaryAccent: string;
  topStripAccent: string;
  footerStripFill: string;
  footerStripBorder: string;
  footerRule: string;
  domainFill: string;
  domainText: string;
  domainBorder: string;
  domainShadow: string;
};

function resolveColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): BentoColors {
  const { palette } = preset;
  const accent = pickMostChromaticColor([
    palette.title,
    palette.number,
    palette.domain,
    palette.divider,
  ]);
  const canvasBackground =
    category === "dark-drama"
      ? deepenHex(mixHex(palette.canvas, accent, 0.34), 0.34)
      : category === "food-bold"
        ? mixHex(palette.canvas, accent, 0.22)
        : category === "graphic-pop"
          ? mixHex(palette.canvas, accent, 0.18)
          : mixHex(palette.canvas, palette.band, 0.38);
  const boardFill =
    category === "dark-drama"
      ? deepenHex(mixHex(palette.footer, accent, 0.4), 0.04)
      : tintTowardsWhite(mixHex(palette.canvas, accent, 0.34), 0.12);
  const heroFrameFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(boardFill, palette.band, 0.18), 0.08)
      : tintTowardsWhite(mixHex(boardFill, accent, 0.16), 0.08);
  const frameFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(boardFill, palette.band, 0.12), 0.04)
      : tintTowardsWhite(mixHex(boardFill, accent, 0.08), 0.1);
  const strongSurface = normalizeStrongSurfaceColor(
    pickStrongSurfaceColor([palette.band, palette.footer, palette.title, palette.number]),
  );
  const titleCardFill =
    category === "dark-drama"
      ? deepenHex(mixHex(strongSurface, palette.footer, 0.18), 0.04)
      : strongSurface;
  const titleText = pickReadableColor(titleCardFill, [
    "#fffaf2",
    "#ffffff",
    deepenHex(palette.domain, 0.38),
    deepenHex(accent, 0.38),
    "#23150f",
  ]);
  const badgeFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.number, boardFill, 0.18), 0.08)
      : resolveContrastingSurface(titleCardFill, [
          normalizeStrongSurfaceColor(palette.number),
          normalizeStrongSurfaceColor(palette.footer),
          tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.54), 0.02),
        ]);
  const badgeText = pickReadableColor(badgeFill, [
    "#fffaf2",
    "#ffffff",
    deepenHex(palette.canvas, 0.54),
    deepenHex(accent, 0.42),
    "#23150f",
  ]);
  const kickerFill =
    contrastRatio(titleCardFill, tintTowardsWhite(mixHex(palette.band, boardFill, 0.22), 0.08)) >= 2.1
      ? tintTowardsWhite(mixHex(palette.band, boardFill, 0.22), 0.08)
      : tintTowardsWhite(mixHex(palette.footer, palette.canvas, 0.28), 0.04);
  const kickerText = pickReadableColor(kickerFill, [
    deepenHex(palette.domain, 0.26),
    deepenHex(accent, 0.28),
    "#2a1b14",
  ]);
  const divider = tintTowardsWhite(mixHex(palette.divider, accent, 0.26), 0.1);
  const secondaryAccent =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.number, palette.divider, 0.28), 0.16)
      : tintTowardsWhite(mixHex(palette.number, palette.divider, 0.42), 0.06);
  const domainFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.domain, palette.footer, 0.12), 0.04)
      : resolveContrastingSurface(titleCardFill, [
          normalizeStrongSurfaceColor(palette.domain),
          normalizeStrongSurfaceColor(palette.footer),
          deepenHex(mixHex(accent, palette.domain, 0.36), 0.16),
        ]);
  const domainText = pickReadableColor(domainFill, ["#fffaf2", "#ffffff"]);
  const shadowBase =
    category === "dark-drama"
      ? "rgba(0,0,0,0.42)"
      : category === "graphic-pop" || category === "food-bold"
        ? "rgba(34,18,10,0.24)"
        : "rgba(34,18,10,0.18)";

  return {
    canvasBackground,
    boardFill,
    boardShadow: `0 30px 72px ${shadowBase}`,
    glowA: tintTowardsWhite(accent, 0.36),
    glowB: tintTowardsWhite(palette.divider, 0.26),
    glowC: tintTowardsWhite(palette.number, 0.46),
    decorativeLineLeft: tintTowardsWhite(palette.divider, 0.18),
    decorativeLineRight: tintTowardsWhite(mixHex(palette.number, palette.domain, 0.34), 0.16),
    heroFrameFill,
    heroFrameShadow: `0 20px 44px ${shadowBase}`,
    frameFill,
    frameShadow: `0 16px 30px ${shadowBase}`,
    titleCardFill,
    titleCardBorder: withAlpha(tintTowardsWhite(titleCardFill, 0.14), 0.96),
    titleCardShadow: `0 18px 34px ${shadowBase}`,
    titleText,
    badgeFill,
    badgeText,
    badgeBorder: withAlpha(tintTowardsWhite(badgeFill, 0.12), 0.96),
    badgeShadow: `0 4px 8px ${shadowBase}`,
    kickerFill,
    kickerText,
    kickerBorder: withAlpha(tintTowardsWhite(kickerFill, 0.14), 0.88),
    divider,
    secondaryAccent,
    topStripAccent: tintTowardsWhite(mixHex(palette.divider, accent, 0.34), 0.04),
    footerStripFill: tintTowardsWhite(mixHex(boardFill, palette.band, 0.16), 0.04),
    footerStripBorder: withAlpha(tintTowardsWhite(mixHex(boardFill, palette.band, 0.16), 0.18), 0.76),
    footerRule: tintTowardsWhite(mixHex(domainFill, boardFill, 0.44), 0.08),
    domainFill,
    domainText,
    domainBorder: withAlpha(tintTowardsWhite(domainFill, 0.18), 0.98),
    domainShadow: `0 1px 0 rgba(255,255,255,0.18), 0 4px 8px ${shadowBase}`,
  };
}

function pickStrongSurfaceColor(colors: string[]) {
  return colors.reduce((best, current) => {
    const bestHsl = hexToHsl(best);
    const currentHsl = hexToHsl(current);
    const bestScore = bestHsl.s * 1.2 - Math.abs(bestHsl.l - 0.42) * 0.25;
    const currentScore = currentHsl.s * 1.2 - Math.abs(currentHsl.l - 0.42) * 0.25;
    return currentScore > bestScore ? current : best;
  }, colors[0] ?? "#8f4a22");
}

function normalizeStrongSurfaceColor(hex: string) {
  const luminance = getRelativeLuminance(hex);
  if (luminance > 0.72) {
    return deepenHex(hex, 0.26);
  }
  if (luminance > 0.58) {
    return deepenHex(hex, 0.14);
  }
  if (luminance < 0.14) {
    return tintTowardsWhite(hex, 0.1);
  }
  return hex;
}

function resolveContrastingSurface(backgroundHex: string, candidates: string[]) {
  return candidates.reduce((best, candidate) =>
    contrastRatio(backgroundHex, candidate) > contrastRatio(backgroundHex, best) ? candidate : best,
  );
}

function pickMostChromaticColor(colors: string[]) {
  return colors.reduce((best, current) => {
    const bestHsl = hexToHsl(best);
    const currentHsl = hexToHsl(current);
    return currentHsl.s > bestHsl.s ? current : best;
  }, colors[0] ?? "#c6511b");
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
