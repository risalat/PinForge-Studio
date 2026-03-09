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
  publerAccountId: string;
  publerBoardId: string;
  aiProvider: AIProvider;
  aiModel: string;
  aiCustomEndpoint: string;
  hasPublerApiKey: boolean;
  hasAiApiKey: boolean;
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
    return new URL(input.postUrl).hostname;
  } catch {
    return "pinforge.tenreclabs.com";
  }
}
