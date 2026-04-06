import Link from "next/link";
import {
  assignTemplatesToGroupAction,
  createTemplateGroupAction,
  deleteTemplateGroupAction,
  removeTemplatesFromGroupAction,
  updateTemplateGroupAction,
} from "@/app/dashboard/templates/actions";
import {
  getTemplateGroupDetailsForUser,
  listAssignableTemplatesForUser,
  listTemplateGroupsForUser,
} from "@/lib/template-groups/db";

type TemplateSourceFilter = "all" | "builtin" | "custom";
type TemplateGroupsNotice =
  | "group-created"
  | "group-saved"
  | "group-deleted"
  | "templates-added"
  | "templates-removed"
  | "select-template-to-add"
  | "select-template-to-remove";

type TemplateGroupList = Awaited<ReturnType<typeof listTemplateGroupsForUser>>;
type TemplateGroupDetail = Awaited<ReturnType<typeof getTemplateGroupDetailsForUser>>;
type AssignableTemplateList = Awaited<ReturnType<typeof listAssignableTemplatesForUser>>;
type TemplateListItem =
  | NonNullable<TemplateGroupDetail>["templates"][number]
  | AssignableTemplateList[number];

export function TemplateGroupsManager({
  totalGroupCount,
  totalAssignmentCount,
  groups,
  selectedGroup,
  assignableTemplates,
  groupSearch,
  templateSearch,
  sourceFilter,
  selectionMessage,
  actionNotice,
}: {
  totalGroupCount: number;
  totalAssignmentCount: number;
  groups: TemplateGroupList;
  selectedGroup: TemplateGroupDetail;
  assignableTemplates: AssignableTemplateList;
  groupSearch: string;
  templateSearch: string;
  sourceFilter: TemplateSourceFilter;
  selectionMessage?: string | null;
  actionNotice?: TemplateGroupsNotice | null;
}) {
  const selectedGroupId = selectedGroup?.id ?? "";
  const assignedTemplates = selectedGroup?.templates ?? [];
  const assignedTemplateIds = new Set(assignedTemplates.map((template) => template.templateId));
  const archivedAssignedCount = assignedTemplates.filter(
    (template) => template.sourceKind === "CUSTOM" && template.lifecycleStatus === "ARCHIVED",
  ).length;
  const selectedBuiltInCount = assignedTemplates.filter((template) => template.sourceKind === "BUILTIN").length;
  const selectedCustomCount = assignedTemplates.filter((template) => template.sourceKind === "CUSTOM").length;
  const actionMessage = getActionNoticeMessage(actionNotice);
  const availableSearchNeedle = templateSearch.trim().toLowerCase();
  const filteredAvailableTemplates = assignableTemplates.filter((template) => {
    if (assignedTemplateIds.has(template.templateId)) {
      return false;
    }
    if (template.sourceKind === "CUSTOM" && template.lifecycleStatus === "ARCHIVED") {
      return false;
    }
    if (sourceFilter === "builtin" && template.sourceKind !== "BUILTIN") {
      return false;
    }
    if (sourceFilter === "custom" && template.sourceKind !== "CUSTOM") {
      return false;
    }
    if (!availableSearchNeedle) {
      return true;
    }
    return [
      template.name,
      template.slug ?? "",
      template.description ?? "",
      ...template.systemCategories,
      ...template.userGroups.map((group) => group.name),
    ].some((value) => value.toLowerCase().includes(availableSearchNeedle));
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] text-[var(--dashboard-text)]">
      <aside className="space-y-4">
        <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold">Template groups</h2>
            <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              {totalGroupCount}
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-accent-strong)]">
            {totalGroupCount === 1 ? "1 group" : `${totalGroupCount} groups`} ·{" "}
            {totalAssignmentCount === 1 ? "1 assignment" : `${totalAssignmentCount} assignments`}
          </div>

          <form method="GET" className="mt-3 space-y-3">
            <input type="hidden" name="view" value="groups" />
            <input
              type="text"
              name="groupSearch"
              defaultValue={groupSearch}
              placeholder="Search groups"
              className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Search
              </button>
              {groupSearch.trim() ? (
                <Link
                  href="/dashboard/templates?view=groups"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </form>

          <div className="mt-5 space-y-2">
            {groups.length > 0 ? (
              groups.map((group) => {
                const isActive = group.id === selectedGroupId;
                const assignmentCount = group._count.assignments;

                return (
                  <Link
                    key={group.id}
                    href={buildGroupsHref({
                      groupId: group.id,
                      groupSearch,
                      templateSearch,
                      sourceFilter,
                    })}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-text)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{group.name}</p>
                        <p className="mt-1 text-xs text-current/75">
                          {assignmentCount === 1 ? "1 template" : `${assignmentCount} templates`}
                        </p>
                      </div>
                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
                        {assignmentCount}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : groupSearch.trim() ? (
              <EmptyState
                title="No groups match this search"
                description="Try a different search term or create a new group."
              />
            ) : (
              <EmptyState
                title="No template groups yet"
                description="Create your first group to organize built-in templates and custom templates."
              />
            )}
          </div>

          <details className="mt-4 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]" open={totalGroupCount === 0}>
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--dashboard-text)]">
              New group
            </summary>
            <div className="border-t border-[var(--dashboard-line)] px-4 py-3">
              <form action={createTemplateGroupAction} className="space-y-3">
                <input type="hidden" name="returnGroupSearch" value={groupSearch} />
                <input type="hidden" name="returnTemplateSearch" value={templateSearch} />
                <input type="hidden" name="returnSource" value={sourceFilter} />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Group name"
                  className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-[var(--dashboard-text)]"
                />
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Description"
                  className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-[var(--dashboard-text)]"
                />
                <button
                  type="submit"
                  className="w-full rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                >
                  Create template group
                </button>
              </form>
            </div>
          </details>
        </section>
      </aside>

      <div className="space-y-4">
        {selectionMessage ? <Banner tone="warning">{selectionMessage}</Banner> : null}
        {actionMessage ? <Banner tone={actionMessage.tone}>{actionMessage.text}</Banner> : null}
        {selectedGroup ? (
          <>
            <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black">{selectedGroup.name}</h3>
                  <SummaryPill label="Built-in" value={selectedBuiltInCount} />
                  <SummaryPill label="Custom" value={selectedCustomCount} />
                  {archivedAssignedCount > 0 ? <SummaryPill label="Archived" value={archivedAssignedCount} tone="warning" /> : null}
                </div>
                <span className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {selectedGroup._count.assignments === 1
                    ? "1 template"
                    : `${selectedGroup._count.assignments} templates`}
                </span>
              </div>

              <form action={updateTemplateGroupAction} className="mt-3">
                <input type="hidden" name="groupId" value={selectedGroup.id} />
                <input type="hidden" name="returnGroupId" value={selectedGroup.id} />
                <input type="hidden" name="returnGroupSearch" value={groupSearch} />
                <input type="hidden" name="returnTemplateSearch" value={templateSearch} />
                <input type="hidden" name="returnSource" value={sourceFilter} />
                <div className="grid gap-3 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_auto] xl:items-end">
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedGroup.name}
                    className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                  />
                  <input
                    type="text"
                    name="description"
                    defaultValue={selectedGroup.description ?? ""}
                    placeholder="Description"
                    className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                  />
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="submit"
                      className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                    >
                      Save
                    </button>
                    <button
                      type="submit"
                      form="delete-template-group-form"
                      className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </form>

              <form id="delete-template-group-form" action={deleteTemplateGroupAction} className="hidden">
                <input type="hidden" name="groupId" value={selectedGroup.id} />
                <input type="hidden" name="returnGroupSearch" value={groupSearch} />
                <input type="hidden" name="returnTemplateSearch" value={templateSearch} />
                <input type="hidden" name="returnSource" value={sourceFilter} />
              </form>
            </section>

            <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
                <h3 className="text-xl font-bold">Templates in this group</h3>
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {assignedTemplates.length === 1 ? "1 assigned" : `${assignedTemplates.length} assigned`}
                </span>
              </div>

              {archivedAssignedCount > 0 ? (
                <div className="mt-3 rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-2 text-sm text-[var(--dashboard-warning-ink)]">
                  {archivedAssignedCount === 1
                    ? "1 archived custom template is still assigned. It stays here for cleanup but does not appear in the add list."
                    : `${archivedAssignedCount} archived custom templates are still assigned. They stay here for cleanup but do not appear in the add list.`}
                </div>
              ) : null}

              {assignedTemplates.length > 0 ? (
                <form action={removeTemplatesFromGroupAction} className="mt-3 space-y-3">
                  <input type="hidden" name="groupId" value={selectedGroup.id} />
                  <input type="hidden" name="returnGroupId" value={selectedGroup.id} />
                  <input type="hidden" name="returnGroupSearch" value={groupSearch} />
                  <input type="hidden" name="returnTemplateSearch" value={templateSearch} />
                  <input type="hidden" name="returnSource" value={sourceFilter} />
                  <div className="overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
                    <DenseTemplateTableHeader />
                    {assignedTemplates.map((template) => (
                      <TemplateRow key={template.selectionKey} mode="assigned" template={template} />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)]"
                  >
                    Remove selected templates
                  </button>
                </form>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    title="No templates in this group yet"
                    description="Add built-in templates or custom templates from the section below."
                  />
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
                <h3 className="text-xl font-bold">Add templates</h3>
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {filteredAvailableTemplates.length === 1 ? "1 available" : `${filteredAvailableTemplates.length} available`}
                </span>
              </div>

              <form method="GET" className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_auto_auto] xl:items-end">
                <input type="hidden" name="view" value="groups" />
                <input type="hidden" name="group" value={selectedGroup.id} />
                <input type="hidden" name="groupSearch" value={groupSearch} />
                <input
                  type="text"
                  name="templateSearch"
                  defaultValue={templateSearch}
                  placeholder="Search by name, group, or tag"
                  className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                />
                <select
                  name="source"
                  defaultValue={sourceFilter}
                  className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                >
                  <option value="all">All</option>
                  <option value="builtin">Built-in</option>
                  <option value="custom">Custom</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Apply filters
                </button>
                {templateSearch.trim() || sourceFilter !== "all" ? (
                  <Link
                    href={buildGroupsHref({
                      groupId: selectedGroup.id,
                      groupSearch,
                      templateSearch: "",
                      sourceFilter: "all",
                    })}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--dashboard-subtle)]"
                  >
                    Clear
                  </Link>
                ) : null}
              </form>
              {filteredAvailableTemplates.length > 0 ? (
                <form action={assignTemplatesToGroupAction} className="mt-5 space-y-4">
                  <input type="hidden" name="groupId" value={selectedGroup.id} />
                  <input type="hidden" name="returnGroupId" value={selectedGroup.id} />
                  <input type="hidden" name="returnGroupSearch" value={groupSearch} />
                  <input type="hidden" name="returnTemplateSearch" value={templateSearch} />
                  <input type="hidden" name="returnSource" value={sourceFilter} />
                  <div className="overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
                    <DenseTemplateTableHeader />
                    {filteredAvailableTemplates.map((template) => (
                      <TemplateRow key={template.selectionKey} mode="available" template={template} />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                  >
                    Add selected templates
                  </button>
                </form>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title={templateSearch.trim() || sourceFilter !== "all" ? "No templates match these filters" : "No more templates available to add"}
                    description={
                      templateSearch.trim() || sourceFilter !== "all"
                        ? "Try a broader search or widen the source filter."
                        : "Everything eligible is already assigned to this group."
                    }
                  />
                </div>
              )}
            </section>
          </>
        ) : totalGroupCount > 0 ? (
          <section className="rounded-[28px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-8 shadow-[var(--dashboard-shadow-sm)]">
            <h3 className="text-xl font-bold">
              {groupSearch.trim() ? "No matching group selected" : "Select a template group"}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--dashboard-subtle)]">
              {groupSearch.trim()
                ? "Adjust the search in the left sidebar or clear it to choose from your existing groups."
                : "Choose a group from the left sidebar to edit its details and manage assigned templates."}
            </p>
          </section>
        ) : (
          <section className="rounded-[28px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-8 shadow-[var(--dashboard-shadow-sm)]">
            <h3 className="text-xl font-bold">Create your first template group</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--dashboard-subtle)]">
              Use the New group panel in the left sidebar to start organizing templates into My groups.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  mode,
}: {
  template: TemplateListItem;
  mode: "assigned" | "available";
}) {
  const isArchivedCustom = template.sourceKind === "CUSTOM" && template.lifecycleStatus === "ARCHIVED";
  const groupNames = template.userGroups.map((group) => group.name);

  return (
    <label className="block border-t border-[var(--dashboard-line)] px-4 py-3 first:border-t-0">
      <div className="flex items-start gap-3 xl:grid xl:grid-cols-[28px_minmax(0,2.4fr)_120px_120px_minmax(0,1.35fr)_minmax(0,1.2fr)_92px] xl:items-center xl:gap-4">
        <input
          type="checkbox"
          name="templateId"
          value={template.templateId}
          className="mt-1 h-4 w-4 rounded border-[var(--dashboard-line)] xl:mt-0"
        />
        <div className="min-w-0 flex-1 xl:flex-none">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--dashboard-text)]">{template.name}</p>
            {isArchivedCustom ? <Badge label="Archived custom" tone="warning" /> : null}
          </div>
          <p className="mt-1 truncate text-xs text-[var(--dashboard-subtle)]">
            {template.description || "No description"}
          </p>
        </div>
        <div className="mt-2 xl:mt-0">
          <Badge label={template.sourceKind === "BUILTIN" ? "Built-in" : "Custom"} />
        </div>
        <div className="mt-2 xl:mt-0">
          <Badge label={template.lifecycleStatus} />
        </div>
        <div className="mt-3 min-w-0 xl:mt-0">
          <DenseValueText
            label="My groups"
            value={groupNames.length > 0 ? joinLimited(groupNames, 3) : mode === "available" ? "Not in any groups" : "Only in this group"}
          />
        </div>
        <div className="mt-3 min-w-0 xl:mt-0">
          <DenseValueText
            label="System tags"
            value={template.systemCategories.length > 0 ? joinLimited(template.systemCategories, 3) : "None"}
            muted
          />
        </div>
        <div className="mt-3 xl:mt-0 xl:text-right">
          {template.previewPath ? (
            <Link
              href={template.previewPath}
              className="inline-flex rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              Preview
            </Link>
          ) : (
            <span className="text-xs text-[var(--dashboard-subtle)]">No preview</span>
          )}
        </div>
      </div>
    </label>
  );
}

function DenseTemplateTableHeader() {
  return (
    <div className="hidden border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3 xl:grid xl:grid-cols-[28px_minmax(0,2.4fr)_120px_120px_minmax(0,1.35fr)_minmax(0,1.2fr)_92px] xl:items-center xl:gap-4">
      <span />
      <HeaderCell>Template</HeaderCell>
      <HeaderCell>Source</HeaderCell>
      <HeaderCell>Status</HeaderCell>
      <HeaderCell>My groups</HeaderCell>
      <HeaderCell>System tags</HeaderCell>
      <HeaderCell align="right">Preview</HeaderCell>
    </div>
  );
}

function DenseValueText({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)] xl:hidden">
        {label}
      </p>
      <p
        className={`truncate text-sm ${
          muted ? "text-[var(--dashboard-subtle)]" : "text-[var(--dashboard-text)]"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function HeaderCell({
  children,
  align = "left",
}: {
  children: string;
  align?: "left" | "right";
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)] ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </p>
  );
}

function joinLimited(items: string[], limit: number) {
  const visibleItems = items.slice(0, limit).map((item) => item.replace(/[-_]/g, " "));
  const overflowCount = items.length - visibleItems.length;

  if (overflowCount > 0) {
    return `${visibleItems.join(", ")} +${overflowCount}`;
  }

  return visibleItems.join(", ");
}

function SummaryPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
        tone === "warning"
          ? "border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-muted)]"
      }`}
    >
      {label}: {value}
    </span>
  );
}

function Banner({
  children,
  tone,
}: {
  children: string;
  tone: "neutral" | "warning";
}) {
  return (
    <div
      className={`rounded-[24px] px-4 py-3 text-sm ${
        tone === "warning"
          ? "border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {children}
    </div>
  );
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
        tone === "warning"
          ? "bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
          : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label.replace(/[-_]/g, " ")}
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

function buildGroupsHref(input: {
  groupId: string;
  groupSearch: string;
  templateSearch: string;
  sourceFilter: TemplateSourceFilter;
}) {
  const params = new URLSearchParams();
  params.set("view", "groups");
  params.set("group", input.groupId);

  if (input.groupSearch.trim()) {
    params.set("groupSearch", input.groupSearch.trim());
  }

  if (input.templateSearch.trim()) {
    params.set("templateSearch", input.templateSearch.trim());
  }

  if (input.sourceFilter !== "all") {
    params.set("source", input.sourceFilter);
  }

  return `/dashboard/templates?${params.toString()}`;
}

function getActionNoticeMessage(
  notice: TemplateGroupsNotice | null | undefined,
): { tone: "neutral" | "warning"; text: string } | null {
  switch (notice) {
    case "group-created":
      return {
        tone: "neutral",
        text: "Template group created.",
      };
    case "group-saved":
      return {
        tone: "neutral",
        text: "Template group saved.",
      };
    case "group-deleted":
      return {
        tone: "neutral",
        text: "Template group deleted.",
      };
    case "templates-added":
      return {
        tone: "neutral",
        text: "Templates added to this group.",
      };
    case "templates-removed":
      return {
        tone: "neutral",
        text: "Templates removed from this group.",
      };
    case "select-template-to-add":
      return {
        tone: "warning",
        text: "Select at least one template to add.",
      };
    case "select-template-to-remove":
      return {
        tone: "warning",
        text: "Select at least one template to remove.",
      };
    default:
      return null;
  }
}
