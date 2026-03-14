import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataMasonryGridNumberTitleFooter } from "@/lib/templates/sampleData";

export default function MasonryGridNumberTitleFooterPreviewPage() {
  return (
    <main className="min-h-screen bg-[#efe5d9] px-6 py-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a05e20]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#2d1a0e]">
            Masonry Grid Number Title Footer
          </h1>
        </div>
        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(76,42,15,0.12)]">
          {renderTemplate(
            "masonry-grid-number-title-footer",
            sampleTemplateDataMasonryGridNumberTitleFooter,
          )}
        </div>
      </div>
    </main>
  );
}
