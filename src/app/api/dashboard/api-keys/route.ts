import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiKey, listApiKeys } from "@/lib/auth/apiKeys";
import { isDatabaseConfigured } from "@/lib/env";

const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
        apiKeys: [],
      },
      { status: 500 },
    );
  }

  const apiKeys = await listApiKeys();

  return NextResponse.json({
    ok: true,
    apiKeys,
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
    const payload = createApiKeySchema.parse(rawPayload);
    const result = await createApiKey(payload);

    return NextResponse.json({
      ok: true,
      apiKey: {
        id: result.record.id,
        name: result.record.name,
        keyPrefix: result.record.keyPrefix,
        createdAt: result.record.createdAt.toISOString(),
        lastUsedAt: result.record.lastUsedAt?.toISOString() ?? null,
        revokedAt: result.record.revokedAt?.toISOString() ?? null,
        isActive: result.record.isActive && result.record.revokedAt === null,
      },
      plaintextKey: result.plaintextKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create API key.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
