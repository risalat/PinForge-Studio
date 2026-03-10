import { notFound } from "next/navigation";
import { getRenderPayload } from "@/lib/templates/getRenderPayload";
import { getTemplateConfig, renderTemplate } from "@/lib/templates/registry";

type RenderPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    jobId?: string;
    planId?: string;
  }>;
};

export default async function RenderTemplatePage({
  params,
  searchParams,
}: RenderPageProps) {
  const { templateId } = await params;
  const { jobId, planId } = await searchParams;
  const config = getTemplateConfig(templateId);

  if (!config) {
    notFound();
  }

  const payload = await getRenderPayload(
    templateId,
    jobId,
    planId,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#d9d1c7] p-8">
      {renderTemplate(templateId, payload)}
    </main>
  );
}
