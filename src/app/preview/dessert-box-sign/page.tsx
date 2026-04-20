import { ResponsiveCanvasPreview } from "@/components/ResponsiveCanvasPreview";
import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataDessertBoxSign } from "@/lib/templates/sampleData";

export default function DessertBoxSignPreviewPage() {
  const previews = [
    sampleTemplateDataDessertBoxSign,
    {
      ...sampleTemplateDataDessertBoxSign,
      visualPreset: "garnet-biscuit",
      itemNumber: 24,
      title: "Holiday Cookie Recipes",
      subtitle: "Bakery Window",
    },
    {
      ...sampleTemplateDataDessertBoxSign,
      visualPreset: "scarlet-vanilla",
      itemNumber: 18,
      title: "No Bake Dessert Ideas",
      subtitle: "Sweet Roundup",
    },
    {
      ...sampleTemplateDataDessertBoxSign,
      visualPreset: "blueberry-cream",
      itemNumber: 31,
      title: "Cupcake Ideas for Parties",
      subtitle: "Party Favorites",
    },
    {
      ...sampleTemplateDataDessertBoxSign,
      visualPreset: "espresso-cherry",
      itemNumber: 16,
      title: "Chocolate Dessert Recipes",
      subtitle: "After Dinner",
    },
    {
      ...sampleTemplateDataDessertBoxSign,
      visualPreset: "citrus-mint",
      itemNumber: 20,
      title: "Spring Brunch Dessert Ideas",
      subtitle: "Fresh Picks",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#f3e8dc] px-6 py-8 text-[#2b2018]">
      <div className="mx-auto flex max-w-none flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8f5933]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#2b2018]">
            Dessert Box Sign
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#614734]">
            A centered bakery-sign food template with four surrounding dessert cards, a sealed
            number badge, and gift-box ribbon framing built for festive roundups.
          </p>
        </div>

        <div className="rounded-[36px] bg-white p-6 shadow-[0_28px_70px_rgba(76,42,15,0.12)]">
          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            {previews.map((preview, index) => (
              <div
                key={`${preview.visualPreset}-${preview.itemNumber}-${index}`}
                className="rounded-[28px] border border-[#eadfce] bg-[#faf7f2] p-4"
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
                  <p className="text-sm font-medium text-[#72543a]">{preview.title}</p>
                </div>
                <ResponsiveCanvasPreview
                  canvasWidth={1080}
                  canvasHeight={1920}
                  className="w-full"
                  maxViewportHeightRatio={0.78}
                >
                  {renderTemplate("dessert-box-sign", preview)}
                </ResponsiveCanvasPreview>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
