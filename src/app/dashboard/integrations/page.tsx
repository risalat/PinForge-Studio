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
    aiCredentials: [],
    defaultAiCredentialId: "",
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
    <div className="space-y-5 text-[var(--dashboard-text)]">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <IntegrationChip
            label="Publer"
            value={
              settings.publerCredentialState === "ready"
                ? "Ready"
                : settings.publerCredentialState === "unavailable"
                  ? "Saved but unavailable"
                  : "Missing key"
            }
            tone={
              settings.publerCredentialState === "missing"
                ? "warning"
                : settings.publerCredentialState === "ready"
                  ? "good"
                  : "warning"
            }
          />
          <IntegrationChip
            label="AI keys"
            value={
              settings.aiCredentials.length > 0
                ? String(settings.aiCredentials.length)
                : settings.aiCredentialState === "unavailable"
                  ? "Saved but unavailable"
                  : "Missing key"
            }
            tone={
              settings.aiCredentialState === "missing"
                ? "warning"
                : settings.aiCredentialState === "ready"
                  ? "good"
                  : "warning"
            }
          />
          <IntegrationChip
            label="Workspace profiles"
            value={
              settings.workspaceProfiles.length > 0
                ? String(settings.workspaceProfiles.length)
                : "Not set"
            }
            tone="neutral"
          />
        </div>
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

function IntegrationChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "warning";
}) {
  const className =
    tone === "good"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] text-[var(--dashboard-text)]";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}
