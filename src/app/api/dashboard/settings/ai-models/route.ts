import { NextResponse } from "next/server";
import { z } from "zod";
import { AIClient } from "@/lib/ai";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettings } from "@/lib/settings/integrationSettings";

const schema = z.object({
  provider: z.enum(["gemini", "openai", "openrouter", "custom_endpoint"]),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  customEndpoint: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const rawPayload = await request.json();
    const payload = schema.parse(rawPayload);
    const savedSettings = isDatabaseConfigured() ? await getIntegrationSettings() : null;
    const canUseSavedKey =
      Boolean(savedSettings?.aiApiKey) && payload.provider === savedSettings?.aiProvider;

    const models = await AIClient.listModels({
      provider: payload.provider,
      apiKey: payload.apiKey?.trim() || (canUseSavedKey ? savedSettings?.aiApiKey : "") || "",
      model: payload.model?.trim() || "",
      customEndpoint:
        payload.customEndpoint?.trim() ||
        (payload.provider === savedSettings?.aiProvider
          ? savedSettings?.aiCustomEndpoint || ""
          : ""),
    });

    return NextResponse.json({
      ok: true,
      models,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load AI models.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
