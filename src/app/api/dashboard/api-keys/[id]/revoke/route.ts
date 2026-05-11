import { NextResponse } from "next/server";
// Do not use getApiEffectiveUserId() here.
// Extension API keys are personal to the signed-in actor account.
import { revokeApiKey } from "@/lib/auth/apiKeys";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";

type RevokeRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RevokeRouteProps) {
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

  const { id } = await params;
  const result = await revokeApiKey(id);

  if (result.count === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "API key was not found or is already revoked.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
