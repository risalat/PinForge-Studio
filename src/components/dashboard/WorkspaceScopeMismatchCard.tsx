import Link from "next/link";

export function WorkspaceScopeMismatchCard({
  domain,
  workspaceName,
}: {
  domain: string;
  workspaceName: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-soft)] p-6 text-[var(--dashboard-warning-ink)] shadow-[var(--dashboard-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">Scope mismatch</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--dashboard-text)]">
        This job is outside the active workspace scope.
      </h2>
      <p className="mt-3 text-sm leading-6">
        {domain} is not included in {workspaceName || "the selected workspace profile"}.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/dashboard/jobs"
          className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Back to jobs
        </Link>
        <Link
          href="/dashboard/integrations"
          className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2 text-sm font-semibold text-[var(--dashboard-subtle)]"
        >
          Manage profiles
        </Link>
      </div>
    </div>
  );
}
