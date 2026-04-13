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
    compareVersionId?: string;
  }>;
};

export default async function RuntimeTemplatePreviewPage({
  params,
  searchParams,
}: RuntimeTemplatePreviewPageProps) {
  await requireAuthenticatedDashboardUser();
  const user = await getOrCreateDashboardUser();
  const { templateId } = await params;
  const { preset, versionId, compareVersionId } = await searchParams;
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
  const compareVersion =
    compareVersionId && compareVersionId !== version.id
      ? template.versions.find((entry) => entry.id === compareVersionId) ?? null
      : null;
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
  const preferredCompareVersion =
    compareVersion ??
    getPreferredCompareVersion(template.versions, version.id, version.lifecycleStatus);

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
              {template.isVariant ? (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                  Variant
                </span>
              ) : null}
              {template.variantFamilyTemplate ? (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                  Family: {template.variantFamilyTemplate.name}
                </span>
              ) : null}
              {!template.isVariant && template.variantCount > 0 ? (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                  {template.variantCount} variants
                </span>
              ) : null}
              {template._count.generatedPins > 0 ? (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                  {template._count.generatedPins} pin(s)
                </span>
              ) : null}
              {template._count.generationPlans > 0 ? (
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                  {template._count.generationPlans} plan(s)
                </span>
              ) : null}
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
            {preferredCompareVersion ? (
              <Link
                href={`/dashboard/templates/${template.id}/preview?versionId=${version.id}&compareVersionId=${preferredCompareVersion.id}${preset ? `&preset=${preset}` : ""}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Compare versions
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
          {compareVersion ? (
            <div className="grid gap-5 2xl:grid-cols-2">
              <CompareCanvasCard
                label={`Selected v${version.versionNumber}`}
                lifecycleStatus={version.lifecycleStatus}
              >
                {renderRuntimeTemplate(version.schemaJson, payload)}
              </CompareCanvasCard>
              <CompareCanvasCard
                label={`Compare v${compareVersion.versionNumber}`}
                lifecycleStatus={compareVersion.lifecycleStatus}
              >
                {renderRuntimeTemplate(compareVersion.schemaJson, payload)}
              </CompareCanvasCard>
            </div>
          ) : (
            <PreviewCanvas>{renderRuntimeTemplate(version.schemaJson, payload)}</PreviewCanvas>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Versions
              </p>
              {compareVersion ? (
                <Link
                  href={`/dashboard/templates/${template.id}/preview?versionId=${version.id}${preset ? `&preset=${preset}` : ""}`}
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--dashboard-subtle)]"
                >
                  Exit compare
                </Link>
              ) : null}
            </div>
            <div className="mt-3 space-y-2">
              {template.versions.map((entry) => {
                const isSelected = entry.id === version.id;
                const isCompared = entry.id === compareVersion?.id;

                return (
                  <div
                    key={entry.id}
                    className={`rounded-[18px] border px-3 py-3 ${
                      isSelected
                        ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft)]"
                        : isCompared
                          ? "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)]"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                        <span>v{entry.versionNumber}</span>
                        <span>{entry.lifecycleStatus}</span>
                        {entry.id === template.activeVersion?.id ? <span>Active</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/templates/${template.id}/preview?versionId=${entry.id}${preset ? `&preset=${preset}` : ""}`}
                          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--dashboard-subtle)]"
                        >
                          View
                        </Link>
                        {entry.id !== version.id ? (
                          <Link
                            href={`/dashboard/templates/${template.id}/preview?versionId=${version.id}&compareVersionId=${entry.id}${preset ? `&preset=${preset}` : ""}`}
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--dashboard-subtle)]"
                          >
                            Compare
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Preset
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {templateVisualPresets.slice(0, 10).map((presetId) => (
                <Link
                  key={presetId}
                  href={`/dashboard/templates/${template.id}/preview?preset=${presetId}&versionId=${version.id}${compareVersion ? `&compareVersionId=${compareVersion.id}` : ""}`}
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
              Editor sample payload
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--dashboard-muted)]">
              This preview uses editor sample content. Final generated pins use live plan payloads,
              which can reveal tighter spacing than the editor sample does.
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
              <div>
                <dt className="font-semibold text-[var(--dashboard-muted)]">Where used</dt>
                <dd className="mt-1">
                  {template._count.generationPlans} plan(s) • {template._count.generatedPins} pin(s)
                </dd>
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

function PreviewCanvas({ children }: { children: React.ReactNode }) {
  return (
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
        {children}
      </div>
    </div>
  );
}

function CompareCanvasCard({
  label,
  lifecycleStatus,
  children,
}: {
  label: string;
  lifecycleStatus: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
          {label}
        </span>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
          {lifecycleStatus}
        </span>
      </div>
      <PreviewCanvas>{children}</PreviewCanvas>
    </div>
  );
}

function getPreferredCompareVersion(
  versions: Array<{
    id: string;
    lifecycleStatus: string;
  }>,
  selectedVersionId: string,
  selectedLifecycleStatus: string,
) {
  const otherVersions = versions.filter((entry) => entry.id !== selectedVersionId);
  if (otherVersions.length === 0) {
    return null;
  }

  if (selectedLifecycleStatus === "DRAFT") {
    return (
      otherVersions.find((entry) => entry.lifecycleStatus === "FINALIZED") ??
      otherVersions[0] ??
      null
    );
  }

  return (
    otherVersions.find((entry) => entry.lifecycleStatus === "DRAFT") ??
    otherVersions[0] ??
    null
  );
}
