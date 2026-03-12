import { SettingsManager } from "@/app/dashboard/settings/SettingsManager";
import { isDatabaseConfigured } from "@/lib/env";
import { getIntegrationSettingsSummary } from "@/lib/settings/integrationSettings";
import type { IntegrationSettingsSummary } from "@/lib/types";

export default async function DashboardIntegrationsPage() {
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
          label="Workspace defaults"
          value={settings.publerWorkspaceId ? "Configured" : "Set in publish flow"}
          tone="neutral"
        />
      </section>

      {!databaseReady ? (
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
          `DATABASE_URL` is not configured yet. Integration settings will work after the database is connected.
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
        className={`mt-4 inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
          tone === "good"
            ? "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
            : tone === "warning"
              ? "bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
              : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
        }`}
      >
        {tone === "good" ? "Ready" : tone === "warning" ? "Needs setup" : "Info"}
      </div>
    </div>
  );
}
