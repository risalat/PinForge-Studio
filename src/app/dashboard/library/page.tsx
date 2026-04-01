import Link from "next/link";
import type { ReactNode } from "react";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { listCustomTemplatesForUser } from "@/lib/runtime-templates/db";
import { renderTemplate } from "@/lib/templates/registry";
import {
  getBuiltInTemplateCategories,
  getBuiltInTemplateLibraryEntries,
  listFinalizedCustomTemplateCandidatesForUser,
} from "@/lib/templates/selectableTemplates";

const THUMBNAIL_WIDTH = 280;
const THUMBNAIL_SCALE = THUMBNAIL_WIDTH / 1080;
const THUMBNAIL_HEIGHT = Math.round(1920 * THUMBNAIL_SCALE);

export default async function DashboardLibraryPage() {
  await requireAuthenticatedDashboardUser();
  const user = await getOrCreateDashboardUser();
  const [builtIns, customFinalized, customTemplates] = await Promise.all([
    Promise.resolve(getBuiltInTemplateLibraryEntries()),
    listFinalizedCustomTemplateCandidatesForUser(user.id),
    listCustomTemplatesForUser(user.id),
  ]);
  const finalizedCustomTemplates = customFinalized.filter(
    (
      template,
    ): template is NonNullable<(typeof customFinalized)[number]> => Boolean(template),
  );
  const draftCount = customTemplates.filter((template) => template.lifecycleStatus === "DRAFT").length;
  const archivedCount = customTemplates.filter((template) => template.lifecycleStatus === "ARCHIVED").length;

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-5">
        <LibraryMetric label="Selectable Templates" value={String(builtIns.length + finalizedCustomTemplates.length)} />
        <LibraryMetric label="Built-in Templates" value={String(builtIns.length)} />
        <LibraryMetric label="Finalized Custom" value={String(finalizedCustomTemplates.length)} />
        <LibraryMetric label="Drafts" value={String(draftCount)} linkHref="/dashboard/templates" linkLabel="Open drafts" />
        <LibraryMetric label="Archived" value={String(archivedCount)} linkHref="/dashboard/templates" linkLabel="Open manager" />
      </section>

      <LibrarySection
        title="Built-in Templates"
        description="Production-safe built-in components. These continue to use the locked registry path exactly as before."
      >
        <div className="grid gap-6 2xl:grid-cols-2">
          {builtIns.map((template) => (
            <article
              key={template.id}
              className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]"
            >
              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[26px] bg-[var(--dashboard-panel-alt)] p-4">
                  <div
                    className="overflow-hidden rounded-[22px] bg-white shadow-[var(--dashboard-shadow-sm)]"
                    style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT }}
                  >
                    <div
                      style={{
                        width: 1080,
                        height: 1920,
                        transform: `scale(${THUMBNAIL_SCALE})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {renderTemplate(template.id, template.sampleProps)}
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-6">
                  <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag label="Built-in" tone="accent" />
                        <Tag label={`${template.imageSlotCount} image slots`} />
                        <Tag label={template.features.overlay ? "Overlay" : "Editorial"} />
                        {getBuiltInTemplateCategories(template)
                          .slice(0, 2)
                          .map((category) => (
                            <Tag key={category} label={category.replace(/[-_]/g, " ")} />
                          ))}
                      </div>

                    <div>
                      <h2 className="text-3xl font-black tracking-[-0.04em]">{template.name}</h2>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                        {template.id}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailCard label="Text fields" value={template.textFields.join(", ")} />
                      <DetailCard
                        label="Status"
                        value={template.locked ? "Locked production template" : "Draft"}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={template.previewPath ?? `/preview/${template.id}`}
                      className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Open preview
                    </Link>
                    <Link
                      href={`/render/${template.id}`}
                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                    >
                      Render route
                    </Link>
                    <Link
                      href="/dashboard/jobs"
                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                    >
                      Use in jobs
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </LibrarySection>

      <LibrarySection
        title="My Finalized Custom Templates"
        description="Only finalized and locked runtime-template versions appear here and in the production plan picker."
      >
        {finalizedCustomTemplates.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-sm text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
            No finalized custom templates yet. Finalize a draft from the template manager first.
          </div>
        ) : (
          <div className="grid gap-6 2xl:grid-cols-2">
            {finalizedCustomTemplates.map((template) => (
              <article
                key={template.selectionKey}
                className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]"
              >
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-[26px] bg-[var(--dashboard-panel-alt)] p-4">
                    <div
                      className="overflow-hidden rounded-[22px] bg-white shadow-[var(--dashboard-shadow-sm)]"
                      style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT }}
                    >
                      <div
                        style={{
                          width: 1080,
                          height: 1920,
                          transform: `scale(${THUMBNAIL_SCALE})`,
                          transformOrigin: "top left",
                        }}
                      >
                        {template.runtimeSchemaJson
                          ? renderRuntimeTemplate(template.runtimeSchemaJson, template.sampleProps)
                          : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag label="Custom" tone="accent" />
                        <Tag label="Finalized" />
                        <Tag label={`v${template.versionNumber ?? 1}`} />
                        <Tag label={`${template.imageSlotCount} image slots`} />
                        {template.templateCategories.slice(0, 2).map((category) => (
                          <Tag key={category} label={category.replace(/[-_]/g, " ")} />
                        ))}
                      </div>

                      <div>
                        <h2 className="text-3xl font-black tracking-[-0.04em]">{template.name}</h2>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                          {template.slug || template.templateId}
                        </p>
                      </div>

                      <p className="text-sm leading-7 text-[var(--dashboard-subtle)]">
                        {template.description || "Runtime-schema custom template."}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailCard label="Bindings" value={template.supportedBindings.join(", ")} />
                        <DetailCard
                          label="Preset families"
                          value={template.allowedPresetCategories.length > 0 ? template.allowedPresetCategories.join(", ") : "All presets"}
                        />
                        <DetailCard
                          label="Image policy"
                          value={`${template.imagePolicyMode} | min ${template.minImageSlotsRequired}`}
                        />
                        <DetailCard
                          label="Copy hints"
                          value={[
                            template.copyHints.headlineStyle,
                            template.copyHints.preferredMaxLines
                              ? `${template.copyHints.preferredMaxLines} lines`
                              : null,
                            template.copyHints.preferredWordCount
                              ? `${template.copyHints.preferredWordCount} words`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" | ") || "Default runtime hints"}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={template.previewPath}
                        className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Preview runtime
                      </Link>
                      <Link
                        href={template.renderPath}
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                      >
                        Render route
                      </Link>
                      <Link
                        href="/dashboard/jobs"
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                      >
                        Use in jobs
                      </Link>
                      <Link
                        href="/dashboard/templates"
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                      >
                        Manage lifecycle
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </LibrarySection>
    </div>
  );
}

function LibrarySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function LibraryMetric(input: {
  label: string;
  value: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{input.label}</p>
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

function Tag({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
        tone === "accent"
          ? "bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
          : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </span>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[var(--dashboard-panel-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">{value}</p>
    </div>
  );
}
