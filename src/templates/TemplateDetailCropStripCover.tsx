import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { resolveBoldSurfaceColorRoles } from "@/lib/templates/boldSurfaceColors";
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
    lineHeight: 0.9,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.055em",
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

export function TemplateDetailCropStripCover({
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
  const imageSet = normalizeImages(images, 5);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 31;
  const titleLines = buildDetailCropTitle(title);
  const kicker = subtitle?.trim() || "Featured Collection";
  const colors = resolveDetailCropColors(category, preset);

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
            radial-gradient(circle at top left, ${withAlpha(colors.glowA, 0.24)} 0%, rgba(0,0,0,0) 32%),
            radial-gradient(circle at 84% 18%, ${withAlpha(colors.glowB, 0.2)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.18)} 0%, rgba(0,0,0,0) 34%)
          `,
        }}
      />

      <StripImage
        src={imageSet[0]}
        alt={title}
        style={{ left: 52, top: 58, width: 626, height: 220, transform: "rotate(-1.6deg)" }}
        frameColor={colors.stripFrame}
        shadow={colors.stripShadow}
      />
      <StripImage
        src={imageSet[1]}
        alt={title}
        style={{ left: 712, top: 76, width: 316, height: 184, transform: "rotate(1.8deg)" }}
        frameColor={colors.stripFrameAlt}
        shadow={colors.stripShadow}
      />

      <HeroImage
        src={imageSet[2]}
        alt={title}
        style={{ left: 90, top: 294, width: 900, height: 1010 }}
        frameColor={colors.heroFrame}
        shadow={colors.heroShadow}
      />

      <div
        className="absolute z-30 overflow-visible rounded-[40px] border p-[24px]"
        style={{
          left: 132,
          top: 806,
          width: 816,
          height: 392,
          backgroundColor: colors.cardFill,
          borderColor: colors.cardBorder,
          boxShadow: colors.cardShadow,
        }}
      >
        <div
          className="absolute left-[170px] top-[34px] flex h-[54px] min-w-[248px] max-w-[390px] items-center justify-center rounded-full border px-[24px]"
          style={{
            backgroundColor: colors.kickerFill,
            borderColor: colors.kickerBorder,
          }}
        >
          <AutoFitText
            as="p"
            text={kicker}
            minFontSize={15}
            maxFontSize={21}
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
          className="absolute left-[-28px] top-[102px] flex h-[154px] w-[154px] items-center justify-center rounded-full border-[8px]"
          style={{
            backgroundColor: colors.badgeFill,
            borderColor: colors.badgeBorder,
            boxShadow: colors.badgeShadow,
          }}
        >
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={82}
            maxFontSize={128}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[68%] text-center"
            textColor={colors.badgeText}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div
          className="absolute left-[162px] right-[44px] top-[118px] h-[4px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLine, 0.8) }}
        />
        <div
          className="absolute left-[162px] right-[44px] top-[140px] h-[2px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLineSecondary, 0.46) }}
        />

        <div className="absolute left-[168px] right-[52px] top-[166px] h-[184px]">
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={30}
            maxFontSize={62}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={8}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[colors.titleText, colors.titleText, colors.titleText]}
          />
        </div>
      </div>

      <StripImage
        src={imageSet[3]}
        alt={title}
        style={{ left: 54, top: 1362, width: 432, height: 332, transform: "rotate(1.8deg)" }}
        frameColor={colors.stripFrameAlt}
        shadow={colors.stripShadow}
      />
      <StripImage
        src={imageSet[4]}
        alt={title}
        style={{ left: 470, top: 1396, width: 562, height: 300, transform: "rotate(-1.4deg)" }}
        frameColor={colors.stripFrame}
        shadow={colors.stripShadow}
      />

      <div className="absolute inset-x-0 bottom-[58px] z-40 flex justify-center">
        <div
          className="flex h-[80px] min-w-[380px] max-w-[560px] items-center justify-center rounded-full border px-[32px]"
          style={{
            backgroundColor: colors.domainFill,
            borderColor: colors.domainBorder,
            boxShadow: colors.domainShadow,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={30}
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

function HeroImage({
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
      className="absolute overflow-hidden rounded-[40px] border p-[18px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.12), 0.84),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[28px]" />
      <div
        className="pointer-events-none absolute inset-[18px] rounded-[28px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(24,16,10,0.1) 100%)",
        }}
      />
    </div>
  );
}

function StripImage({
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
      className="absolute overflow-hidden rounded-[30px] border p-[12px]"
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor: withAlpha(tintTowardsWhite(frameColor, 0.1), 0.82),
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[20px]" />
      <div
        className="pointer-events-none absolute inset-[12px] rounded-[20px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(24,16,10,0.08) 100%)",
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

function buildDetailCropTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Easy", "Summer", "Salads"];
  }
  if (words.length === 1) {
    return [words[0], "Salad", "Recipes"];
  }
  if (words.length === 2) {
    return [words[0], words[1], "Recipes"];
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

type DetailCropColors = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  heroFrame: string;
  stripFrame: string;
  stripFrameAlt: string;
  cardFill: string;
  cardBorder: string;
  titleText: string;
  kickerFill: string;
  kickerText: string;
  kickerBorder: string;
  badgeFill: string;
  badgeText: string;
  badgeBorder: string;
  domainFill: string;
  domainText: string;
  domainBorder: string;
  accentLine: string;
  accentLineSecondary: string;
  heroShadow: string;
  stripShadow: string;
  cardShadow: string;
  badgeShadow: string;
  domainShadow: string;
};

function resolveDetailCropColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): DetailCropColors {
  const roles = resolveBoldSurfaceColorRoles(category, preset);

  return {
    canvasBackground: roles.canvasBackground,
    glowA: roles.glowA,
    glowB: roles.glowB,
    glowC: roles.glowC,
    heroFrame: roles.frameSurface,
    stripFrame: roles.frameSurfaceAlt,
    stripFrameAlt: roles.secondarySurface,
    cardFill: roles.primarySurface,
    cardBorder: roles.primarySurfaceBorder,
    titleText: roles.primarySurfaceText,
    kickerFill: roles.kickerSurface,
    kickerText: roles.kickerText,
    kickerBorder: roles.kickerBorder,
    badgeFill: roles.badgeSurface,
    badgeText: roles.badgeText,
    badgeBorder: roles.badgeBorder,
    domainFill: roles.pillSurface,
    domainText: roles.pillText,
    domainBorder: roles.pillBorder,
    accentLine: roles.accentLine,
    accentLineSecondary: roles.accentLineSecondary,
    heroShadow: `0 28px 70px ${withAlpha(roles.shadowBase, 0.18)}`,
    stripShadow: `0 18px 38px ${withAlpha(roles.shadowBase, 0.12)}`,
    cardShadow: `0 24px 54px ${withAlpha(roles.shadowBase, 0.2)}`,
    badgeShadow: `0 18px 30px ${withAlpha(roles.shadowBase, 0.2)}`,
    domainShadow: `0 14px 26px ${withAlpha(roles.shadowBase, 0.22)}`,
  };
}

function withAlpha(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
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

  const safeAmount = Math.max(0, Math.min(1, amount));
  const mix = (left: number, right: number) => Math.round(left + (right - left) * safeAmount);

  return `#${[mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2])]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
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
