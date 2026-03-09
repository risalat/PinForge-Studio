"use client";

import { useEffect, useState } from "react";
import type { AIProvider } from "@/lib/ai";
import type { DashboardAiModelsResponse, IntegrationSettingsSummary } from "@/lib/types";

const aiProviderOptions: Array<{ value: AIProvider; label: string }> = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom_endpoint", label: "Custom endpoint" },
];

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: IntegrationSettingsSummary;
}) {
  const [publerApiKey, setPublerApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<AIProvider>(initialSettings.aiProvider);
  const [storedAiProvider, setStoredAiProvider] = useState<AIProvider>(initialSettings.aiProvider);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState(initialSettings.aiModel);
  const [aiCustomEndpoint, setAiCustomEndpoint] = useState(initialSettings.aiCustomEndpoint);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [hasStoredPublerKey, setHasStoredPublerKey] = useState(initialSettings.hasPublerApiKey);
  const [hasStoredAiKey, setHasStoredAiKey] = useState(initialSettings.hasAiApiKey);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState(false);

  const canLoadAiModels =
    aiProvider === "custom_endpoint"
      ? aiCustomEndpoint.trim() !== ""
      : aiApiKey.trim() !== "" || (hasStoredAiKey && aiProvider === storedAiProvider);

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
      setStoredAiProvider(json.settings.aiProvider);
      setPublerApiKey("");
      setAiApiKey("");
      setSuccess("Settings saved. Publer board selection can happen later during scheduling.");
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
  }, [aiProvider, aiApiKey, aiCustomEndpoint, hasStoredAiKey, storedAiProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(60,40,18,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]">
            Publer
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">
            Publishing access
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e4a2b]">
            Store only the Publer API key here. Workspace, Pinterest account, and board selection
            will happen later in the scheduling flow after pins are generated.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
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
            className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
          />
          <p className="mt-2 text-xs text-[#8a572a]">
            {hasStoredPublerKey
              ? "A Publer key is already stored securely. Leaving this blank keeps the saved key."
              : "This key will be reused later when you open the publishing flow for generated pins."}
          </p>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(60,40,18,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]">
              AI
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">
              Copy generation settings
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e4a2b]">
              Choose a provider, paste the API key, and Studio will load the available model list
              automatically so you can lock the model once.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAiModels()}
            disabled={isLoadingAiModels || !canLoadAiModels || aiProvider === "custom_endpoint"}
            className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a] disabled:opacity-60"
          >
            {isLoadingAiModels ? "Loading..." : "Refresh models"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
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
              className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
            >
              {aiProviderOptions.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
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
              className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
            />
            <p className="mt-2 text-xs text-[#8a572a]">
              {hasStoredAiKey && aiProvider === storedAiProvider
                ? `A ${getAiProviderLabel(storedAiProvider)} key is already stored securely.`
                : "After you leave this field, Studio will try to load the model catalog."}
            </p>
          </div>

          {aiProvider === "custom_endpoint" ? (
            <div className="md:col-span-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
                Custom endpoint
              </label>
              <input
                value={aiCustomEndpoint}
                onChange={(event) => setAiCustomEndpoint(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
              />
              <p className="mt-2 text-xs text-[#8a572a]">
                Custom endpoints use a manual model ID. Studio will keep the provider architecture
                but will not auto-discover models here.
              </p>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
              Model list
            </label>
            <select
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
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
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a572a]">
              Model ID
            </label>
            <input
              value={aiModel}
              onChange={(event) => setAiModel(event.target.value)}
              placeholder={
                aiProvider === "custom_endpoint" ? "Type model id" : "Select above or type model id"
              }
              className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-full bg-[#2c1c12] px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save settings"}
        </button>

        {success ? <p className="text-sm text-[#40633e]">{success}</p> : null}
        {error ? <p className="text-sm text-[#9b4328]">{error}</p> : null}
      </div>
    </div>
  );
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
