import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataFourImageGridNumberTitle } from "@/lib/templates/sampleData";

export default function FourImageGridNumberTitlePreviewPage() {
  const previews = [
    sampleTemplateDataFourImageGridNumberTitle,
    {
      ...sampleTemplateDataFourImageGridNumberTitle,
      visualPreset: "midnight-gold",
      itemNumber: 17,
      title: "Porch Color Ideas",
    },
    {
      ...sampleTemplateDataFourImageGridNumberTitle,
      visualPreset: "cobalt-coral",
      itemNumber: 31,
      title: "Kitchen Paint Colors",
    },
    {
      ...sampleTemplateDataFourImageGridNumberTitle,
      visualPreset: "sage-cream",
      itemNumber: 12,
      title: "Entry Decor Ideas",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#e6dfd7] px-6 py-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#805227]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#20140b]">
            Four Image Grid Number Title
          </h1>
        </div>
        <div className="rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(58,39,14,0.12)]">
          <div className="grid gap-6 xl:grid-cols-2">
            {previews.map((preview, index) => (
              <div
                key={`${preview.visualPreset}-${preview.itemNumber}-${index}`}
                className="overflow-auto rounded-[28px] border border-[#eadfce] bg-[#faf7f2] p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9a6d43]">
                      Sample {index + 1}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-[#2c1d11]">
                      {preview.visualPreset}
                    </h2>
                  </div>
                  <p className="text-sm font-medium text-[#72543a]">
                    {preview.title}
                  </p>
                </div>
                {renderTemplate("four-image-grid-number-title", preview)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
