import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  clampCredits,
  generateInviteCode,
  parseProfile,
} from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import { INITIAL_FREE_CREDITS } from "@/lib/storage";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getOrCreateProfile(
  supabase: SupabaseServerClient,
  user: User,
): Promise<Profile | null> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return null;
  }

  if (existing) {
    return parseProfile(existing);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      credits: INITIAL_FREE_CREDITS,
      invite_code: generateInviteCode(),
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return null;
  }

  return parseProfile(inserted);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile: Profile | null = await getOrCreateProfile(supabase, user);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const creditsValue: unknown = (body as { credits?: unknown }).credits;
    if (typeof creditsValue !== "number" || !Number.isFinite(creditsValue)) {
      return NextResponse.json({ error: "Invalid credits value" }, { status: 400 });
    }

    const credits: number = clampCredits(creditsValue);

    const existingProfile: Profile | null = await getOrCreateProfile(
      supabase,
      user,
    );
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ credits })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    const profile = parseProfile(data);
    if (!profile) {
      return NextResponse.json(
        { error: "Invalid profile data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }
}
