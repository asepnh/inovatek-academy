import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Handles the link Supabase emails out for "confirm your email" /
 * password-reset flows, and the redirect back from an OAuth provider (e.g.
 * Google). Exchanges the one-time code for a session, then sends the user
 * on to their dashboard.
 *
 * Builds the redirect response FIRST and writes the session cookies
 * directly onto it (rather than using the shared createClient() helper,
 * which writes via next/headers's cookies()) -- a well-known @supabase/ssr
 * + Next.js Route Handler gotcha where cookies written that way aren't
 * reliably attached to a separately-constructed NextResponse.redirect(),
 * silently dropping the session.
 *
 * Google sign-in doesn't go through our own signUp() server action (it's a
 * provider-hosted redirect straight to Supabase then back here), so an
 * invite-link token can't be consumed there like it is for email/password
 * signup. Instead GoogleSignInButton appends ?invite=<token> to the
 * redirectTo URL, and we consume/validate it here, same rules as signUp():
 * unused, not expired. handle_new_user() will have already created the
 * profile as 'parent' by the time we get here, so we just promote it.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const inviteToken = req.nextUrl.searchParams.get("invite");
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!code) {
    return NextResponse.redirect(`${site}/login?error=` + encodeURIComponent("Missing auth code."));
  }

  const setCookieNames: string[] = [];
  const response = NextResponse.redirect(`${site}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookieNames.push(name);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  // TEMPORARY debug: confirm exactly what the exchange produced and what
  // origin/cookies we're working with, since sign-in has been silently
  // failing with no visible error. Redirects to the SAME `response` object
  // (so any cookies already attached to it travel along too) with its
  // Location header swapped to carry debug info.
  const debugUrl = new URL(`${site}/login`);
  debugUrl.searchParams.set(
    "debug",
    JSON.stringify({
      reqOrigin: req.nextUrl.origin,
      siteEnv: site,
      hadError: error ? error.message : null,
      userId: data?.user?.id ?? null,
      cookiesSet: setCookieNames,
    })
  );
  response.headers.set("location", debugUrl.toString());
  return response;
}
