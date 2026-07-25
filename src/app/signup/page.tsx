import Link from "next/link";
import { signUp } from "@/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Create a parent account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Sign up to enroll your child and manage payments. Staff (Mentor/Admin)
        accounts are set up by an academy administrator.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <form action={signUp} className="card mt-6 space-y-4">
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

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
