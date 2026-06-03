import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  generateInviteCode,
  getDisplayNameFromUser,
  parseProfile,
} from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import { INITIAL_FREE_CREDITS } from "@/lib/storage";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getOrCreateProfile(
  supabase: SupabaseServerClient,
  user: User,
): Promise<Profile | null> {
  const authDisplayName: string | null = getDisplayNameFromUser(user);
  const authEmail: string | null = user.email ?? null;

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return null;
  }

  if (existing) {
    const profile: Profile | null = parseProfile(existing);
    if (!profile) {
      return null;
    }

    const updates: {
      display_name?: string;
      email?: string;
    } = {};

    if (!profile.display_name && authDisplayName) {
      updates.display_name = authDisplayName;
    }

    if (!profile.email && authEmail) {
      updates.email = authEmail;
    }

    if (Object.keys(updates).length === 0) {
      return profile;
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return profile;
    }

    return parseProfile(updated);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: authEmail,
      display_name: authDisplayName,
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

    const updates: {
      display_name?: string | null;
    } = {};

    const displayNameValue: unknown = (body as { display_name?: unknown })
      .display_name;
    if (displayNameValue !== undefined) {
      if (
        displayNameValue !== null &&
        (typeof displayNameValue !== "string" ||
          displayNameValue.trim().length === 0)
      ) {
        return NextResponse.json(
          { error: "Invalid display name value" },
          { status: 400 },
        );
      }
      updates.display_name =
        typeof displayNameValue === "string"
          ? displayNameValue.trim()
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
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
