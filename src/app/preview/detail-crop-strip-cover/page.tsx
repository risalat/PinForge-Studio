import { ResponsiveCanvasPreview } from "@/components/ResponsiveCanvasPreview";
import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataDetailCropStripCover } from "@/lib/templates/sampleData";

export default function DetailCropStripCoverPreviewPage() {
  const previews = [
    sampleTemplateDataDetailCropStripCover,
    {
      ...sampleTemplateDataDetailCropStripCover,
      visualPreset: "citrus-mint",
      itemNumber: 18,
      title: "Fresh Spring Salad Recipes",
      subtitle: "Bright Picks",
    },
    {
      ...sampleTemplateDataDetailCropStripCover,
      visualPreset: "tomato-basil",
      itemNumber: 27,
      title: "Healthy Lunch Bowl Recipes",
      subtitle: "Meal Prep Favorites",
    },
    {
      ...sampleTemplateDataDetailCropStripCover,
      visualPreset: "berry-citrus",
      itemNumber: 16,
      title: "Smoothie Bowl Ideas for Breakfast",
      subtitle: "Morning Roundup",
    },
    {
      ...sampleTemplateDataDetailCropStripCover,
      visualPreset: "honey-saffron",
      itemNumber: 21,
      title: "High Protein Breakfast Recipes",
      subtitle: "Quick Fuel",
    },
    {
      ...sampleTemplateDataDetailCropStripCover,
      visualPreset: "midnight-gold",
      itemNumber: 14,
      title: "Cozy Soup Recipes for Dinner",
      subtitle: "Warm Favorites",
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
            Detail Crop Strip Cover
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#614734]">
            An image-led food roundup layout with a dominant center hero, narrow top and bottom
            crop strips, and a compact title block built to keep the dish imagery doing the selling.
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
                  {renderTemplate("detail-crop-strip-cover", preview)}
                </ResponsiveCanvasPreview>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
