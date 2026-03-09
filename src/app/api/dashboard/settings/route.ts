import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/env";
import {
  getIntegrationSettingsSummary,
  saveIntegrationSettings,
} from "@/lib/settings/integrationSettings";

const settingsSchema = z.object({
  publerApiKey: z.string().optional(),
  publerWorkspaceId: z.string().optional(),
  publerAccountId: z.string().optional(),
  publerBoardId: z.string().optional(),
  aiProvider: z.enum(["gemini", "openai", "openrouter", "custom_endpoint"]).optional(),
  aiApiKey: z.string().optional(),
  aiModel: z.string().optional(),
  aiCustomEndpoint: z.string().optional(),
});

export async function GET() {
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
    await saveIntegrationSettings(payload);
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
