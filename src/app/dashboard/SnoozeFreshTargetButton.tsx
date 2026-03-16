"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAppFeedback } from "@/components/ui/AppFeedbackProvider";

export function SnoozeFreshTargetButton(input: {
  postId: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);

  function snooze() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/dashboard/fresh-targets/snooze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId: input.postId,
            workspaceId: input.workspaceId,
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to snooze target.");
        }

        setIsDone(true);
        notify({
          tone: "success",
          title: "Target snoozed",
          message: "This post is hidden from today’s fresh-pin targets for 7 days.",
        });
        router.refresh();
      } catch (error) {
        notify({
          tone: "error",
          title: "Snooze failed",
          message: error instanceof Error ? error.message : "Unable to snooze target.",
          sticky: true,
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={snooze}
      disabled={isPending || isDone}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Snoozing..." : isDone ? "Snoozed" : "Snooze 7 days"}
    </button>
  );
}
