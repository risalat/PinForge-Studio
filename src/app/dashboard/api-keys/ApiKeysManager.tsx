"use client";

import { useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import type { ApiKeyListItem } from "@/lib/types";

type ApiKeysResponse = {
  ok: boolean;
  apiKeys: ApiKeyListItem[];
};

export function ApiKeysManager({
  initialApiKeys,
}: {
  initialApiKeys: ApiKeyListItem[];
}) {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>(initialApiKeys);
  const [newKeyName, setNewKeyName] = useState("Extension local key");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const isCreating = activeAction === "create";

  async function loadApiKeys() {
    const response = await fetch("/api/dashboard/api-keys", {
      method: "GET",
      cache: "no-store",
    });
    const json = (await response.json()) as ApiKeysResponse;
    if (json.ok) {
      setApiKeys(json.apiKeys);
    }
  }

  async function handleCreate() {
    setActiveAction("create");
    setError(null);
    setGeneratedKey(null);

    try {
      const response = await fetch("/api/dashboard/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName,
        }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
        plaintextKey?: string;
      };

      if (!json.ok || !json.plaintextKey) {
        setError(json.error ?? "Unable to create API key.");
        return;
      }

      setGeneratedKey(json.plaintextKey);
      await loadApiKeys();
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRevoke(id: string) {
    setActiveAction(`revoke:${id}`);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/api-keys/${id}/revoke`, {
        method: "POST",
      });
      const json = (await response.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        setError(json.error ?? "Unable to revoke API key.");
        return;
      }

      await loadApiKeys();
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <section id="new-key" className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-6 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label
              htmlFor="api-key-name"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]"
            >
              New key label
            </label>
            <input
              id="api-key-name"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-base text-[var(--dashboard-text)] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={Boolean(activeAction) || newKeyName.trim() === ""}
            className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
          >
            <BusyActionLabel
              busy={isCreating}
              label="Create API key"
              busyLabel="Creating API key..."
              inverse
            />
          </button>
        </div>

        {generatedKey ? (
          <div className="mt-5 rounded-2xl border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
              Copy this key now
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">
              This plaintext key is shown once only. Store it in the extension settings before you
              leave this page.
            </p>
            <code className="mt-4 block overflow-x-auto rounded-xl bg-[#10203f] px-4 py-3 text-sm text-[#f4f8ff]">
              {generatedKey}
            </code>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-3 text-sm text-[var(--dashboard-danger-ink)]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] shadow-[var(--dashboard-shadow-sm)]">
        <table className="min-w-full divide-y divide-[var(--dashboard-line)]">
          <thead className="bg-[var(--dashboard-panel-alt)] text-left text-sm uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
            <tr>
              <th className="px-5 py-4">Label</th>
              <th className="px-5 py-4">Prefix</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Last used</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--dashboard-line)]">
            {apiKeys.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-[var(--dashboard-subtle)]" colSpan={6}>
                  No API keys yet.
                </td>
              </tr>
            ) : (
              apiKeys.map((apiKey) => (
                <tr key={apiKey.id}>
                  <td className="px-5 py-4 font-semibold text-[var(--dashboard-text)]">{apiKey.name}</td>
                  <td className="px-5 py-4 font-mono text-sm text-[var(--dashboard-subtle)]">{apiKey.keyPrefix}</td>
                  <td className="px-5 py-4 text-sm text-[var(--dashboard-subtle)]">
                    {new Date(apiKey.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--dashboard-subtle)]">
                    {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                        apiKey.isActive
                          ? "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
                          : "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
                      }`}
                    >
                      {apiKey.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {apiKey.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(apiKey.id)}
                        disabled={Boolean(activeAction)}
                        className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-subtle)] disabled:opacity-60"
                      >
                        <BusyActionLabel
                          busy={activeAction === `revoke:${apiKey.id}`}
                          label="Revoke"
                          busyLabel="Revoking..."
                        />
                      </button>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

