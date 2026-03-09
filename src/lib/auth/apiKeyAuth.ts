import { NextResponse } from "next/server";
import {
  extractBearerToken,
  findActiveApiKeyByToken,
  touchApiKeyLastUsed,
} from "@/lib/auth/apiKeys";

export async function authenticateApiKeyRequest(request: Request) {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error: "Missing Authorization bearer token.",
        },
        { status: 401 },
      ),
    };
  }

  const apiKey = await findActiveApiKeyByToken(token);
  if (!apiKey) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error: "Invalid or revoked API key.",
        },
        { status: 401 },
      ),
    };
  }

  await touchApiKeyLastUsed(apiKey.id);

  return {
    ok: true as const,
    apiKey,
    user: apiKey.user,
  };
}
