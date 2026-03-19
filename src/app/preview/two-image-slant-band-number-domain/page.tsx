import { getSampleTemplateProps, renderTemplate } from "@/lib/templates/registry";

export default function TwoImageSlantBandNumberDomainPreviewPage() {
  const templateId = "two-image-slant-band-number-domain";

  return (
    <main className="min-h-screen bg-[#efe8df] px-6 py-8 text-[#2b2018]">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8c5a3d]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#2b2018]">
            Two Image Slant Band Number Domain
          </h1>
        </div>

        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          {renderTemplate(templateId, getSampleTemplateProps(templateId))}
        </div>
      </div>
    </main>
  );
}
