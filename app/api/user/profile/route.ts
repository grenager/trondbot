import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clampCredits, parseProfile } from "@/lib/supabase/profile";

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

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
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
