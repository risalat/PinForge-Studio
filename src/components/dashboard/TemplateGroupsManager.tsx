import Link from "next/link";
import {
  assignTemplatesToGroupAction,
  createTemplateGroupAction,
  deleteTemplateGroupAction,
  removeTemplatesFromGroupAction,
  updateTemplateGroupAction,
} from "@/app/dashboard/templates/actions";
import { TemplateGroupingSummary } from "@/components/dashboard/TemplateGroupingSummary";
import {
  getTemplateGroupDetailsForUser,
  listAssignableTemplatesForUser,
  listTemplateGroupsForUser,
} from "@/lib/template-groups/db";

type TemplateSourceFilter = "all" | "builtin" | "custom";

type TemplateGroupList = Awaited<ReturnType<typeof listTemplateGroupsForUser>>;
type TemplateGroupDetail = Awaited<ReturnType<typeof getTemplateGroupDetailsForUser>>;
type AssignableTemplateList = Awaited<ReturnType<typeof listAssignableTemplatesForUser>>;

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
}) {
  const selectedGroupId = selectedGroup?.id ?? "";
  const assignedTemplates = selectedGroup?.templates ?? [];
  const assignedTemplateIds = new Set(assignedTemplates.map((template) => template.templateId));
  const archivedAssignedCount = assignedTemplates.filter(
    (template) => template.sourceKind === "CUSTOM" && template.lifecycleStatus === "ARCHIVED",
  ).length;
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

    const searchNeedle = templateSearch.trim().toLowerCase();
    if (!searchNeedle) {
      return true;
    }

    return [
      template.name,
      template.slug ?? "",
      template.description ?? "",
      ...template.systemCategories,
    ].some((value) => value.toLowerCase().includes(searchNeedle));
  });

  const selectedBuiltInCount = assignedTemplates.filter((template) => template.sourceKind === "BUILTIN").length;
  const selectedCustomCount = assignedTemplates.filter((template) => template.sourceKind === "CUSTOM").length;

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Template groups" value={String(totalGroupCount)} />
        <MetricCard label="Total assignments" value={String(totalAssignmentCount)} />
        <MetricCard label="Built-in in group" value={String(selectedBuiltInCount)} />
        <MetricCard label="Custom in group" value={String(selectedCustomCount)} />
      </section>

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold">Manage template groups</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">
            My groups are user-managed. System tags are inferred automatically from template structure. This view keeps those two concepts separate.
          </p>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
            Group names must be unique for your account.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <h3 className="text-lg font-bold">Template groups</h3>
            <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
              Search existing template groups or create a new one.
            </p>

            <form method="GET" className="mt-4 space-y-3">
              <input type="hidden" name="view" value="groups" />
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Search groups
                <input
                  type="text"
                  name="groupSearch"
                  defaultValue={groupSearch}
                  placeholder="Search by name"
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                />
              </label>
              <button
                type="submit"
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Apply
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {groups.length > 0 ? (
                groups.map((group) => {
                  const isActive = group.id === selectedGroupId;

                  return (
                    <Link
                      key={group.id}
                      href={buildGroupsHref({
                        groupId: group.id,
                        groupSearch,
                        templateSearch,
                        sourceFilter,
                      })}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        isActive
                          ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-text)]"
                      }`}
                    >
                      <span className="min-w-0 truncate">{group.name}</span>
                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
                        {group._count.assignments}
                      </span>
                    </Link>
                  );
                })
              ) : groupSearch.trim() ? (
                <EmptyState
                  title="No template groups match this search"
                  description="Try a different search term or create a new template group."
                />
              ) : (
                <EmptyState
                  title="No template groups yet"
                  description="Create your first template group to organize built-in templates and your own custom templates."
                />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <h3 className="text-lg font-bold">Create group</h3>
            <form action={createTemplateGroupAction} className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Name
                <input
                  type="text"
                  name="name"
                  required
                placeholder="Seasonal favorites"
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
              />
            </label>
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Description
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Optional note for this group"
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                />
              </label>
              <button
                type="submit"
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
              >
                Create template group
              </button>
            </form>
          </div>
        </aside>

        <div className="space-y-4">
          {selectionMessage ? (
            <div className="rounded-[24px] border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
              {selectionMessage}
            </div>
          ) : null}
          {selectedGroup ? (
            <>
              <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{selectedGroup.name}</h3>
                    <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                      {selectedGroup.description || "No description yet."}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                    {selectedGroup._count.assignments} templates
                  </span>
                </div>

                <form action={updateTemplateGroupAction} className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                  <input type="hidden" name="groupId" value={selectedGroup.id} />
                  <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                    Group name
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={selectedGroup.name}
                      className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                    Description
                    <input
                      type="text"
                      name="description"
                      defaultValue={selectedGroup.description ?? ""}
                      placeholder="Optional description"
                      className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                  >
                    Save template group
                  </button>
                </form>

                <form action={deleteTemplateGroupAction} className="mt-3">
                  <input type="hidden" name="groupId" value={selectedGroup.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)]"
                  >
                    Delete template group
                  </button>
                </form>
              </div>

              <div className="grid gap-4 2xl:grid-cols-2">
                <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">Assigned templates</h3>
                      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                        Templates already in this group. Archived custom templates stay visible here.
                      </p>
                    </div>
                  </div>

                  {archivedAssignedCount > 0 ? (
                    <div className="mt-4 rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
                      {archivedAssignedCount === 1
                        ? "1 archived custom template is still assigned to this group. It stays visible here for cleanup, but it will not appear in the add picker."
                        : `${archivedAssignedCount} archived custom templates are still assigned to this group. They stay visible here for cleanup, but they do not appear in the add picker.`}
                    </div>
                  ) : null}

                  {assignedTemplates.length > 0 ? (
                    <form action={removeTemplatesFromGroupAction} className="mt-4 space-y-4">
                      <input type="hidden" name="groupId" value={selectedGroup.id} />
                      <div className="space-y-3">
                        {assignedTemplates.map((template) => (
                          <label
                            key={template.selectionKey}
                            className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                          >
                            <input
                              type="checkbox"
                              name="templateId"
                              value={template.templateId}
                              className="mt-1 h-4 w-4 rounded border-[var(--dashboard-line)]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[var(--dashboard-text)]">{template.name}</p>
                                <Badge label={template.sourceKind === "BUILTIN" ? "Built-in" : "Custom"} />
                                <Badge label={template.lifecycleStatus} />
                                {template.sourceKind === "CUSTOM" && template.lifecycleStatus === "ARCHIVED" ? (
                                  <Badge label="Archived custom" tone="warning" />
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                                {template.description || "No description yet."}
                              </p>
                              <TemplateGroupingSummary
                                systemCategories={template.systemCategories}
                                userGroups={template.userGroups}
                              />
                              <div className="mt-3 flex flex-wrap gap-2">
                                {template.previewPath ? (
                                  <Link
                                    href={template.previewPath}
                                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-subtle)]"
                                  >
                                    Preview
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)]"
                      >
                        Remove selected
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4">
                      <EmptyState
                        title="This template group is empty"
                        description="Use the add templates panel to place built-in templates or custom templates into this group."
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">Add templates</h3>
                      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                        Search templates and add selected items to this group. Archived custom templates are hidden here unless already assigned.
                      </p>
                    </div>
                  </div>

                  <form method="GET" className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_auto] xl:items-end">
                    <input type="hidden" name="view" value="groups" />
                    <input type="hidden" name="group" value={selectedGroup.id} />
                    <input type="hidden" name="groupSearch" value={groupSearch} />
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Search templates
                      <input
                        type="text"
                        name="templateSearch"
                        defaultValue={templateSearch}
                        placeholder="Search by name or tag"
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Source
                      <select
                        name="source"
                        defaultValue={sourceFilter}
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)]"
                      >
                        <option value="all">All</option>
                        <option value="builtin">Built-in</option>
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                    >
                      Apply
                    </button>
                  </form>

                  {filteredAvailableTemplates.length > 0 ? (
                    <form action={assignTemplatesToGroupAction} className="mt-4 space-y-4">
                      <input type="hidden" name="groupId" value={selectedGroup.id} />
                      <div className="space-y-3">
                        {filteredAvailableTemplates.map((template) => (
                          <label
                            key={template.selectionKey}
                            className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
                          >
                            <input
                              type="checkbox"
                              name="templateId"
                              value={template.templateId}
                              className="mt-1 h-4 w-4 rounded border-[var(--dashboard-line)]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-[var(--dashboard-text)]">{template.name}</p>
                                <Badge label={template.sourceKind === "BUILTIN" ? "Built-in" : "Custom"} />
                                <Badge label={template.lifecycleStatus} />
                              </div>
                              <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                                {template.description || "No description yet."}
                              </p>
                              <TemplateGroupingSummary
                                systemCategories={template.systemCategories}
                                userGroups={template.userGroups}
                              />
                              <div className="mt-3 flex flex-wrap gap-2">
                                {template.previewPath ? (
                                  <Link
                                    href={template.previewPath}
                                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-subtle)]"
                                  >
                                    Preview
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
                      >
                        Add selected
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4">
                      <EmptyState
                        title={templateSearch.trim() || sourceFilter !== "all" ? "No templates match these filters" : "No templates available to add"}
                        description={
                          templateSearch.trim() || sourceFilter !== "all"
                            ? "Try a different search, widen the source filter, or remove archived-only expectations from this picker."
                            : "Everything eligible is already assigned to this group. Archived custom templates remain hidden here unless they are already assigned."
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : totalGroupCount > 0 ? (
            <EmptyState
              title={groupSearch.trim() ? "No template groups match this search" : "Select a template group"}
              description={
                groupSearch.trim()
                  ? "Adjust the search in the left pane to load a template group."
                  : "Choose a template group from the list to edit its details and manage assignments."
              }
            />
          ) : (
            <EmptyState
              title="Create your first template group"
              description="Use the create form to start organizing templates into My groups."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black">{value}</p>
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
