import Link from "next/link";
import { ApiKeysManager } from "@/app/dashboard/api-keys/ApiKeysManager";
import { listApiKeys } from "@/lib/auth/apiKeys";
import { requireAuthenticatedDashboardUser } from "@/lib/auth/dashboardSession";
import { isDatabaseConfigured } from "@/lib/env";
import type { ApiKeyListItem } from "@/lib/types";

export default async function DashboardApiKeysPage() {
  const user = await requireAuthenticatedDashboardUser();
  let databaseReady = isDatabaseConfigured();
  let apiKeys: ApiKeyListItem[] = [];

  if (databaseReady) {
    try {
      apiKeys = await listApiKeys();
    } catch {
      databaseReady = false;
    }
  }

  return (
    <div className="space-y-8 text-[var(--dashboard-text)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="max-w-2xl text-base leading-7 text-[var(--dashboard-subtle)]">
              Generate bearer keys for the Chrome extension. Plaintext keys are shown once only and
              stored hashed in the database.
            </p>
            <p className="mt-3 text-sm text-[var(--dashboard-subtle)]">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/inbox"
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-5 py-3 text-sm font-semibold text-[var(--dashboard-subtle)]"
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
