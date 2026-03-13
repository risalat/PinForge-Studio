import type { AIProvider } from "@/lib/ai";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/settings/encryption";
import { normalizeDomain, type WorkspaceProfileSummary } from "@/lib/types";

export type WorkspaceProfileInput = {
  workspaceId: string;
  workspaceName: string;
  allowedDomains: string[];
  defaultAccountId?: string;
  defaultBoardId?: string;
  isDefault?: boolean;
};

export type IntegrationSettings = {
  publerApiKey: string;
  publerWorkspaceId: string;
  publerAllowedDomains: string[];
  publerAccountId: string;
  publerBoardId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiCustomEndpoint: string;
};

export type IntegrationSettingsSummary = {
  publerWorkspaceId: string;
  publerAllowedDomains: string[];
  publerAccountId: string;
  publerBoardId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
  aiProvider: AIProvider;
  aiModel: string;
  aiCustomEndpoint: string;
  hasPublerApiKey: boolean;
  hasAiApiKey: boolean;
  canUsePublerApiKey: boolean;
  canUseAiApiKey: boolean;
  publerCredentialState: "missing" | "ready" | "unavailable";
  aiCredentialState: "missing" | "ready" | "unavailable";
  publerCredentialMessage: string;
  aiCredentialMessage: string;
};

const DEFAULT_SETTINGS: IntegrationSettings = {
  publerApiKey: "",
  publerWorkspaceId: "",
  publerAllowedDomains: [],
  publerAccountId: "",
  publerBoardId: "",
  workspaceProfiles: [],
  aiProvider: "gemini",
  aiApiKey: "",
  aiModel: "",
  aiCustomEndpoint: "",
};

export async function getIntegrationSettings() {
  const user = await getOrCreateDashboardUser();
  return getIntegrationSettingsForUserId(user.id);
}

export async function getIntegrationSettingsForUserId(userId: string) {
  const [settings, workspaceProfiles] = await Promise.all([
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId,
      },
    }),
    listWorkspaceProfilesForUserId(userId),
  ]);
  const defaultProfile = pickDefaultWorkspaceProfile(workspaceProfiles);

  if (!settings) {
    return {
      ...DEFAULT_SETTINGS,
      publerWorkspaceId: defaultProfile?.workspaceId ?? "",
      publerAllowedDomains: defaultProfile?.allowedDomains ?? [],
      publerAccountId: defaultProfile?.defaultAccountId ?? "",
      publerBoardId: defaultProfile?.defaultBoardId ?? "",
      workspaceProfiles,
    };
  }

  return {
    publerApiKey: decryptSecret(settings.publerApiKeyEnc),
    publerWorkspaceId: defaultProfile?.workspaceId ?? settings.publerWorkspaceId ?? "",
    publerAllowedDomains: defaultProfile?.allowedDomains ?? settings.publerAllowedDomains ?? [],
    publerAccountId: defaultProfile?.defaultAccountId ?? settings.publerAccountId ?? "",
    publerBoardId: defaultProfile?.defaultBoardId ?? settings.publerBoardId ?? "",
    workspaceProfiles,
    aiProvider: toAiProvider(settings.aiProvider),
    aiApiKey: decryptSecret(settings.aiApiKeyEnc),
    aiModel: settings.aiModel ?? "",
    aiCustomEndpoint: settings.aiCustomEndpoint ?? "",
  };
}

export async function getIntegrationSettingsSummary(): Promise<IntegrationSettingsSummary> {
  const user = await getOrCreateDashboardUser();
  const [settings, workspaceProfiles] = await Promise.all([
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId: user.id,
      },
    }),
    listWorkspaceProfilesForUserId(user.id),
  ]);

  const defaultProfile = pickDefaultWorkspaceProfile(workspaceProfiles);
  const publerCredential = summarizeStoredSecret(settings?.publerApiKeyEnc);
  const aiCredential = summarizeStoredSecret(settings?.aiApiKeyEnc);

  return {
    publerWorkspaceId: defaultProfile?.workspaceId ?? settings?.publerWorkspaceId ?? "",
    publerAllowedDomains: defaultProfile?.allowedDomains ?? settings?.publerAllowedDomains ?? [],
    publerAccountId: defaultProfile?.defaultAccountId ?? settings?.publerAccountId ?? "",
    publerBoardId: defaultProfile?.defaultBoardId ?? settings?.publerBoardId ?? "",
    workspaceProfiles,
    aiProvider: toAiProvider(settings?.aiProvider),
    aiModel: settings?.aiModel ?? "",
    aiCustomEndpoint: settings?.aiCustomEndpoint ?? "",
    hasPublerApiKey: publerCredential.hasStoredValue,
    hasAiApiKey: aiCredential.hasStoredValue,
    canUsePublerApiKey: publerCredential.canUseValue,
    canUseAiApiKey: aiCredential.canUseValue,
    publerCredentialState: publerCredential.state,
    aiCredentialState: aiCredential.state,
    publerCredentialMessage: publerCredential.message,
    aiCredentialMessage: aiCredential.message,
  };
}

export async function saveIntegrationSettings(
  input: Omit<Partial<IntegrationSettings>, "workspaceProfiles"> & {
    workspaceProfiles?: WorkspaceProfileInput[];
  },
) {
  const user = await getOrCreateDashboardUser();
  const existing = await prisma.userIntegrationSettings.findUnique({
    where: {
      userId: user.id,
    },
  });
  const normalizedProfiles =
    input.workspaceProfiles !== undefined
      ? normalizeWorkspaceProfiles(input.workspaceProfiles)
      : null;
  const defaultProfile = pickDefaultWorkspaceProfile(normalizedProfiles ?? []);

  return prisma.$transaction(async (tx) => {
    const settings = await tx.userIntegrationSettings.upsert({
      where: {
        userId: user.id,
      },
      update: {
        publerApiKeyEnc:
          input.publerApiKey !== undefined
            ? input.publerApiKey.trim() === ""
              ? existing?.publerApiKeyEnc ?? null
              : encryptSecret(input.publerApiKey.trim())
            : undefined,
        publerWorkspaceId:
          normalizedProfiles !== null
            ? defaultProfile?.workspaceId ?? ""
            : input.publerWorkspaceId?.trim(),
        publerAllowedDomains:
          normalizedProfiles !== null
            ? defaultProfile?.allowedDomains ?? []
            : input.publerAllowedDomains !== undefined
              ? normalizeAllowedDomains(input.publerAllowedDomains)
              : undefined,
        publerAccountId:
          normalizedProfiles !== null
            ? defaultProfile?.defaultAccountId ?? ""
            : input.publerAccountId?.trim(),
        publerBoardId:
          normalizedProfiles !== null
            ? defaultProfile?.defaultBoardId ?? ""
            : input.publerBoardId?.trim(),
        aiProvider: input.aiProvider,
        aiApiKeyEnc:
          input.aiApiKey !== undefined
            ? input.aiApiKey.trim() === ""
              ? existing?.aiApiKeyEnc ?? null
              : encryptSecret(input.aiApiKey.trim())
            : undefined,
        aiModel: input.aiModel?.trim(),
        aiCustomEndpoint: input.aiCustomEndpoint?.trim(),
      },
      create: {
        userId: user.id,
        publerApiKeyEnc: input.publerApiKey?.trim()
          ? encryptSecret(input.publerApiKey.trim())
          : null,
        publerWorkspaceId: defaultProfile?.workspaceId ?? input.publerWorkspaceId?.trim() ?? "",
        publerAllowedDomains:
          defaultProfile?.allowedDomains ??
          normalizeAllowedDomains(input.publerAllowedDomains ?? []),
        publerAccountId: defaultProfile?.defaultAccountId ?? input.publerAccountId?.trim() ?? "",
        publerBoardId: defaultProfile?.defaultBoardId ?? input.publerBoardId?.trim() ?? "",
        aiProvider: input.aiProvider ?? DEFAULT_SETTINGS.aiProvider,
        aiApiKeyEnc: input.aiApiKey?.trim() ? encryptSecret(input.aiApiKey.trim()) : null,
        aiModel: input.aiModel?.trim() ?? "",
        aiCustomEndpoint: input.aiCustomEndpoint?.trim() ?? "",
      },
    });

    if (normalizedProfiles !== null) {
      await tx.workspaceProfile.deleteMany({
        where: {
          userId: user.id,
        },
      });

      if (normalizedProfiles.length > 0) {
        await tx.workspaceProfile.createMany({
          data: normalizedProfiles.map((profile) => ({
            userId: user.id,
            workspaceId: profile.workspaceId,
            workspaceName: profile.workspaceName,
            allowedDomains: profile.allowedDomains,
            defaultAccountId: profile.defaultAccountId || null,
            defaultBoardId: profile.defaultBoardId || null,
            isDefault: profile.isDefault,
          })),
        });
      }
    }

    return settings;
  });
}

export async function listWorkspaceProfilesForUserId(userId: string): Promise<WorkspaceProfileSummary[]> {
  const profiles = await prisma.workspaceProfile.findMany({
    where: {
      userId,
    },
    orderBy: [{ isDefault: "desc" }, { workspaceName: "asc" }],
  });

  return profiles.map((profile) => ({
    workspaceId: profile.workspaceId,
    workspaceName: profile.workspaceName,
    allowedDomains: profile.allowedDomains,
    defaultAccountId: profile.defaultAccountId ?? "",
    defaultBoardId: profile.defaultBoardId ?? "",
    isDefault: profile.isDefault,
  }));
}

export async function getWorkspaceProfileForUserId(
  userId: string,
  workspaceId?: string,
): Promise<WorkspaceProfileSummary | null> {
  const profiles = await listWorkspaceProfilesForUserId(userId);

  if (workspaceId?.trim()) {
    const matchingProfile = profiles.find((profile) => profile.workspaceId === workspaceId.trim());
    if (matchingProfile) {
      return matchingProfile;
    }
  }

  return pickDefaultWorkspaceProfile(profiles) ?? null;
}

export async function saveWorkspaceProfileDefaults(input: {
  workspaceId: string;
  defaultAccountId?: string;
  defaultBoardId?: string;
}) {
  const workspaceId = input.workspaceId.trim();
  if (!workspaceId) {
    throw new Error("Select a workspace profile first.");
  }

  const user = await getOrCreateDashboardUser();
  const profiles = await listWorkspaceProfilesForUserId(user.id);
  const targetProfile = profiles.find((profile) => profile.workspaceId === workspaceId);

  if (!targetProfile) {
    throw new Error("Workspace profile not found.");
  }

  const nextProfiles = profiles.map((profile) =>
    profile.workspaceId === workspaceId
      ? {
          ...profile,
          defaultAccountId: input.defaultAccountId?.trim() ?? "",
          defaultBoardId: input.defaultBoardId?.trim() ?? "",
        }
      : profile,
  );

  await saveIntegrationSettings({
    workspaceProfiles: nextProfiles,
  });

  return getWorkspaceProfileForUserId(user.id, workspaceId);
}

export async function getEffectivePublerAllowedDomainsForUserId(userId: string) {
  const settings = await prisma.userIntegrationSettings.findUnique({
    where: {
      userId,
    },
    select: {
      publerAllowedDomains: true,
    },
  });

  const storedDomains = normalizeAllowedDomains(settings?.publerAllowedDomains ?? []);
  if (storedDomains.length > 0) {
    return storedDomains;
  }

  return inferDomainsFromJobs(userId);
}

export async function getWorkspaceAllowedDomainsForUserId(userId: string, workspaceId?: string) {
  const profile = await getWorkspaceProfileForUserId(userId, workspaceId);
  const profileDomains = normalizeAllowedDomains(profile?.allowedDomains ?? []);

  if (profileDomains.length > 0) {
    return profileDomains;
  }

  return inferDomainsFromJobs(userId);
}

async function inferDomainsFromJobs(userId: string) {
  const inferredPosts = await prisma.post.findMany({
    where: {
      jobs: {
        some: {
          userId,
        },
      },
    },
    select: {
      domain: true,
    },
    distinct: ["domain"],
    orderBy: {
      domain: "asc",
    },
  });

  return normalizeAllowedDomains(inferredPosts.map((post) => post.domain));
}

function toAiProvider(value: string | null | undefined): AIProvider {
  if (
    value === "openai" ||
    value === "gemini" ||
    value === "openrouter" ||
    value === "custom_endpoint"
  ) {
    return value;
  }

  return DEFAULT_SETTINGS.aiProvider;
}

function summarizeStoredSecret(payload: string | null | undefined) {
  if (!payload) {
    return {
      hasStoredValue: false,
      canUseValue: false,
      state: "missing" as const,
      message: "",
    };
  }

  try {
    decryptSecret(payload);
    return {
      hasStoredValue: true,
      canUseValue: true,
      state: "ready" as const,
      message: "",
    };
  } catch (error) {
    return {
      hasStoredValue: true,
      canUseValue: false,
      state: "unavailable" as const,
      message:
        error instanceof Error
          ? error.message
          : "Stored secret is not usable in the current environment.",
    };
  }
}

function normalizeAllowedDomains(input: string[]) {
  return Array.from(
    new Set(
      input.map((value) => normalizeDomain(value)).filter((value) => value !== ""),
    ),
  );
}

function normalizeWorkspaceProfiles(input: WorkspaceProfileInput[]): WorkspaceProfileSummary[] {
  const seenWorkspaceIds = new Set<string>();
  const profiles = input
    .map((profile) => ({
      workspaceId: profile.workspaceId.trim(),
      workspaceName: profile.workspaceName.trim() || profile.workspaceId.trim(),
      allowedDomains: normalizeAllowedDomains(profile.allowedDomains),
      defaultAccountId: profile.defaultAccountId?.trim() ?? "",
      defaultBoardId: profile.defaultBoardId?.trim() ?? "",
      isDefault: Boolean(profile.isDefault),
    }))
    .filter((profile) => {
      if (!profile.workspaceId || seenWorkspaceIds.has(profile.workspaceId)) {
        return false;
      }

      seenWorkspaceIds.add(profile.workspaceId);
      return true;
    });

  const defaultIndex = profiles.findIndex((profile) => profile.isDefault);
  if (profiles.length > 0) {
    profiles.forEach((profile, index) => {
      profile.isDefault = index === (defaultIndex >= 0 ? defaultIndex : 0);
    });
  }

  return profiles;
}

function pickDefaultWorkspaceProfile<T extends { isDefault: boolean }>(profiles: T[]) {
  return profiles.find((profile) => profile.isDefault) ?? profiles[0] ?? null;
}
