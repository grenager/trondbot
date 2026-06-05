export const AUTH_NEXT_COOKIE_NAME = "trondbot-auth-next";

const AUTH_NEXT_MAX_AGE_SECONDS = 600;

export function sanitizeAuthNextPath(path: string | null | undefined): string {
  if (!path) {
    return "/";
  }

  const trimmed: string = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}

export function setAuthNextPath(nextPath: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const safePath: string = sanitizeAuthNextPath(nextPath);
  document.cookie = `${AUTH_NEXT_COOKIE_NAME}=${encodeURIComponent(safePath)}; path=/; max-age=${AUTH_NEXT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getAuthCallbackUrl(): string {
  const siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, "")}/auth/callback`;
  }
  if (typeof window === "undefined") {
    return "https://www.trondbot.com/auth/callback";
  }
  return `${window.location.origin}/auth/callback`;
}

export function prepareAuthNextPath(nextPath?: string): void {
  if (!nextPath) {
    return;
  }
  setAuthNextPath(nextPath);
}
