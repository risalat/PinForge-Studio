"use client";

import { useState, useTransition } from "react";

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

export function HousekeepingManager({ databaseReady }: { databaseReady: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [days, setDays] = useState(7);
  const [auditResult, setAuditResult] = useState<StorageAuditResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<TempCleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runStorageAudit() {
    startTransition(async () => {
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
      }
    });
  }

  function runTempCleanup(apply: boolean) {
    if (apply && !window.confirm("Delete stale temp assets now?")) {
      return;
    }

    startTransition(async () => {
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
      }
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)] px-4 py-3 text-sm text-[var(--dashboard-danger-ink)]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Storage audit
              </p>
              <h2 className="mt-2 text-xl font-bold">Missing generated assets</h2>
            </div>
            <button
              type="button"
              onClick={runStorageAudit}
              disabled={!databaseReady || isPending}
              className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Running..." : "Run audit"}
            </button>
          </div>
          {auditResult ? (
            <div className="mt-5 space-y-4">
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

        <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Temp cleanup
              </p>
              <h2 className="mt-2 text-xl font-bold">Stale temp assets</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => runTempCleanup(false)}
                disabled={isPending}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => runTempCleanup(true)}
                disabled={isPending}
                className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Delete stale
              </button>
            </div>
          </div>
          <div className="mt-5 flex max-w-[180px] flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
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
            <div className="mt-5 space-y-4">
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
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}
