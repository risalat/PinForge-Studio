import type { AIProvider } from "@/lib/ai";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/settings/encryption";
import {
  normalizeDomain,
  type AiCredentialSummary,
  type WorkspaceProfileSummary,
} from "@/lib/types";

export type WorkspaceProfileInput = {
  workspaceId: string;
  workspaceName: string;
  allowedDomains: string[];
  defaultAccountId?: string;
  defaultBoardId?: string;
  isDefault?: boolean;
};

export type AiCredentialInput = {
  id?: string;
  label: string;
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
  isDefault?: boolean;
};

export type IntegrationSettings = {
  publerApiKey: string;
  publerWorkspaceId: string;
  publerAllowedDomains: string[];
  publerAccountId: string;
  publerBoardId: string;
  workspaceProfiles: WorkspaceProfileSummary[];
  aiCredentials: AiCredentialSummary[];
  defaultAiCredentialId: string;
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
  aiCredentials: AiCredentialSummary[];
  defaultAiCredentialId: string;
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
  aiCredentials: [],
  defaultAiCredentialId: "",
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
  const [settings, workspaceProfiles, aiCredentials] = await Promise.all([
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId,
      },
    }),
    listWorkspaceProfilesForUserId(userId),
    listAiCredentialsForUserId(userId),
  ]);
  const defaultProfile = pickDefaultWorkspaceProfile(workspaceProfiles);
  const defaultAiCredential = pickDefaultAiCredential(aiCredentials);

  if (!settings) {
    return {
      ...DEFAULT_SETTINGS,
      publerWorkspaceId: defaultProfile?.workspaceId ?? "",
      publerAllowedDomains: defaultProfile?.allowedDomains ?? [],
      publerAccountId: defaultProfile?.defaultAccountId ?? "",
      publerBoardId: defaultProfile?.defaultBoardId ?? "",
      workspaceProfiles,
      aiCredentials,
      defaultAiCredentialId: defaultAiCredential?.id ?? "",
      aiProvider: defaultAiCredential?.provider ?? DEFAULT_SETTINGS.aiProvider,
      aiApiKey: "",
      aiModel: defaultAiCredential?.model ?? "",
      aiCustomEndpoint: defaultAiCredential?.customEndpoint ?? "",
    };
  }

  return {
    publerApiKey: decryptSecret(settings.publerApiKeyEnc),
    publerWorkspaceId: defaultProfile?.workspaceId ?? settings.publerWorkspaceId ?? "",
    publerAllowedDomains: defaultProfile?.allowedDomains ?? settings.publerAllowedDomains ?? [],
    publerAccountId: defaultProfile?.defaultAccountId ?? settings.publerAccountId ?? "",
    publerBoardId: defaultProfile?.defaultBoardId ?? settings.publerBoardId ?? "",
    workspaceProfiles,
    aiCredentials,
    defaultAiCredentialId: defaultAiCredential?.id ?? "",
    aiProvider: defaultAiCredential?.provider ?? toAiProvider(settings.aiProvider),
    aiApiKey: decryptSecret(defaultAiCredential?.encryptedApiKey ?? settings.aiApiKeyEnc),
    aiModel: defaultAiCredential?.model ?? settings.aiModel ?? "",
    aiCustomEndpoint: defaultAiCredential?.customEndpoint ?? settings.aiCustomEndpoint ?? "",
  };
}

export async function getIntegrationSettingsSummary(): Promise<IntegrationSettingsSummary> {
  const user = await getOrCreateDashboardUser();
  const [settings, workspaceProfiles, aiCredentials] = await Promise.all([
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId: user.id,
      },
    }),
    listWorkspaceProfilesForUserId(user.id),
    listAiCredentialsForUserId(user.id),
  ]);

  const defaultProfile = pickDefaultWorkspaceProfile(workspaceProfiles);
  const defaultAiCredential = pickDefaultAiCredential(aiCredentials);
  const publerCredential = summarizeStoredSecret(settings?.publerApiKeyEnc);
  const aiCredential =
    defaultAiCredential ??
    summarizeLegacyAiCredential(settings);

  return {
    publerWorkspaceId: defaultProfile?.workspaceId ?? settings?.publerWorkspaceId ?? "",
    publerAllowedDomains: defaultProfile?.allowedDomains ?? settings?.publerAllowedDomains ?? [],
    publerAccountId: defaultProfile?.defaultAccountId ?? settings?.publerAccountId ?? "",
    publerBoardId: defaultProfile?.defaultBoardId ?? settings?.publerBoardId ?? "",
    workspaceProfiles,
    aiCredentials,
    defaultAiCredentialId: aiCredential?.id ?? "",
    aiProvider: aiCredential?.provider ?? toAiProvider(settings?.aiProvider),
    aiModel: aiCredential?.model ?? settings?.aiModel ?? "",
    aiCustomEndpoint: aiCredential?.customEndpoint ?? settings?.aiCustomEndpoint ?? "",
    hasPublerApiKey: publerCredential.hasStoredValue,
    hasAiApiKey: aiCredential?.hasApiKey ?? false,
    canUsePublerApiKey: publerCredential.canUseValue,
    canUseAiApiKey: aiCredential?.canUseApiKey ?? false,
    publerCredentialState: publerCredential.state,
    aiCredentialState: aiCredential?.credentialState ?? "missing",
    publerCredentialMessage: publerCredential.message,
    aiCredentialMessage: aiCredential?.credentialMessage ?? "",
  };
}

export async function saveIntegrationSettings(
  input: Omit<Partial<IntegrationSettings>, "workspaceProfiles" | "aiCredentials"> & {
    workspaceProfiles?: WorkspaceProfileInput[];
    aiCredentials?: AiCredentialInput[];
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
  const normalizedAiCredentials =
    input.aiCredentials !== undefined ? normalizeAiCredentials(input.aiCredentials) : null;
  const defaultProfile = pickDefaultWorkspaceProfile(normalizedProfiles ?? []);

  return prisma.$transaction(async (tx) => {
    const existingAiCredentials =
      normalizedAiCredentials !== null
        ? await tx.aiCredential.findMany({
            where: { userId: user.id },
          })
        : [];
    const existingAiCredentialMap = new Map(
      existingAiCredentials.map((credential) => [credential.id, credential]),
    );
    const defaultAiCredential = pickDefaultAiCredential(normalizedAiCredentials ?? []);
    const defaultAiCredentialApiKeyEnc = defaultAiCredential
      ? defaultAiCredential.apiKey?.trim()
        ? encryptSecret(defaultAiCredential.apiKey.trim())
        : defaultAiCredential.id === "legacy-default"
          ? existing?.aiApiKeyEnc ?? null
          : defaultAiCredential.id
          ? existingAiCredentialMap.get(defaultAiCredential.id)?.apiKeyEnc ?? null
          : null
      : null;
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
        aiProvider:
          normalizedAiCredentials !== null
            ? defaultAiCredential?.provider ?? DEFAULT_SETTINGS.aiProvider
            : input.aiProvider,
        aiApiKeyEnc:
          normalizedAiCredentials !== null
            ? defaultAiCredentialApiKeyEnc
            : input.aiApiKey !== undefined
              ? input.aiApiKey.trim() === ""
                ? existing?.aiApiKeyEnc ?? null
                : encryptSecret(input.aiApiKey.trim())
              : undefined,
        aiModel:
          normalizedAiCredentials !== null
            ? defaultAiCredential?.model ?? ""
            : input.aiModel?.trim(),
        aiCustomEndpoint:
          normalizedAiCredentials !== null
            ? defaultAiCredential?.customEndpoint ?? ""
            : input.aiCustomEndpoint?.trim(),
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
        aiProvider:
          defaultAiCredential?.provider ?? input.aiProvider ?? DEFAULT_SETTINGS.aiProvider,
        aiApiKeyEnc:
          defaultAiCredentialApiKeyEnc ??
          (input.aiApiKey?.trim() ? encryptSecret(input.aiApiKey.trim()) : null),
        aiModel: defaultAiCredential?.model ?? input.aiModel?.trim() ?? "",
        aiCustomEndpoint:
          defaultAiCredential?.customEndpoint ?? input.aiCustomEndpoint?.trim() ?? "",
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

    if (normalizedAiCredentials !== null) {
      await tx.aiCredential.deleteMany({
        where: {
          userId: user.id,
        },
      });

      if (normalizedAiCredentials.length > 0) {
        await tx.aiCredential.createMany({
          data: normalizedAiCredentials.map((credential) => ({
            userId: user.id,
            label: credential.label,
            provider: credential.provider,
            apiKeyEnc:
              credential.apiKey?.trim()
                ? encryptSecret(credential.apiKey.trim())
                : credential.id === "legacy-default"
                  ? existing?.aiApiKeyEnc ?? null
                  : credential.id
                  ? existingAiCredentialMap.get(credential.id)?.apiKeyEnc ?? null
                  : null,
            model: credential.model || null,
            customEndpoint: credential.customEndpoint || null,
            isDefault: credential.isDefault,
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

export async function listAiCredentialsForUserId(
  userId: string,
): Promise<StoredAiCredentialSummary[]> {
  const [credentials, legacySettings] = await Promise.all([
    prisma.aiCredential.findMany({
      where: {
        userId,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId,
      },
      select: {
        aiProvider: true,
        aiApiKeyEnc: true,
        aiModel: true,
        aiCustomEndpoint: true,
      },
    }),
  ]);

  if (credentials.length === 0) {
    const legacy = summarizeLegacyAiCredential(legacySettings);
    return legacy ? [legacy] : [];
  }

  return credentials.map((credential) => {
    const credentialSummary = summarizeStoredSecret(credential.apiKeyEnc);

    return {
      id: credential.id,
      label: credential.label,
      provider: toAiProvider(credential.provider),
      model: credential.model ?? "",
      customEndpoint: credential.customEndpoint ?? "",
      isDefault: credential.isDefault,
      hasApiKey: credentialSummary.hasStoredValue,
      canUseApiKey: credentialSummary.canUseValue,
      credentialState: credentialSummary.state,
      credentialMessage: credentialSummary.message,
      encryptedApiKey: credential.apiKeyEnc ?? null,
    };
  });
}

export async function resolveAiCredentialForUserId(input: {
  userId: string;
  aiCredentialId?: string;
}) {
  const [settings, credentials] = await Promise.all([
    prisma.userIntegrationSettings.findUnique({
      where: {
        userId: input.userId,
      },
    }),
    listAiCredentialsForUserId(input.userId),
  ]);

  const requestedId = input.aiCredentialId?.trim() ?? "";
  const selectedCredential =
    (requestedId ? credentials.find((credential) => credential.id === requestedId) : null) ??
    pickDefaultAiCredential(credentials) ??
    summarizeLegacyAiCredential(settings);

  if (!selectedCredential) {
    return null;
  }

  const apiKey =
    "encryptedApiKey" in selectedCredential
      ? decryptSecret(selectedCredential.encryptedApiKey)
      : decryptSecret(settings?.aiApiKeyEnc);

  return {
    id: selectedCredential.id,
    label: selectedCredential.label,
    provider: selectedCredential.provider,
    apiKey,
    model: selectedCredential.model,
    customEndpoint: selectedCredential.customEndpoint,
  };
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

type StoredAiCredentialSummary = AiCredentialSummary & {
  encryptedApiKey: string | null;
};

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

function summarizeLegacyAiCredential(input: {
  aiProvider?: string | null;
  aiApiKeyEnc?: string | null;
  aiModel?: string | null;
  aiCustomEndpoint?: string | null;
} | null | undefined): StoredAiCredentialSummary | null {
  if (!input?.aiApiKeyEnc) {
    return null;
  }

  const summary = summarizeStoredSecret(input.aiApiKeyEnc);

  return {
    id: "legacy-default",
    label: "Default AI key",
    provider: toAiProvider(input.aiProvider),
    model: input.aiModel ?? "",
    customEndpoint: input.aiCustomEndpoint ?? "",
    isDefault: true,
    hasApiKey: summary.hasStoredValue,
    canUseApiKey: summary.canUseValue,
    credentialState: summary.state,
    credentialMessage: summary.message,
    encryptedApiKey: input.aiApiKeyEnc,
  };
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

function normalizeAiCredentials(input: AiCredentialInput[]): AiCredentialInput[] {
  const normalized = input
    .map((credential) => ({
      id: credential.id?.trim() ?? "",
      label: credential.label.trim(),
      provider: credential.provider,
      apiKey: credential.apiKey ?? "",
      model: credential.model?.trim() ?? "",
      customEndpoint: credential.customEndpoint?.trim() ?? "",
      isDefault: Boolean(credential.isDefault),
    }))
    .filter((credential) => credential.label !== "");

  const defaultIndex = normalized.findIndex((credential) => credential.isDefault);
  if (normalized.length > 0) {
    normalized.forEach((credential, index) => {
      credential.isDefault = index === (defaultIndex >= 0 ? defaultIndex : 0);
    });
  }

  return normalized;
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

function pickDefaultAiCredential<T extends { isDefault?: boolean }>(credentials: T[]) {
  return credentials.find((credential) => credential.isDefault) ?? credentials[0] ?? null;
}
