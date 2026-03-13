const PUBLER_BASE_URL = "https://app.publer.com/api/v1";

export interface PublerClientConfig {
  apiKey: string;
  workspaceId: string;
}

export interface PublerWorkspace {
  id: string;
  name: string;
}

export interface PublerAccount {
  id: number | string;
  provider: string;
  name?: string;
}

export interface PublerMediaAlbum {
  id: string;
  name: string;
}

export interface PublerMediaOptions {
  account_id: string | number;
  albums?: PublerMediaAlbum[];
}

export interface PinterestBoard {
  accountId: string;
  id: string;
  name: string;
}

export interface PublerMediaUploadOptions {
  inLibrary?: boolean;
  directUpload?: boolean;
  name?: string;
  caption?: string;
  source?: string;
}

export interface PublerJobStatusSnapshot {
  state: "queued" | "processing" | "completed" | "failed";
  mediaId?: string;
  error?: string;
  raw: Record<string, unknown>;
}

export interface PublerScheduleRequest {
  bulk: {
    state: "scheduled";
    posts: Array<Record<string, unknown>>;
  };
}

export interface PublerPost {
  id: string;
  state: string;
  url: string;
  postLink?: string;
  scheduledAt?: string;
  accountId?: string;
  boardId?: string;
  raw: Record<string, unknown>;
}

export interface PublerPostPage {
  posts: PublerPost[];
  total: number | null;
  page: number | null;
  perPage: number | null;
  totalPages: number | null;
}

export interface ScheduleOutcome {
  postId?: string;
  status?: string;
  error?: string;
}

export class PublerClient {
  private readonly apiKey: string;
  private readonly workspaceId: string;

  constructor(config: PublerClientConfig) {
    this.apiKey = config.apiKey.trim();
    this.workspaceId = config.workspaceId.trim();
  }

  async getAccounts(): Promise<PublerAccount[]> {
    const payload = await this.request<unknown>("/accounts");
    return extractArray(payload).map((item) => ({
      id: pickStringOrNumber(item, ["id", "account_id"]) ?? "",
      provider: String(pickStringOrNumber(item, ["provider"]) ?? ""),
      name: String(pickStringOrNumber(item, ["name", "username"]) ?? "Untitled account"),
    }));
  }

  async getWorkspaces(): Promise<PublerWorkspace[]> {
    const payload = await this.request<unknown>("/workspaces", undefined, {
      includeWorkspaceHeader: false,
    });
    return extractArray(payload)
      .map((item) => ({
        id: String(pickStringOrNumber(item, ["id", "workspace_id", "workspaceId"]) ?? ""),
        name: String(pickStringOrNumber(item, ["name", "title"]) ?? "Untitled workspace"),
      }))
      .filter((workspace) => workspace.id.trim() !== "");
  }

  async getPinterestAccounts(): Promise<PublerAccount[]> {
    const accounts = await this.getAccounts();
    return accounts.filter((account) => account.provider === "pinterest");
  }

  async getMediaOptions(accountIds: Array<number | string>): Promise<PublerMediaOptions[]> {
    const query = accountIds
      .map((accountId) => `accounts[]=${encodeURIComponent(String(accountId))}`)
      .join("&");

    const payload = await this.request<unknown>(
      `/workspaces/${encodeURIComponent(this.workspaceId)}/media_options?${query}`,
    );
    return extractArray(payload).map((item) => ({
      account_id: pickStringOrNumber(item, ["account_id", "accountId"]) ?? "",
      albums: extractArray((item as Record<string, unknown>).albums).map((album) => ({
        id: String(pickStringOrNumber(album, ["id"]) ?? ""),
        name: String(pickStringOrNumber(album, ["name"]) ?? "Untitled board"),
      })),
    }));
  }

  async getPinterestBoards(accountId: number | string): Promise<PinterestBoard[]> {
    const mediaOptions = await this.getMediaOptions([accountId]);

    return mediaOptions.flatMap((option) =>
      (option.albums ?? [])
        .filter((album) => album.id && album.name)
        .map((album) => ({
          accountId: String(option.account_id),
          id: String(album.id),
          name: album.name,
        })),
    );
  }

  async getJobStatus(jobId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/job_status/${encodeURIComponent(jobId)}`);
  }

  async getPostsPage(input?: {
    states?: string[];
    page?: number;
    limit?: number;
    from?: string | Date;
    to?: string | Date;
  }): Promise<PublerPostPage> {
    const params = new URLSearchParams();
    for (const state of input?.states ?? []) {
      if (state.trim() !== "") {
        params.append("state[]", state.trim());
      }
    }
    if (typeof input?.page === "number") {
      params.set("page", String(input.page));
    }
    if (input?.limit) {
      params.set("limit", String(input.limit));
    }
    if (input?.from) {
      params.set("from", formatDateFilter(input.from));
    }
    if (input?.to) {
      params.set("to", formatDateFilter(input.to));
    }

    const query = params.toString();
    const payload = await this.request<unknown>(`/posts${query ? `?${query}` : ""}`);
    const posts = extractArray(payload)
      .map((item) => toPublerPost(item))
      .filter((post): post is PublerPost => Boolean(post));
    const objectPayload = isObject(payload) ? payload : {};

    return {
      posts,
      total: toOptionalNumber(objectPayload.total),
      page: toOptionalNumber(objectPayload.page),
      perPage: toOptionalNumber(objectPayload.per_page),
      totalPages: toOptionalNumber(objectPayload.total_pages),
    };
  }

  async getPosts(input?: {
    states?: string[];
    limit?: number;
  }): Promise<PublerPost[]> {
    const page = await this.getPostsPage(input);
    return page.posts;
  }

  async uploadMediaFromUrl(
    imageUrl: string,
    options?: PublerMediaUploadOptions,
  ): Promise<{ jobId: string }> {
    const mediaEntry: Record<string, unknown> = {
      url: imageUrl,
    };
    if (options?.name && options.name.trim() !== "") {
      mediaEntry.name = options.name.trim();
    }
    if (options?.caption && options.caption.trim() !== "") {
      mediaEntry.caption = options.caption.trim();
    }
    if (options?.source && options.source.trim() !== "") {
      mediaEntry.source = options.source.trim();
    }

    const payload = await this.request<unknown>("/media/from-url", {
      method: "POST",
      body: JSON.stringify({
        media: [mediaEntry],
        type: "single",
        in_library: options?.inLibrary ?? true,
        direct_upload: options?.directUpload ?? false,
      }),
    });

    const objectPayload = isObject(payload) ? payload : {};
    const jobId = findFirstStringOrNumber(objectPayload, ["job_id", "jobId", "id"]);
    if (!jobId) {
      throw new Error("Publer media upload did not return a job_id.");
    }

    return { jobId: String(jobId) };
  }

  async getJobStatusSnapshot(jobId: string): Promise<PublerJobStatusSnapshot> {
    const raw = await this.getJobStatus(jobId);
    return toJobStatusSnapshot(raw);
  }

  async checkJobStatus(jobId: string): Promise<PublerJobStatusSnapshot> {
    return this.getJobStatusSnapshot(jobId);
  }

  async schedulePosts(payload: PublerScheduleRequest): Promise<{ jobId: string }> {
    const response = await this.request<unknown>("/posts/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const objectPayload = isObject(response) ? response : {};
    const jobId = findFirstStringOrNumber(objectPayload, ["job_id", "jobId", "id"]);
    if (!jobId) {
      throw new Error("Publer schedule request did not return a job_id.");
    }

    return { jobId: String(jobId) };
  }

  async schedulePost(
    payload: PublerScheduleRequest | Record<string, unknown>,
  ): Promise<{ jobId: string }> {
    const request = isScheduleRequest(payload)
      ? payload
      : {
          bulk: {
            state: "scheduled" as const,
            posts: [payload],
          },
        };

    return this.schedulePosts(request);
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    options?: {
      includeWorkspaceHeader?: boolean;
    },
  ): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer-API ${this.apiKey}`);
    if (options?.includeWorkspaceHeader !== false && this.workspaceId) {
      headers.set("Publer-Workspace-Id", this.workspaceId);
    }

    const response = await fetch(`${PUBLER_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Publer API request failed (${response.status} ${response.statusText}): ${errorText}`,
      );
    }

    return (await response.json()) as T;
  }
}

export function createPublerClient(config?: Partial<PublerClientConfig>) {
  const apiKey = config?.apiKey ?? "";
  const workspaceId = config?.workspaceId ?? "";

  if (!apiKey.trim()) {
    throw new Error("A Publer API key is required.");
  }

  if (!workspaceId.trim()) {
    throw new Error("A Publer workspace must be selected before scheduling.");
  }

  return new PublerClient({
    apiKey,
    workspaceId,
  });
}

export async function uploadMediaWithQueueHandling(input: {
  client: PublerClient;
  imageUrl: string;
  options?: PublerMediaUploadOptions;
}) {
  const maxAttempts = 80;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await input.client.uploadMediaFromUrl(input.imageUrl, input.options);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      const shouldRetry = isMediaFromUrlQueueLimitError(text) && attempt < maxAttempts - 1;
      if (!shouldRetry) {
        throw error;
      }

      await wait(3000);
    }
  }

  throw new Error("Timed out waiting for Publer media queue availability.");
}

export async function waitForPublerJobCompletion(input: {
  client: PublerClient;
  jobId: string;
  maxRounds?: number;
  delayMs?: number;
}) {
  const maxRounds = input.maxRounds ?? 120;
  const delayMs = input.delayMs ?? 3000;

  for (let round = 0; round < maxRounds; round += 1) {
    const snapshot = await input.client.checkJobStatus(input.jobId);
    if (snapshot.state === "completed" || snapshot.state === "failed") {
      return snapshot;
    }
    await wait(delayMs);
  }

  return {
    state: "failed" as const,
    error: "Timed out while waiting for Publer job completion.",
    raw: {},
  };
}

export function extractScheduleOutcomesFromJobRaw(raw: Record<string, unknown>) {
  const outcomes: ScheduleOutcome[] = [];
  collectScheduleOutcomes(raw, outcomes);
  return outcomes;
}

export function extractPostIdsFromJobRaw(raw: Record<string, unknown>) {
  const ids: string[] = [];
  collectPostIds(raw, ids);
  return ids;
}

export function isMediaFromUrlQueueLimitError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("please wait until your other download media from url jobs have finished") ||
    normalized.includes("download media from url jobs have finished")
  );
}

export function isFailureStatus(status: string | undefined) {
  if (!status) {
    return false;
  }
  return ["fail", "error", "rejected", "cancel", "invalid"].some((pattern) =>
    status.includes(pattern),
  );
}

function isScheduleRequest(
  value: PublerScheduleRequest | Record<string, unknown>,
): value is PublerScheduleRequest {
  return (
    "bulk" in value &&
    typeof value.bulk === "object" &&
    value.bulk !== null &&
    Array.isArray((value.bulk as { posts?: unknown }).posts)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => isObject(item));
  }

  if (!isObject(value)) {
    return [];
  }

  const keys = ["posts", "data", "results", "items"];
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => isObject(item));
    }
  }

  return [];
}

function pickStringOrNumber(
  source: Record<string, unknown>,
  keys: string[],
): string | number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }
  return undefined;
}

function toOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatDateFilter(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Provide a valid Publer posts date filter.");
  }

  return date.toISOString().slice(0, 10);
}

function toPublerPost(value: Record<string, unknown>): PublerPost | null {
  const id = findFirstStringOrNumber(value, ["id", "post_id", "postId"]);
  const state = findFirstString(value, ["state", "status", "post_state"]) ?? "";
  const url = findFirstString(value, ["url", "link"]) ?? "";

  if (!id || !url) {
    return null;
  }

  return {
    id: String(id),
    state,
    url,
    postLink: findFirstString(value, ["post_link", "postLink"]) ?? undefined,
    scheduledAt:
      findFirstString(value, ["scheduled_at", "scheduledAt", "date"]) ?? undefined,
    accountId:
      findFirstStringOrNumber(value, ["account_id", "accountId"]) !== undefined
        ? String(findFirstStringOrNumber(value, ["account_id", "accountId"]))
        : undefined,
    boardId:
      findFirstStringOrNumber(value, ["album_id", "board_id", "boardId"]) !== undefined
        ? String(findFirstStringOrNumber(value, ["album_id", "board_id", "boardId"]))
        : undefined,
    raw: value,
  };
}

function toJobStatusSnapshot(raw: Record<string, unknown>): PublerJobStatusSnapshot {
  const statusValue = findFirstString(raw, ["status", "state", "job_status"]) ?? "";
  const lowerStatus = statusValue.toLowerCase();
  const mediaId = findFirstStringOrNumber(raw, ["media_id", "mediaId", "id"]);
  const errorValue =
    findFirstString(raw, ["error", "message", "reason", "details"]) ?? undefined;

  if (matchesAny(lowerStatus, ["fail", "error", "rejected", "cancel"])) {
    return { state: "failed", error: errorValue ?? "Job failed.", raw };
  }

  if (matchesAny(lowerStatus, ["complete", "done", "success"])) {
    return {
      state: "completed",
      mediaId: mediaId ? String(mediaId) : undefined,
      raw,
    };
  }

  if (matchesAny(lowerStatus, ["queue", "pending", "wait"])) {
    return { state: "queued", raw };
  }

  return { state: "processing", raw };
}

function collectScheduleOutcomes(value: unknown, outcomes: ScheduleOutcome[]): void {
  if (!value) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectScheduleOutcomes(item, outcomes));
    return;
  }
  if (typeof value !== "object") {
    return;
  }

  const objectValue = value as Record<string, unknown>;
  const postId =
    findFirstStringOrNumberInObject(objectValue, ["post_id", "postId"]) ??
    findFirstStringOrNumberInObject(objectValue, ["id"]);
  const status = findFirstStringInObject(objectValue, ["status", "state", "result"]);
  const error = findFirstErrorInObject(objectValue);

  const looksLikeOutcome =
    (postId !== undefined && (status !== undefined || error !== undefined)) ||
    (status !== undefined && error !== undefined);

  if (looksLikeOutcome) {
    outcomes.push({
      postId: postId !== undefined ? String(postId) : undefined,
      status: status?.toLowerCase(),
      error,
    });
  }

  Object.values(objectValue).forEach((nested) => {
    collectScheduleOutcomes(nested, outcomes);
  });
}

function collectPostIds(value: unknown, output: string[]): void {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPostIds(item, output));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const objectValue = value as Record<string, unknown>;
  for (const [key, currentValue] of Object.entries(objectValue)) {
    const lowerKey = key.toLowerCase();
    if (
      (lowerKey === "post_id" || lowerKey === "postid") &&
      (typeof currentValue === "string" || typeof currentValue === "number")
    ) {
      output.push(String(currentValue));
    }
    collectPostIds(currentValue, output);
  }
}

function findFirstString(
  value: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const direct = value[key];
    if (typeof direct === "string" && direct.trim() !== "") {
      return direct;
    }
  }

  for (const candidate of Object.values(value)) {
    if (isObject(candidate)) {
      const nested = findFirstString(candidate, keys);
      if (nested) {
        return nested;
      }
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (isObject(item)) {
          const nested = findFirstString(item, keys);
          if (nested) {
            return nested;
          }
        }
      }
    }
  }

  return undefined;
}

function findFirstStringOrNumber(
  value: Record<string, unknown>,
  keys: string[],
): string | number | undefined {
  for (const key of keys) {
    const direct = value[key];
    if (
      (typeof direct === "string" && direct.trim() !== "") ||
      typeof direct === "number"
    ) {
      return direct;
    }
  }

  for (const candidate of Object.values(value)) {
    if (isObject(candidate)) {
      const nested = findFirstStringOrNumber(candidate, keys);
      if (nested !== undefined) {
        return nested;
      }
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (isObject(item)) {
          const nested = findFirstStringOrNumber(item, keys);
          if (nested !== undefined) {
            return nested;
          }
        }
      }
    }
  }

  return undefined;
}

function findFirstStringInObject(
  objectValue: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = objectValue[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function findFirstStringOrNumberInObject(
  objectValue: Record<string, unknown>,
  keys: string[],
): string | number | undefined {
  for (const key of keys) {
    const value = objectValue[key];
    if (
      (typeof value === "string" && value.trim() !== "") ||
      typeof value === "number"
    ) {
      return value;
    }
  }
  return undefined;
}

function findFirstErrorInObject(objectValue: Record<string, unknown>): string | undefined {
  const directKeys = ["error", "message", "reason", "details"];
  for (const key of directKeys) {
    const value = objectValue[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  const errors = objectValue.errors;
  if (Array.isArray(errors)) {
    const textErrors = errors
      .map((value) => {
        if (typeof value === "string") {
          return value.trim();
        }
        if (typeof value === "object" && value !== null) {
          const message = (value as Record<string, unknown>).message;
          if (typeof message === "string") {
            return message.trim();
          }
        }
        return "";
      })
      .filter((value) => value !== "");
    if (textErrors.length > 0) {
      return textErrors.join("; ");
    }
  }

  return undefined;
}

function matchesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
