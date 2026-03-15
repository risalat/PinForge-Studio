import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import {
  type AiCredentialInput,
  getIntegrationSettingsSummary,
  type WorkspaceProfileInput,
  saveIntegrationSettings,
} from "@/lib/settings/integrationSettings";

const settingsSchema = z.object({
  publerApiKey: z.string().optional(),
  publerWorkspaceId: z.string().optional(),
  publerAllowedDomains: z.array(z.string()).optional(),
  publerAccountId: z.string().optional(),
  publerBoardId: z.string().optional(),
  workspaceProfiles: z
    .array(
      z.object({
        workspaceId: z.string(),
        workspaceName: z.string(),
        allowedDomains: z.array(z.string()),
        defaultAccountId: z.string().optional(),
        defaultBoardId: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .optional(),
  aiProvider: z.enum(["gemini", "openai", "openrouter", "custom_endpoint"]).optional(),
  aiApiKey: z.string().optional(),
  aiModel: z.string().optional(),
  aiCustomEndpoint: z.string().optional(),
  aiCredentials: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string(),
        provider: z.enum(["gemini", "openai", "openrouter", "custom_endpoint"]),
        apiKey: z.string().optional(),
        model: z.string().optional(),
        customEndpoint: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  const settings = await getIntegrationSettingsSummary();

  return NextResponse.json({
    ok: true,
    settings,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const rawPayload = await request.json();
    const payload = settingsSchema.parse(rawPayload);
    await saveIntegrationSettings({
      ...payload,
      workspaceProfiles: payload.workspaceProfiles as WorkspaceProfileInput[] | undefined,
      aiCredentials: payload.aiCredentials as AiCredentialInput[] | undefined,
    });
    const settings = await getIntegrationSettingsSummary();

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save settings.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
