/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

type PlanItem = {
  id: string;
  mode: string;
  templateId: string;
  status: string;
  assignments: Array<{
    slotIndex: number;
    imageUrl: string;
  }>;
};

type JobReviewManagerProps = {
  jobId: string;
  images: SourceImageItem[];
  templates: TemplateOption[];
  plans: PlanItem[];
};

export function JobReviewManager({
  jobId,
  images: initialImages,
  templates,
  plans,
}: JobReviewManagerProps) {
  const initialSelectedImages = initialImages.filter((image) => image.isSelected);
  const initialManualTemplate = templates[0] ?? null;
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [pinCount, setPinCount] = useState(3);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState(templates.map((item) => item.id));
  const [manualTemplateId, setManualTemplateId] = useState(initialManualTemplate?.id ?? "");
  const [manualAssignedImageIds, setManualAssignedImageIds] = useState<string[]>(
    initialManualTemplate
      ? Array.from({ length: initialManualTemplate.imageSlotCount }).map(
          (_, slotIndex) =>
            initialSelectedImages[slotIndex % Math.max(initialSelectedImages.length, 1)]?.id ?? "",
        )
      : [],
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedImages = images.filter((image) => image.isSelected);
  const manualTemplate = templates.find((item) => item.id === manualTemplateId) ?? null;

  function toggleTemplate(templateId: string) {
    setSelectedTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((item) => item !== templateId)
        : [...current, templateId],
    );
  }

  function updateImage(id: string, patch: Partial<SourceImageItem>) {
    setImages((current) =>
      current.map((image) => (image.id === id ? { ...image, ...patch } : image)),
    );
  }

  function seedManualAssignments(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      setManualAssignedImageIds([]);
      return;
    }

    setManualAssignedImageIds((current) =>
      Array.from({ length: template.imageSlotCount }).map(
        (_, slotIndex) => current[slotIndex] ?? selectedImages[slotIndex % Math.max(selectedImages.length, 1)]?.id ?? "",
      ),
    );
  }

  async function runAction(url: string, payload: unknown) {
    setError(null);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      throw new Error(data.error ?? "Request failed.");
    }
  }

  function handleSaveReview() {
    startTransition(async () => {
      try {
        await runAction(`/api/dashboard/jobs/${jobId}/review`, {
          images: images.map((image) => ({
            id: image.id,
            isSelected: image.isSelected,
            isPreferred: image.isSelected && image.isPreferred,
          })),
        });
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to save review state.");
      }
    });
  }

  function handleAssistedPlans() {
    startTransition(async () => {
      try {
        await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "assisted_auto",
          pinCount,
          templateIds: selectedTemplateIds,
        });
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to create assisted plans.");
      }
    });
  }

  function handleManualPlan() {
    startTransition(async () => {
      try {
        await runAction(`/api/dashboard/jobs/${jobId}/plans`, {
          mode: "manual",
          templateId: manualTemplateId,
          sourceImageIds: manualAssignedImageIds.filter((value) => value !== ""),
        });
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to create manual plan.");
      }
    });
  }

  function handleGeneratePins() {
    startTransition(async () => {
      try {
        await runAction(`/api/dashboard/jobs/${jobId}/generate`, {});
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to generate pins.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-xl border border-[#e0c9b2] bg-[#fff7ee] px-4 py-3 text-sm text-[#7a4b1f]">
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-[#e8d7c5] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Image review</h2>
            <p className="text-sm text-[#6e4a2b]">
              Decide which images can be used in this job and which ones assisted mode should try
              first.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveReview}
            disabled={isPending}
            className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
          >
            Save review
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-[#eadacc] bg-[#fcf7f0] p-4 text-sm text-[#6e4a2b] md:grid-cols-2">
          <div>
            <p className="font-semibold text-[#23160d]">Use in plans</p>
            <p className="mt-1">
              Enabled images can be used by assisted auto and can also be assigned manually.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#23160d]">Prefer in assisted auto</p>
            <p className="mt-1">
              This only biases assisted auto toward that image. It does not force it into every
              generated pin.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {images.map((image) => (
            <article key={image.id} className="rounded-xl border border-[#eadacc] p-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <img
                  src={image.url}
                  alt={image.alt ?? "Source image"}
                  className="h-48 w-full rounded-lg object-cover lg:w-40"
                />
                <div className="min-w-0 flex-1 space-y-2 text-sm text-[#4f3725]">
                  <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a572a]">
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
                  <p className="text-xs text-[#8a572a]">
                    {image.isSelected
                      ? image.isPreferred
                        ? "Active and prioritized for assisted auto."
                        : "Active for both assisted and manual planning."
                      : "Inactive until you enable it again."}
                  </p>
                  <p className="break-all text-xs text-[#7a614d]">{image.url}</p>
                  <p><strong>Alt:</strong> {image.alt || "None"}</p>
                  <p><strong>Caption:</strong> {image.caption || "None"}</p>
                  <p><strong>Nearest heading:</strong> {image.nearestHeading || "None"}</p>
                  <p>
                    <strong>Section path:</strong>{" "}
                    {image.sectionHeadingPath.length > 0 ? image.sectionHeadingPath.join(" / ") : "None"}
                  </p>
                  <p><strong>Snippet:</strong> {image.surroundingTextSnippet || "None"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e8d7c5] bg-white p-5">
        <div>
          <h2 className="text-xl font-bold">Template selection workflow</h2>
          <p className="text-sm text-[#6e4a2b]">
            Build assisted or manual plans first. Rendering only starts when you click Generate Pins.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-[#eadacc] p-4">
            <div>
              <h3 className="font-semibold">Assisted auto</h3>
              <p className="text-sm text-[#6e4a2b]">Choose a pin count and eligible templates.</p>
            </div>
            <label className="block text-sm font-semibold text-[#6e4a2b]">
              Number of pins
              <input
                type="number"
                min={1}
                max={20}
                value={pinCount}
                onChange={(event) => setPinCount(Number(event.target.value) || 1)}
                className="mt-2 w-full rounded-lg border border-[#dcc8b2] px-3 py-2"
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#6e4a2b]">Eligible templates</p>
              {templates.map((template) => (
                <label key={template.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#eadacc] px-3 py-2 text-sm">
                  <span>
                    {template.name} ({template.imageSlotCount} slots)
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedTemplateIds.includes(template.id)}
                    onChange={() => toggleTemplate(template.id)}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAssistedPlans}
              disabled={isPending}
              className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
            >
              Create assisted plans
            </button>
          </div>

          <div className="space-y-4 rounded-xl border border-[#eadacc] p-4">
            <div>
              <h3 className="font-semibold">Manual template assignment</h3>
              <p className="text-sm text-[#6e4a2b]">Choose a template and assign source images to slots.</p>
            </div>
            <div className="grid gap-3">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`rounded-lg border px-3 py-3 text-sm ${
                    manualTemplateId === template.id ? "border-[#8a572a] bg-[#fff8ef]" : "border-[#eadacc]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <strong>{template.name}</strong>
                      <span className="ml-2 text-[#6e4a2b]">{template.layoutType}</span>
                    </span>
                    <input
                      type="radio"
                      name="manual-template"
                      checked={manualTemplateId === template.id}
                      onChange={() => {
                        setManualTemplateId(template.id);
                        seedManualAssignments(template.id);
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>{template.imageSlotCount} image slots</span>
                    <Link href={template.previewPath} className="underline">
                      Preview
                    </Link>
                  </div>
                </label>
              ))}
            </div>

            {manualTemplate ? (
              <div className="space-y-3">
                {Array.from({ length: manualTemplate.imageSlotCount }).map((_, slotIndex) => (
                  <label key={slotIndex} className="block text-sm font-semibold text-[#6e4a2b]">
                    Slot {slotIndex + 1}
                    <select
                      value={manualAssignedImageIds[slotIndex] ?? ""}
                      onChange={(event) =>
                        setManualAssignedImageIds((current) => {
                          const next = [...current];
                          next[slotIndex] = event.target.value;
                          return next;
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-[#dcc8b2] px-3 py-2"
                    >
                      <option value="">Choose image</option>
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

            <button
              type="button"
              onClick={handleManualPlan}
              disabled={isPending || !manualTemplate}
              className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
            >
              Add manual plan
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e8d7c5] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Queued generation plans</h2>
            <p className="text-sm text-[#6e4a2b]">Review saved plans, then trigger rendering explicitly.</p>
          </div>
          <button
            type="button"
            onClick={handleGeneratePins}
            disabled={isPending || plans.length === 0}
            className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
          >
            Generate Pins
          </button>
        </div>

        {plans.length === 0 ? (
          <p className="text-sm text-[#6e4a2b]">No plans saved yet.</p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-[#eadacc] p-4">
                <div>
                  <p className="font-semibold">{plan.templateId}</p>
                  <p className="text-sm text-[#6e4a2b]">
                    {plan.mode} · {plan.status}
                  </p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {plan.assignments.map((assignment) => (
                    <div key={assignment.slotIndex} className="rounded-lg bg-[#f8f1e7] p-3 text-sm">
                      <p className="font-semibold">Slot {assignment.slotIndex + 1}</p>
                      <p className="mt-2 break-all text-xs text-[#6e4a2b]">{assignment.imageUrl}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
