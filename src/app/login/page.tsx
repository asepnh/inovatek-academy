import Link from "next/link";
import { signIn } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Welcome back to Inovatek Academy.</p>

      {params.message && (
        <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {params.message}
        </div>
      )}
      {params.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <div className="mt-6">
        <GoogleSignInButton />
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={signIn} className="card mt-4 space-y-4">
        <input type="hidden" name="next" value={params.next ?? ""} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn w-full">Sign in</button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
