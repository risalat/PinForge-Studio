"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/shared";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  return createBrowserClient(config.url, config.publishableKey);
}
