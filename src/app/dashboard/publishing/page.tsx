import { PublishingBoard } from "@/app/dashboard/publishing/PublishingBoard";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { filterByAllowedDomains } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
} from "@/lib/settings/integrationSettings";

export default async function DashboardPublishingPage() {
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

  const readyToPublish = jobs.filter((job) =>
    ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "READY_TO_SCHEDULE"].includes(job.status),
  );
  const scheduled = jobs.filter((job) => job.scheduleRuns[0]?.status === "COMPLETED");
  const failed = jobs.filter(
    (job) => job.status === "FAILED" || job.scheduleRuns[0]?.status === "FAILED",
  );

  return (
    <div className="space-y-6 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-3">
        <PublishingMetric label="Ready" value={String(readyToPublish.length)} />
        <PublishingMetric label="Scheduled" value={String(scheduled.length)} />
        <PublishingMetric label="Failed" value={String(failed.length)} />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Publishing summaries will appear once the database is connected.
        </div>
      ) : (
        <PublishingBoard
          jobs={[
            ...readyToPublish.map((job) => ({
              id: job.id,
              title: job.articleTitleSnapshot,
              domain: job.domainSnapshot,
              createdAt: job.createdAt.toISOString(),
              lane: "ready" as const,
              status: job.status,
              href: `/dashboard/jobs/${job.id}/publish`,
              generatedPins: job.generatedPins.length,
            })),
            ...scheduled.map((job) => ({
              id: job.id,
              title: job.articleTitleSnapshot,
              domain: job.domainSnapshot,
              createdAt: job.createdAt.toISOString(),
              lane: "scheduled" as const,
              status: job.scheduleRuns[0]?.status ?? "COMPLETED",
              href: `/dashboard/jobs/${job.id}/publish`,
              generatedPins: job.generatedPins.length,
            })),
            ...failed.map((job) => ({
              id: job.id,
              title: job.articleTitleSnapshot,
              domain: job.domainSnapshot,
              createdAt: job.createdAt.toISOString(),
              lane: "failed" as const,
              status: job.scheduleRuns[0]?.status ?? job.status,
              href: `/dashboard/jobs/${job.id}/publish`,
              generatedPins: job.generatedPins.length,
            })),
          ]}
        />
      )}
    </div>
  );
}

function PublishingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}
