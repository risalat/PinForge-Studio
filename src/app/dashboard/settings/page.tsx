import Link from "next/link";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import { SettingsManager } from "@/app/dashboard/settings/SettingsManager";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { IntegrationSettingsSummary } from "@/lib/types";

export default async function DashboardSettingsPage() {
  const user = await requireAuthenticatedDashboardUser();
  let databaseReady = isDatabaseConfigured();
  let settings: IntegrationSettingsSummary = {
    publerWorkspaceId: "",
    publerAccountId: "",
    publerBoardId: "",
    aiProvider: "gemini" as const,
    aiModel: "",
    aiCustomEndpoint: "",
    hasPublerApiKey: false,
    hasAiApiKey: false,
  };

  if (databaseReady) {
    try {
      settings = await getIntegrationSettingsSummary();
    } catch {
      databaseReady = false;
    }
  }

  return (
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">
              Integration settings
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#6e4a2b]">
              Configure Publer API access and AI once, then let Studio reuse those settings for
              generation now and publishing later.
            </p>
            <p className="mt-3 text-sm text-[#6e4a2b]">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href="/dashboard"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {!databaseReady ? (
          <div className="rounded-[28px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
            `DATABASE_URL` is not configured yet. Settings will work after the database is connected
            and migrated.
          </div>
        ) : (
          <SettingsManager initialSettings={settings} />
        )}
      </div>
    </main>
  );
}
