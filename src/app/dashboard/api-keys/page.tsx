import Link from "next/link";
import { ApiKeysManager } from "@/app/dashboard/api-keys/ApiKeysManager";
import { listApiKeys } from "@/lib/auth/apiKeys";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { getDashboardEffectiveUserContext } from "@/lib/team/effectiveUserContext";
import { isDatabaseConfigured } from "@/lib/env";
import type { ApiKeyListItem } from "@/lib/types";

export default async function DashboardApiKeysPage() {
  await requireAuthenticatedDashboardUser();
  let databaseReady = isDatabaseConfigured();
  let apiKeys: ApiKeyListItem[] = [];
  let isOperatingAsTeammate = false;

  if (databaseReady) {
    try {
      apiKeys = await listApiKeys();
      const user = await getOrCreateDashboardUser();
      const ctx = await getDashboardEffectiveUserContext(user.id);
      isOperatingAsTeammate = ctx.isOperatingAsTeammate;
    } catch {
      databaseReady = false;
    }
  }

  return (
    <div className="space-y-5 text-[var(--dashboard-text)]">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--dashboard-accent-border)] bg-[var(--dashboard-accent-soft-strong)] px-4 py-3">
          <div>
            <p className="max-w-2xl text-sm leading-6 text-[var(--dashboard-subtle)]">
              Generate bearer keys for the Chrome extension. Plaintext keys are shown once only and
              stored hashed in the database.
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--dashboard-muted)]">
              Extension API keys are personal to your signed-in account. Team &ldquo;Operate as&rdquo; mode does not apply here.
              Teammates must sign in to create their own extension key.
            </p>
            {isOperatingAsTeammate && (
              <p className="mt-2 text-xs font-semibold text-[var(--dashboard-accent)]">
                You are currently operating as a teammate elsewhere, but this page always shows your own Extension API Keys.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/inbox"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2.5 text-sm font-semibold text-[var(--dashboard-subtle)]"
            >
              Back to intake
            </Link>
          </div>
        </div>

        {!databaseReady ? (
          <div className="rounded-[28px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] p-6 text-[var(--dashboard-subtle)] shadow-[var(--dashboard-shadow-sm)]">
            `DATABASE_URL` is not configured yet. API key creation will work after the database is
            connected and migrated.
          </div>
        ) : null}

        <ApiKeysManager initialApiKeys={apiKeys} />
    </div>
  );
}
