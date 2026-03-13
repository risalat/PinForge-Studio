import { SettingsManager } from "@/app/dashboard/settings/SettingsManager";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { IntegrationSettingsSummary } from "@/lib/types";

export default async function DashboardIntegrationsPage() {
  let databaseReady = isDatabaseConfigured();
  let settings: IntegrationSettingsSummary = {
    publerWorkspaceId: "",
    publerAllowedDomains: [],
    publerAccountId: "",
    publerBoardId: "",
    workspaceProfiles: [],
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
      <section className="grid gap-4 xl:grid-cols-3">
        <IntegrationStat
          label="Publer"
          value={
            settings.publerCredentialState === "ready"
              ? "Ready"
              : settings.publerCredentialState === "unavailable"
                ? "Saved but unavailable"
                : "Missing key"
          }
          tone={settings.publerCredentialState === "missing" ? "warning" : settings.publerCredentialState === "ready" ? "good" : "warning"}
        />
        <IntegrationStat
          label="AI provider"
          value={
            settings.aiCredentialState === "ready"
              ? settings.aiProvider
              : settings.aiCredentialState === "unavailable"
                ? `${settings.aiProvider} unavailable`
                : "Missing key"
          }
          tone={settings.aiCredentialState === "missing" ? "warning" : settings.aiCredentialState === "ready" ? "good" : "warning"}
        />
        <IntegrationStat
          label="Workspace profiles"
          value={settings.workspaceProfiles.length > 0 ? String(settings.workspaceProfiles.length) : "Not set"}
          tone="neutral"
        />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet.
        </div>
      ) : (
        <SettingsManager initialSettings={settings} />
      )}
    </div>
  );
}

function IntegrationStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "warning";
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <div
        className={`mt-4 h-1.5 rounded-full ${
          tone === "good"
            ? "bg-[var(--dashboard-success-border)]"
            : tone === "warning"
              ? "bg-[var(--dashboard-warning-border)]"
              : "bg-[var(--dashboard-line)]"
        }`}
      />
    </div>
  );
}
