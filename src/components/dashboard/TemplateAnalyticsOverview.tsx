import Link from "next/link";
import type { TemplateAnalyticsSnapshot } from "@/lib/template-analytics/db";

export function TemplateAnalyticsOverview({
  analytics,
}: {
  analytics: TemplateAnalyticsSnapshot;
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4 shadow-[var(--dashboard-shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[var(--dashboard-panel-alt)] px-4 py-3">
        <div>
          <h2 className="text-xl font-bold">Template insights</h2>
          <p className="mt-1 text-sm text-[var(--dashboard-subtle)]">
            Deterministic usage and freshness signals from plans, pins, publications, and post pulse.
          </p>
        </div>
        <Link
          href="/dashboard/library"
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
        >
          Open library
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <SummaryChip label="Tracked templates" value={analytics.summary.trackedTemplates} />
        <SummaryChip label="Versions" value={analytics.summary.trackedVersions} />
        <SummaryChip label="Plans" value={analytics.summary.totalPlans} />
        <SummaryChip label="Pins" value={analytics.summary.totalPins} />
        <SummaryChip label="Published pins" value={analytics.summary.totalPublishedPins} />
        <SummaryChip label="Needs fresh" value={analytics.summary.needsFreshPosts} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <InsightCard title="Recommendations">
          {analytics.recommendations.length === 0 ? (
            <EmptyLabel label="No immediate recommendation. Current usage mix looks balanced." />
          ) : (
            <div className="space-y-3">
              {analytics.recommendations.map((hint) => (
                <Link
                  key={hint.id}
                  href={hint.href}
                  className={`block rounded-[18px] border px-3 py-3 text-sm ${
                    hint.tone === "warning"
                      ? "border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning-ink)]"
                      : hint.tone === "accent"
                        ? "border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-text)]"
                        : "border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] text-[var(--dashboard-text)]"
                  }`}
                >
                  <p className="font-semibold">{hint.title}</p>
                  <p className="mt-1 text-[13px] leading-6 opacity-85">{hint.detail}</p>
                </Link>
              ))}
            </div>
          )}
        </InsightCard>

        <InsightCard title="Fragile templates">
          {analytics.fragileTemplates.length === 0 ? (
            <EmptyLabel label="No fragile templates detected from current version and publish signals." />
          ) : (
            <div className="space-y-3">
              {analytics.fragileTemplates.map((entry) => (
                <Link
                  key={entry.templateId}
                  href={entry.href}
                  className="block rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-sm text-[var(--dashboard-text)]"
                >
                  <p className="font-semibold">{entry.name}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--dashboard-subtle)]">
                    {entry.reason}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </InsightCard>

        <InsightCard title="Overused templates">
          {analytics.overusedTemplates.length === 0 ? (
            <EmptyLabel label="No template is dominating published output right now." />
          ) : (
            <div className="space-y-3">
              {analytics.overusedTemplates.map((entry) => (
                <Link
                  key={entry.templateId}
                  href={entry.href}
                  className="block rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-sm text-[var(--dashboard-text)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.name}</p>
                    <span className="rounded-full bg-[var(--dashboard-panel-alt)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                      {entry.sharePercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--dashboard-subtle)]">
                    {entry.publishedCount} published pin(s), {entry.generatedPinCount} generated pin(s)
                  </p>
                </Link>
              ))}
            </div>
          )}
        </InsightCard>

        <InsightCard title="Top performers by context">
          {analytics.topContexts.length === 0 ? (
            <EmptyLabel label="Need published pins before context leaders can be ranked." />
          ) : (
            <div className="space-y-3">
              {analytics.topContexts.map((entry) => (
                <Link
                  key={entry.domain}
                  href={entry.href}
                  className="block rounded-[18px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-sm text-[var(--dashboard-text)]"
                >
                  <p className="font-semibold">{entry.domain}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--dashboard-subtle)]">
                    {entry.topTemplateName} leads with {entry.topTemplatePublishedPins} published pin(s) out of {entry.totalPublishedPins} total.
                  </p>
                </Link>
              ))}
            </div>
          )}
        </InsightCard>
      </div>
    </section>
  );
}

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel-strong)] p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text)]">
      {label}: {value}
    </span>
  );
}

function EmptyLabel({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-3 text-sm text-[var(--dashboard-subtle)]">
      {label}
    </div>
  );
}
