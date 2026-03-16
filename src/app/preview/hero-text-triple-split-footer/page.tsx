import { getSampleTemplateProps, renderTemplate } from "@/lib/templates/registry";

export default function HeroTextTripleSplitFooterPreviewPage() {
  const templateId = "hero-text-triple-split-footer";

  return (
    <main className="min-h-screen bg-[#e8dfd0] px-6 py-8 text-[#23160d]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#23160d]">
            Hero Text Triple Split Footer
          </h1>
        </div>

        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          {renderTemplate(templateId, getSampleTemplateProps(templateId))}
        </div>
      </div>
    </main>
  );
}
