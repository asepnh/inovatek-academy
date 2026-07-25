import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = (profile?.role as UserRole) ?? "parent";
    redirect(role === "admin" ? "/admin" : role === "mentor" ? "/mentor" : "/parent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Inovatek Academy
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        Enroll your child, register for courses, pay monthly fees online, and
        track attendance and payment status — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/signup" className="btn">
          Get started
        </Link>
        <Link href="/login" className="btn-secondary">
          Sign in
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card text-left">
          <h2 className="font-semibold text-slate-900">Enroll &amp; register</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add your child and sign up for courses in a few clicks.
          </p>
        </div>
        <div className="card text-left">
          <h2 className="font-semibold text-slate-900">Pay online (FPX)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Secure monthly payments via Billplz, with reminders if you fall behind.
          </p>
        </div>
        <div className="card text-left">
          <h2 className="font-semibold text-slate-900">QR attendance</h2>
          <p className="mt-1 text-sm text-slate-600">
            Every student gets a QR code mentors scan to record attendance.
          </p>
        </div>
      </div>
    </main>
  );
}
