import {
  validatePinCopyBatch,
  validatePinTitleBatch,
  type PinCopy,
  type PinTitleOption,
} from "@/lib/ai/validators";

export type AIProvider = "custom_endpoint" | "openai" | "gemini" | "openrouter";
export type TitleStyle = "balanced" | "seo" | "curiosity" | "benefit";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
}

export interface ImageContextInput {
  image_url: string;
  alt?: string;
  caption?: string;
  nearest_heading?: string;
  section_heading_path?: string[];
  surrounding_text_snippet?: string;
  preferred_keywords?: string[];
}

export interface GeneratePinTitleRequest {
  article_title: string;
  destination_url: string;
  global_keywords?: string[];
  title_style?: TitleStyle;
  tone_hint?: string;
  list_count_hint?: number;
  variation_count?: number;
  images?: ImageContextInput[];
}

export interface GeneratePinDescriptionRequest {
  article_title: string;
  destination_url: string;
  chosen_titles: string[];
  global_keywords?: string[];
  tone_hint?: string;
}

type GenerateMode = "studio_titles" | "studio_descriptions";

const OPENAI_BASE_URL = "https://api.openai.com";
const OPENROUTER_BASE_URL = "https://openrouter.ai";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

export class AIClient {
  private readonly config: AIProviderConfig;

  constructor(config?: AIProviderConfig) {
    this.config = {
      provider: config?.provider ?? "gemini",
      apiKey: config?.apiKey ?? "",
      model: config?.model ?? "",
      customEndpoint: config?.customEndpoint ?? "",
    };
  }

  static async listModels(config: AIProviderConfig): Promise<string[]> {
    const client = new AIClient(config);
    return client.listModels();
  }

  async listModels(): Promise<string[]> {
    switch (this.config.provider) {
      case "openai":
        return this.listOpenAIModels();
      case "openrouter":
        return this.listOpenRouterModels();
      case "gemini":
        return this.listGeminiModels();
      case "custom_endpoint":
      default:
        return [];
    }
  }

  async generatePinTitles(payload: GeneratePinTitleRequest): Promise<PinTitleOption[]> {
    const data = await this.generateStructuredOutput("studio_titles", payload);
    return validatePinTitleBatch(this.extractCandidateArray(data, ["titles", "pins", "items"]));
  }

  async generatePinDescriptions(payload: GeneratePinDescriptionRequest): Promise<PinCopy[]> {
    const data = await this.generateStructuredOutput("studio_descriptions", payload);
    return validatePinCopyBatch(this.extractCandidateArray(data, ["pins", "items", "results"]));
  }

  private async generateStructuredOutput(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Promise<unknown> {
    switch (this.config.provider) {
      case "openai":
        return this.generateViaOpenAI(mode, payload);
      case "openrouter":
        return this.generateViaOpenRouter(mode, payload);
      case "gemini":
        return this.generateViaGemini(mode, payload);
      case "custom_endpoint":
      default:
        return this.generateViaCustomEndpoint(mode, payload);
    }
  }

  private async generateViaCustomEndpoint(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Promise<unknown> {
    const endpoint = this.config.customEndpoint?.trim() ?? "";
    if (!endpoint) {
      throw new Error(
        "AI endpoint is not configured. Set a custom endpoint or choose a hosted provider.",
      );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        payload,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `AI copy generation failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    return response.json();
  }

  private async generateViaOpenAI(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Promise<unknown> {
    const apiKey = this.requireApiKey("OpenAI");
    const model = this.requireModel("OpenAI");

    const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: this.buildMessages(mode, payload),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenAI copy generation failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const content = this.extractChatContent(json);
    return this.parseJsonText(content);
  }

  private async generateViaOpenRouter(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Promise<unknown> {
    const apiKey = this.requireApiKey("OpenRouter");
    const model = this.requireModel("OpenRouter");

    const response = await fetch(`${OPENROUTER_BASE_URL}/api/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: this.buildMessages(mode, payload),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenRouter copy generation failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const content = this.extractChatContent(json);
    return this.parseJsonText(content);
  }

  private async generateViaGemini(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Promise<unknown> {
    const apiKey = this.requireApiKey("Gemini");
    const model = this.normalizeGeminiModel(this.requireModel("Gemini"));

    const response = await fetch(
      `${GEMINI_BASE_URL}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [{ text: this.buildUserPrompt(mode, payload) }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Gemini copy generation failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const content = this.extractGeminiContent(json);
    return this.parseJsonText(content);
  }

  private async listOpenAIModels(): Promise<string[]> {
    const apiKey = this.requireApiKey("OpenAI");
    const response = await fetch(`${OPENAI_BASE_URL}/v1/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenAI model list failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    return this.extractModelIds(json);
  }

  private async listOpenRouterModels(): Promise<string[]> {
    const apiKey = this.requireApiKey("OpenRouter");
    const response = await fetch(`${OPENROUTER_BASE_URL}/api/v1/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenRouter model list failed (${response.status} ${response.statusText}): ${text}`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    return this.extractModelIds(json);
  }

  private async listGeminiModels(): Promise<string[]> {
    const apiKey = this.requireApiKey("Gemini");
    let nextPageToken = "";
    const models: string[] = [];
    let safetyCounter = 0;

    while (safetyCounter < 30) {
      safetyCounter += 1;
      const query = new URLSearchParams({ key: apiKey });
      if (nextPageToken) {
        query.set("pageToken", nextPageToken);
      }

      const response = await fetch(`${GEMINI_BASE_URL}/v1beta/models?${query.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Gemini model list failed (${response.status} ${response.statusText}): ${text}`,
        );
      }

      const json = (await response.json()) as Record<string, unknown>;
      const entries = Array.isArray(json.models) ? json.models : [];
      for (const entry of entries) {
        if (typeof entry !== "object" || entry === null) {
          continue;
        }

        const objectEntry = entry as Record<string, unknown>;
        const supported = Array.isArray(objectEntry.supportedGenerationMethods)
          ? objectEntry.supportedGenerationMethods
          : [];
        const supportsGenerateContent = supported.some(
          (value) => typeof value === "string" && value === "generateContent",
        );
        if (!supportsGenerateContent) {
          continue;
        }

        const name = objectEntry.name;
        if (typeof name === "string" && name.trim() !== "") {
          models.push(this.normalizeGeminiModel(name));
        }
      }

      const token = json.nextPageToken;
      if (typeof token === "string" && token.trim() !== "") {
        nextPageToken = token;
      } else {
        break;
      }
    }

    return [...new Set(models)].sort((a, b) => a.localeCompare(b));
  }

  private buildMessages(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ): Array<Record<string, string>> {
    return [
      {
        role: "system",
        content:
          "You write Pinterest copy. Return valid JSON only. No markdown. No hashtags.",
      },
      { role: "user", content: this.buildUserPrompt(mode, payload) },
    ];
  }

  private buildUserPrompt(
    mode: GenerateMode,
    payload: GeneratePinTitleRequest | GeneratePinDescriptionRequest,
  ) {
    if (mode === "studio_titles") {
      const titlePayload = payload as GeneratePinTitleRequest;
      return [
        "Generate Pinterest title variations for a collage pin representing the article as a whole.",
        "Do NOT generate one title per image. Do NOT describe individual images.",
        "Base the titles primarily on the article title. Use optional keywords and hints when helpful.",
        "If a list_count_hint is provided, prefer list-style framing when natural.",
        this.buildTitleStyleInstruction(titlePayload.title_style ?? "balanced"),
        `Tone hint: ${titlePayload.tone_hint ?? "none"}`,
        `Variation count target: ${titlePayload.variation_count ?? 3}`,
        `Article title: ${titlePayload.article_title}`,
        `Destination URL: ${titlePayload.destination_url}`,
        `Global keywords: ${(titlePayload.global_keywords ?? []).join(", ") || "none"}`,
        `List count hint: ${titlePayload.list_count_hint ?? "none"}`,
        `Image context is secondary and provided only as optional supporting context:`,
        JSON.stringify(titlePayload.images ?? [], null, 2),
        'Return JSON with this shape: {"titles":[{"title":"..."}]}',
        "Rules: title <= 100 chars, no hashtags, distinct variations, article-level framing only.",
      ].join("\n");
    }

    const descriptionPayload = payload as GeneratePinDescriptionRequest;
    return [
      "Generate Pinterest descriptions for the provided finalized pin titles.",
      "Descriptions should be based on the article title, the chosen pin title, and optional keywords.",
      "Do not invent image-specific explanations unless directly implied by the article title or keywords.",
      `Article title: ${descriptionPayload.article_title}`,
      `Destination URL: ${descriptionPayload.destination_url}`,
      `Tone hint: ${descriptionPayload.tone_hint ?? "none"}`,
      `Global keywords: ${(descriptionPayload.global_keywords ?? []).join(", ") || "none"}`,
      `Chosen titles (${descriptionPayload.chosen_titles.length}):`,
      JSON.stringify(descriptionPayload.chosen_titles, null, 2),
      'Return JSON with this shape: {"pins":[{"title":"...","description":"...","keywords_used":["..."]}]}',
      "Keep each title exactly as provided. Description <= 500 chars. No hashtags.",
    ].join("\n");
  }

  private buildTitleStyleInstruction(style: TitleStyle) {
    switch (style) {
      case "seo":
        return "Style: SEO-focused. Front-load relevant topic terms; be clear and searchable, not clickbait.";
      case "curiosity":
        return "Style: Curiosity hook. Spark interest with a specific promise, while staying truthful and concrete.";
      case "benefit":
        return "Style: Benefit-led. Emphasize practical outcome/value the reader gets from this pin.";
      case "balanced":
      default:
        return "Style: Balanced. Mix context clarity, specificity, and a light engagement hook.";
    }
  }

  private extractCandidateArray(value: unknown, keys: string[]) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== "object" || value === null) {
      return [];
    }

    const objectValue = value as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(objectValue[key])) {
        return objectValue[key];
      }
    }

    return [];
  }

  private extractChatContent(response: Record<string, unknown>): string {
    const choices = Array.isArray(response.choices) ? response.choices : [];
    const first = choices[0];
    if (!first || typeof first !== "object") {
      throw new Error("AI response did not include choices.");
    }

    const message = (first as Record<string, unknown>).message;
    if (!message || typeof message !== "object") {
      throw new Error("AI response did not include message content.");
    }

    const content = (message as Record<string, unknown>).content;
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      const textPart = content.find(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).text === "string",
      ) as Record<string, unknown> | undefined;
      if (textPart && typeof textPart.text === "string") {
        return textPart.text;
      }
    }

    throw new Error("AI response content was empty.");
  }

  private extractGeminiContent(response: Record<string, unknown>): string {
    const candidates = Array.isArray(response.candidates) ? response.candidates : [];
    const first = candidates[0];
    if (!first || typeof first !== "object") {
      throw new Error("Gemini response did not include candidates.");
    }

    const content = (first as Record<string, unknown>).content;
    if (!content || typeof content !== "object") {
      throw new Error("Gemini response did not include content.");
    }

    const parts = Array.isArray((content as Record<string, unknown>).parts)
      ? ((content as Record<string, unknown>).parts as unknown[])
      : [];
    const firstText = parts.find(
      (part) =>
        typeof part === "object" &&
        part !== null &&
        typeof (part as Record<string, unknown>).text === "string",
    ) as Record<string, unknown> | undefined;

    if (!firstText || typeof firstText.text !== "string") {
      throw new Error("Gemini response did not include text output.");
    }

    return firstText.text;
  }

  private parseJsonText(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      }

      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        return JSON.parse(text.slice(firstBracket, lastBracket + 1));
      }
      throw new Error("Model response was not valid JSON.");
    }
  }

  private extractModelIds(response: Record<string, unknown>): string[] {
    const data = Array.isArray(response.data) ? response.data : [];
    const ids = data
      .map((item) =>
        typeof item === "object" && item !== null
          ? (item as Record<string, unknown>).id
          : undefined,
      )
      .filter((id): id is string => typeof id === "string" && id.trim() !== "");

    return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
  }

  private normalizeGeminiModel(model: string): string {
    return model.replace(/^models\//, "");
  }

  private requireApiKey(label: string): string {
    const key = this.config.apiKey?.trim() ?? "";
    if (!key) {
      throw new Error(`${label} API key is required.`);
    }
    return key;
  }

  private requireModel(label: string): string {
    const model = this.config.model?.trim() ?? "";
    if (!model) {
      throw new Error(`${label} model is required.`);
    }
    return model;
  }
}

export function createAIClient(config?: Partial<AIProviderConfig>) {
  return new AIClient({
    provider: (config?.provider ?? "gemini") as AIProvider,
    apiKey: config?.apiKey ?? "",
    model: config?.model ?? "",
    customEndpoint: config?.customEndpoint ?? "",
  });
}

export async function generatePinTitle(
  payload: GeneratePinTitleRequest,
  config?: Partial<AIProviderConfig>,
) {
  return createAIClient(config).generatePinTitles(payload);
}

export async function generatePinDescription(
  payload: GeneratePinDescriptionRequest,
  config?: Partial<AIProviderConfig>,
) {
  return createAIClient(config).generatePinDescriptions(payload);
}

export async function generatePinCopy(
  titlePayload: GeneratePinTitleRequest,
  config?: Partial<AIProviderConfig>,
) {
  const titles = await generatePinTitle(titlePayload, config);
  const descriptions = await generatePinDescription(
    {
      article_title: titlePayload.article_title,
      destination_url: titlePayload.destination_url,
      chosen_titles: titles.map((item) => item.title),
      global_keywords: titlePayload.global_keywords,
      tone_hint: titlePayload.tone_hint,
    },
    config,
  );

  return titles.map((title, index) => ({
    title: title.title,
    description: descriptions[index]?.description ?? "",
    alt_text: descriptions[index]?.alt_text,
    keywords_used: descriptions[index]?.keywords_used,
  }));
}

export type { PinCopy, PinTitleOption };
