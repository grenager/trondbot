import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_NEXT_COOKIE_NAME,
  sanitizeAuthNextPath,
} from "@/lib/auth/oauthRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code: string | null = searchParams.get("code");
  const cookieStore = await cookies();
  const cookieNextRaw: string | undefined = cookieStore.get(AUTH_NEXT_COOKIE_NAME)
    ?.value;
  const cookieNext: string | null = cookieNextRaw
    ? decodeURIComponent(cookieNextRaw)
    : null;
  const nextFromQuery: string | null = searchParams.get("next");
  const next: string = sanitizeAuthNextPath(
    cookieNext ?? nextFromQuery ?? "/",
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set(AUTH_NEXT_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
      return response;
    }
  }

  const response = NextResponse.redirect(`${origin}/?auth=error`);
  response.cookies.set(AUTH_NEXT_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
