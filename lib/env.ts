export function getAnthropicApiKey(): string | undefined {
  const raw: string | undefined = process.env.ANTHROPIC_API_KEY;
  if (!raw) {
    return undefined;
  }

  const trimmed: string = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isAnthropicApiKeyConfigured(): boolean {
  return getAnthropicApiKey() !== undefined;
}
