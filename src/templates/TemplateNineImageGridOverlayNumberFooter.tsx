/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";
import type { CSSProperties } from "react";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-libre-baskerville), serif",
    fontWeight: 700,
    letterSpacing: "0.028em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  subtitle: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.11em",
    lineHeight: 1.1,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-league-spartan), sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
  domain: {
    fontFamily: "var(--font-manrope), sans-serif",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: 1,
  },
} as const;

export function TemplateNineImageGridOverlayNumberFooter({
  title,
  subtitle,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const imageSet = normalizeImages(images, 9);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const compactTitle = compactOverlayTitle(title);
  const compactTitleLength = compactTitle.replace(/\s+/g, "").length;
  const titleMinFontSize = compactTitleLength <= 18 ? 66 : compactTitleLength <= 22 ? 56 : 42;
  const titleMaxFontSize = compactTitleLength <= 18 ? 96 : compactTitleLength <= 22 ? 84 : 66;
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 25;
  const frameInset = 10;
  const gutter = 8;
  const collageSize = 1080 - frameInset * 2;
  const collageHeight = 1920 - frameInset * 2;
  const cellWidth = (collageSize - gutter * 2) / 3;
  const cellHeight = (collageHeight - gutter * 2) / 3;
  const titleBandTop = 598;
  const titleBandHeight = 402;
  const titleBandWidth = 958;
  const numberCircleSize = Math.round(cellWidth);
  const numberCircleTop = 358;
  const domainPillWidth = 292;
  const domainPillHeight = 54;
  const domainPillBottom = 46;
  const gridFrameColor = withAlpha(deepenHex(preset.palette.divider, 0.06), 0.9);
  const bandBackground = tintTowardsWhite(preset.palette.band, 0.78);
  const titleColor = ensureContrastTone(preset.palette.title, bandBackground, 5.4);
  const subtitleColor = pickDistinctReadableTone(
    [
      preset.palette.divider,
      preset.palette.subtitle,
      mixHex(preset.palette.divider, preset.palette.subtitle, 0.4),
      mixHex(preset.palette.divider, preset.palette.title, 0.18),
    ],
    titleColor,
    bandBackground,
    3.8,
    72,
  );
  const dividerColor = withAlpha(
    pickDistinctReadableTone(
      [
        preset.palette.divider,
        subtitleColor,
        mixHex(preset.palette.divider, "#ffffff", 0.14),
      ],
      titleColor,
      bandBackground,
      2.2,
      54,
    ),
    0.9,
  );
  const circleBackground = pickDarkReadableTone(
    [
      deepenHex(preset.palette.footer, 0.32),
      deepenHex(mixHex(preset.palette.footer, preset.palette.title, 0.24), 0.3),
      deepenHex(preset.palette.title, 0.44),
    ],
    bandBackground,
    7.2,
  );
  const circleTextColor = pickLightReadableTone(
    [
      mixHex(preset.palette.divider, "#ffffff", 0.38),
      mixHex(preset.palette.number, "#ffffff", 0.62),
      "#fff6eb",
    ],
    circleBackground,
    5.2,
  );
  const domainPillBackground = withAlpha(
    pickDarkReadableTone(
      [mixHex(circleBackground, preset.palette.footer, 0.68), deepenHex(preset.palette.footer, 0.2)],
      bandBackground,
      7.2,
    ),
    0.96,
  );
  const domainTextColor = pickLightReadableTone(
    [mixHex(preset.palette.domain, "#ffffff", 0.34), "#fff7ef"],
    stripAlphaChannel(domainPillBackground),
    5.5,
  );

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[26px]"
      style={{ backgroundColor: bandBackground }}
    >
      <div
        className="absolute overflow-hidden rounded-[24px]"
        style={{
          left: frameInset,
          top: frameInset,
          width: collageSize,
          height: collageHeight,
          backgroundColor: gridFrameColor,
        }}
      >
        {imageSet.map((src, index) => {
          const column = index % 3;
          const row = Math.floor(index / 3);
          const left = column * (cellWidth + gutter);
          const top = row * (cellHeight + gutter);

          return (
            <ImageCell
              key={`${src}-${index}`}
              src={src}
              alt={title}
              style={{
                left,
                top,
                width: cellWidth,
                height: cellHeight,
              }}
            />
          );
        })}
      </div>

      <div className="absolute inset-x-0 z-20 flex justify-center" style={{ top: titleBandTop }}>
        <div
          className="relative overflow-hidden text-center shadow-[0_26px_52px_rgba(67,41,14,0.16)]"
          style={{
            width: titleBandWidth,
            height: titleBandHeight,
            backgroundColor: bandBackground,
          }}
        >
          <div className="absolute inset-x-[18px] top-[140px]">
            <AutoFitText
              as="p"
              text={compactTitle}
              minFontSize={titleMinFontSize}
              maxFontSize={titleMaxFontSize}
              maxLines={1}
              lineHeight={TEMPLATE_TYPOGRAPHY.title.lineHeight}
              className="mx-auto w-full uppercase text-center"
              textColor={titleColor}
              fontFamily={TEMPLATE_TYPOGRAPHY.title.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.title.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.title.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.title.textTransform}
            />
          </div>

          <div
            className="absolute left-1/2 top-[274px] h-[3px] w-[154px] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: dividerColor }}
          />

          <div className="absolute inset-x-[32px] top-[298px]">
            <AutoFitText
              as="p"
              text={subtitle?.trim() || "That Totally Transform Your Front Yard"}
              minFontSize={26}
              maxFontSize={36}
              maxLines={1}
              lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
              className="mx-auto w-full"
              textColor={subtitleColor}
              fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
              fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
              letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
              textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: numberCircleTop }}>
        <div
          className="flex items-center justify-center rounded-full shadow-[0_22px_44px_rgba(22,29,42,0.26)]"
          style={{
            width: numberCircleSize,
            height: numberCircleSize,
            backgroundColor: circleBackground,
          }}
        >
          <span
            className="block w-full text-center"
            style={{
              color: circleTextColor,
              fontFamily: TEMPLATE_TYPOGRAPHY.number.fontFamily,
              fontWeight: TEMPLATE_TYPOGRAPHY.number.fontWeight,
              fontSize: displayNumber >= 100 ? "152px" : "184px",
              letterSpacing: TEMPLATE_TYPOGRAPHY.number.letterSpacing,
              lineHeight: TEMPLATE_TYPOGRAPHY.number.lineHeight,
              fontVariantNumeric: "lining-nums proportional-nums",
              textShadow: "0 2px 10px rgba(0,0,0,0.16)",
              transform: "translateY(-2px)",
            }}
          >
            {displayNumber}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 z-40 flex justify-center" style={{ bottom: domainPillBottom }}>
        <div
          className="flex items-center justify-center rounded-full px-6 shadow-[0_12px_22px_rgba(20,28,40,0.18)]"
          style={{
            width: domainPillWidth,
            height: domainPillHeight,
            backgroundColor: domainPillBackground,
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={22}
            maxFontSize={28}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={domainTextColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.domain.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.domain.fontWeight}
            letterSpacing={TEMPLATE_TYPOGRAPHY.domain.letterSpacing}
          />
        </div>
      </div>
    </div>
  );
}

function ImageCell({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style: CSSProperties;
}) {
  return (
    <div className="absolute overflow-hidden" style={style}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.04) 100%)",
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

function compactOverlayTitle(title: string) {
  const safeTitle = title.trim() || "Mailbox Decor Ideas";
  const words = safeTitle.split(/\s+/).filter(Boolean);
  const titleLength = safeTitle.replace(/\s+/g, " ").length;

  if (words.length <= 5 && titleLength <= 24) {
    return safeTitle;
  }

  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z]/g, ""));
  const twoWordSuffixes = [
    ["paint", "colors"],
    ["exterior", "ideas"],
    ["decor", "ideas"],
    ["wall", "ideas"],
  ] as const;
  const oneWordSuffixes = new Set(["ideas", "colors", "decor", "styles", "looks"]);

  for (const suffix of twoWordSuffixes) {
    if (normalizedWords.at(-2) === suffix[0] && normalizedWords.at(-1) === suffix[1]) {
      return trimHeadlineToBudget([...words.slice(0, 3), ...words.slice(-2)], 24);
    }
  }

  if (oneWordSuffixes.has(normalizedWords.at(-1) ?? "")) {
    return trimHeadlineToBudget([...words.slice(0, 4), words.at(-1)!], 24);
  }

  return trimHeadlineToBudget(words.slice(0, 5), 24);
}

function trimHeadlineToBudget(words: string[], maxLength: number) {
  const cleanedWords = [...words];

  while (cleanedWords.length > 3 && cleanedWords.join(" ").length > maxLength) {
    cleanedWords.splice(cleanedWords.length - 2, 1);
  }

  let headline = cleanedWords.join(" ");
  if (headline.length <= maxLength) {
    return headline;
  }

  headline = headline
    .replace(/-inspired/gi, "")
    .replace(/\bbeautiful\b/gi, "")
    .replace(/\bgorgeous\b/gi, "")
    .replace(/\bstunning\b/gi, "")
    .replace(/\bcharming\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const compactedWords = headline.split(/\s+/).filter(Boolean);
  while (compactedWords.length > 3 && compactedWords.join(" ").length > maxLength) {
    compactedWords.shift();
  }

  return compactedWords.join(" ");
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

function stripAlphaChannel(value: string) {
  const normalized = value.replace("#", "");
  if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
    return `#${normalized.slice(0, 6)}`;
  }

  return value;
}

function tintTowardsWhite(hex: string, amount: number) {
  return mixHex(hex, "#ffffff", amount);
}

function deepenHex(hex: string, amount: number) {
  return mixHex(hex, "#000000", amount);
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

function ensureContrastTone(colorHex: string, backgroundHex: string, minimumRatio: number) {
  if (!isHexColor(colorHex) || !isHexColor(backgroundHex)) {
    return colorHex;
  }

  if (getContrastRatio(colorHex, backgroundHex) >= minimumRatio) {
    return colorHex;
  }

  const darkerCandidate = shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#000000");
  const lighterCandidate = shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#ffffff");

  if (!darkerCandidate) {
    return lighterCandidate ?? colorHex;
  }

  if (!lighterCandidate) {
    return darkerCandidate;
  }

  return colorDistance(colorHex, darkerCandidate) <= colorDistance(colorHex, lighterCandidate)
    ? darkerCandidate
    : lighterCandidate;
}

function ensureDarkContrastTone(colorHex: string, backgroundHex: string, minimumRatio: number) {
  if (!isHexColor(colorHex) || !isHexColor(backgroundHex)) {
    return colorHex;
  }

  if (
    getContrastRatio(colorHex, backgroundHex) >= minimumRatio &&
    getRelativeLuminance(colorHex) < getRelativeLuminance(backgroundHex)
  ) {
    return colorHex;
  }

  return shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#000000") ?? deepenHex(colorHex, 0.36);
}

function ensureLightContrastTone(colorHex: string, backgroundHex: string, minimumRatio: number) {
  if (!isHexColor(colorHex) || !isHexColor(backgroundHex)) {
    return colorHex;
  }

  if (
    getContrastRatio(colorHex, backgroundHex) >= minimumRatio &&
    getRelativeLuminance(colorHex) > getRelativeLuminance(backgroundHex)
  ) {
    return colorHex;
  }

  return shiftTowardContrast(colorHex, backgroundHex, minimumRatio, "#ffffff") ?? tintTowardsWhite(colorHex, 0.42);
}

function pickDistinctReadableTone(
  candidates: string[],
  avoidHex: string,
  backgroundHex: string,
  minimumRatio: number,
  minimumDistance: number,
) {
  let bestCandidate = ensureContrastTone(candidates[0] ?? avoidHex, backgroundHex, minimumRatio);
  let bestDistance = colorDistance(bestCandidate, avoidHex);

  for (const candidate of candidates) {
    const adjusted = ensureContrastTone(candidate, backgroundHex, minimumRatio);
    const distance = colorDistance(adjusted, avoidHex);

    if (distance >= minimumDistance) {
      return adjusted;
    }

    if (distance > bestDistance) {
      bestCandidate = adjusted;
      bestDistance = distance;
    }
  }

  return bestCandidate;
}

function pickDarkReadableTone(candidates: string[], backgroundHex: string, minimumRatio: number) {
  for (const candidate of candidates) {
    const adjusted = ensureDarkContrastTone(candidate, backgroundHex, minimumRatio);
    if (getContrastRatio(adjusted, backgroundHex) >= minimumRatio) {
      return adjusted;
    }
  }

  return ensureDarkContrastTone(candidates[0] ?? "#1b2232", backgroundHex, minimumRatio);
}

function pickLightReadableTone(candidates: string[], backgroundHex: string, minimumRatio: number) {
  for (const candidate of candidates) {
    const adjusted = ensureLightContrastTone(candidate, backgroundHex, minimumRatio);
    if (getContrastRatio(adjusted, backgroundHex) >= minimumRatio) {
      return adjusted;
    }
  }

  return ensureLightContrastTone(candidates[0] ?? "#fff7ef", backgroundHex, minimumRatio);
}

function shiftTowardContrast(
  colorHex: string,
  backgroundHex: string,
  minimumRatio: number,
  targetHex: string,
) {
  for (let step = 1; step <= 12; step += 1) {
    const candidate = mixHex(colorHex, targetHex, step * 0.08);
    if (getContrastRatio(candidate, backgroundHex) >= minimumRatio) {
      return candidate;
    }
  }

  return null;
}

function colorDistance(leftHex: string, rightHex: string) {
  const left = parseHex(leftHex);
  const right = parseHex(rightHex);

  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    Math.pow(left[0] - right[0], 2) +
      Math.pow(left[1] - right[1], 2) +
      Math.pow(left[2] - right[2], 2),
  );
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
