import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataSingleImageSubtitleTitleCta } from "@/lib/templates/sampleData";

export default function SingleImageSubtitleTitleCtaPreviewPage() {
  return (
    <main className="min-h-screen bg-[#e8dfd0] px-6 py-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#23160d]">
            Single Image Subtitle Title CTA
          </h1>
        </div>
        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          {renderTemplate(
            "single-image-subtitle-title-cta",
            sampleTemplateDataSingleImageSubtitleTitleCta,
          )}
        </div>
      </div>
    </main>
  );
}
