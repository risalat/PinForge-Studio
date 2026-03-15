/* eslint-disable @next/next/no-img-element */

import { AutoFitText } from "@/components/AutoFitText";
import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateTextRoleStyle } from "@/lib/templates/types";
import type { TemplateNumberTreatment, TemplateRenderProps } from "@/lib/templates/types";

type SplitVerticalTitleBaseProps = TemplateRenderProps & {
  forceHideSubtitle?: boolean;
  numberTreatment?: TemplateNumberTreatment;
  typography: {
    title: TemplateTextRoleStyle;
    subtitle: TemplateTextRoleStyle;
    number: TemplateTextRoleStyle;
    domain: TemplateTextRoleStyle;
  };
  titleClassName?: string;
  bandPaddingXOverride?: number;
};

export function SplitVerticalTitleBase({
  title,
  subtitle,
  itemNumber,
  images,
  domain,
  colorPreset,
  visualPreset,
  forceHideSubtitle = false,
  numberTreatment = "none",
  typography,
  titleClassName = "w-full max-w-[960px]",
  bandPaddingXOverride,
}: SplitVerticalTitleBaseProps) {
  const firstImage = images[0] ?? "/sample-workspace-a.svg";
  const secondImage = images[1] ?? firstImage;
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const hasSubtitle = !forceHideSubtitle && Boolean(subtitle?.trim());
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const bandHeight = hasSubtitle
    ? preset.layout.bandHeightWithSubtitle
    : preset.layout.bandHeightWithoutSubtitle;
  const titleBlockHeight = hasSubtitle
    ? preset.layout.titleBlockHeightWithSubtitle
    : preset.layout.titleBlockHeightWithoutSubtitle;
  const titleMinFontSize = hasSubtitle
    ? preset.layout.titleMinSizeWithSubtitle
    : preset.layout.titleMinSizeWithoutSubtitle;
  const titleMaxFontSize = hasSubtitle
    ? preset.layout.titleMaxSizeWithSubtitle
    : preset.layout.titleMaxSizeWithoutSubtitle;
  const titleMaxLines = hasSubtitle
    ? preset.layout.titleMaxLinesWithSubtitle
    : preset.layout.titleMaxLinesWithoutSubtitle;
  const hasItemNumber = typeof itemNumber === "number" && itemNumber > 0;
  const showNumberBadge = numberTreatment === "badge" && hasItemNumber;
  const upperImageHeight = 730;
  const lowerImageHeight = 1920 - upperImageHeight - bandHeight - preset.layout.footerHeight;
  const titleColor = pickReadableColor(preset.palette.band, [
    preset.palette.title,
    preset.palette.footer,
    preset.palette.domain,
    preset.palette.divider,
    "#111111",
    "#fffdf8",
  ]);
  const subtitleColor = pickReadableColor(
    preset.palette.band,
    [
      preset.palette.subtitle,
      preset.palette.title,
      preset.palette.footer,
      preset.palette.domain,
      "#111111",
      "#fffdf8",
    ],
    { minContrast: 4 },
  );
  const badgeTextColor = pickReadableColor(preset.palette.footer, [
    preset.palette.domain,
    preset.palette.title,
    preset.palette.band,
    preset.palette.subtitle,
    "#fffdf8",
    "#111111",
  ]);
  const footerTextColor = pickReadableColor(preset.palette.footer, [
    preset.palette.domain,
    preset.palette.title,
    preset.palette.band,
    preset.palette.subtitle,
    "#fffdf8",
    "#111111",
  ]);

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden"
      style={{ backgroundColor: preset.palette.canvas }}
    >
      <div className="flex h-full flex-col">
        <div className="relative w-full overflow-hidden" style={{ height: upperImageHeight }}>
          <img
            src={firstImage}
            alt={title}
            className="h-full w-full object-cover object-[center_40%]"
          />
        </div>

        <div
          className="relative flex w-full flex-col items-center justify-center text-center"
          style={{
            backgroundColor: preset.palette.band,
            height: bandHeight,
            paddingLeft: bandPaddingXOverride ?? preset.layout.bandPaddingX,
            paddingRight: bandPaddingXOverride ?? preset.layout.bandPaddingX,
          }}
        >
          {showNumberBadge ? (
            <div
              className="mb-5 inline-flex items-center justify-center rounded-full px-6 py-3"
              style={{
                backgroundColor: preset.palette.footer,
                border: `1px solid ${preset.palette.divider}`,
              }}
            >
              <AutoFitText
                as="span"
                text={`${itemNumber} ideas`}
                minFontSize={22}
                maxFontSize={28}
                lineHeight={typography.number.lineHeight}
                maxLines={1}
                textColor={badgeTextColor}
                fontFamily={typography.number.fontFamily}
                fontWeight={typography.number.fontWeight}
                letterSpacing={typography.number.letterSpacing}
                textTransform={typography.number.textTransform}
                fontStyle={typography.number.fontStyle}
              />
            </div>
          ) : null}

          {hasSubtitle ? (
            <>
              <div className="flex w-full items-center justify-center">
                <AutoFitText
                  as="p"
                  text={subtitle!.trim()}
                  minFontSize={preset.layout.subtitleMinSize}
                  maxFontSize={preset.layout.subtitleMaxSize}
                  lineHeight={typography.subtitle.lineHeight}
                  maxLines={preset.layout.subtitleMaxLines}
                  className="w-full max-w-[920px]"
                  textColor={subtitleColor}
                  fontFamily={typography.subtitle.fontFamily}
                  fontWeight={typography.subtitle.fontWeight}
                  letterSpacing={typography.subtitle.letterSpacing}
                  textTransform={typography.subtitle.textTransform}
                  fontStyle={typography.subtitle.fontStyle}
                />
              </div>
              <div
                className="rounded-full"
                style={{
                  marginTop: preset.layout.dividerGapTop,
                  height: preset.layout.dividerHeight,
                  width: preset.layout.dividerWidth,
                  backgroundColor: preset.palette.divider,
                }}
              />
            </>
          ) : null}

          <div
            className="flex w-full items-center justify-center"
            style={{
              height: titleBlockHeight,
              marginTop: hasSubtitle ? preset.layout.titleTopGapWithSubtitle : 0,
            }}
          >
            <AutoFitTitle
              text={title}
              minFontSize={titleMinFontSize}
              maxFontSize={titleMaxFontSize}
              lineHeight={typography.title.lineHeight}
              maxLines={titleMaxLines}
              className={titleClassName}
              textColor={titleColor}
              fontFamily={typography.title.fontFamily}
              fontWeight={typography.title.fontWeight}
              letterSpacing={typography.title.letterSpacing}
              textTransform={typography.title.textTransform}
              fontStyle={typography.title.fontStyle}
            />
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[32px]"
            style={{
              backgroundImage: [
                `radial-gradient(circle at 2% -12px, transparent 20px, ${preset.palette.band} 21px)`,
                `radial-gradient(circle at 10% 40px, transparent 22px, ${preset.palette.band} 23px)`,
                `radial-gradient(circle at 18% -10px, transparent 20px, ${preset.palette.band} 21px)`,
                `radial-gradient(circle at 28% 42px, transparent 22px, ${preset.palette.band} 23px)`,
                `radial-gradient(circle at 38% -10px, transparent 20px, ${preset.palette.band} 21px)`,
                `radial-gradient(circle at 50% 40px, transparent 22px, ${preset.palette.band} 23px)`,
                `radial-gradient(circle at 62% -10px, transparent 20px, ${preset.palette.band} 21px)`,
                `radial-gradient(circle at 72% 42px, transparent 22px, ${preset.palette.band} 23px)`,
                `radial-gradient(circle at 82% -12px, transparent 20px, ${preset.palette.band} 21px)`,
                `radial-gradient(circle at 92% 40px, transparent 22px, ${preset.palette.band} 23px)`,
              ].join(", "),
            }}
          />
        </div>

        <div className="relative w-full overflow-hidden" style={{ height: lowerImageHeight }}>
          <img
            src={secondImage}
            alt={cleanedDomain}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div
          className="flex w-full items-center justify-center"
          style={{
            backgroundColor: preset.palette.footer,
            height: preset.layout.footerHeight,
            paddingLeft: preset.layout.footerPaddingX,
            paddingRight: preset.layout.footerPaddingX,
          }}
        >
          <AutoFitText
            as="p"
            text={`www.${cleanedDomain}`}
            minFontSize={preset.layout.footerMinSize}
            maxFontSize={preset.layout.footerMaxSize}
            lineHeight={typography.domain.lineHeight}
            maxLines={1}
            className="w-full text-center"
            textColor={footerTextColor}
            fontFamily={typography.domain.fontFamily}
            fontWeight={typography.domain.fontWeight}
            letterSpacing={typography.domain.letterSpacing}
            textTransform={typography.domain.textTransform}
            fontStyle={typography.domain.fontStyle}
          />
        </div>
      </div>
    </div>
  );
}

function pickReadableColor(
  backgroundHex: string,
  candidates: string[],
  options?: {
    minContrast?: number;
  },
) {
  const minContrast = options?.minContrast ?? 4.5;
  const variants = buildReadableVariants(backgroundHex, candidates);

  if (!isHexColor(backgroundHex) || variants.length === 0) {
    return candidates.find(isHexColor) ?? candidates[0] ?? backgroundHex;
  }

  return variants
    .map(({ color, sourceIndex, variantIndex }) => {
      const contrast = getContrastRatio(color, backgroundHex);
      const meetsContrast = contrast >= minContrast;
      const score = (meetsContrast ? 1000 : contrast * 140) - sourceIndex * 6 - variantIndex;

      return { color, score };
    })
    .sort((left, right) => right.score - left.score)[0]?.color ?? candidates[0] ?? backgroundHex;
}

function buildReadableVariants(backgroundHex: string, candidates: string[]) {
  const targetHex = getRelativeLuminance(backgroundHex) < 0.42 ? "#fffdf8" : "#111111";
  const mixAmounts = [0, 0.16, 0.32, 0.48, 0.64];
  const variants: Array<{ color: string; sourceIndex: number; variantIndex: number }> = [];
  const seen = new Set<string>();

  candidates.filter(isHexColor).forEach((candidate, sourceIndex) => {
    mixAmounts.forEach((amount, variantIndex) => {
      const color = amount === 0 ? candidate : mixHex(candidate, targetHex, amount);
      if (seen.has(color)) {
        return;
      }

      seen.add(color);
      variants.push({ color, sourceIndex, variantIndex });
    });
  });

  return variants;
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
