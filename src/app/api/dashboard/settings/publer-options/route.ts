import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedDashboardApiUser } from "@/lib/auth/dashboardSession";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { isDatabaseConfigured } from "@/lib/env";
import { PublerClient } from "@/lib/publer/publerClient";
import {
  getCachedPublerAccounts,
  getCachedPublerBoards,
  getCachedPublerWorkspaces,
} from "@/lib/publer/metadataCache";
import { getIntegrationSettings } from "@/lib/settings/integrationSettings";

const schema = z.object({
  apiKey: z.string().trim().optional(),
  workspaceId: z.string().trim().optional(),
  accountId: z.union([z.string(), z.number()]).optional(),
  refresh: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedDashboardApiUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const rawPayload = await request.json();
    const payload = schema.parse(rawPayload);
    const savedSettings = isDatabaseConfigured() ? await getIntegrationSettings() : null;
    const user = isDatabaseConfigured() ? await getOrCreateDashboardUser() : null;
    const apiKey = payload.apiKey?.trim() || savedSettings?.publerApiKey || "";

    if (!apiKey) {
      throw new Error("Enter a Publer API key or save one in dashboard settings first.");
    }

    const baseClient = new PublerClient({
      apiKey,
      workspaceId: "",
    });

    const workspaces =
      user && isDatabaseConfigured()
        ? await getCachedPublerWorkspaces({
            userId: user.id,
            forceRefresh: payload.refresh,
            loader: () => baseClient.getWorkspaces(),
          })
        : await baseClient.getWorkspaces();
    const accessibleWorkspaceIds = new Set(workspaces.map((workspace) => workspace.id));
    const requestedWorkspaceId =
      payload.workspaceId?.trim() || savedSettings?.publerWorkspaceId || "";

    const selectedWorkspaceId =
      (requestedWorkspaceId && accessibleWorkspaceIds.has(requestedWorkspaceId)
        ? requestedWorkspaceId
        : workspaces[0]?.id) || "";
    const workspaceClient = selectedWorkspaceId
      ? new PublerClient({
          apiKey,
          workspaceId: selectedWorkspaceId,
        })
      : null;
    const selectedWorkspaceLabel =
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId)?.name ?? "";
    const accounts =
      workspaceClient && user && isDatabaseConfigured()
        ? await getCachedPublerAccounts({
            userId: user.id,
            workspaceId: selectedWorkspaceId,
            workspaceLabel: selectedWorkspaceLabel,
            forceRefresh: payload.refresh,
            loader: () => workspaceClient.getPinterestAccounts(),
          })
        : workspaceClient
          ? await workspaceClient.getPinterestAccounts()
          : [];
    const accessibleAccountIds = new Set(accounts.map((account) => String(account.id)));
    const requestedAccountId =
      String(payload.accountId ?? "").trim() || savedSettings?.publerAccountId || "";
    const selectedAccountId =
      (requestedAccountId && accessibleAccountIds.has(requestedAccountId)
        ? requestedAccountId
        : accounts[0]
          ? String(accounts[0].id)
          : "");

    let boards: Awaited<ReturnType<PublerClient["getPinterestBoards"]>> = [];

    if (workspaceClient && selectedAccountId) {
      const selectedAccountLabel =
        accounts.find((account) => String(account.id) === selectedAccountId)?.name ?? "";
      boards =
        user && isDatabaseConfigured()
          ? await getCachedPublerBoards({
              userId: user.id,
              workspaceId: selectedWorkspaceId,
              accountId: selectedAccountId,
              accountLabel: selectedAccountLabel,
              forceRefresh: payload.refresh,
              loader: () => workspaceClient.getPinterestBoards(selectedAccountId),
            })
          : await workspaceClient.getPinterestBoards(selectedAccountId);
    }

    return NextResponse.json({
      ok: true,
      workspaces,
      accounts,
      boards,
      selectedWorkspaceId,
      selectedAccountId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Publer workspace data.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
