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

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-4">
        <InboxMetric
          label="New intake"
          value={String(inboxJobs.filter((job) => job.status === "RECEIVED").length)}
        />
        <InboxMetric
          label="Reviewing"
          value={String(inboxJobs.filter((job) => job.status === "REVIEWING").length)}
        />
        <InboxMetric
          label="Ready to generate"
          value={String(inboxJobs.filter((job) => job.status === "READY_FOR_GENERATION").length)}
        />
        <InboxMetric
          label="Needs attention"
          value={String(inboxJobs.filter((job) => job.status === "FAILED").length)}
        />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : (
        <section className="space-y-4">
          {inboxJobs.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
              No intake jobs currently need review.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full table-fixed">
                  <thead className="bg-[var(--dashboard-panel-alt)]">
                    <tr className="text-left">
                      <InboxHead className="w-[38%]">Post</InboxHead>
                      <InboxHead className="w-[12%]">Domain</InboxHead>
                      <InboxHead className="w-[12%]">Created</InboxHead>
                      <InboxHead className="w-[10%]">Images</InboxHead>
                      <InboxHead className="w-[13%]">Status</InboxHead>
                      <InboxHead className="w-[15%]">Actions</InboxHead>
                    </tr>
                  </thead>
                  <tbody>
                    {inboxJobs.map((job, index) => (
                      <tr
                        key={job.id}
                        className={index === inboxJobs.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                      >
                        <td className="px-5 py-5 align-top">
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="line-clamp-2 text-lg font-bold text-[var(--dashboard-text)] underline decoration-[var(--dashboard-accent)] underline-offset-4"
                            >
                              {job.articleTitleSnapshot}
                            </Link>
                            <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
                          </div>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.domainSnapshot}</p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{job.sourceImages.length}</p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <StatusBadge label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                        </td>
                        <td className="px-5 py-5 align-top">
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
      )}
    </div>
  );
}

function InboxMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
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
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
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
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

