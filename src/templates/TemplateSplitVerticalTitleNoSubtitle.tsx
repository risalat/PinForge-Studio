import type { TemplateRenderProps } from "@/lib/templates/types";
import { SplitVerticalTitleBase } from "@/templates/SplitVerticalTitleBase";

export function TemplateSplitVerticalTitleNoSubtitle(props: TemplateRenderProps) {
  return <SplitVerticalTitleBase {...props} forceHideSubtitle />;
}
