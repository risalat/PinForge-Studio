import Link from "next/link";
import type { ReactNode } from "react";
import {
  archiveRuntimeTemplateAction,
  createDraftFromFinalizedTemplateAction,
  createStarterTemplateDraftAction,
  deleteRuntimeTemplateAction,
  duplicateRuntimeTemplateAction,
  finalizeRuntimeTemplateAction,
  validateRuntimeTemplateAction,
} from "@/app/dashboard/templates/actions";
import { TemplateGroupingSummary } from "@/components/dashboard/TemplateGroupingSummary";
import { listCustomTemplatesForUser } from "@/lib/runtime-templates/db";

type CustomTemplateList = Awaited<ReturnType<typeof listCustomTemplatesForUser>>;

export function TemplatesLifecycleManager({
  builtInCount,
  templates,
}: {
  builtInCount: number;
  templates: CustomTemplateList;
}) {
  const draftTemplates = templates.filter((template) => template.lifecycleStatus === "DRAFT");
  const finalizedTemplates = templates.filter((template) => template.lifecycleStatus === "FINALIZED");
  const archivedTemplates = templates.filter((template) => template.lifecycleStatus === "ARCHIVED");

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-5">
        <MetricCard label="Built-in Templates" value={String(builtInCount)} linkHref="/dashboard/library" linkLabel="Open library" />
        <MetricCard label="My Custom Templates" value={String(templates.length)} />
        <MetricCard label="Drafts" value={String(draftTemplates.length)} />
        <MetricCard label="Finalized" value={String(finalizedTemplates.length)} />
        <MetricCard label="Archived" value={String(archivedTemplates.length)} />
      </section>

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold">My custom templates</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">
              Create starter drafts, manage draft and finalized lifecycle state, and keep My groups separate from the System tags inferred from template structure.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/library"
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Browse built-in + finalized library
              </Link>
              <Link
                href="/dashboard/templates?view=groups"
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Manage My groups
              </Link>
            </div>
          </div>
          <form action={createStarterTemplateDraftAction} className="grid w-full gap-3 xl:max-w-[480px]">
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              Template name
              <input
                type="text"
                name="name"
                placeholder="Starter Custom Template"
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              Description
              <textarea
                name="description"
                rows={3}
                placeholder="Optional note for this draft"
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
            >
              Create starter draft
            </button>
          </form>
        </div>
      </section>

      <TemplateSection
        title="Drafts"
        description="Editable runtime-template drafts. Use validation and finalize from here or from the editor."
        templates={draftTemplates}
        emptyLabel="No drafts yet."
        actions={(template) => {
          const activeVersion = template.activeVersion;
          return (
            <>
              <Link
                href={`/dashboard/templates/${template.id}/edit`}
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
              >
                Edit draft
              </Link>
              <Link
                href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Manage My groups
              </Link>
              <Link
                href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Preview
              </Link>
              {activeVersion ? (
                <>
                  <InlineActionForm action={validateRuntimeTemplateAction} buttonLabel="Validate">
                    <input type="hidden" name="templateId" value={template.id} />
                    <input type="hidden" name="versionId" value={activeVersion.id} />
                  </InlineActionForm>
                  <InlineActionForm action={finalizeRuntimeTemplateAction} buttonLabel="Finalize">
                    <input type="hidden" name="templateId" value={template.id} />
                    <input type="hidden" name="versionId" value={activeVersion.id} />
                  </InlineActionForm>
                </>
              ) : null}
              <InlineActionForm action={duplicateRuntimeTemplateAction} buttonLabel="Duplicate">
                <input type="hidden" name="templateId" value={template.id} />
              </InlineActionForm>
              <InlineActionForm action={archiveRuntimeTemplateAction} buttonLabel="Archive" tone="danger">
                <input type="hidden" name="templateId" value={template.id} />
              </InlineActionForm>
            </>
          );
        }}
      />

      <TemplateSection
        title="Finalized"
        description="Locked production-ready runtime templates. These are the only custom templates exposed to plan selection."
        templates={finalizedTemplates}
        emptyLabel="No finalized custom templates yet."
        actions={(template) => {
          const activeVersion = template.activeVersion;
          return (
            <>
              <Link
                href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
              >
                Preview
              </Link>
              <Link
                href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Manage My groups
              </Link>
              <Link
                href="/dashboard/jobs"
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Use in plan
              </Link>
              {activeVersion ? (
                <InlineActionForm action={createDraftFromFinalizedTemplateAction} buttonLabel="Create new draft">
                  <input type="hidden" name="templateId" value={template.id} />
                  <input type="hidden" name="sourceVersionId" value={activeVersion.id} />
                </InlineActionForm>
              ) : null}
              <InlineActionForm action={duplicateRuntimeTemplateAction} buttonLabel="Duplicate">
                <input type="hidden" name="templateId" value={template.id} />
              </InlineActionForm>
              <InlineActionForm action={archiveRuntimeTemplateAction} buttonLabel="Archive" tone="danger">
                <input type="hidden" name="templateId" value={template.id} />
              </InlineActionForm>
            </>
          );
        }}
      />

      <TemplateSection
        title="Archived"
        description="Archived templates stay out of production selection and remain available for reference."
        templates={archivedTemplates}
        emptyLabel="No archived custom templates."
        actions={(template) => {
          const activeVersion = template.activeVersion;
          return (
            <>
              <Link
                href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Preview
              </Link>
              <Link
                href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Manage My groups
              </Link>
              <InlineActionForm action={duplicateRuntimeTemplateAction} buttonLabel="Duplicate">
                <input type="hidden" name="templateId" value={template.id} />
              </InlineActionForm>
            </>
          );
        }}
      />
    </div>
  );
}

function MetricCard(input: {
  label: string;
  value: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
        {input.label}
      </p>
      <p className="mt-3 text-4xl font-black">{input.value}</p>
      {input.linkHref && input.linkLabel ? (
        <Link
          href={input.linkHref}
          className="mt-4 inline-flex rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
        >
          {input.linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function TemplateSection(input: {
  title: string;
  description: string;
  templates: CustomTemplateList;
  emptyLabel: string;
  actions: (template: CustomTemplateList[number]) => ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{input.title}</h2>
        <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{input.description}</p>
      </div>
      {input.templates.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          {input.emptyLabel}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {input.templates.map((template) => {
            const activeVersion = template.activeVersion;
            const isDeletable =
              template.versions.every((version) => version.lifecycleStatus !== "FINALIZED") &&
              template._count.generationPlans === 0 &&
              template._count.generatedPins === 0;
            const summary =
              activeVersion?.summaryJson && typeof activeVersion.summaryJson === "object"
                ? (activeVersion.summaryJson as {
                    imageSlotCount?: number;
                    supportsSubtitle?: boolean;
                    supportsItemNumber?: boolean;
                    supportsDomain?: boolean;
                    elementCount?: number;
                    supportedBindings?: string[];
                    allowedPresetCategories?: string[];
                  })
                : null;
            const validation =
              activeVersion?.validationJson && typeof activeVersion.validationJson === "object"
                ? (activeVersion.validationJson as {
                    blockingErrorCount?: number;
                  })
                : null;

            return (
              <article
                key={template.id}
                className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[var(--dashboard-text)]">{template.name}</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                      {template.description || "No description yet."}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                    {template.lifecycleStatus}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <InfoRow label="Slug" value={template.slug || "Not set"} />
                  <InfoRow label="Renderer" value={template.rendererKind} />
                  <InfoRow label="Source" value={template.sourceKind} />
                  <InfoRow label="Canvas" value={`${template.canvasWidth} x ${template.canvasHeight}`} />
                  <InfoRow label="Active version" value={activeVersion ? `v${activeVersion.versionNumber}` : "None"} />
                  <InfoRow label="Versions" value={String(template.versions.length)} />
                  <InfoRow label="Plan usage" value={String(template._count.generationPlans)} />
                  <InfoRow label="Generated pins" value={String(template._count.generatedPins)} />
                  <InfoRow label="Updated" value={new Date(template.updatedAt).toLocaleString()} />
                  <InfoRow label="Elements" value={summary?.elementCount ? String(summary.elementCount) : "Unknown"} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                    {summary?.imageSlotCount ?? 0} image slots
                  </span>
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                    subtitle {summary?.supportsSubtitle ? "on" : "off"}
                  </span>
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                    number {summary?.supportsItemNumber ? "on" : "off"}
                  </span>
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                    domain {summary?.supportsDomain ? "on" : "off"}
                  </span>
                  {summary?.supportedBindings?.length ? (
                    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                      {summary.supportedBindings.length} bindings
                    </span>
                  ) : null}
                  {summary?.allowedPresetCategories?.length ? (
                    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                      {summary.allowedPresetCategories.length} preset families
                    </span>
                  ) : null}
                  {validation ? (
                    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1">
                      {validation.blockingErrorCount
                        ? `${validation.blockingErrorCount} blocking`
                        : "validation clean"}
                    </span>
                  ) : null}
                </div>

                <TemplateGroupingSummary
                  systemCategories={template.systemCategories}
                  userGroups={template.userGroups}
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  {input.actions(template)}
                  {isDeletable ? (
                    <InlineActionForm action={deleteRuntimeTemplateAction} buttonLabel="Delete" tone="danger">
                      <input type="hidden" name="templateId" value={template.id} />
                    </InlineActionForm>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InlineActionForm(input: {
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <form action={input.action} className="contents">
      {input.children}
      <button
        type="submit"
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          input.tone === "danger"
            ? "border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
            : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
        }`}
      >
        {input.buttonLabel}
      </button>
    </form>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}
