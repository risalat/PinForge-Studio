"use client";

import { useState } from "react";
import { BusyActionLabel } from "@/components/ui/BusyActionLabel";

type StorageAuditResult = {
  provider: "local" | "r2";
  checkedPins: number;
  missingCount: number;
  missing: Array<{
    pinId: string;
    storageKey: string;
    createdAt: string;
    jobId: string;
    articleTitle: string;
    postUrl: string;
  }>;
};

type TempCleanupResult = {
  provider: "local" | "r2";
  apply: boolean;
  days: number;
  cutoff: string;
  staleObjectCount: number;
  staleKeys: string[];
};

type CanonicalPostRepairResult = {
  scannedPosts: number;
  canonicalGroupsTouched: number;
  canonicalizedPosts: number;
  deletedDuplicatePosts: number;
  updatedGenerationJobs: number;
  updatedPublicationRecords: number;
};

export function HousekeepingManager({ databaseReady }: { databaseReady: boolean }) {
  const [days, setDays] = useState(7);
  const [auditResult, setAuditResult] = useState<StorageAuditResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<TempCleanupResult | null>(null);
  const [canonicalRepairResult, setCanonicalRepairResult] = useState<CanonicalPostRepairResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"audit" | "preview" | "delete" | "canonical-repair" | null>(null);

  async function runStorageAudit() {
    setActiveAction("audit");

    try {
      setError(null);
      const response = await fetch("/api/dashboard/housekeeping/storage-audit", {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        result?: StorageAuditResult;
      };

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to run storage audit.");
      }

      setAuditResult(data.result);
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Unable to run storage audit.");
    } finally {
      setActiveAction(null);
    }
  }

  async function runTempCleanup(apply: boolean) {
    if (apply && !window.confirm("Delete stale temp assets now?")) {
      return;
    }

    setActiveAction(apply ? "delete" : "preview");

    try {
      setError(null);
      const response = await fetch("/api/dashboard/housekeeping/temp-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days,
          apply,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        result?: TempCleanupResult;
      };

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to run temp cleanup.");
      }

      setCleanupResult(data.result);
    } catch (cleanupError) {
      setError(cleanupError instanceof Error ? cleanupError.message : "Unable to run temp cleanup.");
    } finally {
      setActiveAction(null);
    }
  }

  async function runCanonicalRepair() {
    if (!window.confirm("Run canonical post repair now? This will merge duplicate posts by canonical URL.")) {
      return;
    }

    setActiveAction("canonical-repair");

    try {
      setError(null);
      const response = await fetch("/api/dashboard/housekeeping/canonical-post-repair", {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        result?: CanonicalPostRepairResult;
      };

      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? "Unable to repair canonical posts.");
      }

      setCanonicalRepairResult(data.result);
    } catch (repairError) {
      setError(repairError instanceof Error ? repairError.message : "Unable to repair canonical posts.");
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-3 text-sm text-[var(--dashboard-danger-ink)]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Missing generated assets</h2>
            </div>
            <button
              type="button"
              onClick={runStorageAudit}
              disabled={!databaseReady || Boolean(activeAction)}
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <BusyActionLabel
                busy={activeAction === "audit"}
                label="Run audit"
                busyLabel="Running audit..."
                inverse
              />
            </button>
          </div>
          {auditResult ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Provider" value={auditResult.provider.toUpperCase()} />
                <Metric label="Checked" value={String(auditResult.checkedPins)} />
                <Metric label="Missing" value={String(auditResult.missingCount)} />
              </div>
              <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                {auditResult.missing.length === 0 ? (
                  <p className="text-sm text-[var(--dashboard-subtle)]">No missing generated assets found.</p>
                ) : (
                  <div className="space-y-3">
                    {auditResult.missing.slice(0, 8).map((item) => (
                      <div
                        key={item.pinId}
                        className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-4 py-3"
                      >
                        <p className="font-semibold text-[var(--dashboard-text)]">{item.articleTitle}</p>
                        <p className="mt-1 break-all text-sm text-[var(--dashboard-subtle)]">{item.storageKey}</p>
                      </div>
                    ))}
                    {auditResult.missing.length > 8 ? (
                      <p className="text-sm text-[var(--dashboard-subtle)]">
                        Showing 8 of {auditResult.missing.length}.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Stale temp assets</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => runTempCleanup(false)}
                disabled={Boolean(activeAction)}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                <BusyActionLabel
                  busy={activeAction === "preview"}
                  label="Preview"
                  busyLabel="Previewing..."
                />
              </button>
              <button
                type="button"
                onClick={() => runTempCleanup(true)}
                disabled={Boolean(activeAction)}
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <BusyActionLabel
                  busy={activeAction === "delete"}
                  label="Delete stale"
                  busyLabel="Deleting stale..."
                  inverse
                />
              </button>
            </div>
          </div>
          <div className="mt-4 flex max-w-[180px] flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Age threshold
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(event) => setDays(Number(event.target.value) || 7)}
              className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm"
            />
          </div>
          {cleanupResult ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Provider" value={cleanupResult.provider.toUpperCase()} />
                <Metric label="Days" value={String(cleanupResult.days)} />
                <Metric label="Found" value={String(cleanupResult.staleObjectCount)} />
                <Metric label="Mode" value={cleanupResult.apply ? "Deleted" : "Preview"} />
              </div>
              <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4">
                {cleanupResult.staleKeys.length === 0 ? (
                  <p className="text-sm text-[var(--dashboard-subtle)]">No stale temp assets found.</p>
                ) : (
                  <div className="space-y-2">
                    {cleanupResult.staleKeys.slice(0, 8).map((key) => (
                      <p key={key} className="break-all text-sm text-[var(--dashboard-subtle)]">
                        {key}
                      </p>
                    ))}
                    {cleanupResult.staleKeys.length > 8 ? (
                      <p className="text-sm text-[var(--dashboard-subtle)]">
                        Showing 8 of {cleanupResult.staleKeys.length}.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Merge duplicate posts</h2>
              <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">
                Run after Publer sync when you want to consolidate duplicate article URLs into a single canonical post record.
              </p>
            </div>
            <button
              type="button"
              onClick={runCanonicalRepair}
              disabled={!databaseReady || Boolean(activeAction)}
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <BusyActionLabel
                busy={activeAction === "canonical-repair"}
                label="Run repair"
                busyLabel="Repairing..."
                inverse
              />
            </button>
          </div>
          {canonicalRepairResult ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Metric label="Scanned" value={String(canonicalRepairResult.scannedPosts)} />
                <Metric label="Groups touched" value={String(canonicalRepairResult.canonicalGroupsTouched)} />
                <Metric label="Posts fixed" value={String(canonicalRepairResult.canonicalizedPosts)} />
                <Metric label="Duplicates deleted" value={String(canonicalRepairResult.deletedDuplicatePosts)} />
                <Metric label="Jobs updated" value={String(canonicalRepairResult.updatedGenerationJobs)} />
                <Metric label="Publer records updated" value={String(canonicalRepairResult.updatedPublicationRecords)} />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-base font-bold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}
