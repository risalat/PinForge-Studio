"use client";

import { useEffect, useState } from "react";
import type { AIProvider } from "@/lib/ai";
import type {
  DashboardAiModelsResponse,
  DashboardPublerOptionsResponse,
  IntegrationSettingsSummary,
  WorkspaceProfileSummary,
} from "@/lib/types";
import type {
  PinterestBoard,
  PublerAccount,
  PublerWorkspace,
} from "@/lib/publer/publerClient";

const aiProviderOptions: Array<{ value: AIProvider; label: string }> = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom_endpoint", label: "Custom endpoint" },
];

type WorkspaceProfileDraft = {
  workspaceId: string;
  workspaceName: string;
  allowedDomainsInput: string;
  isDefault: boolean;
  defaultAccountId: string;
  defaultBoardId: string;
};

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: IntegrationSettingsSummary;
}) {
  const [publerApiKey, setPublerApiKey] = useState("");
  const [workspaceProfiles, setWorkspaceProfiles] = useState<WorkspaceProfileDraft[]>(
    initialSettings.workspaceProfiles.map(toWorkspaceProfileDraft),
  );
  const [publerWorkspaces, setPublerWorkspaces] = useState<PublerWorkspace[]>(
    initialSettings.workspaceProfiles.map((profile) => ({
      id: profile.workspaceId,
      name: profile.workspaceName,
    })),
  );
  const [publerAccountsByWorkspace, setPublerAccountsByWorkspace] = useState<
    Record<string, PublerAccount[]>
  >({});
  const [publerBoardsByWorkspaceAccount, setPublerBoardsByWorkspaceAccount] = useState<
    Record<string, PinterestBoard[]>
  >({});
  const [aiProvider, setAiProvider] = useState<AIProvider>(initialSettings.aiProvider);
  const [storedAiProvider, setStoredAiProvider] = useState<AIProvider>(initialSettings.aiProvider);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState(initialSettings.aiModel);
  const [aiCustomEndpoint, setAiCustomEndpoint] = useState(initialSettings.aiCustomEndpoint);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [hasStoredPublerKey, setHasStoredPublerKey] = useState(initialSettings.hasPublerApiKey);
  const [hasStoredAiKey, setHasStoredAiKey] = useState(initialSettings.hasAiApiKey);
  const [canUseStoredPublerKey, setCanUseStoredPublerKey] = useState(initialSettings.canUsePublerApiKey);
  const [canUseStoredAiKey, setCanUseStoredAiKey] = useState(initialSettings.canUseAiApiKey);
  const [publerCredentialMessage, setPublerCredentialMessage] = useState(
    initialSettings.publerCredentialMessage,
  );
  const [aiCredentialMessage, setAiCredentialMessage] = useState(
    initialSettings.aiCredentialMessage,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPublerWorkspaces, setIsLoadingPublerWorkspaces] = useState(false);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState(false);

  const canLoadAiModels =
    aiProvider === "custom_endpoint"
      ? aiCustomEndpoint.trim() !== ""
      : aiApiKey.trim() !== "" || (canUseStoredAiKey && aiProvider === storedAiProvider);

  const canLoadPublerWorkspaces = publerApiKey.trim() !== "" || canUseStoredPublerKey;

  function addWorkspaceProfile() {
    setWorkspaceProfiles((current) => {
      const firstAvailableWorkspace = publerWorkspaces.find(
        (workspace) => !current.some((profile) => profile.workspaceId === workspace.id),
      );

      return [
        ...current,
        {
          workspaceId: firstAvailableWorkspace?.id ?? "",
          workspaceName: firstAvailableWorkspace?.name ?? "",
          allowedDomainsInput: "",
          isDefault: current.length === 0,
          defaultAccountId: "",
          defaultBoardId: "",
        },
      ];
    });
  }

  function updateWorkspaceProfile<K extends keyof WorkspaceProfileDraft>(
    index: number,
    key: K,
    value: WorkspaceProfileDraft[K],
  ) {
    setWorkspaceProfiles((current) =>
      current.map((profile, currentIndex) => {
        if (currentIndex !== index) {
          return profile;
        }

        if (key === "workspaceId") {
          const workspaceId = String(value);
          const workspaceName = resolveWorkspaceName(workspaceId, publerWorkspaces, profile.workspaceName);
          return {
            ...profile,
            workspaceId,
            workspaceName,
          };
        }

        return {
          ...profile,
          [key]: value,
        };
      }),
    );
  }

  async function loadWorkspaceProfileOptions(
    index: number,
    workspaceId: string,
    accountId?: string,
  ) {
    if (!workspaceId || !canLoadPublerWorkspaces) {
      return;
    }

    try {
      const response = await fetch("/api/dashboard/settings/publer-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: publerApiKey || undefined,
          workspaceId,
          accountId: accountId || undefined,
        }),
      });
      const json = (await response.json()) as DashboardPublerOptionsResponse;

      if (!json.ok) {
        throw new Error(json.error ?? "Unable to load workspace defaults.");
      }

      const nextAccounts = json.accounts ?? [];
      const nextBoards = json.boards ?? [];
      const resolvedAccountId = json.selectedAccountId ?? accountId ?? "";

      setPublerAccountsByWorkspace((current) => ({
        ...current,
        [workspaceId]: nextAccounts,
      }));
      setPublerBoardsByWorkspaceAccount((current) => ({
        ...current,
        [getWorkspaceBoardCacheKey(workspaceId, resolvedAccountId)]: nextBoards,
      }));
      setWorkspaceProfiles((current) =>
        current.map((profile, currentIndex) => {
          if (currentIndex !== index) {
            return profile;
          }

          return {
            ...profile,
            workspaceId,
            workspaceName: resolveWorkspaceName(workspaceId, publerWorkspaces, profile.workspaceName),
            defaultAccountId: resolvedAccountId,
            defaultBoardId:
              profile.defaultBoardId && nextBoards.some((board) => board.id === profile.defaultBoardId)
                ? profile.defaultBoardId
                : nextBoards[0]?.id ?? "",
          };
        }),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load workspace defaults.",
      );
    }
  }

  function handleWorkspaceSelection(index: number, workspaceId: string) {
    setWorkspaceProfiles((current) =>
      current.map((profile, currentIndex) =>
        currentIndex === index
          ? {
              ...profile,
              workspaceId,
              workspaceName: resolveWorkspaceName(workspaceId, publerWorkspaces, profile.workspaceName),
              defaultAccountId: "",
              defaultBoardId: "",
            }
          : profile,
      ),
    );

    void loadWorkspaceProfileOptions(index, workspaceId);
  }

  function handleWorkspaceAccountSelection(index: number, accountId: string) {
    const workspaceId = workspaceProfiles[index]?.workspaceId ?? "";
    setWorkspaceProfiles((current) =>
      current.map((profile, currentIndex) =>
        currentIndex === index
          ? {
              ...profile,
              defaultAccountId: accountId,
              defaultBoardId: "",
            }
          : profile,
      ),
    );

    void loadWorkspaceProfileOptions(index, workspaceId, accountId);
  }

  function setDefaultWorkspaceProfile(index: number) {
    setWorkspaceProfiles((current) =>
      current.map((profile, currentIndex) => ({
        ...profile,
        isDefault: currentIndex === index,
      })),
    );
  }

  function removeWorkspaceProfile(index: number) {
    setWorkspaceProfiles((current) => {
      const nextProfiles = current.filter((_, currentIndex) => currentIndex !== index);
      if (nextProfiles.length > 0 && !nextProfiles.some((profile) => profile.isDefault)) {
        nextProfiles[0] = {
          ...nextProfiles[0],
          isDefault: true,
        };
      }
      return nextProfiles;
    });
  }

  async function loadPublerWorkspaces(options?: { silent?: boolean }) {
    if (!canLoadPublerWorkspaces) {
      return;
    }

    setIsLoadingPublerWorkspaces(true);
    if (!options?.silent) {
      setError(null);
      setSuccess(null);
    }

    try {
      const response = await fetch("/api/dashboard/settings/publer-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: publerApiKey || undefined,
          workspaceId: workspaceProfiles.find((profile) => profile.isDefault)?.workspaceId || undefined,
        }),
      });
      const json = (await response.json()) as DashboardPublerOptionsResponse;

      if (!json.ok) {
        throw new Error(json.error ?? "Unable to load Publer workspaces.");
      }

      const nextWorkspaces = json.workspaces ?? [];
      setPublerWorkspaces(nextWorkspaces);
      setWorkspaceProfiles((current) => syncProfileNames(current, nextWorkspaces));

      if (!options?.silent) {
        setSuccess(
          nextWorkspaces.length > 0
            ? `Loaded ${nextWorkspaces.length} Publer workspace${nextWorkspaces.length === 1 ? "" : "s"}.`
            : "No Publer workspaces are available for the current API key.",
        );
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Unable to load Publer workspaces.";
      setError(message);
    } finally {
      setIsLoadingPublerWorkspaces(false);
    }
  }

  async function loadAiModels(options?: { silent?: boolean }) {
    if (!canLoadAiModels) {
      return;
    }

    if (aiProvider === "custom_endpoint") {
      setAiModels([]);
      if (!options?.silent) {
        setSuccess("Custom endpoints use a manual model ID.");
      }
      return;
    }

    setIsLoadingAiModels(true);
    if (!options?.silent) {
      setError(null);
      setSuccess(null);
    }

    try {
      const response = await fetch("/api/dashboard/settings/ai-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey || undefined,
          model: aiModel || undefined,
          customEndpoint: aiCustomEndpoint || undefined,
        }),
      });
      const json = (await response.json()) as DashboardAiModelsResponse;

      if (!json.ok) {
        throw new Error(json.error ?? "Unable to load AI models.");
      }

      const models = json.models ?? [];
      const nextModel = models.includes(aiModel) ? aiModel : models[0] ?? "";
      setAiModels(models);
      setAiModel(nextModel);

      if (!options?.silent) {
        setSuccess(`Loaded ${models.length} model(s) for ${getAiProviderLabel(aiProvider)}.`);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load AI models.";
      setError(message);
    } finally {
      setIsLoadingAiModels(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publerApiKey,
          workspaceProfiles: workspaceProfiles.map((profile) => ({
            workspaceId: profile.workspaceId,
            workspaceName: resolveWorkspaceName(profile.workspaceId, publerWorkspaces, profile.workspaceName),
            allowedDomains: parseAllowedDomains(profile.allowedDomainsInput),
            defaultAccountId: profile.defaultAccountId,
            defaultBoardId: profile.defaultBoardId,
            isDefault: profile.isDefault,
          })),
          aiProvider,
          aiApiKey,
          aiModel,
          aiCustomEndpoint,
        }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
        settings?: IntegrationSettingsSummary;
      };

      if (!json.ok || !json.settings) {
        throw new Error(json.error ?? "Unable to save settings.");
      }

      setHasStoredPublerKey(json.settings.hasPublerApiKey);
      setHasStoredAiKey(json.settings.hasAiApiKey);
      setCanUseStoredPublerKey(json.settings.canUsePublerApiKey);
      setCanUseStoredAiKey(json.settings.canUseAiApiKey);
      setWorkspaceProfiles(json.settings.workspaceProfiles.map(toWorkspaceProfileDraft));
      setStoredAiProvider(json.settings.aiProvider);
      setPublerCredentialMessage(json.settings.publerCredentialMessage);
      setAiCredentialMessage(json.settings.aiCredentialMessage);
      setPublerApiKey("");
      setAiApiKey("");
      setSuccess("Settings saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save settings.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!canLoadAiModels) {
      if (aiProvider === "custom_endpoint") {
        setAiModels([]);
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAiModels({ silent: true });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [aiProvider, aiApiKey, aiCustomEndpoint, canUseStoredAiKey, storedAiProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canLoadPublerWorkspaces || publerWorkspaces.length > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPublerWorkspaces({ silent: true });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canLoadPublerWorkspaces, publerWorkspaces.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    workspaceProfiles.forEach((profile, index) => {
      if (!profile.workspaceId) {
        return;
      }

      const accountsLoaded = Boolean(publerAccountsByWorkspace[profile.workspaceId]);
      const boardsLoaded = Boolean(
        publerBoardsByWorkspaceAccount[
          getWorkspaceBoardCacheKey(profile.workspaceId, profile.defaultAccountId)
        ],
      );

      if (!accountsLoaded || (profile.defaultAccountId && !boardsLoaded)) {
        void loadWorkspaceProfileOptions(index, profile.workspaceId, profile.defaultAccountId);
      }
    });
  }, [workspaceProfiles, publerAccountsByWorkspace, publerBoardsByWorkspaceAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
            Publer
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
            Publishing access
          </h2>
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
            Publer API key
          </label>
          <input
            type="password"
            value={publerApiKey}
            onChange={(event) => setPublerApiKey(event.target.value)}
            placeholder={
              hasStoredPublerKey
                ? "Stored key present. Re-enter only to replace it."
                : "Paste Publer API key"
            }
            className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
          />
          {hasStoredPublerKey && !canUseStoredPublerKey ? (
            <p className="mt-3 rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
              Stored Publer key is not usable in the current environment. {publerCredentialMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-5 rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Workspace profiles
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadPublerWorkspaces()}
                disabled={isLoadingPublerWorkspaces || !canLoadPublerWorkspaces}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                {isLoadingPublerWorkspaces ? "Loading..." : "Load workspaces"}
              </button>
              <button
                type="button"
                onClick={addWorkspaceProfile}
                disabled={publerWorkspaces.length === 0}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                Add profile
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {workspaceProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-4 text-sm text-[var(--dashboard-muted)]">
                No workspace profiles yet.
              </div>
            ) : (
              workspaceProfiles.map((profile, index) => {
                const accounts = publerAccountsByWorkspace[profile.workspaceId] ?? [];
                const boards =
                  publerBoardsByWorkspaceAccount[
                    getWorkspaceBoardCacheKey(profile.workspaceId, profile.defaultAccountId)
                  ] ?? [];

                return (
                  <div
                    key={`${profile.workspaceId || "new"}-${index}`}
                    className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4"
                  >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto]">
                    <select
                      value={profile.workspaceId}
                      onChange={(event) => handleWorkspaceSelection(index, event.target.value)}
                      className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                    >
                      <option value="">Select workspace</option>
                      {publerWorkspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={profile.allowedDomainsInput}
                      onChange={(event) =>
                        updateWorkspaceProfile(index, "allowedDomainsInput", event.target.value)
                      }
                      placeholder="mightypaint.com, anotherdomain.com"
                      className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDefaultWorkspaceProfile(index)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        profile.isDefault
                          ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
                          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
                      }`}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWorkspaceProfile(index)}
                      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                    >
                      Remove
                    </button>
                  </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <select
                        value={profile.defaultAccountId}
                        onChange={(event) => handleWorkspaceAccountSelection(index, event.target.value)}
                        className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                      >
                        <option value="">Default account</option>
                        {accounts.map((account) => (
                          <option key={String(account.id)} value={String(account.id)}>
                            {account.name ?? `${account.provider} ${account.id}`}
                          </option>
                        ))}
                      </select>
                      <select
                        value={profile.defaultBoardId}
                        onChange={(event) => updateWorkspaceProfile(index, "defaultBoardId", event.target.value)}
                        className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                      >
                        <option value="">Default board</option>
                        {boards.map((board) => (
                          <option key={board.id} value={board.id}>
                            {board.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              AI
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              Copy generation settings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void loadAiModels()}
            disabled={isLoadingAiModels || !canLoadAiModels || aiProvider === "custom_endpoint"}
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
          >
            {isLoadingAiModels ? "Loading..." : "Refresh models"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Provider
            </label>
            <select
              value={aiProvider}
              onChange={(event) => {
                const nextProvider = event.target.value as AIProvider;
                setAiProvider(nextProvider);
                setAiModel("");
                setAiModels([]);
              }}
              className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
            >
              {aiProviderOptions.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              API key
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(event) => setAiApiKey(event.target.value)}
              onBlur={() => void loadAiModels()}
              placeholder={
                hasStoredAiKey
                  ? "Stored key present. Re-enter only to replace it."
                  : "Paste AI provider API key"
              }
              className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
            />
            {hasStoredAiKey && !canUseStoredAiKey ? (
              <p className="mt-3 rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
                Stored AI key is not usable in the current environment. {aiCredentialMessage}
              </p>
            ) : null}
          </div>

          {aiProvider === "custom_endpoint" ? (
            <div className="md:col-span-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Custom endpoint
              </label>
              <input
                value={aiCustomEndpoint}
                onChange={(event) => setAiCustomEndpoint(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
              />
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Model list
            </label>
            <select
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
            >
              <option value="">Select model</option>
              {aiModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Model ID
            </label>
            <input
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              placeholder={
                aiProvider === "custom_endpoint" ? "Type model id" : "Select above or type model id"
              }
              className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </button>

        {success ? (
          <p className="rounded-full border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] px-4 py-2 text-sm text-[var(--dashboard-success-ink)]">{success}</p>
        ) : null}
        {error ? (
          <p className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm text-[var(--dashboard-danger-ink)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

function parseAllowedDomains(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

function toWorkspaceProfileDraft(profile: WorkspaceProfileSummary): WorkspaceProfileDraft {
  return {
    workspaceId: profile.workspaceId,
    workspaceName: profile.workspaceName,
    allowedDomainsInput: profile.allowedDomains.join(", "),
    isDefault: profile.isDefault,
    defaultAccountId: profile.defaultAccountId,
    defaultBoardId: profile.defaultBoardId,
  };
}

function syncProfileNames(
  profiles: WorkspaceProfileDraft[],
  workspaces: PublerWorkspace[],
): WorkspaceProfileDraft[] {
  return profiles.map((profile) => ({
    ...profile,
    workspaceName: resolveWorkspaceName(profile.workspaceId, workspaces, profile.workspaceName),
  }));
}

function resolveWorkspaceName(
  workspaceId: string,
  workspaces: PublerWorkspace[],
  fallbackName: string,
) {
  return workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? fallbackName ?? "";
}

function getWorkspaceBoardCacheKey(workspaceId: string, accountId: string) {
  return `${workspaceId}:${accountId || ""}`;
}

function getAiProviderLabel(provider: AIProvider) {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "gemini":
      return "Gemini";
    case "openrouter":
      return "OpenRouter";
    case "custom_endpoint":
    default:
      return "custom endpoint";
  }
}

