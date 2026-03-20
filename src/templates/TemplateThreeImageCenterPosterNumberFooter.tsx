import { AutoFitText } from "@/components/AutoFitText";
import { ImageSlot } from "@/components/ImageSlot";
import {
  getSplitVerticalVisualPreset,
  getTemplateVisualPresetCategory,
} from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

const TEMPLATE_TYPOGRAPHY = {
  number: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.045em",
    lineHeight: 0.86,
  },
  opener: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 600,
    fontStyle: "italic" as const,
    letterSpacing: "-0.02em",
    lineHeight: 0.94,
  },
  main: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 800,
    letterSpacing: "-0.05em",
    lineHeight: 0.88,
    textTransform: "uppercase" as const,
  },
  closer: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 700,
    fontStyle: "italic" as const,
    letterSpacing: "-0.02em",
    lineHeight: 0.92,
  },
  subtitle: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    lineHeight: 1.08,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-poppins), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.03em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
} as const;

const FALLBACK_TITLE = "Classic Fall Decor Ideas";
const FALLBACK_SUBTITLE = "That Never Go Out Of Style";
const ROUNDUP_ENDINGS = new Set(["ideas", "styles", "style", "colors", "looks", "decor", "tips"]);

export function TemplateThreeImageCenterPosterNumberFooter({
  title,
  subtitle,
  images,
  domain,
  itemNumber,
  titleLocked,
  subtitleLocked,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const presetId = visualPreset ?? colorPreset;
  const preset = getSplitVerticalVisualPreset(presetId);
  const category = presetId ? getTemplateVisualPresetCategory(presetId) : "graphic-pop";
  const imageSet = normalizeImages(images);
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 41;
  const displaySubtitle = normalizeSubtitle(subtitle, subtitleLocked);
  const titleParts = splitPosterTitle(
    titleLocked ? normalizeLockedPosterTitle(title) : normalizeTitle(title),
    titleLocked,
  );
  const colors = resolvePosterColors(category, preset.palette);
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");

  const posterWidth = 760;
  const posterHeight = 948;
  const posterLeft = Math.round((1080 - posterWidth) / 2);
  const posterTop = 378;
  const posterPaddingX = 78;
  const posterInnerWidth = posterWidth - posterPaddingX * 2;
  const topImageHeight = 1096;
  const bottomImagesTop = 1108;
  const bottomImageHeight = 812;
  const bottomImageWidth = 536;
  const bottomGap = 8;
  const numberTop = posterTop + 78;
  const numberLeft = posterLeft + 88;
  const openerTop = posterTop + 106;
  const openerLeft = numberLeft + 186;
  const openerWidth = posterLeft + posterWidth - openerLeft - 84;
  const dividerTop = posterTop + 246;
  const mainOneTop = dividerTop + 54;
  const mainTwoTop = mainOneTop + 164;
  const closerTop = mainTwoTop + 178;
  const subtitleTop = closerTop + 108;
  const pillTop = posterTop + posterHeight - 22;

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[24px]"
      style={{ backgroundColor: colors.canvasBackground }}
    >
      <div className="absolute overflow-hidden" style={{ left: 0, top: 0, width: 1080, height: topImageHeight }}>
        <ImageSlot src={imageSet[0]} alt={title} className="h-full w-full" />
      </div>

      <div
        className="absolute overflow-hidden"
        style={{ left: 0, top: bottomImagesTop, width: bottomImageWidth, height: bottomImageHeight }}
      >
        <ImageSlot src={imageSet[1]} alt={title} className="h-full w-full" />
      </div>
      <div
        className="absolute overflow-hidden"
        style={{
          left: bottomImageWidth + bottomGap,
          top: bottomImagesTop,
          width: bottomImageWidth,
          height: bottomImageHeight,
        }}
      >
        <ImageSlot src={imageSet[2]} alt={title} className="h-full w-full" />
      </div>

      <div
        className="absolute z-10"
        style={{
          left: posterLeft,
          top: posterTop,
          width: posterWidth,
          height: posterHeight,
          backgroundColor: colors.posterBackground,
          boxShadow: "0 30px 70px rgba(28, 21, 16, 0.14)",
        }}
      />

      <div
        className="absolute z-20 flex items-center justify-center"
        style={{
          left: numberLeft,
          top: numberTop,
          width: 196,
          height: 162,
        }}
      >
        <AutoFitText
          as="p"
          text={String(displayNumber)}
          minFontSize={108}
          maxFontSize={162}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.number.lineHeight}
          className="w-full text-center"
          textColor={colors.numberColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.number.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.number.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.number.letterSpacing}
        />
      </div>

      <div
        className="absolute z-20 flex items-center"
        style={{
          left: openerLeft,
          top: openerTop,
          width: openerWidth,
          height: 112,
        }}
      >
        <AutoFitText
          as="p"
          text={titleParts.opener}
          minFontSize={50}
          maxFontSize={86}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.opener.lineHeight}
          className="w-full text-left"
          textColor={colors.openerColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.opener.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.opener.fontWeight}
          fontStyle={TEMPLATE_TYPOGRAPHY.opener.fontStyle}
          letterSpacing={TEMPLATE_TYPOGRAPHY.opener.letterSpacing}
        />
      </div>

      <div
        className="absolute z-20"
        style={{
          left: posterLeft + posterPaddingX,
          top: dividerTop,
          width: posterInnerWidth,
          height: 14,
          backgroundColor: colors.dividerColor,
        }}
      />

      <div
        className="absolute z-20 flex items-center justify-center"
        style={{
          left: posterLeft + 68,
          top: mainOneTop,
          width: posterWidth - 136,
          height: 142,
        }}
      >
        <AutoFitText
          as="p"
          text={titleParts.mainOne}
          minFontSize={78}
          maxFontSize={164}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.main.lineHeight}
          className="w-full text-center"
          textColor={colors.mainTitleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.main.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.main.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.main.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.main.textTransform}
        />
      </div>

      <div
        className="absolute z-20 flex items-center justify-center"
        style={{
          left: posterLeft + 68,
          top: mainTwoTop,
          width: posterWidth - 136,
          height: 150,
        }}
      >
        <AutoFitText
          as="p"
          text={titleParts.mainTwo}
          minFontSize={74}
          maxFontSize={158}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.main.lineHeight}
          className="w-full text-center"
          textColor={colors.mainTitleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.main.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.main.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.main.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.main.textTransform}
        />
      </div>

      <div
        className="absolute z-20 flex items-center justify-center"
        style={{
          left: posterLeft + posterPaddingX,
          top: closerTop,
          width: posterInnerWidth,
          height: 88,
          gap: 28,
        }}
      >
        <div
          className="h-[10px] flex-1"
          style={{ backgroundColor: colors.dividerColor }}
        />
        <div className="flex w-[260px] items-center justify-center">
          <AutoFitText
            as="p"
            text={titleParts.closer}
            minFontSize={42}
            maxFontSize={78}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.closer.lineHeight}
            className="w-full text-center"
            textColor={colors.closerColor}
            fontFamily={TEMPLATE_TYPOGRAPHY.closer.fontFamily}
            fontWeight={TEMPLATE_TYPOGRAPHY.closer.fontWeight}
            fontStyle={TEMPLATE_TYPOGRAPHY.closer.fontStyle}
            letterSpacing={TEMPLATE_TYPOGRAPHY.closer.letterSpacing}
          />
        </div>
        <div
          className="h-[10px] flex-1"
          style={{ backgroundColor: colors.dividerColor }}
        />
      </div>

      <div
        className="absolute z-20 flex items-start justify-center"
        style={{
          left: posterLeft + 86,
          top: subtitleTop,
          width: posterWidth - 172,
          height: 76,
        }}
      >
        <AutoFitText
          as="p"
          text={displaySubtitle}
          minFontSize={22}
          maxFontSize={34}
          maxLines={1}
          lineHeight={TEMPLATE_TYPOGRAPHY.subtitle.lineHeight}
          className="w-full text-center"
          textColor={colors.subtitleColor}
          fontFamily={TEMPLATE_TYPOGRAPHY.subtitle.fontFamily}
          fontWeight={TEMPLATE_TYPOGRAPHY.subtitle.fontWeight}
          letterSpacing={TEMPLATE_TYPOGRAPHY.subtitle.letterSpacing}
          textTransform={TEMPLATE_TYPOGRAPHY.subtitle.textTransform}
        />
      </div>

      <div
        className="absolute inset-x-0 z-30 flex justify-center"
        style={{ top: pillTop }}
      >
        <div
          className="flex items-center justify-center rounded-[26px] px-8"
          style={{
            width: 410,
            height: 108,
            backgroundColor: colors.domainPillBackground,
            border: `3px solid ${colors.domainPillBorder}`,
            boxShadow: "0 12px 30px rgba(19, 18, 28, 0.14)",
          }}
        >
          <AutoFitText
            as="p"
            text={cleanedDomain}
            minFontSize={28}
            maxFontSize={42}
            maxLines={1}
            lineHeight={TEMPLATE_TYPOGRAPHY.domain.lineHeight}
            className="w-full text-center"
            textColor={colors.domainTextColor}
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

function splitPosterTitle(title: string, titleLocked?: boolean) {
  const words = title.split(/\s+/).filter(Boolean);
  const opener = words[0] ?? (titleLocked ? "" : "Classic");
  const closer = words.at(-1) ?? (titleLocked ? "" : "Ideas");
  const middleWords = words.slice(1, -1);
  const [mainOne, mainTwo] = splitPosterMiddleWords(middleWords, titleLocked);

  return { opener, mainOne, mainTwo, closer };
}

function normalizeTitle(title: string) {
  const normalized = title
    .replace(/[|/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return FALLBACK_TITLE;
  }

  const words = normalized.split(/\s+/).filter(Boolean).slice(0, 5);
  const bounded = words.length >= 4 ? words : words.length === 3 ? [...words, "Ideas"] : words.length === 2 ? [words[0], words[1], "Decor", "Ideas"] : FALLBACK_TITLE.split(/\s+/);
  const next = bounded.slice(0, 5);
  const lastWord = normalizeWord(next.at(-1) ?? "");

  if (!ROUNDUP_ENDINGS.has(lastWord)) {
    next[next.length - 1] = "Ideas";
  }

  return next.join(" ");
}

function normalizeLockedPosterTitle(title: string) {
  const normalized = title
    .replace(/[|/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return FALLBACK_TITLE;
  }

  return normalized.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
}

function normalizeSubtitle(subtitle?: string, subtitleLocked?: boolean) {
  const normalized = subtitle?.replace(/\s+/g, " ").trim();
  if (subtitleLocked) {
    return normalized || FALLBACK_SUBTITLE;
  }

  if (!normalized) {
    return FALLBACK_SUBTITLE;
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return FALLBACK_SUBTITLE;
  }

  return words.slice(0, 6).join(" ");
}

function splitPosterMiddleWords(words: string[], titleLocked?: boolean) {
  if (words.length === 0) {
    return titleLocked ? ["", ""] : ["Fall", "Decor"];
  }

  if (words.length === 1) {
    return titleLocked ? [words[0], ""] : [words[0], "Decor"];
  }

  if (words.length === 2) {
    return [words[0], words[1]];
  }

  const optionA: [string, string] = [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
  const optionB: [string, string] = [words.slice(0, 1).join(" "), words.slice(1).join(" ")];
  const score = (candidate: [string, string]) =>
    Math.abs(candidate[0].replace(/\s+/g, "").length - candidate[1].replace(/\s+/g, "").length);

  return score(optionA) <= score(optionB) ? optionA : optionB;
}

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeImages(images: string[]) {
  const fallback = ["/sample-images/8.jpg", "/sample-images/3.jpg", "/sample-images/2.jpg"];
  return Array.from({ length: 3 }, (_, index) => images[index] ?? fallback[index]);
}

function resolvePosterColors(
  category:
    | "editorial-soft"
    | "pastel-soft"
    | "earthy-warm"
    | "dark-drama"
    | "graphic-pop"
    | "fresh-vivid"
    | "feminine-bold",
  palette: {
    canvas: string;
    band: string;
    footer: string;
    divider: string;
    title: string;
    subtitle: string;
    domain: string;
    number: string;
  },
) {
  const boldCategory =
    category === "graphic-pop" || category === "fresh-vivid" || category === "feminine-bold";
  const posterBackground = boldCategory
    ? tintTowardsWhite(mixHex(palette.canvas, palette.band, 0.12), 0.96)
    : "#fffdf9";

  const darkInkBase = ensureContrastTone(
    category === "dark-drama"
      ? deepenHex(mixHex(palette.domain, palette.title, 0.42), 0.3)
      : boldCategory
        ? deepenHex(mixHex(palette.title, palette.domain, 0.18), 0.18)
        : deepenHex(mixHex(palette.domain, palette.title, 0.52), 0.18),
    posterBackground,
    5.6,
  );

  const dividerColor = ensureContrastTone(
    boldCategory
      ? deepenHex(mixHex(palette.divider, palette.band, 0.18), 0.12)
      : deepenHex(mixHex(palette.domain, palette.title, 0.42), 0.24),
    posterBackground,
    3.2,
  );

  const mainTitleColor = ensureContrastTone(
    boldCategory
      ? deepenHex(mixHex(palette.title, palette.domain, 0.12), 0.12)
      : dividerColor,
    posterBackground,
    4.8,
  );

  const numberColor = ensureContrastTone(
    category === "dark-drama"
      ? mixHex(palette.number, "#ff8f52", 0.18)
      : boldCategory
        ? mixHex(palette.number, palette.band, 0.08)
        : mixHex(palette.number, palette.footer, 0.24),
    posterBackground,
    3.4,
  );

  const closerColor = ensureContrastTone(
    boldCategory
      ? mixHex(palette.number, palette.title, 0.14)
      : mixHex(palette.number, "#ee8750", 0.2),
    posterBackground,
    3.4,
  );

  const subtitleColor = ensureContrastTone(
    boldCategory
      ? mixHex(palette.subtitle, palette.domain, 0.14)
      : tintTowardsWhite(darkInkBase, 0.08),
    posterBackground,
    3.8,
  );

  const pillBase = boldCategory
    ? deepenHex(mixHex(palette.band, palette.domain, 0.38), 0.3)
    : category === "dark-drama"
      ? deepenHex(mixHex(palette.domain, palette.footer, 0.48), 0.24)
      : deepenHex(mixHex(palette.domain, palette.title, 0.4), 0.28);

  const pillBorder = boldCategory
    ? tintTowardsWhite(mixHex(palette.number, palette.band, 0.26), 0.12)
    : tintTowardsWhite(mixHex(palette.divider, "#fff7ea", 0.4), 0.08);

  return {
    canvasBackground: tintTowardsWhite(palette.canvas, 0.18),
    posterBackground,
    numberColor,
    openerColor: darkInkBase,
    mainTitleColor,
    closerColor,
    subtitleColor,
    dividerColor,
    domainPillBackground: pillBase,
    domainPillBorder: pillBorder,
    domainTextColor: "#fffdf8",
  };
}

function mixHex(left: string, right: string, ratio: number) {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const leftRgb = hexToRgb(left);
  const rightRgb = hexToRgb(right);

  return rgbToHex({
    r: Math.round(leftRgb.r + (rightRgb.r - leftRgb.r) * safeRatio),
    g: Math.round(leftRgb.g + (rightRgb.g - leftRgb.g) * safeRatio),
    b: Math.round(leftRgb.b + (rightRgb.b - leftRgb.b) * safeRatio),
  });
}

function tintTowardsWhite(color: string, ratio: number) {
  return mixHex(color, "#ffffff", ratio);
}

function deepenHex(color: string, ratio: number) {
  return mixHex(color, "#000000", ratio);
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
  const left = hexToRgb(leftHex);
  const right = hexToRgb(rightHex);

  return Math.sqrt(
    Math.pow(left.r - right.r, 2) +
      Math.pow(left.g - right.g, 2) +
      Math.pow(left.b - right.b, 2),
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
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b]
    .map((value) => value / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4),
    );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(value: string) {
  const normalized = value.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);

  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(input: { r: number; g: number; b: number }) {
  return `#${[input.r, input.g, input.b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
    .join("")}`;
}
