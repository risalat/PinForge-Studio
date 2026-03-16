import Link from "next/link";
import { getTemplateLibraryEntries } from "@/lib/templates/library";
import { renderTemplate } from "@/lib/templates/registry";

const THUMBNAIL_WIDTH = 280;
const THUMBNAIL_SCALE = THUMBNAIL_WIDTH / 1080;
const THUMBNAIL_HEIGHT = Math.round(1920 * THUMBNAIL_SCALE);

export default function TemplateLibraryPage() {
  const templates = getTemplateLibraryEntries();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e4_0%,#efe3d2_100%)] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#8a572a]">
              Content Library
            </p>
            <h1 className="text-4xl font-black uppercase tracking-[-0.05em] sm:text-5xl">
              Locked templates
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#604834]">
              Browse the production-ready template variants that are locked for reuse. Open a
              full preview to inspect spacing, title fitting, and image behavior before generating
              pins in bulk.
            </p>
          </div>

          <div className="rounded-[28px] bg-[#2c1c12] px-6 py-5 text-[#f7ede0] shadow-[0_18px_48px_rgba(58,39,14,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d8b58c]">
              Locked now
            </p>
            <p className="mt-2 text-4xl font-black">{templates.filter((item) => item.locked).length}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.id}
              className="rounded-[34px] border border-white/70 bg-white/80 p-6 shadow-[0_26px_70px_rgba(58,39,14,0.12)] backdrop-blur-sm"
            >
              <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[28px] bg-[#f3eadf] p-4">
                  <div
                    className="overflow-hidden rounded-[20px] bg-[#d7c7b6] shadow-[0_12px_30px_rgba(58,39,14,0.15)]"
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
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#2c1c12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#f7ede0]">
                        {template.locked ? "Locked" : "Draft"}
                      </span>
                      <span className="rounded-full border border-[#dcc5aa] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a572a]">
                        {template.canvas.width} x {template.canvas.height}
                      </span>
                      <span className="rounded-full border border-[#dcc5aa] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a572a]">
                        {template.imageSlotCount} image slots
                      </span>
                      <span className="rounded-full border border-[#dcc5aa] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a572a]">
                        {template.features.overlay ? "Overlay" : "Editorial"}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-[#23160d]">
                        {template.name}
                      </h2>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-[#9a6840]">
                        {template.id}
                      </p>
                    </div>

                    <p className="text-base leading-7 text-[#604834]">
                      {getTemplateDescription(template.id)}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] bg-[#f8f1e7] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6840]">
                          Text fields
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#4d3525]">
                          {template.textFields.join(", ")}
                        </p>
                      </div>
                      <div className="rounded-[24px] bg-[#f8f1e7] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6840]">
                          Usage note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#4d3525]">
                          {getTemplateUsage(template.id)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={template.previewPath ?? `/preview/${template.id}`}
                      className="library-primary-action inline-flex items-center justify-center rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#fff5e8]"
                    >
                      Open preview
                    </Link>
                    <Link
                      href={`/render/${template.id}`}
                      className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
                    >
                      Open render
                    </Link>
                    <Link
                      href="/dashboard/jobs"
                      className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
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
    </main>
  );
}

function getTemplateDescription(templateId: string) {
  switch (templateId) {
    case "split-vertical-title":
      return "Subtitle-first editorial layout for titles that benefit from a short kicker plus a multi-line main headline.";
    case "split-vertical-title-no-subtitle":
      return "Image-led editorial layout for stronger standalone titles without a supporting kicker line.";
    case "split-vertical-title-number":
      return "Split layout with a hero number block and a title-first listicle treatment.";
    case "single-image-subtitle-title-cta":
      return "Single-image editorial card with a subtitle, large title, and compact CTA-footer treatment.";
    case "single-image-header-title-domain-cta":
      return "Single full-bleed image with a translucent top header card, editorial kicker, uppercase title, and inline domain CTA.";
    case "single-image-title-footer":
      return "Single-image layout with a white subtitle strip, deep footer title panel, and a compact read-more plus domain row.";
    case "four-image-masonry-hero-number-domain-pill":
      return "Four-image masonry collage with a centered number medallion, bold title card, and compact domain pill.";
    case "four-image-grid-number-title-domain":
      return "Four-image asymmetric grid with a centered hero number, full-width title band, and domain pill.";
    case "four-image-grid-title-footer":
      return "Clean four-image grid with a translucent center title band and a full-width footer domain bar.";
    case "hero-text-triple-split-footer":
      return "Warm editorial layout with one hero image, a full-width text panel, and a lower triple-split strip capped by a footer domain bar.";
    case "six-image-triple-split-slant-hero-footer":
      return "Six-image collage with a triple top strip, tilted middle photos, editorial title band, and full-width footer.";
    case "nine-image-grid-overlay-number-footer":
      return "Nine-image square grid with a centered number medallion, editorial title band, and compact footer pill.";
    case "masonry-grid-number-title-footer":
      return "Seven-image masonry collage with a centered number card, dark editorial title band, and footer domain pill.";
    case "hero-two-split-text":
      return "Full-width hero image with a side-by-side number and three-line title strip, followed by a lower two-image split.";
    default:
      return "Locked Pinterest template ready for preview, render, and manual plan use.";
  }
}

function getTemplateUsage(templateId: string) {
  switch (templateId) {
    case "split-vertical-title":
      return "Use when the title package includes a kicker/subtitle.";
    case "split-vertical-title-no-subtitle":
      return "Use when the headline should dominate on its own.";
    case "split-vertical-title-number":
      return "Use for numbered listicles that need the count to do visual work.";
    case "single-image-subtitle-title-cta":
      return "Use for single-image pins where the subtitle names a paint, product, or featured idea.";
    case "single-image-header-title-domain-cta":
      return "Use for tutorial or explainer pins where the title and CTA should sit together in a top header.";
    case "single-image-title-footer":
      return "Use for single-image editorial pins that need a strong dark footer title block.";
    case "four-image-masonry-hero-number-domain-pill":
      return "Use for inspiration roundups that need a visible count and centered title block.";
    case "four-image-grid-number-title-domain":
      return "Use for roundup pins that need a strong listicle badge and simple four-image structure.";
    case "four-image-grid-title-footer":
      return "Use when the title should sit across the middle without a separate number badge.";
    case "hero-text-triple-split-footer":
      return "Use for seasonal decor or roundup pins where one hero image should lead before supporting detail shots.";
    case "six-image-triple-split-slant-hero-footer":
      return "Use when multiple angles plus one strong hero image make the pin more persuasive.";
    case "nine-image-grid-overlay-number-footer":
      return "Use for dense inspiration roundups that need many examples plus a strong listicle hook.";
    case "masonry-grid-number-title-footer":
      return "Use for editorial collage pins that need a richer masonry structure with a centered count hook.";
    case "hero-two-split-text":
      return "Use for listicle pins that need one dominant hero, a huge count, and a stacked center title strip.";
    default:
      return "Use for locked template-driven render tests and job planning.";
  }
}
