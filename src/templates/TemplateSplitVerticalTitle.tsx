import type { TemplateRenderProps } from "@/lib/templates/types";
import { SplitVerticalTitleBase } from "@/templates/SplitVerticalTitleBase";

const TEMPLATE_TYPOGRAPHY = {
  title: {
    fontFamily: "var(--font-libre-baskerville), serif",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.16,
  },
  subtitle: {
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontWeight: 700,
    letterSpacing: "0.16em",
    lineHeight: 1.05,
    textTransform: "uppercase" as const,
  },
  number: {
    fontFamily: "var(--font-cormorant-garamond), serif",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  domain: {
    fontFamily: "var(--font-lora), serif",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.02,
  },
} as const;

export function TemplateSplitVerticalTitle(props: TemplateRenderProps) {
  return (
    <SplitVerticalTitleBase
      {...props}
      numberTreatment="none"
      typography={TEMPLATE_TYPOGRAPHY}
      titleClassName="w-full max-w-[960px]"
    />
  );
}
