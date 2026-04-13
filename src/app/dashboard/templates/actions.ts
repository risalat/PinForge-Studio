"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import {
  archiveRuntimeTemplateForUser,
  createCustomTemplateDraftFromBuiltInForUser,
  createEditableDraftFromFinalizedTemplateForUser,
  createStarterCustomTemplateDraft,
  deleteRuntimeTemplateForUser,
  duplicateRuntimeTemplateDraftForUser,
  finalizeRuntimeTemplateVersionForUser,
  getTemplateWithVersionsForUser,
  runRuntimeTemplateValidationForUser,
} from "@/lib/runtime-templates/db";
import {
  assignTemplatesToGroupForUser,
  createTemplateGroupForUser,
  deleteTemplateGroupForUser,
  removeTemplatesFromGroupForUser,
  updateTemplateGroupForUser,
} from "@/lib/template-groups/db";

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

export async function createCustomDraftFromBuiltInTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const builtInTemplateId = String(formData.get("builtInTemplateId") ?? "").trim();

  if (!builtInTemplateId) {
    throw new Error("Built-in template is missing.");
  }

  const result = await createCustomTemplateDraftFromBuiltInForUser({
    userId: user.id,
    builtInTemplateId,
  });

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/library");
  redirect(`/dashboard/templates/${result.templateId}/edit`);
}

export async function createTemplateGroupAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const group = await createTemplateGroupForUser({
    userId: user.id,
    name,
    description: description || undefined,
  });

  revalidateTemplateGroupRoutes();
  redirect(
    buildTemplateGroupsActionRedirectUrl({
      formData,
      groupId: group.id,
      notice: "group-created",
    }),
  );
}

export async function updateTemplateGroupAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = parseOptionalInteger(formData.get("sortOrder"));

  if (!groupId || !name) {
    throw new Error("Template group details are missing.");
  }

  await updateTemplateGroupForUser({
    userId: user.id,
    groupId,
    name,
    description: description || undefined,
    sortOrder: sortOrder ?? undefined,
  });

  revalidateTemplateGroupRoutes();
  redirect(
    buildTemplateGroupsActionRedirectUrl({
      formData,
      groupId,
      notice: "group-saved",
    }),
  );
}

export async function deleteTemplateGroupAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const groupId = String(formData.get("groupId") ?? "").trim();

  if (!groupId) {
    throw new Error("Template group is missing.");
  }

  await deleteTemplateGroupForUser({
    userId: user.id,
    groupId,
  });

  revalidateTemplateGroupRoutes();
  redirect(
    buildTemplateGroupsActionRedirectUrl({
      formData,
      notice: "group-deleted",
    }),
  );
}

export async function assignTemplatesToGroupAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const templateIds = readTemplateIdsFromFormData(formData);

  if (!groupId) {
    throw new Error("Template group assignment is missing.");
  }

  if (templateIds.length === 0) {
    redirect(
      buildTemplateGroupsActionRedirectUrl({
        formData,
        groupId,
        notice: "select-template-to-add",
      }),
    );
  }

  await assignTemplatesToGroupForUser({
    userId: user.id,
    groupId,
    templateIds,
  });

  revalidateTemplateGroupRoutes();
  redirect(
    buildTemplateGroupsActionRedirectUrl({
      formData,
      groupId,
      notice: "templates-added",
    }),
  );
}

export async function removeTemplatesFromGroupAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const templateIds = readTemplateIdsFromFormData(formData);

  if (!groupId) {
    throw new Error("Template group assignment is missing.");
  }

  if (templateIds.length === 0) {
    redirect(
      buildTemplateGroupsActionRedirectUrl({
        formData,
        groupId,
        notice: "select-template-to-remove",
      }),
    );
  }

  await removeTemplatesFromGroupForUser({
    userId: user.id,
    groupId,
    templateIds,
  });

  revalidateTemplateGroupRoutes();
  redirect(
    buildTemplateGroupsActionRedirectUrl({
      formData,
      groupId,
      notice: "templates-removed",
    }),
  );
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

export async function duplicateRuntimeTemplateAsVariantAction(formData: FormData) {
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
    asVariant: true,
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

export async function deleteRuntimeTemplateAction(formData: FormData) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const user = await getOrCreateDashboardUser();
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    throw new Error("Template draft is missing.");
  }

  await deleteRuntimeTemplateForUser({
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

function revalidateTemplateGroupRoutes() {
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/jobs/[jobId]", "page");
}

function buildTemplateGroupsActionRedirectUrl(input: {
  formData: FormData;
  groupId?: string;
  notice?: string;
}) {
  const params = new URLSearchParams();
  params.set("view", "groups");

  const groupId = input.groupId?.trim() || String(input.formData.get("returnGroupId") ?? "").trim();
  const groupSearch = String(input.formData.get("returnGroupSearch") ?? "").trim();
  const templateSearch = String(input.formData.get("returnTemplateSearch") ?? "").trim();
  const source = String(input.formData.get("returnSource") ?? "").trim();

  if (groupId) {
    params.set("group", groupId);
  }
  if (groupSearch) {
    params.set("groupSearch", groupSearch);
  }
  if (templateSearch) {
    params.set("templateSearch", templateSearch);
  }
  if (source && source !== "all") {
    params.set("source", source);
  }
  if (input.notice?.trim()) {
    params.set("notice", input.notice.trim());
  }

  return `/dashboard/templates?${params.toString()}`;
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error("Sort order must be a number.");
  }

  return Math.trunc(parsed);
}

function readTemplateIdsFromFormData(formData: FormData) {
  const repeatedTemplateIds = formData
    .getAll("templateId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (repeatedTemplateIds.length > 0) {
    return Array.from(new Set(repeatedTemplateIds));
  }

  const rawTemplateIds = String(formData.get("templateIds") ?? "").trim();
  if (!rawTemplateIds) {
    return [];
  }

  if (rawTemplateIds.startsWith("[")) {
    try {
      const parsed = JSON.parse(rawTemplateIds);
      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        );
      }
    } catch {
      throw new Error("Template IDs payload is invalid.");
    }
  }

  return Array.from(
    new Set(
      rawTemplateIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}
