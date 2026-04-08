import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  lead: {
    fontFamily: "var(--font-cormorant-garamond), var(--font-literaturnaya), serif",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 0.96,
    fontStyle: "italic" as const,
  },
  title: {
    fontFamily: "var(--font-antonio), var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 0.86,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.88,
  },
  label: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.18em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

const FALLBACK_TITLE = "Cozy Patio Lighting Ideas";

export function TemplateHeroScrapbookTapeTag({
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
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 27;
  const headline = buildScrapbookHeadline(title);

  const canvasBackground = tintTowardsWhite(mixHex(preset.palette.canvas, preset.palette.band, 0.34), 0.12);
  const paperBackground = tintTowardsWhite(mixHex("#f6efe6", preset.palette.canvas, 0.22), 0.12);
  const paperStroke = withAlpha(deepenHex(preset.palette.footer, 0.18), 0.18);
  const ink = deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.42), 0.2);
  const accent = mixHex(preset.palette.divider, preset.palette.band, 0.28);
  const tagBackground = deepenHex(mixHex(preset.palette.title, preset.palette.footer, 0.48), 0.18);
  const tagBorder = withAlpha(tintTowardsWhite(preset.palette.canvas, 0.94), 0.92);
  const tagText = "#fff9f3";
  const domainBackground = deepenHex(mixHex(preset.palette.footer, preset.palette.divider, 0.44), 0.08);
  const frameWhite = "#fffdf9";
  const tapeFill = withAlpha("#efe2c7", 0.84);
  const shadow = "0 24px 54px rgba(47, 31, 19, 0.14)";

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
            "radial-gradient(circle at top left, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0) 36%), radial-gradient(circle at bottom right, rgba(164,109,71,0.08) 0%, rgba(164,109,71,0) 34%)",
        }}
      />

      <PhotoFrame
        src={imageSet[0]}
        alt={title}
        style={{ left: 56, top: 58, width: 644, height: 1014 }}
        frameColor={frameWhite}
        shadow={shadow}
      />
      <Tape style={{ left: 110, top: 38, width: 152, height: 34, rotate: -7 }} fill={tapeFill} />
      <Tape style={{ left: 546, top: 1034, width: 144, height: 30, rotate: 6 }} fill={tapeFill} />

      <PhotoFrame
        src={imageSet[1]}
        alt={title}
        style={{ left: 732, top: 94, width: 280, height: 366, tilt: 4.5 }}
        frameColor={frameWhite}
        shadow="0 18px 36px rgba(49, 32, 19, 0.15)"
      />
      <Tape style={{ left: 788, top: 70, width: 120, height: 28, rotate: 5 }} fill={tapeFill} />

      <PhotoFrame
        src={imageSet[2]}
        alt={title}
        style={{ left: 744, top: 502, width: 254, height: 318, tilt: -5 }}
        frameColor={frameWhite}
        shadow="0 18px 36px rgba(49, 32, 19, 0.15)"
      />
      <Tape style={{ left: 782, top: 788, width: 112, height: 26, rotate: -7 }} fill={tapeFill} />

      <PhotoFrame
        src={imageSet[3]}
        alt={title}
        style={{ left: 74, top: 1454, width: 932, height: 386 }}
        frameColor={frameWhite}
        shadow="0 18px 40px rgba(49, 32, 19, 0.12)"
      />
      <Tape style={{ left: 150, top: 1434, width: 126, height: 30, rotate: -4 }} fill={tapeFill} />
      <Tape style={{ left: 834, top: 1436, width: 118, height: 28, rotate: 6 }} fill={tapeFill} />

      <div
        className="absolute z-30"
        style={{
          left: 182,
          top: 1018,
          width: 796,
          height: 338,
          backgroundColor: paperBackground,
          border: `1px solid ${paperStroke}`,
          clipPath:
            "polygon(2% 0%, 98% 0%, 100% 8%, 99% 92%, 95% 100%, 6% 99%, 0% 93%, 1% 10%)",
          boxShadow: "0 26px 64px rgba(45, 29, 18, 0.17)",
        }}
      >
        <div
          className="absolute left-[134px] top-[52px] h-[58px] w-[378px] rounded-full"
          style={{ backgroundColor: withAlpha(accent, 0.18) }}
        />

        <div className="absolute left-[140px] top-[28px] h-[104px] w-[516px]">
          <AutoFitText
            as="p"
            text={headline.lead}
            minFontSize={34}
            maxFontSize={74}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.lead.lineHeight}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TEMPLATE_TYPOGRAPHY.lead.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.lead.fontWeight}
            fontStyle={TEMPLATE_TYPOGRAPHY.lead.fontStyle}
            letterSpacing={TEMPLATE_TYPOGRAPHY.lead.letterSpacing}
          />
        </div>

        <div className="absolute left-[142px] top-[126px] h-[92px] w-[540px]">
          <AutoFitText
            as="p"
            text={headline.mainOne}
            minFontSize={58}
            maxFontSize={114}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>

        <div className="absolute left-[142px] top-[234px] h-[82px] w-[582px]">
          <AutoFitText
            as="p"
            text={headline.mainTwo}
            minFontSize={54}
            maxFontSize={108}
            maxLines={1}
            lineHeight={0.94}
            className="h-full w-full text-left"
            textColor={ink}
            fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
            textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          />
        </div>
      </div>

      <div
        className="absolute z-40 flex flex-col items-center justify-center"
        style={{
          left: 44,
          top: 988,
          width: 184,
          height: 236,
          backgroundColor: tagBackground,
          clipPath: "polygon(0 0, 100% 0, 100% 83%, 74% 100%, 0 100%)",
          boxShadow: "0 24px 52px rgba(49, 25, 18, 0.24)",
          border: `4px solid ${tagBorder}`,
        }}
        >
        <div
          className="absolute left-1/2 top-[18px] h-[16px] w-[16px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: withAlpha("#f9f3ea", 0.72) }}
        />
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={104}
          maxFontSize={156}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-[80%] text-center"
          textColor={tagText}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div className="absolute inset-x-0 bottom-[118px] z-40 flex justify-center">
        <div
          className="flex h-[72px] min-w-[340px] max-w-[452px] items-center justify-center rounded-full px-8"
          style={{
            backgroundColor: domainBackground,
            boxShadow: "0 14px 30px rgba(43, 28, 18, 0.16)",
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={18}
            maxFontSize={30}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={tagText}
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

function PhotoFrame({
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
      className="absolute overflow-hidden rounded-[30px] p-[16px]"
      style={{
        ...baseStyle,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        backgroundColor: frameColor,
        boxShadow: shadow,
      }}
    >
      <ImageSlot src={src} alt={alt} className="h-full w-full rounded-[18px]" />
      <div
        className="pointer-events-none absolute inset-[16px] rounded-[18px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(77,47,24,0.08) 100%)",
        }}
      />
    </div>
  );
}

function Tape({
  style,
  fill,
}: {
  style: {
    left: number;
    top: number;
    width: number;
    height: number;
    rotate: number;
  };
  fill: string;
}) {
  return (
    <div
      className="absolute z-50 rounded-[10px]"
      style={{
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height,
        transform: `rotate(${style.rotate}deg)`,
        background:
          `linear-gradient(180deg, ${fill} 0%, ${withAlpha("#fff8ec", 0.66)} 100%)`,
        boxShadow: "0 6px 14px rgba(70, 46, 23, 0.10)",
      }}
    />
  );
}

function buildScrapbookHeadline(title: string) {
  const words = normalizeHeadlineWords(title);

  if (words.length <= 2) {
    return {
      lead: words[0] ?? "Cozy",
      mainOne: words[1] ?? "Patio",
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
      mainOne: words[1],
      mainTwo: `${words[2]} ${words[3]}`,
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
