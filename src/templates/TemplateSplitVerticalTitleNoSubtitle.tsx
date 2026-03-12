import type { TemplateRenderProps } from "@/lib/templates/types";
import { SplitVerticalTitleBase } from "@/templates/SplitVerticalTitleBase";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.028em",
    lineHeight: 1.08,
    textTransform: "uppercase" as const,
  },
  subtitle: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.14em",
    lineHeight: 1.04,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1,
    textTransform: "uppercase" as const,
  },
  domain: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1.04,
    textTransform: "uppercase" as const,
  },
} as const;

export function TemplateSplitVerticalTitleNoSubtitle(props: TemplateRenderProps) {
  return (
    <SplitVerticalTitleBase
      {...props}
      forceHideSubtitle
      numberTreatment="none"
      typography={TEMPLATE_TYPOGRAPHY}
      titleClassName="w-full max-w-[960px] uppercase"
    />
  );
}
