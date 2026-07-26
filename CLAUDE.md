# Inovatek Academy — project context for Claude Code

This file is picked up automatically by Claude Code when run in this
directory. It captures decisions and context from the initial build (done
in a Cowork cloud session) so you don't have to rediscover them.

## What this is

A Next.js 14 (App Router) + TypeScript + Tailwind + Supabase webapp for
Inovatek Academy: parent/student enrollment, course registration, monthly
payments via Billplz FPX, QR codes per student, and mentor attendance
tracking. Three roles: Admin, Mentor, Parent (see README.md for the full
feature list and setup steps; DEPLOYMENT.md for going live on a domain).

## Key architecture decisions (and why)

- **Supabase over Prisma+Postgres**: chosen specifically so Row Level
  Security policies enforce the three-role authorization model at the
  database layer (a parent literally cannot query another parent's student,
  regardless of application code correctness) rather than relying entirely
  on hand-written checks in server actions/routes. See
  `supabase/migrations/0001_init.sql` for every policy.
- **Billplz webhook trust model**: Billplz's public docs don't fully specify
  the X-Signature source-string format. `src/lib/billplz.ts` and
  `src/app/api/billplz/callback/route.ts` / `.../redirect/route.ts` treat an
  authenticated `GET /bills/{id}` call to Billplz's own API as the source of
  truth for marking a payment paid, rather than trusting posted webhook
  fields alone. `verifyXSignature()` is best-effort/logging-only. Test this
  against the Billplz sandbox before flipping `BILLPLZ_ENV` to production.
- **Reminders are in-app only**: no email/SMS provider is wired up (by
  choice, not oversight). Overdue payments create rows in `notifications`
  and show as a banner on the parent dashboard. `src/lib/invoices.ts` is
  where you'd add an email/WhatsApp send if that's wanted later.
- **Attendance is roster-based, not QR-scan-based**: originally built with a
  camera QR scanner (`src/components/qr-scanner.tsx`, still in the repo but
  unused), then replaced per request with a simpler UI: mentors see their
  class roster and tap Present/Absent per student
  (`src/app/mentor/attendance/page.tsx`,
  `src/components/attendance-toggle.tsx`,
  `src/app/api/attendance/mark/route.ts`). "Present" = an `attendance` row
  exists for that student/class/today; "Absent" (the default) = no row —
  toggling Absent *deletes* today's row rather than storing an explicit
  status. This requires the mentor-delete RLS policy added in
  `supabase/migrations/0002_attendance_mentor_delete.sql` — **confirm this
  migration has actually been run in the Supabase SQL editor**; it's easy to
  forget since it's separate from the initial migration.
- **"Course" renamed to "Class" throughout (UI, routes, and schema)**: the
  `courses` table was renamed to `classes` (and `course_id` columns to
  `class_id`) in `supabase/migrations/0003_rename_courses_to_classes.sql` —
  **run this migration in the Supabase SQL editor** if it hasn't been yet,
  or every class-related query will fail. Routes moved from
  `/admin/courses` and `/parent/courses` to `/admin/classes` and
  `/parent/classes`; `src/actions/courses.ts` became
  `src/actions/classes.ts` (`createCourse`/`updateCourse` →
  `createClass`/`updateClass`).
- **Class grade levels vs student grades**: two separate lists in
  `src/lib/grades.ts`. `GRADE_OPTIONS` (detailed: Primary 1–6, Secondary
  1–5, etc.) is for a student's own grade. `CLASS_GRADE_LEVELS` (just
  Primary/Secondary) is for which broad band a class targets — kept
  separate on request, don't merge them back together.
- **Installable-shortcut PWA, not a native app**: `src/app/manifest.ts` +
  `src/app/icon.png` + `src/app/apple-icon.png` + `public/icons/*` give
  "Add to Home Screen" support with the real logo and a matching navy theme
  color (`#011C43`, sampled from the logo background). No custom per-device
  iOS splash images and no maskable Android icon variant were generated —
  both were deliberately skipped to keep this simple (maskable was skipped
  specifically because the logo's artwork sits close to the icon edges and
  would risk cropping under Android's adaptive-icon mask).
- **Billing holidays**: `public.billing_holidays` (migration
  `0006_billing_holidays.sql`) lets an admin mark a whole month as skipped
  for invoice generation via `/admin/settings` — `generateMonthlyInvoices()`
  in `src/lib/invoices.ts` checks this table first and, if the month is
  marked, skips creating new payment rows but still runs
  `markOverdueAndNotify()` for already-existing payments. It's global (all
  classes), not per-class.
- **Excel exports**: `/admin/reports` offers two `.xlsx` downloads (via
  `exceljs`, not the `xlsx` npm package — that one has unpatched high-severity
  CVEs with no fix path) — attendance by class + date range
  (`/api/export/attendance`) and payments by month
  (`/api/export/payments`). Both are plain GET route handlers gated by an
  admin-role check, not server actions, since a form's `method="get"` needs
  to trigger a real browser download.
- **Fee waivers**: `students.fee_waived` (migration
  `0007_student_fee_waiver.sql`), toggled by an admin on
  `/admin/students/[id]` via `src/components/fee-waived-toggle.tsx`.
  `generateMonthlyInvoices()` skips creating a payment row for waived
  students entirely (not a RM0 "paid" row). Mentor-facing payment status
  displays are intentionally simplified to just three values — Paid,
  Overdue, Waived — not the full `payment_status` enum.
- **Student photos**: optional, uploaded via native camera capture
  (`<input type="file" capture="environment">`, not a live `getUserMedia`
  stream — much more reliable across mobile browsers than the QR scanner).
  Stored in the private `student-photos` Supabase Storage bucket (migration
  `0008_student_photos.sql`), path `<student_id>/<timestamp>.<ext>`, RLS
  scoped the same way as the DB tables (parent owns their own kids' photos,
  mentors can read photos of students in their assigned classes via
  `is_student_in_mentors_class()`, admin sees all). `students.photo_path`
  stores the storage path, not a public URL — `src/lib/student-photo.ts`
  generates a short-lived signed URL on each page render via
  `getStudentPhotoUrl()`. Parents can add/replace a photo from
  `/parent/students/[id]`; it's optional at signup.
- **Invite links**: `public.invites` (migration `0009_invites.sql`) lets an
  admin generate a single-use signup link that pre-sets the signer-upper's
  role (`/admin/users/new` → "Send an invite link instead"). Consumed
  server-side in `signUp()` (`src/actions/auth.ts`) via the service-role
  client, so no public RLS read access to the table is needed. Separately,
  `createUserAccount()` in `src/actions/users.ts` lets an admin create an
  account directly with a generated temporary password instead, for when
  they don't want to wait on the other person to self-register.
- **Co-mentors**: a class keeps its single primary `classes.mentor_id`
  unchanged, but can also have extra mentors via `public.class_co_mentors`
  (migration `0010_class_co_mentors.sql`), managed from a checklist on
  `/admin/classes/[id]/edit`. A co-mentor is a completely normal `mentor`
  role account — same UI, no special-casing — they just see an extra class.
  `public.is_mentor_of_class(class_id, mentor_id)` is the single source of
  truth for "can this mentor see this class" (primary OR co-mentor),
  reused by every mentor-facing RLS policy on `classes`/`enrollments`/
  `payments`/`attendance`, and by `is_student_in_mentors_class()` for the
  student-roster policy. The three mentor pages (`/mentor`,
  `/mentor/attendance`, `/mentor/students`) deliberately don't filter by
  `mentor_id` in the query — they rely entirely on RLS to return only the
  classes that mentor can see.

## Current status (as of handoff)

- Local dev works (`npm install && npm run dev`), `.env.local` is filled in
  with real Supabase + Billplz **sandbox** credentials.
- Supabase: project created, migration `0001_init.sql` run. Double-check
  `0002_attendance_mentor_delete.sql` and `0003_rename_courses_to_classes.sql`
  have also been run (see above).
- GitHub: pushed to `github.com/asepnh/inovatek-academy`, `main` branch.
- Domain: `inovatek.my` (root/apex — needs an A record, not a CNAME, when
  pointing it at Vercel).
- **Not yet done**: Vercel deployment, DNS pointing, and the Billplz
  production credential swap. See `DEPLOYMENT.md` for the full remaining
  checklist (Vercel import → env vars → domain → Supabase Auth URL update →
  end-to-end payment test → go-live checklist).

## Where to look

- `README.md` — full setup from scratch (Supabase, env vars, running
  locally, customizing).
- `DEPLOYMENT.md` — GitHub → Vercel → domain → production checklist.
- `supabase/migrations/` — run these in order in the Supabase SQL editor for
  any fresh environment; there's no automated migration runner set up.
