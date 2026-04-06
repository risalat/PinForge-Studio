"use client";

import { BusyActionLabel } from "@/components/ui/BusyActionLabel";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type JobStatusFilter = "all" | "in_review" | "generated" | "scheduled" | "failed" | "completed";
type JobSort = "newest" | "oldest" | "title" | "pins_desc";

export function DashboardJobsTableControls({
  initialQuery,
  initialStatus,
  initialSort,
  totalCount,
  filteredCount,
}: {
  initialQuery: string;
  initialStatus: JobStatusFilter;
  initialSort: JobSort;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <DashboardJobsTableControlsInner
      key={`${initialQuery}|${initialStatus}|${initialSort}`}
      initialQuery={initialQuery}
      initialStatus={initialStatus}
      initialSort={initialSort}
      totalCount={totalCount}
      filteredCount={filteredCount}
    />
  );
}

function DashboardJobsTableControlsInner({
  initialQuery,
  initialStatus,
  initialSort,
  totalCount,
  filteredCount,
}: {
  initialQuery: string;
  initialStatus: JobStatusFilter;
  initialSort: JobSort;
  totalCount: number;
  filteredCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<JobStatusFilter>(initialStatus);
  const [sort, setSort] = useState<JobSort>(initialSort);

  function updateQuery(next: { query?: string; status?: JobStatusFilter; sort?: JobSort }) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQuery = (next.query ?? query).trim();
      const nextStatus = next.status ?? status;
      const nextSort = next.sort ?? sort;

      if (nextQuery) {
        params.set("query", nextQuery);
      } else {
        params.delete("query");
      }

      if (nextStatus !== "all") {
        params.set("status", nextStatus);
      } else {
        params.delete("status");
      }

      if (nextSort !== "newest") {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-[var(--dashboard-line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]">
          {filteredCount} / {totalCount} jobs
        </span>
        {isNavigating ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
            <BusyActionLabel busy label="Jobs ready" busyLabel="Updating jobs..." />
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(280px,1fr)_180px_180px_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              updateQuery({ query });
            }
          }}
          placeholder="Search post, URL, or domain"
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none"
        />
        <select
          value={status}
          onChange={(event) => {
            const next = event.target.value as JobStatusFilter;
            setStatus(next);
            updateQuery({ status: next });
          }}
          disabled={isNavigating}
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
        >
          <option value="all">All statuses</option>
          <option value="in_review">In review</option>
          <option value="generated">Pins generated</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={sort}
          onChange={(event) => {
            const next = event.target.value as JobSort;
            setSort(next);
            updateQuery({ sort: next });
          }}
          disabled={isNavigating}
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
          <option value="pins_desc">Most pins</option>
        </select>
        <button
          type="button"
          onClick={() => updateQuery({ query })}
          disabled={isNavigating}
          className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setStatus("all");
            setSort("newest");
            updateQuery({ query: "", status: "all", sort: "newest" });
          }}
          disabled={isNavigating}
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)] disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
