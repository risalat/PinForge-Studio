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

export function TemplateOvenDoorPoster({
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
  const imageSet = normalizeImages(images, 2);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 24;
  const displayKicker = subtitle?.trim() || "Fresh From The Oven";
  const titleLines = buildOvenDoorTitle(title);
  const colors = resolveOvenDoorColors(category, preset);

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
            radial-gradient(circle at 82% 16%, ${withAlpha(colors.glowB, 0.18)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.14)} 0%, rgba(0,0,0,0) 38%)
          `,
        }}
      />

      <FramedPhoto
        src={imageSet[0]}
        alt={title}
        style={{ left: 46, top: 50, width: 988, height: 1040 }}
        frameColor={colors.heroFrame}
        borderColor={colors.heroFrameBorder}
        shadow={colors.heroShadow}
      />

      <div
        className="pointer-events-none absolute left-[62px] top-[66px] z-10 rounded-[34px]"
        style={{
          width: 956,
          height: 1008,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(25,16,11,0.08) 58%, rgba(15,9,6,0.34) 100%)",
        }}
      />

      <div
        className="absolute z-30 rounded-[42px] border p-[28px]"
        style={{
          left: 116,
          top: 750,
          width: 848,
          height: 430,
          backgroundColor: colors.posterFill,
          borderColor: colors.posterBorder,
          boxShadow: colors.posterShadow,
        }}
      >
        <div
          className="absolute left-[34px] top-[34px] flex h-[54px] min-w-[300px] max-w-[440px] items-center justify-center rounded-full border px-[28px]"
          style={{
            backgroundColor: colors.kickerFill,
            borderColor: colors.kickerBorder,
          }}
        >
          <AutoFitText
            as="p"
            text={displayKicker}
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
          className="absolute left-[36px] right-[230px] top-[116px] h-[4px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLine, 0.82) }}
        />

        <div className="absolute left-[36px] right-[236px] top-[148px] h-[226px]">
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={38}
            maxFontSize={74}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={10}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[colors.posterText, colors.posterText, colors.posterText]}
          />
        </div>

        <div
          className="absolute right-[36px] top-[82px] flex h-[210px] w-[188px] items-center justify-center rounded-[38px] border-[8px]"
          style={{
            backgroundColor: colors.numberFill,
            borderColor: colors.numberBorder,
            boxShadow: colors.numberShadow,
          }}
        >
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={96}
            maxFontSize={146}
            maxLines={1}
            lineHeight={TYPOGRAPHY.number.lineHeight}
            className="w-[68%] text-center"
            textColor={colors.numberText}
            fontFamily={TYPOGRAPHY.number.fontFamily}
            fontWeight={TYPOGRAPHY.number.fontWeight}
            letterSpacing={TYPOGRAPHY.number.letterSpacing}
          />
        </div>

        <div
          className="absolute bottom-[38px] left-[36px] right-[36px] h-[10px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${withAlpha(colors.accentLineSecondary, 0.88)} 0%, ${withAlpha(colors.accentLine, 0.42)} 100%)`,
          }}
        />
      </div>

      <div
        className="absolute z-20 rounded-[46px] border p-[22px]"
        style={{
          left: 114,
          top: 1264,
          width: 852,
          height: 542,
          backgroundColor: colors.doorOuterFill,
          borderColor: colors.doorOuterBorder,
          boxShadow: colors.doorShadow,
        }}
      >
        <div
          className="absolute left-[188px] top-[28px] h-[18px] w-[474px] rounded-full border"
          style={{
            backgroundColor: colors.handleFill,
            borderColor: colors.handleBorder,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        />

        <div
          className="absolute inset-[32px] rounded-[34px] border"
          style={{
            backgroundColor: colors.doorInnerFill,
            borderColor: colors.doorInnerBorder,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
          }}
        />

        <div
          className="absolute left-[76px] top-[84px] flex h-[44px] w-[206px] items-center justify-center rounded-full border px-[20px]"
          style={{
            backgroundColor: colors.windowLabelFill,
            borderColor: colors.windowLabelBorder,
          }}
        >
          <AutoFitText
            as="p"
            text="Oven Window"
            minFontSize={13}
            maxFontSize={18}
            maxLines={1}
            lineHeight={TYPOGRAPHY.kicker.lineHeight}
            className="w-full text-center"
            textColor={colors.windowLabelText}
            fontFamily={TYPOGRAPHY.kicker.fontFamily}
            fontWeight={TYPOGRAPHY.kicker.fontWeight}
            letterSpacing={TYPOGRAPHY.kicker.letterSpacing}
            textTransform={TYPOGRAPHY.kicker.textTransform}
          />
        </div>

        <FramedPhoto
          src={imageSet[1]}
          alt={title}
          style={{ left: 70, top: 140, width: 712, height: 244 }}
          frameColor={colors.supportFrame}
          borderColor={colors.supportFrameBorder}
          shadow={colors.supportShadow}
          roundedClassName="rounded-[28px]"
          innerRoundedClassName="rounded-[18px]"
          paddingClassName="p-[12px]"
        />

        <div className="absolute inset-x-0 bottom-[54px] flex justify-center">
          <div
            className="flex h-[84px] min-w-[410px] max-w-[580px] items-center justify-center rounded-full border px-[32px]"
            style={{
              backgroundColor: colors.domainFill,
              borderColor: colors.domainBorder,
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
              textColor={colors.domainText}
              fontFamily={TYPOGRAPHY.domain.fontFamily}
              fontWeight={TYPOGRAPHY.domain.fontWeight}
              letterSpacing={TYPOGRAPHY.domain.letterSpacing}
              textTransform={TYPOGRAPHY.domain.textTransform}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FramedPhoto({
  src,
  alt,
  style,
  frameColor,
  borderColor,
  shadow,
  roundedClassName = "rounded-[38px]",
  innerRoundedClassName = "rounded-[26px]",
  paddingClassName = "p-[16px]",
}: {
  src: string;
  alt: string;
  style: CSSProperties;
  frameColor: string;
  borderColor: string;
  shadow: string;
  roundedClassName?: string;
  innerRoundedClassName?: string;
  paddingClassName?: string;
}) {
  return (
    <div
      className={`absolute overflow-hidden border ${roundedClassName} ${paddingClassName}`}
      style={{
        ...style,
        backgroundColor: frameColor,
        borderColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className={`h-full w-full ${innerRoundedClassName}`} />
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClassName}`}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(24,16,10,0.10) 100%)",
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

function buildOvenDoorTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Holiday", "Cookie", "Recipes"];
  }
  if (words.length === 1) {
    return [words[0], "Dinner", "Recipes"];
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

type OvenDoorColors = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  heroFrame: string;
  heroFrameBorder: string;
  posterFill: string;
  posterText: string;
  posterBorder: string;
  kickerFill: string;
  kickerText: string;
  kickerBorder: string;
  numberFill: string;
  numberText: string;
  numberBorder: string;
  accentLine: string;
  accentLineSecondary: string;
  doorOuterFill: string;
  doorOuterBorder: string;
  doorInnerFill: string;
  doorInnerBorder: string;
  handleFill: string;
  handleBorder: string;
  windowLabelFill: string;
  windowLabelText: string;
  windowLabelBorder: string;
  supportFrame: string;
  supportFrameBorder: string;
  domainFill: string;
  domainText: string;
  domainBorder: string;
  heroShadow: string;
  posterShadow: string;
  numberShadow: string;
  doorShadow: string;
  supportShadow: string;
  domainShadow: string;
};

function resolveOvenDoorColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): OvenDoorColors {
  const roles = resolveBoldSurfaceColorRoles(category, preset);
  const darkDoorBase =
    category === "dark-drama"
      ? deepenHex(mixHex(roles.secondarySurface, preset.palette.footer, 0.42), 0.18)
      : deepenHex(mixHex(roles.secondarySurface, preset.palette.footer, 0.52), 0.32);
  const doorInnerFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(preset.palette.band, roles.frameSurface, 0.18), 0.1)
      : tintTowardsWhite(mixHex(preset.palette.band, roles.frameSurfaceAlt, 0.24), 0.12);

  return {
    canvasBackground: roles.canvasBackground,
    glowA: roles.glowA,
    glowB: roles.glowB,
    glowC: roles.glowC,
    heroFrame: roles.frameSurface,
    heroFrameBorder: roles.primarySurfaceBorder,
    posterFill: roles.primarySurface,
    posterText: roles.primarySurfaceText,
    posterBorder: roles.primarySurfaceBorder,
    kickerFill: roles.kickerSurface,
    kickerText: roles.kickerText,
    kickerBorder: roles.kickerBorder,
    numberFill: roles.badgeSurface,
    numberText: roles.badgeText,
    numberBorder: roles.badgeBorder,
    accentLine: roles.accentLine,
    accentLineSecondary: roles.accentLineSecondary,
    doorOuterFill: darkDoorBase,
    doorOuterBorder: withAlpha(tintTowardsWhite(darkDoorBase, 0.08), 0.92),
    doorInnerFill,
    doorInnerBorder: withAlpha(tintTowardsWhite(doorInnerFill, 0.08), 0.76),
    handleFill: deepenHex(mixHex(darkDoorBase, "#9a948d", 0.34), 0.04),
    handleBorder: withAlpha(tintTowardsWhite("#f6eee6", 0.12), 0.32),
    windowLabelFill: roles.secondarySurface,
    windowLabelText: roles.kickerText,
    windowLabelBorder: roles.secondarySurfaceBorder,
    supportFrame: roles.frameSurfaceAlt,
    supportFrameBorder: roles.secondarySurfaceBorder,
    domainFill: roles.pillSurface,
    domainText: roles.pillText,
    domainBorder: roles.pillBorder,
    heroShadow: `0 28px 68px ${withAlpha(roles.shadowBase, 0.18)}`,
    posterShadow: `0 30px 74px ${withAlpha(roles.shadowBase, 0.24)}`,
    numberShadow: `0 18px 34px ${withAlpha(roles.shadowBase, 0.2)}`,
    doorShadow: `0 26px 62px ${withAlpha(roles.shadowBase, 0.2)}`,
    supportShadow: `0 16px 30px ${withAlpha(roles.shadowBase, 0.12)}`,
    domainShadow: `0 14px 28px ${withAlpha(roles.shadowBase, 0.2)}`,
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

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
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
