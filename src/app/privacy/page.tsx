import Link from "next/link";

export const metadata = { title: "Privacy Policy — Inovatek Academy" };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700">
        <p>
          Inovatek Solutions Sdn. Bhd. (&quot;Inovatek Academy,&quot; &quot;we,&quot;
          &quot;us&quot;) operates this website to manage student enrollment, class
          registration, monthly fee payments, and attendance tracking. This policy
          explains what information we collect, why, and how it&apos;s handled.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account information:</strong> name, email address, and phone
              number, provided when you sign up (directly or via Google Sign-In).
            </li>
            <li>
              <strong>Student information:</strong> a student&apos;s name, grade, and,
              optionally, a photo, provided by a parent/guardian when enrolling a
              child.
            </li>
            <li>
              <strong>Class and attendance records:</strong> which classes a student
              is enrolled in, and attendance logs recorded by mentors.
            </li>
            <li>
              <strong>Payment records:</strong> monthly fee amounts, due dates, and
              payment status. Actual card/bank details are handled directly by our
              payment processor, Billplz — we do not receive or store your card or
              bank account numbers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How we use this information</h2>
          <p className="mt-2">
            We use this information solely to operate the academy&apos;s day-to-day
            administration: managing enrollments, generating monthly invoices,
            processing payments, recording attendance, and sending in-app
            notifications (e.g. overdue payment reminders). We do not sell your
            information to third parties or use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Third-party services</h2>
          <p className="mt-2">This site relies on a small number of third-party services to operate:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Supabase</strong> — hosts our database, authentication, and file storage.</li>
            <li><strong>Billplz</strong> — processes FPX/online payments; handles your payment details directly.</li>
            <li><strong>Google Sign-In</strong> — an optional way to log in, if you choose to use it.</li>
            <li><strong>Vercel</strong> — hosts this website.</li>
          </ul>
          <p className="mt-2">
            Each of these providers has its own privacy policy governing how they
            handle data on our behalf.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Children&apos;s information</h2>
          <p className="mt-2">
            Student profiles are created and managed by a parent or guardian, not by
            the student directly. By enrolling a child, a parent/guardian consents
            to us processing that child&apos;s name, grade, attendance, and (if
            provided) photo, solely for academy administration purposes described
            above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data retention</h2>
          <p className="mt-2">
            We retain account and student records for as long as the account is
            active. If you&apos;d like your account or your child&apos;s records
            deleted, contact us using the details below and we&apos;ll act on that
            request, subject to any records we&apos;re required to keep for
            legal/accounting purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal
            data, or your child&apos;s, at any time by contacting us. Malaysian
            residents have rights under the Personal Data Protection Act 2010
            (PDPA).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact us</h2>
          <p className="mt-2">
            Questions about this policy or your data? Contact Inovatek Academy
            through the phone number or email provided to you at enrollment, or
            speak to an administrator directly.
          </p>
        </section>

        <p className="text-xs text-slate-400">
          This is a general-purpose policy and not a substitute for legal advice.
          If your data-handling practices change materially, this policy should be
          reviewed and updated accordingly.
        </p>
      </div>
    </main>
  );
}
