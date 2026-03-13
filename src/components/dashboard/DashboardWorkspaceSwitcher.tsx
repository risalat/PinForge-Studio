"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DashboardPublerOptionsResponse } from "@/lib/types";

type WorkspaceItem = {
  id: string;
  name: string;
};

export function DashboardWorkspaceSwitcher({
  initialWorkspaceId,
}: {
  initialWorkspaceId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWorkspaceId(initialWorkspaceId);
  }, [initialWorkspaceId]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaces() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/dashboard/settings/publer-options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: initialWorkspaceId || undefined,
          }),
        });
        const data = (await response.json()) as DashboardPublerOptionsResponse;

        if (!response.ok || !data.ok) {
          const message = data.error ?? "Unable to load workspaces.";
          if (message.includes("Publer API key")) {
            if (isMounted) {
              setWorkspaces([]);
              setWorkspaceId("");
            }
            return;
          }
          throw new Error(data.error ?? "Unable to load workspaces.");
        }

        if (!isMounted) {
          return;
        }

        const nextWorkspaces = data.workspaces ?? [];
        setWorkspaces(nextWorkspaces);

        const nextWorkspaceId =
          workspaceId && nextWorkspaces.some((item) => item.id === workspaceId)
            ? workspaceId
            : initialWorkspaceId && nextWorkspaces.some((item) => item.id === initialWorkspaceId)
              ? initialWorkspaceId
              : data.selectedWorkspaceId ?? nextWorkspaces[0]?.id ?? "";

        setWorkspaceId(nextWorkspaceId);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load workspaces.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [initialWorkspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleWorkspaceChange(nextWorkspaceId: string) {
    setWorkspaceId(nextWorkspaceId);

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch("/api/dashboard/workspace", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: nextWorkspaceId,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Unable to change workspace.");
        }

        router.refresh();
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "Unable to change workspace.",
        );
      }
    });
  }

  return (
    <div className="mt-5 rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
        Workspace
      </p>
      <select
        value={workspaceId}
        onChange={(event) => handleWorkspaceChange(event.target.value)}
        disabled={isLoading || isPending || workspaces.length === 0}
        className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
      >
        <option value="">{isLoading ? "Loading..." : "Select workspace"}</option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-xs text-[var(--dashboard-danger-ink)]">{error}</p>
      ) : null}
    </div>
  );
}
