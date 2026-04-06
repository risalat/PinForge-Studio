import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";

const inboxStatuses = new Set(["RECEIVED", "REVIEWING", "READY_FOR_GENERATION", "FAILED"]);

export default async function DashboardInboxPage() {
  const databaseReady = isDatabaseConfigured();
  const user = databaseReady ? await getOrCreateDashboardUser() : null;
  const [allJobs, settings] = user
    ? await Promise.all([
        listJobsForUser(user.id),
        getIntegrationSettingsSummary(),
      ])
    : [[], null];
  const activeWorkspaceId = await getDashboardWorkspaceScope(settings?.publerWorkspaceId || "");
  const allowedDomains = user
    ? await getWorkspaceAllowedDomainsForUserId(user.id, activeWorkspaceId)
    : [];
  const jobs = filterByAllowedDomains(allJobs, (job) => job.domainSnapshot, allowedDomains);
  const inboxJobs = jobs.filter((job) => inboxStatuses.has(job.status));
  const cycleMetaByJobId = buildCycleMetaByJobId(jobs);

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : (
        <>
          <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
              <SummaryChip
                label="New"
                value={inboxJobs.filter((job) => job.status === "RECEIVED").length}
              />
              <SummaryChip
                label="Reviewing"
                value={inboxJobs.filter((job) => job.status === "REVIEWING").length}
              />
              <SummaryChip
                label="Ready"
                value={inboxJobs.filter((job) => job.status === "READY_FOR_GENERATION").length}
              />
              <SummaryChip
                label="Attention"
                value={inboxJobs.filter((job) => job.status === "FAILED").length}
              />
            </div>
          </section>

          <section className="space-y-4">
          {inboxJobs.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
              No intake jobs currently need review.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-4 py-3">
                <h2 className="text-lg font-bold">Inbox queue</h2>
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {inboxJobs.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-fixed">
                  <thead className="bg-[var(--dashboard-panel-strong)]">
                    <tr className="text-left">
                      <InboxHead className="w-[38%]">Post</InboxHead>
                      <InboxHead className="w-[12%]">Domain</InboxHead>
                      <InboxHead className="w-[12%]">Created</InboxHead>
                      <InboxHead className="w-[8%]">Cycle</InboxHead>
                      <InboxHead className="w-[10%]">Images</InboxHead>
                      <InboxHead className="w-[12%]">Status</InboxHead>
                      <InboxHead className="w-[15%]">Actions</InboxHead>
                    </tr>
                  </thead>
                  <tbody>
                    {inboxJobs.map((job, index) => (
                      <tr
                        key={job.id}
                        className={index === inboxJobs.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="line-clamp-2 text-base font-bold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                            >
                              {job.articleTitleSnapshot}
                            </Link>
                            <p className="mt-1 line-clamp-1 break-all text-xs text-[var(--dashboard-subtle)]">
                              {job.postUrlSnapshot}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.domainSnapshot}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <CycleCell meta={cycleMetaByJobId.get(job.id)} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.sourceImages.length}</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusBadge label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="inline-flex rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Review job
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]">
      {label}: {value}
    </span>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "good" | "warning" | "bad";
}) {
  const className =
    tone === "good"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : tone === "bad"
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
      {label}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function toneForStatus(status: string) {
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (status === "READY_FOR_GENERATION") {
    return "good" as const;
  }
  if (status === "RECEIVED" || status === "REVIEWING") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function InboxHead({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

function CycleCell({ meta }: { meta: { index: number; total: number; isLatest: boolean } | undefined }) {
  if (!meta) {
    return <p className="text-sm text-[var(--dashboard-subtle)]">1 / 1</p>;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--dashboard-text)]">
        {meta.index} / {meta.total}
      </p>
      <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">{meta.isLatest ? "Latest" : "Earlier"}</p>
    </div>
  );
}

function buildCycleMetaByJobId(
  jobs: Array<{
    id: string;
    postId: string;
    createdAt: Date;
  }>,
) {
  const grouped = new Map<string, typeof jobs>();

  for (const job of jobs) {
    const existing = grouped.get(job.postId) ?? [];
    existing.push(job);
    grouped.set(job.postId, existing);
  }

  const result = new Map<string, { index: number; total: number; isLatest: boolean }>();

  for (const group of grouped.values()) {
    const ordered = [...group].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    const total = ordered.length;

    ordered.forEach((job, index) => {
      result.set(job.id, {
        index: index + 1,
        total,
        isLatest: index === total - 1,
      });
    });
  }

  return result;
}

