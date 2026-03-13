import Link from "next/link";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { SettingsManager } from "@/app/dashboard/settings/SettingsManager";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { IntegrationSettingsSummary } from "@/lib/types";

export default async function DashboardSettingsPage() {
  await requireAuthenticatedDashboardUser();
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
      <div className="flex justify-end">
        <Link
          href="/dashboard/integrations"
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
        >
          Open integrations
        </Link>
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
