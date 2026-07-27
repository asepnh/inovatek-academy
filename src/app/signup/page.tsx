import Link from "next/link";
import { signUp } from "@/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const params = await searchParams;

  let inviteRole: string | null = null;
  if (params.invite) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("invites")
      .select("role, used_at, expires_at")
      .eq("token", params.invite)
      .maybeSingle();
    if (data && !data.used_at && new Date(data.expires_at) > new Date()) {
      inviteRole = data.role;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">
        {inviteRole ? `Create your ${inviteRole} account` : "Create a parent account"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {inviteRole
          ? `You're signing up via an invite link — your account will be set up as ${inviteRole === "admin" ? "an" : "a"} ${inviteRole}.`
          : "Sign up to enroll your child and manage payments. Staff (Mentor/Admin) accounts are set up by an academy administrator."}
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <form action={signUp} className="card mt-6 space-y-4">
        {params.invite && <input type="hidden" name="invite" value={params.invite} />}
        <div>
          <label className="label" htmlFor="full_name">Your full name</label>
          <input className="input" id="full_name" name="full_name" required autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input className="input" id="phone" name="phone" type="tel" placeholder="+60123456789" autoComplete="tel" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <button type="submit" className="btn w-full">Create account</button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-4">
        <GoogleSignInButton inviteToken={params.invite} />
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
