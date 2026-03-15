"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";

export function PostPulseFreshPinsButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreateFreshPins() {
    void (async () => {
      setIsPending(true);
      try {
        setError(null);
        const response = await fetch("/api/dashboard/post-pulse/fresh-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          result?: {
            jobId: string;
          };
        };

        if (!response.ok || !data.ok || !data.result?.jobId) {
          throw new Error(data.error ?? "Unable to create a fresh-pin job.");
        }

        router.push(`/dashboard/jobs/${data.result.jobId}`);
        router.refresh();
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "Unable to create a fresh-pin job.",
        );
      } finally {
        setIsPending(false);
      }
    })();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleCreateFreshPins}
        disabled={isPending}
        className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        <BusyActionLabel
          busy={isPending}
          label="Create fresh pins"
          busyLabel="Creating..."
          inverse
        />
      </button>
      {error ? <p className="text-sm text-[var(--dashboard-danger-ink)]">{error}</p> : null}
    </div>
  );
}
