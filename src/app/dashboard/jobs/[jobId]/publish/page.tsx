import { notFound } from "next/navigation";
import { JobPublishManager } from "@/app/dashboard/jobs/[jobId]/publish/JobPublishManager";
import { StartNewCycleButton } from "@/app/dashboard/jobs/[jobId]/StartNewCycleButton";
import { WorkspaceScopeMismatchCard } from "@/components/dashboard/WorkspaceScopeMismatchCard";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { matchesAllowedDomain } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { getJobForUser, listJobCyclesForPost } from "@/lib/jobs/generatePins";
import { getPublishScheduleContextForPost } from "@/lib/jobs/publishScheduleContext";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
  getWorkspaceProfileForUserId,
} from "@/lib/settings/integrationSettings";
import { resolveStoredAssetUrl } from "@/lib/storage/assetUrl";

type PageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function DashboardJobPublishPage({ params }: PageProps) {
  const authUser = await requireAuthenticatedDashboardUser();
  const { jobId } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
      </div>
    );
  }

  const user = await getOrCreateDashboardUser();
  const [job, settings] = await Promise.all([
    getJobForUser(jobId, user.id),
    getIntegrationSettingsSummary().catch(() => ({
      publerWorkspaceId: "",
      publerAllowedDomains: [],
      publerAccountId: "",
      publerBoardId: "",
      workspaceProfiles: [],
      aiProvider: "gemini" as const,
      aiModel: "",
      aiCustomEndpoint: "",
      hasPublerApiKey: false,
      hasAiApiKey: false,
      canUsePublerApiKey: false,
      canUseAiApiKey: false,
      publerCredentialState: "missing" as const,
      aiCredentialState: "missing" as const,
      publerCredentialMessage: "",
      aiCredentialMessage: "",
    })),
  ]);

  if (!job) {
    notFound();
  }

  const activeWorkspaceId = await getDashboardWorkspaceScope(settings.publerWorkspaceId);
  const [activeWorkspaceProfile, allowedDomains] = await Promise.all([
    getWorkspaceProfileForUserId(user.id, activeWorkspaceId),
    getWorkspaceAllowedDomainsForUserId(user.id, activeWorkspaceId),
  ]);
  const cycleJobs = await listJobCyclesForPost(user.id, job.postId);
  const cycleContext = buildCycleContext(cycleJobs, job.id);
  const isInActiveScope = matchesAllowedDomain(job.domainSnapshot, allowedDomains);
  const isFailedCycle = job.status === "FAILED" || job.scheduleRuns[0]?.status === "FAILED";

  if (!isInActiveScope) {
    return (
      <WorkspaceScopeMismatchCard
        domain={job.domainSnapshot}
        workspaceName={activeWorkspaceProfile?.workspaceName ?? "the selected workspace"}
      />
    );
  }
  const initialScheduleContext = await getPublishScheduleContextForPost({
    userId: user.id,
    postId: job.postId,
    workspaceId: activeWorkspaceId,
  });

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      <section className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-5 py-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.75rem] font-black tracking-[-0.04em]">{job.articleTitleSnapshot}</h2>
              <ContextBadge label={job.status.replaceAll("_", " ").toLowerCase()} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--dashboard-subtle)]">
              <span>{authUser.email}</span>
              <span className="hidden text-[var(--dashboard-line-strong,#cfd5e3)] xl:inline">•</span>
              <span className="break-all">{job.postUrlSnapshot}</span>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <ContextTile label="Generated pins" value={String(job.generatedPins.length)} />
            <ContextTile
              label="Last run"
              value={job.scheduleRuns[0]?.status.replaceAll("_", " ").toLowerCase() ?? "not started"}
            />
            <ContextTile label="Cycle" value={`${cycleContext.index} / ${cycleContext.total}`} />
            <ContextTile label="Cycle state" value={cycleContext.isLatest ? "latest cycle" : "earlier cycle"} />
          </div>
        </div>
      </section>

      {(cycleContext.previousJob || (!cycleContext.isLatest && cycleContext.latestJob) || isFailedCycle) ? (
        <section className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-5 py-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex flex-wrap gap-3">
            {isFailedCycle ? <StartNewCycleButton jobId={job.id} /> : null}
            {cycleContext.previousJob ? (
              <a
                href={`/dashboard/jobs/${cycleContext.previousJob.id}/publish`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Open previous cycle
              </a>
            ) : null}
            {!cycleContext.isLatest && cycleContext.latestJob ? (
              <a
                href={`/dashboard/jobs/${cycleContext.latestJob.id}/publish`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Open latest cycle
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

        <JobPublishManager
          jobId={job.id}
          workspaceProfiles={settings.workspaceProfiles}
          initialScheduleContext={initialScheduleContext}
          pins={job.generatedPins.map((pin) => ({
            id: pin.id,
            templateId: pin.templateId,
            exportPath: resolveStoredAssetUrl({
              storageKey: pin.storageKey,
              exportPath: pin.exportPath,
            }),
            mediaStatus: pin.publerMedia?.status ?? "PENDING",
            mediaId: pin.publerMedia?.mediaId ?? null,
            mediaError: pin.publerMedia?.errorMessage ?? null,
            title: pin.pinCopy?.title ?? "",
            titleOptions: pin.pinCopy?.titleOptions ?? [],
            description: pin.pinCopy?.description ?? "",
            titleStatus: pin.pinCopy?.titleStatus ?? "EMPTY",
            descriptionStatus: pin.pinCopy?.descriptionStatus ?? "EMPTY",
            scheduleStatus: pin.scheduleRunItems[0]?.status ?? "PENDING",
            scheduledFor: pin.scheduleRunItems[0]?.scheduledFor?.toISOString() ?? null,
            scheduleError: pin.scheduleRunItems[0]?.errorMessage ?? null,
          }))}
          defaults={{
            workspaceId: activeWorkspaceId,
            accountId: activeWorkspaceProfile?.defaultAccountId ?? settings.publerAccountId,
            boardId: activeWorkspaceProfile?.defaultBoardId ?? settings.publerBoardId,
          }}
          integrationReady={{
            hasPublerApiKey: settings.hasPublerApiKey,
            hasAiApiKey: settings.hasAiApiKey,
            canUsePublerApiKey: settings.canUsePublerApiKey,
            canUseAiApiKey: settings.canUseAiApiKey,
            publerCredentialState: settings.publerCredentialState,
            aiCredentialState: settings.aiCredentialState,
            publerCredentialMessage: settings.publerCredentialMessage,
            aiCredentialMessage: settings.aiCredentialMessage,
          }}
          latestScheduleRun={
            job.scheduleRuns[0]
              ? {
                  id: job.scheduleRuns[0].id,
                  status: job.scheduleRuns[0].status,
                  submittedAt: job.scheduleRuns[0].submittedAt?.toISOString() ?? null,
                  completedAt: job.scheduleRuns[0].completedAt?.toISOString() ?? null,
                  errorMessage: job.scheduleRuns[0].errorMessage ?? null,
                }
              : null
          }
        />
    </div>
  );
}

function ContextTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function ContextBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-subtle)]">
      {label}
    </span>
  );
}

function buildCycleContext(
  jobs: Array<{ id: string; createdAt: Date; status: string }>,
  currentJobId: string,
) {
  const ordered = [...jobs].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const currentIndex = Math.max(
    0,
    ordered.findIndex((job) => job.id === currentJobId),
  );

  return {
    index: currentIndex + 1,
    total: ordered.length,
    isLatest: currentIndex === ordered.length - 1,
    previousJob: currentIndex > 0 ? ordered[currentIndex - 1] : null,
    latestJob: ordered.length > 0 ? ordered[ordered.length - 1] : null,
  };
}
