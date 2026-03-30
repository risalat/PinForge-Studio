import { notFound, redirect } from "next/navigation";
import { TemplateDraftEditor } from "@/components/template-builder/TemplateDraftEditor";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import {
  createEditableDraftFromFinalizedTemplateForUser,
  getEditableRuntimeTemplateDraftForUser,
} from "@/lib/runtime-templates/db";
import {
  runtimeTemplateDocumentDraftSchema,
  runtimeTemplateEditorStateSchema,
} from "@/lib/runtime-templates/schema.zod";
import type { RuntimeTemplateValidationResult } from "@/lib/runtime-templates/types";
import type { TemplateVisualPresetId } from "@/lib/templates/types";

type RuntimeTemplateEditPageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    cloneFinalized?: string;
  }>;
};

export default async function RuntimeTemplateEditPage({
  params,
  searchParams,
}: RuntimeTemplateEditPageProps) {
  await requireAuthenticatedDashboardUser();
  const user = await getOrCreateDashboardUser();
  const { templateId } = await params;
  const { cloneFinalized } = await searchParams;
  let template = await getEditableRuntimeTemplateDraftForUser({
    userId: user.id,
    templateId,
  });

  if (!template?.activeVersion) {
    notFound();
  }

  if (
    template.activeVersion.isLocked ||
    template.activeVersion.lifecycleStatus === "FINALIZED"
  ) {
    if (cloneFinalized !== "1") {
      redirect(`/dashboard/templates/${templateId}/preview?versionId=${template.activeVersion.id}`);
    }

    await createEditableDraftFromFinalizedTemplateForUser({
      userId: user.id,
      templateId,
      sourceVersionId: template.activeVersion.id,
    });

    template = await getEditableRuntimeTemplateDraftForUser({
      userId: user.id,
      templateId,
    });

    if (!template?.activeVersion) {
      notFound();
    }
  }

  const document = runtimeTemplateDocumentDraftSchema.parse(template.activeVersion.schemaJson);
  const editorState = runtimeTemplateEditorStateSchema.parse(template.activeVersion.editorStateJson);
  const validation =
    template.activeVersion.validationJson && typeof template.activeVersion.validationJson === "object"
      ? (template.activeVersion.validationJson as RuntimeTemplateValidationResult<typeof document>)
      : null;

  return (
    <TemplateDraftEditor
      templateId={template.id}
      versionId={template.activeVersion.id}
      versionNumber={template.activeVersion.versionNumber}
      versionLifecycleStatus={template.activeVersion.lifecycleStatus}
      versionLocked={template.activeVersion.isLocked}
      initialName={template.name}
      initialDescription={template.description ?? ""}
      initialDocument={document}
      initialEditorState={editorState}
      initialPreset={(editorState.visualPreset as TemplateVisualPresetId | null) ?? "teal-flare"}
      initialValidationResult={validation}
    />
  );
}
