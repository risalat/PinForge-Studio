"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  archiveRuntimeTemplateForUser,
  createEditableDraftFromFinalizedTemplateForUser,
  createStarterCustomTemplateDraft,
  duplicateRuntimeTemplateDraftForUser,
  finalizeRuntimeTemplateVersionForUser,
  getTemplateWithVersionsForUser,
  runRuntimeTemplateValidationForUser,
} from "@/lib/runtime-templates/db";

export async function createStarterTemplateDraftAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  await createStarterCustomTemplateDraft({
    userId: user.id,
    name: name || undefined,
    description: description || undefined,
  });

  revalidatePath("/dashboard/templates");
}

export async function validateRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const versionId = String(formData.get("versionId") ?? "").trim();

  if (!templateId || !versionId) {
    throw new Error("Template draft is missing.");
  }

  await runRuntimeTemplateValidationForUser({
    userId: user.id,
    templateId,
    versionId,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath(`/dashboard/templates/${templateId}/edit`);
  revalidatePath(`/dashboard/templates/${templateId}/preview`);
}

export async function finalizeRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const versionId = String(formData.get("versionId") ?? "").trim();

  if (!templateId || !versionId) {
    throw new Error("Template draft is missing.");
  }

  await finalizeRuntimeTemplateVersionForUser({
    userId: user.id,
    templateId,
    versionId,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/library");
  revalidatePath(`/dashboard/templates/${templateId}/edit`);
  revalidatePath(`/dashboard/templates/${templateId}/preview`);
}

export async function duplicateRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    throw new Error("Template draft is missing.");
  }

  await duplicateRuntimeTemplateDraftForUser({
    userId: user.id,
    templateId,
  });

  revalidatePath("/dashboard/templates");
}

export async function archiveRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    throw new Error("Template draft is missing.");
  }

  await archiveRuntimeTemplateForUser({
    userId: user.id,
    templateId,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/library");
}

export async function createDraftFromFinalizedTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const sourceVersionId = String(formData.get("sourceVersionId") ?? "").trim();

  if (!templateId) {
    throw new Error("Template draft is missing.");
  }

  await createEditableDraftFromFinalizedTemplateForUser({
    userId: user.id,
    templateId,
    sourceVersionId: sourceVersionId || undefined,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/library");
}

export async function renameRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!templateId || !name) {
    throw new Error("Template name is required.");
  }

  const template = await getTemplateWithVersionsForUser({
    userId: user.id,
    templateId,
  });

  if (!template) {
    throw new Error("Template not found.");
  }

  // Phase 6 keeps rename simple by delegating to the existing edit/save path when a draft exists.
  // Finalized templates should be cloned to a draft before renaming in-place.
  if (!template.activeVersion || template.activeVersion.lifecycleStatus !== "DRAFT") {
    throw new Error("Rename the template from an editable draft.");
  }

  await createEditableDraftFromFinalizedTemplateForUser({
    userId: user.id,
    templateId,
    sourceVersionId: template.activeVersion.id,
  });

  revalidatePath("/dashboard/templates");
}
