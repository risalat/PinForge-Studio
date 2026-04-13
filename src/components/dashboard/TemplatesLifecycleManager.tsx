import Link from "next/link";
import type { ReactNode } from "react";
import {
  archiveRuntimeTemplateAction,
  createDraftFromFinalizedTemplateAction,
  createStarterTemplateDraftAction,
  deleteRuntimeTemplateAction,
  duplicateRuntimeTemplateAction,
  duplicateRuntimeTemplateAsVariantAction,
  finalizeRuntimeTemplateAction,
  validateRuntimeTemplateAction,
} from "@/app/dashboard/templates/actions";
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
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <SummaryChip label="Built-in" value={builtInCount} />
          <SummaryChip label="Custom" value={templates.length} />
          <SummaryChip label="Drafts" value={draftTemplates.length} />
          <SummaryChip label="Finalized" value={finalizedTemplates.length} />
          <SummaryChip label="Archived" value={archivedTemplates.length} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href="/dashboard/library"
              className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
            >
              Open library
            </Link>
            <Link
              href="/dashboard/templates?view=groups"
              className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
            >
              Manage groups
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
          <h2 className="text-xl font-bold">Create starter draft</h2>
          <Link
            href="/dashboard/templates?view=groups"
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            My groups
          </Link>
        </div>
        <form action={createStarterTemplateDraftAction} className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto] xl:items-end">
          <input
            type="text"
            name="name"
            placeholder="Starter custom template"
            className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
          />
          <button
            type="submit"
            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
          >
            Create draft
          </button>
        </form>
      </section>

      <TemplateSection
        title="Drafts"
        count={draftTemplates.length}
        emptyLabel="No drafts yet."
      >
        {draftTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            primaryActions={(activeVersion) => (
              <>
                <ActionLink
                  href={`/dashboard/templates/${template.id}/edit`}
                  label="Edit"
                  tone="accent"
                />
                <ActionLink
                  href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                  label="Preview"
                />
              </>
            )}
            secondaryActions={(activeVersion) => (
              <>
                <ActionLink
                  href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                  label="Manage groups"
                />
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
                <InlineActionForm
                  action={duplicateRuntimeTemplateAsVariantAction}
                  buttonLabel="Variant"
                >
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
                <InlineActionForm action={archiveRuntimeTemplateAction} buttonLabel="Archive" tone="danger">
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
              </>
            )}
          />
        ))}
      </TemplateSection>

      <TemplateSection
        title="Finalized"
        count={finalizedTemplates.length}
        emptyLabel="No finalized custom templates yet."
      >
        {finalizedTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            primaryActions={(activeVersion) => (
              <>
                <ActionLink
                  href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                  label="Preview"
                  tone="accent"
                />
                <ActionLink href="/dashboard/jobs" label="Use in jobs" />
              </>
            )}
            secondaryActions={(activeVersion) => (
              <>
                <ActionLink
                  href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                  label="Manage groups"
                />
                {activeVersion ? (
                  <InlineActionForm action={createDraftFromFinalizedTemplateAction} buttonLabel="New draft">
                    <input type="hidden" name="templateId" value={template.id} />
                    <input type="hidden" name="sourceVersionId" value={activeVersion.id} />
                  </InlineActionForm>
                ) : null}
                <InlineActionForm action={duplicateRuntimeTemplateAction} buttonLabel="Duplicate">
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
                <InlineActionForm
                  action={duplicateRuntimeTemplateAsVariantAction}
                  buttonLabel="Variant"
                >
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
                <InlineActionForm action={archiveRuntimeTemplateAction} buttonLabel="Archive" tone="danger">
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
              </>
            )}
          />
        ))}
      </TemplateSection>

      <TemplateSection
        title="Archived"
        count={archivedTemplates.length}
        emptyLabel="No archived custom templates."
      >
        {archivedTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            primaryActions={(activeVersion) => (
              <ActionLink
                href={`/dashboard/templates/${template.id}/preview${activeVersion ? `?versionId=${activeVersion.id}` : ""}`}
                label="Preview"
                tone="accent"
              />
            )}
            secondaryActions={() => (
              <>
                <ActionLink
                  href={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
                  label="Manage groups"
                />
                <InlineActionForm action={duplicateRuntimeTemplateAction} buttonLabel="Duplicate">
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
                <InlineActionForm
                  action={duplicateRuntimeTemplateAsVariantAction}
                  buttonLabel="Variant"
                >
                  <input type="hidden" name="templateId" value={template.id} />
                </InlineActionForm>
              </>
            )}
          />
        ))}
      </TemplateSection>
    </div>
  );
}

function TemplateSection({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
          {count}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 text-sm text-[var(--dashboard-subtle)]">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{items}</div>
      )}
    </section>
  );
}

function TemplateCard({
  template,
  primaryActions,
  secondaryActions,
}: {
  template: CustomTemplateList[number];
  primaryActions: (activeVersion: CustomTemplateList[number]["activeVersion"]) => ReactNode;
  secondaryActions: (activeVersion: CustomTemplateList[number]["activeVersion"]) => ReactNode;
}) {
  const activeVersion = template.activeVersion;
  const isDeletable =
    template.versions.every((version) => version.lifecycleStatus !== "FINALIZED") &&
    template._count.generationPlans === 0 &&
    template._count.generatedPins === 0;

  return (
    <article className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-[var(--dashboard-text)]">{template.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--dashboard-subtle)]">
            {template.description || "No description"}
          </p>
        </div>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
          {template.lifecycleStatus}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MiniChip label={template.slug || "No slug"} />
        {activeVersion ? <MiniChip label={`v${activeVersion.versionNumber}`} /> : null}
        {template.isVariant ? <MiniChip label="Variant" /> : null}
        {template.variantFamilyTemplate ? (
          <MiniChip label={`Family: ${template.variantFamilyTemplate.name}`} />
        ) : null}
        {!template.isVariant && template.variantCount > 0 ? (
          <MiniChip label={`${template.variantCount} variants`} />
        ) : null}
      </div>

      <div className="mt-4 rounded-[20px] bg-[var(--dashboard-panel-strong)] px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
          My groups
        </p>
        <p className="mt-1 text-sm text-[var(--dashboard-text)]">
          {summarizeItems(template.userGroups.map((group) => group.name), "Not in any groups")}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {primaryActions(activeVersion)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {secondaryActions(activeVersion)}
        {isDeletable ? (
          <InlineActionForm action={deleteRuntimeTemplateAction} buttonLabel="Delete" tone="danger">
            <input type="hidden" name="templateId" value={template.id} />
          </InlineActionForm>
        ) : null}
      </div>
    </article>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]">
      {label}: {value}
    </span>
  );
}

function MiniChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[var(--dashboard-panel-alt)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]">
      {label}
    </span>
  );
}

function ActionLink({
  href,
  label,
  tone = "neutral",
}: {
  href: string;
  label: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        tone === "accent"
          ? "dashboard-accent-action bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </Link>
  );
}

function InlineActionForm({
  action,
  buttonLabel,
  tone = "neutral",
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <form action={action} className="contents">
      {children}
      <button
        type="submit"
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          tone === "danger"
            ? "border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
            : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-subtle)]"
        }`}
      >
        {buttonLabel}
      </button>
    </form>
  );
}

function summarizeItems(items: string[], emptyLabel: string, limit = 3) {
  if (items.length === 0) {
    return emptyLabel;
  }

  const visibleItems = items.slice(0, limit).map((item) => item.replace(/[-_]/g, " "));
  const overflowCount = items.length - visibleItems.length;

  return overflowCount > 0 ? `${visibleItems.join(", ")} +${overflowCount}` : visibleItems.join(", ");
}
