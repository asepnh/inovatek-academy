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
 * signup. GoogleSignInButton stashes it in a `pending_invite` cookie before
 * redirecting to Google (NOT a query param on redirectTo -- Supabase
 * appends its own ?code=... to that URL and doesn't reliably preserve an
 * ?invite=... already there, silently dropping it). We read that cookie
 * here instead, same validation rules as signUp(): unused, not expired.
 * handle_new_user() will have already created the profile as 'parent' by
 * the time we get here, so we just promote it.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const inviteToken = req.cookies.get("pending_invite")?.value;
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!code) {
    return NextResponse.redirect(`${site}/login?error=` + encodeURIComponent("Missing auth code."));
  }

  const response = NextResponse.redirect(`${site}/`);
  response.cookies.delete("pending_invite");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${site}/login?error=` + encodeURIComponent(error.message));
  }

  if (inviteToken && data.user) {
    const adminClient = createAdminClient();
    const { data: invite } = await adminClient
      .from("invites")
      .select("id, role, used_at, expires_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (invite && !invite.used_at && new Date(invite.expires_at) > new Date()) {
      await adminClient.from("profiles").update({ role: invite.role }).eq("id", data.user.id);
      await adminClient
        .from("invites")
        .update({ used_by: data.user.id, used_at: new Date().toISOString() })
        .eq("id", invite.id);
    }
  }

  return response;
}
