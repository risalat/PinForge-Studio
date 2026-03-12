/* eslint-disable @next/next/no-img-element */

import { AutoFitTitle } from "@/components/AutoFitTitle";
import { getSplitVerticalVisualPreset } from "@/lib/templates/visualPresets";
import type { TemplateRenderProps } from "@/lib/templates/types";

export function TemplateSplitVerticalTitleNumber({
  title,
  images,
  domain,
  itemNumber,
  visualPreset,
  colorPreset,
}: TemplateRenderProps) {
  const firstImage = images[0] ?? "/sample-images/1.jpg";
  const secondImage = images[1] ?? firstImage;
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const preset = getSplitVerticalVisualPreset(visualPreset ?? colorPreset);
  const displayNumber = typeof itemNumber === "number" && itemNumber > 0 ? itemNumber : 15;
  const topImageHeight = 735;
  const titleBandHeight = 320;
  const bottomImageHeight = 1920 - topImageHeight - titleBandHeight;
  const numberChipBackground = preset.palette.divider;
  const numberTextColor = pickBestContrastColor(numberChipBackground, [
    preset.palette.number,
    preset.palette.footer,
    preset.palette.title,
    preset.palette.domain,
    preset.palette.band,
    preset.palette.canvas,
  ]);
  const numberChipFrameColor = withAlpha(
    pickBestContrastColor(numberChipBackground, [preset.palette.band, preset.palette.canvas]),
    0.96,
  );
  const domainPillBackground = withAlpha(preset.palette.footer, 0.94);
  const imageFilter = "saturate(1.04) contrast(1.03)";

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden rounded-[36px]"
      style={{ backgroundColor: preset.palette.canvas }}
    >
      <div className="relative flex h-full flex-col">
        <div className="relative w-full overflow-hidden" style={{ height: topImageHeight }}>
          <img
            src={firstImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ filter: imageFilter }}
          />
        </div>

        <section
          className="relative flex w-full flex-col items-center justify-center overflow-visible px-[44px] text-center"
          style={{ backgroundColor: preset.palette.band, height: titleBandHeight }}
        >
          <div
            className="absolute left-1/2 top-0 flex h-[238px] w-[220px] -translate-x-1/2 -translate-y-[74%] items-center justify-center shadow-[0_26px_60px_rgba(31,18,8,0.24)]"
            style={{
              backgroundColor: numberChipFrameColor,
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <div
              className="flex h-[208px] w-[192px] items-center justify-center"
              style={{
                backgroundColor: numberChipBackground,
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -10px 22px rgba(0,0,0,0.08)",
              }}
            >
              <span
                className="leading-none"
                style={{
                  color: numberTextColor,
                  fontFamily: preset.typography.number.fontFamily,
                  fontWeight: preset.typography.number.fontWeight,
                  fontSize: "138px",
                  letterSpacing: preset.typography.number.letterSpacing,
                  lineHeight: preset.typography.number.lineHeight,
                  transform: "translateY(-8px)",
                  textShadow: "0 6px 18px rgba(255,255,255,0.12)",
                }}
              >
                {displayNumber}
              </span>
            </div>
          </div>

          <div className="mt-[26px] w-full">
            <AutoFitTitle
              text={title}
              minFontSize={62}
              maxFontSize={104}
              maxLines={2}
              lineHeight={1.18}
              className="mx-auto w-full max-w-[1020px] text-balance uppercase"
              textColor={preset.palette.title}
              fontFamily={preset.typography.title.fontFamily}
              fontWeight={preset.typography.title.fontWeight}
              letterSpacing={preset.typography.title.letterSpacing}
            />
          </div>
        </section>

        <div
          className="relative w-full overflow-hidden"
          style={{ height: bottomImageHeight }}
        >
          <img
            src={secondImage}
            alt={cleanedDomain}
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ filter: imageFilter }}
          />
          <div className="absolute inset-x-0 bottom-[42px] z-10 flex justify-center">
            <div
              className="inline-flex min-w-[468px] items-center justify-center rounded-full border px-10 py-[18px] shadow-[0_14px_35px_rgba(28,16,8,0.16)]"
              style={{
                backgroundColor: domainPillBackground,
                borderColor: preset.palette.divider,
              }}
            >
              <span
                style={{
                  color: preset.palette.domain,
                  fontFamily: preset.typography.domain.fontFamily,
                  fontWeight: preset.typography.domain.fontWeight,
                  fontSize: "28px",
                  letterSpacing: preset.typography.domain.letterSpacing,
                  lineHeight: preset.typography.domain.lineHeight,
                  textTransform: preset.typography.domain.textTransform,
                  fontStyle: preset.typography.domain.fontStyle,
                  whiteSpace: "nowrap",
                }}
              >
                {`www.${cleanedDomain}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

function pickBestContrastColor(backgroundHex: string, candidates: string[]) {
  const normalizedCandidates = candidates.filter((candidate) => isHexColor(candidate));
  if (!isHexColor(backgroundHex) || normalizedCandidates.length === 0) {
    return candidates[0] ?? backgroundHex;
  }

  return normalizedCandidates.reduce((best, candidate) =>
    getContrastRatio(candidate, backgroundHex) > getContrastRatio(best, backgroundHex)
      ? candidate
      : best,
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
