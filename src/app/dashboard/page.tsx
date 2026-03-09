import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  if (!isDatabaseConfigured()) {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }

  try {
    const [postsProcessed, pinsGenerated, recentJobs] = await Promise.all([
      prisma.post.count(),
      prisma.generatedPin.count(),
      prisma.generationJob.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        include: {
          post: true,
          generatedPins: true,
        },
      }),
    ]);

    return {
      postsProcessed,
      pinsGenerated,
      recentJobs,
      databaseReady: true,
    };
  } catch {
    return {
      postsProcessed: 0,
      pinsGenerated: 0,
      recentJobs: [],
      databaseReady: false,
    };
  }
}

export default async function DashboardPage() {
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
              Generation overview
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
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
              Content library
            </Link>
            <Link
              href="/preview/split-vertical-title"
              className="rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0]"
            >
              Preview template
            </Link>
          </div>
        </div>

        {!data.databaseReady ? (
          <div className="rounded-[30px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
            `DATABASE_URL` is not configured yet. Preview and render routes work now; dashboard data
            will populate after the first Prisma migration.
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
              Recent jobs
            </p>
            <p className="mt-4 text-5xl font-black">{data.recentJobs.length}</p>
          </div>
        </section>

        <section className="rounded-[36px] bg-[#2c1c12] p-6 text-[#f7ede0]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d2ae82]">
                Jobs
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">
                Recent generation jobs
              </h2>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] bg-white text-[#27180e]">
            <table className="min-w-full divide-y divide-[#eadccf]">
              <thead className="bg-[#f7efe6] text-left text-sm uppercase tracking-[0.22em] text-[#8a572a]">
                <tr>
                  <th className="px-5 py-4">Post</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Templates</th>
                  <th className="px-5 py-4">Outputs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2e6da]">
                {data.recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-sm text-[#6e4a2b]" colSpan={4}>
                      No jobs yet. Use `POST /api/generate` after your database is configured.
                    </td>
                  </tr>
                ) : (
                  data.recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{job.post.title}</p>
                        <p className="text-sm text-[#6e4a2b]">{job.post.url}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{job.status}</td>
                      <td className="px-5 py-4">{job.requestedTemplates.length}</td>
                      <td className="px-5 py-4">{job.generatedPins.length}</td>
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
