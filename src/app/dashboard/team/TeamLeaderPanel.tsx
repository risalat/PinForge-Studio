"use client";

import { usePathname } from "next/navigation";
import { setDashboardEffectiveUserAction } from "@/app/dashboard/team/actions";

export function TeamLeaderPanel({
  currentUserId,
  members,
}: {
  currentUserId: string;
  members: { id: string; email: string }[];
}) {
  const pathname = usePathname();

  async function handleOperateAs(userId: string) {
    const formData = new FormData();
    formData.set("effectiveUserId", userId);
    formData.set("returnPath", pathname);

    await setDashboardEffectiveUserAction(formData);
  }

  return (
    <section className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5 shadow-[var(--dashboard-shadow-sm)]">
      <h3 className="text-base font-bold">Operate as</h3>
      <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
        Switch to a teammate&apos;s workspace to view their stats, jobs, and publishing queue.
      </p>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => handleOperateAs("")}
          className="flex w-full items-center justify-between rounded-[16px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-left text-sm font-semibold hover:bg-[var(--dashboard-panel-alt)]"
        >
          My workspace
        </button>

        {members
          .filter((m) => m.id !== currentUserId)
          .map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleOperateAs(member.id)}
              className="flex w-full items-center justify-between rounded-[16px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-3 text-left text-sm hover:bg-[var(--dashboard-panel-alt)]"
            >
              <span className="font-semibold">{member.email}</span>
              <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-muted)]">
                Operate
              </span>
            </button>
          ))}
      </div>
    </section>
  );
}
