import Link from "next/link";
import { ApiKeysManager } from "@/app/dashboard/api-keys/ApiKeysManager";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
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
    <main className="min-h-screen bg-[#f5efe6] px-6 py-8 text-[#23160d] sm:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a572a]">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em]">
              API key management
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6e4a2b]">
              Generate bearer keys for the Chrome extension. Plaintext keys are shown once only and
              stored hashed in the database.
            </p>
            <p className="mt-3 text-sm text-[#6e4a2b]">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <SignOutButton />
            <Link
              href="/dashboard"
              className="rounded-full border border-[#d8b690] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#8a572a]"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {!databaseReady ? (
          <div className="rounded-[28px] border border-[#e2d1bc] bg-[#fff8ef] p-6 text-[#6e4a2b]">
            `DATABASE_URL` is not configured yet. API key creation will work after the database is
            connected and migrated.
          </div>
        ) : null}

        <ApiKeysManager initialApiKeys={apiKeys} />
      </div>
    </main>
  );
}
