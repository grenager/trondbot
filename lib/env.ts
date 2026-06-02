function readEnv(name: string): string | undefined {
  const raw: string | undefined = process.env[name];
  if (!raw) {
    return undefined;
  }

  const trimmed: string = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getAnthropicApiKey(): string | undefined {
  return readEnv("ANTHROPIC_API_KEY");
}

export function isAnthropicApiKeyConfigured(): boolean {
  return getAnthropicApiKey() !== undefined;
}

export function getSupabaseUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrl() !== undefined && getSupabaseAnonKey() !== undefined;
}
