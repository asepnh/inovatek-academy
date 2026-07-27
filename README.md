# Inovatek Academy

A web app for parents to enroll their children, register for classes, pay
monthly fees via Billplz FPX, and for mentors to track attendance — with an
admin dashboard covering users, classes, billing, and reporting.

Roles: **Admin**, **Mentor**, **Parent**. A class can have a primary mentor
plus any number of **co-mentors** (extra mentor accounts that can also see
that class and its roster).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security + Storage)
- Billplz API v3 (FPX payments)
- `qrcode` (generate each student's QR) + `html5-qrcode` (mentor's camera
  scanner, used for attendance)
- `exceljs` (admin `.xlsx` exports)

## 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A free [Supabase](https://supabase.com) project
- A [Billplz](https://www.billplz.com) account — use the **sandbox** account
  while testing (`https://www.billplz-sandbox.com`), a separate **production**
  account when you go live
- (Optional) A [Google Cloud](https://console.cloud.google.com) OAuth client,
  if you want "Continue with Google" sign-in enabled

## 2. Install dependencies

This project's `node_modules` isn't included. From the project folder:

```bash
npm install
```

## 3. Set up Supabase

1. Create a new Supabase project.
2. Open the SQL editor and run every file in `supabase/migrations/`, **in
   numeric order** (`0001_init.sql`, `0002_...`, `0003_...`, etc. — there's
   no automated migration runner, so run them one at a time). Skipping one
   will break whatever feature it introduces; see each file's comment for
   what it does.
3. In **Authentication → URL Configuration**:
   - Set **Site URL** to your app's canonical URL (e.g. `http://localhost:3000`
     for local dev, your real domain once deployed — pick one domain variant,
     e.g. apex not `www`, and use it consistently everywhere in this guide).
   - Add `{SITE_URL}/auth/callback` under **Redirect URLs**.
4. (Optional) In **Authentication → Providers → Google**, enable it and
   paste in a Client ID/Secret from Google Cloud Console (OAuth client type:
   Web application; authorized redirect URI is the Supabase-hosted callback
   URL shown on this same settings page, e.g.
   `https://<project-ref>.supabase.co/auth/v1/callback` — **not** your app's
   own `/auth/callback`). Skip this if you don't want Google sign-in.
5. (Optional, for faster local testing) In **Authentication → Providers →
   Email**, you can turn off "Confirm email" so new accounts can sign in
   immediately without clicking an email link.
6. Copy your project's URL, `anon` public key, and `service_role` secret key
   from **Settings → API** — you'll need them in the next step.

## 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from Supabase (step 3.6)
- `NEXT_PUBLIC_SITE_URL` — your app's public URL, **no trailing slash**, and
  matching exactly whatever domain variant you set as Supabase's Site URL.
  Billplz's servers must be able to reach `{SITE_URL}/api/billplz/callback`,
  so for local dev use a tunnel like `ngrok http 3000` and put the ngrok URL
  here temporarily.
- `BILLPLZ_ENV` — `sandbox` while testing, `production` when live (these are
  **separate Billplz accounts** with separate credentials)
- `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY` —
  from your Billplz account (Settings → API keys / Collections)
- `CRON_SECRET` — any long random string; protects the monthly billing job.
  It also needs to be pasted into `vercel.json`'s cron entry (see §7) — the
  two must match exactly.

Google sign-in needs no separate env vars — its Client ID/Secret live only
in Supabase's own dashboard (step 3.4).

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
promote any signed-up account (Edit → change Role), create an account
directly with a temporary password, or generate a self-serve invite link —
see §6 below for all three.

## 6. How the pieces fit together

### Enrollment & classes
- A parent adds a student (name, grade, optional photo) under
  **My Students → Enroll a student**; the photo can be added later instead.
- Parents browse active classes and register a student; new enrollments
  start as `pending` until an admin approves them under
  **Admin → Enrollments** (flip to `active`).
- Each class has one primary mentor plus any number of **co-mentors**
  (managed via a checklist on **Admin → Classes → Edit**) — both see the
  exact same mentor UI, a co-mentor just has an extra class in their list.

### Getting mentor/admin accounts set up
Nobody can self-register as Mentor or Admin — every new signup defaults to
Parent, and an existing admin has to grant a higher role. Three ways to do
that, all under **Admin → Users**:
1. **Edit an existing account's role** — click Edit next to anyone, change
   the Role dropdown, Save.
2. **Create an account directly** (`+ New user`) — admin fills in their
   name/email/phone, the system generates a temporary password shown once
   on screen; share it with them yourself (no email is sent).
3. **Send an invite link** — generate a one-time `/signup?invite=...` link
   pre-set to a role (e.g. Mentor); send it to them and they fill in their
   own details (or use "Continue with Google"). The link expires after 7
   days or first use.

### Payments
- **Monthly billing** creates a payment row for every `active` enrollment
  and flags any unpaid-past-due payment as `overdue` (which also creates an
  in-app reminder for the parent). This runs automatically once a month via
  the Vercel Cron in `vercel.json` (see §7) — but since that only fires on
  the 1st, an admin can also trigger it manually anytime from
  **Admin → Settings → Run invoicing now** (e.g. to catch a student
  enrolled/approved after the 1st). Safe to run repeatedly — it only fills
  in payment rows that don't already exist.
- **Billing holidays**: mark a whole month as skipped (e.g. a school break)
  from **Admin → Settings** — no new payment rows get created for that
  month, for any class, though already-overdue payments still get flagged.
- **Fee waivers**: an admin can exempt a specific student from monthly
  billing entirely (e.g. a mentor's own child) from that student's detail
  page (**Admin → Students → a student**) — no payment row is ever created
  for them, not even a RM0 one.
- Parents pay from **Payments → Pay via FPX**, which creates a Billplz bill
  and redirects to Billplz's hosted FPX payment page.
- **Payment confirmation**: Billplz calls `/api/billplz/callback` after a
  payment attempt. That handler re-fetches the bill directly from Billplz's
  API (using your secret API key) before marking anything as paid — see the
  comment in `src/lib/billplz.ts` for why (Billplz's public docs don't fully
  spell out the X-Signature source-string format, so we treat the
  authenticated API call as the source of truth rather than trusting posted
  form fields outright). **Test this end-to-end against the Billplz sandbox
  before going live.**

### Attendance
- Each student has a unique QR code (viewable/downloadable from their
  student page).
- A mentor opens **Attendance**, picks a class, and either taps
  Present/Absent per student on a roster, or switches to **Scan QR** to use
  their device camera instead — both call the same underlying API and
  respect the same active-enrollment check.

### Reporting & records
- **Admin → Reports** offers two `.xlsx` downloads: attendance by class +
  date range, and payments by month.
- **In-app reminders**: overdue payments show as a banner on the parent's
  dashboard (from the `notifications` table) — no email/SMS provider is
  wired up, per the current setup choice.

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
- Either way, an admin can also trigger a run anytime from
  **Admin → Settings → Run invoicing now** — no need to wait for the
  schedule if you want to catch a late enrollment mid-month.

## 8. Deploying

1. Push this project to a Git repository.
2. Import it into [Vercel](https://vercel.com) (or any Next.js host).
3. Add all the variables from `.env.local` as environment variables in your
   hosting provider.
4. Update `NEXT_PUBLIC_SITE_URL` to your real production URL (no trailing
   slash), and make sure it matches **exactly** — same domain variant
   (apex vs `www`) — as what's set everywhere else: Supabase's Site URL,
   Supabase's Redirect URLs entry, and (if using Google sign-in) Google
   Cloud Console's Authorized JavaScript origins/redirect URI. A mismatch
   here is the most common cause of "sign-in silently does nothing."
5. Switch `BILLPLZ_ENV` to `production` and swap in your production Billplz
   credentials once you're ready to accept real payments.
6. Set the real `CRON_SECRET` value in `vercel.json` (see §7) before your
   first deploy — otherwise the monthly cron authenticates with the
   placeholder and silently fails every month.

## 9. Customizing

- **Grade options**: edit the list in `src/lib/grades.ts`
  (`GRADE_OPTIONS` for a student's own grade; `CLASS_GRADE_LEVELS`,
  a separate and much shorter list, for which broad band a class targets —
  don't merge the two).
- **Currency/formatting**: `src/lib/format.ts` (defaults to MYR).
- **Branding/colors**: `tailwind.config.ts` (the `brand` color scale),
  `src/app/page.tsx` for the landing page copy, `public/icons/` +
  `src/app/manifest.ts` for the PWA icon/theme color.
- **Legal pages**: `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, and
  `src/app/faq/page.tsx` ship with generic starter content — update the
  contact details and review before relying on them as-is.

## 10. Known limitations / next steps

- Reminders are in-app only (a banner on the parent dashboard) — no
  email/SMS was wired up, per the current setup. `src/lib/invoices.ts` is
  where you'd add an email/WhatsApp send if you want that later.
- The Billplz X-Signature verification in `src/lib/billplz.ts` is
  best-effort (used for logging only); payment confirmation actually relies
  on re-fetching the bill from Billplz's API, which is secure regardless.
  Still worth testing the full sandbox payment flow before going live.
- Attendance is a simple "present today" check-in (one row per
  student/class/day). Extend `src/app/api/attendance/scan/route.ts` /
  `.../mark/route.ts` if you need per-session (rather than per-day)
  tracking.
- A user can only have exactly one role at a time (Parent, Mentor, or
  Admin) — there's no dual-role account. A mentor who is also a parent of
  an enrolled student needs a separate parent account for their own child
  (use the fee-waiver feature if that child shouldn't be billed).
