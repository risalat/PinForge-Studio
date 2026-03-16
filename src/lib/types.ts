import type { TitleStyle } from "@/lib/ai";
import type { AIProvider } from "@/lib/ai";
import type {
  PinterestBoard,
  PublerAccount,
  PublerWorkspace,
} from "@/lib/publer/publerClient";

export interface GenerateImageInput {
  url: string;
  alt?: string;
  caption?: string;
  nearestHeading?: string;
  sectionHeadingPath?: string[];
  surroundingTextSnippet?: string;
}

export interface GenerateRequestPayload {
  postUrl: string;
  title: string;
  domain?: string;
  images: GenerateImageInput[];
  globalKeywords?: string[];
  titleStyle?: TitleStyle;
  toneHint?: string;
  listCountHint?: number;
  titleVariationCount?: number;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  isActive: boolean;
}

export interface IntegrationSettingsSummary {
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
}

export interface AiCredentialSummary {
  id: string;
  label: string;
  provider: AIProvider;
  model: string;
  customEndpoint: string;
  isDefault: boolean;
  hasApiKey: boolean;
  canUseApiKey: boolean;
  credentialState: "missing" | "ready" | "unavailable";
  credentialMessage: string;
}

export interface WorkspaceProfileSummary {
  workspaceId: string;
  workspaceName: string;
  allowedDomains: string[];
  dailyPublishTarget: number | null;
  defaultAccountId: string;
  defaultBoardId: string;
  isDefault: boolean;
}

export interface PublishQueueDaySummary {
  date: string;
  scheduledCount: number;
  remainingCapacity: number;
  isFull: boolean;
  isToday: boolean;
}

export interface PublishScheduleContext {
  workspaceId: string;
  latestScheduledAt: string | null;
  latestPublishedAt: string | null;
  anchorAt: string | null;
  anchorSource: "scheduled" | "published" | "none";
  recommendedFirstPublishAt: string | null;
  spacingRecommendedFirstPublishAt: string | null;
  recommendedWindowEndAt: string | null;
  dailyPublishTarget: number;
  todayScheduledCount: number;
  upcomingQueueDays: PublishQueueDaySummary[];
  queueAwareSuggestedFirstPublishAt: string | null;
  queueSuggestionReason: string | null;
  hasPendingSchedule: boolean;
}

export interface DashboardPublerOptionsResponse {
  ok: boolean;
  error?: string;
  workspaces?: PublerWorkspace[];
  accounts?: PublerAccount[];
  boards?: PinterestBoard[];
  selectedWorkspaceId?: string;
  selectedAccountId?: string;
}

export interface DashboardAiModelsResponse {
  ok: boolean;
  error?: string;
  models?: string[];
}

export function resolveDomain(input: { postUrl: string; domain?: string }) {
  if (input.domain && input.domain.trim() !== "") {
    return input.domain.trim();
  }

  try {
    return new URL(normalizeArticleUrl(input.postUrl)).hostname;
  } catch {
    return "pinforge.tenreclabs.com";
  }
}

export function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^www\./, "");
}

export function normalizeArticleUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
    const searchParams = new URLSearchParams(parsed.search);
    for (const key of Array.from(searchParams.keys())) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.startsWith("utm_") ||
        normalizedKey === "fbclid" ||
        normalizedKey === "gclid" ||
        normalizedKey === "mc_cid" ||
        normalizedKey === "mc_eid"
      ) {
        searchParams.delete(key);
      }
    }
    searchParams.sort();
    const search = searchParams.toString();
    const port =
      parsed.port && !isDefaultPort(protocol, parsed.port) ? `:${parsed.port}` : "";

    return `${protocol}//${hostname}${port}${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

export function buildArticleUrlCandidates(input: string) {
  const trimmed = input.trim();
  const canonical = normalizeArticleUrl(trimmed);
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }
  if (canonical) {
    candidates.add(canonical);
  }

  try {
    const parsed = new URL(canonical || trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const protocol = parsed.protocol.toLowerCase();
    const pathname = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
    const search = parsed.search;
    const port =
      parsed.port && !isDefaultPort(protocol, parsed.port) ? `:${parsed.port}` : "";
    const hosts = new Set([hostname, `www.${hostname}`]);
    const paths = new Set([pathname]);

    if (pathname !== "/") {
      paths.add(`${pathname}/`);
    } else {
      paths.add("/");
    }

    for (const host of hosts) {
      for (const path of paths) {
        candidates.add(`${protocol}//${host}${port}${path}${search}`);
      }
    }
  } catch {
    // Ignore malformed URLs and fall back to the raw/canonical string set.
  }

  return Array.from(candidates).filter(Boolean);
}

function isDefaultPort(protocol: string, port: string) {
  return (protocol === "https:" && port === "443") || (protocol === "http:" && port === "80");
}
