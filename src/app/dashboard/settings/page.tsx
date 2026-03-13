import Link from "next/link";
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
    publerAllowedDomains: [],
    publerAccountId: "",
    publerBoardId: "",
    aiProvider: "gemini" as const,
    aiModel: "",
    aiCustomEndpoint: "",
    hasPublerApiKey: false,
    hasAiApiKey: false,
    canUsePublerApiKey: false,
    canUseAiApiKey: false,
    publerCredentialState: "missing",
    aiCredentialState: "missing",
    publerCredentialMessage: "",
    aiCredentialMessage: "",
  };

  if (databaseReady) {
    try {
      settings = await getIntegrationSettingsSummary();
    } catch {
      databaseReady = false;
    }
  }

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="max-w-3xl text-base leading-7 text-[var(--dashboard-subtle)]">
              Configure Publer API access and AI once, then let Studio reuse those settings for
              generation now and publishing later.
            </p>
            <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/integrations"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              Open integrations
            </Link>
          </div>
        </div>

        {!databaseReady ? (
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
            `DATABASE_URL` is not configured yet. Settings will work after the database is connected
            and migrated.
          </div>
        ) : (
          <SettingsManager initialSettings={settings} />
        )}
    </div>
  );
}
