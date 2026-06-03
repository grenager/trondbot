import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/env";

export async function createClient() {
  const url: string | undefined = getSupabaseUrl();
  const anonKey: string | undefined = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail in Server Components; middleware keeps sessions fresh.
        }
      },
    },
  });
}
