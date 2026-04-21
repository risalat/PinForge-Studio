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
  meta: {
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

export function TemplateTakeoutTicketStack({
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
  const displayKicker = subtitle?.trim() || "Hot Order";
  const titleLines = buildTicketTitle(title);
  const colors = resolveTicketColors(category, preset);

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
            radial-gradient(circle at top left, ${withAlpha(colors.glowA, 0.22)} 0%, rgba(0,0,0,0) 34%),
            radial-gradient(circle at 84% 18%, ${withAlpha(colors.glowB, 0.18)} 0%, rgba(0,0,0,0) 28%),
            radial-gradient(circle at bottom center, ${withAlpha(colors.glowC, 0.14)} 0%, rgba(0,0,0,0) 38%)
          `,
        }}
      />

      <TicketCard
        style={{ left: 74, top: 98, width: 690, height: 1128, transform: "rotate(-3.2deg)" }}
        fill={colors.heroTicketFill}
        borderColor={colors.heroTicketBorder}
        cutoutColor={colors.canvasBackground}
        shadow={colors.heroTicketShadow}
      >
        <div
          className="absolute left-[34px] right-[34px] top-[36px] rounded-[26px] border p-[12px]"
          style={{
            height: 618,
            backgroundColor: colors.heroFrame,
            borderColor: colors.heroFrameBorder,
            boxShadow: `0 20px 44px ${withAlpha(colors.shadowBase, 0.12)}`,
          }}
        >
          <ImageSlot src={imageSet[0]} alt={title} className="h-full w-full rounded-[18px]" />
          <div
            className="pointer-events-none absolute inset-[12px] rounded-[18px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(22,14,10,0.10) 100%)",
            }}
          />
        </div>

        <div
          className="absolute right-[-26px] top-[74px] flex h-[196px] w-[182px] items-center justify-center rounded-[34px] border-[8px]"
          style={{
            backgroundColor: colors.numberFill,
            borderColor: colors.numberBorder,
            boxShadow: colors.numberShadow,
          }}
        >
          <div
            className="absolute inset-[14px] rounded-[24px] border"
            style={{ borderColor: withAlpha(colors.numberInnerBorder, 0.88) }}
          />
          <AutoFitText
            as="p"
            text={String(displayNumber)}
            minFontSize={90}
            maxFontSize={138}
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
          className="absolute left-[42px] top-[690px] flex h-[50px] min-w-[226px] max-w-[340px] items-center justify-center rounded-full border px-[22px]"
          style={{
            backgroundColor: colors.kickerFill,
            borderColor: colors.kickerBorder,
          }}
        >
          <AutoFitText
            as="p"
            text={displayKicker}
            minFontSize={15}
            maxFontSize={21}
            maxLines={1}
            lineHeight={TYPOGRAPHY.meta.lineHeight}
            className="w-full text-center"
            textColor={colors.kickerText}
            fontFamily={TYPOGRAPHY.meta.fontFamily}
            fontWeight={TYPOGRAPHY.meta.fontWeight}
            letterSpacing={TYPOGRAPHY.meta.letterSpacing}
            textTransform={TYPOGRAPHY.meta.textTransform}
          />
        </div>

        <div
          className="absolute left-[42px] top-[772px] h-[6px] w-[320px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLine, 0.84) }}
        />
        <div
          className="absolute left-[42px] top-[792px] h-[2px] w-[548px] rounded-full"
          style={{ backgroundColor: withAlpha(colors.accentLineSecondary, 0.44) }}
        />

        <div className="absolute left-[42px] right-[52px] top-[828px] h-[218px]">
          <AutoFitLineStack
            lines={titleLines}
            minFontSize={36}
            maxFontSize={74}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            gap={10}
            className="h-full w-full"
            textAlign="left"
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
            colors={[colors.ticketText, colors.ticketText, colors.ticketText]}
          />
        </div>

        <div
          className="absolute bottom-[40px] left-[42px] right-[42px] flex items-center justify-between"
        >
          <div className="flex gap-[8px]">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={index}
                className="block h-[18px] w-[6px] rounded-full"
                style={{ backgroundColor: withAlpha(colors.barcodeColor, 0.86) }}
              />
            ))}
          </div>
          <div
            className="rounded-full border px-[18px] py-[8px]"
            style={{
              backgroundColor: colors.stubFill,
              borderColor: colors.stubBorder,
            }}
          >
            <AutoFitText
              as="p"
              text="Pickup"
              minFontSize={13}
              maxFontSize={18}
              maxLines={1}
              lineHeight={TYPOGRAPHY.meta.lineHeight}
              className="text-center"
              textColor={colors.stubText}
              fontFamily={TYPOGRAPHY.meta.fontFamily}
              fontWeight={TYPOGRAPHY.meta.fontWeight}
              letterSpacing={TYPOGRAPHY.meta.letterSpacing}
              textTransform={TYPOGRAPHY.meta.textTransform}
            />
          </div>
        </div>
      </TicketCard>

      <TicketCard
        style={{ left: 116, top: 1308, width: 338, height: 402, transform: "rotate(2.6deg)" }}
        fill={colors.supportTicketFill}
        borderColor={colors.supportTicketBorder}
        cutoutColor={colors.canvasBackground}
        shadow={colors.supportTicketShadow}
        compact
      >
        <div
          className="absolute inset-[22px] rounded-[24px] border p-[10px]"
          style={{
            backgroundColor: colors.supportFrame,
            borderColor: colors.supportFrameBorder,
          }}
        >
          <ImageSlot src={imageSet[1]} alt={title} className="h-full w-full rounded-[16px]" />
        </div>
      </TicketCard>

      <TicketCard
        style={{ left: 520, top: 1380, width: 438, height: 320, transform: "rotate(-2.4deg)" }}
        fill={colors.supportTicketFillAlt}
        borderColor={colors.supportTicketBorderAlt}
        cutoutColor={colors.canvasBackground}
        shadow={colors.supportTicketShadow}
        compact
      >
        <div
          className="absolute inset-[20px] rounded-[24px] border p-[10px]"
          style={{
            backgroundColor: colors.supportFrameAlt,
            borderColor: colors.supportFrameAltBorder,
          }}
        >
          <ImageSlot src={imageSet[2]} alt={title} className="h-full w-full rounded-[16px]" />
        </div>
      </TicketCard>

      <div className="absolute inset-x-0 bottom-[70px] z-40 flex justify-center">
        <div
          className="flex h-[82px] min-w-[402px] max-w-[560px] items-center justify-center rounded-full border px-[34px]"
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
  );
}

function TicketCard({
  children,
  style,
  fill,
  borderColor,
  cutoutColor,
  shadow,
  compact = false,
}: {
  children: React.ReactNode;
  style: CSSProperties;
  fill: string;
  borderColor: string;
  cutoutColor: string;
  shadow: string;
  compact?: boolean;
}) {
  const notchSize = compact ? 30 : 38;
  const notchOffset = compact ? 42 : 110;

  return (
    <div
      className="absolute rounded-[34px] border"
      style={{
        ...style,
        backgroundColor: fill,
        borderColor,
        boxShadow: shadow,
      }}
    >
      {children}
      <TicketCutout side="left" top={notchOffset} size={notchSize} fill={cutoutColor} />
      <TicketCutout side="left" top={`calc(100% - ${notchOffset + notchSize}px)`} size={notchSize} fill={cutoutColor} />
      <TicketCutout side="right" top={notchOffset} size={notchSize} fill={cutoutColor} />
      <TicketCutout side="right" top={`calc(100% - ${notchOffset + notchSize}px)`} size={notchSize} fill={cutoutColor} />
    </div>
  );
}

function TicketCutout({
  side,
  top,
  size,
  fill,
}: {
  side: "left" | "right";
  top: number | string;
  size: number;
  fill: string;
}) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        top,
        [side]: -(size / 2),
        width: size,
        height: size,
        backgroundColor: fill,
        boxShadow: `inset 0 0 0 1px ${withAlpha("#ffffff", 0.16)}`,
      }}
    />
  );
}

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");

  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function buildTicketTitle(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map(toDisplayCase);

  if (words.length === 0) {
    return ["Easy", "Dinner", "Recipes"];
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

type TicketColors = {
  canvasBackground: string;
  glowA: string;
  glowB: string;
  glowC: string;
  heroTicketFill: string;
  heroTicketBorder: string;
  heroTicketShadow: string;
  heroFrame: string;
  heroFrameBorder: string;
  numberFill: string;
  numberText: string;
  numberBorder: string;
  numberInnerBorder: string;
  numberShadow: string;
  kickerFill: string;
  kickerText: string;
  kickerBorder: string;
  accentLine: string;
  accentLineSecondary: string;
  ticketText: string;
  barcodeColor: string;
  stubFill: string;
  stubText: string;
  stubBorder: string;
  supportTicketFill: string;
  supportTicketBorder: string;
  supportTicketFillAlt: string;
  supportTicketBorderAlt: string;
  supportTicketShadow: string;
  supportFrame: string;
  supportFrameBorder: string;
  supportFrameAlt: string;
  supportFrameAltBorder: string;
  domainFill: string;
  domainText: string;
  domainBorder: string;
  domainShadow: string;
  shadowBase: string;
};

function resolveTicketColors(
  category: ReturnType<typeof getTemplateVisualPresetCategory>,
  preset: ReturnType<typeof getSplitVerticalVisualPreset>,
): TicketColors {
  const roles = resolveBoldSurfaceColorRoles(category, preset);
  const heroTicketFill =
    category === "dark-drama"
      ? tintTowardsWhite(mixHex(preset.palette.band, "#ffffff", 0.16), 0.04)
      : tintTowardsWhite(mixHex(preset.palette.band, "#ffffff", 0.22), 0.1);
  const heroTicketBorder = withAlpha(mixHex(roles.primarySurface, preset.palette.footer, 0.38), 0.32);
  const ticketText = roles.kickerText;
  const barcodeColor = deepenHex(mixHex(ticketText, preset.palette.domain, 0.22), 0.08);
  const stubFill = roles.secondarySurface;
  const stubText = roles.kickerText;
  const stubBorder = roles.secondarySurfaceBorder;

  return {
    canvasBackground: roles.canvasBackground,
    glowA: roles.glowA,
    glowB: roles.glowB,
    glowC: roles.glowC,
    heroTicketFill,
    heroTicketBorder,
    heroTicketShadow: `0 30px 72px ${withAlpha(roles.shadowBase, 0.18)}`,
    heroFrame: roles.frameSurface,
    heroFrameBorder: roles.primarySurfaceBorder,
    numberFill: roles.primarySurface,
    numberText: roles.primarySurfaceText,
    numberBorder: roles.primarySurfaceBorder,
    numberInnerBorder: tintTowardsWhite(roles.primarySurface, 0.14),
    numberShadow: `0 18px 36px ${withAlpha(roles.shadowBase, 0.22)}`,
    kickerFill: roles.kickerSurface,
    kickerText: roles.kickerText,
    kickerBorder: roles.kickerBorder,
    accentLine: roles.accentLine,
    accentLineSecondary: roles.accentLineSecondary,
    ticketText,
    barcodeColor,
    stubFill,
    stubText,
    stubBorder,
    supportTicketFill: tintTowardsWhite(mixHex(heroTicketFill, roles.frameSurfaceAlt, 0.22), 0.04),
    supportTicketBorder: withAlpha(mixHex(roles.secondarySurface, roles.primarySurface, 0.24), 0.28),
    supportTicketFillAlt: tintTowardsWhite(mixHex(heroTicketFill, roles.secondarySurface, 0.18), 0.02),
    supportTicketBorderAlt: withAlpha(mixHex(roles.secondarySurface, roles.primarySurface, 0.3), 0.28),
    supportTicketShadow: `0 18px 34px ${withAlpha(roles.shadowBase, 0.14)}`,
    supportFrame: roles.frameSurfaceAlt,
    supportFrameBorder: roles.secondarySurfaceBorder,
    supportFrameAlt: roles.secondarySurface,
    supportFrameAltBorder: roles.secondarySurfaceBorder,
    domainFill: roles.pillSurface,
    domainText: roles.pillText,
    domainBorder: roles.pillBorder,
    domainShadow: `0 14px 28px ${withAlpha(roles.shadowBase, 0.2)}`,
    shadowBase: roles.shadowBase,
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
