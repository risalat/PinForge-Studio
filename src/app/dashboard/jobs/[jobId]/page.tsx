/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { JobReviewManager } from "@/app/dashboard/jobs/[jobId]/JobReviewManager";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { getJobForUser } from "@/lib/jobs/generatePins";
import { getTemplateLibraryEntries } from "@/lib/templates/library";

type PageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function DashboardJobDetailsPage({ params }: PageProps) {
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
  const job = await getJobForUser(jobId, user.id).catch(() => null);
  if (!job) {
    notFound();
  }

  const templates = getTemplateLibraryEntries().map((template) => ({
    id: template.id,
    name: template.name,
    imageSlotCount: template.imageSlotCount,
    previewPath: template.previewPath ?? `/preview/${template.id}`,
    layoutType: template.features.overlay ? "overlay" : "editorial",
  }));

  return (
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Job details
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {job.articleTitleSnapshot}
            </h1>
            <p className="mt-3 text-sm text-[#6e4a2b]">{authUser.email}</p>
            <p className="mt-2 break-all text-sm text-[#6e4a2b]">{job.postUrlSnapshot}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href="/dashboard/jobs"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Back to jobs
            </Link>
            <Link
              href={`/dashboard/jobs/${job.id}/publish`}
              className="rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0]"
            >
              Open publishing flow
            </Link>
          </div>
        </div>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Status" value={formatLabel(job.status)} />
            <SummaryCard
              label="Keywords"
              value={job.globalKeywords.length > 0 ? String(job.globalKeywords.length) : "0"}
            />
            <SummaryCard label="Source images" value={String(job.sourceImages.length)} />
            <SummaryCard label="Generated pins" value={String(job.generatedPins.length)} />
          </div>

          <div className="rounded-3xl border border-[#eadacc] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">
              Next action
            </p>
            <p className="mt-2 text-lg font-bold text-[#23160d]">{getNextActionLabel(job.status)}</p>
            <p className="mt-2 text-sm text-[#6e4a2b]">{getNextActionDescription(job.status)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip label={formatLabel(job.status)} tone={toneForStatus(job.status)} />
              <StatusChip
                label={`${job.generationPlans.length} saved plans`}
                tone={job.generationPlans.length > 0 ? "good" : "neutral"}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoPanel label="Domain" value={job.domainSnapshot} />
          <InfoPanel
            label="Keywords"
            value={job.globalKeywords.length > 0 ? job.globalKeywords.join(", ") : "None supplied"}
          />
          <InfoPanel
            label="Requested style"
            value={job.titleStyle || job.toneHint || "No style hints saved yet"}
          />
        </section>

        <section className="rounded-3xl border border-[#eadacc] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Milestones</h2>
              <p className="mt-2 text-sm text-[#6e4a2b]">
                Each workflow stage is persisted so the job can be resumed cleanly.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {job.milestones.length === 0 ? (
              <p className="text-sm text-[#6e4a2b]">No milestones recorded yet.</p>
            ) : (
              job.milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-[#eadacc] p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#23160d]">{formatLabel(milestone.status)}</p>
                    <StatusChip label={formatLabel(milestone.status)} tone={toneForStatus(milestone.status)} />
                  </div>
                  <p className="mt-2 text-[#6e4a2b]">{milestone.details || "No details recorded."}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a572a]">
                    {new Date(milestone.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <JobReviewManager
          jobId={job.id}
          images={job.sourceImages.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            caption: image.caption,
            nearestHeading: image.nearestHeading,
            sectionHeadingPath: image.sectionHeadingPath,
            surroundingTextSnippet: image.surroundingTextSnippet,
            isSelected: image.isSelected,
            isPreferred: image.isPreferred,
          }))}
          templates={templates}
          plans={job.generationPlans.map((plan) => ({
            id: plan.id,
            mode: plan.mode,
            templateId: plan.templateId,
            status: plan.status,
            assignments: plan.imageAssignments.map((assignment) => ({
              slotIndex: assignment.slotIndex,
              imageUrl: assignment.sourceImage.url,
            })),
          }))}
        />

        <section className="rounded-3xl border border-[#eadacc] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Generated pins</h2>
              <p className="mt-2 text-sm text-[#6e4a2b]">
                Pins appear here only after the manual generate step.
              </p>
            </div>
            <Link
              href={`/dashboard/jobs/${job.id}/publish`}
              className="rounded-full border border-[#d8b690] px-4 py-2 text-sm font-semibold text-[#8a572a]"
            >
              Continue to publish
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {job.generatedPins.length === 0 ? (
              <p className="text-sm text-[#6e4a2b]">No pins generated yet.</p>
            ) : (
              job.generatedPins.map((pin) => (
                <article key={pin.id} className="rounded-2xl border border-[#eadacc] p-4">
                  <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <img
                      src={pin.exportPath}
                      alt={pin.pinCopy?.title ?? "Generated pin"}
                      className="w-full rounded-xl border border-[#eadacc]"
                    />
                    <div className="space-y-3 text-sm text-[#4f3725]">
                      <div className="flex flex-wrap gap-2">
                        <StatusChip label={pin.templateId} tone="neutral" />
                        <StatusChip
                          label={formatLabel(pin.publerMedia?.status ?? "PENDING")}
                          tone={toneForStatus(pin.publerMedia?.status ?? "PENDING")}
                        />
                      </div>
                      <p>
                        <strong>Title:</strong> {pin.pinCopy?.title ?? "Not generated yet"}
                      </p>
                      <p>
                        <strong>Description:</strong> {pin.pinCopy?.description ?? "Not generated yet"}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
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

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#eadacc] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">{label}</p>
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

function getNextActionLabel(status: string) {
  if (status === "RECEIVED" || status === "REVIEWING") {
    return "Review incoming images and prepare plans";
  }
  if (status === "READY_FOR_GENERATION") {
    return "Render the saved plans into pins";
  }
  if (status === "PINS_GENERATED" || status === "MEDIA_UPLOADED" || status === "TITLES_GENERATED" || status === "DESCRIPTIONS_GENERATED" || status === "READY_TO_SCHEDULE") {
    return "Continue inside the publishing flow";
  }
  if (status === "COMPLETED") {
    return "Review scheduled pins or start another intake";
  }
  if (status === "FAILED") {
    return "Open the publishing flow and retry failed steps";
  }
  return "Continue the workflow";
}

function getNextActionDescription(status: string) {
  if (status === "RECEIVED" || status === "REVIEWING") {
    return "Select source images, mark preferred ones, and choose assisted or manual template plans.";
  }
  if (status === "READY_FOR_GENERATION") {
    return "Saved plans are ready. Generating pins is still a manual action.";
  }
  if (status === "FAILED") {
    return "The job hit a recoverable failure. Per-pin status and retry controls are available in the publish flow.";
  }
  return "Every stage is resumable from this dashboard.";
}
