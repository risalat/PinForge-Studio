import { getSampleTemplateProps, renderTemplate } from "@/lib/templates/registry";

export default function HeroArchSidebarTriptychPreviewPage() {
  const templateId = "hero-arch-sidebar-triptych";
  const sampleProps = getSampleTemplateProps(templateId);
  const presetVariants = [
    { id: "sunset-punch", label: "Sunset Punch" },
    { id: "peony-punch", label: "Peony Punch" },
    { id: "cobalt-coral", label: "Cobalt Coral" },
    { id: "ink-lime", label: "Ink Lime" },
  ] as const;

  return (
    <main className="min-h-screen bg-[#ede4da] px-6 py-8 text-[#23160d]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#23160d]">
            Hero Arch Sidebar Triptych
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#5f4734]">
            Bold preset check for the draft layout across graphic-pop, fresh-vivid, and
            feminine-bold families.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {presetVariants.map((preset) => (
            <section
              key={preset.id}
              className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]"
            >
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a6840]">
                  Bold Preset
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.04em] text-[#23160d]">
                  {preset.label}
                </h2>
              </div>
              {renderTemplate(templateId, {
                ...sampleProps,
                visualPreset: preset.id,
              })}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
