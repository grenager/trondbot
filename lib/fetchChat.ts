import { debugLog } from "./debug";

const CHAT_FETCH_TIMEOUT_MS: number = 90_000;

export async function fetchChat(body: unknown): Promise<Response> {
  const controller: AbortController = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
    debugLog("chat", "fetchChat: aborting due to timeout", {
      timeoutMs: CHAT_FETCH_TIMEOUT_MS,
    });
    controller.abort();
  }, CHAT_FETCH_TIMEOUT_MS);

  try {
    return await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getFetchErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "The request timed out. Please try again.";
  }

  return error instanceof Error ? error.message : fallback;
}
