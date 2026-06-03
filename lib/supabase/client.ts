import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/env";

export function createClient() {
  const url: string | undefined = getSupabaseUrl();
  const anonKey: string | undefined = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient(url, anonKey);
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrl() !== undefined && getSupabaseAnonKey() !== undefined;
}
