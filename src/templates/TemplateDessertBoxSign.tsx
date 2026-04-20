import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { getRuntimeContrastRatio } from "@/lib/runtime-templates/contrast";
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
    letterSpacing: "-0.04em",
    lineHeight: 0.92,
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

export function TemplateDessertBoxSign({
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
  const imageSet = normalizeImages(images, 4);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 25;
  const kicker = subtitle?.trim() || "Dessert Roundup";
  const titleLines = buildDessertTitleLines(title);
  const colors = resolveDessertBoxColors(category, preset);

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
            radial-gradient(circle at top left, ${withAlpha(colors.glowA, 0.3)} 0%, rgba(0,0,0,0) 32%),
            radial-gradient(circle at 82% 14%, ${withAlpha(colors.glowB, 0.22)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.18)} 0%, rgba(0,0,0,0) 36%),
            linear-gradient(180deg, ${withAlpha(tintTowardsWhite(colors.canvasBackground, 0.08), 0.24)} 0%, rgba(0,0,0,0) 34%, ${withAlpha(colors.shadowTint, 0.1)} 100%)
          `,
        }}
      />

      <div
        className="absolute left-[468px] top-[34px] h-[520px] w-[58px] rounded-full"
        style={{
          background: buildStripeGradient(colors.ribbonFill, colors.ribbonStripe),
          boxShadow: `0 0 0 1px ${withAlpha(colors.ribbonEdge, 0.2)}`,
          opacity: 0.52,
        }}
      />
      <div
        className="absolute left-[516px] top-[1378px] h-[472px] w-[54px] rounded-full"
        style={{
          background: buildStripeGradient(colors.ribbonFill, colors.ribbonStripe),
          boxShadow: `0 0 0 1px ${withAlpha(colors.ribbonEdge, 0.18)}`,
          opacity: 0.42,
        }}
      />

      <PhotoCard
        src={imageSet[0]}
        alt={title}
        style={{ left: 34, top: 82, width: 446, height: 646, transform: "rotate(-3.9deg)" }}
        frameColor={colors.photoFrame}
        shadow={colors.photoShadow}
      />
      <PhotoCard
        src={imageSet[1]}
        alt={title}
        style={{ left: 644, top: 118, width: 344, height: 564, transform: "rotate(3.3deg)" }}
        frameColor={colors.photoFrame}
        shadow={colors.photoShadow}
      />
      <PhotoCard
        src={imageSet[2]}
        alt={title}
        style={{ left: 78, top: 1268, width: 282, height: 534, transform: "rotate(2.1deg)" }}
        frameColor={colors.photoFrame}
        shadow={colors.photoShadow}
      />
      <PhotoCard
        src={imageSet[3]}
        alt={title}
        style={{ left: 604, top: 1160, width: 392, height: 644, transform: "rotate(-2.9deg)" }}
        frameColor={colors.photoFrame}
        shadow={colors.photoShadow}
      />

      <div
        className="absolute z-30 rounded-[46px] border p-[20px]"
        style={{
          left: 116,
          top: 596,
          width: 766,
          height: 708,
          backgroundColor: colors.signOuterFill,
          borderColor: colors.signBorder,
          boxShadow: colors.signShadow,
        }}
      >
        <div
          className="absolute inset-[18px] rounded-[34px] border"
          style={{
            backgroundColor: colors.signInnerFill,
            borderColor: colors.signInnerBorder,
            boxShadow: `inset 0 1px 0 ${withAlpha("#ffffff", 0.62)}`,
          }}
        />

        <div
          className="absolute inset-x-[82px] top-[128px] h-[3px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.divider, 0.7) }}
        />

        <div
          className="absolute left-[98px] top-[56px] flex h-[58px] w-[248px] items-center justify-center rounded-full border px-[24px]"
          style={{
            backgroundColor: colors.kickerFill,
            borderColor: colors.kickerBorder,
            boxShadow: "0 8px 18px rgba(36,16,12,0.08)",
          }}
        >
          <AutoFitText
            as="p"
            text={kicker}
            minFontSize={16}
            maxFontSize={22}
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
          className="absolute right-[-34px] top-[-34px] flex h-[178px] w-[178px] items-center justify-center rounded-full border-[9px]"
          style={{
            backgroundColor: colors.numberSealFill,
            borderColor: colors.numberSealBorder,
            boxShadow: colors.numberSealShadow,
          }}
        >
          <div
            className="absolute inset-[16px] rounded-full border"
            style={{ borderColor: withAlpha(colors.numberSealInnerRing, 0.78) }}
          />
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={86}
            maxFontSize={130}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[66%] text-center"
            textColor={colors.numberSealText}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div
          className="absolute left-[80px] right-[80px] top-[162px] h-[344px]"
          style={{
            borderTop: `2px solid ${withAlpha(colors.divider, 0.36)}`,
            paddingTop: 28,
          }}
        >
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={42}
            maxFontSize={84}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={10}
            className="h-full w-full"
            textAlign="center"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[colors.titleText, colors.titleText, colors.titleText]}
          />
        </div>

        <div
          className="absolute left-[98px] right-[98px] top-[548px] rounded-full border px-[30px] py-[18px]"
          style={{
            backgroundColor: colors.footerBandFill,
            borderColor: colors.footerBandBorder,
            boxShadow: `0 10px 22px ${withAlpha(colors.shadowTint, 0.1)}`,
          }}
        >
          <div className="flex items-center justify-center gap-[18px]">
            <div
              className="h-[3px] w-[44px] rounded-full"
              style={{ backgroundColor: withAlpha(colors.footerBandAccent, 0.52) }}
            />
            <AutoFitText
              as="p"
              text={cleanedDomain}
              minFontSize={20}
              maxFontSize={27}
              maxLines={1}
              lineHeight={TYPOGRAPHY.domain.lineHeight}
              className="w-[60%] text-center"
              textColor={colors.domainText}
              fontFamily={TYPOGRAPHY.domain.fontFamily}
              fontWeight={TYPOGRAPHY.domain.fontWeight}
              letterSpacing={TYPOGRAPHY.domain.letterSpacing}
              textTransform={TYPOGRAPHY.domain.textTransform}
            />
            <div
              className="h-[3px] w-[44px] rounded-full"
              style={{ backgroundColor: withAlpha(colors.footerBandAccent, 0.52) }}
            />
          </div>
        </div>

        <div
          className="absolute left-[42px] top-[40px] h-[16px] w-[16px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.sparkleA, 0.9) }}
        />
        <div
          className="absolute left-[72px] top-[68px] h-[8px] w-[8px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.sparkleB, 0.82) }}
        />
        <div
          className="absolute bottom-[44px] right-[58px] h-[12px] w-[12px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.sparkleA, 0.76) }}
        />
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
      className="absolute z-10 overflow-hidden rounded-[34px] border p-[14px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.1), 0.84),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[24px]" />
      <div
        className="pointer-events-none absolute inset-[14px] rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(36,16,12,0.08) 100%)",
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

function buildDessertTitleLines(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Christmas", "Dessert", "Ideas"];
  }
  if (words.length === 1) {
    return [words[0], "Dessert", "Ideas"];
  }
  if (words.length === 2) {
    return [words[0], words[1], "Ideas"];
  }
  if (words.length === 3) {
    return [words[0], words[1], words[2]];
  }
  if (words.length === 4) {
    return [`${words[0]} ${words[1]}`, words[2], words[3]];
  }
  if (words.length === 5) {
    return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, words[4]];
  }

  return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, `${words[4]} ${words[5]}`];
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

type DessertBoxColors = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  ribbonFill: string;
  ribbonStripe: string;
  ribbonEdge: string;
  photoFrame: string;
  signOuterFill: string;
  signInnerFill: string;
  signBorder: string;
  signInnerBorder: string;
  titleText: string;
  kickerFill: string;
  kickerText: string;
  kickerBorder: string;
  numberSealFill: string;
  numberSealText: string;
  numberSealBorder: string;
  numberSealInnerRing: string;
  footerBandFill: string;
  footerBandBorder: string;
  footerBandAccent: string;
  domainText: string;
  divider: string;
  sparkleA: string;
  sparkleB: string;
  shadowTint: string;
  photoShadow: string;
  signShadow: string;
  numberSealShadow: string;
};

function resolveDessertBoxColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): DessertBoxColors {
  const { palette } = preset;
  const accent = pickMostChromaticColor([
    ...(preset.supportingColors ?? []),
    palette.divider,
    palette.number,
    palette.title,
  ]);
  const coolPreset = isCoolPresetFamily(preset);
  const canvasBackground =
    category === "dark-drama"
      ? deepenHex(mixHex(palette.canvas, palette.footer, 0.7), 0.16)
      : tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.38), 0.12);
  const ribbonFill =
    category === "dark-drama"
      ? deepenHex(mixHex(accent, palette.footer, 0.48), 0.12)
      : tintTowardsWhite(mixHex(accent, palette.footer, 0.22), 0.18);
  const ribbonStripe =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.band, accent, 0.52), 0.16)
      : tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.18), 0.38);
  const photoFrame = tintTowardsWhite(mixHex(palette.band, ribbonFill, 0.18), 0.08);
  const signOuterFill =
    category === "dark-drama" || category === "graphic-pop"
      ? deepenHex(mixHex(palette.footer, accent, 0.46), 0.08)
      : tintTowardsWhite(mixHex(palette.footer, accent, 0.16), 0.1);
  const signInnerFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(palette.band, palette.canvas, 0.3), 0.18)
      : tintTowardsWhite(mixHex(palette.band, "#ffffff", 0.18), 0.16);
  const titleText = pickReadableColor(signInnerFill, [
    deepenHex(palette.domain, 0.36),
    deepenHex(palette.title, 0.32),
    "#25160f",
    "#ffffff",
  ]);
  const kickerFill = tintTowardsWhite(mixHex(signInnerFill, accent, 0.14), 0.06);
  const kickerText = pickReadableColor(kickerFill, [
    deepenHex(palette.title, 0.24),
    deepenHex(palette.domain, 0.24),
    "#25160f",
  ]);
  const numberSealFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(accent, palette.number, 0.34), 0.04)
      : deepenHex(mixHex(accent, palette.number, 0.38), 0.14);
  const numberSealText = pickReadableColor(numberSealFill, ["#fff8ef", "#ffffff", "#1c120d"]);
  const footerBandFill = tintTowardsWhite(mixHex(signInnerFill, palette.footer, 0.18), 0.04);
  const domainText = pickReadableColor(footerBandFill, [
    deepenHex(palette.domain, 0.28),
    deepenHex(palette.title, 0.28),
    "#2a1810",
  ]);
  const divider = tintTowardsWhite(mixHex(accent, palette.divider, 0.42), 0.08);
  const sparkleA = coolPreset ? tintTowardsWhite(palette.number, 0.12) : tintTowardsWhite(accent, 0.16);
  const sparkleB = tintTowardsWhite(mixHex(palette.band, accent, 0.46), 0.28);
  const shadowTint = category === "dark-drama" ? "#120907" : deepenHex(mixHex(accent, palette.footer, 0.62), 0.46);

  return {
    canvasBackground,
    glowA: tintTowardsWhite(mixHex(accent, palette.canvas, 0.16), 0.14),
    glowB: tintTowardsWhite(mixHex(palette.number, palette.divider, 0.4), 0.1),
    glowC: tintTowardsWhite(mixHex(palette.footer, accent, 0.4), 0.18),
    ribbonFill,
    ribbonStripe,
    ribbonEdge: tintTowardsWhite(ribbonFill, 0.14),
    photoFrame,
    signOuterFill,
    signInnerFill,
    signBorder: withAlpha(tintTowardsWhite(signOuterFill, 0.12), 0.92),
    signInnerBorder: withAlpha(tintTowardsWhite(mixHex(signInnerFill, accent, 0.12), 0.1), 0.74),
    titleText,
    kickerFill,
    kickerText,
    kickerBorder: withAlpha(tintTowardsWhite(kickerFill, 0.18), 0.72),
    numberSealFill,
    numberSealText,
    numberSealBorder: withAlpha(tintTowardsWhite(numberSealFill, 0.1), 0.92),
    numberSealInnerRing: tintTowardsWhite(numberSealFill, 0.2),
    footerBandFill,
    footerBandBorder: withAlpha(tintTowardsWhite(footerBandFill, 0.12), 0.68),
    footerBandAccent: divider,
    domainText,
    divider,
    sparkleA,
    sparkleB,
    shadowTint,
    photoShadow: `0 24px 54px ${withAlpha(shadowTint, 0.18)}`,
    signShadow: `0 34px 76px ${withAlpha(shadowTint, 0.24)}`,
    numberSealShadow: `0 16px 30px ${withAlpha(shadowTint, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
  };
}

function buildStripeGradient(base: string, stripe: string) {
  return `repeating-linear-gradient(135deg, ${base} 0 18px, ${stripe} 18px 36px)`;
}

function pickMostChromaticColor(colors: string[]) {
  const validColors = colors.filter((color) => /^#[0-9a-fA-F]{6}$/.test(color));
  if (validColors.length === 0) {
    return "#b84e2f";
  }

  return validColors.reduce((best, current) => {
    const bestHsl = hexToHsl(best);
    const currentHsl = hexToHsl(current);
    return currentHsl.s > bestHsl.s ? current : best;
  }, validColors[0]);
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
  return getRuntimeContrastRatio(foregroundHex, backgroundHex);
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

function isCoolPresetFamily(preset: ReturnType<typeof getSplitVerticalVisualPreset>) {
  const coolCandidates = [preset.palette.title, preset.palette.number, preset.palette.domain];
  return coolCandidates.some((color) => {
    const { h, s } = hexToHsl(color);
    return s > 0.12 && h >= 185 && h <= 285;
  });
}
