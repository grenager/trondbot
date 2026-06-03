function trimEnv(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed: string = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getAnthropicApiKey(): string | undefined {
  return trimEnv(process.env.ANTHROPIC_API_KEY);
}

export function isAnthropicApiKeyConfigured(): boolean {
  return getAnthropicApiKey() !== undefined;
}

export function getSupabaseUrl(): string | undefined {
  // Must use static property access so Next.js inlines this on the client.
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  // Must use static property access so Next.js inlines these on the client.
  return (
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrl() !== undefined && getSupabaseAnonKey() !== undefined;
}

export function getUsageHmacSecret(): string {
  return (
    trimEnv(process.env.USAGE_HMAC_SECRET) ??
    trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    "trondbot-dev-usage-secret"
  );
}
