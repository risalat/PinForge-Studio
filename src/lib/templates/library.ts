import { getSampleTemplateProps, TEMPLATE_CONFIGS } from "@/lib/templates/registry";

export function getTemplateLibraryEntries() {
  return Object.values(TEMPLATE_CONFIGS).map((config) => ({
    ...config,
    previewPath: config.previewPath ?? `/preview/${config.id}`,
    locked: config.locked ?? false,
    sampleProps: getSampleTemplateProps(config.id),
  }));
}
