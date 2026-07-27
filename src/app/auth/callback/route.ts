import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Handles the link Supabase emails out for "confirm your email" /
 * password-reset flows, and the redirect back from an OAuth provider (e.g.
 * Google). Exchanges the one-time code for a session, then sends the user
 * on to their dashboard.
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

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

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
  }

  return NextResponse.redirect(`${site}/`);
}
