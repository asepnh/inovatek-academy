import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the link Supabase emails out for "confirm your email" /
 * password-reset flows. Exchanges the one-time code for a session, then
 * sends the user on to their dashboard.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${site}/`);
}
