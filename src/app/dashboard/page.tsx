import { GenerationJobStatus } from "@prisma/client";
import Link from "next/link";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { buildPostPulseSummary, listPostPulseRecordsForUser } from "@/lib/dashboard/postPulse";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }

  try {
    const user = await getOrCreateDashboardUser();
    const [postsProcessed, pinsGenerated, readyToSchedule, recentJobs, postPulseRecords] = await Promise.all([
      prisma.post.count(),
      prisma.generatedPin.count({
        where: {
          job: {
            userId: user.id,
          },
        },
      }),
      prisma.generationJob.count({
        where: {
          userId: user.id,
          status: GenerationJobStatus.READY_TO_SCHEDULE,
        },
      }),
      listJobsForUser(user.id).then((jobs) => jobs.slice(0, 8)),
      listPostPulseRecordsForUser(user.id),
    ]);

    return {
      postsProcessed,
      pinsGenerated,
      readyToSchedule,
      postsNeedingFreshPins: buildPostPulseSummary(postPulseRecords).needsFreshPins,
      recentJobs,
      databaseReady: true,
    };
  } catch {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      postsNeedingFreshPins: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }
}

export default async function DashboardPage() {
  await requireAuthenticatedDashboardUser();
  const data = await getDashboardData();
  const latestJob = data.recentJobs[0] ?? null;
  const intakeJobs = data.recentJobs.filter((job) =>
    ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
  ).length;

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      {!data.databaseReady ? (
        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. The dashboard workflow will populate after the
          database is connected and migrated.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[36px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--dashboard-muted)]">
            Focus today
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
            Operate intake, generation, and publishing from one full-width workspace.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FocusCard
              href="/dashboard/inbox"
              label="Inbox"
              title="Review new intake"
              detail={`${intakeJobs} recent jobs still need review, planning, or manual generation.`}
            />
            <FocusCard
              href="/dashboard/jobs"
              label="Jobs"
              title="Run active workflows"
              detail={`${data.recentJobs.length} recent jobs are available for review, reruns, and status checks.`}
            />
            <FocusCard
              href="/dashboard/publishing"
              label="Publishing"
              title="Finish uploads and scheduling"
              detail={`${data.readyToSchedule} jobs are already ready to move into media upload or scheduling.`}
            />
          </div>
        </div>

        <div className="rounded-[36px] border border-[var(--dashboard-line)] bg-[linear-gradient(155deg,#0f1b3d_0%,#1249cc_58%,#3cc9ff_100%)] p-6 text-white shadow-[var(--dashboard-shadow-accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
            Continue where you left off
          </p>
          {latestJob ? (
            <>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">{latestJob.articleTitleSnapshot}</h2>
              <p className="mt-3 text-sm leading-7 text-white/82">
                Status: {formatLabel(latestJob.status)}. Open the job to continue review and pin
                generation, or jump straight into publishing if the outputs are ready.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/jobs/${latestJob.id}`}
                  className="rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open job
                </Link>
                <Link
                  href={`/dashboard/jobs/${latestJob.id}/publish`}
                  className="rounded-full border border-white/25 bg-white/6 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open publish flow
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-7 text-white/82">
              New extension submissions will show up here once intake jobs start arriving.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Posts processed" value={data.postsProcessed} />
        <MetricCard label="Pins generated" value={data.pinsGenerated} />
        <MetricCard label="Needs fresh pins" value={data.postsNeedingFreshPins} />
        <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[linear-gradient(145deg,#0d5fff_0%,#1e5eff_50%,#2f8fff_100%)] p-6 text-white shadow-[var(--dashboard-shadow-accent)]">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-white/70">
            Ready to schedule
          </p>
          <p className="mt-4 text-5xl font-black">{data.readyToSchedule}</p>
        </div>
      </section>

      <section className="rounded-[36px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-md)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--dashboard-muted)]">
              Recent jobs
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
              Latest intake and generation activity
            </h2>
          </div>
          <Link
            href="/dashboard/jobs"
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            Open jobs board
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-text)]">
          <table className="min-w-full divide-y divide-[var(--dashboard-line)]">
            <thead className="bg-[var(--dashboard-panel-alt)] text-left text-sm uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">
              <tr>
                <th className="px-5 py-4">Article</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Images</th>
                <th className="px-5 py-4">Pins</th>
                <th className="px-5 py-4">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-line)]">
              {data.recentJobs.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]" colSpan={5}>
                    No intake jobs yet. The extension will create review jobs via `POST /api/generate`.
                  </td>
                </tr>
              ) : (
                data.recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold underline">
                        {job.articleTitleSnapshot}
                      </Link>
                      <p className="text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold">{formatLabel(job.status)}</td>
                    <td className="px-5 py-4">{job.sourceImages.length}</td>
                    <td className="px-5 py-4">{job.generatedPins.length}</td>
                    <td className="px-5 py-4">
                      {formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FocusCard({
  href,
  label,
  title,
  detail,
}: {
  href: string;
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5 transition hover:border-[var(--dashboard-accent)] hover:bg-white"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <h3 className="mt-3 text-lg font-bold text-[var(--dashboard-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">{detail}</p>
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[30px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-4 text-5xl font-black text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
