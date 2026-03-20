import { getSampleTemplateProps, renderTemplate } from "@/lib/templates/registry";

export default function ThreeImageCenterPosterNumberFooterPreviewPage() {
  const templateId = "three-image-center-poster-number-footer";

  return (
    <main className="min-h-screen bg-[#f0e6d8] px-6 py-8 text-[#2a1b14]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a15d38]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#2a1b14]">
            Three Image Center Poster Number Footer
          </h1>
        </div>

        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          {renderTemplate(templateId, getSampleTemplateProps(templateId))}
        </div>
      </div>
    </main>
  );
}
