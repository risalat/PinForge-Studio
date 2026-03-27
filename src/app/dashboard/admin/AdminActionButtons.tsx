"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import { useAppFeedback } from "@/components/ui/AppFeedbackProvider";

type ActionResponse = {
  ok?: boolean;
  error?: string;
  reused?: boolean;
  task?: {
    id: string;
    kind: string;
    status: string;
  };
};

export function AdminSyncWorkspaceButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { notify } = useAppFeedback();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/dashboard/admin/actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "trigger_publication_sync",
            workspaceId,
          }),
        });
        const data = (await response.json()) as ActionResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to queue publication sync.");
        }

        notify({
          title: data.reused ? "Sync already queued" : "Publication sync queued",
          message: data.reused
            ? `${workspaceName} already has an active sync task.`
            : `${workspaceName} was queued for a fresh Publer sync.`,
          tone: "success",
        });
        router.refresh();
      } catch (error) {
        notify({
          title: "Sync request failed",
          message: error instanceof Error ? error.message : "Unable to queue publication sync.",
          tone: "error",
        });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BusyActionLabel busy={isPending} label="Sync now" busyLabel="Queueing sync..." />
    </button>
  );
}

export function AdminTempCleanupButton({
  days,
  label = "Queue temp cleanup",
}: {
  days: number;
  label?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const { notify } = useAppFeedback();
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm(`Queue temp cleanup now for assets older than ${days} days?`)) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/dashboard/admin/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "queue_temp_cleanup",
          days,
          apply: true,
        }),
      });
      const data = (await response.json()) as ActionResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to queue temp cleanup.");
      }

      notify({
        title: data.reused ? "Cleanup already queued" : "Temp cleanup queued",
        message: data.reused
          ? `A cleanup task for ${days}-day stale assets is already active.`
          : `Cleanup for ${days}-day stale assets was queued.`,
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      notify({
        title: "Cleanup request failed",
        message: error instanceof Error ? error.message : "Unable to queue temp cleanup.",
        tone: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BusyActionLabel busy={isPending} label={label} busyLabel="Queueing cleanup..." inverse />
    </button>
  );
}

export function AdminRetryFailedTaskButton({
  taskId,
}: {
  taskId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const { notify } = useAppFeedback();
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm("Retry this failed task now?")) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/dashboard/admin/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "retry_failed_task",
          taskId,
        }),
      });
      const data = (await response.json()) as ActionResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to retry this task.");
      }

      notify({
        title: "Task requeued",
        message: "The failed task was moved back into the queue.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      notify({
        title: "Retry request failed",
        message: error instanceof Error ? error.message : "Unable to retry this task.",
        tone: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BusyActionLabel busy={isPending} label="Retry task" busyLabel="Retrying..." />
    </button>
  );
}
