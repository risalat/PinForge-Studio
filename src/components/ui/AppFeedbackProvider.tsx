"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AppNotificationTone = "success" | "error" | "info" | "progress";

export type AppNotification = {
  id: string;
  title: string;
  message?: string;
  tone: AppNotificationTone;
  createdAt: number;
  updatedAt: number;
  read: boolean;
  sticky: boolean;
  readAt?: number;
};

type AppFeedbackInput = {
  title: string;
  message?: string;
  tone?: AppNotificationTone;
  autoDismissMs?: number;
  sticky?: boolean;
};

type AppFeedbackContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  notify: (input: AppFeedbackInput) => string;
  updateNotification: (id: string, input: Partial<AppFeedbackInput>) => void;
  dismissNotification: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

const MAX_NOTIFICATIONS = 8;
const MAX_TOASTS = 3;
const DUPLICATE_WINDOW_MS = 1800;
const READ_RETENTION_MS = 90_000;
const ABSOLUTE_RETENTION_MS = 10 * 60_000;

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notificationsRef = useRef<AppNotification[]>([]);

  function commitNotifications(next: AppNotification[] | ((current: AppNotification[]) => AppNotification[])) {
    setNotifications((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const pruned = pruneNotifications(resolved);
      notificationsRef.current = pruned;
      return pruned;
    });
  }

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;
    return () => {
      for (const timeout of timeoutMap.values()) {
        clearTimeout(timeout);
      }
      timeoutMap.clear();
    };
  }, []);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      commitNotifications((current) => current);
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  function scheduleDismiss(id: string, autoDismissMs: number | undefined, sticky: boolean) {
    const existing = timeoutMapRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timeoutMapRef.current.delete(id);
    }

    if (sticky || !autoDismissMs || autoDismissMs <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      commitNotifications((current) => current.filter((item) => item.id !== id));
      timeoutMapRef.current.delete(id);
    }, autoDismissMs);
    timeoutMapRef.current.set(id, timeout);
  }

  function notify(input: AppFeedbackInput) {
    const now = Date.now();
    const duplicate = notificationsRef.current.find(
      (item) =>
        item.title === input.title &&
        item.message === input.message &&
        item.tone === (input.tone ?? "info") &&
        now - item.updatedAt < DUPLICATE_WINDOW_MS,
    );

    if (duplicate) {
      const sticky = input.sticky ?? duplicate.sticky;
      commitNotifications((current) =>
        current.map((item) =>
          item.id === duplicate.id
            ? {
                ...item,
                updatedAt: now,
                read: false,
                readAt: undefined,
                sticky,
              }
            : item,
        ),
      );
      scheduleDismiss(duplicate.id, input.autoDismissMs ?? 4200, sticky);
      return duplicate.id;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const sticky = input.sticky ?? input.tone === "progress";
    const next: AppNotification = {
      id,
      title: input.title,
      message: input.message,
      tone: input.tone ?? "info",
      createdAt: now,
      updatedAt: now,
      read: false,
      sticky,
    };

    commitNotifications((current) => [next, ...current]);
    scheduleDismiss(id, input.autoDismissMs ?? 4200, sticky);
    return id;
  }

  function updateNotification(id: string, input: Partial<AppFeedbackInput>) {
    const now = Date.now();
    const target = notificationsRef.current.find((item) => item.id === id);
    commitNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: input.title ?? item.title,
              message: input.message ?? item.message,
              tone: input.tone ?? item.tone,
              sticky: input.sticky ?? item.sticky,
              updatedAt: now,
              read: false,
              readAt: undefined,
            }
          : item,
      ),
    );

    scheduleDismiss(id, input.autoDismissMs ?? 5200, input.sticky ?? target?.sticky ?? false);
  }

  function dismissNotification(id: string) {
    const timeout = timeoutMapRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(id);
    }

    commitNotifications((current) => current.filter((item) => item.id !== id));
  }

  function markAllRead() {
    const now = Date.now();
    commitNotifications((current) =>
      current.map((item) =>
        item.read
          ? item
          : {
              ...item,
              read: true,
              readAt: now,
            },
      ),
    );
  }

  function clearNotifications() {
    for (const timeout of timeoutMapRef.current.values()) {
      clearTimeout(timeout);
    }
    timeoutMapRef.current.clear();
    commitNotifications([]);
  }

  const value: AppFeedbackContextValue = {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    notify,
    updateNotification,
    dismissNotification,
    markAllRead,
    clearNotifications,
  };

  return (
    <AppFeedbackContext.Provider value={value}>
      {children}
      <ToastViewport notifications={notifications} onDismiss={dismissNotification} />
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error("useAppFeedback must be used within AppFeedbackProvider.");
  }

  return context;
}

function ToastViewport({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[90] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {notifications.slice(0, MAX_TOASTS).map((notification) => (
        <article
          key={notification.id}
          className={`pointer-events-auto overflow-hidden rounded-[28px] border p-5 shadow-[0_30px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl app-toast-enter ${
            notification.tone === "success"
              ? "border-[var(--dashboard-success-border)] bg-[linear-gradient(135deg,#ffffff_0%,#eef9f4_100%)] text-[var(--dashboard-success-ink)]"
              : notification.tone === "error"
                ? "border-[var(--dashboard-danger-border)] bg-[linear-gradient(135deg,#ffffff_0%,#fff1ec_100%)] text-[var(--dashboard-danger-ink)]"
                : notification.tone === "progress"
                  ? "border-[var(--dashboard-accent-border)] bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_100%)] text-[var(--dashboard-accent-strong)]"
                  : "border-[var(--dashboard-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f5f7ff_100%)] text-[var(--dashboard-text)]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`mt-1 h-3.5 w-3.5 flex-none rounded-full ${
                notification.tone === "success"
                  ? "bg-[var(--dashboard-success)]"
                  : notification.tone === "error"
                    ? "bg-[var(--dashboard-danger)]"
                    : notification.tone === "progress"
                      ? "bg-[var(--dashboard-accent)] shadow-[0_0_0_8px_var(--dashboard-accent-soft)]"
                      : "bg-[var(--dashboard-warning)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-black tracking-[-0.02em]">{notification.title}</p>
              {notification.message ? (
                <p className="mt-2 text-sm leading-6 opacity-90">{notification.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="rounded-full border border-current/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] opacity-75 transition hover:opacity-100"
            >
              Close
            </button>
          </div>
          <div
            className={`mt-4 h-1.5 overflow-hidden rounded-full ${
              notification.tone === "success"
                ? "bg-[var(--dashboard-success-soft)]"
                : notification.tone === "error"
                  ? "bg-[var(--dashboard-danger-soft)]"
                  : notification.tone === "progress"
                    ? "bg-[var(--dashboard-accent-soft)]"
                    : "bg-[var(--dashboard-panel-alt)]"
            }`}
          >
            <div
              className={`h-full rounded-full ${
                notification.tone === "success"
                  ? "bg-[var(--dashboard-success)]"
                  : notification.tone === "error"
                    ? "bg-[var(--dashboard-danger)]"
                    : notification.tone === "progress"
                      ? "bg-[linear-gradient(90deg,#0d5fff_0%,#46d3ff_100%)] app-toast-progress"
                      : "bg-[var(--dashboard-warning)]"
              }`}
              style={{ width: notification.tone === "progress" ? "42%" : "100%" }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function pruneNotifications(items: AppNotification[]) {
  const now = Date.now();

  return items
    .filter((item) => {
      if (now - item.updatedAt > ABSOLUTE_RETENTION_MS) {
        return false;
      }

      if (item.read && item.readAt && now - item.readAt > READ_RETENTION_MS) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_NOTIFICATIONS);
}
