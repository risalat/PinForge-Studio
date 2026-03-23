import { AIProviderError } from "@/lib/ai/providerError";

const KOALA_CHAT_URL = "https://koala.sh/api/gpt/";

export const KOALA_DEFAULT_MODEL = "gpt-5-mini";
export const KOALA_CHAT_MODELS = [
  "gpt-5-mini",
  "gemini-3-flash",
  "gpt-5.2",
  "claude-4.5-haiku",
  "claude-4.5-sonnet",
] as const;

export async function callKoalaChat(input: {
  apiKey: string;
  prompt: string;
  model?: string;
}) {
  const response = await fetch(KOALA_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      input: input.prompt,
      model: input.model?.trim() || KOALA_DEFAULT_MODEL,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new AIProviderError({
      provider: "koala",
      statusCode: response.status,
      responseBody: text,
      shouldFallback: response.status === 401 || response.status === 402 || response.status === 429,
      message: buildKoalaErrorMessage(response.status, response.statusText, text),
    });
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new AIProviderError({
      provider: "koala",
      responseBody: text,
      message: "KoalaChat returned a non-JSON response.",
    });
  }

  const output = json.output;
  if (typeof output !== "string" || output.trim() === "") {
    throw new AIProviderError({
      provider: "koala",
      responseBody: text,
      message: "KoalaChat response did not include text output.",
    });
  }

  return {
    rawText: output,
    rawResponse: text,
  };
}

function buildKoalaErrorMessage(status: number, statusText: string, body: string) {
  if (status === 401) {
    return `KoalaChat request failed (401 Unauthorized): invalid API key. ${body}`;
  }

  if (status === 402) {
    return `KoalaChat request failed (402 Payment Required): no credits available. ${body}`;
  }

  if (status === 429) {
    return `KoalaChat request failed (429 Too Many Requests): rate limit reached. ${body}`;
  }

  return `KoalaChat request failed (${status} ${statusText}): ${body}`;
}
