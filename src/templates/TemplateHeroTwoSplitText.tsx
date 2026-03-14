/* eslint-disable @next/next/no-img-element */

import { AutoFitLineStack } from "@/components/AutoFitLineStack";
import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-literaturnaya), var(--font-libre-baskerville), serif",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.08,
    textTransform: "none" as const,
  },
  number: {
    fontFamily: "var(--font-antonio), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.88,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 800,
    letterSpacing: "0",
    lineHeight: 1,
  },
} as const;

export function TemplateHeroTwoSplitText({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images, 3);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const compactTitle = compactHeroTwoSplitTitle(title);
  const titleLines = splitTitleIntoThreeLines(toTitleCase(compactTitle));

  const divider = 14;
  const canvasWidth = 1080;
  const topHeight = 760;
  const middleHeight = 360;
  const bottomHeight = 1920 - topHeight - middleHeight;
  const bottomTileWidth = Math.round((canvasWidth - divider) / 2);

  const stripBackground = preset.palette.footer;
  const highlightColor = pickBestContrastColor(stripBackground, [
    preset.palette.divider,
    preset.palette.number,
    preset.palette.title,
    preset.palette.canvas,
    "#ffbf57",
  ]);
  const dividerColor = mixHex(stripBackground, highlightColor, 0.22);
  const numberColor = highlightColor;
  const titleColor = pickBestContrastColor(stripBackground, [
    preset.palette.canvas,
    preset.palette.band,
    preset.palette.domain,
    "#fff7e9",
  ]);
  const titleAccentColor = highlightColor;
  const domainPillBackground = pickBestContrastColor(stripBackground, [
    highlightColor,
    preset.palette.divider,
    preset.palette.title,
    "#f26430",
  ]);
  const domainColor = pickBestContrastColor(domainPillBackground, [
    preset.palette.canvas,
    preset.palette.band,
    "#fff9ef",
  ]);

  const numberBlockLeft = 40;
  const numberBlockWidth = 324;
  const numberBlockHeight = Math.round(middleHeight * 0.9);
  const numberBlockTop = topHeight + Math.round((middleHeight - numberBlockHeight) / 2) - 10;
  const titleBlockLeft = 360;
  const titleBlockTop = topHeight + Math.round((middleHeight - numberBlockHeight) / 2) + 4;
  const titleBlockWidth = 700;
  const titleBlockHeight = numberBlockHeight;
  const bottomTop = topHeight + middleHeight;
  const pillWidth = 420;
  const pillHeight = 68;
  const pillBottom = 42;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: stripBackground }}
    >
      <ImageTile
        src={imageSet[0]}
        alt={title}
        style={{ left: 0, top: 0, width: 1080, height: topHeight }}
      />

      <div
        className="absolute inset-x-0"
        style={{ top: topHeight, height: middleHeight, backgroundColor: stripBackground }}
      />

      <div
        className="absolute"
        style={{
          left: numberBlockLeft,
          top: numberBlockTop,
          width: numberBlockWidth,
          height: numberBlockHeight,
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={200}
          maxFontSize={340}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="h-full w-full"
          textColor={numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute flex items-center"
        style={{
          left: titleBlockLeft,
          top: titleBlockTop,
          width: titleBlockWidth,
          height: titleBlockHeight,
        }}
      >
        <AutoFitLineStack
          lines={titleLines}
          minFontSize={58}
          maxFontSize={82}
          lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
          gap={12}
          className="w-full"
          textAlign="left"
          fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
          colors={[titleColor, titleAccentColor, titleColor]}
        />
      </div>

      <ImageTile
        src={imageSet[1]}
        alt={title}
        style={{ left: 0, top: bottomTop, width: bottomTileWidth, height: bottomHeight }}
      />
      <ImageTile
        src={imageSet[2]}
        alt={title}
        style={{ right: 0, top: bottomTop, width: bottomTileWidth, height: bottomHeight }}
      />

      <Divider style={{ left: bottomTileWidth, top: bottomTop, width: divider, height: bottomHeight }} color={dividerColor} />

      <div
        className="absolute inset-x-0 z-30 flex justify-center"
        style={{ top: bottomTop + bottomHeight - pillHeight - pillBottom }}
      >
        <div
          className="flex items-center justify-center rounded-full px-6"
          style={{
            width: pillWidth,
            height: pillHeight,
            backgroundColor: domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={28}
            maxFontSize={38}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          />
        </div>
      </div>
    </div>
  );
}

function ImageTile({ src, alt, style }: { src: string; alt: string; style: CSSProperties }) {
  return (
    <div className="absolute overflow-hidden" style={style}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
    </div>
  );
}

function Divider({ style, color }: { style: CSSProperties; color: string }) {
  return <div className="absolute z-10" style={{ ...style, backgroundColor: color }} />;
}

function normalizeImages(images: string[], count: number) {
  const fallback = "/sample-images/1.jpg";
  const safeImages = images.filter((image) => image.trim() !== "");
  return Array.from({ length: count }).map(
    (_, index) => safeImages[index] ?? safeImages[safeImages.length - 1] ?? fallback,
  );
}

function splitTitleIntoThreeLines(title: string) {
  const safeTitle = title.trim() || "Breathtaking Lake House Exterior Ideas";
  const words = safeTitle.split(/\s+/).filter(Boolean);

  if (words.length <= 3) {
    return [...words, ...Array.from({ length: 3 - words.length }, () => "")];
  }

  if (words.length === 4) {
    return [words.slice(0, 1).join(" "), words.slice(1, 2).join(" "), words.slice(2).join(" ")];
  }

  if (words.length === 5) {
    return [words.slice(0, 1).join(" "), words.slice(1, 3).join(" "), words.slice(3).join(" ")];
  }

  let bestSplit: string[] = [words.slice(0, 2).join(" "), words.slice(2, 4).join(" "), words.slice(4).join(" ")];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let firstBreak = 1; firstBreak < words.length - 1; firstBreak += 1) {
    for (let secondBreak = firstBreak + 1; secondBreak < words.length; secondBreak += 1) {
      const candidate = [
        words.slice(0, firstBreak).join(" "),
        words.slice(firstBreak, secondBreak).join(" "),
        words.slice(secondBreak).join(" "),
      ];

      if (candidate.some((line) => line.length === 0)) {
        continue;
      }

      const lengths = candidate.map((line) => line.replace(/\s+/g, "").length);
      const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
      const score = lengths.reduce((sum, length) => sum + Math.abs(length - average), 0);

      if (score < bestScore) {
        bestScore = score;
        bestSplit = candidate;
      }
    }
  }

  return bestSplit;
}

function compactHeroTwoSplitTitle(title: string) {
  const safeTitle = title.trim() || "Breathtaking Lake House Exterior Ideas";
  const words = safeTitle.split(/\s+/).filter(Boolean);

  if (words.length <= 5) {
    return safeTitle;
  }

  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z]/g, ""));
  const twoWordSuffixes = [
    ["exterior", "ideas"],
    ["paint", "colors"],
    ["wall", "ideas"],
    ["color", "ideas"],
    ["decor", "ideas"],
  ] as const;
  const oneWordSuffixes = new Set(["ideas", "colors", "decor", "styles", "looks"]);

  for (const suffix of twoWordSuffixes) {
    if (normalizedWords.at(-2) === suffix[0] && normalizedWords.at(-1) === suffix[1]) {
      return [...words.slice(0, 3), ...words.slice(-2)].join(" ");
    }
  }

  if (oneWordSuffixes.has(normalizedWords.at(-1) ?? "")) {
    return [...words.slice(0, 4), words.at(-1)!].join(" ");
  }

  return words.slice(0, 5).join(" ");
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function pickBestContrastColor(backgroundHex: string, candidates: string[]) {
  const validCandidates = candidates.filter(isHexColor);
  if (!isHexColor(backgroundHex) || validCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return validCandidates.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) > getContrastRatio(best, backgroundHex) ? candidate : best,
  );
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
