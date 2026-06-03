import { NextResponse } from "next/server";
import { getUsageSnapshot } from "@/lib/usage/quota";

export async function GET(): Promise<NextResponse> {
  const usage = await getUsageSnapshot();
  return NextResponse.json({ usage });
}
