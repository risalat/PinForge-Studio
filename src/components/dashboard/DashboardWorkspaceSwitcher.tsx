"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import type { DashboardPublerOptionsResponse, WorkspaceProfileSummary } from "@/lib/types";

export function DashboardWorkspaceSwitcher({
  initialWorkspaceId,
  workspaceProfiles,
}: {
  initialWorkspaceId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const options = workspaceProfiles.map((profile) => ({
    ...profile,
    workspaceName: resolvedNames[profile.workspaceId] ?? profile.workspaceName,
  }));

  useEffect(() => {
    setWorkspaceId(initialWorkspaceId);
  }, [initialWorkspaceId]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceNames() {
      setIsLoadingNames(true);

      try {
        const response = await fetch("/api/dashboard/settings/publer-options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const data = (await response.json()) as DashboardPublerOptionsResponse;

        if (!response.ok || !data.ok || !isMounted) {
          return;
        }

        setResolvedNames(
          Object.fromEntries((data.workspaces ?? []).map((workspace) => [workspace.id, workspace.name])),
        );
      } finally {
        if (isMounted) {
          setIsLoadingNames(false);
        }
      }
    }

    if (workspaceProfiles.length > 0) {
      void loadWorkspaceNames();
    }

    return () => {
      isMounted = false;
    };
  }, [workspaceProfiles]);

  function handleWorkspaceChange(nextWorkspaceId: string) {
    setWorkspaceId(nextWorkspaceId);
    setIsSavingWorkspace(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/dashboard/workspace", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: nextWorkspaceId,
          }),
        });

        if (response.ok) {
          router.refresh();
        }
      } finally {
        setIsSavingWorkspace(false);
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
        disabled={isSavingWorkspace || isPending || options.length === 0}
        className="mt-3 w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
      >
        <option value="">{options.length === 0 ? "No profiles yet" : "Select workspace"}</option>
        {options.map((profile) => (
          <option key={profile.workspaceId} value={profile.workspaceId}>
            {profile.workspaceName}
          </option>
        ))}
      </select>
      {isLoadingNames || isSavingWorkspace ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
          <BusyActionLabel
            busy
            label="Workspace ready"
            busyLabel={isSavingWorkspace ? "Switching workspace..." : "Loading workspaces..."}
          />
        </p>
      ) : null}
    </div>
  );
}
