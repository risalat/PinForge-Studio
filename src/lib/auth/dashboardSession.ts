import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseAuthConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedSupabaseUser() {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuthenticatedDashboardUser(): Promise<SupabaseUser> {
  const user = await getAuthenticatedSupabaseUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAuthenticatedDashboardApiUser() {
  const user = await getAuthenticatedSupabaseUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true as const,
    user,
  };
}
