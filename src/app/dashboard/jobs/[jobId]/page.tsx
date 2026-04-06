import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JobReviewManager } from "@/app/dashboard/jobs/[jobId]/JobReviewManager";
import { StartNewCycleButton } from "@/app/dashboard/jobs/[jobId]/StartNewCycleButton";
import { WorkspaceScopeMismatchCard } from "@/components/dashboard/WorkspaceScopeMismatchCard";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { matchesAllowedDomain } from "@/lib/dashboard/domainScope";
import { getDashboardWorkspaceScope } from "@/lib/dashboard/workspaceScope";
import { isDatabaseConfigured } from "@/lib/env";
import { getJobForUser, listJobCyclesForPost } from "@/lib/jobs/generatePins";
import { listTemplateGroupsForUser } from "@/lib/template-groups/db";
import {
  getIntegrationSettingsSummary,
  getWorkspaceAllowedDomainsForUserId,
  getWorkspaceProfileForUserId,
} from "@/lib/settings/integrationSettings";
import { resolveStoredAssetUrl } from "@/lib/storage/assetUrl";
import {
  listSelectableTemplateCandidatesForUser,
  type SelectableTemplateCandidate,
} from "@/lib/templates/selectableTemplates";
import { parsePlanRenderContext } from "@/lib/templates/planRenderContext";
import {
  getTemplateVisualPresetCategory,
  getTemplateVisualPresetCategoryMeta,
  SPLIT_VERTICAL_VISUAL_PRESETS,
} from "@/lib/templates/visualPresets";
import { templateVisualPresetCategories, templateVisualPresets } from "@/lib/templates/types";

type PageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function DashboardJobDetailsPage({ params }: PageProps) {
  await requireAuthenticatedDashboardUser();
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
    getIntegrationSettingsSummary().catch(() => null),
  ]);
  if (!job) {
    notFound();
  }

  const activeWorkspaceId = await getDashboardWorkspaceScope(settings?.publerWorkspaceId || "");
  const [allowedDomains, activeWorkspaceProfile] = await Promise.all([
    getWorkspaceAllowedDomainsForUserId(user.id, activeWorkspaceId),
    getWorkspaceProfileForUserId(user.id, activeWorkspaceId),
  ]);
  const cycleJobs = await listJobCyclesForPost(user.id, job.postId);
  const cycleContext = buildCycleContext(cycleJobs, job.id);
  const isInActiveScope = matchesAllowedDomain(job.domainSnapshot, allowedDomains);

  if (!isInActiveScope) {
    return (
      <WorkspaceScopeMismatchCard
        domain={job.domainSnapshot}
        workspaceName={activeWorkspaceProfile?.workspaceName ?? "the selected workspace"}
      />
    );
  }

  const [templates, templateGroups] = await Promise.all([
    listSelectableTemplateCandidatesForUser(user.id).then((items) =>
      items.filter((template): template is SelectableTemplateCandidate => Boolean(template)),
    ),
    listTemplateGroupsForUser(user.id),
  ]);

  const statusLabel = formatLabel(job.status);
  const milestoneCount = job.milestones.length;
  const isFailedCycle = job.status === "FAILED" || job.scheduleRuns[0]?.status === "FAILED";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
                {job.articleTitleSnapshot}
              </h2>
              <p className="mt-2 break-all text-sm text-[var(--dashboard-subtle)]">{job.postUrlSnapshot}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip label={statusLabel} tone={toneForStatus(job.status)} />
              <StatusChip
                label={`${job.generationPlans.length} plans`}
                tone={job.generationPlans.length > 0 ? "good" : "neutral"}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <MetricTile label="Source images" value={String(job.sourceImages.length)} />
            <MetricTile label="Generated pins" value={String(job.generatedPins.length)} />
            <MetricTile label="Keywords" value={String(job.globalKeywords.length)} />
            <MetricTile label="Milestones" value={String(milestoneCount)} />
          </div>
        </section>

        <section className="sticky top-[92px] z-10 rounded-[20px] border border-[var(--dashboard-line)] bg-[color:var(--dashboard-panel)]/95 px-3 py-2.5 shadow-[var(--dashboard-shadow-sm)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <SectionLink href="#review" label="Review" />
              <SectionLink href="#plans" label="Plans" />
              <SectionLink href="#generated-pins" label="Generated pins" />
              <SectionLink href={`/dashboard/jobs/${job.id}/publish`} label="Publish" />
            </div>
            {isFailedCycle ? <StartNewCycleButton jobId={job.id} /> : null}
          </div>
        </section>

        <JobReviewManager
          key={`${job.updatedAt.toISOString()}-${job.generationPlans.length}-${job.generatedPins.length}`}
          jobId={job.id}
          globalKeywords={job.globalKeywords}
          titleStyle={toTitleStyle(job.titleStyle)}
          toneHint={job.toneHint}
          listCountHint={job.listCountHint}
          titleVariationCount={job.titleVariationCount}
          aiCredentials={settings?.aiCredentials ?? []}
          defaultAiCredentialId={settings?.defaultAiCredentialId ?? ""}
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
          templateGroups={templateGroups.map((group) => ({
            id: group.id,
            name: group.name,
            slug: group.slug,
            description: group.description,
            assignedTemplateCount: group._count.assignments,
          }))}
          visualPresetOptions={templateVisualPresets.map((presetId) => ({
            id: presetId,
            label: SPLIT_VERTICAL_VISUAL_PRESETS[presetId].label,
            categoryId: getTemplateVisualPresetCategory(presetId),
            categoryLabel: getTemplateVisualPresetCategoryMeta(getTemplateVisualPresetCategory(presetId)).label,
          }))}
          visualPresetCategories={templateVisualPresetCategories.map((categoryId) => {
            const categoryMeta = getTemplateVisualPresetCategoryMeta(categoryId);
            return {
              id: categoryId,
              label: categoryMeta.label,
              description: categoryMeta.description,
            };
          })}
          plans={job.generationPlans.map((plan) => ({
            ...parsePlanRenderContext(plan.notes),
            id: plan.id,
            mode: plan.mode,
            templateId: plan.templateId,
            templateVersionId: plan.templateVersionId,
            templateName: plan.template.name,
            previewPath:
              plan.templateVersionId
                ? `/dashboard/templates/${plan.templateId}/preview?versionId=${plan.templateVersionId}`
                : `/preview/${plan.templateId}`,
            status: plan.status,
            artworkReviewState: plan.artworkReviewState,
            artworkFlagReason: plan.artworkFlagReason,
            rerenderError: plan.rerenderError,
            generatedPinCount: plan.generatedPins.length,
            assignments: plan.imageAssignments.map((assignment) => ({
              slotIndex: assignment.slotIndex,
              imageUrl: assignment.sourceImage.url,
              imageLabel:
                assignment.sourceImage.alt ||
                assignment.sourceImage.nearestHeading ||
                assignment.sourceImage.caption ||
                "Source image",
            })),
          }))}
          generatedPins={job.generatedPins.map((pin) => {
            const scheduledItem = pin.scheduleRunItems.find((item) => item.status === "SCHEDULED");

            return {
              id: pin.id,
              planId: pin.planId,
              templateId: pin.templateId,
              templateVersionId: pin.templateVersionId,
              templateName: pin.template.name,
              exportPath: resolveStoredAssetUrl({
                storageKey: pin.storageKey,
                exportPath: pin.exportPath,
              }),
              mediaStatus: pin.publerMedia?.status ?? "PENDING",
              title: pin.pinCopy?.title ?? null,
              description: pin.pinCopy?.description ?? null,
              isScheduled: Boolean(scheduledItem),
              scheduledFor: scheduledItem?.scheduledFor ? scheduledItem.scheduledFor.toISOString() : null,
            };
          })}
        />
      </div>

      <aside className="space-y-4 xl:sticky xl:top-[92px] xl:self-start">
        <AsidePanel title="Next action">
          <p className="font-semibold text-[var(--dashboard-text)]">{getNextActionLabel(job.status)}</p>
          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{getNextActionDescription(job.status)}</p>
        </AsidePanel>

        <AsidePanel title="Job summary">
          <div className="grid gap-3 text-sm">
            <SummaryRow label="Domain" value={job.domainSnapshot} />
            <SummaryRow
              label="Keywords"
              value={job.globalKeywords.length > 0 ? job.globalKeywords.join(", ") : "None"}
            />
            <SummaryRow
              label="Style"
              value={job.titleStyle || job.toneHint || "Not set"}
            />
          </div>
        </AsidePanel>

        <AsidePanel title="Job cycle">
          <div className="grid gap-3 text-sm">
            <SummaryRow label="Cycle" value={`${cycleContext.index} of ${cycleContext.total}`} />
            <SummaryRow label="Position" value={cycleContext.isLatest ? "Latest cycle" : "Earlier cycle"} />
            {cycleContext.previousJob ? (
              <Link
                href={`/dashboard/jobs/${cycleContext.previousJob.id}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Open previous cycle
              </Link>
            ) : null}
            {!cycleContext.isLatest && cycleContext.latestJob ? (
              <Link
                href={`/dashboard/jobs/${cycleContext.latestJob.id}`}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Open latest cycle
              </Link>
            ) : null}
          </div>
        </AsidePanel>

        <AsidePanel title="Milestones">
          <div className="space-y-2">
            {job.milestones.length === 0 ? (
              <p className="text-sm text-[var(--dashboard-subtle)]">No milestones yet.</p>
            ) : (
              job.milestones.slice(0, 5).map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                      {formatLabel(milestone.status)}
                    </p>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                      {new Date(milestone.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AsidePanel>
      </aside>
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] transition hover:border-[var(--dashboard-accent)] hover:text-[var(--dashboard-accent-strong)]"
    >
      {label}
    </Link>
  );
}

function AsidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-sm font-bold text-[var(--dashboard-text)]">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "neutral" | "good" | "warning" | "bad" }) {
  const className =
    tone === "good"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : tone === "bad"
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

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
    return "Review images and prepare plans";
  }
  if (status === "READY_FOR_GENERATION") {
    return "Render saved plans";
  }
  if (
    status === "PINS_GENERATED" ||
    status === "MEDIA_UPLOADED" ||
    status === "TITLES_GENERATED" ||
    status === "DESCRIPTIONS_GENERATED" ||
    status === "READY_TO_SCHEDULE"
  ) {
    return "Continue in publishing";
  }
  if (status === "COMPLETED") {
    return "Review scheduled output";
  }
  if (status === "FAILED") {
    return "Retry failed steps";
  }
  return "Continue workflow";
}

function getNextActionDescription(status: string) {
  if (status === "RECEIVED" || status === "REVIEWING") {
    return "Confirm source images, save keywords, and build assisted or manual plans.";
  }
  if (status === "READY_FOR_GENERATION") {
    return "Saved plans are ready. Rendering is still a manual action.";
  }
  if (status === "FAILED") {
    return "The job can be resumed from publishing with per-pin retry controls.";
  }
  return "Every stage remains resumable from this workspace.";
}

function toTitleStyle(value: string | null) {
  if (value === "balanced" || value === "seo" || value === "curiosity" || value === "benefit") {
    return value;
  }

  return null;
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
