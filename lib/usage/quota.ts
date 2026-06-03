import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  ANONYMOUS_FREE_MESSAGES,
  GUEST_SCENARIO_ID,
  SIGNED_IN_FREE_CREDITS,
} from "@/lib/usage/constants";
import {
  getAnonymousRemaining,
  isAnonymousQuotaExhausted,
  readDeviceUsage,
  type DeviceUsagePayload,
} from "@/lib/usage/deviceCookie";
import type { ScenarioId } from "@/lib/scenarios";

export interface UsageSnapshot {
  signedIn: boolean;
  remaining: number;
  maxCredits: number;
  requiresSignIn: boolean;
}

export interface QuotaErrorBody {
  error: string;
  code: "SIGN_IN_REQUIRED" | "NO_CREDITS" | "GUEST_SCENARIO_ONLY";
}

export function createQuotaErrorResponse(
  body: QuotaErrorBody,
  status: number,
  usage: UsageSnapshot,
): NextResponse {
  return NextResponse.json({ ...body, usage }, { status });
}

export async function getUsageSnapshot(): Promise<UsageSnapshot> {
  const cookieStore = await cookies();
  const deviceUsage: DeviceUsagePayload = await readDeviceUsage(cookieStore);

  if (!isSupabaseConfigured()) {
    const remaining: number = getAnonymousRemaining(deviceUsage);
    return {
      signedIn: false,
      remaining,
      maxCredits: ANONYMOUS_FREE_MESSAGES,
      requiresSignIn: isAnonymousQuotaExhausted(deviceUsage),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .maybeSingle();

      const credits: number =
        typeof profile?.credits === "number" && Number.isFinite(profile.credits)
          ? Math.max(0, Math.floor(profile.credits))
          : 0;

      if (error) {
        return {
          signedIn: true,
          remaining: 0,
          maxCredits: SIGNED_IN_FREE_CREDITS,
          requiresSignIn: false,
        };
      }

      return {
        signedIn: true,
        remaining: credits,
        maxCredits: SIGNED_IN_FREE_CREDITS,
        requiresSignIn: false,
      };
    }
  } catch {
    // Fall back to anonymous usage if Supabase is unavailable.
  }

  const remaining: number = getAnonymousRemaining(deviceUsage);
  return {
    signedIn: false,
    remaining,
    maxCredits: ANONYMOUS_FREE_MESSAGES,
    requiresSignIn: isAnonymousQuotaExhausted(deviceUsage),
  };
}

export function assertGuestScenarioAllowed(
  scenario: ScenarioId,
  signedIn: boolean,
): NextResponse | null {
  if (signedIn || scenario === GUEST_SCENARIO_ID) {
    return null;
  }

  return createQuotaErrorResponse(
    {
      error: "Sign in to try other conversation topics.",
      code: "GUEST_SCENARIO_ONLY",
    },
    403,
    {
      signedIn: false,
      remaining: 0,
      maxCredits: ANONYMOUS_FREE_MESSAGES,
      requiresSignIn: true,
    },
  );
}

export async function spendMessageCredit(): Promise<{
  ok: boolean;
  response?: NextResponse;
  usage: UsageSnapshot;
  deviceUsage?: DeviceUsagePayload;
}> {
  const cookieStore = await cookies();
  const deviceUsage: DeviceUsagePayload = await readDeviceUsage(cookieStore);

  if (!isSupabaseConfigured()) {
    if (isAnonymousQuotaExhausted(deviceUsage)) {
      return {
        ok: false,
        response: createQuotaErrorResponse(
          {
            error: "You have used your free messages. Sign in with Google to continue.",
            code: "SIGN_IN_REQUIRED",
          },
          402,
          {
            signedIn: false,
            remaining: 0,
            maxCredits: ANONYMOUS_FREE_MESSAGES,
            requiresSignIn: true,
          },
        ),
        usage: {
          signedIn: false,
          remaining: 0,
          maxCredits: ANONYMOUS_FREE_MESSAGES,
          requiresSignIn: true,
        },
      };
    }

    const updatedDeviceUsage: DeviceUsagePayload = {
      ...deviceUsage,
      messagesUsed: deviceUsage.messagesUsed + 1,
    };

    return {
      ok: true,
      deviceUsage: updatedDeviceUsage,
      usage: {
        signedIn: false,
        remaining: getAnonymousRemaining(updatedDeviceUsage),
        maxCredits: ANONYMOUS_FREE_MESSAGES,
        requiresSignIn: isAnonymousQuotaExhausted(updatedDeviceUsage),
      },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: remainingCredits, error } = await supabase.rpc(
        "spend_message_credit",
      );

      if (error) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Could not update credits." },
            { status: 500 },
          ),
          usage: {
            signedIn: true,
            remaining: 0,
            maxCredits: SIGNED_IN_FREE_CREDITS,
            requiresSignIn: false,
          },
        };
      }

      if (typeof remainingCredits !== "number" || remainingCredits < 0) {
        return {
          ok: false,
          response: createQuotaErrorResponse(
            {
              error: "You are out of messages. Buy more credits to continue.",
              code: "NO_CREDITS",
            },
            402,
            {
              signedIn: true,
              remaining: 0,
              maxCredits: SIGNED_IN_FREE_CREDITS,
              requiresSignIn: false,
            },
          ),
          usage: {
            signedIn: true,
            remaining: 0,
            maxCredits: SIGNED_IN_FREE_CREDITS,
            requiresSignIn: false,
          },
        };
      }

      return {
        ok: true,
        usage: {
          signedIn: true,
          remaining: remainingCredits,
          maxCredits: SIGNED_IN_FREE_CREDITS,
          requiresSignIn: false,
        },
      };
    }
  } catch {
    // Fall through to anonymous handling.
  }

  if (isAnonymousQuotaExhausted(deviceUsage)) {
    return {
      ok: false,
      response: createQuotaErrorResponse(
        {
          error: "You have used your free messages. Sign in with Google to continue.",
          code: "SIGN_IN_REQUIRED",
        },
        402,
        {
          signedIn: false,
          remaining: 0,
          maxCredits: ANONYMOUS_FREE_MESSAGES,
          requiresSignIn: true,
        },
      ),
      usage: {
        signedIn: false,
        remaining: 0,
        maxCredits: ANONYMOUS_FREE_MESSAGES,
        requiresSignIn: true,
      },
    };
  }

  const updatedDeviceUsage: DeviceUsagePayload = {
    ...deviceUsage,
    messagesUsed: deviceUsage.messagesUsed + 1,
  };

  return {
    ok: true,
    deviceUsage: updatedDeviceUsage,
    usage: {
      signedIn: false,
      remaining: getAnonymousRemaining(updatedDeviceUsage),
      maxCredits: ANONYMOUS_FREE_MESSAGES,
      requiresSignIn: isAnonymousQuotaExhausted(updatedDeviceUsage),
    },
  };
}

export async function attachUsageToResponse<T extends object>(
  body: T,
  usage: UsageSnapshot,
  deviceUsage?: DeviceUsagePayload,
): Promise<NextResponse> {
  const jsonResponse = NextResponse.json({ ...body, usage });

  if (deviceUsage) {
    const { writeDeviceUsageCookie } = await import("@/lib/usage/deviceCookie");
    await writeDeviceUsageCookie(jsonResponse, deviceUsage);
  }

  return jsonResponse;
}
