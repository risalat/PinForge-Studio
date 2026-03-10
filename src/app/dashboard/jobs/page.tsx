import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { listJobsForUser } from "@/lib/jobs/generatePins";

export default async function DashboardJobsPage() {
  const authUser = await requireAuthenticatedDashboardUser();
  const databaseReady = isDatabaseConfigured();
  const jobs = databaseReady ? await listJobsForUser((await getOrCreateDashboardUser()).id) : [];

  const totals = {
    total: jobs.length,
    review: jobs.filter((job) =>
      ["RECEIVED", "REVIEWING", "READY_FOR_GENERATION"].includes(job.status),
    ).length,
    generated: jobs.filter((job) =>
      ["PINS_GENERATED", "MEDIA_UPLOADED", "TITLES_GENERATED", "READY_TO_SCHEDULE", "COMPLETED", "FAILED"].includes(
        job.status,
      ),
    ).length,
    scheduled: jobs.filter((job) => job.scheduleRuns[0]?.status === "COMPLETED").length,
  };

  return (
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">
              Jobs board
            </h1>
            <p className="mt-3 text-sm text-[#6e4a2b]">{authUser.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href="/dashboard"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {!databaseReady ? (
          <div className="rounded-[28px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
            `DATABASE_URL` is not configured yet. Jobs will appear after the database is connected
            and migrated.
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <SummaryCard label="Total jobs" value={String(totals.total)} />
              <SummaryCard label="In review" value={String(totals.review)} />
              <SummaryCard label="Pins generated" value={String(totals.generated)} />
              <SummaryCard label="Scheduled runs" value={String(totals.scheduled)} />
            </section>

            <section className="space-y-4">
              {jobs.length === 0 ? (
                <div className="rounded-[28px] border border-[#eadacc] bg-white p-6 text-sm text-[#6e4a2b]">
                  No intake jobs yet.
                </div>
              ) : (
                jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-[28px] border border-[#eadacc] bg-white p-5 shadow-[0_16px_40px_rgba(67,42,21,0.04)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="text-xl font-bold text-[#23160d] underline decoration-[#d8b690] underline-offset-4"
                        >
                          {job.articleTitleSnapshot}
                        </Link>
                        <p className="mt-2 break-all text-sm text-[#6e4a2b]">{job.postUrlSnapshot}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a572a]">
                          Created {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusChip label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
                        <StatusChip
                          label={formatLabel(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                          tone={toneForStatus(job.scheduleRuns[0]?.status ?? "NOT_STARTED")}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <InfoTile label="Domain" value={job.domainSnapshot} />
                      <InfoTile label="Source images" value={String(job.sourceImages.length)} />
                      <InfoTile label="Generated pins" value={String(job.generatedPins.length)} />
                      <InfoTile
                        label="Schedule"
                        value={formatLabel(job.scheduleRuns[0]?.status ?? "Not started")}
                      />
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#eadacc] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#23160d]">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fcf7f0] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a572a]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#23160d]">{value}</p>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "neutral" | "good" | "warning" | "bad" }) {
  const className =
    tone === "good"
      ? "border-[#c8dec1] bg-[#f2fbef] text-[#355c2f]"
      : tone === "warning"
        ? "border-[#ead6a5] bg-[#fff9e8] text-[#7f5a12]"
        : tone === "bad"
          ? "border-[#ebc0b0] bg-[#fff4ef] text-[#8f3d24]"
          : "border-[#e0d5c8] bg-[#f8f3ed] text-[#6e4a2b]";

  return (
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
  );
}

function toneForStatus(status: string) {
  if (["COMPLETED", "SCHEDULED", "MEDIA_UPLOADED", "READY_TO_SCHEDULE"].includes(status)) {
    return "good" as const;
  }
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (["REVIEWING", "READY_FOR_GENERATION", "PINS_GENERATED", "TITLES_GENERATED", "DESCRIPTIONS_GENERATED", "SUBMITTING"].includes(status)) {
    return "warning" as const;
  }
  return "neutral" as const;
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
