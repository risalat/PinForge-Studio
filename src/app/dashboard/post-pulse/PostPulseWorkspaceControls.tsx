"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DashboardPublerOptionsResponse } from "@/lib/types";
import type { PublerWorkspace } from "@/lib/publer/publerClient";
import { PostPulseSyncButton } from "@/app/dashboard/post-pulse/PostPulseSyncButton";

export function PostPulseWorkspaceControls({
  initialWorkspaceId,
}: {
  initialWorkspaceId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [workspaces, setWorkspaces] = useState<PublerWorkspace[]>([]);
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
          throw new Error(data.error ?? "Unable to load Publer workspaces.");
        }

        if (!isMounted) {
          return;
        }

        const nextWorkspaces = data.workspaces ?? [];
        setWorkspaces(nextWorkspaces);

        const nextWorkspaceId =
          initialWorkspaceId && nextWorkspaces.some((workspace) => workspace.id === initialWorkspaceId)
            ? initialWorkspaceId
            : data.selectedWorkspaceId ?? nextWorkspaces[0]?.id ?? "";

        setWorkspaceId(nextWorkspaceId);

        const currentWorkspaceId = searchParams.get("workspaceId") ?? "";
        if (nextWorkspaceId && currentWorkspaceId !== nextWorkspaceId) {
          updateWorkspaceQuery(nextWorkspaceId);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load Publer workspaces.");
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

  function updateWorkspaceQuery(nextWorkspaceId: string) {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (nextWorkspaceId) {
        nextParams.set("workspaceId", nextWorkspaceId);
      } else {
        nextParams.delete("workspaceId");
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function handleWorkspaceChange(nextWorkspaceId: string) {
    setWorkspaceId(nextWorkspaceId);
    updateWorkspaceQuery(nextWorkspaceId);
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <select
          value={workspaceId}
          onChange={(event) => handleWorkspaceChange(event.target.value)}
          disabled={isLoading || isNavigating}
          className="min-w-[240px] rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
        >
          <option value="">Select workspace</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <PostPulseSyncButton workspaceId={workspaceId} />
      </div>
      {error ? <p className="text-sm text-[var(--dashboard-danger-ink)]">{error}</p> : null}
      {!error && workspaces.length === 0 && !isLoading ? (
        <p className="text-sm text-[var(--dashboard-muted)]">
          Load a usable Publer API key in Integrations to choose a workspace here.
        </p>
      ) : null}
    </div>
  );
}
