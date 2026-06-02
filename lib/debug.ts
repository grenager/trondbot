const DEBUG_ENABLED: boolean = process.env.NODE_ENV !== "production";

export function debugLog(scope: string, message: string, detail?: unknown): void {
  if (!DEBUG_ENABLED) {
    return;
  }

  const timestamp: string = new Date().toISOString();
  if (detail === undefined) {
    console.log(`[trondbot:${scope}] ${timestamp} ${message}`);
    return;
  }

  console.log(`[trondbot:${scope}] ${timestamp} ${message}`, detail);
}
