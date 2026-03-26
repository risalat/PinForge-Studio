/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useAppFeedback } from "@/components/ui/AppFeedbackProvider";
import { buildCapacityAwareSchedulePreview } from "@/lib/jobs/schedulePreview";
import { buildTemplateDiverseOrder } from "@/lib/jobs/templateDiversity";
import type {
  AiCredentialSummary,
  PublishScheduleContext,
  WorkspaceProfileSummary,
} from "@/lib/types";

type PinItem = {
  id: string;
  templateId: string;
  artworkReviewState: string;
  artworkFlagReason: string | null;
  exportPath: string;
  mediaStatus: string;
  mediaId: string | null;
  mediaError: string | null;
  title: string;
  titleOptions: string[];
  description: string;
  titleStatus: string;
  descriptionStatus: string;
  scheduleStatus: string;
  scheduledFor: string | null;
  scheduleError: string | null;
};

type TitleTaskItem = {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAfter: string;
  lastError: string | null;
  payloadJson?: {
    generatedPinIds?: string[];
  } | null;
  progressJson?: {
    stage?: string;
    total?: number;
    completed?: number;
  } | null;
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
  workspaceProfiles: WorkspaceProfileSummary[];
  aiCredentials: AiCredentialSummary[];
  defaultAiCredentialId: string;
  initialScheduleContext: PublishScheduleContext;
  pins: PinItem[];
  defaults: {
    workspaceId: string;
    accountId: string;
    boardId: string;
  };
  integrationReady: {
    hasPublerApiKey: boolean;
    hasAiApiKey: boolean;
    canUsePublerApiKey: boolean;
    canUseAiApiKey: boolean;
    publerCredentialState: "missing" | "ready" | "unavailable";
    aiCredentialState: "missing" | "ready" | "unavailable";
    publerCredentialMessage: string;
    aiCredentialMessage: string;
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
  generatedTitleOptions?: Array<{
    pinId: string;
    titles: string[];
  }>;
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

type PublishSectionKey = "upload" | "titles" | "descriptions" | "schedule";
type PublishStepKey = PublishSectionKey;

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
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const TITLE_ACTION_CHUNK_SIZE = 4;
const DESCRIPTION_ACTION_CHUNK_SIZE = 5;

type PublishStatusResponse = {
  ok: boolean;
  error?: string;
  jobStatus?: string;
  pins?: PinItem[];
  titleTasks?: TitleTaskItem[];
  descriptionTasks?: TitleTaskItem[];
  latestScheduleRun?: JobPublishManagerProps["latestScheduleRun"];
};

type UploadTrackingState = {
  active: boolean;
  pinIds: string[];
};

type PersistedPublishSelection = {
  workspaceId: string;
  accountId: string;
  selectedBoardIds: string[];
  boardDistributionMode: BoardDistributionMode;
  primaryBoardId: string;
  primaryBoardPercent: number;
};

type QueueTitleGenerationResult = {
  queuedTaskCount: number;
  queuedPinCount: number;
  skippedPinCount: number;
  message: string;
  tasks: TitleTaskItem[];
};

export function JobPublishManager({
  jobId,
  workspaceProfiles,
  aiCredentials,
  defaultAiCredentialId,
  initialScheduleContext,
  pins,
  defaults,
  integrationReady,
  latestScheduleRun,
}: JobPublishManagerProps) {
  const router = useRouter();
  const { notify, updateNotification, dismissNotification } = useAppFeedback();
  const [livePins, setLivePins] = useState<PinItem[]>(pins);
  const [liveLatestScheduleRun, setLiveLatestScheduleRun] = useState(latestScheduleRun);
  const [titleTasks, setTitleTasks] = useState<TitleTaskItem[]>([]);
  const [trackedTitleTaskIds, setTrackedTitleTaskIds] = useState<string[]>([]);
  const [descriptionTasks, setDescriptionTasks] = useState<TitleTaskItem[]>([]);
  const [trackedDescriptionTaskIds, setTrackedDescriptionTaskIds] = useState<string[]>([]);
  const [expandedDescriptionPinIds, setExpandedDescriptionPinIds] = useState<string[]>([]);
  const [copyState, setCopyState] = useState(
    pins.map((pin) => ({
      generatedPinId: pin.id,
      title: pin.title,
      description: pin.description,
    })),
  );
  const [titleCandidatesByPinId, setTitleCandidatesByPinId] = useState<Record<string, string[]>>(
    () => buildTitleCandidatesByPinId(pins),
  );
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>(() => getDefaultSelectedPinIds(pins));
  const [firstPublishAt, setFirstPublishAt] = useState("");
  const [intervalDays, setIntervalDays] = useState(25);
  const [jitterDays, setJitterDays] = useState(5);
  const [workspaceId, setWorkspaceId] = useState(defaults.workspaceId);
  const [accountId, setAccountId] = useState(defaults.accountId);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>(
    defaults.boardId ? [defaults.boardId] : [],
  );
  const [boardOverrideByPinId, setBoardOverrideByPinId] = useState<Record<string, string>>({});
  const [boardDistributionMode, setBoardDistributionMode] =
    useState<BoardDistributionMode>("round_robin");
  const [primaryBoardId, setPrimaryBoardId] = useState(defaults.boardId);
  const [primaryBoardPercent, setPrimaryBoardPercent] = useState(60);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<PublerWorkspace[]>([]);
  const [accounts, setAccounts] = useState<PublerAccount[]>([]);
  const [boards, setBoards] = useState<PublerBoard[]>([]);
  const [profileCatalog, setProfileCatalog] = useState(workspaceProfiles);
  const [selectedAiCredentialId, setSelectedAiCredentialId] = useState(
    defaultAiCredentialId || aiCredentials[0]?.id || "",
  );
  const [scheduleContext, setScheduleContext] = useState(initialScheduleContext);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [sectionFeedback, setSectionFeedback] = useState<Record<PublishSectionKey, BannerState>>({
    upload: null,
    titles: null,
    descriptions: null,
    schedule: null,
  });
  const [collapsedSteps, setCollapsedSteps] = useState<Record<PublishStepKey, boolean>>({
    upload: false,
    titles: false,
    descriptions: true,
    schedule: false,
  });
  const [profileDefaultsFeedback, setProfileDefaultsFeedback] = useState<BannerState>(null);
  const [missingAssetPinIds, setMissingAssetPinIds] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingScheduleContext, setIsLoadingScheduleContext] = useState(false);
  const [isSavingProfileDefaults, setIsSavingProfileDefaults] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [uploadTracking, setUploadTracking] = useState<UploadTrackingState | null>(null);
  const [hasEditedFirstPublishAt, setHasEditedFirstPublishAt] = useState(false);
  const [hasLoadedSavedDestination, setHasLoadedSavedDestination] = useState(false);
  const [isPending, startTransition] = useTransition();
  const uploadProgressToastIdRef = useRef<string | null>(null);
  const copyProgressToastIdRef = useRef<string | null>(null);
  const hasInitializedOptionsRef = useRef(false);
  const currentPins = livePins;
  const isUploadingMedia = activeAction === "upload_media";
  const isGeneratingTitles = activeAction === "generate_titles";
  const isSavingCopy = activeAction === "save_copy";
  const isGeneratingDescriptions = activeAction === "generate_descriptions";
  const isSchedulingPins = activeAction === "schedule";

  const toggleStepCollapsed = useCallback((step: PublishStepKey) => {
    setCollapsedSteps((current) => ({
      ...current,
      [step]: !current[step],
    }));
  }, []);

  function markPinAssetMissing(pinId: string) {
    setMissingAssetPinIds((current) =>
      current.includes(pinId) ? current : [...current, pinId],
    );
  }

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
  const dirtyCopyPayload = useMemo(() => {
    const persistedByPinId = new Map(
      currentPins.map((pin) => [
        pin.id,
        {
          title: pin.title,
          description: pin.description,
        },
      ]),
    );

    return copyState
      .map((copy) => {
        const persisted = persistedByPinId.get(copy.generatedPinId);
        if (!persisted) {
          return null;
        }

        const payload: {
          generatedPinId: string;
          title?: string;
          description?: string;
        } = {
          generatedPinId: copy.generatedPinId,
        };

        if (copy.title !== persisted.title) {
          payload.title = copy.title;
        }

        if (copy.description !== persisted.description) {
          payload.description = copy.description;
        }

        return payload.title !== undefined || payload.description !== undefined ? payload : null;
      })
      .filter(
        (
          value,
        ): value is {
          generatedPinId: string;
          title?: string;
          description?: string;
        } => Boolean(value),
      );
  }, [copyState, currentPins]);

  useEffect(() => {
    setLivePins(pins);
    setLiveLatestScheduleRun(latestScheduleRun);
    setCopyState((current) => mergeCopyStateWithPins(current, pins));
    setTitleCandidatesByPinId(buildTitleCandidatesByPinId(pins));
  }, [latestScheduleRun, pins]);

  useEffect(() => {
    setSelectedPinIds((current) => {
      const validSelected = current.filter((pinId) => pins.some((pin) => pin.id === pinId));
      if (validSelected.length > 0) {
        return validSelected;
      }

      return getDefaultSelectedPinIds(pins);
    });
  }, [pins]);

  useEffect(() => {
    setProfileCatalog(workspaceProfiles);
  }, [workspaceProfiles]);

  useEffect(() => {
    if (!selectedAiCredentialId && (defaultAiCredentialId || aiCredentials[0]?.id)) {
      setSelectedAiCredentialId(defaultAiCredentialId || aiCredentials[0]?.id || "");
      return;
    }

    if (
      selectedAiCredentialId &&
      aiCredentials.length > 0 &&
      !aiCredentials.some((credential) => credential.id === selectedAiCredentialId)
    ) {
      setSelectedAiCredentialId(defaultAiCredentialId || aiCredentials[0]?.id || "");
    }
  }, [aiCredentials, defaultAiCredentialId, selectedAiCredentialId]);

  useEffect(() => {
    setScheduleContext(initialScheduleContext);
  }, [initialScheduleContext]);

  const orderedPins = useMemo(
    () =>
      buildTemplateDiverseOrder(currentPins, {
        getTemplateId: (pin) => pin.templateId,
        seed: `${jobId}:publish-pin-order`,
      }),
    [currentPins, jobId],
  );
  const unresolvedArtworkPins = useMemo(
    () => orderedPins.filter((pin) => isPinArtworkUnresolved(pin)),
    [orderedPins],
  );
  const publishReadyArtworkPins = useMemo(
    () => orderedPins.filter((pin) => !isPinArtworkUnresolved(pin)),
    [orderedPins],
  );
  const titleReadyForGenerationPins = useMemo(
    () => publishReadyArtworkPins.filter((pin) => isPinReadyForTitleGeneration(pin)),
    [publishReadyArtworkPins],
  );
  const titleReadyForSelectionPins = useMemo(
    () =>
      publishReadyArtworkPins.filter((pin) =>
        isPinReadyForTitleSelection(pin, copyByPinId.get(pin.id)?.title ?? ""),
      ),
    [copyByPinId, publishReadyArtworkPins],
  );
  const titleNotReadyPins = useMemo(
    () => orderedPins.filter((pin) => !isPinReadyForTitleWork(pin)),
    [orderedPins],
  );
  const activeTitleTasks = useMemo(
    () => titleTasks.filter((task) => ["QUEUED", "RUNNING"].includes(task.status)),
    [titleTasks],
  );
  const activeDescriptionTasks = useMemo(
    () => descriptionTasks.filter((task) => ["QUEUED", "RUNNING"].includes(task.status)),
    [descriptionTasks],
  );

  const selectedPins = useMemo(
    () => orderedPins.filter((pin) => selectedPinIds.includes(pin.id)),
    [orderedPins, selectedPinIds],
  );
  const selectedTitleReadyPins = useMemo(
    () => selectedPins.filter((pin) => isPinReadyForTitleGeneration(pin)),
    [selectedPins],
  );
  const descriptionReadyForGenerationPins = useMemo(
    () => publishReadyArtworkPins.filter((pin) => isPinReadyForDescriptionGeneration(pin)),
    [publishReadyArtworkPins],
  );
  const selectedDescriptionReadyPins = useMemo(
    () => selectedPins.filter((pin) => isPinReadyForDescriptionGeneration(pin)),
    [selectedPins],
  );
  const descriptionNeedsAttentionPins = useMemo(
    () => orderedPins.filter((pin) => isPinDescriptionNeedsAttention(pin)),
    [orderedPins],
  );

  const selectedBoards = useMemo(
    () =>
      selectedBoardIds
        .map((boardId) => boards.find((board) => board.id === boardId))
        .filter((board): board is PublerBoard => Boolean(board)),
    [boards, selectedBoardIds],
  );
  const currentWorkspaceProfile = useMemo(
    () => profileCatalog.find((profile) => profile.workspaceId === workspaceId) ?? null,
    [profileCatalog, workspaceId],
  );
  const selectedAiCredential = useMemo(
    () => aiCredentials.find((credential) => credential.id === selectedAiCredentialId) ?? null,
    [aiCredentials, selectedAiCredentialId],
  );
  const currentWorkspaceName = useMemo(
    () =>
      currentWorkspaceProfile?.workspaceName ||
      workspaces.find((workspace) => workspace.id === workspaceId)?.name ||
      "",
    [currentWorkspaceProfile?.workspaceName, workspaceId, workspaces],
  );
  const profileDefaultBoardId = currentWorkspaceProfile?.defaultBoardId ?? "";
  const profileBoardSelectionId = primaryBoardId || selectedBoardIds[0] || "";
  const isAccountUsingProfileDefault = Boolean(
    currentWorkspaceProfile && accountId && accountId === currentWorkspaceProfile.defaultAccountId,
  );
  const isBoardUsingProfileDefault = Boolean(
    currentWorkspaceProfile &&
      profileDefaultBoardId &&
      profileBoardSelectionId === profileDefaultBoardId,
  );
  const canSaveProfileDefaults = Boolean(currentWorkspaceProfile && workspaceId && accountId);
  const hasUnsavedProfileDefaults = Boolean(
    currentWorkspaceProfile &&
      (accountId !== (currentWorkspaceProfile.defaultAccountId ?? "") ||
        profileBoardSelectionId !== (currentWorkspaceProfile.defaultBoardId ?? "")),
  );
  const activeProfileDefaultBoard = useMemo(
    () => boards.find((board) => board.id === profileDefaultBoardId) ?? null,
    [boards, profileDefaultBoardId],
  );
  const isScheduleInsideSpacingGap = useMemo(() => {
    if (!scheduleContext.spacingRecommendedFirstPublishAt || !firstPublishAt) {
      return false;
    }

    const selectedDate = new Date(firstPublishAt);
    const recommendedDate = new Date(scheduleContext.spacingRecommendedFirstPublishAt);

    if (Number.isNaN(selectedDate.getTime()) || Number.isNaN(recommendedDate.getTime())) {
      return false;
    }

    return selectedDate < recommendedDate;
  }, [firstPublishAt, scheduleContext.spacingRecommendedFirstPublishAt]);
  const filteredBoards = useMemo(() => {
    const query = boardSearchQuery.trim().toLowerCase();
    if (!query) {
      return boards;
    }

    return boards.filter((board) => board.name.toLowerCase().includes(query));
  }, [boardSearchQuery, boards]);

  const summary = useMemo(
    () => ({
      uploaded: currentPins.filter((pin) => pin.mediaStatus === "UPLOADED").length,
      mediaFailed: currentPins.filter((pin) => pin.mediaStatus === "FAILED").length,
      mediaUploading: currentPins.filter((pin) => pin.mediaStatus === "UPLOADING").length,
      titlesReady: currentPins.filter((pin) => Boolean(copyByPinId.get(pin.id)?.title.trim())).length,
      descriptionsReady: currentPins.filter((pin) =>
        Boolean(copyByPinId.get(pin.id)?.description.trim()),
      ).length,
      scheduled: currentPins.filter((pin) => pin.scheduleStatus === "SCHEDULED").length,
      scheduleFailed: currentPins.filter((pin) => pin.scheduleStatus === "FAILED").length,
    }),
    [copyByPinId, currentPins],
  );

  const failedUploadPins = useMemo(
    () => currentPins.filter((pin) => pin.mediaStatus === "FAILED"),
    [currentPins],
  );
  const selectedUploadPins = useMemo(
    () => currentPins.filter((pin) => selectedPinIds.includes(pin.id)),
    [currentPins, selectedPinIds],
  );
  const selectedUploadProgress = useMemo(() => {
    return buildUploadProgress(selectedUploadPins);
  }, [selectedUploadPins]);
  const trackedUploadPins = useMemo(
    () =>
      uploadTracking
        ? currentPins.filter((pin) => uploadTracking.pinIds.includes(pin.id))
        : [],
    [currentPins, uploadTracking],
  );
  const trackedUploadProgress = useMemo(
    () => buildUploadProgress(trackedUploadPins),
    [trackedUploadPins],
  );
  const visibleUploadPins = uploadTracking?.active ? trackedUploadPins : selectedUploadPins;
  const visibleUploadProgress = uploadTracking?.active ? trackedUploadProgress : selectedUploadProgress;

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
  const selectedScheduleDayKey = firstPublishAt ? firstPublishAt.slice(0, 10) : "";
  const selectedScheduleDay = useMemo(
    () =>
      selectedScheduleDayKey
        ? scheduleContext.upcomingQueueDays.find((day) => day.date === selectedScheduleDayKey) ?? null
        : null,
    [scheduleContext.upcomingQueueDays, selectedScheduleDayKey],
  );
  const isSelectedScheduleDayFull = Boolean(selectedScheduleDay?.isFull);

  const schedulePreview = useMemo(() => {
    if (selectedPins.length === 0 || !firstPublishAt) {
      return [];
    }

    try {
      return buildCapacityAwareSchedulePreview({
        pinIds: selectedPins.map((pin) => pin.id),
        firstPublishAt,
        intervalMinutes: intervalDays * 24 * 60,
        jitterMinutes: jitterDays * 24 * 60,
        targetPerDay: scheduleContext.dailyPublishTarget,
        existingScheduledCountsByDate: scheduleContext.scheduledCountsByDate,
        existingScheduledMinutesByDate: scheduleContext.occupiedMinutesByDate,
      });
    } catch {
      return [];
    }
  }, [
    firstPublishAt,
    intervalDays,
    jitterDays,
    scheduleContext.dailyPublishTarget,
    scheduleContext.scheduledCountsByDate,
    scheduleContext.occupiedMinutesByDate,
    selectedPins,
  ]);

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
        assignedBoardId: boardOverrideByPinId[assignment.pinId] || assignment.boardId,
        board:
          selectedBoards.find(
            (board) => board.id === (boardOverrideByPinId[assignment.pinId] || assignment.boardId),
          ) ?? null,
      })),
    [
      boardDistributionMode,
      boardOverrideByPinId,
      primaryBoardId,
      primaryBoardPercent,
      schedulePreview,
      selectedBoardIds,
      selectedBoards,
    ],
  );

  const publerRuntimeState = useMemo(
    () =>
      resolvePublerRuntimeState({
        integrationReady,
        isLoadingOptions,
        optionsError,
        workspacesCount: workspaces.length,
        accountId,
        selectedBoardCount: selectedBoardIds.length,
      }),
    [
      accountId,
      integrationReady,
      isLoadingOptions,
      optionsError,
      selectedBoardIds.length,
      workspaces.length,
    ],
  );

  const aiRuntimeState = useMemo(() => resolveAiRuntimeState(integrationReady), [integrationReady]);
  const canUseSelectedAiCredential = Boolean(
    selectedAiCredential && selectedAiCredential.canUseApiKey,
  );

  const refreshScheduleContext = useCallback(async () => {
    if (!workspaceId) {
      const emptyContext = buildEmptyScheduleContext("");
      setScheduleContext(emptyContext);
      return emptyContext;
    }

    setIsLoadingScheduleContext(true);

    try {
      const response = await fetch(
        `/api/dashboard/jobs/${jobId}/publish/schedule-context?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        scheduleContext?: PublishScheduleContext;
      };

      if (!response.ok || !data.ok || !data.scheduleContext) {
        throw new Error(data.error ?? "Unable to load schedule context.");
      }

      setScheduleContext(data.scheduleContext);
      return data.scheduleContext;
    } catch {
      const fallbackContext = buildEmptyScheduleContext(workspaceId);
      setScheduleContext((current) => ({
        ...fallbackContext,
        latestScheduledAt: current.latestScheduledAt,
        latestPublishedAt: current.latestPublishedAt,
        anchorAt: current.anchorAt,
        anchorSource: current.anchorSource,
      }));
      return null;
    } finally {
      setIsLoadingScheduleContext(false);
    }
  }, [jobId, workspaceId]);

  useEffect(() => {
    const savedSelection = readPersistedPublishSelection(jobId);
    if (savedSelection) {
      setWorkspaceId(savedSelection.workspaceId || defaults.workspaceId);
      setAccountId(savedSelection.accountId || defaults.accountId);
      setSelectedBoardIds(savedSelection.selectedBoardIds ?? []);
      setBoardDistributionMode(savedSelection.boardDistributionMode ?? "round_robin");
      setPrimaryBoardId(savedSelection.primaryBoardId ?? defaults.boardId);
      setPrimaryBoardPercent(savedSelection.primaryBoardPercent ?? 60);
    }
    setHasLoadedSavedDestination(true);
  }, [defaults.accountId, defaults.boardId, defaults.workspaceId, jobId]);

  useEffect(() => {
    if (!hasLoadedSavedDestination) {
      return;
    }

    persistPublishSelection(jobId, {
      workspaceId,
      accountId,
      selectedBoardIds,
      boardDistributionMode,
      primaryBoardId,
      primaryBoardPercent,
    });
  }, [
    accountId,
    boardDistributionMode,
    hasLoadedSavedDestination,
    jobId,
    primaryBoardId,
    primaryBoardPercent,
    selectedBoardIds,
    workspaceId,
  ]);

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

  useEffect(() => {
    setBoardOverrideByPinId((current) => {
      const validPinIds = new Set(schedulePreview.map((item) => item.pinId));
      const nextEntries = Object.entries(current).filter(
        ([pinId, boardId]) => validPinIds.has(pinId) && selectedBoardIds.includes(boardId),
      );

      if (nextEntries.length === Object.keys(current).length) {
        return current;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [schedulePreview, selectedBoardIds]);

  useEffect(() => {
    if (uploadTracking?.active || activeAction) {
      return;
    }

    const shouldPollUploads = currentPins.some((pin) => pin.mediaStatus === "UPLOADING");
    const shouldPollTitleTasks = trackedTitleTaskIds.length > 0 || activeTitleTasks.length > 0;
    const shouldPollDescriptionTasks =
      trackedDescriptionTaskIds.length > 0 || activeDescriptionTasks.length > 0;

    if (!shouldPollUploads && !shouldPollTitleTasks && !shouldPollDescriptionTasks) {
      return;
    }

    let isCancelled = false;
    const refresh = async () => {
      try {
        setIsRefreshingStatus(true);
        const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as PublishStatusResponse;
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to refresh publish status.");
        }
        if (isCancelled) {
          return;
        }

        setLiveLatestScheduleRun(data.latestScheduleRun ?? null);
        if (data.pins) {
          setLivePins(data.pins);
          setCopyState((current) => mergeCopyStateWithPins(current, data.pins ?? []));
          setTitleCandidatesByPinId(buildTitleCandidatesByPinId(data.pins));
        }
        setTitleTasks(data.titleTasks ?? []);
        setDescriptionTasks(data.descriptionTasks ?? []);

        if (!isCancelled && trackedTitleTaskIds.length > 0 && data.titleTasks) {
          const trackedTasks = data.titleTasks.filter((task) => trackedTitleTaskIds.includes(task.id));
          if (trackedTasks.length > 0 && trackedTasks.every((task) => ["SUCCEEDED", "FAILED"].includes(task.status))) {
            const failedTaskCount = trackedTasks.filter((task) => task.status === "FAILED").length;
            setTrackedTitleTaskIds([]);
            setSectionFeedback((current) => ({
              ...current,
              titles: {
                tone: failedTaskCount > 0 ? "warning" : "success",
                message:
                  failedTaskCount > 0
                    ? `Title generation finished with ${failedTaskCount} failed batch${failedTaskCount === 1 ? "" : "es"}. Review the affected pins below.`
                    : "Title generation finished. Review and choose the best options below.",
              },
            }));
            notify({
              tone: failedTaskCount > 0 ? "info" : "success",
              title: failedTaskCount > 0 ? "Title generation finished with issues" : "Title generation complete",
              message:
                failedTaskCount > 0
                  ? `${trackedTasks.length - failedTaskCount} batches completed and ${failedTaskCount} failed.`
                  : "Title options are ready for review.",
            });
          }
        }
        if (!isCancelled && trackedDescriptionTaskIds.length > 0 && data.descriptionTasks) {
          const trackedTasks = data.descriptionTasks.filter((task) =>
            trackedDescriptionTaskIds.includes(task.id),
          );
          if (trackedTasks.length > 0 && trackedTasks.every((task) => ["SUCCEEDED", "FAILED"].includes(task.status))) {
            const failedTaskCount = trackedTasks.filter((task) => task.status === "FAILED").length;
            setTrackedDescriptionTaskIds([]);
            setSectionFeedback((current) => ({
              ...current,
              descriptions: {
                tone: failedTaskCount > 0 ? "warning" : "success",
                message:
                  failedTaskCount > 0
                    ? `Description generation finished with ${failedTaskCount} failed batch${failedTaskCount === 1 ? "" : "es"}. Only pins needing attention are expanded below.`
                    : "Descriptions are ready. Pins without issues stay collapsed below.",
              },
            }));
            notify({
              tone: failedTaskCount > 0 ? "info" : "success",
              title:
                failedTaskCount > 0
                  ? "Description generation finished with issues"
                  : "Description generation complete",
              message:
                failedTaskCount > 0
                  ? `${trackedTasks.length - failedTaskCount} batches completed and ${failedTaskCount} failed.`
                  : "Descriptions generated successfully.",
            });
          }
        }
      } catch {
        // Keep the last known UI state if polling fails temporarily.
      } finally {
        if (!isCancelled) {
          setIsRefreshingStatus(false);
        }
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 2000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [
    activeAction,
    activeDescriptionTasks.length,
    activeTitleTasks.length,
    currentPins,
    jobId,
    notify,
    trackedDescriptionTaskIds,
    trackedTitleTaskIds,
    uploadTracking,
  ]);

  useEffect(() => {
    if (!uploadTracking?.active) {
      if (uploadProgressToastIdRef.current) {
        dismissNotification(uploadProgressToastIdRef.current);
        uploadProgressToastIdRef.current = null;
      }
      return;
    }

    const snapshot = buildUploadProgress(trackedUploadPins);
    const title = `${snapshot.completed} of ${snapshot.total} pins uploaded`;
    const message = buildUploadProgressMessage(snapshot);

    if (!uploadProgressToastIdRef.current) {
      uploadProgressToastIdRef.current = notify({
        tone: "progress",
        title,
        message,
        sticky: true,
      });
      return;
    }

    updateNotification(uploadProgressToastIdRef.current, {
      tone: "progress",
      title,
      message,
      sticky: true,
    });
  }, [
    dismissNotification,
    notify,
    trackedUploadPins,
    updateNotification,
    uploadTracking,
  ]);

  const getWorkspaceProfileDefaults = useCallback((nextWorkspaceId: string) => {
    const profile = profileCatalog.find((item) => item.workspaceId === nextWorkspaceId);

    return {
      accountId: profile?.defaultAccountId ?? "",
      boardId: profile?.defaultBoardId ?? "",
    };
  }, [profileCatalog]);

  const loadPublerOptions = useCallback(
    async (input?: {
      preserveCurrentSelection?: boolean;
      nextWorkspaceId?: string;
      nextAccountId?: string;
    }) => {
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
        const profileDefaults = getWorkspaceProfileDefaults(
          input?.nextWorkspaceId ?? workspaceId,
        );
        const resolvedWorkspaceId =
          input?.preserveCurrentSelection && workspaceId
            ? workspaceId
            : data.selectedWorkspaceId ?? workspaceId;
        const resolvedAccountId =
          input?.preserveCurrentSelection && accountId
            ? accountId
            : input?.nextAccountId?.trim() ||
              profileDefaults.accountId ||
              data.selectedAccountId ||
              accountId;

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

          if (
            profileDefaults.boardId &&
            nextBoards.some((board) => board.id === profileDefaults.boardId)
          ) {
            return [profileDefaults.boardId];
          }

          return [];
        });
        setPrimaryBoardId((current) => {
          if (current && nextBoards.some((board) => board.id === current)) {
            return current;
          }
          if (
            profileDefaults.boardId &&
            nextBoards.some((board) => board.id === profileDefaults.boardId)
          ) {
            return profileDefaults.boardId;
          }
          return nextBoards[0]?.id ?? "";
        });
      } catch (error) {
        setOptionsError(
          error instanceof Error ? error.message : "Unable to load Publer options.",
        );
      } finally {
        setIsLoadingOptions(false);
      }
    },
    [accountId, getWorkspaceProfileDefaults, workspaceId],
  );

  useEffect(() => {
    if (!integrationReady.canUsePublerApiKey) {
      return;
    }

    if (!hasLoadedSavedDestination || hasInitializedOptionsRef.current) {
      return;
    }

    hasInitializedOptionsRef.current = true;
    void loadPublerOptions({
      preserveCurrentSelection: true,
      nextWorkspaceId: workspaceId || defaults.workspaceId,
      nextAccountId: accountId || defaults.accountId,
    });
  }, [
    accountId,
    defaults.accountId,
    defaults.workspaceId,
    hasLoadedSavedDestination,
    integrationReady.canUsePublerApiKey,
    loadPublerOptions,
    workspaceId,
  ]);

  useEffect(() => {
    if (!workspaceId) {
      setScheduleContext(buildEmptyScheduleContext(""));
      return;
    }

    let isCancelled = false;
    setScheduleContext(buildEmptyScheduleContext(workspaceId));

    const loadScheduleContext = async () => {
      try {
        const nextContext = await refreshScheduleContext();
        if (!isCancelled && nextContext) {
          setScheduleContext(nextContext);
        }
      } catch {
        if (!isCancelled) {
          setScheduleContext((current) => ({
            ...current,
            workspaceId,
          }));
        }
      }
    };

    void loadScheduleContext();

    return () => {
      isCancelled = true;
    };
  }, [refreshScheduleContext, workspaceId]);

  useEffect(() => {
    if (hasEditedFirstPublishAt || !scheduleContext.recommendedFirstPublishAt) {
      return;
    }

    setFirstPublishAt(formatDateTimeLocalValue(scheduleContext.recommendedFirstPublishAt));
  }, [hasEditedFirstPublishAt, scheduleContext.recommendedFirstPublishAt]);

  async function runAction(payload: unknown) {
    const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const rawBody = await response.text();
    const data = parsePublishActionResponse(rawBody) as {
      ok?: boolean;
      error?: string;
      result?: PublishActionResult;
    };

    if (!response.ok || !data.ok) {
      throw new Error(data.error ?? extractResponseErrorMessage(rawBody) ?? "Request failed.");
    }

    return data.result;
  }

  async function queueTitleGeneration(input: {
    generatedPinIds: string[];
    forceRegenerate?: boolean;
  }) {
    const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_titles",
        generatedPinIds: input.generatedPinIds,
        aiCredentialId: selectedAiCredentialId,
        forceRegenerate: input.forceRegenerate,
      }),
    });
    const rawBody = await response.text();
    const data = parsePublishActionResponse(rawBody) as {
      ok?: boolean;
      error?: string;
      result?: QueueTitleGenerationResult;
    };

    if (!response.ok || !data.ok || !data.result) {
      throw new Error(data.error ?? extractResponseErrorMessage(rawBody) ?? "Unable to queue title generation.");
    }

    return data.result;
  }

  function createEmptyPublishResult(message: string): PublishActionResult {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      message,
      failures: [],
    };
  }

  async function handlePinBatchAction(input: {
    action: "upload_media" | "generate_titles" | "generate_descriptions";
    generatedPinIds: string[];
    workspaceId?: string;
    aiCredentialId?: string;
    fallbackMessage: string;
    section: PublishSectionKey;
  }) {
    startTransition(async () => {
      const result = createEmptyPublishResult(input.fallbackMessage);
      let progressToastId: string | null = null;

      try {
        setSectionFeedback((current) => ({
          ...current,
          [input.section]: null,
        }));
        setActiveAction(input.action);

        if (input.action === "upload_media") {
          setUploadTracking({
            active: true,
            pinIds: input.generatedPinIds,
          });
          setLivePins((current) =>
            current.map((pin) =>
              input.generatedPinIds.includes(pin.id) && pin.mediaStatus !== "UPLOADED"
                ? {
                    ...pin,
                    mediaStatus: "UPLOADING",
                    mediaError: null,
                  }
                : pin,
            ),
          );
        } else {
          const title =
            input.action === "generate_titles"
              ? `0 of ${input.generatedPinIds.length} titles generated`
              : `0 of ${input.generatedPinIds.length} descriptions generated`;
          const message =
            input.action === "generate_titles"
              ? "Preparing title generation."
              : "Preparing description generation.";
          progressToastId = notify({
            tone: "progress",
            title,
            message,
            sticky: true,
          });
          copyProgressToastIdRef.current = progressToastId;
        }

        const pinIdChunks =
          input.action === "upload_media"
            ? input.generatedPinIds.map((pinId) => [pinId])
            : chunkPinIds(
                input.generatedPinIds,
                input.action === "generate_titles"
                  ? TITLE_ACTION_CHUNK_SIZE
                  : DESCRIPTION_ACTION_CHUNK_SIZE,
              );

        let completedPins = 0;

        for (const [chunkIndex, pinIdChunk] of pinIdChunks.entries()) {
          if (progressToastId) {
            updateNotification(progressToastId, {
              tone: "progress",
              title:
                input.action === "generate_titles"
                  ? `${completedPins} of ${input.generatedPinIds.length} titles generated`
                  : `${completedPins} of ${input.generatedPinIds.length} descriptions generated`,
              message: buildChunkProgressMessage({
                action:
                  input.action === "generate_titles"
                    ? "generate_titles"
                    : "generate_descriptions",
                completed: completedPins,
                total: input.generatedPinIds.length,
                currentChunk: chunkIndex + 1,
                chunkCount: pinIdChunks.length,
                chunkPinIds: pinIdChunk,
                pins: currentPins,
              }),
              sticky: true,
            });
          }

          try {
            const nextResult = await runAction({
              action: input.action,
              generatedPinIds: pinIdChunk,
              ...(input.action !== "upload_media" && input.aiCredentialId
                ? { aiCredentialId: input.aiCredentialId }
                : {}),
              ...(input.action === "upload_media" && input.workspaceId
                ? { workspaceId: input.workspaceId }
                : {}),
            });

            result.processed += nextResult?.processed ?? 0;
            result.succeeded += nextResult?.succeeded ?? 0;
            result.failed += nextResult?.failed ?? 0;
            result.skipped += nextResult?.skipped ?? 0;
            result.failures.push(...(nextResult?.failures ?? []));
            const generatedTitleOptions = nextResult?.generatedTitleOptions ?? [];
            if (generatedTitleOptions.length > 0) {
              result.generatedTitleOptions = [
                ...(result.generatedTitleOptions ?? []),
                ...generatedTitleOptions,
              ];
              setTitleCandidatesByPinId((current) => ({
                ...current,
                ...Object.fromEntries(
                  generatedTitleOptions.map((item) => [item.pinId, item.titles]),
                ),
              }));
            }
          } catch (error) {
            result.processed += pinIdChunk.length;
            result.failed += pinIdChunk.length;
            result.failures.push(
              ...pinIdChunk.map((pinId) => ({
                pinId,
                reason: error instanceof Error ? error.message : input.fallbackMessage,
              })),
            );
          }

          completedPins = Math.min(
            input.generatedPinIds.length,
            result.succeeded + result.failed + result.skipped,
          );
          await refreshPublishSnapshot().catch(() => null);
        }

        result.message =
          input.action === "generate_titles"
            ? `Generated titles for ${result.succeeded} pin${result.succeeded === 1 ? "" : "s"}.`
            : input.action === "generate_descriptions"
              ? `Generated descriptions for ${result.succeeded} pin${result.succeeded === 1 ? "" : "s"}.`
              : `Uploaded ${result.succeeded} pin${result.succeeded === 1 ? "" : "s"}.`;

        if (progressToastId) {
          dismissNotification(progressToastId);
          copyProgressToastIdRef.current = null;
        }

        const pins = await refreshPublishSnapshot().catch(() => null);
        if (input.action === "upload_media") {
          const evaluatedPins = pins ?? currentPins;
          const remainingPinIds = evaluatedPins
            .filter(
              (pin) =>
                input.generatedPinIds.includes(pin.id) && pin.mediaStatus !== "UPLOADED",
            )
            .map((pin) => pin.id);
          const failedPinIds = evaluatedPins
            .filter(
              (pin) =>
                input.generatedPinIds.includes(pin.id) && pin.mediaStatus === "FAILED",
            )
            .map((pin) => pin.id);

          if (remainingPinIds.length > 0) {
            setSelectedPinIds(remainingPinIds);
          }

          setSectionFeedback((current) => ({
            ...current,
            upload: {
              tone: remainingPinIds.length > 0 ? "warning" : "success",
              message:
                remainingPinIds.length > 0
                  ? buildUploadRecoveryMessage({
                      uploadedCount: result.succeeded,
                      remainingCount: remainingPinIds.length,
                      failedCount: failedPinIds.length,
                      pendingCount: Math.max(0, remainingPinIds.length - failedPinIds.length),
                    })
                  : `${result.succeeded} pin${result.succeeded === 1 ? "" : "s"} uploaded successfully.`,
            },
          }));

          notify({
            tone: remainingPinIds.length > 0 ? "info" : "success",
            title:
              remainingPinIds.length > 0
                ? "Upload finished with remaining pins"
                : "Media upload complete",
            message:
              remainingPinIds.length > 0
                ? `${result.succeeded} uploaded. ${remainingPinIds.length} still need attention.`
                : `${result.succeeded} pin${result.succeeded === 1 ? "" : "s"} uploaded to Publer.`,
          });
        } else {
          const failedPinIds = Array.from(
            new Set(
              (result.failures ?? [])
                .map((failure) => failure.pinId)
                .filter((pinId) => input.generatedPinIds.includes(pinId)),
            ),
          );

          if (failedPinIds.length > 0) {
            setSelectedPinIds(failedPinIds);
          }

          setSectionFeedback((current) => ({
            ...current,
            [input.section]: {
              tone: result.failed > 0 ? "warning" : "success",
              message:
                result.failed > 0
                  ? `${result.succeeded} completed, ${result.failed} failed. Failed pins are selected so retry runs only on them.`
                  : result.message,
            },
          }));
        }

        if (input.action === "generate_titles" || input.action === "generate_descriptions") {
          notify({
            tone: result.failed > 0 ? "info" : "success",
            title:
              input.action === "generate_titles"
                ? "Title generation complete"
                : "Description generation complete",
            message:
              result.failed > 0
                ? `${result.succeeded} completed, ${result.failed} failed. Failed pins are selected for retry.`
                : result.message,
          });
        }
      } catch (error) {
        if (progressToastId) {
          dismissNotification(progressToastId);
          copyProgressToastIdRef.current = null;
        }
        setSectionFeedback((current) => ({
          ...current,
          [input.section]: {
            tone: "error",
            message: error instanceof Error ? error.message : input.fallbackMessage,
          },
        }));
        notify({
          tone: "error",
          title:
            input.action === "upload_media"
              ? "Media upload failed"
              : input.action === "generate_titles"
                ? "Title generation failed"
                : "Description generation failed",
          message: error instanceof Error ? error.message : input.fallbackMessage,
          sticky: true,
        });
      } finally {
        if (input.action === "upload_media") {
          setUploadTracking((current) =>
            current
              ? {
                  ...current,
                  active: false,
                }
              : null,
          );
        }
        if (copyProgressToastIdRef.current) {
          dismissNotification(copyProgressToastIdRef.current);
          copyProgressToastIdRef.current = null;
        }
        setActiveAction(null);
      }
    });
  }

  const refreshPublishSnapshot = useCallback(async () => {
    const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await response.json()) as PublishStatusResponse;

    if (!response.ok || !data.ok) {
      return null;
    }

    setLiveLatestScheduleRun(data.latestScheduleRun ?? null);
    if (data.pins) {
      setLivePins(data.pins);
      setCopyState((current) => mergeCopyStateWithPins(current, data.pins ?? []));
      setTitleCandidatesByPinId(buildTitleCandidatesByPinId(data.pins));
    }
    setTitleTasks(data.titleTasks ?? []);
    setDescriptionTasks(data.descriptionTasks ?? []);

    return data.pins ?? null;
  }, [jobId]);

  useEffect(() => {
    void refreshPublishSnapshot().catch(() => null);
  }, [refreshPublishSnapshot]);

  function saveProfileDefaults() {
    if (!currentWorkspaceProfile || !workspaceId || !accountId) {
      return;
    }

    const nextBoardId = profileBoardSelectionId;

    startTransition(async () => {
      setIsSavingProfileDefaults(true);
      setOptionsError(null);
      setProfileDefaultsFeedback(null);

      try {
        const response = await fetch("/api/dashboard/settings/workspace-profile-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            defaultAccountId: accountId,
            defaultBoardId: nextBoardId,
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          profile?: WorkspaceProfileSummary | null;
        };

        if (!response.ok || !data.ok || !data.profile) {
          throw new Error(data.error ?? "Unable to save profile defaults.");
        }

        setProfileCatalog((current) =>
          current.map((profile) =>
            profile.workspaceId === data.profile?.workspaceId ? data.profile : profile,
          ),
        );
        setOptionsError(null);
        setProfileDefaultsFeedback({
          tone: "success",
          message: "Saved to profile.",
        });
        router.refresh();
      } catch (error) {
        setProfileDefaultsFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Unable to save profile defaults.",
        });
      } finally {
        setIsSavingProfileDefaults(false);
      }
    });
  }

  function handleAction(payload: unknown, fallbackMessage: string, section?: PublishSectionKey) {
    startTransition(async () => {
      const action = typeof payload === "object" && payload && "action" in payload
        ? String((payload as { action?: string }).action ?? "")
        : "";
      const actionPinIds =
        typeof payload === "object" &&
        payload &&
        "generatedPinIds" in payload &&
        Array.isArray((payload as { generatedPinIds?: unknown }).generatedPinIds)
          ? ((payload as { generatedPinIds: string[] }).generatedPinIds ?? [])
          : [];
      const feedbackSection = section ?? resolveSectionForAction(action);
      let progressToastId: string | null = null;

      try {
        if (feedbackSection) {
          setSectionFeedback((current) => ({
            ...current,
            [feedbackSection]: null,
          }));
        }
        if (action) {
          setActiveAction(action);
        }
        if (action === "upload_media") {
          setUploadTracking({
            active: true,
            pinIds: actionPinIds,
          });
          setLivePins((current) =>
            current.map((pin) =>
              actionPinIds.includes(pin.id) && pin.mediaStatus !== "UPLOADED"
                ? {
                    ...pin,
                    mediaStatus: "UPLOADING",
                    mediaError: null,
                  }
                : pin,
            ),
          );
        } else if (action === "schedule") {
          progressToastId = notify({
            tone: "progress",
            title: `Scheduling ${actionPinIds.length} selected pins`,
            message: "Submitting the schedule to Publer and waiting for confirmation.",
            sticky: true,
          });
        }
        const result = await runAction(payload);
        if (progressToastId) {
          dismissNotification(progressToastId);
          progressToastId = null;
        }
        if (feedbackSection) {
          setSectionFeedback((current) => ({
            ...current,
            [feedbackSection]: {
              tone: result && result.failed > 0 ? "warning" : "success",
              message: result?.message ?? "Action completed.",
            },
          }));
        }
        if (action === "generate_titles" && result?.generatedTitleOptions) {
          setTitleCandidatesByPinId((current) => ({
            ...current,
            ...Object.fromEntries(
              result.generatedTitleOptions!.map((item) => [item.pinId, item.titles]),
            ),
          }));
        }
        if (action === "upload_media") {
          const uploadedCount = result?.succeeded ?? 0;
          const failedCount = result?.failed ?? 0;
          notify({
            tone: failedCount > 0 ? "info" : "success",
            title: failedCount > 0 ? "Upload finished with issues" : "Media upload complete",
            message:
              failedCount > 0
                ? `${uploadedCount} pin${uploadedCount === 1 ? "" : "s"} uploaded, ${failedCount} failed.`
                : `${uploadedCount} pin${uploadedCount === 1 ? "" : "s"} uploaded to Publer.`,
          });
        }
        if (action) {
          const pins = await refreshPublishSnapshot();
          if (pins && action === "upload_media") {
            const failedPinIds = pins
              .filter((pin) => actionPinIds.includes(pin.id) && pin.mediaStatus === "FAILED")
              .map((pin) => pin.id);

            if (failedPinIds.length > 0) {
              setSelectedPinIds(failedPinIds);
              setSectionFeedback((current) => ({
                ...current,
                upload: {
                  tone: "warning",
                  message: `${result?.succeeded ?? 0} uploaded, ${failedPinIds.length} failed. Failed pins are selected so you can retry them.`,
                },
              }));
            } else if (actionPinIds.length > 0) {
              setSectionFeedback((current) => ({
                ...current,
                upload: {
                  tone: "success",
                  message: `${result?.succeeded ?? 0} pin${(result?.succeeded ?? 0) === 1 ? "" : "s"} uploaded successfully.`,
                },
              }));
            }
          }
          if (pins && action === "schedule") {
            const nextScheduleContext = await refreshScheduleContext().catch(() => null);
            const failedPinIds = Array.from(
              new Set((result?.failures ?? []).map((failure) => failure.pinId)),
            );
            if (failedPinIds.length > 0) {
              setSelectedPinIds(failedPinIds);
              setHasEditedFirstPublishAt(false);
              if (nextScheduleContext?.recommendedFirstPublishAt) {
                setFirstPublishAt(
                  formatDateTimeLocalValue(nextScheduleContext.recommendedFirstPublishAt),
                );
              }
            }
          }
        }
        if (action === "schedule") {
          notify({
            tone: result && result.failed > 0 ? "info" : "success",
            title: result && result.failed > 0 ? "Scheduling finished with issues" : "Scheduling complete",
            message: result?.message ?? "Scheduling finished.",
          });
        }
        router.refresh();
      } catch (error) {
        if (progressToastId) {
          dismissNotification(progressToastId);
          progressToastId = null;
        }
        if (feedbackSection) {
          setSectionFeedback((current) => ({
            ...current,
            [feedbackSection]: {
              tone: "error",
              message: error instanceof Error ? error.message : fallbackMessage,
            },
          }));
        }
        if (action === "upload_media") {
          const pins = await refreshPublishSnapshot().catch(() => null);
          if (pins && actionPinIds.length > 0) {
            const remainingPinIds = pins
              .filter((pin) => actionPinIds.includes(pin.id) && pin.mediaStatus !== "UPLOADED")
              .map((pin) => pin.id);
            const uploadedCount = pins.filter(
              (pin) => actionPinIds.includes(pin.id) && pin.mediaStatus === "UPLOADED",
            ).length;
            const failedCount = pins.filter(
              (pin) => actionPinIds.includes(pin.id) && pin.mediaStatus === "FAILED",
            ).length;
            const pendingCount = remainingPinIds.length - failedCount;

            if (remainingPinIds.length > 0) {
              setSelectedPinIds(remainingPinIds);
            }

            setSectionFeedback((current) => ({
              ...current,
              upload: {
                tone: remainingPinIds.length > 0 ? "warning" : "error",
                message:
                  remainingPinIds.length > 0
                    ? buildUploadRecoveryMessage({
                        uploadedCount,
                        remainingCount: remainingPinIds.length,
                        failedCount,
                        pendingCount,
                      })
                    : error instanceof Error
                      ? error.message
                      : fallbackMessage,
              },
            }));
          }
          notify({
            tone: "error",
            title: "Media upload failed",
            message: error instanceof Error ? error.message : fallbackMessage,
            sticky: true,
          });
        } else if (action === "schedule") {
          notify({
            tone: "error",
            title: "Scheduling failed",
            message: error instanceof Error ? error.message : fallbackMessage,
            sticky: true,
          });
        }
      } finally {
        if (
          typeof payload === "object" &&
          payload &&
          "action" in payload &&
          String((payload as { action?: string }).action ?? "") === "upload_media"
        ) {
          setUploadTracking((current) =>
            current
              ? {
                  ...current,
                  active: false,
                }
              : null,
          );
        }
        setActiveAction(null);
      }
    });
  }

  function updateCopy(generatedPinId: string, key: "title" | "description", value: string) {
    const nextValue =
      key === "title"
        ? value.slice(0, TITLE_MAX_LENGTH)
        : value.slice(0, DESCRIPTION_MAX_LENGTH);

    setCopyState((current) =>
      current.map((item) =>
        item.generatedPinId === generatedPinId ? { ...item, [key]: nextValue } : item,
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
    setProfileDefaultsFeedback(null);
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

  function selectBy(predicate: (pin: PinItem) => boolean) {
    setSelectedPinIds(orderedPins.filter(predicate).map((pin) => pin.id));
  }

function formatPreviewDate(value: Date) {
  return value.toLocaleString();
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

  function triggerUploadSelected() {
    void handlePinBatchAction({
      action: "upload_media",
      generatedPinIds: selectedPinIds,
      workspaceId,
      fallbackMessage: "Unable to upload media.",
      section: "upload",
    });
  }

  function triggerGenerateTitles() {
    void triggerQueueGenerateTitles(selectedTitleReadyPins.map((pin) => pin.id));
  }

  function triggerQueueGenerateTitles(generatedPinIds: string[], forceRegenerate = false) {
    startTransition(async () => {
      try {
        setSectionFeedback((current) => ({
          ...current,
          titles: null,
        }));
        setActiveAction("generate_titles");

        const result = await queueTitleGeneration({
          generatedPinIds,
          forceRegenerate,
        });

        setTitleTasks(result.tasks);
        setTrackedTitleTaskIds(result.tasks.map((task) => task.id));
        setSectionFeedback((current) => ({
          ...current,
          titles: {
            tone: "success",
            message: result.message,
          },
        }));
        notify({
          tone: "success",
          title: "Title generation queued",
          message: result.message,
        });
        await refreshPublishSnapshot().catch(() => null);
      } catch (error) {
        setSectionFeedback((current) => ({
          ...current,
          titles: {
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to queue title generation.",
          },
        }));
        notify({
          tone: "error",
          title: "Title generation failed",
          message: error instanceof Error ? error.message : "Unable to queue title generation.",
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  async function queueDescriptionGeneration(input: {
    generatedPinIds: string[];
    forceRegenerate?: boolean;
  }) {
    const response = await fetch(`/api/dashboard/jobs/${jobId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_descriptions",
        generatedPinIds: input.generatedPinIds,
        aiCredentialId: selectedAiCredentialId,
        forceRegenerate: input.forceRegenerate,
      }),
    });
    const rawBody = await response.text();
    const data = parsePublishActionResponse(rawBody) as {
      ok?: boolean;
      error?: string;
      result?: QueueTitleGenerationResult;
    };

    if (!response.ok || !data.ok || !data.result) {
      throw new Error(
        data.error ?? extractResponseErrorMessage(rawBody) ?? "Unable to queue description generation.",
      );
    }

    return data.result;
  }

  function triggerGenerateDescriptions() {
    void triggerQueueGenerateDescriptions(selectedDescriptionReadyPins.map((pin) => pin.id));
  }

  function triggerQueueGenerateDescriptions(generatedPinIds: string[], forceRegenerate = false) {
    startTransition(async () => {
      try {
        setSectionFeedback((current) => ({
          ...current,
          descriptions: null,
        }));
        setActiveAction("generate_descriptions");

        const result = await queueDescriptionGeneration({
          generatedPinIds,
          forceRegenerate,
        });

        setDescriptionTasks(result.tasks);
        setTrackedDescriptionTaskIds(result.tasks.map((task) => task.id));
        setSectionFeedback((current) => ({
          ...current,
          descriptions: {
            tone: "success",
            message: result.message,
          },
        }));
        notify({
          tone: "success",
          title: "Description generation queued",
          message: result.message,
        });
        await refreshPublishSnapshot().catch(() => null);
      } catch (error) {
        setSectionFeedback((current) => ({
          ...current,
          descriptions: {
            tone: "error",
            message:
              error instanceof Error ? error.message : "Unable to queue description generation.",
          },
        }));
        notify({
          tone: "error",
          title: "Description generation failed",
          message:
            error instanceof Error ? error.message : "Unable to queue description generation.",
          sticky: true,
        });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function triggerScheduleSelected() {
    handleAction(
      {
        action: "schedule",
        generatedPinIds: selectedPinIds,
        firstPublishAt,
        intervalMinutes: intervalDays * 24 * 60,
        jitterMinutes: jitterDays * 24 * 60,
        schedulePlan: schedulePreview.map((item) => ({
          pinId: item.pinId,
          scheduledFor: item.scheduledFor.toISOString(),
          boardId:
            schedulePreviewRows.find((row) => row.pinId === item.pinId)?.assignedBoardId,
        })),
        workspaceId,
        accountId,
        boardIds: selectedBoardIds,
        boardDistributionMode,
        primaryBoardId,
        primaryBoardPercent,
      },
      "Unable to schedule pins.",
      "schedule",
    );
  }

  return (
    <div className="space-y-6">
      <section className="sticky top-[92px] z-10 rounded-[24px] border border-[var(--dashboard-line)] bg-[color:var(--dashboard-panel)]/95 px-3 py-3 shadow-[var(--dashboard-shadow-sm)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--dashboard-panel-alt)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]">
              {selectedPinIds.length}/{currentPins.length} selected
            </span>
            <StepJump href="#publish-destination" label="Destination" />
            <StepJump href="#publish-upload" label="Upload" />
            <StepJump href="#publish-titles" label="Titles" />
            <StepJump href="#publish-descriptions" label="Descriptions" />
            <StepJump href="#publish-schedule" label="Schedule" />
            <StepJump href="#publish-pins" label="Pins" />
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolbarButton
              label="Upload"
              busy={isUploadingMedia}
              busyLabel="Uploading..."
              onClick={triggerUploadSelected}
              disabled={
                isPending ||
                Boolean(activeAction) ||
                selectedPins.length === 0 ||
                !integrationReady.canUsePublerApiKey ||
                !workspaceId
              }
              tone="primary"
            />
            <ToolbarButton
              label="Titles"
              busy={isGeneratingTitles}
              busyLabel="Generating..."
              onClick={triggerGenerateTitles}
              disabled={
                isPending || Boolean(activeAction) || selectedPins.length === 0 || !integrationReady.canUseAiApiKey
              }
            />
            <ToolbarButton
              label="Descriptions"
              busy={isGeneratingDescriptions}
              busyLabel="Generating..."
              onClick={triggerGenerateDescriptions}
              disabled={
                isPending || Boolean(activeAction) || selectedPins.length === 0 || !integrationReady.canUseAiApiKey
              }
            />
            <ToolbarButton
              label="Schedule"
              busy={isSchedulingPins}
              busyLabel="Scheduling..."
              onClick={triggerScheduleSelected}
              disabled={
                isPending ||
                Boolean(activeAction) ||
                !firstPublishAt ||
                !canScheduleSelected ||
                selectedPins.length === 0 ||
                !workspaceId ||
                !accountId ||
                selectedBoardIds.length === 0 ||
                (boardDistributionMode === "primary_weighted" &&
                  (!primaryBoardId || !selectedBoardIds.includes(primaryBoardId)))
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3 shadow-[var(--dashboard-shadow-sm)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Media" value={`${summary.uploaded}/${currentPins.length}`} />
            <SummaryCard label="Descriptions" value={`${summary.descriptionsReady}/${currentPins.length}`} />
            <SummaryCard label="Scheduled" value={`${summary.scheduled}/${currentPins.length}`} />
          </div>
          <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <InlineState label="Publer" value={publerRuntimeState.label} tone={publerRuntimeState.tone} />
              <InlineState label="AI" value={aiRuntimeState.label} tone={aiRuntimeState.tone} />
              {liveLatestScheduleRun ? (
                <InlineState
                  label="Latest run"
                  value={formatLabel(liveLatestScheduleRun.status)}
                  tone={
                    liveLatestScheduleRun.status === "FAILED"
                      ? "danger"
                      : liveLatestScheduleRun.status === "COMPLETED"
                        ? "success"
                        : "neutral"
                  }
                />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <StateDetail label="Publer" value={publerRuntimeState.detail} tone={publerRuntimeState.tone} />
              <StateDetail label="AI" value={aiRuntimeState.detail} tone={aiRuntimeState.tone} />
              {liveLatestScheduleRun?.errorMessage ? (
                <StateDetail label="Run" value={liveLatestScheduleRun.errorMessage} tone="danger" />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {unresolvedArtworkPins.length > 0 ? (
        <section className="rounded-[24px] border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-5 py-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-warning-ink)]">
                Warning only
              </p>
              <p className="mt-2 text-sm text-[var(--dashboard-warning-ink)]">
                {unresolvedArtworkPins.length} pin{unresolvedArtworkPins.length === 1 ? "" : "s"} still have flagged or unfinished artwork review states. {publishReadyArtworkPins.length} usable pin{publishReadyArtworkPins.length === 1 ? "" : "s"} are selected by default so you can keep publishing moving.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SelectionButton
                label={`Select usable ${publishReadyArtworkPins.length}`}
                onClick={() => setSelectedPinIds(publishReadyArtworkPins.map((pin) => pin.id))}
              />
              <SelectionButton
                label={`View unresolved ${unresolvedArtworkPins.length}`}
                onClick={() => setSelectedPinIds(unresolvedArtworkPins.map((pin) => pin.id))}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section id="publish-destination" className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Publishing destination</h2>
            <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
              {workspaceId ? "Workspace ready" : "Choose a workspace"}
              {accountId ? ", account ready" : ", account missing"}
              {selectedBoards.length > 0
                ? `, ${selectedBoards.length} board${selectedBoards.length === 1 ? "" : "s"} selected`
                : ", no boards selected"}.
            </p>
            {(currentWorkspaceProfile || hasUnsavedProfileDefaults) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                {currentWorkspaceName ? (
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-[var(--dashboard-subtle)]">
                    {currentWorkspaceName}
                  </span>
                ) : null}
                {isAccountUsingProfileDefault ? (
                  <span className="rounded-full border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] px-3 py-1 text-[var(--dashboard-success-ink)]">
                    Account default
                  </span>
                ) : null}
                {isBoardUsingProfileDefault ? (
                  <span className="rounded-full border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] px-3 py-1 text-[var(--dashboard-success-ink)]">
                    Board default
                  </span>
                ) : null}
                {currentWorkspaceProfile && hasUnsavedProfileDefaults ? (
                  <span className="rounded-full border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-3 py-1 text-[var(--dashboard-warning-ink)]">
                    Unsaved profile change
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {currentWorkspaceProfile ? (
              <button
                type="button"
                onClick={saveProfileDefaults}
                disabled={!canSaveProfileDefaults || !hasUnsavedProfileDefaults || isSavingProfileDefaults}
                aria-busy={isSavingProfileDefaults}
                className={`rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] ${
                  isSavingProfileDefaults
                    ? "cursor-progress opacity-100"
                    : !canSaveProfileDefaults || !hasUnsavedProfileDefaults
                      ? "cursor-not-allowed opacity-60"
                      : ""
                }`}
              >
                <ActionButtonContent
                  busy={isSavingProfileDefaults}
                  label="Save to profile"
                  busyLabel="Saving..."
                />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                void loadPublerOptions({
                  preserveCurrentSelection: true,
                  nextWorkspaceId: workspaceId,
                  nextAccountId: accountId,
                })
              }
              disabled={isLoadingOptions || !integrationReady.canUsePublerApiKey}
              aria-busy={isLoadingOptions}
              className={`rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] ${
                isLoadingOptions
                  ? "cursor-progress opacity-100"
                  : !integrationReady.canUsePublerApiKey
                    ? "cursor-not-allowed opacity-60"
                    : ""
              }`}
            >
              <ActionButtonContent
                busy={isLoadingOptions}
                label="Refresh destination"
                busyLabel="Refreshing..."
              />
            </button>
          </div>
        </div>
        {profileDefaultsFeedback ? <SectionFeedback feedback={profileDefaultsFeedback} className="mt-4" /> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,0.7fr)]">
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Workspace
            <select
              value={workspaceId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setProfileDefaultsFeedback(null);
                setHasEditedFirstPublishAt(false);
                setFirstPublishAt("");
                setWorkspaceId(nextValue);
                setSelectedBoardIds([]);
                setPrimaryBoardId("");
                setBoardSearchQuery("");
                setAccountId(getWorkspaceProfileDefaults(nextValue).accountId);
                void loadPublerOptions({
                  nextWorkspaceId: nextValue,
                  nextAccountId: getWorkspaceProfileDefaults(nextValue).accountId,
                });
              }}
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
            >
              <option value="">Select workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            <span className="flex items-center justify-between gap-3">
              <span>Pinterest account</span>
              {currentWorkspaceProfile?.defaultAccountId ? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                  {isAccountUsingProfileDefault ? "Default from profile" : "Profile default available"}
                </span>
              ) : null}
            </span>
            <select
              value={accountId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setProfileDefaultsFeedback(null);
                setAccountId(nextValue);
                setSelectedBoardIds([]);
                setPrimaryBoardId("");
                setBoardSearchQuery("");
                void loadPublerOptions({
                  nextWorkspaceId: workspaceId,
                  nextAccountId: nextValue,
                });
              }}
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={String(account.id)} value={String(account.id)}>
                  {account.name || String(account.id)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Distribution
            <select
              value={boardDistributionMode}
              onChange={(event) =>
                setBoardDistributionMode(event.target.value as BoardDistributionMode)
              }
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
            >
              <option value="round_robin">Round robin</option>
              <option value="first_selected">First selected only</option>
              <option value="primary_weighted">Primary weighted</option>
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--dashboard-text)]">Boards</p>
                {activeProfileDefaultBoard ? (
                  <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                    {isBoardUsingProfileDefault ? "Default from profile" : `Profile board: ${activeProfileDefaultBoard.name}`}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--dashboard-muted)]">
                <span>{selectedBoards.length} selected</span>
                {selectedBoards.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDefaultsFeedback(null);
                      setSelectedBoardIds([]);
                      setPrimaryBoardId("");
                    }}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1 font-semibold text-[var(--dashboard-subtle)]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            {selectedBoards.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBoards.map((board, index) => (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => toggleBoard(board.id, false)}
                    className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm text-[var(--dashboard-text)]"
                  >
                    {board.name}
                    {boardDistributionMode === "primary_weighted" && primaryBoardId === board.id
                      ? " • Primary"
                      : ` • ${index + 1}`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">
                Select boards after loading a workspace and Pinterest account.
              </p>
            )}

            {boards.length > 0 ? (
              <details className="mt-4 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--dashboard-text)]">
                  Search and manage boards
                </summary>
                <div className="border-t border-[var(--dashboard-line)] px-4 py-4">
                  <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                    Search
                    <input
                      value={boardSearchQuery}
                      onChange={(event) => setBoardSearchQuery(event.target.value)}
                      placeholder="Board name"
                      className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
                    />
                  </label>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {filteredBoards.length === 0 ? (
                      <p className="text-sm text-[var(--dashboard-subtle)]">No boards match this search.</p>
                    ) : (
                      filteredBoards.map((board) => {
                        const isSelected = selectedBoardIds.includes(board.id);

                        return (
                          <label
                            key={board.id}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                              isSelected
                                ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)]"
                                : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(event) => toggleBoard(board.id, event.target.checked)}
                              />
                              <span className="truncate text-sm font-semibold text-[var(--dashboard-text)]">
                                {board.name}
                              </span>
                            </span>
                            <span className="text-xs uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                              {isSelected ? "Selected" : "Available"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </details>
            ) : null}
            </div>

            <div className="w-full xl:w-[300px] xl:min-w-[300px]">
            {boardDistributionMode === "primary_weighted" ? (
              <div className="grid gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
                <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                  Primary board
                  <select
                    value={primaryBoardId}
                    onChange={(event) => {
                      setProfileDefaultsFeedback(null);
                      setPrimaryBoardId(event.target.value);
                    }}
                    className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
                  >
                    <option value="">Select primary board</option>
                    {selectedBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                  Primary share (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={primaryBoardPercent}
                    onChange={(event) => setPrimaryBoardPercent(Number(event.target.value) || 0)}
                    className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-2"
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-sm text-[var(--dashboard-subtle)]">
              <div className="flex flex-wrap items-center gap-2">
                <InlineState label="Publer" value={publerRuntimeState.label} tone={publerRuntimeState.tone} />
                {isRefreshingStatus ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                    Refreshing
                  </span>
                ) : null}
              </div>
              <p className="mt-2">{publerRuntimeState.detail}</p>
              {optionsError ? (
                <div className="mt-3 rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-3 py-3 text-sm text-[var(--dashboard-danger-ink)]">
                  {optionsError}
                </div>
              ) : null}
            </div>
            </div>
          </div>
        </div>

      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:items-start">
        <div className="space-y-4 xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto xl:pr-2">
          <StepSection
            id="publish-upload"
            title="Step 1 - Upload media"
            collapsed={collapsedSteps.upload}
            onToggle={() => toggleStepCollapsed("upload")}
            summary={
              <>
                {summary.uploaded} uploaded - {summary.mediaFailed} failed
              </>
            }
          >

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={triggerUploadSelected}
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  selectedPins.length === 0 ||
                  !integrationReady.canUsePublerApiKey ||
                  !workspaceId
                }
                aria-busy={isUploadingMedia}
                className={`rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] ${
                  isUploadingMedia
                    ? "cursor-progress opacity-100"
                    : isPending ||
                        Boolean(activeAction) ||
                        selectedPins.length === 0 ||
                        !integrationReady.canUsePublerApiKey ||
                        !workspaceId
                      ? "cursor-not-allowed opacity-60"
                      : ""
                }`}
              >
                <ActionButtonContent
                  busy={isUploadingMedia}
                  label="Upload selected pins"
                  busyLabel="Uploading selected pins..."
                  inverse
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  const failedPinIds = failedUploadPins.map((pin) => pin.id);
                  if (failedPinIds.length === 0) {
                    return;
                  }
                  setSelectedPinIds(failedPinIds);
                  void handlePinBatchAction({
                    action: "upload_media",
                    generatedPinIds: failedPinIds,
                    workspaceId,
                    fallbackMessage: "Unable to retry failed uploads.",
                    section: "upload",
                  });
                }}
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  failedUploadPins.length === 0 ||
                  !integrationReady.canUsePublerApiKey ||
                  !workspaceId
                }
                aria-busy={isUploadingMedia}
                className={`rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] ${
                  isUploadingMedia
                    ? "cursor-progress opacity-100"
                    : isPending ||
                        Boolean(activeAction) ||
                        failedUploadPins.length === 0 ||
                        !integrationReady.canUsePublerApiKey ||
                        !workspaceId
                      ? "cursor-not-allowed opacity-60"
                      : ""
                }`}
              >
                <ActionButtonContent
                  busy={isUploadingMedia}
                  label="Retry failed uploads"
                  busyLabel="Retrying uploads..."
                />
              </button>
            </div>
            {sectionFeedback.upload ? <SectionFeedback feedback={sectionFeedback.upload} className="mt-4" /> : null}

            <div className="mt-4 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--dashboard-subtle)]">
                <p className="font-semibold text-[var(--dashboard-text)]">Upload progress</p>
                <p>
                  {visibleUploadProgress.completed}/{visibleUploadProgress.total} processed
                  {visibleUploadProgress.uploading > 0
                    ? ` - ${visibleUploadProgress.uploading} uploading`
                    : ""}
                </p>
              </div>
              {uploadTracking?.active ? (
                <p className="mt-3 text-sm font-medium text-[var(--dashboard-accent-strong)]">
                  {buildUploadProgressMessage(visibleUploadProgress)}
                </p>
              ) : null}
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--dashboard-panel)]">
                <div
                  className="h-full rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] transition-all"
                  style={{ width: `${visibleUploadProgress.percent}%` }}
                />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[var(--dashboard-subtle)] md:grid-cols-4">
                <p>
                  <strong>{visibleUploadProgress.uploaded}</strong> uploaded
                </p>
                <p>
                  <strong>{visibleUploadProgress.failed}</strong> failed
                </p>
                <p>
                  <strong>{visibleUploadProgress.uploading}</strong> uploading
                </p>
                <p>
                  <strong>{visibleUploadProgress.total - visibleUploadProgress.completed - visibleUploadProgress.uploading}</strong>{" "}
                  pending
                </p>
              </div>
              <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                {visibleUploadPins.length === 0 ? (
                  <p className="text-sm text-[var(--dashboard-subtle)]">
                    Select one or more pins to watch upload progress.
                  </p>
                ) : (
                  visibleUploadPins.map((pin) => (
                    <div
                      key={pin.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--dashboard-text)]">
                          {pin.templateId}
                        </p>
                        <p className="truncate text-xs text-[var(--dashboard-subtle)]">
                          {pin.mediaError || pin.mediaId || "Waiting for upload"}
                        </p>
                      </div>
                      <StatusChip
                        label={formatLabel(pin.mediaStatus)}
                        tone={toneForStatus(pin.mediaStatus)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </StepSection>

          <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">AI credential</h2>
                <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                  Titles and descriptions use the selected saved key.
                </p>
              </div>
              <div className="min-w-[280px]">
                <select
                  value={selectedAiCredentialId}
                  onChange={(event) => setSelectedAiCredentialId(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 outline-none"
                >
                  {aiCredentials.map((credential) => (
                    <option key={credential.id} value={credential.id}>
                      {credential.label}
                      {credential.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
                {selectedAiCredential && !selectedAiCredential.canUseApiKey ? (
                  <p className="mt-2 text-sm text-[var(--dashboard-warning-ink)]">
                    {selectedAiCredential.credentialMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <StepSection
            id="publish-titles"
            title="Step 2 - Titles"
            description="Generate title options in background batches, then choose or override the best one per pin."
            collapsed={collapsedSteps.titles}
            onToggle={() => toggleStepCollapsed("titles")}
            summary={
              <>
                <span>{titleReadyForGenerationPins.length} ready</span>
                <span>{titleReadyForSelectionPins.length} ready to pick</span>
                <span>{titleNotReadyPins.length} not ready</span>
              </>
            }
          >
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={triggerGenerateTitles}
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  selectedTitleReadyPins.length === 0 ||
                  !integrationReady.canUseAiApiKey ||
                  !selectedAiCredentialId ||
                  !canUseSelectedAiCredential
                }
                aria-busy={isGeneratingTitles}
                className={getActionButtonClass({
                  tone: "primary",
                  busy: isGeneratingTitles,
                  disabled:
                    isPending ||
                    Boolean(activeAction) ||
                    selectedTitleReadyPins.length === 0 ||
                    !integrationReady.canUseAiApiKey ||
                    !selectedAiCredentialId ||
                    !canUseSelectedAiCredential,
                })}
              >
                <ActionButtonContent
                  busy={isGeneratingTitles}
                  label="Generate titles for selected eligible pins"
                  busyLabel="Queueing titles..."
                  inverse
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAction(
                    { action: "save_copy", copies: dirtyCopyPayload },
                    "Unable to save copy edits.",
                    "titles",
                  )
                }
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  currentPins.length === 0 ||
                  dirtyCopyPayload.length === 0
                }
                aria-busy={isSavingCopy}
                className={getActionButtonClass({
                  tone: "secondary",
                  busy: isSavingCopy,
                  disabled:
                    isPending ||
                    Boolean(activeAction) ||
                    currentPins.length === 0 ||
                    dirtyCopyPayload.length === 0,
                })}
              >
                <ActionButtonContent
                  busy={isSavingCopy}
                  label="Save title edits"
                  busyLabel="Saving..."
                />
              </button>
            </div>
            {sectionFeedback.titles ? <SectionFeedback feedback={sectionFeedback.titles} className="mt-4" /> : null}

            {activeTitleTasks.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-[var(--dashboard-accent-border)] bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-accent-strong)]">
                      Title generation running
                    </p>
                    <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                      {activeTitleTasks.length} batch{activeTitleTasks.length === 1 ? "" : "es"} queued or running in the worker.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeTitleTasks.map((task) => (
                      <StatusChip
                        key={task.id}
                        label={`${formatLabel(task.status)} ${task.progressJson?.completed ?? 0}/${task.progressJson?.total ?? task.payloadJson?.generatedPinIds?.length ?? 0}`}
                        tone={task.status === "FAILED" ? "bad" : task.status === "SUCCEEDED" ? "good" : "warning"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              <article className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--dashboard-text)]">Ready for title generation</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                      Rendered pins with usable artwork that still need title options.
                    </p>
                  </div>
                  <StatusChip label={`${titleReadyForGenerationPins.length} pins`} tone="neutral" />
                </div>
                {titleReadyForGenerationPins.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--dashboard-subtle)]">No pins are currently waiting for title generation.</p>
                ) : (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {titleReadyForGenerationPins.map((pin) => {
                      const copy = copyByPinId.get(pin.id);
                      const isSelected = selectedPinIds.includes(pin.id);

                      return (
                        <article key={`title-ready-${pin.id}`} className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3">
                          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                            <img
                              src={pin.exportPath}
                              alt={copy?.title || pin.templateId}
                              className="w-full rounded-xl border border-[var(--dashboard-line)]"
                              onError={() => markPinAssetMissing(pin.id)}
                            />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-subtle)]">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(event) => togglePin(pin.id, event.target.checked)}
                                  />
                                  Select
                                </label>
                                <StatusChip label={pin.templateId} tone="neutral" />
                              </div>
                              <p className="text-sm text-[var(--dashboard-subtle)]">
                                No saved title options yet. Queue this pin for background title generation.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => triggerQueueGenerateTitles([pin.id])}
                                  disabled={
                                    isPending ||
                                    Boolean(activeAction) ||
                                    !integrationReady.canUseAiApiKey ||
                                    !selectedAiCredentialId ||
                                    !canUseSelectedAiCredential
                                  }
                                  className={getActionButtonClass({
                                    tone: "secondary",
                                    disabled:
                                      isPending ||
                                      Boolean(activeAction) ||
                                      !integrationReady.canUseAiApiKey ||
                                      !selectedAiCredentialId ||
                                      !canUseSelectedAiCredential,
                                  })}
                                >
                                  Generate this pin
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--dashboard-text)]">Titles ready for selection</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                      Pick the best option, edit it if needed, then save your title choices.
                    </p>
                  </div>
                  <StatusChip label={`${titleReadyForSelectionPins.length} pins`} tone="good" />
                </div>
                {titleReadyForSelectionPins.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--dashboard-subtle)]">No generated title options are ready to review yet.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {titleReadyForSelectionPins.map((pin) => {
                      const copy = copyByPinId.get(pin.id);
                      const candidates = titleCandidatesByPinId[pin.id] ?? [];
                      const isSelected = selectedPinIds.includes(pin.id);

                      return (
                        <article key={`title-select-${pin.id}`} className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
                          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                            <div className="space-y-3">
                              <img
                                src={pin.exportPath}
                                alt={copy?.title || pin.templateId}
                                className="w-full rounded-xl border border-[var(--dashboard-line)]"
                                onError={() => markPinAssetMissing(pin.id)}
                              />
                              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-subtle)]">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(event) => togglePin(pin.id, event.target.checked)}
                                />
                                Select
                              </label>
                            </div>
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                <StatusChip label={pin.templateId} tone="neutral" />
                                <StatusChip label={`Title ${formatLabel(pin.titleStatus)}`} tone={toneForStatus(pin.titleStatus)} />
                              </div>
                              {candidates.length > 0 ? (
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                                    Generated options
                                  </p>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {candidates.map((candidate, candidateIndex) => {
                                      const active = (copy?.title ?? "") === candidate;
                                      return (
                                        <button
                                          key={`${pin.id}-title-option-${candidateIndex}`}
                                          type="button"
                                          onClick={() => updateCopy(pin.id, "title", candidate)}
                                          className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${
                                            active
                                              ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft-strong)] text-[var(--dashboard-accent-strong)]"
                                              : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
                                          }`}
                                        >
                                          {candidate}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                                <span className="flex items-center justify-between gap-3">
                                  <span>Selected / manual title</span>
                                  <span className="text-xs font-medium text-[var(--dashboard-muted)]">
                                    {(copy?.title ?? "").length}/{TITLE_MAX_LENGTH}
                                  </span>
                                </span>
                                <input
                                  value={copy?.title ?? ""}
                                  onChange={(event) => updateCopy(pin.id, "title", event.target.value)}
                                  maxLength={TITLE_MAX_LENGTH}
                                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2"
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => triggerQueueGenerateTitles([pin.id], true)}
                                  disabled={
                                    isPending ||
                                    Boolean(activeAction) ||
                                    !integrationReady.canUseAiApiKey ||
                                    !selectedAiCredentialId ||
                                    !canUseSelectedAiCredential
                                  }
                                  className={getActionButtonClass({
                                    tone: "secondary",
                                    disabled:
                                      isPending ||
                                      Boolean(activeAction) ||
                                      !integrationReady.canUseAiApiKey ||
                                      !selectedAiCredentialId ||
                                      !canUseSelectedAiCredential,
                                  })}
                                >
                                  Regenerate options
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--dashboard-text)]">Not ready</h3>
                    <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                      These pins are separated from title generation because the artwork still needs attention.
                    </p>
                  </div>
                  <StatusChip label={`${titleNotReadyPins.length} pins`} tone="warning" />
                </div>
                {titleNotReadyPins.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--dashboard-subtle)]">All current pins are title-ready.</p>
                ) : (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {titleNotReadyPins.map((pin) => (
                      <article key={`title-not-ready-${pin.id}`} className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3">
                        <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <img
                            src={pin.exportPath}
                            alt={copyByPinId.get(pin.id)?.title || pin.templateId}
                            className="w-full rounded-xl border border-[var(--dashboard-line)]"
                            onError={() => markPinAssetMissing(pin.id)}
                          />
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <StatusChip label={pin.templateId} tone="neutral" />
                              <StatusChip
                                label={`Artwork ${formatLabel(pin.artworkReviewState)}`}
                                tone={toneForArtworkStatus(pin.artworkReviewState)}
                              />
                            </div>
                            <p className="text-sm text-[var(--dashboard-subtle)]">
                              {pin.artworkFlagReason || buildTitleNotReadyReason(pin)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </StepSection>

          <StepSection
            id="publish-descriptions"
            title="Step 3 - Descriptions"
            description="Keep descriptions mostly invisible. Generate them in background for ready pins, then only expand pins that need attention."
            collapsed={collapsedSteps.descriptions}
            onToggle={() => toggleStepCollapsed("descriptions")}
            summary={
              <>
                <span>{descriptionReadyForGenerationPins.length} ready</span>
                <span>{descriptionNeedsAttentionPins.length} need attention</span>
                <span>{summary.descriptionsReady} completed</span>
              </>
            }
          >
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={triggerGenerateDescriptions}
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  selectedDescriptionReadyPins.length === 0 ||
                  !integrationReady.canUseAiApiKey ||
                  !selectedAiCredentialId ||
                  !canUseSelectedAiCredential
                }
                aria-busy={isGeneratingDescriptions}
                className={getActionButtonClass({
                  tone: "primary",
                  busy: isGeneratingDescriptions,
                  disabled:
                    isPending ||
                    Boolean(activeAction) ||
                    selectedDescriptionReadyPins.length === 0 ||
                    !integrationReady.canUseAiApiKey ||
                    !selectedAiCredentialId ||
                    !canUseSelectedAiCredential,
                })}
              >
                <ActionButtonContent
                  busy={isGeneratingDescriptions}
                  label="Generate remaining descriptions now"
                  busyLabel="Queueing descriptions..."
                  inverse
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAction(
                    { action: "save_copy", copies: dirtyCopyPayload },
                    "Unable to save copy edits.",
                    "descriptions",
                  )
                }
                disabled={
                  isPending ||
                  Boolean(activeAction) ||
                  dirtyCopyPayload.length === 0
                }
                aria-busy={isSavingCopy}
                className={getActionButtonClass({
                  tone: "secondary",
                  busy: isSavingCopy,
                  disabled:
                    isPending ||
                    Boolean(activeAction) ||
                    dirtyCopyPayload.length === 0,
                })}
              >
                <ActionButtonContent
                  busy={isSavingCopy}
                  label="Save description edits"
                  busyLabel="Saving..."
                />
              </button>
            </div>
            {sectionFeedback.descriptions ? <SectionFeedback feedback={sectionFeedback.descriptions} className="mt-4" /> : null}

            {activeDescriptionTasks.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-[var(--dashboard-accent-border)] bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-accent-strong)]">
                      Description generation running
                    </p>
                    <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                      {activeDescriptionTasks.length} batch{activeDescriptionTasks.length === 1 ? "" : "es"} queued or running in the worker.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeDescriptionTasks.map((task) => (
                      <StatusChip
                        key={task.id}
                        label={`${formatLabel(task.status)} ${task.progressJson?.completed ?? 0}/${task.progressJson?.total ?? task.payloadJson?.generatedPinIds?.length ?? 0}`}
                        tone={task.status === "FAILED" ? "bad" : task.status === "SUCCEEDED" ? "good" : "warning"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--dashboard-text)]">Needs attention</h3>
                  <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                    Only pins with missing or failed descriptions show up here by default.
                  </p>
                </div>
                <StatusChip label={`${descriptionNeedsAttentionPins.length} pins`} tone={descriptionNeedsAttentionPins.length > 0 ? "warning" : "good"} />
              </div>
              {descriptionNeedsAttentionPins.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--dashboard-subtle)]">
                  No description issues right now. Most description work can stay collapsed below.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {descriptionNeedsAttentionPins.map((pin) => {
                    const copy = copyByPinId.get(pin.id);
                    const isExpanded = expandedDescriptionPinIds.includes(pin.id);
                    return (
                      <article key={`description-attention-${pin.id}`} className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3">
                        <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <img
                            src={pin.exportPath}
                            alt={copy?.title || pin.templateId}
                            className="w-full rounded-xl border border-[var(--dashboard-line)]"
                            onError={() => markPinAssetMissing(pin.id)}
                          />
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <StatusChip label={pin.templateId} tone="neutral" />
                              <StatusChip
                                label={`Description ${formatLabel(pin.descriptionStatus)}`}
                                tone={toneForStatus(pin.descriptionStatus)}
                              />
                            </div>
                            <p className="text-sm text-[var(--dashboard-subtle)]">
                              {buildDescriptionAttentionReason(pin, copy?.description ?? "")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => triggerQueueGenerateDescriptions([pin.id], true)}
                                disabled={
                                  isPending ||
                                  Boolean(activeAction) ||
                                  !integrationReady.canUseAiApiKey ||
                                  !selectedAiCredentialId ||
                                  !canUseSelectedAiCredential
                                }
                                className={getActionButtonClass({
                                  tone: "secondary",
                                  disabled:
                                    isPending ||
                                    Boolean(activeAction) ||
                                    !integrationReady.canUseAiApiKey ||
                                    !selectedAiCredentialId ||
                                    !canUseSelectedAiCredential,
                                })}
                              >
                                Regenerate description
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDescriptionPinIds((current) =>
                                    current.includes(pin.id)
                                      ? current.filter((value) => value !== pin.id)
                                      : [...current, pin.id],
                                  )
                                }
                                className={getActionButtonClass({
                                  tone: "secondary",
                                  disabled: false,
                                })}
                              >
                                {isExpanded ? "Collapse editor" : "Edit manually"}
                              </button>
                            </div>
                            {isExpanded ? (
                              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                                <span className="flex items-center justify-between gap-3">
                                  <span>Manual description</span>
                                  <span className="text-xs font-medium text-[var(--dashboard-muted)]">
                                    {(copy?.description ?? "").length}/{DESCRIPTION_MAX_LENGTH}
                                  </span>
                                </span>
                                <textarea
                                  value={copy?.description ?? ""}
                                  onChange={(event) => updateCopy(pin.id, "description", event.target.value)}
                                  maxLength={DESCRIPTION_MAX_LENGTH}
                                  rows={5}
                                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2"
                                />
                              </label>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </StepSection>

          <StepSection
            id="publish-schedule"
            title="Step 4 - Scheduling"
            collapsed={collapsedSteps.schedule}
            onToggle={() => toggleStepCollapsed("schedule")}
            summary={
              <>
                <p>
                  <strong>{summary.scheduled}</strong> scheduled
                </p>
                <p>
                  <strong>{summary.scheduleFailed}</strong> failed
                </p>
              </>
            }
          >

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                <span className="flex items-center justify-between gap-3">
                  <span>First publish datetime</span>
                  {scheduleContext.recommendedFirstPublishAt ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                      Recommended
                    </span>
                  ) : null}
                </span>
                <input
                  type="datetime-local"
                  value={firstPublishAt}
                  onChange={(event) => {
                    setHasEditedFirstPublishAt(true);
                    setFirstPublishAt(event.target.value);
                  }}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Interval days
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={intervalDays}
                  onChange={(event) => setIntervalDays(Number(event.target.value) || 1)}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
                Jitter days
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={jitterDays}
                  onChange={(event) => setJitterDays(Number(event.target.value) || 0)}
                  className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2"
                />
              </label>
              <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] p-4 text-sm text-[var(--dashboard-subtle)]">
                <p className="font-semibold text-[var(--dashboard-text)]">Selection summary</p>
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
                <div className="mt-3 space-y-1 border-t border-[var(--dashboard-line)] pt-3">
                  <p>
                    <strong>Daily target:</strong> {scheduleContext.dailyPublishTarget} pins
                  </p>
                  <p>
                    <strong>Today&apos;s queue:</strong> {scheduleContext.todayScheduledCount} / {scheduleContext.dailyPublishTarget}
                  </p>
                  <p>
                    <strong>Latest scheduled:</strong>{" "}
                    {isLoadingScheduleContext
                      ? "Loading..."
                      : scheduleContext.latestScheduledAt
                        ? formatDateLabel(scheduleContext.latestScheduledAt)
                        : "No pending schedule"}
                  </p>
                  <p>
                    <strong>Latest published:</strong>{" "}
                    {scheduleContext.latestPublishedAt
                      ? formatDateLabel(scheduleContext.latestPublishedAt)
                      : "No published pin yet"}
                  </p>
                  <p>
                    <strong>Suggested next slot:</strong>{" "}
                    {scheduleContext.recommendedFirstPublishAt
                      ? formatDateLabel(scheduleContext.recommendedFirstPublishAt)
                      : "Ready for a first schedule"}
                  </p>
                  {scheduleContext.queueSuggestionReason ? (
                    <p className="text-[var(--dashboard-warning-ink)]">
                      {scheduleContext.queueSuggestionReason}
                    </p>
                  ) : null}
                  <p>
                    <strong>Spacing-only earliest:</strong>{" "}
                    {scheduleContext.spacingRecommendedFirstPublishAt
                      ? formatDateLabel(scheduleContext.spacingRecommendedFirstPublishAt)
                      : "Ready for a first schedule"}
                  </p>
                </div>
                {isScheduleInsideSpacingGap ? (
                  <p className="mt-3 text-[var(--dashboard-warning-ink)]">
                    Selected time is inside the recommended spacing gap.
                  </p>
                ) : null}
                {selectedScheduleDay ? (
                  <p className={`mt-3 ${selectedScheduleDay.isFull ? "text-[var(--dashboard-warning-ink)]" : "text-[var(--dashboard-subtle)]"}`}>
                    Selected day load: {selectedScheduleDay.scheduledCount} / {scheduleContext.dailyPublishTarget}
                    {selectedScheduleDay.isFull ? " scheduled. This day is already at capacity." : " scheduled."}
                  </p>
                ) : null}
                {isSelectedScheduleDayFull && scheduleContext.queueAwareSuggestedFirstPublishAt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHasEditedFirstPublishAt(true);
                      setFirstPublishAt(formatDateTimeLocalValue(scheduleContext.queueAwareSuggestedFirstPublishAt as string));
                    }}
                    className="mt-3 rounded-full border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-warning-ink)]"
                  >
                    Use next day with room
                  </button>
                ) : null}
              </div>
            </div>
            {sectionFeedback.schedule ? <SectionFeedback feedback={sectionFeedback.schedule} className="mt-4" /> : null}

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
                      schedulePlan: schedulePreview.map((item) => ({
                        pinId: item.pinId,
                        scheduledFor: item.scheduledFor.toISOString(),
                        boardId:
                          schedulePreviewRows.find((row) => row.pinId === item.pinId)?.assignedBoardId,
                      })),
                      workspaceId,
                      accountId,
                      boardIds: selectedBoardIds,
                      boardDistributionMode,
                      primaryBoardId,
                      primaryBoardPercent,
                    },
                    "Unable to schedule pins.",
                    "schedule",
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
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)] disabled:opacity-60"
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
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
              >
                Target unscheduled pins
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--dashboard-line)]">
              <div className="flex flex-wrap gap-2 border-b border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
                {scheduleContext.upcomingQueueDays.map((day) => (
                  <span
                    key={day.date}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                      day.isFull
                        ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
                        : day.remainingCapacity <= 3
                          ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
                          : "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
                    }`}
                  >
                    {formatQueueDayLabel(day.date)} {day.scheduledCount}/{scheduleContext.dailyPublishTarget}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_240px_180px_120px] bg-[var(--dashboard-panel-alt)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                <span>Pin</span>
                <span>Board</span>
                <span>Planned time</span>
                <span>Jitter</span>
              </div>
              {schedulePreviewRows.length === 0 ? (
                <p className="px-4 py-4 text-sm text-[var(--dashboard-subtle)]">
                  Select pins, boards, and a first publish time to preview the schedule.
                </p>
              ) : (
                schedulePreviewRows.map((item) => {
                  const pin = currentPins.find((candidate) => candidate.id === item.pinId);
                  return (
                    <div
                      key={item.pinId}
                      className="grid grid-cols-[minmax(0,1fr)_240px_180px_120px] items-center gap-4 border-t border-[var(--dashboard-line)] px-4 py-3 text-sm text-[var(--dashboard-subtle)]"
                    >
                      <span className="truncate">{pin?.templateId ?? item.pinId}</span>
                      {selectedBoards.length > 0 ? (
                        <select
                          value={item.assignedBoardId}
                          onChange={(event) =>
                            setBoardOverrideByPinId((current) => ({
                              ...current,
                              [item.pinId]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm text-[var(--dashboard-text)] outline-none"
                        >
                          {selectedBoards.map((board) => (
                            <option key={board.id} value={board.id}>
                              {board.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="truncate">{item.board?.name ?? "No board selected"}</span>
                      )}
                      <span>{formatPreviewDate(item.scheduledFor)}</span>
                      <span>{item.jitterOffsetMinutes / (24 * 60)} day(s)</span>
                    </div>
                  );
                })
              )}
            </div>
          </StepSection>
        </div>

        <section id="publish-pins" className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)] xl:max-h-[calc(100vh-7.5rem)] xl:overflow-y-auto xl:pr-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Pins</h2>
              <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
                {selectedPinIds.length} of {currentPins.length} selected for the next action.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SelectionButton
                label="Usable"
                onClick={() => setSelectedPinIds(publishReadyArtworkPins.map((pin) => pin.id))}
              />
              <SelectionButton label="All" onClick={() => setSelectedPinIds(currentPins.map((pin) => pin.id))} />
              <SelectionButton
                label="Artwork unresolved"
                onClick={() => setSelectedPinIds(unresolvedArtworkPins.map((pin) => pin.id))}
              />
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
          <div className="mt-4 space-y-4">
            {orderedPins.map((pin) => {
              const copy = copyByPinId.get(pin.id);
              const isSelected = selectedPinIds.includes(pin.id);
              const currentTitle = copy?.title?.trim() ?? "";
              const currentDescription = copy?.description?.trim() ?? "";

              return (
                <article
                  key={pin.id}
                  className={`rounded-2xl border p-4 ${
                    isSelected
                      ? "border-[var(--dashboard-accent)] bg-white shadow-[var(--dashboard-shadow-sm)]"
                      : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-subtle)]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => togglePin(pin.id, event.target.checked)}
                      />
                      Include in next action
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                      <StatusChip
                        label={`Artwork ${formatLabel(pin.artworkReviewState)}`}
                        tone={toneForArtworkStatus(pin.artworkReviewState)}
                      />
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
                      {missingAssetPinIds.includes(pin.id) ? (
                        <StatusChip label="Asset missing" tone="warning" />
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)]">
                    {missingAssetPinIds.includes(pin.id) ? (
                      <div className="min-h-[112px]">
                        <MissingAssetCard />
                      </div>
                    ) : (
                      <img
                        src={pin.exportPath}
                        alt={currentTitle || "Generated pin"}
                        className="w-full rounded-xl border border-[var(--dashboard-line)]"
                        onError={() => markPinAssetMissing(pin.id)}
                      />
                    )}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--dashboard-text)]">{pin.templateId}</p>
                          <p className="mt-1 text-sm text-[var(--dashboard-subtle)] line-clamp-2">
                            {currentTitle || "No publishing title selected yet."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href="#publish-titles"
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
                          >
                            Titles
                          </Link>
                          <Link
                            href="#publish-descriptions"
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
                          >
                            Descriptions
                          </Link>
                        </div>
                      </div>
                      {pin.artworkFlagReason ? (
                        <p className="text-sm text-[var(--dashboard-subtle)]">{pin.artworkFlagReason}</p>
                      ) : null}
                      {missingAssetPinIds.includes(pin.id) ? (
                        <div className="rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-3 py-3 text-sm text-[var(--dashboard-danger-ink)]">
                          This pin asset is missing from storage. Discard and rerender it before upload or scheduling.
                        </div>
                      ) : null}
                      <div className="grid gap-3 text-sm text-[var(--dashboard-subtle)] md:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                            Publishing title
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--dashboard-text)]">
                            {currentTitle || "Missing"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                            Description
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--dashboard-text)]">
                            {currentDescription || "Missing"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-[var(--dashboard-subtle)]">
                        <p>
                          <strong>Media:</strong> {pin.mediaId || pin.mediaError || "No Publer media saved yet"}
                        </p>
                        <p>
                          <strong>Schedule:</strong>{" "}
                          {pin.scheduledFor ? new Date(pin.scheduledFor).toLocaleString() : "No schedule submitted"}
                        </p>
                        {pin.scheduleError ? (
                          <p className="text-[var(--dashboard-danger)]">
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
    <div className="rounded-3xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

function StepSection({
  id,
  title,
  summary,
  description,
  collapsed,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  summary?: import("react").ReactNode;
  description?: import("react").ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  children: import("react").ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description ? (
            <div className="mt-1 text-sm text-[var(--dashboard-subtle)]">{description}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summary ? <div className="text-sm font-semibold text-[var(--dashboard-muted)]">{summary}</div> : null}
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
      {!collapsed ? children : null}
    </section>
  );
}

function InlineState({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "danger"
        ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return (
    <div className={`rounded-full border px-3 py-2 text-sm ${className}`}>
      <span className="font-semibold">{label}:</span> {value}
    </div>
  );
}

function StateDetail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "danger";
}) {
  const className =
    tone === "success"
      ? "text-[var(--dashboard-success-ink)]"
      : tone === "danger"
        ? "text-[var(--dashboard-danger-ink)]"
        : "text-[var(--dashboard-subtle)]";

  return (
    <p className={`text-sm ${className}`}>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

function SectionFeedback({
  feedback,
  className = "",
}: {
  feedback: BannerState;
  className?: string;
}) {
  if (!feedback) {
    return null;
  }

  const toneClass =
    feedback.tone === "error"
      ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
      : feedback.tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass} ${className}`.trim()}>
      {feedback.message}
    </div>
  );
}

function ToolbarButton({
  label,
  busy,
  busyLabel,
  onClick,
  disabled,
  tone = "secondary",
}: {
  label: string;
  busy?: boolean;
  busyLabel?: string;
  onClick: () => void;
  disabled: boolean;
  tone?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={getActionButtonClass({
        tone,
        busy,
        disabled,
      })}
    >
      <ActionButtonContent
        busy={busy}
        label={label}
        busyLabel={busyLabel}
        inverse={tone === "primary"}
      />
    </button>
  );
}

function StepJump({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] transition hover:border-[var(--dashboard-accent)] hover:text-[var(--dashboard-accent-strong)]"
    >
      {label}
    </Link>
  );
}

function SelectionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
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
      ? "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success-ink)]"
      : tone === "warning"
        ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
        : tone === "bad"
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]";

  return <span className={`rounded-full border px-2 py-1 ${className}`}>{label}</span>;
}

function ActionButtonContent({
  busy,
  label,
  busyLabel,
  inverse = false,
}: {
  busy?: boolean;
  label: string;
  busyLabel?: string;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {busy ? (
        <span
          className={`h-4 w-4 animate-spin rounded-full border-2 ${
            inverse ? "border-white/30 border-t-white" : "border-current/25 border-t-current"
          }`}
          aria-hidden="true"
        />
      ) : null}
      <span>{busy ? busyLabel ?? label : label}</span>
    </span>
  );
}

function getActionButtonClass(input: {
  tone: "primary" | "secondary";
  busy?: boolean;
  disabled?: boolean;
}) {
  const baseClass =
    input.tone === "primary"
      ? "rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
      : "rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]";

  if (input.busy) {
    return `${baseClass} cursor-progress opacity-100`;
  }

  if (input.disabled) {
    return `${baseClass} cursor-not-allowed opacity-60`;
  }

  return baseClass;
}

function buildUploadRecoveryMessage(input: {
  uploadedCount: number;
  remainingCount: number;
  failedCount: number;
  pendingCount: number;
}) {
  const detailParts: string[] = [];

  if (input.failedCount > 0) {
    detailParts.push(`${input.failedCount} failed`);
  }
  if (input.pendingCount > 0) {
    detailParts.push(`${input.pendingCount} still processing`);
  }

  const detail =
    detailParts.length > 0 ? ` (${detailParts.join(", ")})` : "";

  return `${input.uploadedCount} uploaded. ${input.remainingCount} pin${
    input.remainingCount === 1 ? "" : "s"
  } still need attention and are selected${detail}.`;
}

function buildChunkProgressMessage(input: {
  action: "generate_titles" | "generate_descriptions";
  completed: number;
  total: number;
  currentChunk: number;
  chunkCount: number;
  chunkPinIds: string[];
  pins: PinItem[];
}) {
  const labels = input.chunkPinIds
    .map((pinId) => input.pins.find((candidate) => candidate.id === pinId)?.templateId)
    .filter((value): value is string => Boolean(value));
  const labelPreview =
    labels.length === 0
      ? "selected pins"
      : labels.length === 1
        ? labels[0]
        : `${labels[0]} and ${labels.length - 1} more`;

  if (input.action === "generate_titles") {
    return input.completed === 0
      ? `Starting title generation for chunk ${input.currentChunk} of ${input.chunkCount}: ${labelPreview}.`
      : `Working on chunk ${input.currentChunk} of ${input.chunkCount}: ${labelPreview}.`;
  }

  return input.completed === 0
    ? `Starting description generation for chunk ${input.currentChunk} of ${input.chunkCount}: ${labelPreview}.`
    : `Working on chunk ${input.currentChunk} of ${input.chunkCount}: ${labelPreview}.`;
}

function chunkPinIds(pinIds: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < pinIds.length; index += size) {
    chunks.push(pinIds.slice(index, index + size));
  }

  return chunks;
}

function buildTitleCandidatesByPinId(pins: PinItem[]) {
  return Object.fromEntries(
    pins
      .filter((pin) => pin.titleOptions.length > 0)
      .map((pin) => [pin.id, pin.titleOptions]),
  );
}

function getPublishSelectionStorageKey(jobId: string) {
  return `pinforge:publish-selection:${jobId}`;
}

function readPersistedPublishSelection(jobId: string): PersistedPublishSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getPublishSelectionStorageKey(jobId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedPublishSelection>;
    return {
      workspaceId: typeof parsed.workspaceId === "string" ? parsed.workspaceId : "",
      accountId: typeof parsed.accountId === "string" ? parsed.accountId : "",
      selectedBoardIds: Array.isArray(parsed.selectedBoardIds)
        ? parsed.selectedBoardIds.filter((value): value is string => typeof value === "string")
        : [],
      boardDistributionMode:
        parsed.boardDistributionMode === "first_selected" ||
        parsed.boardDistributionMode === "primary_weighted"
          ? parsed.boardDistributionMode
          : "round_robin",
      primaryBoardId: typeof parsed.primaryBoardId === "string" ? parsed.primaryBoardId : "",
      primaryBoardPercent:
        typeof parsed.primaryBoardPercent === "number" ? parsed.primaryBoardPercent : 60,
    };
  } catch {
    return null;
  }
}

function persistPublishSelection(jobId: string, selection: PersistedPublishSelection) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getPublishSelectionStorageKey(jobId),
      JSON.stringify(selection),
    );
  } catch {
    // Ignore storage failures and keep the current in-memory state.
  }
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

function toneForArtworkStatus(status: string) {
  if (status === "NORMAL") {
    return "good" as const;
  }
  if (status === "FLAGGED" || status === "RERENDER_QUEUED" || status === "RERENDERING") {
    return "warning" as const;
  }
  if (status === "RERENDER_FAILED") {
    return "bad" as const;
  }
  return "neutral" as const;
}

function isPinArtworkUnresolved(pin: PinItem) {
  return ["FLAGGED", "RERENDER_QUEUED", "RERENDERING", "RERENDER_FAILED"].includes(
    pin.artworkReviewState,
  );
}

function isPinReadyForTitleWork(pin: PinItem) {
  return !isPinArtworkUnresolved(pin);
}

function isPinReadyForTitleGeneration(pin: PinItem) {
  if (!isPinReadyForTitleWork(pin)) {
    return false;
  }

  if (pin.titleStatus === "FINALIZED") {
    return false;
  }

  return pin.titleOptions.length === 0;
}

function isPinReadyForTitleSelection(pin: PinItem, currentTitle: string) {
  if (!isPinReadyForTitleWork(pin)) {
    return false;
  }

  if (pin.titleOptions.length > 0) {
    return true;
  }

  return pin.titleStatus === "FINALIZED" && currentTitle.trim().length > 0;
}

function buildTitleNotReadyReason(pin: PinItem) {
  if (pin.artworkReviewState === "FLAGGED") {
    return "Artwork is flagged for fixes before title selection.";
  }
  if (pin.artworkReviewState === "RERENDER_QUEUED") {
    return "Artwork rerender is queued.";
  }
  if (pin.artworkReviewState === "RERENDERING") {
    return "Artwork rerender is currently running.";
  }
  if (pin.artworkReviewState === "RERENDER_FAILED") {
    return "Artwork rerender failed and needs attention.";
  }

  return "This pin is not ready for title generation yet.";
}

function isPinReadyForDescriptionGeneration(pin: PinItem) {
  if (!isPinReadyForTitleWork(pin)) {
    return false;
  }

  if (!pin.title.trim()) {
    return false;
  }

  if (pin.descriptionStatus === "FINALIZED" && pin.description.trim()) {
    return false;
  }

  return !pin.description.trim();
}

function isPinDescriptionNeedsAttention(pin: PinItem) {
  if (!isPinReadyForTitleWork(pin)) {
    return false;
  }

  if (!pin.title.trim()) {
    return true;
  }

  return !pin.description.trim() || pin.descriptionStatus === "FAILED";
}

function buildDescriptionAttentionReason(pin: PinItem, currentDescription: string) {
  if (!pin.title.trim()) {
    return "Finalize a title before generating a description.";
  }

  if (pin.descriptionStatus === "FAILED") {
    return "Description generation failed. Retry or edit manually.";
  }

  if (!currentDescription.trim()) {
    return "Description is missing for this pin.";
  }

  return "Description needs attention.";
}

function getDefaultSelectedPinIds(pins: PinItem[]) {
  const usablePins = pins.filter((pin) => !isPinArtworkUnresolved(pin));
  return (usablePins.length > 0 ? usablePins : pins).map((pin) => pin.id);
}

function mergeCopyStateWithPins(
  current: Array<{ generatedPinId: string; title: string; description: string }>,
  pins: PinItem[],
) {
  const currentByPinId = new Map(current.map((item) => [item.generatedPinId, item]));

  return pins.map((pin) => {
    const existing = currentByPinId.get(pin.id);

    return {
      generatedPinId: pin.id,
      title:
        existing && existing.title.trim() !== ""
          ? existing.title
          : pin.title,
      description:
        existing && existing.description.trim() !== ""
          ? existing.description
          : pin.description,
    };
  });
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

function parsePublishActionResponse(rawBody: string) {
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      error: extractResponseErrorMessage(rawBody) ?? "Unexpected server response.",
    };
  }
}

function extractResponseErrorMessage(rawBody: string) {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("<")) {
    const titleMatch = trimmed.match(/<title>(.*?)<\/title>/i);
    return titleMatch?.[1]?.trim() || "The server returned an unexpected error page.";
  }

  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed;
}

function buildUploadProgress(uploadPins: PinItem[]) {
  const total = uploadPins.length;
  const uploaded = uploadPins.filter((pin) => pin.mediaStatus === "UPLOADED").length;
  const failed = uploadPins.filter((pin) => pin.mediaStatus === "FAILED").length;
  const uploading = uploadPins.filter((pin) => pin.mediaStatus === "UPLOADING").length;
  const completed = uploaded + failed;

  return {
    total,
    uploaded,
    failed,
    uploading,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function buildUploadProgressMessage(input: ReturnType<typeof buildUploadProgress>) {
  if (input.total === 0) {
    return "Preparing the selected pins for upload.";
  }

  if (input.uploading > 0) {
    return `${input.uploading} pin${input.uploading === 1 ? "" : "s"} uploading now.`;
  }

  if (input.completed >= input.total) {
    return input.failed > 0
      ? `${input.uploaded} uploaded, ${input.failed} failed.`
      : "All selected pins finished uploading.";
  }

  const remaining = input.total - input.completed;
  return `${remaining} pin${remaining === 1 ? "" : "s"} waiting to upload.`;
}

function formatDateTimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatQueueDayLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function buildEmptyScheduleContext(workspaceId: string): PublishScheduleContext {
  return {
    workspaceId,
    latestScheduledAt: null,
    latestPublishedAt: null,
    anchorAt: null,
    anchorSource: "none",
    recommendedFirstPublishAt: null,
    spacingRecommendedFirstPublishAt: null,
    recommendedWindowEndAt: null,
    dailyPublishTarget: 20,
    todayScheduledCount: 0,
    upcomingQueueDays: [],
    scheduledCountsByDate: {},
    occupiedMinutesByDate: {},
    queueAwareSuggestedFirstPublishAt: null,
    queueSuggestionReason: null,
    hasPendingSchedule: false,
  };
}

function resolvePublerRuntimeState(input: {
  integrationReady: JobPublishManagerProps["integrationReady"];
  isLoadingOptions: boolean;
  optionsError: string | null;
  workspacesCount: number;
  accountId: string;
  selectedBoardCount: number;
}) {
  if (input.integrationReady.publerCredentialState === "missing") {
    return {
      label: "Missing",
      tone: "danger" as const,
      detail: "Save a Publer API key in Integrations before uploading media or scheduling.",
    };
  }

  if (input.integrationReady.publerCredentialState === "unavailable") {
    return {
      label: "Unavailable",
      tone: "danger" as const,
      detail:
        input.integrationReady.publerCredentialMessage ||
        "The saved Publer key is not usable in the current environment.",
    };
  }

  if (input.optionsError) {
    return {
      label: "Action needed",
      tone: "danger" as const,
      detail: input.optionsError,
    };
  }

  if (input.isLoadingOptions) {
    return {
      label: "Loading",
      tone: "neutral" as const,
      detail: "Loading Publer workspaces, accounts, and boards.",
    };
  }

  if (input.workspacesCount === 0) {
    return {
      label: "No workspace",
      tone: "danger" as const,
      detail: "The saved Publer key did not return any accessible workspaces.",
    };
  }

  return {
    label: "Verified",
    tone: "success" as const,
    detail:
      input.accountId && input.selectedBoardCount > 0
        ? `${input.selectedBoardCount} board${input.selectedBoardCount === 1 ? "" : "s"} ready for distribution.`
        : "Publer access is working. Pick an account and boards to continue.",
  };
}

function resolveAiRuntimeState(integrationReady: JobPublishManagerProps["integrationReady"]) {
  if (integrationReady.aiCredentialState === "missing") {
    return {
      label: "Missing",
      tone: "danger" as const,
      detail: "Save an AI provider key in Integrations before generating titles or descriptions.",
    };
  }

  if (integrationReady.aiCredentialState === "unavailable") {
    return {
      label: "Unavailable",
      tone: "danger" as const,
      detail:
        integrationReady.aiCredentialMessage ||
        "The saved AI key is not usable in the current environment.",
    };
  }

  return {
    label: "Ready",
    tone: "success" as const,
    detail: "AI copy generation is available for title and description actions.",
  };
}

function resolveSectionForAction(action: string): PublishSectionKey | undefined {
  switch (action) {
    case "upload_media":
      return "upload";
    case "generate_titles":
    case "save_copy":
      return "titles";
    case "generate_descriptions":
      return "descriptions";
    case "schedule":
      return "schedule";
    default:
      return undefined;
  }
}

function MissingAssetCard() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] p-6 text-center text-sm font-semibold text-[var(--dashboard-danger-ink)]">
      Asset missing.
      <br />
      Discard and rerender required.
    </div>
  );
}
