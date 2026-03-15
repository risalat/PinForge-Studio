"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";

export function PostPulseSyncButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    if (!workspaceId) {
      setFeedback(null);
      setError("Select a Publer workspace first.");
      return;
    }

    void (async () => {
      setIsPending(true);
      try {
        setFeedback(null);
        setError(null);
        type SyncResponse = {
          ok?: boolean;
          error?: string;
          result?: SyncResult;
        };
        type SyncResult = {
            fetched: number;
            created: number;
            updated: number;
            pagesProcessed: number;
            hasMore: boolean;
            mode: "backfill" | "incremental";
            nextPage: number | null;
        };
        let totalFetched = 0;
        let totalCreated = 0;
        let totalUpdated = 0;
        let hasMore = false;
        let mode: SyncResult["mode"] = "incremental";

        setFeedback("Syncing Publer activity...");

        const response = await fetch("/api/dashboard/post-pulse/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId,
          }),
        });
        const rawText = await response.text();
        let data: SyncResponse | null = null;

        try {
          data = rawText ? (JSON.parse(rawText) as SyncResponse) : null;
        } catch {
          data = null;
        }

        if (!response.ok || !data?.ok || !data.result) {
          throw new Error(
            data?.error ??
              rawText?.trim() ??
              "Unable to sync Publer activity.",
          );
        }

        totalFetched += data.result.fetched;
        totalCreated += data.result.created;
        totalUpdated += data.result.updated;
        hasMore = data.result.hasMore;
        mode = data.result.mode;

        setFeedback(
          hasMore
            ? `Partially synced ${totalFetched} Publer posts (${totalCreated} new, ${totalUpdated} updated). More history remains; click again to continue.`
            : mode === "backfill"
              ? `Backfill complete. Synced ${totalFetched} Publer posts (${totalCreated} new, ${totalUpdated} updated).`
              : `Synced ${totalFetched} Publer post${totalFetched === 1 ? "" : "s"} (${totalCreated} new, ${totalUpdated} updated).`,
        );
        router.refresh();
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : "Unable to sync Publer activity.");
      } finally {
        setIsPending(false);
      }
    })();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending || !workspaceId}
        className="rounded-full dashboard-accent-action dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
      >
        <BusyActionLabel
          busy={isPending}
          label="Sync Publer now"
          busyLabel="Syncing Publer..."
          inverse
        />
      </button>
      {feedback ? (
        <p className="text-sm text-[var(--dashboard-success-ink)]">{feedback}</p>
      ) : null}
      {error ? <p className="text-sm text-[var(--dashboard-danger-ink)]">{error}</p> : null}
    </div>
  );
}

