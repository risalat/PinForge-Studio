import { notFound } from "next/navigation";
import { getRuntimeTemplateForRender } from "@/lib/runtime-templates/db";
import { buildRuntimeTemplatePreviewPayload } from "@/lib/runtime-templates/previewPayload";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { runtimeTemplateDocumentSchema } from "@/lib/runtime-templates/schema";
import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";

const PREVIEW_WIDTH = 420;
const PREVIEW_SCALE = PREVIEW_WIDTH / 1080;
const PREVIEW_HEIGHT = Math.round(1920 * PREVIEW_SCALE);

type RuntimePreviewPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    preset?: string;
    versionId?: string;
    stressCase?: string;
  }>;
};

export default async function RuntimePreviewPage({
  params,
  searchParams,
}: RuntimePreviewPageProps) {
  const { templateId } = await params;
  const { preset, versionId, stressCase } = await searchParams;
  const template = await getRuntimeTemplateForRender({
    templateId,
    versionId: versionId ?? null,
  });

  if (!template?.version) {
    notFound();
  }

  const activePreset: TemplateVisualPresetId = templateVisualPresets.includes(
    preset as TemplateVisualPresetId,
  )
    ? (preset as TemplateVisualPresetId)
    : (getSampleRuntimeTemplateRenderProps().visualPreset ?? "teal-flare");
  const document = runtimeTemplateDocumentSchema.parse(template.version.schemaJson);
  const { payload, stressCaseLabel } = buildRuntimeTemplatePreviewPayload({
    document,
    editorStateJson: template.version.editorStateJson,
    presetId: activePreset,
    stressCaseId: stressCase ?? null,
  });

  return (
    <main className="min-h-screen bg-[#efe7db] px-6 py-10 text-[#24180f]">
      <div className="mx-auto max-w-[1120px] space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9d7445]">
            Runtime Template Preview
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">{template.template.name}</h1>
          <p className="mt-2 text-sm text-[#6f6255]">
            Public preview route for runtime-template QA and preview/render parity checks.
          </p>
          {stressCaseLabel ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9d7445]">
              Stress case: {stressCaseLabel}
            </p>
          ) : null}
        </div>

        <div
          className="overflow-hidden rounded-[24px] bg-white shadow-[0_28px_80px_rgba(36,24,15,0.14)]"
          style={{
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
          }}
        >
          <div
            style={{
            width: 1080,
            height: 1920,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
          }}
        >
            {renderRuntimeTemplate(document, payload)}
          </div>
        </div>
      </div>
    </main>
  );
}
