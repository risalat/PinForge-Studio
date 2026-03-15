/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import { useAppFeedback } from "@/components/ui/AppFeedbackProvider";

type SourceImageItem = {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  nearestHeading: string | null;
  sectionHeadingPath: string[];
  surroundingTextSnippet: string | null;
  isSelected: boolean;
  isPreferred: boolean;
};

type TemplateOption = {
  id: string;
  name: string;
  imageSlotCount: number;
  previewPath: string;
  layoutType: string;
};

type VisualPresetOption = {
  id: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
};

type VisualPresetCategoryOption = {
  id: string;
  label: string;
  description: string;
};

type PlanItem = {
  id: string;
  mode: string;
  templateId: string;
  status: string;
  generatedPinCount: number;
  title?: string;
  subtitle?: string;
  itemNumber?: number;
  visualPreset?: string;
  assignments: Array<{
    slotIndex: number;
    imageUrl: string;
    imageLabel: string;
  }>;
};

type GeneratedPinItem = {
  id: string;
  planId: string;
  templateId: string;
  exportPath: string;
  mediaStatus: string;
  title: string | null;
  description: string | null;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
  source?: "review" | "images";
} | null;

type ReviewActionState =
  | { kind: "save_review"; source: "review" | "images" }
  | { kind: "assisted" }
  | { kind: "manual" }
  | { kind: "discard_plans"; scope: "selected" | "single" }
  | { kind: "discard_pins"; scope: "all" | "single" }
  | { kind: "save_overrides"; planId: string }
  | null;

type RenderProgressState = {
  active: boolean;
  completed: number;
  total: number;
  currentLabel: string;
};

type PlanDraft = {
  planId: string;
  title: string;
  subtitle: string;
  itemNumber: string;
  visualPreset: string;
};

type JobReviewManagerProps = {
  jobId: string;
  globalKeywords: string[];
  titleStyle: "balanced" | "seo" | "curiosity" | "benefit" | null;
  toneHint: string | null;
  listCountHint: number | null;
  titleVariationCount: number | null;
  images: SourceImageItem[];
  templates: TemplateOption[];
  visualPresetOptions: VisualPresetOption[];
  visualPresetCategories: VisualPresetCategoryOption[];
  plans: PlanItem[];
  generatedPins: GeneratedPinItem[];
};

export function JobReviewManager({
  jobId,
  globalKeywords,
  titleStyle,
  toneHint,
  listCountHint,
  titleVariationCount,
  images: initialImages,
  templates,
  visualPresetOptions,
  visualPresetCategories,
  plans,
  generatedPins,
}: JobReviewManagerProps) {
  const initialSelectedImages = initialImages.filter((image) => image.isSelected);
  const initialManualTemplate = templates[0] ?? null;
  const router = useRouter();
  const { notify, updateNotification, dismissNotification } = useAppFeedback();
  const [images, setImages] = useState(initialImages);
  const [pinCount, setPinCount] = useState(3);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(templates.map((item) => item.id));
  const [selectedPresetCategoryIds, setSelectedPresetCategoryIds] = useState<string[]>([]);
  const [assistedPresetStrategy, setAssistedPresetStrategy] = useState<
    "recommended" | "random_all" | "random_bold"
  >("recommended");
  const [manualTemplateId, setManualTemplateId] = useState(initialManualTemplate?.id ?? "");
  const [manualAssignedImageIds, setManualAssignedImageIds] = useState<string[]>(
    initialManualTemplate
      ? Array.from({ length: initialManualTemplate.imageSlotCount }).map(
          (_, slotIndex) =>
            initialSelectedImages[slotIndex % Math.max(initialSelectedImages.length, 1)]?.id ?? "",
        )
      : [],
  );
  const [keywordsInput, setKeywordsInput] = useState(globalKeywords.join(", "));
  const [titleStyleValue, setTitleStyleValue] = useState<
    "balanced" | "seo" | "curiosity" | "benefit"
  >(titleStyle ?? "balanced");
  const [toneHintValue, setToneHintValue] = useState(toneHint ?? "");
  const [listCountHintValue, setListCountHintValue] = useState(
    listCountHint ? String(listCountHint) : "",
  );
  const [titleVariationCountValue, setTitleVariationCountValue] = useState(
    titleVariationCount ? String(titleVariationCount) : "3",
  );
  const [planDrafts, setPlanDrafts] = useState<PlanDraft[]>(
    plans.map((plan) => ({
      planId: plan.id,
      title: plan.title ?? "",
      subtitle: plan.subtitle ?? "",
      itemNumber: plan.itemNumber ? String(plan.itemNumber) : "",
      visualPreset: plan.visualPreset ?? "",
    })),
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans.find((plan) => plan.status !== "GENERATED")?.id ?? plans[0]?.id ?? null,
  );
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(
    plans.find((plan) => plan.status !== "GENERATED")?.id
      ? [plans.find((plan) => plan.status !== "GENERATED")!.id]
      : plans[0]?.id
        ? [plans[0].id]
        : [],
  );
  const [, startTransition] = useTransition();
  const [reviewFeedback, setReviewFeedback] = useState<FeedbackState>(null);
  const [plansFeedback, setPlansFeedback] = useState<FeedbackState>(null);
  const [generationFeedback, setGenerationFeedback] = useState<FeedbackState>(null);
  const [previewPinIndex, setPreviewPinIndex] = useState<number | null>(null);
  const [previewSource, setPreviewSource] = useState<{ url: string; label: string } | null>(null);
  const [missingAssetPinIds, setMissingAssetPinIds] = useState<string[]>([]);
  const [renderProgress, setRenderProgress] = useState<RenderProgressState | null>(null);
  const [isRenderingPlans, setIsRenderingPlans] = useState(false);
  const [activeAction, setActiveAction] = useState<ReviewActionState>(null);

  const selectedImages = images.filter((image) => image.isSelected);
  const manualTemplate = templates.find((item) => item.id === manualTemplateId) ?? null;
  const renderablePlans = plans.filter((plan) => ["READY", "DRAFT", "FAILED"].includes(plan.status));
  const alreadyRenderedPlans = plans.filter((plan) => plan.status === "GENERATED");
  const selectedActionPlans = plans.filter((plan) => selectedPlanIds.includes(plan.id));
  const selectedRenderablePlans = selectedActionPlans.filter((plan) =>
    ["READY", "DRAFT", "FAILED"].includes(plan.status),
  );
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;
  const selectedPlanDraft = selectedPlan
    ? planDrafts.find((draft) => draft.planId === selectedPlan.id)
    : undefined;
  const selectedPlanGeneratedPins = selectedPlan
    ? generatedPins.filter((pin) => pin.planId === selectedPlan.id)
    : [];
  const orderedGeneratedPins = selectedPlan
    ? [
        ...selectedPlanGeneratedPins,
        ...generatedPins.filter((pin) => pin.planId !== selectedPlan.id),
      ]
    : generatedPins;
  const previewPin =
    previewPinIndex !== null && previewPinIndex >= 0 && previewPinIndex < generatedPins.length
      ? generatedPins[previewPinIndex]
      : null;

  function markPinAssetMissing(pinId: string) {
    setMissingAssetPinIds((current) =>
      current.includes(pinId) ? current : [...current, pinId],
    );
  }

  function toggleTemplate(templateId: string) {
    setSelectedTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((item) => item !== templateId)
        : [...current, templateId],
    );
  }

  function togglePresetCategory(categoryId: string) {
    setSelectedPresetCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  }

  function updateImage(id: string, patch: Partial<SourceImageItem>) {
    setImages((current) =>
      current.map((image) => (image.id === id ? { ...image, ...patch } : image)),
    );
  }

  function updatePlanDraft(
    planId: string,
    patch: Partial<Pick<PlanDraft, "title" | "subtitle" | "itemNumber" | "visualPreset">>,
  ) {
    setPlanDrafts((current) =>
      current.map((draft) => (draft.planId === planId ? { ...draft, ...patch } : draft)),
    );
  }

  function togglePlanSelection(planId: string) {
    setSelectedPlanIds((current) =>
      current.includes(planId)
        ? current.filter((entry) => entry !== planId)
        : [...current, planId],
    );
  }

  function setPlanSelection(planIds: string[]) {
    setSelectedPlanIds(planIds);
  }

  function seedManualAssignments(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      setManualAssignedImageIds([]);
      return;
    }

    setManualAssignedImageIds((current) =>
      Array.from({ length: template.imageSlotCount }).map(
        (_, slotIndex) =>
          current[slotIndex] ??
          selectedImages[slotIndex % Math.max(selectedImages.length, 1)]?.id ??
          "",
      ),
    );
  }

  async function runAction(url: string, payload: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      generatedPinCount?: number;
      discardedPinCount?: number;
      discardedPlanCount?: number;
    };
    if (!response.ok || !data.ok) {
      throw new Error(data.error ?? "Request failed.");
    }

    return data;
  }

  function handleSaveReview(source: "review" | "images") {
    startTransition(async () => {
      setActiveAction({ kind: "save_review", source });
      try {
        setReviewFeedback(null);
        await runAction(`/api/dashboard/jobs/${jobId}/review`, {
          images: images.map((image) => ({
            id: image.id,
            isSelected: image.isSelected,
            isPreferred: image.isSelected && image.isPreferred,
          })),
          globalKeywords: keywordsInput
            .split(",")
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword !== ""),
          titleStyle: titleStyleValue,
          toneHint: toneHintValue,
          listCountHint: listCountHintValue.trim() === "" ? null : Number(listCountHintValue),
          titleVariationCount:
            titleVariationCountValue.trim() === "" ? null : Number(titleVariationCountValue),
        });
        setReviewFeedback({
          tone: "success",
          message: "Review inputs and image selections saved.",
          source,
        });
        notify({
          tone: "success",
          title: "Review state saved",
          message: "Images, keywords, and generation inputs were updated.",
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : "Unable to save review state.";
        setReviewFeedback({
          tone: "error",
          message,
          source,
        });
        notify({
          tone: "error",
          title: "Review save failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleAssistedPlans() {
    startTransition(async () => {
      setActiveAction({ kind: "assisted" });
      try {
        setPlansFeedback(null);
        await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "assisted_auto",
          pinCount,
          templateIds: selectedTemplateIds,
          presetStrategy: assistedPresetStrategy,
          presetCategoryIds: selectedPresetCategoryIds,
        });
        const message =
          assistedPresetStrategy === "recommended"
            ? "Assisted plans created with image-aware preset recommendation."
            : assistedPresetStrategy === "random_bold"
              ? "Assisted plans created with random bold presets."
              : "Assisted plans created with random presets.";
        setPlansFeedback({
          tone: "success",
          message,
        });
        notify({
          tone: "success",
          title: "Plans created",
          message,
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : "Unable to create assisted plans.";
        setPlansFeedback({
          tone: "error",
          message,
        });
        notify({
          tone: "error",
          title: "Plan creation failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleManualPlan() {
    startTransition(async () => {
      setActiveAction({ kind: "manual" });
      try {
        setPlansFeedback(null);
        await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "manual",
          templateId: manualTemplateId,
          sourceImageIds: manualAssignedImageIds.filter((value) => value !== ""),
        });
        setPlansFeedback({
          tone: "success",
          message: "Manual plan added.",
        });
        notify({
          tone: "success",
          title: "Manual plan added",
          message: "The selected template and image slots were saved to the queue.",
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : "Unable to create manual plan.";
        setPlansFeedback({
          tone: "error",
          message,
        });
        notify({
          tone: "error",
          title: "Manual plan failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  async function handleGeneratePins(targetPlanIds?: string[]) {
    if (isRenderingPlans) {
      return;
    }

    let progressToastId: string | null = null;

    try {
      setGenerationFeedback(null);
      const effectivePlanIds =
        targetPlanIds && targetPlanIds.length > 0
          ? targetPlanIds
          : selectedRenderablePlans.length > 0
            ? selectedRenderablePlans.map((plan) => plan.id)
            : selectedPlan
              ? [selectedPlan.id]
              : [];
      const targetPlans = plans.filter((plan) => effectivePlanIds.includes(plan.id));
      const targetRenderablePlans = targetPlans.filter((plan) =>
        ["READY", "DRAFT", "FAILED"].includes(plan.status),
      );

      if (targetRenderablePlans.length === 0) {
        return;
      }

      setIsRenderingPlans(true);
      setRenderProgress({
        active: true,
        completed: 0,
        total: targetRenderablePlans.length,
        currentLabel: targetRenderablePlans[0]?.templateId ?? "Preparing",
      });
      progressToastId = notify({
        tone: "progress",
        title: `0 of ${targetRenderablePlans.length} pins generated`,
        message: buildRenderProgressMessage({
          completed: 0,
          total: targetRenderablePlans.length,
          currentLabel: targetRenderablePlans[0]?.templateId ?? "Preparing",
        }),
        sticky: true,
      });

      let generatedPinCount = 0;

      for (const [index, plan] of targetRenderablePlans.entries()) {
        setRenderProgress({
          active: true,
          completed: index,
          total: targetRenderablePlans.length,
          currentLabel: plan.templateId,
        });
        updateNotification(progressToastId, {
          tone: "progress",
          title: `${index} of ${targetRenderablePlans.length} pins generated`,
          message: buildRenderProgressMessage({
            completed: index,
            total: targetRenderablePlans.length,
            currentLabel: plan.templateId,
          }),
          sticky: true,
        });

        const result = await runAction(`/api/dashboard/jobs/${jobId}/generate`, {
          planIds: [plan.id],
        });
        generatedPinCount += result.generatedPinCount ?? 0;

        setRenderProgress({
          active: true,
          completed: index + 1,
          total: targetRenderablePlans.length,
          currentLabel:
            index + 1 < targetRenderablePlans.length
              ? targetRenderablePlans[index + 1].templateId
              : "Wrapping up",
        });
      }

      if (progressToastId) {
        dismissNotification(progressToastId);
      }
      const rerenderedCount = targetRenderablePlans.length;
      const alreadyUpToDateCount = Math.max(0, targetPlans.length - rerenderedCount);
      const message =
        alreadyUpToDateCount > 0
          ? `${generatedPinCount || rerenderedCount} pin${(generatedPinCount || rerenderedCount) === 1 ? "" : "s"} rendered. ${alreadyUpToDateCount} plan${alreadyUpToDateCount === 1 ? " was" : "s were"} already up to date.`
          : `${generatedPinCount} pin${generatedPinCount === 1 ? "" : "s"} rendered from the selected plans.`;
      setGenerationFeedback({
        tone: "success",
        message,
      });
      notify({
        tone: "success",
        title: "Rendering complete",
        message,
      });
      setRenderProgress({
        active: false,
        completed: targetRenderablePlans.length,
        total: targetRenderablePlans.length,
        currentLabel: "Complete",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (actionError) {
      if (progressToastId) {
        dismissNotification(progressToastId);
      }
      const message = actionError instanceof Error ? actionError.message : "Unable to generate pins.";
      setGenerationFeedback({
        tone: "error",
        message,
      });
      notify({
        tone: "error",
        title: "Rendering failed",
        message,
        sticky: true,
      });
    } finally {
      setIsRenderingPlans(false);
    }
  }

  function handleDiscardPlans(targetPlanIds?: string[]) {
    const plansToDiscard =
      targetPlanIds && targetPlanIds.length > 0
        ? plans.filter((plan) => targetPlanIds.includes(plan.id))
        : selectedActionPlans;

    if (plansToDiscard.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Discard ${plansToDiscard.length} selected plan${plansToDiscard.length === 1 ? "" : "s"}? This removes the plan assignments and any unscheduled generated outputs tied to those plans.`,
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setActiveAction({
        kind: "discard_plans",
        scope: targetPlanIds && targetPlanIds.length > 0 ? "single" : "selected",
      });
      try {
        setPlansFeedback(null);
        setGenerationFeedback(null);
        const result = await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "discard",
          planIds: plansToDiscard.map((plan) => plan.id),
        });
        const nextSelectedPlan = plans.find(
          (plan) => !plansToDiscard.some((discardedPlan) => discardedPlan.id === plan.id),
        );
        setSelectedPlanId(nextSelectedPlan?.id ?? null);
        setSelectedPlanIds(nextSelectedPlan?.id ? [nextSelectedPlan.id] : []);
        setPlansFeedback({
          tone: "success",
          message: `${result.discardedPlanCount ?? plansToDiscard.length} plan${(result.discardedPlanCount ?? plansToDiscard.length) === 1 ? "" : "s"} discarded.`,
        });
        notify({
          tone: "success",
          title: "Plans discarded",
          message: `${result.discardedPlanCount ?? plansToDiscard.length} plan${(result.discardedPlanCount ?? plansToDiscard.length) === 1 ? "" : "s"} removed from the queue.`,
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : "Unable to discard plans.";
        setPlansFeedback({
          tone: "error",
          message,
        });
        notify({
          tone: "error",
          title: "Discard failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleDiscardGeneratedPins(targetPinIds?: string[]) {
    const targetPins =
      targetPinIds && targetPinIds.length > 0
        ? generatedPins.filter((pin) => targetPinIds.includes(pin.id))
        : generatedPins;

    if (targetPins.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      targetPins.length === generatedPins.length
        ? "Discard all generated pins for this job and reset the plans to ready state? Source images and plan assignments will stay in place."
        : `Discard ${targetPins.length} selected pin${targetPins.length === 1 ? "" : "s"} and reset only those plans for rerendering?`,
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setActiveAction({
        kind: "discard_pins",
        scope: targetPinIds && targetPinIds.length > 0 ? "single" : "all",
      });
      try {
        setGenerationFeedback(null);
        setPreviewPinIndex(null);
        const result = await runAction(`/api/dashboard/jobs/${jobId}/generate`, {
          action: "discard_generated_pins",
          generatedPinIds: targetPinIds,
        });
        const discardedCount = result.discardedPinCount ?? targetPins.length;
        setGenerationFeedback({
          tone: "success",
          message: `${discardedCount} generated pin${discardedCount === 1 ? "" : "s"} discarded. The affected plan${discardedCount === 1 ? " is" : "s are"} ready for rerendering. Clear saved title or subtitle overrides if you want AI to generate new copy again.`,
        });
        notify({
          tone: "success",
          title: "Generated pins discarded",
          message: `${discardedCount} rendered output${discardedCount === 1 ? " was" : "s were"} removed and reset for rerendering.`,
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error
            ? actionError.message
            : "Unable to discard generated pins.";
        setGenerationFeedback({
          tone: "error",
          message,
        });
        notify({
          tone: "error",
          title: "Discard failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleSavePlanSettings(planId: string) {
    const draft = planDrafts.find((entry) => entry.planId === planId);
    if (!draft) {
      return;
    }

    startTransition(async () => {
      setActiveAction({ kind: "save_overrides", planId });
      try {
        setPlansFeedback(null);
        await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "update_render_context",
          planId,
          title: draft.title,
          subtitle: draft.subtitle,
          itemNumber: draft.itemNumber.trim() === "" ? null : Number(draft.itemNumber),
          visualPreset: draft.visualPreset.trim() === "" ? null : draft.visualPreset,
        });
        setPlansFeedback({
          tone: "success",
          message: "Plan render settings saved.",
        });
        notify({
          tone: "success",
          title: "Plan overrides saved",
          message: "Render title, subtitle, numbering, and preset overrides were updated.",
        });
        router.refresh();
      } catch (actionError) {
        const message =
          actionError instanceof Error ? actionError.message : "Unable to save plan settings.";
        setPlansFeedback({
          tone: "error",
          message,
        });
        notify({
          tone: "error",
          title: "Override save failed",
          message,
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section
        id="review"
        className="space-y-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Review inputs</h2>
          </div>
          <button
            type="button"
            onClick={() => handleSaveReview("review")}
            disabled={Boolean(activeAction) || isRenderingPlans}
            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
          >
            <BusyActionLabel
              busy={activeAction?.kind === "save_review" && activeAction.source === "review"}
              label="Save review"
              busyLabel="Saving review..."
              inverse
            />
          </button>
        </div>
        {reviewFeedback?.source === "review" ? <InlineFeedback feedback={reviewFeedback} /> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Keyword variations
            <textarea
              value={keywordsInput}
              onChange={(event) => setKeywordsInput(event.target.value)}
              rows={4}
              placeholder="e.g. earthy bedroom, nature bedroom, cozy bedroom decor"
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
            />
          </label>
          <div className="grid gap-4">
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              Title style
              <select
                value={titleStyleValue}
                onChange={(event) =>
                  setTitleStyleValue(
                    event.target.value as "balanced" | "seo" | "curiosity" | "benefit",
                  )
                }
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
              >
                <option value="balanced">Balanced</option>
                <option value="seo">SEO</option>
                <option value="curiosity">Curiosity</option>
                <option value="benefit">Benefit</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              Tone hint
              <input
                value={toneHintValue}
                onChange={(event) => setToneHintValue(event.target.value)}
                placeholder="e.g. warm editorial"
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                List count hint
                <input
                  type="number"
                  min={1}
                  value={listCountHintValue}
                  onChange={(event) => setListCountHintValue(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Title variations
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={titleVariationCountValue}
                  onChange={(event) => setTitleVariationCountValue(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Image review</h2>
          </div>
          <button
            type="button"
            onClick={() => handleSaveReview("images")}
            disabled={Boolean(activeAction) || isRenderingPlans}
            className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
          >
            <BusyActionLabel
              busy={activeAction?.kind === "save_review" && activeAction.source === "images"}
              label="Save review"
              busyLabel="Saving review..."
              inverse
            />
          </button>
        </div>
        {reviewFeedback?.source === "images" ? <InlineFeedback feedback={reviewFeedback} /> : null}

        <div className="grid gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] p-4 text-sm text-[var(--dashboard-subtle)] md:grid-cols-2">
          <div>
            <p className="font-semibold text-[var(--dashboard-text)]">Use in plans</p>
            <p className="mt-1">
              Enabled images can be used by assisted auto and can also be assigned manually.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--dashboard-text)]">Prefer in assisted auto</p>
            <p className="mt-1">
              This only biases assisted auto toward that image. It does not force it into every generated pin.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {images.map((image) => (
            <article
              key={image.id}
              className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row">
                <img
                  src={image.url}
                  alt={image.alt ?? "Source image"}
                  className="h-48 w-full rounded-lg object-cover lg:w-40"
                />
                <div className="min-w-0 flex-1 space-y-2 text-sm text-[var(--dashboard-subtle)]">
                  <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={image.isSelected}
                        onChange={(event) =>
                          updateImage(image.id, {
                            isSelected: event.target.checked,
                            isPreferred: event.target.checked ? image.isPreferred : false,
                          })
                        }
                      />
                      Use in plans
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={image.isPreferred}
                        disabled={!image.isSelected}
                        onChange={(event) => updateImage(image.id, { isPreferred: event.target.checked })}
                      />
                      Prefer in assisted auto
                    </label>
                  </div>
                  <p className="text-xs text-[var(--dashboard-muted)]">{formatCompactUrl(image.url)}</p>
                  <MetadataRow label="Alt" value={image.alt} />
                  <MetadataRow label="Caption" value={image.caption} />
                  <MetadataRow label="Nearest heading" value={image.nearestHeading} />
                  <MetadataRow
                    label="Section path"
                    value={image.sectionHeadingPath.length > 0 ? image.sectionHeadingPath.join(" / ") : null}
                  />
                  <MetadataRow label="Snippet" value={image.surroundingTextSnippet} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="plans"
        className="space-y-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
      >
        <div>
          <h2 className="text-xl font-bold">Plan setup</h2>
        </div>
        {plansFeedback ? <InlineFeedback feedback={plansFeedback} /> : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-[var(--dashboard-text)]">Assisted auto</p>
                <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                  Studio picks eligible templates and maps selected images automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAssistedPlans}
                disabled={
                  Boolean(activeAction) ||
                  isRenderingPlans ||
                  selectedTemplateIds.length === 0 ||
                  selectedImages.length === 0
                }
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
              >
                <BusyActionLabel
                  busy={activeAction?.kind === "assisted"}
                  label="Create assisted plans"
                  busyLabel="Creating assisted plans..."
                  inverse
                />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[160px_240px_minmax(0,1fr)]">
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Pins to create
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={pinCount}
                  onChange={(event) => setPinCount(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Preset strategy
                <select
                  value={assistedPresetStrategy}
                  onChange={(event) =>
                    setAssistedPresetStrategy(
                      event.target.value as "recommended" | "random_all" | "random_bold",
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                >
                  <option value="recommended">Recommended per pin</option>
                  <option value="random_all">Random from all presets</option>
                  <option value="random_bold">Random bold presets only</option>
                </select>
              </label>
              <div>
                <p className="text-sm font-semibold text-[var(--dashboard-subtle)]">Eligible templates</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {templates.map((template) => {
                    const active = selectedTemplateIds.includes(template.id);
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => toggleTemplate(template.id)}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
                            : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-subtle)]"
                        }`}
                      >
                        {template.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[var(--dashboard-text)]">Preset bundles</p>
                  <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                    Narrow assisted generation to specific color families. Leave all bundles off to use the full preset catalog.
                  </p>
                </div>
                <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {selectedPresetCategoryIds.length === 0 ? "All bundles" : `${selectedPresetCategoryIds.length} selected`}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visualPresetCategories.map((category) => {
                  const active = selectedPresetCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => togglePresetCategory(category.id)}
                      className={`rounded-2xl border px-4 py-4 text-left ${
                        active
                          ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft-strong)] shadow-[0_12px_28px_rgba(30,94,255,0.12)]"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[var(--dashboard-text)]">{category.label}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                            active
                              ? "bg-[var(--dashboard-accent)] text-white"
                              : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-muted)]"
                          }`}
                        >
                          {active ? "On" : "Off"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">
                        {category.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-[var(--dashboard-text)]">Manual plan</p>
                <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                  Pick a template and assign specific images to each slot.
                </p>
              </div>
              <button
                type="button"
                onClick={handleManualPlan}
                disabled={Boolean(activeAction) || isRenderingPlans || !manualTemplate}
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
              >
                <BusyActionLabel
                  busy={activeAction?.kind === "manual"}
                  label="Add manual plan"
                  busyLabel="Adding manual plan..."
                  inverse
                />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Template
                <select
                  value={manualTemplateId}
                  onChange={(event) => {
                    setManualTemplateId(event.target.value);
                    seedManualAssignments(event.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>

              {manualTemplate ? (
                <div className="grid gap-3">
                  {Array.from({ length: manualTemplate.imageSlotCount }).map((_, slotIndex) => (
                    <label
                      key={`${manualTemplate.id}-${slotIndex}`}
                      className="block text-sm font-semibold text-[var(--dashboard-subtle)]"
                    >
                      Slot {slotIndex + 1}
                      <select
                        value={manualAssignedImageIds[slotIndex] ?? ""}
                        onChange={(event) =>
                          setManualAssignedImageIds((current) =>
                            current.map((value, index) =>
                              index === slotIndex ? event.target.value : value,
                            ),
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                      >
                        <option value="">Select source image</option>
                        {selectedImages.map((image) => (
                          <option key={image.id} value={image.id}>
                            {image.alt || image.nearestHeading || image.url}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        id="generated-pins"
        className="space-y-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Render queue</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              <span>{renderablePlans.length} ready</span>
              <span>·</span>
              <span>{selectedActionPlans.length} selected</span>
              <span>·</span>
              <span>{alreadyRenderedPlans.length} rendered</span>
              <span>·</span>
              <span>{generatedPins.length} outputs</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDiscardPlans()}
              disabled={Boolean(activeAction) || isRenderingPlans || selectedActionPlans.length === 0}
              className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)] disabled:opacity-50"
            >
              <BusyActionLabel
                busy={activeAction?.kind === "discard_plans" && activeAction.scope === "selected"}
                label="Discard selected plans"
                busyLabel="Discarding plans..."
              />
            </button>
            <button
              type="button"
              onClick={() => handleDiscardGeneratedPins()}
              disabled={Boolean(activeAction) || isRenderingPlans || generatedPins.length === 0}
              className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)] disabled:opacity-50"
            >
              <BusyActionLabel
                busy={activeAction?.kind === "discard_pins" && activeAction.scope === "all"}
                label="Discard generated pins"
                busyLabel="Discarding pins..."
              />
            </button>
            <button
              type="button"
              onClick={() => handleGeneratePins()}
              disabled={Boolean(activeAction) || isRenderingPlans || selectedRenderablePlans.length === 0}
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
            >
              <BusyActionLabel
                busy={isRenderingPlans}
                label="Generate selected plans"
                busyLabel="Rendering queue..."
                inverse
              />
            </button>
          </div>
        </div>
        {generationFeedback ? <InlineFeedback feedback={generationFeedback} /> : null}

        {plansFeedback ? <InlineFeedback feedback={plansFeedback} /> : null}

        {renderProgress ? (
          <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-accent-border)] bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)] p-5 shadow-[0_18px_40px_rgba(30,94,255,0.12)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
                  Render progress
                </p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--dashboard-text)]">
                  {renderProgress.completed} of {renderProgress.total} pins generated
                </h3>
                <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                  {renderProgress.active
                    ? buildRenderProgressMessage(renderProgress)
                    : "Queue finished. Refreshing the workspace."}
                </p>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--dashboard-accent-strong)] shadow-[0_12px_24px_rgba(30,94,255,0.14)]">
                {Math.max(0, Math.round((renderProgress.completed / Math.max(renderProgress.total, 1)) * 100))}%
              </span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className={`h-full rounded-full bg-[linear-gradient(90deg,#0d5fff_0%,#3fd0ff_100%)] ${
                  renderProgress.active ? "app-toast-progress" : ""
                }`}
                style={{
                  width: `${Math.max(
                    8,
                    Math.round((renderProgress.completed / Math.max(renderProgress.total, 1)) * 100),
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {plans.length === 0 ? (
          <p className="text-sm text-[var(--dashboard-subtle)]">No plans saved yet.</p>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--dashboard-text)]">Saved plans</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={`${plans.length} total`} tone="neutral" />
                  <button
                    type="button"
                    onClick={() => setPlanSelection(plans.map((plan) => plan.id))}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanSelection(renderablePlans.map((plan) => plan.id))}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
                  >
                    Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanSelection([])}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {plans.map((plan) => {
                  const draft = planDrafts.find((entry) => entry.planId === plan.id);
                  const isActive = plan.id === selectedPlan?.id;

                  return (
                    <div
                      key={plan.id}
                      className={`w-full rounded-2xl border p-4 transition ${
                        isActive
                          ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] hover:border-[var(--dashboard-accent)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPlanIds.includes(plan.id)}
                          onChange={() => togglePlanSelection(plan.id)}
                          className="mt-1 h-4 w-4 rounded border-[var(--dashboard-line)] text-[var(--dashboard-accent)]"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--dashboard-text)]">{plan.templateId}</p>
                            <StatusPill label={formatLabel(plan.status)} tone={toneForPlanStatus(plan.status)} />
                          </div>
                          <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                            {formatLabel(plan.mode)} / {plan.assignments.length} slot
                            {plan.assignments.length === 1 ? "" : "s"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill
                              label={`${plan.generatedPinCount} output${plan.generatedPinCount === 1 ? "" : "s"}`}
                              tone="neutral"
                            />
                            <StatusPill
                              label={draft?.visualPreset ? `Preset ${formatLabel(draft.visualPreset)}` : "Preset auto"}
                              tone="neutral"
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedPlan ? (
              <div className="space-y-5">
                <article className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[var(--dashboard-text)]">{selectedPlan.templateId}</h3>
                        <StatusPill
                          label={formatLabel(selectedPlan.status)}
                          tone={toneForPlanStatus(selectedPlan.status)}
                        />
                      </div>
                      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                        {formatLabel(selectedPlan.mode)} / {selectedPlan.assignments.length} source image slot
                        {selectedPlan.assignments.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleGeneratePins([selectedPlan.id])}
                        disabled={
                          Boolean(activeAction) ||
                          isRenderingPlans ||
                          !["READY", "DRAFT", "FAILED"].includes(selectedPlan.status)
                        }
                        className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <BusyActionLabel
                          busy={isRenderingPlans}
                          label="Generate this plan"
                          busyLabel="Rendering plan..."
                          inverse
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscardPlans([selectedPlan.id])}
                        disabled={Boolean(activeAction) || isRenderingPlans}
                        className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)] disabled:opacity-60"
                      >
                        <BusyActionLabel
                          busy={activeAction?.kind === "discard_plans" && activeAction.scope === "single"}
                          label="Discard this plan"
                          busyLabel="Discarding plan..."
                        />
                      </button>
                      <Link
                        href={templates.find((template) => template.id === selectedPlan.templateId)?.previewPath ?? "/library"}
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                      >
                        Preview template
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleSavePlanSettings(selectedPlan.id)}
                        disabled={Boolean(activeAction) || isRenderingPlans}
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
                      >
                        <BusyActionLabel
                          busy={activeAction?.kind === "save_overrides" && activeAction.planId === selectedPlan.id}
                          label="Save overrides"
                          busyLabel="Saving overrides..."
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Render title
                      <input
                        value={selectedPlanDraft?.title ?? ""}
                        onChange={(event) => updatePlanDraft(selectedPlan.id, { title: event.target.value })}
                        maxLength={100}
                        placeholder="Leave blank to auto-generate before render"
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Subtitle / kicker
                      <input
                        value={selectedPlanDraft?.subtitle ?? ""}
                        onChange={(event) => updatePlanDraft(selectedPlan.id, { subtitle: event.target.value })}
                        maxLength={40}
                        placeholder="Leave blank to auto-generate"
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Item number
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={selectedPlanDraft?.itemNumber ?? ""}
                        onChange={(event) => updatePlanDraft(selectedPlan.id, { itemNumber: event.target.value })}
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                      Visual preset
                      <select
                        value={selectedPlanDraft?.visualPreset ?? ""}
                        onChange={(event) => updatePlanDraft(selectedPlan.id, { visualPreset: event.target.value })}
                        className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-2"
                      >
                        <option value="">Use recommended preset</option>
                        {visualPresetCategories.map((category) => (
                          <optgroup key={category.id} label={category.label}>
                            {visualPresetOptions
                              .filter((preset) => preset.categoryId === category.id)
                              .map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.label}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedPlan.assignments.map((assignment) => (
                      <button
                        key={assignment.slotIndex}
                        type="button"
                        onClick={() =>
                          setPreviewSource({
                            url: assignment.imageUrl,
                            label: assignment.imageLabel,
                          })
                        }
                        className="overflow-hidden rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-left text-sm transition hover:border-[var(--dashboard-accent)]"
                      >
                        <div className="flex aspect-[4/3] items-center justify-center bg-[var(--dashboard-panel-alt)] p-3">
                          <img
                            src={assignment.imageUrl}
                            alt={assignment.imageLabel}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-[var(--dashboard-text)]">
                              Slot {assignment.slotIndex + 1}
                            </p>
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                              Full preview
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--dashboard-subtle)]">
                            {assignment.imageLabel}
                          </p>
                          <p className="mt-2 line-clamp-1 text-xs text-[var(--dashboard-muted)]">
                            {formatCompactUrl(assignment.imageUrl)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--dashboard-text)]">Generated outputs</h3>
                      <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                        Review the rendered pins here. Click any image for a full-size inspection.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={`${generatedPins.length} total`} tone="neutral" />
                      <StatusPill
                        label={`${selectedPlanGeneratedPins.length} from active plan`}
                        tone="neutral"
                      />
                    </div>
                  </div>

                  {orderedGeneratedPins.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 text-sm text-[var(--dashboard-subtle)]">
                      No generated pins yet. Render the queued plans to review outputs here.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {orderedGeneratedPins.map((pin) => {
                        const absoluteIndex = generatedPins.findIndex((entry) => entry.id === pin.id);
                        const assetMissing = missingAssetPinIds.includes(pin.id);
                        return (
                          <article
                            key={pin.id}
                            className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4"
                          >
                            <div className="grid gap-4 sm:grid-cols-[148px_minmax(0,1fr)]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!assetMissing) {
                                    setPreviewPinIndex(absoluteIndex);
                                  }
                                }}
                                disabled={assetMissing}
                                className="group overflow-hidden rounded-xl border border-[var(--dashboard-line)] text-left"
                              >
                                {assetMissing ? (
                                  <MissingAssetCard />
                                ) : (
                                  <img
                                    src={pin.exportPath}
                                    alt={pin.title ?? "Generated pin"}
                                    className="w-full transition duration-200 group-hover:scale-[1.02]"
                                    onError={() => markPinAssetMissing(pin.id)}
                                  />
                                )}
                              </button>
                              <div className="space-y-3 text-sm text-[var(--dashboard-subtle)]">
                                <div className="flex flex-wrap gap-2">
                                  <StatusPill label={pin.templateId} tone="neutral" />
                                  <StatusPill
                                    label={formatLabel(pin.mediaStatus)}
                                    tone={toneForPinStatus(pin.mediaStatus)}
                                  />
                                  {assetMissing ? (
                                    <StatusPill label="Asset missing" tone="warning" />
                                  ) : null}
                                  {pin.planId === selectedPlan.id ? (
                                    <StatusPill label="Active plan" tone="good" />
                                  ) : null}
                                </div>
                                {assetMissing ? (
                                  <div className="rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-3 py-3 text-sm text-[var(--dashboard-danger-ink)]">
                                    Preview asset is missing from storage. Rerender required.
                                  </div>
                                ) : null}
                                <p className="line-clamp-3">
                                  <strong className="text-[var(--dashboard-text)]">Title:</strong>{" "}
                                  {pin.title || "No saved title"}
                                </p>
                                <p className="line-clamp-3">
                                  <strong className="text-[var(--dashboard-text)]">Description:</strong>{" "}
                                  {pin.description || "No saved description"}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPinIndex(absoluteIndex)}
                                    disabled={assetMissing}
                                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                                  >
                                    View full size
                                  </button>
                                  {assetMissing ? (
                                    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-muted)]">
                                      Rerender required
                                    </span>
                                  ) : (
                                    <a
                                      href={pin.exportPath}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                                    >
                                      Open image
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDiscardGeneratedPins([pin.id])}
                                    className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-danger-ink)]"
                                  >
                                    Discard this pin
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </article>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {previewSource ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,18,28,0.72)] p-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dashboard-line)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--dashboard-text)]">Source image preview</p>
                <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">{previewSource.label}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={previewSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewSource(null)}
                  className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex max-h-[calc(92vh-80px)] items-center justify-center overflow-auto bg-[var(--dashboard-panel)] p-5">
              <img
                src={previewSource.url}
                alt={previewSource.label}
                className="max-h-[78vh] w-auto rounded-xl border border-[var(--dashboard-line)]"
              />
            </div>
          </div>
        </div>
      ) : null}

      {previewPin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,18,28,0.72)] p-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-md)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dashboard-line)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--dashboard-text)]">{previewPin.templateId}</p>
                <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                  {previewPin.title || "No saved title"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPinIndex((current) =>
                      current === null || current <= 0 ? generatedPins.length - 1 : current - 1,
                    )
                  }
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPinIndex((current) =>
                      current === null || current >= generatedPins.length - 1 ? 0 : current + 1,
                    )
                  }
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Next
                </button>
                <a
                  href={previewPin.exportPath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPinIndex(null)}
                  className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid max-h-[calc(92vh-80px)] gap-6 overflow-auto p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex items-start justify-center rounded-2xl bg-[var(--dashboard-panel)] p-4">
                {missingAssetPinIds.includes(previewPin.id) ? (
                  <div className="flex min-h-[420px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] p-8 text-center text-sm font-semibold text-[var(--dashboard-danger-ink)]">
                    This asset is missing from storage. Discard and rerender this pin.
                  </div>
                ) : (
                  <img
                    src={previewPin.exportPath}
                    alt={previewPin.title ?? "Generated pin"}
                    className="max-h-[78vh] w-auto rounded-xl border border-[var(--dashboard-line)]"
                    onError={() => markPinAssetMissing(previewPin.id)}
                  />
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    Title
                  </p>
                  <p className="mt-2 text-sm text-[var(--dashboard-text)]">
                    {previewPin.title || "No saved title"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    Description
                  </p>
                  <p className="mt-2 text-sm text-[var(--dashboard-text)]">
                    {previewPin.description || "No saved description"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    Media state
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill label={previewPin.templateId} tone="neutral" />
                    <StatusPill
                      label={formatLabel(previewPin.mediaStatus)}
                      tone={toneForPinStatus(previewPin.mediaStatus)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InlineFeedback({ feedback }: { feedback: Exclude<FeedbackState, null> }) {
  const className =
    feedback.tone === "success"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>{feedback.message}</div>;
}

function MissingAssetCard() {
  return (
    <div className="flex min-h-[220px] w-full items-center justify-center bg-[var(--dashboard-danger-soft)] p-4 text-center text-sm font-semibold text-[var(--dashboard-danger-ink)]">
      Asset missing.
      <br />
      Rerender required.
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string | null }) {
  return (
    <p>
      <strong className="text-[var(--dashboard-text)]">{label}:</strong>{" "}
      {value && value.trim() !== "" ? value : "None"}
    </p>
  );
}

function StatusPill({
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
    <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
  );
}

function toneForPlanStatus(status: string) {
  if (status === "GENERATED") {
    return "good" as const;
  }
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (status === "READY") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function toneForPinStatus(status: string) {
  if (["UPLOADED", "SCHEDULED", "COMPLETED"].includes(status)) {
    return "good" as const;
  }
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (["UPLOADING", "SUBMITTING", "PENDING"].includes(status)) {
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

function formatCompactUrl(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.split("/").filter(Boolean).slice(-2).join("/");
    return `${url.hostname}/${path}`;
  } catch {
    return value;
  }
}

function buildRenderProgressMessage(input: {
  completed: number;
  total: number;
  currentLabel: string;
}) {
  const currentIndex = Math.min(input.total, input.completed + 1);
  return `Rendering ${currentIndex} of ${input.total}: ${input.currentLabel}.`;
}
