import type { AIProvider } from "@/lib/ai";
import { getOrCreateDashboardUser } from "@/lib/auth/dashboardUser";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/settings/encryption";
import { normalizeDomain } from "@/lib/types";

export type IntegrationSettings = {
  publerApiKey: string;
  publerWorkspaceId: string;
  publerAllowedDomains: string[];
  publerAccountId: string;
  publerBoardId: string;
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
  const settings = await prisma.userIntegrationSettings.findUnique({
    where: {
      userId,
    },
  });

  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    publerApiKey: decryptSecret(settings.publerApiKeyEnc),
    publerWorkspaceId: settings.publerWorkspaceId ?? "",
    publerAllowedDomains: settings.publerAllowedDomains ?? [],
    publerAccountId: settings.publerAccountId ?? "",
    publerBoardId: settings.publerBoardId ?? "",
    aiProvider: toAiProvider(settings.aiProvider),
    aiApiKey: decryptSecret(settings.aiApiKeyEnc),
    aiModel: settings.aiModel ?? "",
    aiCustomEndpoint: settings.aiCustomEndpoint ?? "",
  };
}

export async function getIntegrationSettingsSummary(): Promise<IntegrationSettingsSummary> {
  const user = await getOrCreateDashboardUser();
  const settings = await prisma.userIntegrationSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  const publerCredential = summarizeStoredSecret(settings?.publerApiKeyEnc);
  const aiCredential = summarizeStoredSecret(settings?.aiApiKeyEnc);

  return {
    publerWorkspaceId: settings?.publerWorkspaceId ?? "",
    publerAllowedDomains: settings?.publerAllowedDomains ?? [],
    publerAccountId: settings?.publerAccountId ?? "",
    publerBoardId: settings?.publerBoardId ?? "",
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

export async function saveIntegrationSettings(input: Partial<IntegrationSettings>) {
  const user = await getOrCreateDashboardUser();
  const existing = await prisma.userIntegrationSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  return prisma.userIntegrationSettings.upsert({
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
      publerWorkspaceId: input.publerWorkspaceId?.trim(),
      publerAllowedDomains:
        input.publerAllowedDomains !== undefined
          ? normalizeAllowedDomains(input.publerAllowedDomains)
          : undefined,
      publerAccountId: input.publerAccountId?.trim(),
      publerBoardId: input.publerBoardId?.trim(),
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
      publerWorkspaceId: input.publerWorkspaceId?.trim() ?? "",
      publerAllowedDomains: normalizeAllowedDomains(input.publerAllowedDomains ?? []),
      publerAccountId: input.publerAccountId?.trim() ?? "",
      publerBoardId: input.publerBoardId?.trim() ?? "",
      aiProvider: input.aiProvider ?? DEFAULT_SETTINGS.aiProvider,
      aiApiKeyEnc: input.aiApiKey?.trim() ? encryptSecret(input.aiApiKey.trim()) : null,
      aiModel: input.aiModel?.trim() ?? "",
      aiCustomEndpoint: input.aiCustomEndpoint?.trim() ?? "",
    },
  });
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
  if (value === "openai" || value === "gemini" || value === "openrouter" || value === "custom_endpoint") {
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
      input
        .map((value) => normalizeDomain(value))
        .filter((value) => value !== ""),
    ),
  );
}
