/* eslint-disable @next/next/no-img-element */

import { AutoFitTitle } from "@/components/AutoFitTitle";
import type { TemplateColorPreset, TemplateRenderProps } from "@/lib/templates/types";

type SplitVerticalTitleBaseProps = TemplateRenderProps & {
  forceHideSubtitle?: boolean;
};

const COLOR_PRESETS: Record<
  TemplateColorPreset,
  {
    canvas: string;
    band: string;
    footer: string;
    kicker: string;
    divider: string;
    title: string;
    domain: string;
  }
> = {
  "plum-sand": {
    canvas: "#e5dbd2",
    band: "#e9dfd6",
    footer: "#e9dfd6",
    kicker: "#87604a",
    divider: "#c88657",
    title: "#ab612f",
    domain: "#87604a",
  },
  "sage-cream": {
    canvas: "#dde0d5",
    band: "#eef0e8",
    footer: "#eef0e8",
    kicker: "#5f6b58",
    divider: "#8fa37d",
    title: "#55604c",
    domain: "#5f6b58",
  },
  "cocoa-blush": {
    canvas: "#e8ddd7",
    band: "#f1e7df",
    footer: "#f1e7df",
    kicker: "#805f4e",
    divider: "#d09973",
    title: "#9e5f3c",
    domain: "#805f4e",
  },
  "midnight-gold": {
    canvas: "#d7d5d0",
    band: "#23262d",
    footer: "#23262d",
    kicker: "#d7ba81",
    divider: "#a58042",
    title: "#f0e2bb",
    domain: "#d7ba81",
  },
};

export function SplitVerticalTitleBase({
  title,
  subtitle,
  images,
  domain,
  colorPreset = "plum-sand",
  forceHideSubtitle = false,
}: SplitVerticalTitleBaseProps) {
  const firstImage = images[0] ?? "/sample-workspace-a.svg";
  const secondImage = images[1] ?? firstImage;
  const cleanedDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const hasSubtitle = !forceHideSubtitle && Boolean(subtitle?.trim());
  const palette = COLOR_PRESETS[colorPreset];

  return (
    <div
      data-pin-canvas="true"
      className="relative h-[1920px] w-[1080px] overflow-hidden"
      style={{ backgroundColor: palette.canvas }}
    >
      <div className="flex h-full flex-col">
        <div className="relative h-[730px] w-full overflow-hidden">
          <img
            src={firstImage}
            alt={title}
            className="h-full w-full object-cover object-[center_40%]"
          />
        </div>

        <div
          className="relative flex h-[410px] w-full flex-col items-center justify-center px-[92px] text-center"
          style={{ backgroundColor: palette.band }}
        >
          {hasSubtitle ? (
            <>
              <p
                className="font-serif text-[36px] font-semibold leading-none tracking-[0.01em]"
                style={{ color: palette.kicker }}
              >
                {subtitle}
              </p>
              <div
                className="mt-6 h-[3px] w-[180px] rounded-full"
                style={{ backgroundColor: palette.divider }}
              />
            </>
          ) : null}

          <div
            className={`flex w-full items-center justify-center ${
              hasSubtitle ? "mt-8 h-[188px]" : "h-[238px]"
            }`}
          >
            <AutoFitTitle
              text={title}
              minFontSize={hasSubtitle ? 56 : 64}
              maxFontSize={hasSubtitle ? 84 : 96}
              lineHeight={1.08}
              maxLines={hasSubtitle ? 3 : 2}
              className="w-full max-w-[860px] text-balance font-serif font-bold tracking-[-0.03em]"
              textColor={palette.title}
            />
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[32px]"
            style={{
              backgroundImage: [
                `radial-gradient(circle at 2% -12px, transparent 20px, ${palette.band} 21px)`,
                `radial-gradient(circle at 10% 40px, transparent 22px, ${palette.band} 23px)`,
                `radial-gradient(circle at 18% -10px, transparent 20px, ${palette.band} 21px)`,
                `radial-gradient(circle at 28% 42px, transparent 22px, ${palette.band} 23px)`,
                `radial-gradient(circle at 38% -10px, transparent 20px, ${palette.band} 21px)`,
                `radial-gradient(circle at 50% 40px, transparent 22px, ${palette.band} 23px)`,
                `radial-gradient(circle at 62% -10px, transparent 20px, ${palette.band} 21px)`,
                `radial-gradient(circle at 72% 42px, transparent 22px, ${palette.band} 23px)`,
                `radial-gradient(circle at 82% -12px, transparent 20px, ${palette.band} 21px)`,
                `radial-gradient(circle at 92% 40px, transparent 22px, ${palette.band} 23px)`,
              ].join(", "),
            }}
          />
        </div>

        <div className="relative h-[660px] w-full overflow-hidden">
          <img
            src={secondImage}
            alt={cleanedDomain}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div
          className="flex h-[120px] w-full items-center justify-center px-10"
          style={{ backgroundColor: palette.footer }}
        >
          <p
            className="font-serif text-[36px] font-semibold leading-none tracking-[-0.02em]"
            style={{ color: palette.domain }}
          >
            www.{cleanedDomain}
          </p>
        </div>
      </div>
    </div>
  );
}
