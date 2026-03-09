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
                      {template.id === "split-vertical-title"
                        ? "Subtitle-first editorial layout for titles that benefit from a short kicker plus a multi-line main headline."
                        : "Image-led editorial layout for stronger standalone titles without a supporting kicker line."}
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
                          {template.id === "split-vertical-title"
                            ? "Use when the title package includes a kicker/subtitle."
                            : "Use when the headline should dominate on its own."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={template.previewPath ?? `/preview/${template.id}`}
                      className="rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0]"
                    >
                      Open preview
                    </Link>
                    <Link
                      href={`/render/${template.id}`}
                      className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
                    >
                      Open render
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
