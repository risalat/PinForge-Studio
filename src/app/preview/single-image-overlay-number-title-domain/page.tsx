import { getSampleTemplateProps, renderTemplate } from "@/lib/templates/registry";

export default function SingleImageOverlayNumberTitleDomainPreviewPage() {
  const templateId = "single-image-overlay-number-title-domain";

  return (
    <main className="min-h-screen bg-[#e7ddd0] px-6 py-8 text-[#2f241d]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9a6a44]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#2f241d]">
            Single Image Overlay Number Title Domain
          </h1>
        </div>

        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          {renderTemplate(templateId, getSampleTemplateProps(templateId))}
        </div>
      </div>
    </main>
  );
}
