import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const ADMIN_EMAIL = "grenager@gmail.com";
const TARGET_CREDITS = 500;

export async function POST(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Update own profile (RLS allows updating own row)
  const { data: ownUpdate, error: ownError } = await supabase
    .from("profiles")
    .update({ credits: TARGET_CREDITS })
    .eq("id", user.id)
    .select("id, email, credits");

  if (ownError) {
    console.error("[admin/grant-credits] own update error:", ownError.message);
    return NextResponse.json({ error: ownError.message }, { status: 500 });
  }

  // For other users, use an RPC that runs as SECURITY DEFINER
  const { data: allUpdated, error: rpcError } = await supabase.rpc(
    "admin_grant_credits",
    { target_credits: TARGET_CREDITS },
  );

  if (rpcError) {
    console.error("[admin/grant-credits] RPC error:", rpcError.message);
    return NextResponse.json({
      ownUpdate,
      rpcError: rpcError.message,
      hint: "Run this SQL in Supabase dashboard: CREATE OR REPLACE FUNCTION admin_grant_credits(target_credits integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE updated_count integer; BEGIN UPDATE profiles SET credits = target_credits WHERE credits < target_credits; GET DIAGNOSTICS updated_count = ROW_COUNT; RETURN updated_count; END; $$; GRANT EXECUTE ON FUNCTION admin_grant_credits(integer) TO authenticated;",
    }, { status: 207 });
  }

  return NextResponse.json({ ownUpdate, otherUsersUpdated: allUpdated });
}
