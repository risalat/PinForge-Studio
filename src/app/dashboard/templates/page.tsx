import Link from "next/link";
import type { ReactNode } from "react";
import { TemplateGroupsManager } from "@/components/dashboard/TemplateGroupsManager";
import { TemplatesLifecycleManager } from "@/components/dashboard/TemplatesLifecycleManager";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { listCustomTemplatesForUser } from "@/lib/runtime-templates/db";
import {
  getTemplateGroupDetailsForUser,
  listAssignableTemplatesForUser,
  listTemplateGroupsForUser,
} from "@/lib/template-groups/db";
import { getTemplateLibraryEntries } from "@/lib/templates/library";

type TemplatesView = "templates" | "groups";
type TemplateSourceFilter = "all" | "builtin" | "custom";
type TemplateStatusFilter = "all" | "draft" | "finalized" | "archived";
type TemplateUsageFilter = "all" | "used" | "unused";
type TemplateFamilyFilter = "all" | "family" | "variant" | "standalone";

export default async function DashboardTemplatesPage({
  searchParams,
}: {
    searchParams?: Promise<{
      view?: string;
      group?: string;
      groupSearch?: string;
      templateSearch?: string;
      source?: string;
      notice?: string;
      q?: string;
      status?: string;
      usage?: string;
      family?: string;
    }>;
}) {
  await requireAuthenticatedDashboardUser();

  if (!isDatabaseConfigured()) {
    return (
      <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
        `DATABASE_URL` is not configured yet. Custom template drafts and template groups will appear once the database is connected.
      </div>
    );
  }

  const user = await getOrCreateDashboardUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedView = normalizeTemplatesView(resolvedSearchParams.view);
  const groupSearch = resolvedSearchParams.groupSearch?.trim() ?? "";
  const templateSearch = resolvedSearchParams.templateSearch?.trim() ?? "";
  const sourceFilter = normalizeTemplateSourceFilter(resolvedSearchParams.source);
  const actionNotice = normalizeTemplateGroupsNotice(resolvedSearchParams.notice);
  const templateQuery = resolvedSearchParams.q?.trim() ?? "";
  const statusFilter = normalizeTemplateStatusFilter(resolvedSearchParams.status);
  const usageFilter = normalizeTemplateUsageFilter(resolvedSearchParams.usage);
  const familyFilter = normalizeTemplateFamilyFilter(resolvedSearchParams.family);

  let content: ReactNode = null;

  if (selectedView === "groups") {
    const allGroups = await listTemplateGroupsForUser(user.id);
    const visibleGroups = filterGroups(allGroups, groupSearch);
    const totalAssignmentCount = allGroups.reduce(
      (sum, group) => sum + group._count.assignments,
      0,
    );
    const requestedGroupId = resolvedSearchParams.group?.trim() ?? "";
    const activeGroup = visibleGroups.find((group) => group.id === requestedGroupId) ?? visibleGroups[0] ?? null;
    const selectionMessage = requestedGroupId
      ? visibleGroups.some((group) => group.id === requestedGroupId)
        ? null
        : allGroups.some((group) => group.id === requestedGroupId)
          ? "The selected template group is hidden by the current search. Showing the first matching group instead."
          : allGroups.length > 0
            ? "The selected template group is no longer available. Showing the first available group instead."
            : null
      : null;
    const [selectedGroup, assignableTemplates] = await Promise.all([
      activeGroup
        ? getTemplateGroupDetailsForUser({
            userId: user.id,
            groupId: activeGroup.id,
          })
        : Promise.resolve(null),
      listAssignableTemplatesForUser(user.id),
    ]);

    content = (
      <TemplateGroupsManager
        totalGroupCount={allGroups.length}
        totalAssignmentCount={totalAssignmentCount}
        groups={visibleGroups}
        selectedGroup={selectedGroup}
        assignableTemplates={assignableTemplates}
        groupSearch={groupSearch}
        templateSearch={templateSearch}
        sourceFilter={sourceFilter}
        selectionMessage={selectionMessage}
        actionNotice={actionNotice}
      />
    );
  } else {
    const [templates, builtIns] = await Promise.all([
      listCustomTemplatesForUser(user.id),
      Promise.resolve(getTemplateLibraryEntries()),
    ]);
    const filteredTemplates = filterTemplates(templates, {
      query: templateQuery,
      status: statusFilter,
      usage: usageFilter,
      family: familyFilter,
    });

    content = (
      <TemplatesLifecycleManager
        builtInCount={builtIns.length}
        templates={filteredTemplates}
        totalTemplateCount={templates.length}
        query={templateQuery}
        statusFilter={statusFilter}
        usageFilter={usageFilter}
        familyFilter={familyFilter}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap gap-2">
          <TemplateViewTab
            href="/dashboard/templates"
            label="Templates"
            active={selectedView === "templates"}
          />
          <TemplateViewTab
            href={buildGroupsTabHref({
              groupSearch,
              templateSearch,
              sourceFilter,
            })}
            label="Template groups"
            active={selectedView === "groups"}
          />
        </div>
      </section>

      {content}
    </div>
  );
}

type TemplateGroupsNotice =
  | "group-created"
  | "group-saved"
  | "group-deleted"
  | "templates-added"
  | "templates-removed"
  | "select-template-to-add"
  | "select-template-to-remove";

function TemplateViewTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? "dashboard-accent-action bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </Link>
  );
}

function filterGroups(
  groups: Awaited<ReturnType<typeof listTemplateGroupsForUser>>,
  searchQuery: string,
) {
  const needle = searchQuery.trim().toLowerCase();
  if (!needle) {
    return groups;
  }

  return groups.filter((group) =>
    [group.name, group.slug, group.description ?? ""].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}

function normalizeTemplatesView(value: string | undefined): TemplatesView {
  return value === "groups" ? "groups" : "templates";
}

function normalizeTemplateSourceFilter(value: string | undefined): TemplateSourceFilter {
  if (value === "builtin" || value === "custom") {
    return value;
  }

  return "all";
}

function normalizeTemplateStatusFilter(value: string | undefined): TemplateStatusFilter {
  if (value === "draft" || value === "finalized" || value === "archived") {
    return value;
  }

  return "all";
}

function normalizeTemplateUsageFilter(value: string | undefined): TemplateUsageFilter {
  if (value === "used" || value === "unused") {
    return value;
  }

  return "all";
}

function normalizeTemplateFamilyFilter(value: string | undefined): TemplateFamilyFilter {
  if (value === "family" || value === "variant" || value === "standalone") {
    return value;
  }

  return "all";
}

function filterTemplates(
  templates: Awaited<ReturnType<typeof listCustomTemplatesForUser>>,
  input: {
    query: string;
    status: TemplateStatusFilter;
    usage: TemplateUsageFilter;
    family: TemplateFamilyFilter;
  },
) {
  const needle = input.query.trim().toLowerCase();

  return templates.filter((template) => {
    const matchesQuery =
      !needle ||
      [
        template.name,
        template.slug ?? "",
        template.description ?? "",
        template.variantFamilyTemplate?.name ?? "",
        ...template.userGroups.map((group) => group.name),
      ].some((value) => value.toLowerCase().includes(needle));

    const matchesStatus =
      input.status === "all" ||
      template.lifecycleStatus.toLowerCase() === input.status;

    const used = template._count.generationPlans > 0 || template._count.generatedPins > 0;
    const matchesUsage =
      input.usage === "all" ||
      (input.usage === "used" ? used : !used);

    const matchesFamily =
      input.family === "all" ||
      (input.family === "family"
        ? !template.isVariant && template.variantCount > 0
        : input.family === "variant"
          ? template.isVariant
          : !template.isVariant && template.variantCount === 0);

    return matchesQuery && matchesStatus && matchesUsage && matchesFamily;
  });
}

function buildGroupsTabHref(input: {
  groupSearch: string;
  templateSearch: string;
  sourceFilter: TemplateSourceFilter;
}) {
  const params = new URLSearchParams();
  params.set("view", "groups");

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

function normalizeTemplateGroupsNotice(value: string | undefined): TemplateGroupsNotice | null {
  switch (value) {
    case "group-created":
    case "group-saved":
    case "group-deleted":
    case "templates-added":
    case "templates-removed":
    case "select-template-to-add":
    case "select-template-to-remove":
      return value;
    default:
      return null;
  }
}
