"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PostPulseSyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    startTransition(async () => {
      try {
        setFeedback(null);
        setError(null);
        const response = await fetch("/api/dashboard/post-pulse/sync", {
          method: "POST",
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          result?: {
            fetched: number;
            created: number;
            updated: number;
          };
        };

        if (!response.ok || !data.ok || !data.result) {
          throw new Error(data.error ?? "Unable to sync Publer activity.");
        }

        setFeedback(
          `Synced ${data.result.fetched} Publer post${data.result.fetched === 1 ? "" : "s"} (${data.result.created} new, ${data.result.updated} updated).`,
        );
        router.refresh();
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : "Unable to sync Publer activity.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="rounded-full bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
      >
        {isPending ? "Syncing Publer..." : "Sync Publer now"}
      </button>
      {feedback ? (
        <p className="text-sm text-[var(--dashboard-success-ink)]">{feedback}</p>
      ) : null}
      {error ? <p className="text-sm text-[var(--dashboard-danger-ink)]">{error}</p> : null}
    </div>
  );
}
