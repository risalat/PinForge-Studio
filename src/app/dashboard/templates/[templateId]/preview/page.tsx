import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { generateTemplateQaPackAction } from "@/app/dashboard/templates/actions";
import { getTemplateWithVersionsForUser } from "@/lib/runtime-templates/db";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { getTemplateVersionAnalyticsForUser } from "@/lib/template-analytics/db";
import {
  getTemplateQaReviewForUser,
  type TemplateQaArtifactEntry,
} from "@/lib/template-qa/db";
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
  const [template, versionAnalytics] = await Promise.all([
    getTemplateWithVersionsForUser({
      userId: user.id,
      templateId,
      versionId: versionId ?? null,
    }),
    getTemplateVersionAnalyticsForUser({
      userId: user.id,
      templateId,
    }),
  ]);

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
  const qaReview = await getTemplateQaReviewForUser({
    userId: user.id,
    templateId,
    versionId: version.id,
  });
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
  const qaManifest = qaReview?.manifest ?? null;
  const qaTask = qaReview?.task ?? null;
  const qaStateLabel = qaTask
    ? qaTask.status === "RUNNING" || qaTask.status === "QUEUED"
      ? "QA generating"
      : qaTask.status === "FAILED"
        ? "QA failed"
        : qaManifest
          ? qaManifest.failedCaptureCount > 0
            ? "QA partial"
            : "QA ready"
          : "QA queued"
    : qaManifest
      ? qaManifest.failedCaptureCount > 0
        ? "QA partial"
        : "QA ready"
      : "No QA pack";
  const returnTo = `/dashboard/templates/${template.id}/preview?versionId=${version.id}${compareVersion ? `&compareVersionId=${compareVersion.id}` : ""}${preset ? `&preset=${preset}` : ""}`;

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
            {version.lifecycleStatus === "FINALIZED" ? (
              <form action={generateTemplateQaPackAction}>
                <input type="hidden" name="templateId" value={template.id} />
                <input type="hidden" name="versionId" value={version.id} />
                <input type="hidden" name="preset" value={preset ?? ""} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  {qaManifest ? "Refresh QA pack" : "Generate QA pack"}
                </button>
              </form>
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
                const analytics = versionAnalytics.find((item) => item.versionId === entry.id) ?? null;

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
                        {entry.qaArtifactJson ? <span>QA pack</span> : null}
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
                    {analytics ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                        <span className="rounded-full bg-[var(--dashboard-panel-strong)] px-2.5 py-1">
                          {analytics.planCount} plans
                        </span>
                        <span className="rounded-full bg-[var(--dashboard-panel-strong)] px-2.5 py-1">
                          {analytics.generatedPinCount} pins
                        </span>
                        <span className="rounded-full bg-[var(--dashboard-panel-strong)] px-2.5 py-1">
                          {analytics.publishedCount} published
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Release confidence
              </p>
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]">
                {qaStateLabel}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {validation?.blockingErrorCount ?? 0} blockers
              </span>
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {validation?.warnings?.length ?? 0} warnings
              </span>
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {qaManifest?.matrixCount ?? 0} presets
              </span>
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {qaManifest?.stressCaseCount ?? 0} stress cases
              </span>
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {qaManifest?.failedCaptureCount ?? 0} failed captures
              </span>
            </div>
            {qaTask && (qaTask.status === "QUEUED" || qaTask.status === "RUNNING") ? (
              <p className="mt-3 text-xs leading-5 text-[var(--dashboard-muted)]">
                QA pack generation is running in the background. Refresh this page after it completes.
              </p>
            ) : null}
            {qaTask?.status === "FAILED" ? (
              <p className="mt-3 text-xs leading-5 text-[#8d4f43]">
                {qaTask.lastError || "QA generation failed."}
              </p>
            ) : null}
            {!qaManifest ? (
              <p className="mt-3 text-xs leading-5 text-[var(--dashboard-muted)]">
                No stored QA screenshots yet for this version.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {qaManifest.compareEntry ? (
                  <details open className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--dashboard-text)]">
                      Compare screenshots
                    </summary>
                    <div className="mt-3 grid gap-3">
                      <QaImageLink href={qaManifest.compareEntry.previewUrl} label="Preview screenshot" />
                      <QaImageLink href={qaManifest.compareEntry.renderUrl} label="Render screenshot" />
                    </div>
                  </details>
                ) : null}
                <details className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--dashboard-text)]">
                    Preset matrix previews
                  </summary>
                  <div className="mt-3 space-y-3">
                    {qaManifest.presetMatrix.map((entry) => (
                      <QaPackRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                </details>
                <details className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--dashboard-text)]">
                    Stress-case screenshot pack
                  </summary>
                  <div className="mt-3 space-y-3">
                    {qaManifest.stressPack.map((entry) => (
                      <QaPackRow key={entry.id} entry={entry} />
                    ))}
                  </div>
                </details>
                {qaManifest.failedCaptureCount > 0 ? (
                  <details className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--dashboard-text)]">
                      Failed-preview diagnostics
                    </summary>
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-[#8d4f43]">
                      {[qaManifest.compareEntry, ...qaManifest.presetMatrix, ...qaManifest.stressPack]
                        .flatMap((entry) => entry?.diagnostics ?? [])
                        .map((diagnostic, index) => (
                          <li key={`${index}-${diagnostic}`}>{diagnostic}</li>
                        ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            )}
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
                  {template._count.generationPlans} plan(s) | {template._count.generatedPins} pin(s)
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

function QaImageLink({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <div className="rounded-[14px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-xs text-[var(--dashboard-muted)]">
        {label} unavailable
      </div>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-[14px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-xs font-semibold text-[var(--dashboard-subtle)] transition hover:border-[var(--dashboard-accent-border)] hover:text-[var(--dashboard-accent-strong)]"
    >
      {label}
    </Link>
  );
}

function QaPackRow({ entry }: { entry: TemplateQaArtifactEntry }) {
  return (
    <div className="rounded-[16px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{entry.label}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
            <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
              {entry.presetId}
            </span>
            {entry.stressCaseLabel ? (
              <span className="rounded-full bg-[var(--dashboard-panel)] px-2.5 py-1">
                {entry.stressCaseLabel}
              </span>
            ) : null}
            <span
              className={`rounded-full px-2.5 py-1 ${
                entry.status === "ready"
                  ? "bg-[#e8f4ea] text-[#2e6f45]"
                  : "bg-[#f7e8e5] text-[#8d4f43]"
              }`}
            >
              {entry.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <QaImageLink href={entry.previewUrl} label="Preview" />
          <QaImageLink href={entry.renderUrl} label="Render" />
        </div>
      </div>
      {entry.diagnostics.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs leading-5 text-[#8d4f43]">
          {entry.diagnostics.map((diagnostic, index) => (
            <li key={`${entry.id}-${index}`}>{diagnostic}</li>
          ))}
        </ul>
      ) : null}
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
