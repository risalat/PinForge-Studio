import { NextResponse } from "next/server";
import { z } from "zod";
import { AIClient } from "@/lib/ai";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettings, resolveAiCredentialForUserId } from "@/lib/settings/integrationSettings";

const schema = z.object({
  provider: z.enum(["gemini", "openai", "openrouter", "custom_endpoint"]),
  credentialId: z.string().optional(),
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
    const dashboardUser = isDatabaseConfigured() ? await getOrCreateDashboardUser() : null;
    const savedSettings = isDatabaseConfigured() ? await getIntegrationSettings() : null;
    const savedCredential =
      dashboardUser && payload.credentialId
        ? await resolveAiCredentialForUserId({
            userId: dashboardUser.id,
            aiCredentialId: payload.credentialId,
          })
        : null;
    const canUseSavedKey =
      (Boolean(savedCredential?.apiKey) && payload.provider === savedCredential?.provider) ||
      (Boolean(savedSettings?.aiApiKey) && payload.provider === savedSettings?.aiProvider);

    const models = await AIClient.listModels({
      provider: payload.provider,
      apiKey:
        payload.apiKey?.trim() ||
        (canUseSavedKey ? savedCredential?.apiKey || savedSettings?.aiApiKey : "") ||
        "",
      model: payload.model?.trim() || "",
      customEndpoint:
        payload.customEndpoint?.trim() ||
        (payload.provider === savedCredential?.provider
          ? savedCredential?.customEndpoint || ""
          : payload.provider === savedSettings?.aiProvider
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
