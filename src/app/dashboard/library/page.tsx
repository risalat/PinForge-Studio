import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { listCustomTemplatesForUser } from "@/lib/runtime-templates/db";
import { renderRuntimeTemplate } from "@/lib/runtime-templates/renderRuntimeTemplate";
import { renderTemplate } from "@/lib/templates/registry";
import {
  getBuiltInSelectableTemplateCandidatesForUser,
  listFinalizedCustomTemplateCandidatesForUser,
} from "@/lib/templates/selectableTemplates";

const THUMBNAIL_WIDTH = 296;
const THUMBNAIL_SCALE = THUMBNAIL_WIDTH / 1080;
const THUMBNAIL_HEIGHT = Math.round(1920 * THUMBNAIL_SCALE);

export default async function DashboardLibraryPage() {
  await requireAuthenticatedDashboardUser();
  const user = await getOrCreateDashboardUser();
  const [builtIns, customFinalized, customTemplates] = await Promise.all([
    getBuiltInSelectableTemplateCandidatesForUser(user.id),
    listFinalizedCustomTemplateCandidatesForUser(user.id),
    listCustomTemplatesForUser(user.id),
  ]);
  const finalizedCustomTemplates = customFinalized.filter(
    (template): template is NonNullable<(typeof customFinalized)[number]> => Boolean(template),
  );
  const draftCount = customTemplates.filter((template) => template.lifecycleStatus === "DRAFT").length;
  const archivedCount = customTemplates.filter((template) => template.lifecycleStatus === "ARCHIVED").length;
  const totalSelectableCount = builtIns.length + finalizedCustomTemplates.length;

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <SummaryChip label="Selectable" value={totalSelectableCount} />
          <SummaryChip label="Built-in" value={builtIns.length} />
          <SummaryChip label="Finalized custom" value={finalizedCustomTemplates.length} />
          <SummaryChip label="Drafts" value={draftCount} />
          <SummaryChip label="Archived" value={archivedCount} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href="/dashboard/templates"
              className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
            >
              Open templates
            </Link>
            <Link
              href="/dashboard/jobs"
              className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
            >
              Use in jobs
            </Link>
          </div>
        </div>
      </section>

      <LibrarySection title="Built-in templates" count={builtIns.length}>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {builtIns.map((template) => (
            <TemplateCard
              key={template.id}
              preview={
                <LibraryThumbnail>
                  {renderTemplate(template.id, template.sampleProps)}
                </LibraryThumbnail>
              }
              name={template.name}
              badges={[
                { label: "Built-in", tone: "accent" },
                { label: `${template.imageSlotCount} slots` },
              ]}
              groupInfo={summarizeItems(template.userGroups.map((group) => group.name), "Not in any groups")}
              previewHref={template.previewPath ?? `/preview/${template.id}`}
              renderHref={`/render/${template.id}`}
              manageGroupsHref={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
            />
          ))}
        </div>
      </LibrarySection>

      <LibrarySection title="My finalized custom templates" count={finalizedCustomTemplates.length}>
        {finalizedCustomTemplates.length === 0 ? (
          <EmptyState
            title="No finalized custom templates"
            description="Finalize a custom template from Templates to make it available in the library."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {finalizedCustomTemplates.map((template) => (
              <TemplateCard
                key={template.selectionKey}
                preview={
                  <LibraryThumbnail>
                    {template.runtimeSchemaJson
                      ? renderRuntimeTemplate(template.runtimeSchemaJson, template.sampleProps)
                      : null}
                  </LibraryThumbnail>
                }
                name={template.name}
                badges={[
                  { label: "Custom", tone: "accent" },
                  { label: `v${template.versionNumber ?? 1}` },
                ]}
                groupInfo={summarizeItems(template.userGroups.map((group) => group.name), "Not in any groups")}
                previewHref={template.previewPath}
                renderHref={template.renderPath}
                manageGroupsHref={`/dashboard/templates?view=groups&templateSearch=${encodeURIComponent(template.name)}`}
              />
            ))}
          </div>
        )}
      </LibrarySection>
    </div>
  );
}

function LibrarySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
          {count}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TemplateCard({
  preview,
  name,
  badges,
  groupInfo,
  previewHref,
  renderHref,
  manageGroupsHref,
}: {
  preview: React.ReactNode;
  name: string;
  badges: Array<{ label: string; tone?: "neutral" | "accent" }>;
  groupInfo: string;
  previewHref: string;
  renderHref: string;
  manageGroupsHref: string;
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] shadow-[var(--dashboard-shadow-sm)]">
      <div className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3">
        {preview}
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-bold">{name}</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Tag key={badge.label} label={badge.label} tone={badge.tone} />
            ))}
          </div>
        </div>

        <div className="rounded-[18px] bg-[var(--dashboard-panel-strong)] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
            My groups
          </p>
          <p className="mt-1 text-sm text-[var(--dashboard-text)]">{groupInfo}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={previewHref}
            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
          >
            Preview
          </Link>
          <Link
            href={renderHref}
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            Render
          </Link>
          <Link
            href={manageGroupsHref}
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            Manage groups
          </Link>
        </div>
      </div>
    </article>
  );
}

function LibraryThumbnail({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto overflow-hidden rounded-[18px] bg-white shadow-[var(--dashboard-shadow-sm)]"
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
        {children}
      </div>
    </div>
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

function Tag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
        tone === "accent"
          ? "bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
          : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5">
      <p className="font-semibold text-[var(--dashboard-text)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{description}</p>
    </div>
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
