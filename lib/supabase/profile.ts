import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";
import { INITIAL_FREE_CREDITS, MAX_TOTAL_CREDITS } from "@/lib/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function clampCredits(credits: number): number {
  return Math.min(MAX_TOTAL_CREDITS, Math.max(0, credits));
}

export function generateInviteCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)] ?? "a";
  }
  return code;
}

export function getDisplayNameFromUser(
  user: User | null | undefined,
): string | null {
  if (!user?.user_metadata || !isRecord(user.user_metadata)) {
    return null;
  }

  const metadata: Record<string, unknown> = user.user_metadata;

  if (
    typeof metadata.full_name === "string" &&
    metadata.full_name.trim().length > 0
  ) {
    return metadata.full_name.trim();
  }

  if (typeof metadata.name === "string" && metadata.name.trim().length > 0) {
    return metadata.name.trim();
  }

  const givenName: string =
    typeof metadata.given_name === "string" ? metadata.given_name.trim() : "";
  const familyName: string =
    typeof metadata.family_name === "string"
      ? metadata.family_name.trim()
      : "";
  const combinedName: string = [givenName, familyName]
    .filter((part) => part.length > 0)
    .join(" ");

  return combinedName.length > 0 ? combinedName : null;
}

export function resolveDisplayName(
  profile: Profile | null | undefined,
  user: User | null | undefined,
): string | null {
  if (profile?.display_name) {
    return profile.display_name;
  }

  return getDisplayNameFromUser(user);
}

export function getAvatarUrlFromUser(
  user: User | null | undefined,
): string | null {
  if (!user?.user_metadata || !isRecord(user.user_metadata)) {
    return null;
  }

  const metadata: Record<string, unknown> = user.user_metadata;

  if (
    typeof metadata.avatar_url === "string" &&
    metadata.avatar_url.trim().length > 0
  ) {
    return metadata.avatar_url.trim();
  }

  if (
    typeof metadata.picture === "string" &&
    metadata.picture.trim().length > 0
  ) {
    return metadata.picture.trim();
  }

  return null;
}

export function parseProfile(value: unknown): Profile | null {
  if (!isRecord(value)) {
    return null;
  }

  const {
    id,
    email,
    display_name,
    credits,
    invite_code,
    created_at,
    updated_at,
  } = value;

  if (
    typeof id !== "string" ||
    (email !== null && typeof email !== "string") ||
    (display_name !== null && typeof display_name !== "string") ||
    typeof credits !== "number" ||
    typeof invite_code !== "string" ||
    typeof created_at !== "string" ||
    typeof updated_at !== "string"
  ) {
    return null;
  }

  return {
    id,
    email: email ?? null,
    display_name: display_name ?? null,
    credits: clampCredits(credits),
    invite_code,
    created_at,
    updated_at,
  };
}
