import { renderTemplate } from "@/lib/templates/registry";
import { sampleTemplateDataColorPopLadderNumberCard } from "@/lib/templates/sampleData";

export default function ColorPopLadderNumberCardPreviewPage() {
  const previews = [
    sampleTemplateDataColorPopLadderNumberCard,
    {
      ...sampleTemplateDataColorPopLadderNumberCard,
      visualPreset: "berry-citrus",
      itemNumber: 15,
      title: "Patio Color Ideas",
    },
    {
      ...sampleTemplateDataColorPopLadderNumberCard,
      visualPreset: "teal-flare",
      itemNumber: 27,
      title: "Kitchen Paint Colors",
    },
    {
      ...sampleTemplateDataColorPopLadderNumberCard,
      visualPreset: "peony-punch",
      itemNumber: 19,
      title: "Front Door Decor",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[#ece6dc] px-6 py-8">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#915426]">
            Preview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-[#22150d]">
            Color Pop Ladder Number Card
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
                  <p className="text-sm font-medium text-[#72543a]">{preview.title}</p>
                </div>
                {renderTemplate("color-pop-ladder-number-card", preview)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
