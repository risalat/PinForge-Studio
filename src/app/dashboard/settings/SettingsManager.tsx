"use client";

import { useEffect, useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import type { AIProvider } from "@/lib/ai";
import type {
  AiCredentialSummary,
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
  sitemapUrlsInput: string;
  dailyPublishTargetInput: string;
  isDefault: boolean;
  defaultAccountId: string;
  defaultBoardId: string;
};

type AiCredentialDraft = {
  id: string;
  label: string;
  provider: AIProvider;
  apiKeyInput: string;
  model: string;
  customEndpoint: string;
  isDefault: boolean;
  hasStoredKey: boolean;
  canUseStoredKey: boolean;
  credentialState: "missing" | "ready" | "unavailable";
  credentialMessage: string;
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
  const [publerWorkspaces, setPublerWorkspaces] = useState<PublerWorkspace[]>([]);
  const [publerAccountsByWorkspace, setPublerAccountsByWorkspace] = useState<
    Record<string, PublerAccount[]>
  >({});
  const [publerBoardsByWorkspaceAccount, setPublerBoardsByWorkspaceAccount] = useState<
    Record<string, PinterestBoard[]>
  >({});
  const [aiCredentials, setAiCredentials] = useState<AiCredentialDraft[]>(
    initialSettings.aiCredentials.map(toAiCredentialDraft),
  );
  const [aiModelsByCredentialKey, setAiModelsByCredentialKey] = useState<Record<string, string[]>>({});
  const [loadingAiCredentialIndex, setLoadingAiCredentialIndex] = useState<number | null>(null);
  const [aiModelLoadErrorByCredentialKey, setAiModelLoadErrorByCredentialKey] = useState<
    Record<string, string>
  >({});
  const [hasStoredPublerKey, setHasStoredPublerKey] = useState(initialSettings.hasPublerApiKey);
  const [canUseStoredPublerKey, setCanUseStoredPublerKey] = useState(initialSettings.canUsePublerApiKey);
  const [publerCredentialMessage, setPublerCredentialMessage] = useState(
    initialSettings.publerCredentialMessage,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPublerWorkspaces, setIsLoadingPublerWorkspaces] = useState(false);
  const [loadingWorkspaceProfileIndex, setLoadingWorkspaceProfileIndex] = useState<number | null>(
    null,
  );

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
          sitemapUrlsInput: "",
          dailyPublishTargetInput: "",
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
      setLoadingWorkspaceProfileIndex(index);
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
    } finally {
      setLoadingWorkspaceProfileIndex((current) => (current === index ? null : current));
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

  function addAiCredential() {
    setAiCredentials((current) => [
      ...current,
      {
        id: "",
        label: "",
        provider: "gemini",
        apiKeyInput: "",
        model: "",
        customEndpoint: "",
        isDefault: current.length === 0,
        hasStoredKey: false,
        canUseStoredKey: false,
        credentialState: "missing",
        credentialMessage: "",
      },
    ]);
  }

  function updateAiCredential<K extends keyof AiCredentialDraft>(
    index: number,
    key: K,
    value: AiCredentialDraft[K],
  ) {
    const cacheKey = getAiCredentialCacheKey(aiCredentials[index], index);
    setAiCredentials((current) =>
      current.map((credential, currentIndex) =>
        currentIndex === index
          ? {
              ...credential,
              [key]: value,
            }
          : credential,
      ),
    );
    if (key === "provider" || key === "apiKeyInput" || key === "customEndpoint") {
      setAiModelsByCredentialKey((current) => {
        const next = { ...current };
        delete next[cacheKey];
        return next;
      });
      setAiModelLoadErrorByCredentialKey((current) => {
        const next = { ...current };
        delete next[cacheKey];
        return next;
      });
    }
  }

  function setDefaultAiCredential(index: number) {
    setAiCredentials((current) =>
      current.map((credential, currentIndex) => ({
        ...credential,
        isDefault: currentIndex === index,
      })),
    );
  }

  function removeAiCredential(index: number) {
    setAiCredentials((current) => {
      const nextCredentials = current.filter((_, currentIndex) => currentIndex !== index);
      if (nextCredentials.length > 0 && !nextCredentials.some((credential) => credential.isDefault)) {
        nextCredentials[0] = {
          ...nextCredentials[0],
          isDefault: true,
        };
      }
      return nextCredentials;
    });
  }

  async function loadAiModels(index: number) {
    const credential = aiCredentials[index];
    if (!credential) {
      return;
    }

    const cacheKey = getAiCredentialCacheKey(credential, index);

    setLoadingAiCredentialIndex(index);
    setAiModelLoadErrorByCredentialKey((current) => {
      const next = { ...current };
      delete next[cacheKey];
      return next;
    });
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/dashboard/settings/ai-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: credential.provider,
          credentialId: credential.id || undefined,
          apiKey: credential.apiKeyInput || undefined,
          model: credential.model || undefined,
          customEndpoint: credential.customEndpoint || undefined,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
        models?: string[];
      };

      if (!json.ok) {
        throw new Error(json.error ?? "Unable to load models.");
      }

      const models = Array.from(new Set((json.models ?? []).filter(Boolean)));
      setAiModelsByCredentialKey((current) => ({
        ...current,
        [cacheKey]:
          credential.model && !models.includes(credential.model)
            ? [credential.model, ...models]
            : models,
      }));
      setSuccess(models.length > 0 ? `Loaded ${models.length} models.` : "No models returned for this key.");
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load models.";
      setAiModelLoadErrorByCredentialKey((current) => ({
        ...current,
        [cacheKey]: message,
      }));
    } finally {
      setLoadingAiCredentialIndex((current) => (current === index ? null : current));
    }
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
            sitemapUrls: parseSitemapUrls(profile.sitemapUrlsInput),
            dailyPublishTarget: parseDailyPublishTarget(profile.dailyPublishTargetInput),
            defaultAccountId: profile.defaultAccountId,
            defaultBoardId: profile.defaultBoardId,
            isDefault: profile.isDefault,
          })),
          aiCredentials: aiCredentials.map((credential) => ({
            id: credential.id || undefined,
            label: credential.label,
            provider: credential.provider,
            apiKey: credential.apiKeyInput || undefined,
            model: credential.model,
            customEndpoint: credential.customEndpoint,
            isDefault: credential.isDefault,
          })),
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
      setCanUseStoredPublerKey(json.settings.canUsePublerApiKey);
      setWorkspaceProfiles(json.settings.workspaceProfiles.map(toWorkspaceProfileDraft));
      setAiCredentials(json.settings.aiCredentials.map(toAiCredentialDraft));
      setPublerCredentialMessage(json.settings.publerCredentialMessage);
      setPublerApiKey("");
      setSuccess("Settings saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save settings.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!canLoadPublerWorkspaces) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPublerWorkspaces({ silent: true });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canLoadPublerWorkspaces]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex flex-wrap items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
        >
          <BusyActionLabel
            busy={isSaving}
            label="Save settings"
            busyLabel="Saving settings..."
            inverse
          />
        </button>

        {success ? (
          <p className="rounded-full border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] px-4 py-2 text-sm text-[var(--dashboard-success-ink)]">{success}</p>
        ) : null}
        {error ? (
          <p className="rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-2 text-sm text-[var(--dashboard-danger-ink)]">{error}</p>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
        <div className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Publer
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Publishing access</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadPublerWorkspaces()}
                disabled={isLoadingPublerWorkspaces || !canLoadPublerWorkspaces}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                <BusyActionLabel
                  busy={isLoadingPublerWorkspaces}
                  label="Load workspaces"
                  busyLabel="Loading..."
                />
              </button>
              <button
                type="button"
                onClick={addWorkspaceProfile}
                disabled={publerWorkspaces.length === 0}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                Add profile
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <FieldLabel>Publer API key</FieldLabel>
            <div className="space-y-3">
              <input
                type="password"
                value={publerApiKey}
                onChange={(event) => setPublerApiKey(event.target.value)}
                placeholder={
                  hasStoredPublerKey
                    ? "Stored key present. Re-enter only to replace it."
                    : "Paste Publer API key"
                }
                className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
              />
              {hasStoredPublerKey && !canUseStoredPublerKey ? (
                <p className="rounded-2xl border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-3 text-sm text-[var(--dashboard-warning-ink)]">
                  Stored Publer key is not usable in the current environment. {publerCredentialMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--dashboard-line)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1420px] w-full table-fixed">
                <thead className="bg-[var(--dashboard-panel-alt)]">
                  <tr className="text-left">
                    <SettingsHead className="w-[16%]">Workspace</SettingsHead>
                    <SettingsHead className="w-[16%]">Domains</SettingsHead>
                    <SettingsHead className="w-[22%]">Sitemaps</SettingsHead>
                    <SettingsHead className="w-[10%]">Daily target</SettingsHead>
                    <SettingsHead className="w-[14%]">Account</SettingsHead>
                    <SettingsHead className="w-[14%]">Board</SettingsHead>
                    <SettingsHead className="w-[8%]">Actions</SettingsHead>
                  </tr>
                </thead>
                <tbody>
                  {workspaceProfiles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-5 text-sm text-[var(--dashboard-subtle)]"
                      >
                        No workspace profiles yet.
                      </td>
                    </tr>
                  ) : (
                    workspaceProfiles.map((profile, index) => {
                      const accounts = publerAccountsByWorkspace[profile.workspaceId] ?? [];
                      const boards =
                        publerBoardsByWorkspaceAccount[
                          getWorkspaceBoardCacheKey(profile.workspaceId, profile.defaultAccountId)
                        ] ?? [];

                      return (
                        <tr
                          key={`${profile.workspaceId || "new"}-${index}`}
                          className={index === workspaceProfiles.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              <select
                                value={profile.workspaceId}
                                onChange={(event) => handleWorkspaceSelection(index, event.target.value)}
                                disabled={loadingWorkspaceProfileIndex === index}
                                className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                              >
                                <option value="">Select workspace</option>
                                {publerWorkspaces.map((workspace) => (
                                  <option key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                  </option>
                                ))}
                              </select>
                              {loadingWorkspaceProfileIndex === index ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                                  <BusyActionLabel busy label="Ready" busyLabel="Loading..." />
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <input
                              value={profile.allowedDomainsInput}
                              onChange={(event) =>
                                updateWorkspaceProfile(index, "allowedDomainsInput", event.target.value)
                              }
                              placeholder="mightypaint.com, anotherdomain.com"
                              className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                            />
                          </td>
                          <td className="px-5 py-4 align-top">
                            <textarea
                              rows={3}
                              value={profile.sitemapUrlsInput}
                              onChange={(event) =>
                                updateWorkspaceProfile(index, "sitemapUrlsInput", event.target.value)
                              }
                              placeholder={"https://mightypaint.com/post-sitemap.xml\nhttps://mightypaint.com/post-sitemap2.xml"}
                              className="w-full resize-y rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                            />
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={profile.dailyPublishTargetInput}
                                onChange={(event) =>
                                  updateWorkspaceProfile(index, "dailyPublishTargetInput", event.target.value)
                                }
                                placeholder="20"
                                className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                              />
                              <p className="text-xs leading-5 text-[var(--dashboard-muted)]">
                                Leave blank to use the default target of 20.
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <select
                              value={profile.defaultAccountId}
                              onChange={(event) => handleWorkspaceAccountSelection(index, event.target.value)}
                              disabled={loadingWorkspaceProfileIndex === index}
                              className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                            >
                              <option value="">Default account</option>
                              {accounts.map((account) => (
                                <option key={String(account.id)} value={String(account.id)}>
                                  {account.name ?? `${account.provider} ${account.id}`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <select
                              value={profile.defaultBoardId}
                              onChange={(event) => updateWorkspaceProfile(index, "defaultBoardId", event.target.value)}
                              disabled={loadingWorkspaceProfileIndex === index}
                              className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                            >
                              <option value="">Default board</option>
                              {boards.map((board) => (
                                <option key={board.id} value={board.id}>
                                  {board.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setDefaultWorkspaceProfile(index)}
                                disabled={loadingWorkspaceProfileIndex === index}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                                  profile.isDefault
                                    ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
                                    : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
                                } disabled:opacity-60`}
                              >
                                {profile.isDefault ? "Default" : "Make default"}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeWorkspaceProfile(index)}
                                disabled={loadingWorkspaceProfileIndex === index}
                                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
        <div className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                AI
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">Copy generation keys</h2>
            </div>
            <button
              type="button"
              onClick={addAiCredential}
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
            >
              Add key
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full table-fixed">
              <thead className="bg-[var(--dashboard-panel-alt)]">
                <tr className="text-left">
                  <SettingsHead className="w-[18%]">Label</SettingsHead>
                  <SettingsHead className="w-[16%]">Provider</SettingsHead>
                  <SettingsHead className="w-[24%]">API key</SettingsHead>
                  <SettingsHead className="w-[18%]">Model</SettingsHead>
                  <SettingsHead className="w-[14%]">Endpoint</SettingsHead>
                  <SettingsHead className="w-[10%]">Actions</SettingsHead>
                </tr>
              </thead>
              <tbody>
                {aiCredentials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-5 text-sm text-[var(--dashboard-subtle)]">
                      No AI keys saved yet.
                    </td>
                  </tr>
                ) : (
                  aiCredentials.map((credential, index) => (
                    <tr
                      key={getAiCredentialCacheKey(credential, index)}
                      className={index === aiCredentials.length - 1 ? "" : "border-b border-[var(--dashboard-line)]"}
                    >
                      <td className="px-5 py-4 align-top">
                        <input
                          value={credential.label}
                          onChange={(event) => updateAiCredential(index, "label", event.target.value)}
                          placeholder="Primary Gemini"
                          className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                        />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <select
                          value={credential.provider}
                          onChange={(event) =>
                            updateAiCredential(index, "provider", event.target.value as AIProvider)
                          }
                          className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                        >
                          {aiProviderOptions.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <input
                            type="password"
                            value={credential.apiKeyInput}
                            onChange={(event) => updateAiCredential(index, "apiKeyInput", event.target.value)}
                            placeholder={
                              credential.hasStoredKey
                                ? "Stored key present. Re-enter only to replace it."
                                : "Paste API key"
                            }
                            className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                          />
                          {credential.credentialState === "unavailable" ? (
                            <p className="text-sm text-[var(--dashboard-warning-ink)]">
                              {credential.credentialMessage}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          {(() => {
                            const cacheKey = getAiCredentialCacheKey(credential, index);
                            const loadedModels = aiModelsByCredentialKey[cacheKey] ?? [];
                            const hasLoadedModels = loadedModels.length > 0;
                            const modelOptions =
                              credential.model && !loadedModels.includes(credential.model)
                                ? [credential.model, ...loadedModels]
                                : loadedModels;

                            return (
                              <>
                                {hasLoadedModels ? (
                                  <select
                                    value={credential.model}
                                    onChange={(event) => updateAiCredential(index, "model", event.target.value)}
                                    className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                                  >
                                    <option value="">Select model</option>
                                    {modelOptions.map((model) => (
                                      <option key={model} value={model}>
                                        {model}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    value={credential.model}
                                    onChange={(event) => updateAiCredential(index, "model", event.target.value)}
                                    placeholder="gemini-2.5-flash"
                                    className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => void loadAiModels(index)}
                                  disabled={loadingAiCredentialIndex === index}
                                  className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
                                >
                                  <BusyActionLabel
                                    busy={loadingAiCredentialIndex === index}
                                    label="Load models"
                                    busyLabel="Loading..."
                                  />
                                </button>
                                {aiModelLoadErrorByCredentialKey[cacheKey] ? (
                                  <p className="text-sm text-[var(--dashboard-danger-ink)]">
                                    {aiModelLoadErrorByCredentialKey[cacheKey]}
                                  </p>
                                ) : null}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <input
                          value={credential.customEndpoint}
                          onChange={(event) =>
                            updateAiCredential(index, "customEndpoint", event.target.value)
                          }
                          placeholder={credential.provider === "custom_endpoint" ? "https://..." : "Optional"}
                          className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                        />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setDefaultAiCredential(index)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                              credential.isDefault
                                ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
                                : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
                            }`}
                          >
                            {credential.isDefault ? "Default" : "Make default"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAiCredential(index)}
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
          <BusyActionLabel
            busy={isSaving}
            label="Save settings"
            busyLabel="Saving settings..."
            inverse
          />
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

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
      {children}
    </p>
  );
}

function SettingsHead({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

function parseAllowedDomains(input: string) {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

function parseSitemapUrls(input: string) {
  return input
    .split(/[\r\n,]+/)
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

function parseDailyPublishTarget(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function toWorkspaceProfileDraft(profile: WorkspaceProfileSummary): WorkspaceProfileDraft {
  return {
    workspaceId: profile.workspaceId,
    workspaceName: profile.workspaceName,
    allowedDomainsInput: profile.allowedDomains.join(", "),
    sitemapUrlsInput: profile.sitemapUrls.join("\n"),
    dailyPublishTargetInput:
      typeof profile.dailyPublishTarget === "number" ? String(profile.dailyPublishTarget) : "",
    isDefault: profile.isDefault,
    defaultAccountId: profile.defaultAccountId,
    defaultBoardId: profile.defaultBoardId,
  };
}

function toAiCredentialDraft(credential: AiCredentialSummary): AiCredentialDraft {
  return {
    id: credential.id,
    label: credential.label,
    provider: credential.provider,
    apiKeyInput: "",
    model: credential.model,
    customEndpoint: credential.customEndpoint,
    isDefault: credential.isDefault,
    hasStoredKey: credential.hasApiKey,
    canUseStoredKey: credential.canUseApiKey,
    credentialState: credential.credentialState,
    credentialMessage: credential.credentialMessage,
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

function getAiCredentialCacheKey(credential: AiCredentialDraft, index: number) {
  return `${credential.id || "new"}-${index}`;
}

