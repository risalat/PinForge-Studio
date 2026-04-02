import type { TemplateUserGroupSummary } from "@/lib/templates/templateGroupMetadata";

export function TemplateGroupingSummary({
  systemCategories,
  userGroups,
}: {
  systemCategories: string[];
  userGroups: TemplateUserGroupSummary[];
}) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
      <MetadataRow
        label="My groups"
        emptyLabel="Not in any groups"
        items={userGroups.map((group) => group.name)}
      />
      <MetadataRow
        label="System tags"
        emptyLabel="No system tags"
        items={systemCategories}
      />
    </div>
  );
}

function MetadataRow({
  label,
  emptyLabel,
  items,
}: {
  label: string;
  emptyLabel: string;
  items: string[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--dashboard-subtle)]"
            >
              {item.replace(/[-_]/g, " ")}
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--dashboard-subtle)]">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}
