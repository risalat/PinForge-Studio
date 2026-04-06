import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  display: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.055em",
    lineHeight: 0.84,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateFourImageGridCenterPosterNumberTitle({
  title,
  images,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images);
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 5;
  const segments = buildPosterSegments(title);
  const dividerColor = "#fffaf7";
  const posterBackground = mixHex("#cc7445", preset.palette.band, 0.14);
  const outlineColor = mixHex("#6d2232", preset.palette.footer, 0.12);
  const textColor = "#fff9f5";
  const overlayShadow = withAlpha("#6d2232", 0.14);
  const textShadow = `4px 6px 0 ${withAlpha("#6d2232", 0.16)}, 0 18px 28px ${withAlpha("#5a281e", 0.08)}`;
  const textStrokeWidth = 8;
  const outlinedTextStyle: CSSProperties = {
    WebkitTextStroke: `${textStrokeWidth}px ${outlineColor}`,
    paintOrder: "stroke fill",
    textShadow,
  };

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden"
      style={{ backgroundColor: dividerColor }}
    >
      <GridImage src={imageSet[0]} alt={title} className="left-0 top-0 h-[956px] w-[536px]" />
      <GridImage src={imageSet[1]} alt={title} className="right-0 top-0 h-[956px] w-[536px]" />
      <GridImage src={imageSet[2]} alt={title} className="bottom-0 left-0 h-[956px] w-[536px]" />
      <GridImage src={imageSet[3]} alt={title} className="bottom-0 right-0 h-[956px] w-[536px]" />

      <div
        className="absolute left-1/2 top-0 h-full w-[8px] -translate-x-1/2"
        style={{ backgroundColor: dividerColor }}
      />
      <div
        className="absolute left-0 top-1/2 h-[8px] w-full -translate-y-1/2"
        style={{ backgroundColor: dividerColor }}
      />

      <div className="absolute inset-x-0 top-[306px] z-30 flex justify-center">
        <div className="relative h-[1240px] w-[644px]">
          <div
            className="absolute left-1/2 top-[180px] z-10 h-[720px] w-[540px] -translate-x-1/2"
            style={{
              backgroundColor: posterBackground,
              clipPath:
                "polygon(22% 0%, 78% 0%, 87% 6%, 91% 18%, 91% 35%, 86% 50%, 80% 58%, 79% 74%, 75% 100%, 25% 100%, 21% 74%, 20% 58%, 14% 50%, 9% 35%, 9% 18%, 13% 6%)",
              boxShadow: `0 28px 60px ${overlayShadow}`,
            }}
          />

          <div className="absolute inset-x-0 top-[10px] z-30 flex h-[214px] items-end justify-center">
            <div className="grid w-full grid-cols-[184px_minmax(0,1fr)] items-end gap-1 px-0">
              <div className="h-[170px]">
                <AutoFitText
                  as="p"
                  text={String(displayNumber)}
                  minFontSize={104}
                  maxFontSize={178}
                  maxLines={1}
                  lineHeight={TEMPLATE_TYPOGRAPHY.display.lineHeight}
                  className="h-full w-full text-right"
                  textColor={textColor}
                  fontFamily={TEMPLATE_TYPOGRAPHY.display.fontFamily}
                  fontWeight={TEMPLATE_TYPOGRAPHY.display.fontWeight}
                  letterSpacing={TEMPLATE_TYPOGRAPHY.display.letterSpacing}
                  textTransform={TEMPLATE_TYPOGRAPHY.display.textTransform}
                  style={outlinedTextStyle}
                />
              </div>
              <div className="h-[164px]">
                <AutoFitText
                  as="p"
                  text={segments.topLine}
                  minFontSize={98}
                  maxFontSize={176}
                  maxLines={1}
                  lineHeight={TEMPLATE_TYPOGRAPHY.display.lineHeight}
                  className="h-full w-full text-left"
                  textColor={textColor}
                  fontFamily={TEMPLATE_TYPOGRAPHY.display.fontFamily}
                  fontWeight={TEMPLATE_TYPOGRAPHY.display.fontWeight}
                  letterSpacing={TEMPLATE_TYPOGRAPHY.display.letterSpacing}
                  textTransform={TEMPLATE_TYPOGRAPHY.display.textTransform}
                  style={outlinedTextStyle}
                />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-[86px] top-[274px] z-20 flex h-[446px] flex-col justify-center">
            {segments.middleLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={`flex ${segments.middleLines.length === 1 ? "h-full items-center" : "h-[198px] items-end"} justify-center`}
              >
                <AutoFitText
                  as="p"
                  text={line}
                  minFontSize={100}
                  maxFontSize={174}
                  maxLines={1}
                  lineHeight={TEMPLATE_TYPOGRAPHY.display.lineHeight}
                  className="w-full text-center"
                  textColor={textColor}
                  fontFamily={TEMPLATE_TYPOGRAPHY.display.fontFamily}
                  fontWeight={TEMPLATE_TYPOGRAPHY.display.fontWeight}
                  letterSpacing={TEMPLATE_TYPOGRAPHY.display.letterSpacing}
                  textTransform={TEMPLATE_TYPOGRAPHY.display.textTransform}
                  style={outlinedTextStyle}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-[6px] top-[774px] z-30 flex h-[354px] flex-col justify-start">
            {segments.bottomLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={`flex ${segments.bottomLines.length === 1 ? "h-full items-start" : "h-[160px] items-start"} justify-center`}
              >
                <AutoFitText
                  as="p"
                  text={line}
                  minFontSize={96}
                  maxFontSize={168}
                  maxLines={1}
                  lineHeight={TEMPLATE_TYPOGRAPHY.display.lineHeight}
                  className="w-full text-center"
                  textColor={textColor}
                  fontFamily={TEMPLATE_TYPOGRAPHY.display.fontFamily}
                  fontWeight={TEMPLATE_TYPOGRAPHY.display.fontWeight}
                  letterSpacing={TEMPLATE_TYPOGRAPHY.display.letterSpacing}
                  textTransform={TEMPLATE_TYPOGRAPHY.display.textTransform}
                  style={outlinedTextStyle}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GridImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <ImageSlot src={src} alt={alt} className="h-full w-full" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(255,249,243,0.03) 0%, rgba(89,50,33,0.06) 100%)" }}
      />
    </div>
  );
}

function buildPosterSegments(title: string) {
  const words = normalizeWords(title);

  if (words.length >= 5) {
    return {
      topLine: words[0],
      middleLines: words.slice(1, 3),
      bottomLines: chunkWords(words.slice(3), 2),
    };
  }

  if (words.length === 4) {
    return {
      topLine: words[0],
      middleLines: words.slice(1, 3),
      bottomLines: [words[3]],
    };
  }

  if (words.length === 3) {
    return {
      topLine: words[0],
      middleLines: [words[1]],
      bottomLines: [words[2]],
    };
  }

  if (words.length === 2) {
    return {
      topLine: words[0],
      middleLines: [words[1]],
      bottomLines: ["Ideas"],
    };
  }

  if (words.length === 1) {
    return {
      topLine: words[0],
      middleLines: ["Decor"],
      bottomLines: ["Ideas"],
    };
  }

  return {
    topLine: "Fall",
    middleLines: ["Living", "Room"],
    bottomLines: ["Makeover", "Ideas"],
  };
}

function chunkWords(words: string[], maxLines: number) {
  if (words.length <= maxLines) {
    return words;
  }

  const firstChunkSize = Math.ceil(words.length / maxLines);
  return [
    words.slice(0, firstChunkSize).join(" "),
    words.slice(firstChunkSize).join(" "),
  ].filter(Boolean);
}

function normalizeWords(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'&-]/gi, "").trim())
    .filter(Boolean)
    .map((word) => toDisplayCase(word));
}

function toDisplayCase(word: string) {
  if (word === word.toUpperCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeImages(images: string[]) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");

  return [
    safeImages[0] ?? fallback,
    safeImages[1] ?? safeImages[0] ?? fallback,
    safeImages[2] ?? safeImages[1] ?? safeImages[0] ?? fallback,
    safeImages[3] ?? safeImages[2] ?? safeImages[1] ?? safeImages[0] ?? fallback,
  ];
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
