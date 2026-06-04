import {
  REFERRAL_COMPLETION_CREDITS,
  REFERRAL_GRACE_CREDITS,
  REF_CODE_STORAGE_KEY,
} from "@/lib/referral/constants";

export interface CreateReferralInviteResponse {
  inviteCode: string;
  credits: number;
  graceCredits: number;
}

export interface RedeemReferralResponse {
  redeemed: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseCreateReferralInviteResponse(
  value: unknown,
): CreateReferralInviteResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const inviteCode: unknown = value.inviteCode;
  const credits: unknown = value.credits;
  const graceCredits: unknown = value.graceCredits;

  if (
    typeof inviteCode !== "string" ||
    typeof credits !== "number" ||
    !Number.isFinite(credits) ||
    typeof graceCredits !== "number" ||
    !Number.isFinite(graceCredits)
  ) {
    return null;
  }

  return {
    inviteCode,
    credits: Math.max(0, Math.floor(credits)),
    graceCredits: Math.max(0, Math.floor(graceCredits)),
  };
}

export function parseRedeemReferralResponse(
  value: unknown,
): RedeemReferralResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const redeemed: unknown = value.redeemed;
  if (typeof redeemed !== "boolean") {
    return null;
  }

  return { redeemed };
}

export function storeReferralCode(refCode: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed: string = refCode.trim();
  if (trimmed.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(REF_CODE_STORAGE_KEY, trimmed);
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

export function readStoredReferralCode(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored: string | null = window.localStorage.getItem(REF_CODE_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const trimmed: string = stored.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(REF_CODE_STORAGE_KEY);
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

export async function createReferralInvite(): Promise<{
  data: CreateReferralInviteResponse | null;
  error: string | null;
}> {
  try {
    const response = await fetch("/api/referral/create", {
      method: "POST",
    });

    const body: unknown = await response.json();

    if (!response.ok) {
      if (
        isRecord(body) &&
        typeof body.error === "string" &&
        body.error.length > 0
      ) {
        return { data: null, error: body.error };
      }
      return { data: null, error: "Could not create referral invite." };
    }

    const parsed: CreateReferralInviteResponse | null =
      parseCreateReferralInviteResponse(body);
    if (!parsed) {
      return { data: null, error: "Invalid referral invite response." };
    }

    return { data: parsed, error: null };
  } catch {
    return { data: null, error: "Could not create referral invite." };
  }
}

export async function redeemStoredReferral(): Promise<RedeemReferralResponse | null> {
  const refCode: string | null = readStoredReferralCode();
  if (!refCode) {
    return null;
  }

  try {
    const response = await fetch("/api/referral/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: refCode }),
    });

    clearStoredReferralCode();

    if (!response.ok) {
      return { redeemed: false };
    }

    const body: unknown = await response.json();
    return parseRedeemReferralResponse(body) ?? { redeemed: false };
  } catch {
    clearStoredReferralCode();
    return { redeemed: false };
  }
}

export function getReferralGraceMessage(
  graceCredits: number = REFERRAL_GRACE_CREDITS,
  completionCredits: number = REFERRAL_COMPLETION_CREDITS,
): string {
  return `${graceCredits} credits added! You'll earn ${completionCredits} more when your friend signs in.`;
}
