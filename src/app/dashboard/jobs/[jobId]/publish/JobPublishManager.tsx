/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildSchedulePreview } from "@/lib/jobs/schedulePreview";

type PinItem = {
  id: string;
  templateId: string;
  exportPath: string;
  mediaStatus: string;
  mediaId: string | null;
  mediaError: string | null;
  title: string;
  description: string;
  titleStatus: string;
  descriptionStatus: string;
  scheduleStatus: string;
  scheduledFor: string | null;
  scheduleError: string | null;
};

type PublerWorkspace = {
  id: string;
  name: string;
};

type PublerAccount = {
  id: string | number;
  provider: string;
  name?: string;
};

type PublerBoard = {
  accountId: string;
  id: string;
  name: string;
};

type JobPublishManagerProps = {
  jobId: string;
  jobStatus: string;
  pins: PinItem[];
  defaults: {
    workspaceId: string;
    accountId: string;
    boardId: string;
  };
  integrationReady: {
    hasPublerApiKey: boolean;
    hasAiApiKey: boolean;
  };
  latestScheduleRun: {
    id: string;
    status: string;
    submittedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
  } | null;
};

type PublishActionResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  message: string;
  failures: Array<{
    pinId: string;
    reason: string;
  }>;
  scheduleRunId?: string;
};

type BannerState = {
  tone: "success" | "warning" | "error";
  message: string;
} | null;

type PublerOptionsResponse = {
  ok: boolean;
  error?: string;
  workspaces?: PublerWorkspace[];
  accounts?: PublerAccount[];
  boards?: PublerBoard[];
  selectedWorkspaceId?: string;
  selectedAccountId?: string;
};

type BoardDistributionMode = "round_robin" | "first_selected" | "primary_weighted";

export function JobPublishManager({
  jobId,
  jobStatus,
  pins,
  defaults,
  integrationReady,
  latestScheduleRun,
}: JobPublishManagerProps) {
  const router = useRouter();
  const [copyState, setCopyState] = useState(
    pins.map((pin) => ({
      generatedPinId: pin.id,
      title: pin.title,
      description: pin.description,
    })),
  );
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>(pins.map((pin) => pin.id));
  const [firstPublishAt, setFirstPublishAt] = useState("");
  const [intervalDays, setIntervalDays] = useState(1);
  const [jitterDays, setJitterDays] = useState(0);
  const [workspaceId, setWorkspaceId] = useState(defaults.workspaceId);
  const [accountId, setAccountId] = useState(defaults.accountId);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>(
    defaults.boardId ? [defaults.boardId] : [],
  );
  const [boardDistributionMode, setBoardDistributionMode] =
    useState<BoardDistributionMode>("round_robin");
  const [primaryBoardId, setPrimaryBoardId] = useState(defaults.boardId);
  const [primaryBoardPercent, setPrimaryBoardPercent] = useState(60);
  const [workspaces, setWorkspaces] = useState<PublerWorkspace[]>([]);
  const [accounts, setAccounts] = useState<PublerAccount[]>([]);
  const [boards, setBoards] = useState<PublerBoard[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isPending, startTransition] = useTransition();

  const copyByPinId = useMemo(
    () =>
      new Map(
        copyState.map((copy) => [
          copy.generatedPinId,
          {
            title: copy.title,
            description: copy.description,
          },
        ]),
      ),
    [copyState],
  );

  const selectedPins = useMemo(
    () => pins.filter((pin) => selectedPinIds.includes(pin.id)),
    [pins, selectedPinIds],
  );

  const selectedBoards = useMemo(
    () =>
      selectedBoardIds
        .map((boardId) => boards.find((board) => board.id === boardId))
        .filter((board): board is PublerBoard => Boolean(board)),
    [boards, selectedBoardIds],
  );

  const summary = useMemo(
    () => ({
      uploaded: pins.filter((pin) => pin.mediaStatus === "UPLOADED").length,
      mediaFailed: pins.filter((pin) => pin.mediaStatus === "FAILED").length,
      titlesReady: pins.filter((pin) => Boolean(copyByPinId.get(pin.id)?.title.trim())).length,
      descriptionsReady: pins.filter((pin) =>
        Boolean(copyByPinId.get(pin.id)?.description.trim()),
      ).length,
      scheduled: pins.filter((pin) => pin.scheduleStatus === "SCHEDULED").length,
      scheduleFailed: pins.filter((pin) => pin.scheduleStatus === "FAILED").length,
    }),
    [copyByPinId, pins],
  );

  const canScheduleSelected = useMemo(
    () =>
      selectedPins.length > 0 &&
      selectedPins.every((pin) => {
        const copy = copyByPinId.get(pin.id);
        return (
          pin.mediaStatus === "UPLOADED" &&
          Boolean(copy?.title.trim()) &&
          Boolean(copy?.description.trim())
        );
      }),
    [copyByPinId, selectedPins],
  );

  const schedulePreview = useMemo(() => {
    if (selectedPins.length === 0 || !firstPublishAt) {
      return [];
    }

    try {
      return buildSchedulePreview({
        pinIds: selectedPins.map((pin) => pin.id),
        firstPublishAt,
        intervalMinutes: intervalDays * 24 * 60,
        jitterMinutes: jitterDays * 24 * 60,
      });
    } catch {
      return [];
    }
  }, [firstPublishAt, intervalDays, jitterDays, selectedPins]);

  const schedulePreviewRows = useMemo(
    () =>
      buildBoardPreviewAssignments({
        pinIds: schedulePreview.map((item) => item.pinId),
        boardIds: selectedBoardIds,
        mode: boardDistributionMode,
        primaryBoardId,
        primaryBoardPercent,
      }).map((assignment, index) => ({
        ...schedulePreview[index],
        board:
          selectedBoards.find((board) => board.id === assignment.boardId) ?? null,
      })),
    [boardDistributionMode, primaryBoardId, primaryBoardPercent, schedulePreview, selectedBoardIds, selectedBoards],
  );

  useEffect(() => {
    if (!integrationReady.hasPublerApiKey) {
      return;
    }

    void loadPublerOptions({
      preserveCurrentSelection: true,
      nextWorkspaceId: defaults.workspaceId,
      nextAccountId: defaults.accountId,
    });
  }, [defaults.accountId, defaults.workspaceId, integrationReady.hasPublerApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedBoardIds.length === 0) {
      if (primaryBoardId) {
        setPrimaryBoardId("");
      }
      return;
    }

    if (!primaryBoardId || !selectedBoardIds.includes(primaryBoardId)) {
      setPrimaryBoardId(selectedBoardIds[0]);
    }
  }, [primaryBoardId, selectedBoardIds]);

  async function loadPublerOptions(input?: {
    preserveCurrentSelection?: boolean;
    nextWorkspaceId?: string;
    nextAccountId?: string;
  }) {
    setIsLoadingOptions(true);
    setOptionsError(null);

    try {
      const response = await fetch("/api/dashboard/settings/publer-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: input?.nextWorkspaceId ?? workspaceId,
          accountId: input?.nextAccountId ?? accountId,
        }),
      });
      const data = (await response.json()) as PublerOptionsResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to load Publer options.");
      }

      const nextWorkspaces = data.workspaces ?? [];
      const nextAccounts = data.accounts ?? [];
      const nextBoards = data.boards ?? [];
      const resolvedWorkspaceId =
        input?.preserveCurrentSelection && workspaceId
          ? workspaceId
          : data.selectedWorkspaceId ?? workspaceId;
      const resolvedAccountId =
        input?.preserveCurrentSelection && accountId
          ? accountId
          : data.selectedAccountId ?? accountId;

      setWorkspaces(nextWorkspaces);
      setAccounts(nextAccounts);
      setBoards(nextBoards);
      setWorkspaceId(resolvedWorkspaceId);
      setAccountId(resolvedAccountId);
      setSelectedBoardIds((current) => {
        const validBoardIds = current.filter((boardId) =>
          nextBoards.some((board) => board.id === boardId),
        );
        if (validBoardIds.length > 0) {
          return validBoardIds;
        }

        if (defaults.boardId && nextBoards.some((board) => board.id === defaults.boardId)) {
          return [defaults.boardId];
        }

        return [];
      });
      setPrimaryBoardId((current) => {
        if (current && nextBoards.some((board) => board.id === current)) {
          return current;
        }
        if (defaults.boardId && nextBoards.some((board) => board.id === defaults.boardId)) {
          return defaults.boardId;
        }
        return nextBoards[0]?.id ?? "";
      });
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : "Unable to load Publer options.");
    } finally {
      setIsLoadingOptions(false);
    }
  }

  async function runAction(payload: unknown) {
    const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      result?: PublishActionResult;
    };

    if (!response.ok || !data.ok) {
      throw new Error(data.error ?? "Request failed.");
    }

    return data.result;
  }

  function handleAction(payload: unknown, fallbackMessage: string) {
    startTransition(async () => {
      try {
        setBanner(null);
        const result = await runAction(payload);
        setBanner({
          tone: result && result.failed > 0 ? "warning" : "success",
          message: result?.message ?? "Action completed.",
        });
        router.refresh();
      } catch (error) {
        setBanner({
          tone: "error",
          message: error instanceof Error ? error.message : fallbackMessage,
        });
      }
    });
  }

  function updateCopy(generatedPinId: string, key: "title" | "description", value: string) {
    setCopyState((current) =>
      current.map((item) =>
        item.generatedPinId === generatedPinId ? { ...item, [key]: value } : item,
      ),
    );
  }

  function togglePin(pinId: string, isChecked: boolean) {
    setSelectedPinIds((current) => {
      if (isChecked) {
        return current.includes(pinId) ? current : [...current, pinId];
      }

      return current.filter((value) => value !== pinId);
    });
  }

  function toggleBoard(boardId: string, isChecked: boolean) {
    setSelectedBoardIds((current) => {
      if (isChecked) {
        if (!primaryBoardId) {
          setPrimaryBoardId(boardId);
        }
        return current.includes(boardId) ? current : [...current, boardId];
      }

      if (primaryBoardId === boardId) {
        const remainingBoards = current.filter((value) => value !== boardId);
        setPrimaryBoardId(remainingBoards[0] ?? "");
      }
      return current.filter((value) => value !== boardId);
    });
  }

  function moveBoard(boardId: string, direction: "up" | "down") {
    setSelectedBoardIds((current) => {
      const index = current.indexOf(boardId);
      if (index === -1) {
        return current;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  function selectBy(predicate: (pin: PinItem) => boolean) {
    setSelectedPinIds(pins.filter(predicate).map((pin) => pin.id));
  }

  function formatPreviewDate(value: Date) {
    return value.toLocaleString();
  }

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.tone === "error"
              ? "border-[#ebc0b0] bg-[#fff4ef] text-[#8f3d24]"
              : banner.tone === "warning"
                ? "border-[#ead6a5] bg-[#fff9e8] text-[#7f5a12]"
                : "border-[#c8dec1] bg-[#f2fbef] text-[#355c2f]"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Job status" value={formatLabel(jobStatus)} />
        <SummaryCard label="Media uploaded" value={`${summary.uploaded}/${pins.length}`} />
        <SummaryCard label="Descriptions ready" value={`${summary.descriptionsReady}/${pins.length}`} />
        <SummaryCard label="Scheduled" value={`${summary.scheduled}/${pins.length}`} />
      </section>

      <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Workflow readiness</h2>
            <p className="mt-2 text-sm text-[#6e4a2b]">
              Work pin-by-pin when needed. Each step accepts the currently selected pins and keeps
              successful records intact.
            </p>
          </div>
          <div className="grid gap-2 text-sm text-[#6e4a2b]">
            <p>
              <strong>Publer API key:</strong>{" "}
              {integrationReady.hasPublerApiKey ? "Configured" : "Missing"}
            </p>
            <p>
              <strong>AI provider key:</strong>{" "}
              {integrationReady.hasAiApiKey ? "Configured" : "Missing"}
            </p>
          </div>
        </div>

        {latestScheduleRun ? (
          <div className="mt-4 rounded-2xl border border-[#eadacc] bg-[#fcf7f0] p-4 text-sm text-[#6e4a2b]">
            <p className="font-semibold text-[#23160d]">Latest schedule run</p>
            <p className="mt-1">
              {formatLabel(latestScheduleRun.status)}
              {latestScheduleRun.completedAt
                ? ` - completed ${new Date(latestScheduleRun.completedAt).toLocaleString()}`
                : latestScheduleRun.submittedAt
                  ? ` - submitted ${new Date(latestScheduleRun.submittedAt).toLocaleString()}`
                  : ""}
            </p>
            {latestScheduleRun.errorMessage ? (
              <p className="mt-2 text-[#8f3d24]">{latestScheduleRun.errorMessage}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Publishing destination</h2>
            <p className="mt-2 text-sm text-[#6e4a2b]">
              Choose the Publer workspace, Pinterest account, and one or more preferred boards
              before uploading media. Board order becomes the scheduling priority.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void loadPublerOptions({
                preserveCurrentSelection: true,
                nextWorkspaceId: workspaceId,
                nextAccountId: accountId,
              })
            }
            disabled={isLoadingOptions || !integrationReady.hasPublerApiKey}
            className="rounded-full border border-[#d8b690] px-4 py-2 text-sm font-semibold text-[#8a572a] disabled:opacity-60"
          >
            {isLoadingOptions ? "Refreshing..." : "Refresh destination"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-[#6e4a2b]">
            Workspace
            <select
              value={workspaceId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setWorkspaceId(nextValue);
                setSelectedBoardIds([]);
                setPrimaryBoardId("");
                void loadPublerOptions({
                  nextWorkspaceId: nextValue,
                  nextAccountId: accountId,
                });
              }}
              className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
            >
              <option value="">Select workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#6e4a2b]">
            Pinterest account
            <select
              value={accountId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setAccountId(nextValue);
                setSelectedBoardIds([]);
                setPrimaryBoardId("");
                void loadPublerOptions({
                  nextWorkspaceId: workspaceId,
                  nextAccountId: nextValue,
                });
              }}
              className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={String(account.id)} value={String(account.id)}>
                  {account.name || String(account.id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-[#eadacc] bg-[#fcf7f0] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#23160d]">Preferred Pinterest boards</p>
              <p className="mt-1 text-sm text-[#6e4a2b]">
                Select multiple boards to spread pins out. Move boards up or down to control
                preference order.
              </p>
            </div>
            <label className="block text-sm font-semibold text-[#6e4a2b]">
              Distribution
              <select
                value={boardDistributionMode}
                onChange={(event) =>
                  setBoardDistributionMode(event.target.value as BoardDistributionMode)
                }
                className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-white px-3 py-2"
              >
                <option value="round_robin">Round robin across selected boards</option>
                <option value="first_selected">Use the first selected board for all pins</option>
                <option value="primary_weighted">Favor one primary board</option>
              </select>
            </label>
          </div>

          {boardDistributionMode === "primary_weighted" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#6e4a2b]">
                Primary board
                <select
                  value={primaryBoardId}
                  onChange={(event) => setPrimaryBoardId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-white px-3 py-2"
                >
                  <option value="">Select primary board</option>
                  {selectedBoards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#6e4a2b]">
                Primary board share (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={primaryBoardPercent}
                  onChange={(event) => setPrimaryBoardPercent(Number(event.target.value) || 0)}
                  className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-white px-3 py-2"
                />
                <span className="mt-2 block text-xs font-normal text-[#6e4a2b]">
                  Default is 60%. Remaining pins are distributed across the other selected boards.
                </span>
              </label>
            </div>
          ) : null}

          {boards.length === 0 ? (
            <p className="mt-4 text-sm text-[#6e4a2b]">
              Load a workspace and Pinterest account to choose boards.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {boards.map((board) => {
                const selectionIndex = selectedBoardIds.indexOf(board.id);
                const isSelected = selectionIndex !== -1;

                return (
                  <div
                    key={board.id}
                    className={`rounded-2xl border p-4 ${
                      isSelected ? "border-[#8a572a] bg-white" : "border-[#eadacc] bg-[#fffaf4]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) => toggleBoard(board.id, event.target.checked)}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#23160d]">
                            {board.name}
                          </span>
                          <span className="block text-xs uppercase tracking-[0.18em] text-[#8a572a]">
                            {isSelected
                              ? boardDistributionMode === "primary_weighted" &&
                                primaryBoardId === board.id
                                ? `Primary - priority ${selectionIndex + 1}`
                                : `Priority ${selectionIndex + 1}`
                              : "Not selected"}
                          </span>
                        </span>
                      </label>
                      {isSelected ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveBoard(board.id, "up")}
                            disabled={selectionIndex === 0}
                            className="rounded-full border border-[#d8b690] px-3 py-1 text-xs font-semibold text-[#8a572a] disabled:opacity-50"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBoard(board.id, "down")}
                            disabled={selectionIndex === selectedBoardIds.length - 1}
                            className="rounded-full border border-[#d8b690] px-3 py-1 text-xs font-semibold text-[#8a572a] disabled:opacity-50"
                          >
                            Down
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {optionsError ? (
          <p className="mt-3 text-sm text-[#8f3d24]">{optionsError}</p>
        ) : isLoadingOptions ? (
          <p className="mt-3 text-sm text-[#6e4a2b]">Loading Publer workspace data...</p>
        ) : (
          <p className="mt-3 text-sm text-[#6e4a2b]">
            {workspaceId
              ? `Workspace selected${accountId ? ", account selected" : ""}${selectedBoardIds.length > 0 ? `, ${selectedBoardIds.length} board${selectedBoardIds.length === 1 ? "" : "s"} selected` : ""}.`
              : "Select a workspace first to upload media into Publer."}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Selected pins</h2>
            <p className="mt-2 text-sm text-[#6e4a2b]">
              {selectedPinIds.length} of {pins.length} pins selected for the next action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SelectionButton label="All" onClick={() => setSelectedPinIds(pins.map((pin) => pin.id))} />
            <SelectionButton
              label="Media failed"
              onClick={() => selectBy((pin) => pin.mediaStatus === "FAILED")}
            />
            <SelectionButton
              label="Missing descriptions"
              onClick={() => selectBy((pin) => !copyByPinId.get(pin.id)?.description.trim())}
            />
            <SelectionButton
              label="Schedule failed"
              onClick={() => selectBy((pin) => pin.scheduleStatus === "FAILED")}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <StepCard
            title="Step 1 - Upload media"
            subtitle="Upload rendered PNGs to Publer and preserve media IDs per pin."
            countLabel={`${summary.uploaded} uploaded - ${summary.mediaFailed} failed`}
            actionLabel="Upload selected pins"
            disabled={
              isPending ||
              selectedPins.length === 0 ||
              !integrationReady.hasPublerApiKey ||
              !workspaceId
            }
            onClick={() =>
              handleAction(
                {
                  action: "upload_media",
                  generatedPinIds: selectedPinIds,
                  workspaceId,
                },
                "Unable to upload media.",
              )
            }
          />

          <StepCard
            title="Step 2 - Titles"
            subtitle="Generate draft titles from article context, then keep editing inline."
            countLabel={`${summary.titlesReady} ready`}
            actionLabel="Generate titles for selected pins"
            disabled={isPending || selectedPins.length === 0 || !integrationReady.hasAiApiKey}
            onClick={() =>
              handleAction(
                { action: "generate_titles", generatedPinIds: selectedPinIds },
                "Unable to generate titles.",
              )
            }
            secondaryAction={{
              label: "Save copy edits",
              onClick: () =>
                handleAction(
                  { action: "save_copy", copies: copyState },
                  "Unable to save copy edits.",
                ),
              disabled: isPending || pins.length === 0,
            }}
          />

          <StepCard
            title="Step 3 - Descriptions"
            subtitle="Generate descriptions only after titles are present. Final edits stay editable below."
            countLabel={`${summary.descriptionsReady} ready`}
            actionLabel="Generate descriptions for selected pins"
            disabled={isPending || selectedPins.length === 0 || !integrationReady.hasAiApiKey}
            onClick={() =>
              handleAction(
                { action: "generate_descriptions", generatedPinIds: selectedPinIds },
                "Unable to generate descriptions.",
              )
            }
          />

          <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Step 4 - Scheduling</h2>
                <p className="mt-2 text-sm text-[#6e4a2b]">
                  The preview below uses the same timing and board distribution rules that Studio
                  sends to Publer.
                </p>
              </div>
              <div className="text-sm text-[#6e4a2b]">
                <p>
                  <strong>{summary.scheduled}</strong> scheduled
                </p>
                <p>
                  <strong>{summary.scheduleFailed}</strong> failed
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[#6e4a2b]">
                First publish datetime
                <input
                  type="datetime-local"
                  value={firstPublishAt}
                  onChange={(event) => setFirstPublishAt(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[#6e4a2b]">
                Interval days
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={intervalDays}
                  onChange={(event) => setIntervalDays(Number(event.target.value) || 1)}
                  className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[#6e4a2b]">
                Jitter days
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={jitterDays}
                  onChange={(event) => setJitterDays(Number(event.target.value) || 0)}
                  className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
                />
              </label>
              <div className="rounded-2xl border border-[#eadacc] bg-[#fcf7f0] p-4 text-sm text-[#6e4a2b]">
                <p className="font-semibold text-[#23160d]">Selection summary</p>
                <p className="mt-2">{selectedPins.length} pins will be submitted in this run.</p>
                <p className="mt-1">
                  {canScheduleSelected
                    ? "Selected pins are ready for scheduling."
                    : "Selected pins still need uploaded media and finalized copy."}
                </p>
                <p className="mt-1">
                  {selectedBoards.length > 0
                    ? `${selectedBoards.length} board${selectedBoards.length === 1 ? "" : "s"} selected for distribution.`
                    : "Choose at least one board before scheduling."}
                </p>
                {boardDistributionMode === "primary_weighted" && primaryBoardId ? (
                  <p className="mt-1">
                    Primary board target: {primaryBoardPercent}% on{" "}
                    {selectedBoards.find((board) => board.id === primaryBoardId)?.name ?? "selected board"}.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  handleAction(
                    {
                      action: "schedule",
                      generatedPinIds: selectedPinIds,
                      firstPublishAt,
                      intervalMinutes: intervalDays * 24 * 60,
                      jitterMinutes: jitterDays * 24 * 60,
                      workspaceId,
                      accountId,
                      boardIds: selectedBoardIds,
                      boardDistributionMode,
                      primaryBoardId,
                      primaryBoardPercent,
                    },
                    "Unable to schedule pins.",
                  )
                }
                disabled={
                  isPending ||
                  !firstPublishAt ||
                  !canScheduleSelected ||
                  selectedPins.length === 0 ||
                  !workspaceId ||
                  !accountId ||
                  selectedBoardIds.length === 0 ||
                  (boardDistributionMode === "primary_weighted" &&
                    (!primaryBoardId || !selectedBoardIds.includes(primaryBoardId)))
                }
                className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
              >
                Schedule selected pins
              </button>
              <button
                type="button"
                onClick={() =>
                  selectBy(
                    (pin) => pin.scheduleStatus === "FAILED" || pin.scheduleStatus === "PENDING",
                  )
                }
                className="rounded-full border border-[#d8b690] px-4 py-2 text-sm font-semibold text-[#8a572a]"
              >
                Target unscheduled pins
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#eadacc]">
              <div className="grid grid-cols-[minmax(0,1fr)_180px_180px_120px] bg-[#f7efe6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">
                <span>Pin</span>
                <span>Board</span>
                <span>Planned time</span>
                <span>Jitter</span>
              </div>
              {schedulePreviewRows.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[#6e4a2b]">
                  Select pins, boards, and a first publish time to preview the schedule.
                </p>
              ) : (
                schedulePreviewRows.map((item) => {
                  const pin = pins.find((candidate) => candidate.id === item.pinId);
                  return (
                    <div
                      key={item.pinId}
                      className="grid grid-cols-[minmax(0,1fr)_180px_180px_120px] items-center gap-4 border-t border-[#f0e3d7] px-4 py-3 text-sm text-[#4f3725]"
                    >
                      <span className="truncate">{pin?.templateId ?? item.pinId}</span>
                      <span className="truncate">{item.board?.name ?? "No board selected"}</span>
                      <span>{formatPreviewDate(item.scheduledFor)}</span>
                      <span>{item.jitterOffsetMinutes / (24 * 60)} day(s)</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
          <h2 className="text-xl font-bold">Pins</h2>
          <div className="mt-4 space-y-4">
            {pins.map((pin) => {
              const copy = copyByPinId.get(pin.id);
              const isSelected = selectedPinIds.includes(pin.id);

              return (
                <article
                  key={pin.id}
                  className={`rounded-2xl border p-4 ${
                    isSelected ? "border-[#8a572a] bg-[#fffaf4]" : "border-[#eadacc]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#6e4a2b]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => togglePin(pin.id, event.target.checked)}
                      />
                      Target this pin
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                      <StatusChip label={`Media ${formatLabel(pin.mediaStatus)}`} tone={toneForStatus(pin.mediaStatus)} />
                      <StatusChip label={`Title ${formatLabel(pin.titleStatus)}`} tone={toneForStatus(pin.titleStatus)} />
                      <StatusChip
                        label={`Description ${formatLabel(pin.descriptionStatus)}`}
                        tone={toneForStatus(pin.descriptionStatus)}
                      />
                      <StatusChip
                        label={`Schedule ${formatLabel(pin.scheduleStatus)}`}
                        tone={toneForStatus(pin.scheduleStatus)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <img
                      src={pin.exportPath}
                      alt={copy?.title || "Generated pin"}
                      className="w-full rounded-xl border border-[#eadacc]"
                    />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#23160d]">{pin.templateId}</p>
                      <label className="block text-sm font-semibold text-[#6e4a2b]">
                        Title
                        <input
                          value={copy?.title ?? ""}
                          onChange={(event) => updateCopy(pin.id, "title", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
                        />
                      </label>

                      <label className="block text-sm font-semibold text-[#6e4a2b]">
                        Description
                        <textarea
                          value={copy?.description ?? ""}
                          onChange={(event) => updateCopy(pin.id, "description", event.target.value)}
                          rows={4}
                          className="mt-2 w-full rounded-xl border border-[#dcc8b2] bg-[#fffaf4] px-3 py-2"
                        />
                      </label>

                      <div className="grid gap-2 text-sm text-[#6e4a2b]">
                        <p>
                          <strong>Media ID:</strong> {pin.mediaId || "Not uploaded yet"}
                        </p>
                        <p>
                          <strong>Scheduled for:</strong>{" "}
                          {pin.scheduledFor ? new Date(pin.scheduledFor).toLocaleString() : "Not scheduled"}
                        </p>
                        {pin.mediaError ? (
                          <p className="text-[#8f3d24]">
                            <strong>Media error:</strong> {pin.mediaError}
                          </p>
                        ) : null}
                        {pin.scheduleError ? (
                          <p className="text-[#8f3d24]">
                            <strong>Schedule error:</strong> {pin.scheduleError}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#eadacc] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a572a]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#23160d]">{value}</p>
    </div>
  );
}

function StepCard(input: {
  title: string;
  subtitle: string;
  countLabel: string;
  actionLabel: string;
  disabled: boolean;
  onClick: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled: boolean;
  };
}) {
  return (
    <section className="rounded-3xl border border-[#e8d7c5] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{input.title}</h2>
          <p className="mt-2 text-sm text-[#6e4a2b]">{input.subtitle}</p>
        </div>
        <p className="text-sm font-semibold text-[#8a572a]">{input.countLabel}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={input.onClick}
          disabled={input.disabled}
          className="rounded-full bg-[#2c1c12] px-4 py-2 text-sm font-semibold text-[#f7ede0] disabled:opacity-60"
        >
          {input.actionLabel}
        </button>
        {input.secondaryAction ? (
          <button
            type="button"
            onClick={input.secondaryAction.onClick}
            disabled={input.secondaryAction.disabled}
            className="rounded-full border border-[#d8b690] px-4 py-2 text-sm font-semibold text-[#8a572a] disabled:opacity-60"
          >
            {input.secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SelectionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[#d8b690] px-4 py-2 text-sm font-semibold text-[#8a572a]"
    >
      {label}
    </button>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "good" | "warning" | "bad";
}) {
  const className =
    tone === "good"
      ? "border-[#c8dec1] bg-[#f2fbef] text-[#355c2f]"
      : tone === "warning"
        ? "border-[#ead6a5] bg-[#fff9e8] text-[#7f5a12]"
        : tone === "bad"
          ? "border-[#ebc0b0] bg-[#fff4ef] text-[#8f3d24]"
          : "border-[#e0d5c8] bg-[#f8f3ed] text-[#6e4a2b]";

  return <span className={`rounded-full border px-2 py-1 ${className}`}>{label}</span>;
}

function toneForStatus(status: string) {
  if (
    status === "UPLOADED" ||
    status === "FINALIZED" ||
    status === "GENERATED" ||
    status === "SCHEDULED"
  ) {
    return "good" as const;
  }
  if (status === "FAILED") {
    return "bad" as const;
  }
  if (status === "UPLOADING" || status === "SUBMITTING") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function buildBoardPreviewAssignments(input: {
  pinIds: string[];
  boardIds: string[];
  mode: BoardDistributionMode;
  primaryBoardId: string;
  primaryBoardPercent: number;
}) {
  if (input.pinIds.length === 0 || input.boardIds.length === 0) {
    return [];
  }

  if (input.mode === "first_selected") {
    return input.pinIds.map((pinId) => ({
      pinId,
      boardId: input.boardIds[0],
    }));
  }

  if (input.mode === "round_robin") {
    return input.pinIds.map((pinId, index) => ({
      pinId,
      boardId: input.boardIds[index % input.boardIds.length],
    }));
  }

  const primaryBoardId =
    input.primaryBoardId && input.boardIds.includes(input.primaryBoardId)
      ? input.primaryBoardId
      : input.boardIds[0];
  const secondaryBoardIds = input.boardIds.filter((boardId) => boardId !== primaryBoardId);

  if (secondaryBoardIds.length === 0) {
    return input.pinIds.map((pinId) => ({
      pinId,
      boardId: primaryBoardId,
    }));
  }

  const primaryTarget = Math.min(
    input.pinIds.length,
    Math.max(0, Math.round((input.pinIds.length * input.primaryBoardPercent) / 100)),
  );
  let assignedPrimary = 0;
  let secondaryIndex = 0;

  return input.pinIds.map((pinId, index) => {
    const expectedPrimary = Math.round(((index + 1) * primaryTarget) / input.pinIds.length);
    const usePrimary =
      assignedPrimary < primaryTarget &&
      (assignedPrimary < expectedPrimary ||
        input.pinIds.length - (index + 1) < primaryTarget - assignedPrimary);

    if (usePrimary) {
      assignedPrimary += 1;
      return {
        pinId,
        boardId: primaryBoardId,
      };
    }

    const boardId = secondaryBoardIds[secondaryIndex % secondaryBoardIds.length];
    secondaryIndex += 1;
    return {
      pinId,
      boardId,
    };
  });
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
