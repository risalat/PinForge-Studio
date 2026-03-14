import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataNineImageGridOverlayNumberFooter } from "@/lib/templates/sampleData";

export default function NineImageGridOverlayNumberFooterPreviewPage() {
  return (
    <main className="min-h-screen bg-[#eff2f6] px-6 py-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5d6e8e]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#16243b]">
            Nine Image Grid Overlay Number Footer
          </h1>
        </div>
        <div className="overflow-auto rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(36,57,84,0.12)]">
          {renderTemplate(
            "nine-image-grid-overlay-number-footer",
            sampleTemplateDataNineImageGridOverlayNumberFooter,
          )}
        </div>
      </div>
    </main>
  );
}
