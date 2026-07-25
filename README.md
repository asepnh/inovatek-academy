# Inovatek Academy

A web app for parents/students to enroll, register for classes, pay monthly
fees via Billplz FPX, and for mentors to track attendance by scanning each
student's QR code.

Roles: **Admin**, **Mentor**, **Parent/Student**.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)
- Billplz API v3 (FPX payments)
- `qrcode` (generate each student's QR) + `html5-qrcode` (mentor's camera scanner)

## 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A free [Supabase](https://supabase.com) project
- A [Billplz](https://www.billplz.com) account — use the **sandbox** account
  while testing (`https://www.billplz-sandbox.com`), a separate **production**
  account when you go live

## 2. Install dependencies

This project's `node_modules` isn't included. From the project folder:

```bash
npm install
```

## 3. Set up Supabase

1. Create a new Supabase project.
2. Open the SQL editor and run the contents of
   `supabase/migrations/0001_init.sql`. This creates every table, the
   `admin`/`mentor`/`parent` roles, and all Row Level Security policies.
3. In **Authentication → URL Configuration**, set the Site URL to your app's
   URL (e.g. `http://localhost:3000` for local dev, or your Vercel URL once
   deployed), and add `{SITE_URL}/auth/callback` as a redirect URL.
4. (Optional, for faster local testing) In **Authentication → Providers →
   Email**, you can turn off "Confirm email" so new accounts can sign in
   immediately without clicking an email link.
5. Copy your project's URL, `anon` public key, and `service_role` secret key
   from **Settings → API** — you'll need them in the next step.

## 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from Supabase (step 3.5)
- `NEXT_PUBLIC_SITE_URL` — your app's public URL. **Billplz's servers must be
  able to reach `{SITE_URL}/api/billplz/callback`**, so for local dev use a
  tunnel like `ngrok http 3000` and put the ngrok URL here temporarily.
- `BILLPLZ_ENV` — `sandbox` while testing, `production` when live (these are
  **separate Billplz accounts** with separate credentials)
- `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY` —
  from your Billplz account (Settings → API keys / Collections)
- `CRON_SECRET` — any long random string; protects the monthly billing job

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`, click **Get started** to create a parent
account, then in the Supabase SQL editor promote yourself to admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in — you'll now land on the Admin dashboard. From
**Admin → Classes** create your first class; from **Admin → Users** you can
promote any signed-up account to Mentor (mentors can't self-register as
mentors — an admin has to grant that role, so nobody can escalate their own
access).

## 6. How the pieces fit together

- **Enrollment**: a parent adds a student (name, grade, and the parent's own
  name/email/phone) under **My Students → Enroll a student**.
- **Class registration**: parents browse active classes and register a
  student; new enrollments start as `pending` until an admin approves them
  under **Admin → Enrollments** (flip to `active`).
- **Monthly payments**: call `/api/cron/generate-invoices?secret=YOUR_CRON_SECRET`
  once a month (see below) to create this month's payment row for every
  `active` enrollment and flag any unpaid-past-due payment as `overdue`
  (which also creates an in-app reminder for the parent). Parents pay from
  **Payments → Pay via FPX**, which creates a Billplz bill and redirects to
  Billplz's hosted FPX payment page.
- **Payment confirmation**: Billplz calls `/api/billplz/callback` after a
  payment attempt. That handler re-fetches the bill directly from Billplz's
  API (using your secret API key) before marking anything as paid — see the
  comment in `src/lib/billplz.ts` for why (Billplz's public docs don't fully
  spell out the X-Signature source-string format, so we treat the
  authenticated API call as the source of truth rather than trusting posted
  form fields outright). **Test this end-to-end against the Billplz sandbox
  before going live.**
- **QR codes**: every student gets a unique QR code (their `qr_token`),
  viewable/downloadable from their student page.
- **Attendance**: a mentor opens **Scan Attendance**, picks a class, and
  scans students' QR codes with their device camera. Each scan calls
  `/api/attendance/scan`, which only succeeds if that student is actively
  enrolled in the selected class (enforced both by the app logic and by
  Row Level Security).
- **In-app reminders**: overdue payments show as a red banner on the
  parent's dashboard (from the `notifications` table) — no email/SMS
  provider is wired up, per your setup choice.

## 7. Scheduling the monthly billing job

Pick one:

- **Vercel Cron** (if deploying to Vercel): `vercel.json` already defines a
  cron entry that hits `/api/cron/generate-invoices` at 1am on the 1st of
  each month. Replace `REPLACE_WITH_YOUR_CRON_SECRET` in `vercel.json` with
  your real `CRON_SECRET` value before deploying (Vercel Cron requests don't
  let you attach a header from `vercel.json`, so the secret travels in the
  query string here — keep it long and random).
- **Any other host / GitHub Actions**: run `npm run generate-invoices`
  (wraps `scripts/generate-invoices.ts`) on a schedule, with
  `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in that
  environment.

## 8. Deploying

1. Push this project to a Git repository.
2. Import it into [Vercel](https://vercel.com) (or any Next.js host).
3. Add all the variables from `.env.local` as environment variables in your
   hosting provider.
4. Update `NEXT_PUBLIC_SITE_URL` to your real production URL, and update the
   Supabase Auth redirect URL / Billplz webhook reachability accordingly.
5. Switch `BILLPLZ_ENV` to `production` and swap in your production Billplz
   credentials once you're ready to accept real payments.

## 9. Customizing

- **Grade options**: edit the list in `src/lib/grades.ts`.
- **Currency/formatting**: `src/lib/format.ts` (defaults to MYR).
- **Branding/colors**: `tailwind.config.ts` (the `brand` color scale) and
  `src/app/page.tsx` for the landing page copy.

## 10. Known limitations / next steps

- Reminders are in-app only (a banner on the parent dashboard) — no
  email/SMS was wired up, per the current setup. `src/lib/invoices.ts` is
  where you'd add an email/WhatsApp send if you want that later.
- The Billplz X-Signature verification in `src/lib/billplz.ts` is
  best-effort (used for logging only); payment confirmation actually relies
  on re-fetching the bill from Billplz's API, which is secure regardless.
  Still worth testing the full sandbox payment flow before going live.
- Attendance is a simple "present today" check-in (one row per
  student/class/day). Extend `src/app/api/attendance/scan/route.ts` if you
  need per-session (rather than per-day) tracking.
