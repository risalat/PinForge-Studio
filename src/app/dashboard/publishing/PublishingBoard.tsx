"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PublishingJob = {
  id: string;
  title: string;
  domain: string;
  createdAt: string;
  lane: "ready" | "scheduled" | "failed";
  status: string;
  href: string;
  generatedPins: number;
};

type PublishingBoardProps = {
  jobs: PublishingJob[];
};

type LaneFilter = "all" | "ready" | "scheduled" | "failed";
type SortKey = "newest" | "oldest" | "title";

export function PublishingBoard({ jobs }: PublishingBoardProps) {
  const [laneFilter, setLaneFilter] = useState<LaneFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = jobs.filter((job) => {
      const matchesLane = laneFilter === "all" ? true : job.lane === laneFilter;
      const matchesQuery =
        normalizedQuery === "" ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.domain.toLowerCase().includes(normalizedQuery) ||
        job.status.toLowerCase().includes(normalizedQuery);

      return matchesLane && matchesQuery;
    });

    next.sort((left, right) => {
      if (sortKey === "title") {
        return left.title.localeCompare(right.title);
      }

      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return sortKey === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });

    return next;
  }, [jobs, laneFilter, query, sortKey]);

  const lanes = useMemo(
    () => ({
      ready: filteredJobs.filter((job) => job.lane === "ready"),
      scheduled: filteredJobs.filter((job) => job.lane === "scheduled"),
      failed: filteredJobs.filter((job) => job.lane === "failed"),
    }),
    [filteredJobs],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={laneFilter === "all"}
              label={`All ${jobs.length}`}
              onClick={() => setLaneFilter("all")}
            />
            <FilterChip
              active={laneFilter === "ready"}
              label={`Ready ${jobs.filter((job) => job.lane === "ready").length}`}
              onClick={() => setLaneFilter("ready")}
            />
            <FilterChip
              active={laneFilter === "scheduled"}
              label={`Scheduled ${jobs.filter((job) => job.lane === "scheduled").length}`}
              onClick={() => setLaneFilter("scheduled")}
            />
            <FilterChip
              active={laneFilter === "failed"}
              label={`Failed ${jobs.filter((job) => job.lane === "failed").length}`}
              onClick={() => setLaneFilter("failed")}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, domain, or status"
              className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm text-[var(--dashboard-text)]"
            />
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2 text-sm text-[var(--dashboard-text)]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <PublishingLane title="Ready" items={lanes.ready} emptyLabel="No ready jobs" />
        <PublishingLane title="Scheduled" items={lanes.scheduled} emptyLabel="No scheduled jobs" />
        <PublishingLane title="Failed" items={lanes.failed} emptyLabel="No failed jobs" tone="danger" />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
        active
          ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </button>
  );
}

function PublishingLane({
  title,
  items,
  emptyLabel,
  tone = "neutral",
}: {
  title: string;
  items: PublishingJob[];
  emptyLabel: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
          {items.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[var(--dashboard-panel-alt)] p-4 text-sm text-[var(--dashboard-subtle)]">
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--dashboard-text)]">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-[var(--dashboard-subtle)]">{item.domain}</p>
                </div>
                <StatusBadge label={formatLabel(item.status)} tone={tone} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--dashboard-muted)]">
                <span>{item.generatedPins} pins</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <Link
                href={item.href}
                className="mt-4 inline-flex rounded-full bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Open
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "danger" }) {
  return (
    <span
      className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        tone === "danger"
          ? "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger-ink)]"
          : "bg-[var(--dashboard-panel-alt)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
