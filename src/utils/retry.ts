import { APIErrorCode } from "@notionhq/client";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitedError(
  error: unknown,
): error is { status: number; code?: string; headers?: Record<string, string> } {
  if (error && typeof error === "object" && "status" in error) {
    const err = error as { status: number; code?: string };
    return err.status === 429 || err.code === APIErrorCode.RateLimited;
  }
  return false;
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_RETRIES = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (isRateLimitedError(error) && attempt < MAX_RETRIES) {
        const retryAfter = error.headers?.["retry-after"];
        const baseDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
        const delay = baseDelay * Math.pow(2, attempt);
        console.debug(`Notion rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
