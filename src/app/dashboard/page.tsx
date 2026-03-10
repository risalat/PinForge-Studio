import { GenerationJobStatus } from "@prisma/client";
import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }

  try {
    const user = await getOrCreateDashboardUser();
    const [postsProcessed, pinsGenerated, readyToSchedule, recentJobs] = await Promise.all([
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
    ]);

    return {
      postsProcessed,
      pinsGenerated,
      readyToSchedule,
      recentJobs,
      databaseReady: true,
    };
  } catch {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      readyToSchedule: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }
}

export default async function DashboardPage() {
  const user = await requireAuthenticatedDashboardUser();
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">
              Intake and publishing overview
            </h1>
            <p className="mt-3 text-sm text-[#6e4a2b]">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href="/dashboard/jobs"
              className="rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0]"
            >
              Open jobs board
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Settings
            </Link>
            <Link
              href="/dashboard/api-keys"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              API keys
            </Link>
            <Link
              href="/library"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Library
            </Link>
          </div>
        </div>

        {!data.databaseReady ? (
          <div className="rounded-[30px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
            `DATABASE_URL` is not configured yet. The dashboard workflow will populate after the
            database is connected and migrated.
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_50px_rgba(60,40,18,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#9c6a38]">
              Posts processed
            </p>
            <p className="mt-4 text-5xl font-black">{data.postsProcessed}</p>
          </div>
          <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_50px_rgba(60,40,18,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#9c6a38]">
              Pins generated
            </p>
            <p className="mt-4 text-5xl font-black">{data.pinsGenerated}</p>
          </div>
          <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_50px_rgba(60,40,18,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#9c6a38]">
              Ready to schedule
            </p>
            <p className="mt-4 text-5xl font-black">{data.readyToSchedule}</p>
          </div>
        </section>

        <section className="rounded-[36px] bg-[#2c1c12] p-6 text-[#f7ede0]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d2ae82]">
                Jobs
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">
                Latest intake jobs
              </h2>
            </div>
            <Link
              href="/dashboard/jobs"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0]"
            >
              View all jobs
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] bg-white text-[#27180e]">
            <table className="min-w-full divide-y divide-[#eadccf]">
              <thead className="bg-[#f7efe6] text-left text-sm uppercase tracking-[0.22em] text-[#8a572a]">
                <tr>
                  <th className="px-5 py-4">Article</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Images</th>
                  <th className="px-5 py-4">Pins</th>
                  <th className="px-5 py-4">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e6da]">
                {data.recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-sm text-[#6e4a2b]" colSpan={5}>
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
                        <p className="text-sm text-[#6e4a2b]">{job.postUrlSnapshot}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{job.status}</td>
                      <td className="px-5 py-4">{job.sourceImages.length}</td>
                      <td className="px-5 py-4">{job.generatedPins.length}</td>
                      <td className="px-5 py-4">
                        {job.scheduleRuns[0]?.status ?? "Not started"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
