"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PostPulseSyncButton } from "@/app/dashboard/post-pulse/PostPulseSyncButton";
import type { PostPulseFilter, PostPulseSort } from "@/lib/dashboard/postPulse";

export function PostPulseWorkspaceControls({
  workspaceId,
  initialFilter,
  initialSort,
}: {
  workspaceId: string;
  initialFilter: PostPulseFilter;
  initialSort: PostPulseSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [filter, setFilter] = useState<PostPulseFilter>(initialFilter);
  const [sort, setSort] = useState<PostPulseSort>(initialSort);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    setSort(initialSort);
  }, [initialSort]);

  function updateQuery(input: {
    filter?: PostPulseFilter;
    sort?: PostPulseSort;
  }) {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const nextFilter = input.filter ?? filter;
      const nextSort = input.sort ?? sort;

      nextParams.delete("workspaceId");
      if (nextFilter && nextFilter !== "all") {
        nextParams.set("filter", nextFilter);
      } else {
        nextParams.delete("filter");
      }
      if (nextSort && nextSort !== "priority") {
        nextParams.set("sort", nextSort);
      } else {
        nextParams.delete("sort");
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function handleFilterChange(nextFilter: PostPulseFilter) {
    setFilter(nextFilter);
    updateQuery({ filter: nextFilter });
  }

  function handleSortChange(nextSort: PostPulseSort) {
    setSort(nextSort);
    updateQuery({ sort: nextSort });
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <select
          value={filter}
          onChange={(event) => handleFilterChange(event.target.value as PostPulseFilter)}
          disabled={isNavigating}
          className="min-w-[190px] rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
        >
          <option value="all">All posts</option>
          <option value="needs_fresh_pins">Needs fresh pins</option>
          <option value="scheduled_in_flight">In progress</option>
          <option value="fresh">Fresh</option>
          <option value="never_published">Never published</option>
          <option value="no_pins_yet">No pins yet</option>
        </select>
        <select
          value={sort}
          onChange={(event) => handleSortChange(event.target.value as PostPulseSort)}
          disabled={isNavigating}
          className="min-w-[220px] rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)] outline-none disabled:opacity-60"
        >
          <option value="priority">Priority order</option>
          <option value="oldest_published">Oldest published first</option>
          <option value="newest_published">Newest published first</option>
        </select>
        <PostPulseSyncButton workspaceId={workspaceId} />
      </div>
    </div>
  );
}
