"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CanvasEditor } from "@/components/template-builder/CanvasEditor";
import { ElementCatalog } from "@/components/template-builder/ElementCatalog";
import {
  InspectorPanel,
  ValidationSidebar,
} from "@/components/template-builder/InspectorPanel";
import { LayerPanel } from "@/components/template-builder/LayerPanel";
import { getRuntimeTemplateGridSlotCount } from "@/lib/runtime-templates/imageGridPresets";
import { autoFixRuntimeTemplatePresetStyles } from "@/lib/runtime-templates/presetFixer";
import type {
  RuntimeTemplateDocument,
  RuntimeTemplateEditorState,
  RuntimeTemplateElement,
} from "@/lib/runtime-templates/schema";
import { getSampleRuntimeTemplateRenderProps } from "@/lib/runtime-templates/sampleData";
import { validateRuntimeTemplateDocument } from "@/lib/runtime-templates/validate";
import {
  runtimeTemplateBorderTokenValues,
  runtimeTemplateFillTokenValues,
  runtimeTemplateFontTokenValues,
  runtimeTemplateTextTokenValues,
} from "@/lib/runtime-templates/types";
import type {
  RuntimeTemplateBorderToken,
  RuntimeTemplateElementType,
  RuntimeTemplateFillToken,
  RuntimeTemplateFontToken,
  RuntimeTemplateTextSemanticRole,
  RuntimeTemplateTextToken,
  RuntimeTemplateValidationResult,
} from "@/lib/runtime-templates/types";
import type { TemplateVisualPresetId } from "@/lib/templates/types";

type TemplateDraftEditorProps = {
  templateId: string;
  versionId: string;
  versionNumber: number;
  versionLifecycleStatus: "DRAFT" | "FINALIZED" | "ARCHIVED";
  versionLocked: boolean;
  initialName: string;
  initialDescription: string;
  initialDocument: RuntimeTemplateDocument;
  initialEditorState: RuntimeTemplateEditorState;
  initialPreset: TemplateVisualPresetId;
  initialValidationResult: RuntimeTemplateValidationResult<RuntimeTemplateDocument> | null;
};

type SaveStatus =
  | { state: "saved"; message: string }
  | { state: "dirty"; message: string }
  | { state: "saving"; message: string }
  | { state: "error"; message: string };

type DraftHistorySnapshot = {
  templateName: string;
  templateDescription: string;
  document: RuntimeTemplateDocument;
  editorState: RuntimeTemplateEditorState;
  visualPreset: TemplateVisualPresetId;
};

type DraftUpdateOptions = {
  recordHistory?: boolean;
};

export function TemplateDraftEditor(props: TemplateDraftEditorProps) {
  const {
    templateId,
    versionId,
    versionNumber,
    versionLifecycleStatus,
    versionLocked,
    initialName,
    initialDescription,
    initialDocument,
    initialEditorState,
    initialPreset,
    initialValidationResult,
  } = props;
  const router = useRouter();
  const [templateName, setTemplateName] = useState(initialName);
  const [templateDescription, setTemplateDescription] = useState(initialDescription);
  const [document, setDocument] = useState<RuntimeTemplateDocument>(initialDocument);
  const [editorState, setEditorState] = useState<RuntimeTemplateEditorState>(initialEditorState);
  const [visualPreset, setVisualPreset] = useState<TemplateVisualPresetId>(initialPreset);
  const [leftPanel, setLeftPanel] = useState<"elements" | "layers" | "template">("elements");
  const [isRenamingTemplate, setIsRenamingTemplate] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    state: "saved",
    message: "All changes saved.",
  });
  const [savedValidationResult, setSavedValidationResult] = useState<
    RuntimeTemplateValidationResult<RuntimeTemplateDocument> | null
  >(initialValidationResult);
  const [actionState, setActionState] = useState<"idle" | "validating" | "finalizing">("idle");
  const [historyState, setHistoryState] = useState({
    past: [] as DraftHistorySnapshot[],
    future: [] as DraftHistorySnapshot[],
  });

  const selectedElement = useMemo(
    () => document.elements.find((element) => element.id === editorState.selectedElementId) ?? null,
    [document.elements, editorState.selectedElementId],
  );
  const validationResult = useMemo(
    () =>
      validateRuntimeTemplateDocument(document, {
        mode: "full",
        presetIds: [visualPreset],
      }),
    [document, visualPreset],
  );
  const previewPayload = useMemo(
    () =>
      getSampleRuntimeTemplateRenderProps({
        visualPreset,
        title: editorState.previewContent.title,
        subtitle: editorState.previewContent.subtitle || undefined,
        itemNumber: editorState.previewContent.itemNumber,
        domain: editorState.previewContent.domain,
        ctaText: editorState.previewContent.ctaText || undefined,
      }),
    [editorState.previewContent, visualPreset],
  );

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        templateName,
        templateDescription,
        document,
        editorState,
        visualPreset,
      }),
    [document, editorState, templateDescription, templateName, visualPreset],
  );
  const lastSavedSnapshotRef = useRef(snapshot);
  const currentSnapshot = useCallback(
    (): DraftHistorySnapshot => ({
      templateName,
      templateDescription,
      document,
      editorState,
      visualPreset,
    }),
    [document, editorState, templateDescription, templateName, visualPreset],
  );
  const latestSnapshotRef = useRef<DraftHistorySnapshot>(currentSnapshot());

  useEffect(() => {
    latestSnapshotRef.current = currentSnapshot();
  }, [currentSnapshot]);

  const applySnapshot = useCallback((next: DraftHistorySnapshot) => {
    setTemplateName(next.templateName);
    setTemplateDescription(next.templateDescription);
    setDocument(next.document);
    setEditorState(next.editorState);
    setVisualPreset(next.visualPreset);
  }, []);

  const pushHistorySnapshot = useCallback(() => {
    const snapshotToSave = latestSnapshotRef.current;
    const serialized = JSON.stringify(snapshotToSave);
    setHistoryState((current) => {
      const last = current.past[current.past.length - 1];
      if (last && JSON.stringify(last) === serialized) {
        return current;
      }
      return {
        past: [...current.past, snapshotToSave],
        future: [],
      };
    });
  }, []);

  const undoDraftChange = useCallback(() => {
    const snapshotNow = latestSnapshotRef.current;
    setHistoryState((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) {
        return current;
      }
      applySnapshot(previous);
      return {
        past: current.past.slice(0, -1),
        future: [snapshotNow, ...current.future],
      };
    });
    setSaveStatus({
      state: "dirty",
      message: "Undid last change.",
    });
  }, [applySnapshot]);

  const redoDraftChange = useCallback(() => {
    const snapshotNow = latestSnapshotRef.current;
    setHistoryState((current) => {
      const next = current.future[0];
      if (!next) {
        return current;
      }
      applySnapshot(next);
      return {
        past: [...current.past, snapshotNow],
        future: current.future.slice(1),
      };
    });
    setSaveStatus({
      state: "dirty",
      message: "Redid change.",
    });
  }, [applySnapshot]);

  const applyDocumentUpdate = useCallback(
    (
      updater: (current: RuntimeTemplateDocument) => RuntimeTemplateDocument,
      options?: DraftUpdateOptions,
    ) => {
      if (options?.recordHistory !== false) {
        pushHistorySnapshot();
      }
      setDocument((current) => normalizeRuntimeTemplateDocument(updater(current)));
    },
    [pushHistorySnapshot],
  );

  const updateElement = useCallback(
    (
      elementId: string,
      updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
      options?: DraftUpdateOptions,
    ) => {
      applyDocumentUpdate(
        (current) => ({
          ...current,
          elements: current.elements.map((element) =>
            element.id === elementId ? updater(element) : element,
          ),
        }),
        options,
      );
    },
    [applyDocumentUpdate],
  );

  const updateEditorState = useCallback(
    (
      updater: (state: RuntimeTemplateEditorState) => RuntimeTemplateEditorState,
      options?: DraftUpdateOptions,
    ) => {
      if (options?.recordHistory !== false) {
        pushHistorySnapshot();
      }
      setEditorState((current) => updater(current));
    },
    [pushHistorySnapshot],
  );

  const updateTemplateName = useCallback(
    (value: string, options?: DraftUpdateOptions) => {
      if (options?.recordHistory !== false) {
        pushHistorySnapshot();
      }
      setTemplateName(value);
    },
    [pushHistorySnapshot],
  );

  const updateTemplateDescription = useCallback(
    (value: string, options?: DraftUpdateOptions) => {
      if (options?.recordHistory !== false) {
        pushHistorySnapshot();
      }
      setTemplateDescription(value);
    },
    [pushHistorySnapshot],
  );

  const updateVisualPreset = useCallback(
    (value: TemplateVisualPresetId, options?: DraftUpdateOptions) => {
      if (options?.recordHistory !== false) {
        pushHistorySnapshot();
      }
      setVisualPreset(value);
    },
    [pushHistorySnapshot],
  );

  const saveDraft = useCallback(
    async (mode: "auto" | "manual") => {
      const documentForSave: RuntimeTemplateDocument = {
        ...document,
        metadata: {
          ...document.metadata,
          name: templateName.trim() || document.metadata.name,
          description: templateDescription.trim() || "",
        },
      };

      setSaveStatus({
        state: "saving",
        message: mode === "auto" ? "Autosaving draft…" : "Saving draft…",
      });

      const response = await fetch(`/api/dashboard/templates/${templateId}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
          name: templateName.trim() || "Untitled Runtime Template",
          description: templateDescription,
          document: documentForSave,
          editorState: {
            ...editorState,
            visualPreset,
          },
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            validation?: RuntimeTemplateValidationResult<RuntimeTemplateDocument>;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save runtime template draft.");
      }

      lastSavedSnapshotRef.current = JSON.stringify({
        templateName,
        templateDescription,
        document,
        editorState: {
          ...editorState,
          visualPreset,
        },
      });
      setSaveStatus({
        state: "saved",
        message: mode === "auto" ? "Draft autosaved." : "Draft saved.",
      });
    },
    [document, editorState, templateDescription, templateId, templateName, versionId, visualPreset],
  );

  useEffect(() => {
    if (
      editorState.selectedElementId &&
      !document.elements.some((element) => element.id === editorState.selectedElementId)
    ) {
      setEditorState((current) => ({
        ...current,
        selectedElementId: null,
      }));
    }
  }, [document.elements, editorState.selectedElementId]);

  useEffect(() => {
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveStatus((current) =>
      current.state === "saving"
        ? current
        : {
            state: "dirty",
            message: "Unsaved changes.",
          },
    );

    const timer = window.setTimeout(() => {
      void saveDraft("auto").catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Autosave failed.";
        setSaveStatus({
          state: "error",
          message,
        });
      });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [saveDraft, snapshot]);

  const handleManualSave = useCallback(async () => {
    try {
      await saveDraft("manual");
    } catch (error) {
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to save draft.",
      });
    }
  }, [saveDraft]);

  const handlePreview = useCallback(async () => {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      await saveDraft("manual");
      if (previewWindow) {
        previewWindow.location.href = `/dashboard/templates/${templateId}/preview?preset=${visualPreset}&versionId=${versionId}`;
      }
    } catch (error) {
      previewWindow?.close();
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to save draft before preview.",
      });
    }
  }, [saveDraft, templateId, versionId, visualPreset]);

  const handleDuplicateDraft = useCallback(async () => {
    try {
      await saveDraft("manual");
      const response = await fetch(`/api/dashboard/templates/${templateId}/duplicate`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { editPath?: string; error?: string }
        | null;
      if (!response.ok || !payload?.editPath) {
        throw new Error(payload?.error || "Failed to duplicate runtime template draft.");
      }
      router.push(payload.editPath);
    } catch (error) {
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to duplicate draft.",
      });
    }
  }, [router, saveDraft, templateId]);

  const handleAutoFixPresets = useCallback(() => {
    pushHistorySnapshot();
    const result = autoFixRuntimeTemplatePresetStyles(document);
    setDocument(result.document);
    setSaveStatus({
      state: "dirty",
      message:
        result.fixedPresetIds.length > 0
          ? `Auto-fixed ${result.fixedPresetIds.length} preset${result.fixedPresetIds.length === 1 ? "" : "s"}.`
          : "No preset fixes were needed.",
    });
  }, [document, pushHistorySnapshot]);

  const handleAutoFixCurrentPreset = useCallback(() => {
    pushHistorySnapshot();
    const result = autoFixRuntimeTemplatePresetStyles(document, {
      presetIds: [visualPreset],
    });
    setDocument(result.document);
    setSaveStatus({
      state: "dirty",
      message:
        result.fixedPresetIds.length > 0
          ? `Auto-fixed preset '${visualPreset}'.`
          : `No fixes were needed for preset '${visualPreset}'.`,
    });
  }, [document, pushHistorySnapshot, visualPreset]);

  const handleRunValidation = useCallback(async () => {
    try {
      setActionState("validating");
      await saveDraft("manual");
      const response = await fetch(`/api/dashboard/templates/${templateId}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; validation?: RuntimeTemplateValidationResult<RuntimeTemplateDocument> }
        | null;
      if (!response.ok || !payload?.validation) {
        throw new Error(payload?.error || "Failed to run validation.");
      }
      setSavedValidationResult(payload.validation);
      setSaveStatus({
        state: payload.validation.blockingErrorCount > 0 ? "error" : "saved",
        message:
          payload.validation.blockingErrorCount > 0
            ? `Validation found ${payload.validation.blockingErrorCount} blocking issue(s).`
            : "Validation passed.",
      });
    } catch (error) {
      setSaveStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to run validation.",
      });
    } finally {
      setActionState("idle");
    }
  }, [saveDraft, templateId, versionId]);

  const handleFinalize = useCallback(async () => {
    try {
      setActionState("finalizing");
      await saveDraft("manual");
      const response = await fetch(`/api/dashboard/templates/${templateId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            validation?: RuntimeTemplateValidationResult<RuntimeTemplateDocument>;
            previewPath?: string | null;
          }
        | null;
      if (!response.ok || !payload?.validation) {
        throw new Error(payload?.error || "Failed to finalize this runtime template version.");
      }
      setSavedValidationResult(payload.validation);
      router.push(payload.previewPath || `/dashboard/templates/${templateId}/preview?versionId=${versionId}`);
      router.refresh();
    } catch (error) {
      setSaveStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to finalize this runtime template version.",
      });
    } finally {
      setActionState("idle");
    }
  }, [router, saveDraft, templateId, versionId]);

  const handleAddElement = useCallback(
    (type: RuntimeTemplateElementType) => {
      const nextElement = createRuntimeElement(type, document);
      applyDocumentUpdate((current) => ({
        ...current,
        elements: [...current.elements, nextElement],
      }));
      setEditorState((current) => ({
        ...current,
        selectedElementId: nextElement.id,
      }));
    },
    [applyDocumentUpdate, document],
  );

  const handleDeleteElement = useCallback(
    (elementId: string) => {
      const target = document.elements.find((element) => element.id === elementId);
      if (!target) {
        return;
      }

      applyDocumentUpdate((current) => ({
        ...current,
        elements: current.elements.filter((element) => element.id !== elementId),
      }));
      setEditorState((current) => ({
        ...current,
        selectedElementId: current.selectedElementId === elementId ? null : current.selectedElementId,
      }));
    },
    [applyDocumentUpdate, document.elements],
  );

  const handleDuplicateElement = useCallback(
    (elementId: string) => {
      const target = document.elements.find((element) => element.id === elementId);
      if (!target) {
        return;
      }

      const duplicate = createDuplicatedElement(target, document.elements);
      applyDocumentUpdate((current) => ({
        ...current,
        elements: [...current.elements, duplicate],
      }));
      setEditorState((current) => ({
        ...current,
        selectedElementId: duplicate.id,
      }));
    },
    [applyDocumentUpdate, document.elements],
  );

  const handleReorderElement = useCallback(
    (elementId: string, direction: "forward" | "backward") => {
      applyDocumentUpdate((current) => {
        const ordered = [...current.elements].sort((left, right) => left.zIndex - right.zIndex);
        const index = ordered.findIndex((element) => element.id === elementId);
        if (index === -1) {
          return current;
        }

        const targetIndex =
          direction === "forward"
            ? Math.min(ordered.length - 1, index + 1)
            : Math.max(0, index - 1);
        if (targetIndex === index) {
          return current;
        }

        const next = [...ordered];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);

        return {
          ...current,
          elements: next.map((element, elementIndex) => ({
            ...element,
            zIndex: (elementIndex + 1) * 10,
          })),
        };
      });
    },
    [applyDocumentUpdate],
  );

  const handleToggleVisibility = useCallback(
    (elementId: string) => {
      updateElement(elementId, (element) => ({
        ...element,
        visible: !element.visible,
      }));
    },
    [updateElement],
  );

  const handleToggleLocked = useCallback(
    (elementId: string) => {
      updateElement(elementId, (element) => ({
        ...element,
        locked: !element.locked,
      }));
    },
    [updateElement],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "z") {
        if (isEditableTarget) {
          return;
        }
        event.preventDefault();
        if (event.shiftKey) {
          redoDraftChange();
        } else {
          undoDraftChange();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "y") {
        if (isEditableTarget) {
          return;
        }
        event.preventDefault();
        redoDraftChange();
        return;
      }

      if (event.key === "Escape" && !isEditableTarget) {
        if (selectedElement) {
          event.preventDefault();
          setEditorState((current) => ({
            ...current,
            selectedElementId: null,
          }));
        }
        return;
      }

      if (
        !selectedElement ||
        isEditableTarget
      ) {
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleDeleteElement(selectedElement.id);
        return;
      }

      if (!event.key.startsWith("Arrow")) {
        return;
      }

      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const delta =
        event.key === "ArrowUp"
          ? { x: 0, y: -step }
          : event.key === "ArrowDown"
            ? { x: 0, y: step }
            : event.key === "ArrowLeft"
              ? { x: -step, y: 0 }
              : { x: step, y: 0 };

      updateElement(selectedElement.id, (element) => ({
        ...element,
        x: element.x + delta.x,
        y: element.y + delta.y,
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteElement, redoDraftChange, selectedElement, undoDraftChange, updateElement]);

  return (
    <div className="space-y-4 text-[var(--dashboard-text)]">
      <section className="sticky top-3 z-30 rounded-[24px] border border-[var(--dashboard-line)] bg-[color:var(--dashboard-panel-strong)]/96 px-4 py-3 shadow-[var(--dashboard-shadow-sm)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <Link
              href="/dashboard/templates"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)] transition hover:text-[var(--dashboard-text)]"
              aria-label="Back to templates"
            >
              <BackIcon />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {isRenamingTemplate ? (
                  <input
                    type="text"
                    value={templateName}
                    onChange={(event) => updateTemplateName(event.target.value)}
                    onBlur={() => setIsRenamingTemplate(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setIsRenamingTemplate(false);
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setIsRenamingTemplate(false);
                      }
                    }}
                    autoFocus
                    className="min-w-[240px] max-w-[420px] rounded-xl border border-[var(--dashboard-accent-border)] bg-white px-3 py-1.5 text-[1.35rem] font-black tracking-[-0.05em] text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
                  />
                ) : (
                  <>
                    <h1 className="truncate text-[1.7rem] font-black tracking-[-0.05em]">
                      {templateName}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsRenamingTemplate(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] transition hover:text-[var(--dashboard-text)]"
                      aria-label="Rename template"
                      title="Rename template"
                    >
                      <EditIcon />
                      <span>Rename</span>
                    </button>
                  </>
                )}
                <MetaChip>{`v${versionNumber}`}</MetaChip>
                <MetaChip>{versionLifecycleStatus}</MetaChip>
                <MetaChip>{versionLocked ? "Locked" : "Editable"}</MetaChip>
                {savedValidationResult ? (
                  <MetaChip
                    tone={
                      savedValidationResult.blockingErrorCount > 0
                        ? "warning"
                        : "success"
                    }
                  >
                    {savedValidationResult.blockingErrorCount > 0
                      ? `${savedValidationResult.blockingErrorCount} issue(s)`
                      : "Validation clean"}
                  </MetaChip>
                ) : null}
                <span className={getSaveStatusClassName(saveStatus)}>{saveStatus.message}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <IconToolbarButton
              label="Undo"
              onClick={undoDraftChange}
              disabled={historyState.past.length === 0 || actionState !== "idle"}
              icon={<UndoIcon />}
            />
            <IconToolbarButton
              label="Redo"
              onClick={redoDraftChange}
              disabled={historyState.future.length === 0 || actionState !== "idle"}
              icon={<RedoIcon />}
            />
            <IconToolbarButton
              label="Duplicate draft"
              onClick={() => void handleDuplicateDraft()}
              icon={<DuplicateIcon />}
            />
            <EditorActionButton label="Preview" onClick={() => void handlePreview()} />
            <EditorActionButton
              label="Fix preset"
              onClick={handleAutoFixCurrentPreset}
              disabled={actionState !== "idle"}
            />
            <EditorActionButton
              label="Fix all"
              onClick={handleAutoFixPresets}
              disabled={actionState !== "idle"}
            />
            <EditorActionButton
              label={actionState === "validating" ? "Validating..." : "Validate"}
              onClick={() => void handleRunValidation()}
              disabled={actionState !== "idle"}
            />
            <EditorActionButton
              label="Save"
              onClick={() => void handleManualSave()}
              disabled={actionState !== "idle"}
              primary
            />
            <EditorActionButton
              label={actionState === "finalizing" ? "Finalizing..." : "Finalize"}
              onClick={() => void handleFinalize()}
              disabled={actionState !== "idle"}
            />
          </div>
        </div>

        <div className="mt-3 border-t border-[var(--dashboard-line)] pt-3">
          <QuickControlBar
            document={document}
            selectedElement={selectedElement}
            onUpdateDocument={applyDocumentUpdate}
            onUpdateElement={updateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onBringForward={(elementId) => handleReorderElement(elementId, "forward")}
            onSendBackward={(elementId) => handleReorderElement(elementId, "backward")}
            onToggleVisibility={handleToggleVisibility}
            onToggleLocked={handleToggleLocked}
          />
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px_340px]">
        <aside className="sticky top-[7.5rem] grid h-[calc(100vh-8.25rem)] min-h-0 gap-3 overflow-hidden xl:grid-cols-[64px_minmax(0,1fr)]">
          <nav className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-2 shadow-[var(--dashboard-shadow-sm)]">
            <div className="flex flex-col gap-2">
              <SidebarTabButton
                label="Elements"
                active={leftPanel === "elements"}
                onClick={() => setLeftPanel("elements")}
                icon={<ShapesIcon />}
              />
              <SidebarTabButton
                label="Layers"
                active={leftPanel === "layers"}
                onClick={() => setLeftPanel("layers")}
                icon={<LayersIcon />}
              />
              <SidebarTabButton
                label="Template"
                active={leftPanel === "template"}
                onClick={() => setLeftPanel("template")}
                icon={<TemplateIcon />}
              />
            </div>
          </nav>

          <div className="min-w-0 overflow-y-auto">
            <TemplateMetadataSummary
              category={document.metadata.category}
              tags={document.metadata.tags}
              onEdit={() => setLeftPanel("template")}
              isEditing={leftPanel === "template"}
            />
            {leftPanel === "elements" ? (
              <ElementCatalog onAddElement={handleAddElement} />
            ) : null}
            {leftPanel === "layers" ? (
              <LayerPanel
                elements={document.elements}
                selectedElementId={editorState.selectedElementId}
                onSelectElement={(elementId) =>
                  setEditorState((current) => ({ ...current, selectedElementId: elementId }))
                }
                onToggleVisibility={handleToggleVisibility}
                onToggleLocked={handleToggleLocked}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onBringForward={(elementId) => handleReorderElement(elementId, "forward")}
                onSendBackward={(elementId) => handleReorderElement(elementId, "backward")}
              />
            ) : null}
            {leftPanel === "template" ? (
              <TemplateMetaPanel
                templateName={templateName}
                templateDescription={templateDescription}
                onChangeTemplateName={updateTemplateName}
                onChangeTemplateDescription={updateTemplateDescription}
                templateCategory={document.metadata.category}
                templateTags={document.metadata.tags}
                onChangeTemplateCategory={(value) =>
                  applyDocumentUpdate((current) => ({
                    ...current,
                    metadata: {
                      ...current.metadata,
                      category: value,
                    },
                  }))
                }
                onChangeTemplateTags={(value) =>
                  applyDocumentUpdate((current) => ({
                    ...current,
                    metadata: {
                      ...current.metadata,
                      tags: value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                previewContent={editorState.previewContent}
                onChangePreviewContent={(field, value) =>
                  updateEditorState((current) => ({
                    ...current,
                    previewContent: {
                      ...current.previewContent,
                      [field]: value,
                    },
                  }))
                }
              />
            ) : null}
          </div>
        </aside>

        <div className="sticky top-[7.5rem] h-[calc(100vh-8.25rem)] min-h-0">
          <CanvasEditor
            document={document}
            payload={previewPayload}
            editorState={editorState}
            selectedElementId={editorState.selectedElementId}
            onSelectElement={(elementId) =>
              setEditorState((current) => ({ ...current, selectedElementId: elementId }))
            }
            onUpdateElement={updateElement}
            onUpdateEditorState={updateEditorState}
            onBeginHistoryAction={pushHistorySnapshot}
            onChangeVisualPreset={updateVisualPreset}
          />
        </div>

        <div className="sticky top-[7.5rem] h-[calc(100vh-8.25rem)] min-h-0">
          <InspectorPanel
            document={document}
            selectedElement={selectedElement}
            currentPreset={visualPreset}
            onUpdateDocument={applyDocumentUpdate}
            onUpdateElement={updateElement}
          />
        </div>

        <div className="sticky top-[7.5rem] h-[calc(100vh-8.25rem)] min-h-0">
          <ValidationSidebar
            document={document}
            validationResult={validationResult}
            persistedValidationResult={savedValidationResult}
            currentPreset={visualPreset}
            onUpdateDocument={applyDocumentUpdate}
          />
        </div>
      </div>
    </div>
  );
}

function TemplateMetaPanel(props: {
  templateName: string;
  templateDescription: string;
  onChangeTemplateName: (value: string) => void;
  onChangeTemplateDescription: (value: string) => void;
  templateCategory: string;
  templateTags: string[];
  onChangeTemplateCategory: (value: string) => void;
  onChangeTemplateTags: (value: string) => void;
  previewContent: RuntimeTemplateEditorState["previewContent"];
  onChangePreviewContent: (
    field: keyof RuntimeTemplateEditorState["previewContent"],
    value: string | number,
  ) => void;
}) {
  return (
    <section className="space-y-3 rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
        Template
      </p>
      <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
        Name
        <input
          type="text"
          value={props.templateName}
          onChange={(event) => props.onChangeTemplateName(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
        />
      </label>
      <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
        Description
        <textarea
          rows={3}
          value={props.templateDescription}
          onChange={(event) => props.onChangeTemplateDescription(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
          Category
          <input
            type="text"
            value={props.templateCategory}
            onChange={(event) => props.onChangeTemplateCategory(event.target.value)}
            placeholder="e.g. roundup"
            className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
          Tags
          <input
            type="text"
            value={props.templateTags.join(", ")}
            onChange={(event) => props.onChangeTemplateTags(event.target.value)}
            placeholder="ideas, guide, editorial"
            className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
          />
        </label>
      </div>

      <div className="rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
          Preview content
        </p>
        <p className="mt-2 text-xs leading-5 text-[var(--dashboard-muted)]">
          Editor preview uses this sample content. Final generated pins use live job content and can
          expose tight spacing more aggressively.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Title
            <textarea
              rows={3}
              value={props.previewContent.title}
              onChange={(event) => props.onChangePreviewContent("title", event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Subtitle
            <input
              type="text"
              value={props.previewContent.subtitle}
              onChange={(event) => props.onChangePreviewContent("subtitle", event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              Number
              <input
                type="number"
                min={0}
                max={999}
                value={props.previewContent.itemNumber}
                onChange={(event) =>
                  props.onChangePreviewContent("itemNumber", Number(event.target.value) || 0)
                }
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
              CTA
              <input
                type="text"
                value={props.previewContent.ctaText}
                onChange={(event) => props.onChangePreviewContent("ctaText", event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[var(--dashboard-subtle)]">
            Domain
            <input
              type="text"
              value={props.previewContent.domain}
              onChange={(event) => props.onChangePreviewContent("domain", event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--dashboard-line)] bg-white px-3 py-2 text-[var(--dashboard-text)] outline-none focus:border-[var(--dashboard-accent)]"
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function TemplateMetadataSummary(props: {
  category: string;
  tags: string[];
  onEdit: () => void;
  isEditing: boolean;
}) {
  const hasCategory = props.category.trim().length > 0;
  const tags = props.tags.filter((tag) => tag.trim().length > 0);

  return (
    <section className="mb-3 rounded-[20px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-3 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
            Template metadata
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hasCategory ? (
              <span className="inline-flex items-center rounded-full border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--dashboard-accent-strong)]">
                {props.category.trim()}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-dashed border-[var(--dashboard-line)] px-2.5 py-1 text-xs font-medium text-[var(--dashboard-muted)]">
                No category
              </span>
            )}
            {tags.length > 0 ? (
              tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-xs font-medium text-[var(--dashboard-subtle)]"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full border border-dashed border-[var(--dashboard-line)] px-2.5 py-1 text-xs font-medium text-[var(--dashboard-muted)]">
                No tags
              </span>
            )}
            {tags.length > 3 ? (
              <span className="inline-flex items-center rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-1 text-xs font-medium text-[var(--dashboard-muted)]">
                +{tags.length - 3}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={props.onEdit}
          className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            props.isEditing
              ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]"
              : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)] hover:text-[var(--dashboard-text)]"
          }`}
        >
          {props.isEditing ? "Editing details" : "Edit details"}
        </button>
      </div>
    </section>
  );
}

function SidebarTabButton(props: {
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-3 text-center transition ${
        props.active
          ? "bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)] shadow-[inset_0_0_0_1px_rgba(30,94,255,0.18)]"
          : "text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-panel)] hover:text-[var(--dashboard-text)]"
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current/20">
        {props.icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{props.label}</span>
    </button>
  );
}

function QuickControlBar(props: {
  document: RuntimeTemplateDocument;
  selectedElement: RuntimeTemplateElement | null;
  onUpdateDocument: (updater: (document: RuntimeTemplateDocument) => RuntimeTemplateDocument) => void;
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
  ) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onBringForward: (elementId: string) => void;
  onSendBackward: (elementId: string) => void;
  onToggleVisibility: (elementId: string) => void;
  onToggleLocked: (elementId: string) => void;
}) {
  const {
    document,
    selectedElement,
    onUpdateDocument,
    onUpdateElement,
    onDeleteElement,
    onDuplicateElement,
    onBringForward,
    onSendBackward,
    onToggleVisibility,
    onToggleLocked,
  } = props;
  const [showGeometry, setShowGeometry] = useState(false);

  if (!selectedElement) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <MetaChip>Document</MetaChip>
        </div>
        <div className="flex flex-wrap gap-2">
          <CompactNumberField
            label="Inset"
            value={document.canvas.safeInset}
            minimum={0}
            maximum={200}
            onChange={(value) =>
              onUpdateDocument((current) => ({
                ...current,
                canvas: { ...current.canvas, safeInset: value },
              }))
            }
          />
          <CompactNumberField
            label="Slots"
            value={document.capabilities.imageSlotCount}
            minimum={1}
            maximum={24}
            onChange={(value) =>
              onUpdateDocument((current) => ({
                ...current,
                capabilities: { ...current.capabilities, imageSlotCount: value },
              }))
            }
          />
          <CompactNumberField
            label="Min slots"
            value={document.validationRules.imagePolicy.minSlotsRequired}
            minimum={1}
            maximum={24}
            onChange={(value) =>
              onUpdateDocument((current) => ({
                ...current,
                validationRules: {
                  ...current.validationRules,
                  imagePolicy: {
                    ...current.validationRules.imagePolicy,
                    minSlotsRequired: value,
                  },
                },
              }))
            }
          />
          <CompactSelectField
            label="Background"
            value={document.background.fillToken}
            options={runtimeTemplateFillTokenValues}
            onChange={(value) =>
              onUpdateDocument((current) => ({
                ...current,
                background: {
                  ...current.background,
                  fillToken: value as RuntimeTemplateFillToken,
                },
              }))
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          <MetaChip>{selectedElement.name}</MetaChip>
          <MetaChip>{selectedElement.type}</MetaChip>
          {hasTextSemanticRole(selectedElement) ? (
            <MetaChip>{selectedElement.semanticRole}</MetaChip>
          ) : null}
          <div className="ml-1 flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--dashboard-accent)_16%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,var(--dashboard-accent)_7%,white)] px-2 py-1">
            <button
              type="button"
              onClick={() => setShowGeometry((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                showGeometry
                  ? "border-[color:color-mix(in_srgb,#0f766e_28%,var(--dashboard-line))] bg-white text-[#0f766e]"
                  : "border-[color:color-mix(in_srgb,#0f766e_18%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,#0f766e_9%,white)] text-[#0f766e]"
              }`}
            >
              <span className="text-[10px] tracking-[0.08em]">
                {showGeometry ? "Hide position" : `Pos ${Math.round(selectedElement.x)} · ${Math.round(selectedElement.y)}`}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--dashboard-accent)_16%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,var(--dashboard-accent)_7%,white)] px-2 py-1">
          <ToolbarActionButton icon={<DuplicateIcon />} label="Duplicate" onClick={() => onDuplicateElement(selectedElement.id)} accent />
          <ToolbarActionButton icon={<BringForwardIcon />} label="Front" onClick={() => onBringForward(selectedElement.id)} accent />
          <ToolbarActionButton icon={<SendBackwardIcon />} label="Back" onClick={() => onSendBackward(selectedElement.id)} accent />
          <ToolbarActionButton
            icon={selectedElement.visible ? <HideIcon /> : <ShowIcon />}
            label={selectedElement.visible ? "Hide" : "Show"}
            onClick={() => onToggleVisibility(selectedElement.id)}
            accent
          />
          <ToolbarActionButton
            icon={selectedElement.locked ? <UnlockIcon /> : <LockIcon />}
            label={selectedElement.locked ? "Unlock" : "Lock"}
            onClick={() => onToggleLocked(selectedElement.id)}
            accent
          />
          <ToolbarActionButton
            label="Delete"
            icon={<DeleteIcon />}
            destructive
            onClick={() => onDeleteElement(selectedElement.id)}
          />
          </div>
          {renderQuickBindingFields(selectedElement, onUpdateElement)}
        </div>
      </div>
      {showGeometry ? (
        <div className="flex flex-wrap gap-2 rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-2">
          <CompactNumberField
            label="X"
            value={selectedElement.x}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, x: value }))
            }
          />
          <CompactNumberField
            label="Y"
            value={selectedElement.y}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, y: value }))
            }
          />
          <CompactNumberField
            label="W"
            value={selectedElement.width}
            minimum={20}
            maximum={1080}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, width: value }))
            }
          />
          <CompactNumberField
            label="H"
            value={selectedElement.height}
            minimum={20}
            maximum={1920}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, height: value }))
            }
          />
          <CompactNumberField
            label="Rot"
            value={selectedElement.rotation}
            minimum={-180}
            maximum={180}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, rotation: value }))
            }
          />
          <CompactNumberField
            label="Opacity"
            value={selectedElement.opacity}
            minimum={0}
            maximum={1}
            step={0.05}
            onChange={(value) =>
              onUpdateElement(selectedElement.id, (element) => ({ ...element, opacity: value }))
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function renderQuickBindingFields(
  selectedElement: RuntimeTemplateElement,
  onUpdateElement: (
    elementId: string,
    updater: (element: RuntimeTemplateElement) => RuntimeTemplateElement,
  ) => void,
) {
  if (hasTextSemanticRole(selectedElement)) {
    return (
      <>
        <CompactSelectField
          label="Binding"
          value={selectedElement.semanticRole}
          options={getQuickTextSemanticOptions(selectedElement.type)}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<
                RuntimeTemplateElement,
                {
                  type:
                    | "titleText"
                    | "subtitleText"
                    | "domainText"
                    | "numberText"
                    | "ctaText"
                    | "labelText";
                }
              >),
              semanticRole: value as RuntimeTemplateTextSemanticRole,
            }))
          }
        />
        <CompactSelectField
          label="Text color"
          value={selectedElement.styleTokens.textToken}
          options={runtimeTemplateTextTokenValues}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<
                RuntimeTemplateElement,
                {
                  type:
                    | "titleText"
                    | "subtitleText"
                    | "domainText"
                    | "numberText"
                    | "ctaText"
                    | "labelText";
                }
              >),
              styleTokens: {
                ...(
                  element as Extract<
                    RuntimeTemplateElement,
                    {
                      type:
                        | "titleText"
                        | "subtitleText"
                        | "domainText"
                        | "numberText"
                        | "ctaText"
                        | "labelText";
                    }
                  >
                ).styleTokens,
                textToken: value as RuntimeTemplateTextToken,
              },
            }))
          }
        />
        <CompactSelectField
          label="Font"
          value={selectedElement.styleTokens.fontToken}
          options={runtimeTemplateFontTokenValues}
          getOptionLabel={formatRuntimeFontTokenLabel}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<
                RuntimeTemplateElement,
                {
                  type:
                    | "titleText"
                    | "subtitleText"
                    | "domainText"
                    | "numberText"
                    | "ctaText"
                    | "labelText";
                }
              >),
              styleTokens: {
                ...(
                  element as Extract<
                    RuntimeTemplateElement,
                    {
                      type:
                        | "titleText"
                        | "subtitleText"
                        | "domainText"
                        | "numberText"
                        | "ctaText"
                        | "labelText";
                    }
                  >
                ).styleTokens,
                fontToken: value as RuntimeTemplateFontToken,
              },
            }))
          }
        />
      </>
    );
  }

  if (selectedElement.type === "imageFrame") {
    return (
      <>
        <CompactNumberField
          label="Slot"
          value={selectedElement.slotIndex}
          minimum={0}
          maximum={24}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>),
              slotIndex: value,
            }))
          }
        />
        <CompactSelectField
          label="Fill"
          value={selectedElement.styleTokens.fillToken ?? ""}
          options={["", ...runtimeTemplateFillTokenValues]}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>).styleTokens,
                fillToken: value ? (value as RuntimeTemplateFillToken) : undefined,
              },
            }))
          }
        />
        <CompactSelectField
          label="Border"
          value={selectedElement.styleTokens.borderToken ?? ""}
          options={["", ...runtimeTemplateBorderTokenValues]}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "imageFrame" }>).styleTokens,
                borderToken: value ? (value as RuntimeTemplateBorderToken) : undefined,
              },
            }))
          }
        />
      </>
    );
  }

  if (selectedElement.type === "imageGrid") {
    return (
      <>
        <CompactNumberField
          label="Slot start"
          value={selectedElement.slotStartIndex}
          minimum={0}
          maximum={24}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>),
              slotStartIndex: value,
            }))
          }
        />
        <CompactSelectField
          label="Fill"
          value={selectedElement.styleTokens.fillToken ?? ""}
          options={["", ...runtimeTemplateFillTokenValues]}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>).styleTokens,
                fillToken: value ? (value as RuntimeTemplateFillToken) : undefined,
              },
            }))
          }
        />
        <CompactSelectField
          label="Border"
          value={selectedElement.styleTokens.borderToken ?? ""}
          options={["", ...runtimeTemplateBorderTokenValues]}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "imageGrid" }>).styleTokens,
                borderToken: value ? (value as RuntimeTemplateBorderToken) : undefined,
              },
            }))
          }
        />
      </>
    );
  }

  if (selectedElement.type === "shapeBlock") {
    return (
      <>
        <CompactSelectField
          label="Fill"
          value={selectedElement.styleTokens.fillToken}
          options={runtimeTemplateFillTokenValues}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "shapeBlock" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "shapeBlock" }>).styleTokens,
                fillToken: value as RuntimeTemplateFillToken,
              },
            }))
          }
        />
        <CompactSelectField
          label="Border"
          value={selectedElement.styleTokens.borderToken ?? ""}
          options={["", ...runtimeTemplateBorderTokenValues]}
          onChange={(value) =>
            onUpdateElement(selectedElement.id, (element) => ({
              ...(element as Extract<RuntimeTemplateElement, { type: "shapeBlock" }>),
              styleTokens: {
                ...(element as Extract<RuntimeTemplateElement, { type: "shapeBlock" }>).styleTokens,
                borderToken: value ? (value as RuntimeTemplateBorderToken) : undefined,
              },
            }))
          }
        />
      </>
    );
  }

  if (selectedElement.type === "overlay") {
    return (
      <CompactSelectField
        label="Fill"
        value={selectedElement.styleTokens.fillToken ?? ""}
        options={["", ...runtimeTemplateFillTokenValues]}
        onChange={(value) =>
          onUpdateElement(selectedElement.id, (element) => ({
            ...(element as Extract<RuntimeTemplateElement, { type: "overlay" }>),
            styleTokens: {
              ...(element as Extract<RuntimeTemplateElement, { type: "overlay" }>).styleTokens,
              fillToken: value ? (value as RuntimeTemplateFillToken) : undefined,
            },
          }))
        }
      />
    );
  }

  if (selectedElement.type === "divider") {
    return (
      <CompactSelectField
        label="Border"
        value={selectedElement.styleTokens.borderToken}
        options={runtimeTemplateBorderTokenValues}
        onChange={(value) =>
          onUpdateElement(selectedElement.id, (element) => ({
            ...(element as Extract<RuntimeTemplateElement, { type: "divider" }>),
            styleTokens: {
              borderToken: value as RuntimeTemplateBorderToken,
            },
          }))
        }
      />
    );
  }

  return null;
}

function getQuickTextSemanticOptions(
  type: Extract<
    RuntimeTemplateElement["type"],
    "titleText" | "subtitleText" | "domainText" | "numberText" | "ctaText" | "labelText"
  >,
) {
  if (type === "titleText") {
    return ["title", "subtitle", "domain", "cta", "decorative"];
  }
  if (type === "subtitleText") {
    return ["subtitle", "title", "domain", "cta", "decorative"];
  }
  if (type === "domainText") {
    return ["domain", "cta", "decorative"];
  }
  if (type === "numberText") {
    return ["itemNumber", "decorative"];
  }
  if (type === "ctaText") {
    return ["cta", "decorative"];
  }
  return ["decorative", "cta", "subtitle"];
}

function MetaChip(props: { children: ReactNode; tone?: "default" | "warning" | "success" }) {
  const className =
    props.tone === "warning"
      ? "rounded-full border border-[color:color-mix(in_srgb,#e37b2d_24%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,#e37b2d_10%,white)] px-3 py-1 text-[#a95418]"
      : props.tone === "success"
        ? "rounded-full border border-[color:color-mix(in_srgb,#0f766e_22%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,#0f766e_8%,white)] px-3 py-1 text-[#0f766e]"
        : "rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1";

  return (
    <span className={className}>
      {props.children}
    </span>
  );
}

function ToolbarActionButton(props: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        props.destructive
          ? "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : props.accent
            ? "border-[color:color-mix(in_srgb,var(--dashboard-accent)_14%,var(--dashboard-line))] bg-[color:color-mix(in_srgb,var(--dashboard-accent)_10%,white)] text-[var(--dashboard-accent-strong)]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {props.icon ? <span className="h-3.5 w-3.5">{props.icon}</span> : null}
      {props.label}
    </button>
  );
}

function EditorActionButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        props.primary
          ? "dashboard-accent-action bg-[var(--dashboard-accent)] text-white shadow-[var(--dashboard-shadow-accent)]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {props.label}
    </button>
  );
}

function IconToolbarButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)] transition hover:text-[var(--dashboard-text)] disabled:opacity-50"
    >
      <span className="h-4 w-4">{props.icon}</span>
    </button>
  );
}

function ShapesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <rect x="4" y="5" width="7" height="7" rx="2" />
      <circle cx="16.5" cy="8.5" r="3.5" />
      <path d="M5 18h7l-3.5-6Z" />
      <path d="M15 15h5v5h-5z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.9]">
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.9]">
      <path d="M9 9 5 13l4 4" />
      <path d="M5 13h8a6 6 0 1 1 0 12" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.9]">
      <path d="m15 9 4 4-4 4" />
      <path d="M19 13h-8a6 6 0 1 0 0 12" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <rect x="8" y="8" width="10" height="10" rx="2" />
      <path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m12 6 4 4" />
    </svg>
  );
}

function BringForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <path d="M7 17h10" />
      <path d="M12 7v10" />
      <path d="m8 10 4-4 4 4" />
    </svg>
  );
}

function SendBackwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h10" />
      <path d="M12 7v10" />
      <path d="m8 14 4 4 4-4" />
    </svg>
  );
}

function HideIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShowIcon() {
  return <HideIcon />;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7-2" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full fill-none stroke-current stroke-[1.8]">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="m7 7 1 12h8l1-12" />
    </svg>
  );
}

function CompactNumberField(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
  step?: number;
}) {
  return (
    <label className="min-w-[82px] rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        {props.label}
      </span>
      <input
        type="number"
        min={props.minimum}
        max={props.maximum}
        step={props.step ?? 1}
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[var(--dashboard-text)] outline-none"
      />
    </label>
  );
}

function CompactSelectField(props: {
  label: string;
  value: string;
  options: readonly string[];
  getOptionLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[148px] rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-2.5 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        {props.label}
      </span>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-[var(--dashboard-text)] outline-none"
      >
        {props.options.map((option) => (
          <option key={option || "empty"} value={option}>
            {props.getOptionLabel?.(option) ?? (option || "None")}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatRuntimeFontTokenLabel(value: string) {
  const labels: Record<string, string> = {
    "font.title": "Preset Title",
    "font.subtitle": "Preset Subtitle",
    "font.meta": "Preset Meta",
    "font.number": "Preset Number",
    "font.cta": "CTA Sans",
    "font.editorial-serif": "Editorial Serif",
    "font.display-serif": "Display Serif",
    "font.classic-serif": "Classic Serif",
    "font.book-serif": "Book Serif",
    "font.modern-sans": "Modern Sans",
    "font.grotesk": "Grotesk",
    "font.clean-sans": "Clean Sans",
    "font.condensed-sans": "Condensed Sans",
    "font.bold-sans": "Bold Sans",
    "font.rounded-sans": "Rounded Sans",
    "font.script": "Script",
    "font.signature": "Signature",
  };

  return labels[value] ?? (value || "None");
}

function getSaveStatusClassName(saveStatus: SaveStatus) {
  if (saveStatus.state === "error") {
    return "inline-flex rounded-full border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-danger-ink)]";
  }
  if (saveStatus.state === "saving") {
    return "inline-flex rounded-full border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-accent-strong)]";
  }
  return "inline-flex rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-sm font-semibold text-[var(--dashboard-subtle)]";
}

function normalizeRuntimeTemplateDocument(document: RuntimeTemplateDocument): RuntimeTemplateDocument {
  const ordered = [...document.elements]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((element, index) => ({
      ...element,
      zIndex: (index + 1) * 10,
    }));
  const maxSlotIndex = ordered.reduce((maximum, element) => {
    if (element.type === "imageFrame") {
      return Math.max(maximum, element.slotIndex + 1);
    }
    if (element.type === "imageGrid") {
      return Math.max(
        maximum,
        element.slotStartIndex + getRuntimeTemplateGridSlotCount(element.layoutPreset),
      );
    }
    return maximum;
  }, 1);
  const coveredImageSlotCount = Math.max(1, maxSlotIndex);
  const primaryRoles = {
    supportsSubtitle: ordered.some(
      (element) => hasTextSemanticRole(element) && element.semanticRole === "subtitle",
    ),
    supportsItemNumber: ordered.some(
      (element) => hasTextSemanticRole(element) && element.semanticRole === "itemNumber",
    ),
    supportsDomain: ordered.some(
      (element) => hasTextSemanticRole(element) && element.semanticRole === "domain",
    ),
  };

  return {
    ...document,
    elements: ordered,
    capabilities: {
      ...document.capabilities,
      supportsSubtitle: primaryRoles.supportsSubtitle,
      supportsItemNumber: primaryRoles.supportsItemNumber,
      supportsDomain: primaryRoles.supportsDomain,
      imageSlotCount: Math.max(document.capabilities.imageSlotCount, maxSlotIndex),
    },
    validationRules: {
      ...document.validationRules,
      imagePolicy: {
        ...document.validationRules.imagePolicy,
        minSlotsRequired: Math.min(
          Math.max(1, document.validationRules.imagePolicy.minSlotsRequired),
          coveredImageSlotCount,
        ),
      },
    },
  };
}

function createRuntimeElement(
  type: RuntimeTemplateElementType,
  document: RuntimeTemplateDocument,
): RuntimeTemplateElement {
  const nextZIndex = (document.elements.length + 1) * 10;
  const index = document.elements.length + 1;
  const base = {
    id: createElementId(type, document.elements),
    name: defaultElementName(type, index),
    x: 120 + ((index % 3) * 24),
    y: 120 + ((index % 4) * 24),
    width: 360,
    height: 180,
    rotation: 0,
    zIndex: nextZIndex,
    visible: true,
    locked: false,
    opacity: 1,
  } as const;

  switch (type) {
    case "imageFrame":
      return {
        ...base,
        type: "imageFrame",
        semanticRole: "imageSlot",
        width: 420,
        height: 420,
        slotIndex: getNextAvailableImageSlot(document),
        shapeKind: "roundedRect",
        fitMode: "cover",
        styleTokens: {
          fillToken: "surface.secondary",
          borderToken: "border.primary",
          shadowToken: "shadow.none",
          borderRadius: 24,
          overlayGradient: "none",
          overlayOpacity: 0.18,
        },
      };
    case "imageGrid":
      return {
        ...base,
        type: "imageGrid",
        semanticRole: "imageSlot",
        width: 640,
        height: 520,
        slotStartIndex: getNextAvailableImageSlot(document),
        layoutPreset: "grid-4",
        gap: 12,
        fitMode: "cover",
        styleTokens: {
          fillToken: "surface.secondary",
          borderToken: "border.primary",
          shadowToken: "shadow.none",
          borderRadius: 18,
          overlayGradient: "none",
          overlayOpacity: 0,
        },
      };
    case "shapeBlock":
      return {
        ...base,
        type: "shapeBlock",
        semanticRole: "decorative",
        width: 640,
        height: 260,
        shapeKind: "roundedRect",
        styleTokens: {
          fillToken: "surface.primary",
          borderToken: "border.primary",
          shadowToken: "shadow.soft",
          borderRadius: 24,
        },
      };
    case "overlay":
      return {
        ...base,
        type: "overlay",
        semanticRole: "decorative",
        width: 640,
        height: 260,
        styleTokens: {
          fillToken: "surface.overlay",
          gradient: "bottomFade",
          opacity: 0.4,
        },
      };
    case "divider":
      return {
        ...base,
        type: "divider",
        semanticRole: "decorative",
        width: 360,
        height: 2,
        styleTokens: {
          borderToken: "border.accent",
        },
        strokeWidth: 2,
      };
    case "titleText":
      return createTextElement(base, "titleText", defaultTextSemanticRole("titleText", document), {
        fontToken: "font.title",
        textToken: "text.title",
        minFontSize: 42,
        maxFontSize: 96,
        maxLines: 3,
        lineHeight: 1.08,
        letterSpacing: -0.02,
      });
    case "subtitleText":
      return createTextElement(base, "subtitleText", defaultTextSemanticRole("subtitleText", document), {
        fontToken: "font.subtitle",
        textToken: "text.subtitle",
        minFontSize: 22,
        maxFontSize: 34,
        maxLines: 2,
        lineHeight: 1.04,
        letterSpacing: 0.12,
      });
    case "domainText":
      return {
        ...createTextElement(base, "domainText", defaultTextSemanticRole("domainText", document), {
          fontToken: "font.meta",
          textToken: "text.meta",
          minFontSize: 24,
          maxFontSize: 32,
          maxLines: 1,
          lineHeight: 1,
          letterSpacing: 0,
        }),
        sanitizeDomain: true,
      } as RuntimeTemplateElement;
    case "numberText":
      return {
        ...createTextElement(base, "numberText", defaultTextSemanticRole("numberText", document), {
          fontToken: "font.number",
          textToken: "text.number",
          minFontSize: 88,
          maxFontSize: 126,
          maxLines: 1,
          lineHeight: 0.9,
          letterSpacing: -0.06,
        }),
        width: 180,
        hideWhenEmpty: true,
      } as RuntimeTemplateElement;
    case "ctaText":
      return {
        ...createTextElement(base, "ctaText", "cta", {
          fontToken: "font.cta",
          textToken: "text.cta",
          minFontSize: 24,
          maxFontSize: 38,
          maxLines: 1,
          lineHeight: 1,
          letterSpacing: 0.02,
        }),
        text: "Read more",
      } as RuntimeTemplateElement;
    case "labelText":
      return {
        ...createTextElement(base, "labelText", "decorative", {
          fontToken: "font.meta",
          textToken: "text.subtitle",
          minFontSize: 18,
          maxFontSize: 28,
          maxLines: 1,
          lineHeight: 1,
          letterSpacing: 0.12,
        }),
        text: "Label",
      } as RuntimeTemplateElement;
  }
}

function createTextElement(
  base: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    visible: boolean;
    locked: boolean;
    opacity: number;
  },
  type: Extract<
    RuntimeTemplateElementType,
    | "titleText"
    | "subtitleText"
    | "domainText"
    | "numberText"
    | "ctaText"
    | "labelText"
  >,
  semanticRole: RuntimeTemplateTextSemanticRole,
  style: {
    fontToken: RuntimeTemplateFontToken;
    textToken: RuntimeTemplateTextToken;
    minFontSize: number;
    maxFontSize: number;
    maxLines: number;
    lineHeight: number;
    letterSpacing: number;
  },
) : RuntimeTemplateElement {
  const textElementBase = {
    ...base,
    type,
    semanticRole,
    hideWhenEmpty: semanticRole === "subtitle" || semanticRole === "itemNumber",
    text: semanticRole === "cta" ? "Read more" : "",
    styleTokens: {
      textToken: style.textToken,
      fontToken: style.fontToken,
      textAlign: "center" as const,
      textTransform: "none" as const,
      minFontSize: style.minFontSize,
      maxFontSize: style.maxFontSize,
      maxLines: style.maxLines,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      autoFit: true,
    },
  };

  if (semanticRole === "title") {
    return {
      ...textElementBase,
      width: 780,
      height: 220,
    } as RuntimeTemplateElement;
  }

  if (semanticRole === "subtitle") {
    return {
      ...textElementBase,
      width: 720,
      height: 60,
    } as RuntimeTemplateElement;
  }

  if (semanticRole === "domain") {
    return {
      ...textElementBase,
      sanitizeDomain: true,
      width: 520,
      height: 48,
    } as RuntimeTemplateElement;
  }

  if (semanticRole === "itemNumber") {
    return {
      ...textElementBase,
      width: 180,
      height: 140,
    } as RuntimeTemplateElement;
  }

  return textElementBase as RuntimeTemplateElement;
}

function createDuplicatedElement(
  element: RuntimeTemplateElement,
  allElements: RuntimeTemplateElement[],
): RuntimeTemplateElement {
  return {
    ...element,
    id: createElementId(element.type, allElements),
    name: `${element.name} Copy`,
    x: Math.min(1080 - element.width, element.x + 24),
    y: Math.min(1920 - element.height, element.y + 24),
    zIndex: (allElements.length + 1) * 10,
  };
}

function createElementId(
  type: RuntimeTemplateElementType,
  allElements: RuntimeTemplateElement[],
) {
  const prefix = type.replace(/([A-Z])/g, "-$1").toLowerCase();
  let index = allElements.length + 1;
  let candidate = `${prefix}-${index}`;
  const existing = new Set(allElements.map((element) => element.id));
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${prefix}-${index}`;
  }
  return candidate;
}

function defaultElementName(type: RuntimeTemplateElementType, index: number) {
  const labels: Record<RuntimeTemplateElementType, string> = {
    imageFrame: "Image frame",
    imageGrid: "Image grid",
    shapeBlock: "Shape block",
    overlay: "Overlay",
    divider: "Divider",
    titleText: "Title text",
    subtitleText: "Subtitle text",
    domainText: "Domain text",
    numberText: "Number text",
    ctaText: "CTA text",
    labelText: "Label text",
  };
  return `${labels[type]} ${index}`;
}

function getNextAvailableImageSlot(document: RuntimeTemplateDocument) {
  const usedSlots = new Set<number>();

  document.elements.forEach((element) => {
    if (element.type === "imageFrame") {
      usedSlots.add(element.slotIndex);
    }
    if (element.type === "imageGrid") {
      const slotCount = getRuntimeTemplateGridSlotCount(element.layoutPreset);
      Array.from({ length: slotCount }, (_, index) => element.slotStartIndex + index).forEach((slotIndex) =>
        usedSlots.add(slotIndex),
      );
    }
  });

  let nextSlot = 0;
  while (usedSlots.has(nextSlot)) {
    nextSlot += 1;
  }
  return nextSlot;
}

function hasTextSemanticRole(
  element: RuntimeTemplateElement,
): element is Extract<
  RuntimeTemplateElement,
  {
    type:
      | "titleText"
      | "subtitleText"
      | "domainText"
      | "numberText"
      | "ctaText"
      | "labelText";
  }
> {
  return (
    element.type === "titleText" ||
    element.type === "subtitleText" ||
    element.type === "domainText" ||
    element.type === "numberText" ||
    element.type === "ctaText" ||
    element.type === "labelText"
  );
}

function defaultTextSemanticRole(
  type: Extract<
    RuntimeTemplateElementType,
    "titleText" | "subtitleText" | "domainText" | "numberText"
  >,
  document: RuntimeTemplateDocument,
): RuntimeTemplateTextSemanticRole {
  const desiredRole =
    type === "titleText"
      ? "title"
      : type === "subtitleText"
        ? "subtitle"
        : type === "domainText"
          ? "domain"
          : "itemNumber";

  const alreadyUsed = document.elements.some(
    (element) => hasTextSemanticRole(element) && element.semanticRole === desiredRole,
  );

  return alreadyUsed ? "decorative" : desiredRole;
}
