import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const MAX_MEMORIES: number = 10;

export async function fetchRecentMemories(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("memories")
      .select("content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_MEMORIES);

    if (error || !data) {
      return [];
    }

    return data.map((row: { content: string }) => row.content);
  } catch {
    return [];
  }
}
