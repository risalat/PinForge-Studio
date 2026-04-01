import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { getTemplateWithVersionsForUser } from "@/lib/runtime-templates/db";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { templateVisualPresets, type TemplateVisualPresetId } from "@/lib/templates/types";

const PREVIEW_WIDTH = 420;
const PREVIEW_SCALE = PREVIEW_WIDTH / 1080;
const PREVIEW_HEIGHT = Math.round(1920 * PREVIEW_SCALE);

type RuntimeTemplatePreviewPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    preset?: string;
    versionId?: string;
  }>;
};

export default async function RuntimeTemplatePreviewPage({
  params,
  searchParams,
}: RuntimeTemplatePreviewPageProps) {
  await requireAuthenticatedDashboardUser();
  const user = await getOrCreateDashboardUser();
  const { templateId } = await params;
  const { preset, versionId } = await searchParams;
  const template = await getTemplateWithVersionsForUser({
    userId: user.id,
    templateId,
    versionId: versionId ?? null,
  });

  if (!template?.selectedVersion) {
    notFound();
  }

  const activePreset = templateVisualPresets.includes(preset as TemplateVisualPresetId)
    ? (preset as TemplateVisualPresetId)
    : getSampleRuntimeTemplateRenderProps().visualPreset;
  const editorState =
    template.selectedVersion.editorStateJson &&
    typeof template.selectedVersion.editorStateJson === "object"
      ? (template.selectedVersion.editorStateJson as {
          previewContent?: {
            title?: string;
            subtitle?: string;
            itemNumber?: number;
            domain?: string;
            ctaText?: string;
          };
        })
      : null;
  const payload = {
    ...getSampleRuntimeTemplateRenderProps({
      visualPreset: activePreset,
      title: editorState?.previewContent?.title,
      subtitle: editorState?.previewContent?.subtitle,
      itemNumber: editorState?.previewContent?.itemNumber,
      domain: editorState?.previewContent?.domain,
      ctaText: editorState?.previewContent?.ctaText,
    }),
  };

  const version = template.selectedVersion;
  const validation =
    version.validationJson && typeof version.validationJson === "object"
      ? (version.validationJson as {
          ok?: boolean;
          generatedAt?: string;
          blockingErrorCount?: number;
          warnings?: unknown[];
          stress?: { cases?: unknown[] };
        })
      : null;

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Runtime Template Preview
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">{template.name}</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--dashboard-subtle)]">
              {template.description || "Runtime preview for the active schema version."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                v{version.versionNumber}
              </span>
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                {version.lifecycleStatus}
              </span>
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                {template.rendererKind}
              </span>
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                {payload.visualPreset}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/templates"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              Back to templates
            </Link>
            <Link
              href={`/dashboard/templates/${template.id}/edit${version.lifecycleStatus === "FINALIZED" ? "?cloneFinalized=1" : ""}`}
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              {version.lifecycleStatus === "FINALIZED" ? "Edit finalized template" : "Edit draft"}
            </Link>
            <Link
              href={`/render/${template.id}?versionId=${version.id}`}
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
            >
              Open final render path
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
          <div
            className="overflow-hidden rounded-[22px] bg-white shadow-[var(--dashboard-shadow-sm)]"
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
              {renderRuntimeTemplate(version.schemaJson, payload)}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Preset
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {templateVisualPresets.slice(0, 10).map((presetId) => (
                <Link
                  key={presetId}
                  href={`/dashboard/templates/${template.id}/preview?preset=${presetId}&versionId=${version.id}`}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    presetId === payload.visualPreset
                      ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                      : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
                  }`}
                >
                  {presetId}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Sample payload
            </p>
            <dl className="mt-4 space-y-3 text-sm text-[var(--dashboard-subtle)]">
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Validation</dt>
                <dd className="mt-1">
                  {validation
                    ? validation.blockingErrorCount
                      ? `${validation.blockingErrorCount} blocking issue(s)`
                      : "Validation clean"
                    : "Not run yet"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Title</dt>
                <dd className="mt-1">{payload.title}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Subtitle</dt>
                <dd className="mt-1">{payload.subtitle || "None"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Item number</dt>
                <dd className="mt-1">{payload.itemNumber ?? "None"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Domain</dt>
                <dd className="mt-1">{payload.domain}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Images</dt>
                <dd className="mt-1">{payload.images.length}</dd>
              </div>
              {validation?.generatedAt ? (
                <div>
                  <dt className="font-semibold text-[var(--dashboard-muted)]">Last validation</dt>
                  <dd className="mt-1">{new Date(validation.generatedAt).toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </aside>
      </section>
    </div>
  );
}
