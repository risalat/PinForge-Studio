import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TYPOGRAPHY = {
  lead: {
    fontFamily: "var(--font-cormorant-garamond), var(--font-literaturnaya), serif",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 0.92,
    fontStyle: "italic" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.045em",
    lineHeight: 0.86,
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

const FALLBACK_TITLE = "Modern Sunroom Decor Ideas";

export function TemplateBookmarkRibbonCollageTitle({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images, 4);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 18;
  const headline = buildCoverHeadline(title);

  const canvasBackground = tintTowardsWhite(mixHex(preset.palette.canvas, preset.palette.band, 0.24), 0.18);
  const heroFrame = tintTowardsWhite("#fff7ef", 0.06);
  const panelBackground = tintTowardsWhite(mixHex("#f8efe6", preset.palette.canvas, 0.18), 0.08);
  const panelBorder = withAlpha(deepenHex(preset.palette.footer, 0.2), 0.16);
  const ribbonBackground = deepenHex(mixHex(preset.palette.title, preset.palette.footer, 0.52), 0.12);
  const ribbonText = "#fffaf4";
  const ink = deepenHex(mixHex(preset.palette.title, preset.palette.footer, 0.38), 0.26);
  const accent = tintTowardsWhite(mixHex(preset.palette.band, preset.palette.divider, 0.38), 0.08);
  const domainBackground = deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.62), 0.34);
  const shadow = "0 30px 64px rgba(52, 34, 21, 0.16)";

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: canvasBackground }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at bottom right, rgba(109,74,44,0.08) 0%, rgba(109,74,44,0) 36%)",
        }}
      />

      <Ribbon
        number={displayNumber}
        background={ribbonBackground}
        textColor={ribbonText}
      />

      <FramedImage
        src={imageSet[0]}
        alt={title}
        style={{ left: 170, top: 72, width: 690, height: 1010 }}
        frameColor={heroFrame}
        shadow={shadow}
      />

      <FramedImage
        src={imageSet[1]}
        alt={title}
        style={{ left: 780, top: 118, width: 238, height: 314, tilt: 4.5 }}
        frameColor={heroFrame}
        shadow="0 20px 38px rgba(52, 34, 21, 0.16)"
      />

      <FramedImage
        src={imageSet[2]}
        alt={title}
        style={{ left: 774, top: 476, width: 244, height: 318, tilt: -4.5 }}
        frameColor={heroFrame}
        shadow="0 20px 38px rgba(52, 34, 21, 0.16)"
      />

      <FramedImage
        src={imageSet[3]}
        alt={title}
        style={{ left: 122, top: 1490, width: 846, height: 304 }}
        frameColor={heroFrame}
        shadow="0 20px 42px rgba(52, 34, 21, 0.14)"
      />

      <div
        className="absolute z-30"
        style={{
          left: 190,
          top: 1046,
          width: 816,
          height: 356,
          backgroundColor: panelBackground,
          border: `1px solid ${panelBorder}`,
          clipPath: "polygon(0 0, 94% 0, 100% 11%, 100% 100%, 0 100%, 0 8%)",
          boxShadow: "0 28px 64px rgba(49, 31, 19, 0.14)",
        }}
      >
        <div
          className="absolute left-[54px] top-[54px] w-[10px] rounded-full"
          style={{ height: 214, backgroundColor: withAlpha(accent, 0.88) }}
        />
        <div
          className="absolute left-[92px] top-[48px] h-[58px] w-[382px] rounded-full"
          style={{ backgroundColor: withAlpha(accent, 0.28) }}
        />
        <div className="absolute left-[92px] top-[28px] h-[96px] w-[430px]">
          <AutoFitText
            as="p"
            text={headline.lead}
            minFontSize={36}
            maxFontSize={72}
            maxLines={1}
            lineHeight={TYPOGRAPHY.lead.lineHeight}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TYPOGRAPHY.lead.fontFamily}
            fontWeight={TYPOGRAPHY.lead.fontWeight}
            fontStyle={TYPOGRAPHY.lead.fontStyle}
            letterSpacing={TYPOGRAPHY.lead.letterSpacing}
          />
        </div>
        <div className="absolute left-[90px] top-[112px] h-[96px] w-[620px]">
          <AutoFitText
            as="p"
            text={headline.mainOne}
            minFontSize={58}
            maxFontSize={120}
            maxLines={1}
            lineHeight={TYPOGRAPHY.title.lineHeight}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
          />
        </div>
        <div className="absolute left-[90px] top-[210px] h-[98px] w-[668px]">
          <AutoFitText
            as="p"
            text={headline.mainTwo}
            minFontSize={54}
            maxFontSize={112}
            maxLines={1}
            lineHeight={0.92}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TYPOGRAPHY.title.fontFamily}
            fontWeight={TYPOGRAPHY.title.fontWeight}
            letterSpacing={TYPOGRAPHY.title.letterSpacing}
            textTransform={TYPOGRAPHY.title.textTransform}
          />
        </div>

      </div>

      <div className="absolute inset-x-0 bottom-[38px] z-40 flex justify-center">
        <div
          className="flex h-[68px] min-w-[340px] max-w-[472px] items-center justify-center rounded-full px-8"
          style={{
            backgroundColor: domainBackground,
            boxShadow: "0 16px 32px rgba(44, 27, 16, 0.18)",
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={28}
            maxLines={1}
            lineHeight={TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={ribbonText}
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

function Ribbon({
  number,
  background,
  textColor,
}: {
  number: number;
  background: string;
  textColor: string;
}) {
  return (
    <div
      className="absolute z-40 flex items-center justify-center"
      style={{
        left: 44,
        top: 92,
        width: 132,
        height: 1320,
        backgroundColor: background,
        clipPath: "polygon(0 0, 100% 0, 100% 95%, 68% 100%, 0 100%)",
        boxShadow: "0 24px 46px rgba(44, 27, 16, 0.18)",
      }}
    >
      <div
        className="absolute left-1/2 top-[34px] h-[18px] w-[18px] -translate-x-1/2 rounded-full"
        style={{ backgroundColor: withAlpha("#fff9f1", 0.82) }}
      />
      <AutoFitText
        as="p"
        text={String(number)}
        minFontSize={116}
        maxFontSize={174}
        maxLines={1}
        lineHeight={TYPOGRAPHY.number.lineHeight}
        className="w-[80%] text-center"
        textColor={textColor}
        fontFamily={TYPOGRAPHY.number.fontFamily}
        fontWeight={TYPOGRAPHY.number.fontWeight}
        letterSpacing={TYPOGRAPHY.number.letterSpacing}
        style={{ transform: "translateY(-18px)" }}
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
  style: CSSProperties & { tilt?: number };
  frameColor: string;
  shadow: string;
}) {
  const { tilt, ...baseStyle } = style;

  return (
    <div
      className="absolute overflow-hidden rounded-[32px] p-[16px]"
      style={{
        ...baseStyle,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[20px]" />
      <div
        className="pointer-events-none absolute inset-[16px] rounded-[20px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(77,47,24,0.08) 100%)",
        }}
      />
    </div>
  );
}

function buildCoverHeadline(title: string) {
  const words = normalizeHeadlineWords(title);

  if (words.length <= 2) {
    return {
      lead: words[0] ?? "Modern",
      mainOne: words[1] ?? "Sunroom",
      mainTwo: "Ideas",
    };
  }

  if (words.length === 3) {
    return {
      lead: words[0],
      mainOne: words[1],
      mainTwo: words[2],
    };
  }

  if (words.length === 4) {
    return {
      lead: words[0],
      mainOne: `${words[1]} ${words[2]}`,
      mainTwo: words[3],
    };
  }

  if (words.length === 5) {
    return {
      lead: words[0],
      mainOne: `${words[1]} ${words[2]}`,
      mainTwo: `${words[3]} ${words[4]}`,
    };
  }

  return {
    lead: `${words[0]} ${words[1]}`,
    mainOne: `${words[2]} ${words[3]}`,
    mainTwo: `${words[4]} ${words[5]}`,
  };
}

function normalizeHeadlineWords(title: string) {
  const safeTitle = title.trim() || FALLBACK_TITLE;
  return safeTitle
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((word) =>
      word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
}

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");
  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function mixHex(first: string, second: string, ratio: number) {
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);

  return rgbToHex({
    r: Math.round(firstRgb.r + (secondRgb.r - firstRgb.r) * safeRatio),
    g: Math.round(firstRgb.g + (secondRgb.g - firstRgb.g) * safeRatio),
    b: Math.round(firstRgb.b + (secondRgb.b - firstRgb.b) * safeRatio),
  });
}

function tintTowardsWhite(value: string, amount: number) {
  return mixHex(value, "#ffffff", amount);
}

function deepenHex(value: string, amount: number) {
  return mixHex(value, "#1f130c", amount);
}

function withAlpha(value: string, alpha: number) {
  const rgb = hexToRgb(value);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function hexToRgb(value: string) {
  const normalized = value.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((chunk) => `${chunk}${chunk}`)
          .join("")
      : normalized;

  const safe = expanded.padEnd(6, "0").slice(0, 6);

  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(input: { r: number; g: number; b: number }) {
  return `#${[input.r, input.g, input.b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
