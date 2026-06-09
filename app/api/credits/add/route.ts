import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { MAX_TOTAL_CREDITS } from "@/lib/storage";
import { SIGNED_IN_FREE_CREDITS } from "@/lib/usage/constants";
import type { UsageSnapshot } from "@/lib/usage/quota";

interface AddCreditsBody {
  amount: number;
}

function isAddCreditsBody(value: unknown): value is AddCreditsBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.amount === "number" && record.amount > 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isAddCreditsBody(body)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError || !profile) {
    console.error("[credits/add] profile fetch error:", fetchError?.message);
    return NextResponse.json(
      { error: "Could not fetch profile" },
      { status: 500 },
    );
  }

  const currentCredits: number =
    typeof profile.credits === "number" ? profile.credits : 0;
  const creditsToAdd: number = Math.min(
    body.amount,
    MAX_TOTAL_CREDITS - currentCredits,
  );

  if (creditsToAdd <= 0) {
    const usage: UsageSnapshot = {
      signedIn: true,
      remaining: currentCredits,
      maxCredits: SIGNED_IN_FREE_CREDITS,
      requiresSignIn: false,
    };
    return NextResponse.json({ creditsAdded: 0, usage });
  }

  const newCredits: number = currentCredits + creditsToAdd;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", user.id);

  if (updateError) {
    console.error("[credits/add] update error:", updateError.message);
    return NextResponse.json(
      { error: "Could not update credits" },
      { status: 500 },
    );
  }

  const usage: UsageSnapshot = {
    signedIn: true,
    remaining: newCredits,
    maxCredits: SIGNED_IN_FREE_CREDITS,
    requiresSignIn: false,
  };

  return NextResponse.json({ creditsAdded: creditsToAdd, usage });
}
