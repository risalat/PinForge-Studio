import { BackgroundTaskKind } from "@prisma/client";

export function AdminSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 shadow-[var(--dashboard-shadow-sm)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--dashboard-muted)]">{title}</p>
        <p className="mt-3 max-w-3xl text-sm text-[var(--dashboard-subtle)]">{subtitle}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[26px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{note}</p>
    </div>
  );
}

export function MiniStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

export function RuntimeColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{
    instanceId: string;
    displayName: string;
    lastSeenAt: Date;
    ageMs: number;
    health: string;
  }>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--dashboard-subtle)]">{items.length} heartbeat entries</p>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState label={`No ${title.toLowerCase()} heartbeat recorded yet.`} />
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.instanceId}`}
              className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--dashboard-text)]">{item.displayName}</p>
                  <p className="mt-1 text-xs text-[var(--dashboard-muted)]">{truncateMiddle(item.instanceId, 28)}</p>
                </div>
                <StatusPill tone={item.health === "healthy" ? "success" : item.health === "stale" ? "info" : "danger"}>
                  {item.health}
                </StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <InlineMetric label="Last seen" value={formatDateTime(item.lastSeenAt)} />
                <InlineMetric label="Age" value={formatRelativeMs(item.ageMs)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text)]">{value}</p>
    </div>
  );
}

export function CounterPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 ${
        tone === "danger"
          ? "bg-[#fef3f2] text-[#b42318]"
          : "border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]"
      }`}
    >
      {label} {value}
    </span>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "border-[#b7ebd1] bg-[#eefbf3] text-[#19764c]"
      : tone === "danger"
        ? "border-[#f1b7b4] bg-[#fef3f2] text-[#b42318]"
        : tone === "info"
          ? "border-[#c7d7ff] bg-[#eef3ff] text-[#2447b2]"
          : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-subtle)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-6 text-sm text-[var(--dashboard-muted)]">
      {label}
    </div>
  );
}

export function taskKindLabel(kind: BackgroundTaskKind) {
  return kind.toLowerCase().replace(/_/g, " ");
}

export function operationLabel(operationName: string) {
  return operationName
    .replace(/^workflow\./, "")
    .replace(/^dashboard\./, "")
    .replace(/^query\./, "")
    .replace(/[._]+/g, " ");
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatMaybeDateTime(value: Date | null) {
  return value ? formatDateTime(value) : "-";
}

export function formatDuration(value: number) {
  if (value < 1000) {
    return `${value}ms`;
  }
  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)}s`;
  }
  return `${(value / 60_000).toFixed(1)}m`;
}

export function formatRelativeMs(value: number) {
  if (value < 60_000) {
    return `${Math.round(value / 1000)}s ago`;
  }
  if (value < 60 * 60_000) {
    return `${Math.round(value / 60_000)}m ago`;
  }
  return `${Math.round(value / (60 * 60_000))}h ago`;
}

export function truncateMiddle(value: string, maxLength = 16) {
  if (value.length <= maxLength) {
    return value;
  }

  const visible = Math.max(4, Math.floor((maxLength - 1) / 2));
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}
