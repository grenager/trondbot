import type { Profile } from "@/lib/supabase/types";
import { MAX_TOTAL_CREDITS } from "@/lib/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function clampCredits(credits: number): number {
  return Math.min(MAX_TOTAL_CREDITS, Math.max(0, credits));
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
