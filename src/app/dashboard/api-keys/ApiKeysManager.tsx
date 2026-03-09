"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

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

  function handleCreate() {
    startTransition(async () => {
      setError(null);
      setGeneratedKey(null);

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
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      setError(null);

      const response = await fetch(`/api/dashboard/api-keys/${id}/revoke`, {
        method: "POST",
      });
      const json = (await response.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        setError(json.error ?? "Unable to revoke API key.");
        return;
      }

      await loadApiKeys();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(60,40,18,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label
              htmlFor="api-key-name"
              className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              New key label
            </label>
            <input
              id="api-key-name"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[#e0cdb8] bg-[#fffaf4] px-4 py-3 text-base text-[#23160d] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || newKeyName.trim() === ""}
            className="rounded-full bg-[#2c1c12] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#f7ede0] disabled:opacity-60"
          >
            Create API key
          </button>
        </div>

        {generatedKey ? (
          <div className="mt-5 rounded-2xl border border-[#d8c18d] bg-[#fff8df] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a572a]">
              Copy this key now
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6b4b2a]">
              This plaintext key is shown once only. Store it in the extension settings before you
              leave this page.
            </p>
            <code className="mt-4 block overflow-x-auto rounded-xl bg-[#2c1c12] px-4 py-3 text-sm text-[#f7ede0]">
              {generatedKey}
            </code>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#e7b6a6] bg-[#fff1ed] px-4 py-3 text-sm text-[#9b4328]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_rgba(60,40,18,0.08)]">
        <table className="min-w-full divide-y divide-[#eadccf]">
          <thead className="bg-[#f7efe6] text-left text-sm uppercase tracking-[0.22em] text-[#8a572a]">
            <tr>
              <th className="px-5 py-4">Label</th>
              <th className="px-5 py-4">Prefix</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Last used</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2e6da]">
            {apiKeys.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-[#6e4a2b]" colSpan={6}>
                  No API keys yet.
                </td>
              </tr>
            ) : (
              apiKeys.map((apiKey) => (
                <tr key={apiKey.id}>
                  <td className="px-5 py-4 font-semibold text-[#23160d]">{apiKey.name}</td>
                  <td className="px-5 py-4 font-mono text-sm text-[#6e4a2b]">{apiKey.keyPrefix}</td>
                  <td className="px-5 py-4 text-sm text-[#6e4a2b]">
                    {new Date(apiKey.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6e4a2b]">
                    {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                        apiKey.isActive
                          ? "bg-[#e8f4e8] text-[#40633e]"
                          : "bg-[#f3e2e0] text-[#924d3c]"
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
                        disabled={isPending}
                        className="rounded-full border border-[#d8b690] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a] disabled:opacity-60"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">
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
