import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

    const refValue: unknown = (body as { ref?: unknown }).ref;
    if (typeof refValue !== "string" || refValue.trim().length === 0) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("redeem_referral", {
      ref_code: refValue.trim(),
    });

    if (error) {
      return NextResponse.json(
        { error: "Could not redeem referral." },
        { status: 500 },
      );
    }

    return NextResponse.json({ redeemed: data === true });
  } catch {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }
}
