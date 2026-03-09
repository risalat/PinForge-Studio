import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/env";
import { PublerClient } from "@/lib/publer/publerClient";
import { getIntegrationSettings } from "@/lib/settings/integrationSettings";

const schema = z.object({
  apiKey: z.string().trim().optional(),
  workspaceId: z.string().trim().optional(),
  accountId: z.union([z.string(), z.number()]).optional(),
});

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const payload = schema.parse(rawPayload);
    const savedSettings = isDatabaseConfigured() ? await getIntegrationSettings() : null;
    const apiKey = payload.apiKey?.trim() || savedSettings?.publerApiKey || "";

    if (!apiKey) {
      throw new Error("Enter a Publer API key or save one in dashboard settings first.");
    }

    const baseClient = new PublerClient({
      apiKey,
      workspaceId: "",
    });

    const [workspaces, accounts] = await Promise.all([
      baseClient.getWorkspaces(),
      baseClient.getPinterestAccounts(),
    ]);

    const selectedWorkspaceId =
      payload.workspaceId?.trim() ||
      savedSettings?.publerWorkspaceId ||
      workspaces[0]?.id ||
      "";
    const selectedAccountId =
      String(payload.accountId ?? "").trim() ||
      savedSettings?.publerAccountId ||
      (accounts[0] ? String(accounts[0].id) : "");

    let boards: Awaited<ReturnType<PublerClient["getPinterestBoards"]>> = [];

    if (selectedWorkspaceId && selectedAccountId) {
      const boardClient = new PublerClient({
        apiKey,
        workspaceId: selectedWorkspaceId,
      });
      boards = await boardClient.getPinterestBoards(selectedAccountId);
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
