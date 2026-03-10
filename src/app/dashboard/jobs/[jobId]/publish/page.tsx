import Link from "next/link";
import { notFound } from "next/navigation";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { JobPublishManager } from "@/app/dashboard/jobs/[jobId]/publish/JobPublishManager";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { getJobForUser } from "@/lib/jobs/generatePins";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";

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
      <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
          `DATABASE_URL` is not configured yet.
        </div>
      </main>
    );
  }

  const user = await getOrCreateDashboardUser();
  const [job, settings] = await Promise.all([
    getJobForUser(jobId, user.id).catch(() => null),
    getIntegrationSettingsSummary().catch(() => ({
      publerWorkspaceId: "",
      publerAccountId: "",
      publerBoardId: "",
      aiProvider: "gemini" as const,
      aiModel: "",
      aiCustomEndpoint: "",
      hasPublerApiKey: false,
      hasAiApiKey: false,
    })),
  ]);

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Publishing flow
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {job.articleTitleSnapshot}
            </h1>
            <p className="mt-3 text-sm text-[#6e4a2b]">{authUser.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Back to job
            </Link>
          </div>
        </div>

        <JobPublishManager
          jobId={job.id}
          jobStatus={job.status}
          pins={job.generatedPins.map((pin) => ({
            id: pin.id,
            templateId: pin.templateId,
            exportPath: pin.exportPath,
            mediaStatus: pin.publerMedia?.status ?? "PENDING",
            mediaId: pin.publerMedia?.mediaId ?? null,
            mediaError: pin.publerMedia?.errorMessage ?? null,
            title: pin.pinCopy?.title ?? "",
            description: pin.pinCopy?.description ?? "",
            titleStatus: pin.pinCopy?.titleStatus ?? "EMPTY",
            descriptionStatus: pin.pinCopy?.descriptionStatus ?? "EMPTY",
            scheduleStatus: pin.scheduleRunItems[0]?.status ?? "PENDING",
            scheduledFor: pin.scheduleRunItems[0]?.scheduledFor?.toISOString() ?? null,
            scheduleError: pin.scheduleRunItems[0]?.errorMessage ?? null,
          }))}
          defaults={{
            workspaceId: settings.publerWorkspaceId,
            accountId: settings.publerAccountId,
            boardId: settings.publerBoardId,
          }}
          integrationReady={{
            hasPublerApiKey: settings.hasPublerApiKey,
            hasAiApiKey: settings.hasAiApiKey,
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
    </main>
  );
}
