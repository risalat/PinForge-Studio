import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataFourImageGridCenterPosterNumberTitle } from "@/lib/templates/sampleData";

export default function FourImageGridCenterPosterNumberTitlePreviewPage() {
  return (
    <main className="min-h-screen bg-[#eee3d8] px-6 py-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8e5b34]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#26170f]">
            Four Image Grid Center Poster Number Title
          </h1>
        </div>
        <div className="rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(76,42,15,0.12)]">
          <div className="overflow-auto rounded-[28px] border border-[#eadfce] bg-[#faf7f2] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9a6d43]">
                  Reference preset
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#2c1d11]">
                  {sampleTemplateDataFourImageGridCenterPosterNumberTitle.visualPreset}
                </h2>
              </div>
              <p className="text-right text-sm font-medium text-[#72543a]">
                {sampleTemplateDataFourImageGridCenterPosterNumberTitle.title}
              </p>
            </div>
            {renderTemplate(
              "four-image-grid-center-poster-number-title",
              sampleTemplateDataFourImageGridCenterPosterNumberTitle,
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
