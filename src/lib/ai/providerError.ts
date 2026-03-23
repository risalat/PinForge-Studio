import type { AIProvider } from "@/lib/ai";

export class AIProviderError extends Error {
  readonly provider: AIProvider;
  readonly statusCode?: number;
  readonly responseBody?: string;
  readonly shouldFallback: boolean;

  constructor(input: {
    provider: AIProvider;
    message: string;
    statusCode?: number;
    responseBody?: string;
    shouldFallback?: boolean;
  }) {
    super(input.message);
    this.name = "AIProviderError";
    this.provider = input.provider;
    this.statusCode = input.statusCode;
    this.responseBody = input.responseBody;
    this.shouldFallback = Boolean(input.shouldFallback);
  }
}

export function shouldFallbackAIProviderError(error: unknown) {
  return error instanceof AIProviderError ? error.shouldFallback : false;
}
