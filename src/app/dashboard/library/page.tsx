import Link from "next/link";
import { getTemplateLibraryEntries } from "@/lib/templates/library";
import { renderTemplate } from "@/lib/templates/registry";

const THUMBNAIL_WIDTH = 280;
const THUMBNAIL_SCALE = THUMBNAIL_WIDTH / 1080;
const THUMBNAIL_HEIGHT = Math.round(1920 * THUMBNAIL_SCALE);

export default function DashboardLibraryPage() {
  const templates = getTemplateLibraryEntries();

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
      <section className="grid gap-4 xl:grid-cols-3">
        <LibraryMetric label="Templates" value={String(templates.length)} />
        <LibraryMetric
          label="Subtitle-aware"
          value={String(templates.filter((template) => template.textFields.includes("subtitle")).length)}
        />
        <LibraryMetric
          label="Number-aware"
          value={String(
            templates.filter((template) => template.features.numberTreatment !== "none").length,
          )}
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-2">
        {templates.map((template) => (
          <article
            key={template.id}
            className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]"
          >
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[26px] bg-[var(--dashboard-panel-alt)] p-4">
                <div
                  className="overflow-hidden rounded-[22px] bg-white shadow-[var(--dashboard-shadow-sm)]"
                  style={{
                    width: THUMBNAIL_WIDTH,
                    height: THUMBNAIL_HEIGHT,
                  }}
                >
                  <div
                    style={{
                      width: 1080,
                      height: 1920,
                      transform: `scale(${THUMBNAIL_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {renderTemplate(template.id, template.sampleProps)}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag label={template.locked ? "Locked" : "Draft"} tone="accent" />
                    <Tag label={`${template.imageSlotCount} image slots`} />
                    <Tag
                      label={
                        template.features.numberTreatment === "hero"
                          ? "Hero number"
                          : template.features.numberTreatment === "badge"
                            ? "Badge number"
                            : "Title led"
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-[-0.04em]">{template.name}</h2>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                      {template.id}
                    </p>
                  </div>

                  <p className="text-sm leading-7 text-[var(--dashboard-subtle)]">
                    {getTemplateDescription(template.id)}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Text fields" value={template.textFields.join(", ")} />
                    <DetailCard
                      label="Usage"
                      value={getTemplateUsage(template.id)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={template.previewPath ?? `/preview/${template.id}`}
                    className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Open preview
                  </Link>
                  <Link
                    href={`/render/${template.id}`}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                  >
                    Render route
                  </Link>
                  <Link
                    href="/dashboard/jobs"
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
                  >
                    Use in jobs
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function LibraryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function Tag({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
        tone === "accent"
          ? "bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
          : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </span>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[var(--dashboard-panel-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">{value}</p>
    </div>
  );
}

function getTemplateDescription(templateId: string) {
  switch (templateId) {
    case "split-vertical-title":
      return "Editorial split layout with kicker, title, footer sync, and image-aware preset selection.";
    case "split-vertical-title-no-subtitle":
      return "Split layout for cleaner standalone headlines with a dominant title band and footer harmony.";
    case "split-vertical-title-number":
      return "Split layout with a hero number badge, locked editorial typography, and stronger listicle packaging.";
    case "single-image-subtitle-title-cta":
      return "Single-image editorial card with a reference-locked subtitle, headline, and footer CTA treatment.";
    case "four-image-masonry-hero-number-domain-pill":
      return "Four-image masonry collage with a centered number medallion, bold title card, and compact domain pill.";
    case "six-image-triple-split-slant-hero-footer":
      return "Six-image collage with a triple top strip, tilted middle photos, editorial title band, and full-width footer.";
    case "nine-image-grid-overlay-number-footer":
      return "Nine-image square grid with a centered number medallion, editorial title band, and compact footer pill.";
    default:
      return "Locked Pinterest template ready for preview, render, and manual plan use.";
  }
}

function getTemplateUsage(templateId: string) {
  switch (templateId) {
    case "split-vertical-title":
      return "Best for pins that need a subtitle and more editorial packaging.";
    case "split-vertical-title-no-subtitle":
      return "Best for cleaner pins with a dominant headline.";
    case "split-vertical-title-number":
      return "Best for numbered listicles that need a visible count hook.";
    case "single-image-subtitle-title-cta":
      return "Best for single-image pins where the subtitle names a paint, product, or featured idea.";
    case "four-image-masonry-hero-number-domain-pill":
      return "Best for multi-image inspiration roundups that need a visible count and centered title block.";
    case "six-image-triple-split-slant-hero-footer":
      return "Best for exterior or roundup pins that benefit from multiple angles plus one strong hero image.";
    case "nine-image-grid-overlay-number-footer":
      return "Best for dense inspiration roundups that need many examples plus a strong listicle hook.";
    default:
      return "Best for locked template-driven render tests and job planning.";
  }
}

