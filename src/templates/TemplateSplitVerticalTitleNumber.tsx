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
  const domainPillBackground = brightenHexColor(preset.palette.divider, 0.08);

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
          />
        </div>

        <section
          className="relative flex w-full flex-col items-center justify-center overflow-visible px-[44px] text-center"
          style={{ backgroundColor: preset.palette.footer, height: titleBandHeight }}
        >
          <div
            className="absolute left-1/2 top-0 flex h-[214px] w-[196px] -translate-x-1/2 -translate-y-[74%] items-center justify-center shadow-[0_24px_50px_rgba(31,18,8,0.2)]"
            style={{
              backgroundColor: numberChipBackground,
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <span
              className="leading-none"
              style={{
                color: preset.palette.footer,
                fontFamily: "var(--font-cormorant-garamond), serif",
                fontWeight: 700,
                fontSize: "128px",
                letterSpacing: "-0.06em",
                transform: "translateY(-8px)",
              }}
            >
              {displayNumber}
            </span>
          </div>

          <div className="mt-[26px] w-full">
            <AutoFitTitle
              text={title}
              minFontSize={62}
              maxFontSize={104}
              maxLines={2}
              lineHeight={1.18}
              className="mx-auto w-full max-w-[1020px] text-balance uppercase"
              textColor={preset.palette.domain}
              fontFamily="var(--font-space-grotesk), sans-serif"
              fontWeight={600}
              letterSpacing="-0.018em"
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
          />
          <div className="absolute inset-x-0 bottom-[42px] z-10 flex justify-center">
            <div
              className="inline-flex min-w-[468px] items-center justify-center rounded-full border px-10 py-[18px] shadow-[0_14px_35px_rgba(28,16,8,0.16)]"
              style={{
                backgroundColor: `${domainPillBackground}f4`,
                borderColor: preset.palette.divider,
              }}
            >
              <span
                style={{
                  color: preset.palette.footer,
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
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

function brightenHexColor(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex;
  }

  const [r, g, b] = [
    normalized.slice(0, 2),
    normalized.slice(2, 4),
    normalized.slice(4, 6),
  ].map((part) => parseInt(part, 16));

  const blend = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value + (255 - value) * amount)));

  return `#${[blend(r), blend(g), blend(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}
