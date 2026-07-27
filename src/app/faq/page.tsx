import Link from "next/link";

export const metadata = { title: "FAQ — Inovatek Academy" };

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I create an account?",
    a: (
      <>
        Go to the <Link href="/signup" className="text-brand-600 hover:underline">Sign up</Link> page
        and either continue with Google, or fill in your name, phone number, email, and a password.
        Every new account starts as a Parent account.
      </>
    ),
  },
  {
    q: "How do I enroll my child?",
    a: (
      <>
        Once signed in, go to <strong>My Students → Enroll a student</strong> and fill in your
        child&apos;s name and grade. A photo is optional — you can add one now or skip it and add
        it later from your child&apos;s page.
      </>
    ),
  },
  {
    q: "How do I register my child for a class?",
    a: (
      <>
        After adding your child, go to <strong>Browse Classes</strong>, pick a class, and select
        your child to register them. Your registration will show as &quot;pending&quot; until an
        admin approves it — you&apos;ll see it change to &quot;active&quot; once approved.
      </>
    ),
  },
  {
    q: "When do I need to pay, and how?",
    a: (
      <>
        Once your child&apos;s enrollment is active, a monthly fee is generated automatically. When
        it&apos;s ready, you&apos;ll see a <strong>Pay via FPX</strong> button on your Payments page —
        click it to pay securely online through your bank.
      </>
    ),
  },
  {
    q: "My payment shows \"Overdue\" — what should I do?",
    a: (
      <>
        Just go to your Payments page and click <strong>Pay via FPX</strong> for that entry. If you
        think this is a mistake, contact us using the number below.
      </>
    ),
  },
  {
    q: "How does attendance work?",
    a: (
      <>
        Each of your children has a QR code on their student page, downloadable as an image.
        Mentors use it (or a simple present/absent list) to record attendance during class — you
        don&apos;t need to do anything for this yourself.
      </>
    ),
  },
  {
    q: "Can I sign in with Google?",
    a: "Yes — on the Sign in or Sign up page, click \"Continue with Google\" instead of using a password.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Contact us using the number below and we'll help you regain access to your account.",
  },
  {
    q: "Can I add another child to my account?",
    a: "Yes — go to My Students and repeat the same \"Enroll a student\" steps for each child.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
      <p className="mt-2 text-sm text-slate-600">
        Quick answers to get you started. Still stuck? Contact Marsa below — happy to help.
      </p>

      <div className="mt-8 space-y-6">
        {FAQS.map((item, i) => (
          <div key={i} className="card text-left">
            <h2 className="font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8 text-center">
        <h2 className="font-semibold text-slate-900">Still have a question?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Contact Marsa at{" "}
          <a href="tel:+60123455460" className="font-medium text-brand-600 hover:underline">
            +60 12-345 5460
          </a>{" "}
          and we&apos;ll help you out.
        </p>
      </div>
    </main>
  );
}
