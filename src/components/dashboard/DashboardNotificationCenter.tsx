"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppFeedback } from "@/components/ui/AppFeedbackProvider";
import type { DashboardCalendarNotification } from "@/lib/dashboard/pinterestCalendar";

export function DashboardNotificationCenter({
  calendarNotifications,
}: {
  calendarNotifications: DashboardCalendarNotification[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearNotifications } = useAppFeedback();
  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);
  const visibleCalendarNotifications = useMemo(
    () => calendarNotifications.slice(0, 10),
    [calendarNotifications],
  );
  const totalUnread = unreadCount + visibleCalendarNotifications.length;

  function toggleOpen() {
    setIsOpen((current) => {
      const next = !current;
      if (next) {
        markAllRead();
      }
      return next;
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-text)]"
      >
        Notifications
        {totalUnread > 0 ? (
          <span className="ml-3 inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--dashboard-accent)] px-2 py-0.5 text-[11px] font-black text-white">
            {totalUnread}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[min(460px,calc(100vw-2.5rem))] overflow-hidden rounded-[28px] border border-[var(--dashboard-line)] bg-[color:var(--dashboard-panel-strong)]/96 shadow-[var(--dashboard-shadow-md)] backdrop-blur-xl app-notification-panel-enter">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-line)] px-5 py-4">
            <div>
              <p className="text-sm font-black tracking-[-0.02em] text-[var(--dashboard-text)]">Notification center</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                Calendar and recent events
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearNotifications}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
              >
                Clear recent
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-subtle)]"
              >
                Close
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] space-y-3 overflow-auto p-4">
            {visibleCalendarNotifications.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                    Pinterest calendar
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    {visibleCalendarNotifications.length} active
                  </span>
                </div>
                {visibleCalendarNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-4 ${toneClassName(notification.tone)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[var(--dashboard-text)]">{notification.title}</p>
                          <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                            {notification.stageLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">{notification.message}</p>
                        <div className="mt-3">
                          <Link
                            href={notification.href}
                            className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]"
                          >
                            {notification.ctaLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
                  Recent system events
                </p>
                {visibleNotifications.length > 0 ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                    {visibleNotifications.length} recent
                  </span>
                ) : null}
              </div>
              {visibleNotifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-6 text-sm text-[var(--dashboard-subtle)]">
                  No recent system notifications.
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`rounded-2xl border px-4 py-4 ${toneClassName(notification.tone)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--dashboard-text)]">{notification.title}</p>
                        {notification.message ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--dashboard-subtle)]">{notification.message}</p>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                        {formatElapsed(notification.createdAt)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toneClassName(tone: "success" | "error" | "info" | "progress") {
  if (tone === "success") {
    return "border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)]";
  }
  if (tone === "error") {
    return "border-[var(--dashboard-danger-border)] bg-[var(--dashboard-danger-soft)]";
  }
  if (tone === "progress") {
    return "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)]";
  }

  return "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)]";
}

function formatElapsed(createdAt: number) {
  const elapsedMs = Date.now() - createdAt;
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));

  if (elapsedMinutes < 1) {
    return "now";
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  return `${Math.round(elapsedMinutes / 60)}h`;
}
