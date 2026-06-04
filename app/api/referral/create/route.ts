import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateReferralInviteRow {
  invite_code: string;
  credits: number;
  grace_credits: number;
}

function isCreateReferralInviteRow(value: unknown): value is CreateReferralInviteRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record: Record<string, unknown> = value as Record<string, unknown>;
  return (
    typeof record.invite_code === "string" &&
    typeof record.credits === "number" &&
    Number.isFinite(record.credits) &&
    typeof record.grace_credits === "number" &&
    Number.isFinite(record.grace_credits)
  );
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("create_referral_invite");

    if (error) {
      if (error.message.includes("PENDING_REFERRAL_CAP")) {
        return NextResponse.json(
          { error: "PENDING_REFERRAL_CAP" },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Could not create referral invite." },
        { status: 500 },
      );
    }

    const rows: unknown = data;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid referral invite response." },
        { status: 500 },
      );
    }

    const row: unknown = rows[0];
    if (!isCreateReferralInviteRow(row)) {
      return NextResponse.json(
        { error: "Invalid referral invite response." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      inviteCode: row.invite_code,
      credits: Math.max(0, Math.floor(row.credits)),
      graceCredits: Math.max(0, Math.floor(row.grace_credits)),
    });
  } catch {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }
}
