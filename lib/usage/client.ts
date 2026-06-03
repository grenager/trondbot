export interface UsageSnapshot {
  signedIn: boolean;
  remaining: number;
  maxCredits: number;
  requiresSignIn: boolean;
}

export function parseUsageSnapshot(value: unknown): UsageSnapshot | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.signedIn !== "boolean" ||
    typeof record.remaining !== "number" ||
    !Number.isFinite(record.remaining) ||
    typeof record.maxCredits !== "number" ||
    !Number.isFinite(record.maxCredits) ||
    typeof record.requiresSignIn !== "boolean"
  ) {
    return null;
  }

  return {
    signedIn: record.signedIn,
    remaining: Math.max(0, Math.floor(record.remaining)),
    maxCredits: Math.max(0, Math.floor(record.maxCredits)),
    requiresSignIn: record.requiresSignIn,
  };
}

export function applyUsageFromApiResponse(
  data: unknown,
  onUsageUpdate: (usage: UsageSnapshot) => void,
): UsageSnapshot | null {
  if (typeof data !== "object" || data === null || !("usage" in data)) {
    return null;
  }

  const parsed: UsageSnapshot | null = parseUsageSnapshot(
    (data as { usage: unknown }).usage,
  );
  if (parsed) {
    onUsageUpdate(parsed);
  }
  return parsed;
}

export async function fetchUsageSnapshot(): Promise<UsageSnapshot | null> {
  try {
    const response = await fetch("/api/usage");
    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("usage" in data)) {
      return null;
    }

    return parseUsageSnapshot((data as { usage: unknown }).usage);
  } catch {
    return null;
  }
}
