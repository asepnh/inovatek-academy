import Link from "next/link";

export const metadata = { title: "Terms of Service — Inovatek Academy" };

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700">
        <p>
          These terms govern your use of this website, operated by Inovatek
          Solutions Sdn. Bhd. (&quot;Inovatek Academy,&quot; &quot;we,&quot;
          &quot;us&quot;) to manage student enrollment, class registration, fee
          payments, and attendance. By creating an account, you agree to these
          terms.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p className="mt-2">
            You&apos;re responsible for keeping your login credentials secure and
            for all activity under your account. Parent accounts are used to
            enroll and manage your own children only. Mentor and admin accounts
            are issued by an academy administrator and should not be shared.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Enrollment &amp; fees</h2>
          <p className="mt-2">
            Submitting an enrollment request does not guarantee a place in a
            class — enrollments are subject to admin approval. Monthly fees are
            billed automatically for active enrollments and are due as shown on
            your Payments page. Fee amounts and billing cycles may change from
            time to time; we&apos;ll reflect any changes in the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
          <p className="mt-2">
            Online payments are processed by our third-party payment provider,
            Billplz, via FPX. We do not store your card or bank account details.
            Refunds, where applicable, are handled at the academy&apos;s
            discretion — contact an administrator to request one.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Attendance &amp; conduct</h2>
          <p className="mt-2">
            Attendance is recorded by mentors for each class session. Please
            ensure your child&apos;s enrollment status is active and their QR
            code (if used) is available at class time. We reserve the right to
            suspend or remove access for accounts used in a way that disrupts
            the academy&apos;s operation or other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
          <p className="mt-2">
            We aim to keep this site available and reliable, but we don&apos;t
            guarantee uninterrupted access. Features may be added, changed, or
            removed over time as the academy&apos;s needs evolve.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Limitation of liability</h2>
          <p className="mt-2">
            This site is provided on an &quot;as is&quot; basis. To the extent
            permitted by law, Inovatek Solutions Sdn. Bhd. is not liable for
            indirect or incidental damages arising from your use of the site.
            Nothing here limits liability that cannot be limited under Malaysian
            law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes to these terms</h2>
          <p className="mt-2">
            We may update these terms from time to time. Continuing to use the
            site after changes are posted means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact us</h2>
          <p className="mt-2">
            Questions about these terms? Contact Inovatek Academy through the
            phone number or email provided to you at enrollment, or speak to an
            administrator directly.
          </p>
        </section>

        <p className="text-xs text-slate-400">
          See also our{" "}
          <Link href="/privacy" className="text-brand-600 hover:underline">
            Privacy Policy
          </Link>
          . This is a general-purpose template and not a substitute for legal
          advice specific to your situation.
        </p>
      </div>
    </main>
  );
}
