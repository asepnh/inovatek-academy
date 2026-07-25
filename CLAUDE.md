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
  course roster and tap Present/Absent per student
  (`src/app/mentor/attendance/page.tsx`,
  `src/components/attendance-toggle.tsx`,
  `src/app/api/attendance/mark/route.ts`). "Present" = an `attendance` row
  exists for that student/course/today; "Absent" (the default) = no row —
  toggling Absent *deletes* today's row rather than storing an explicit
  status. This requires the mentor-delete RLS policy added in
  `supabase/migrations/0002_attendance_mentor_delete.sql` — **confirm this
  migration has actually been run in the Supabase SQL editor**; it's easy to
  forget since it's separate from the initial migration.
- **Course grade levels vs student grades**: two separate lists in
  `src/lib/grades.ts`. `GRADE_OPTIONS` (detailed: Primary 1–6, Secondary
  1–5, etc.) is for a student's own grade. `COURSE_GRADE_LEVELS` (just
  Primary/Secondary) is for which broad band a course targets — kept
  separate on request, don't merge them back together.
- **Installable-shortcut PWA, not a native app**: `src/app/manifest.ts` +
  `src/app/icon.png` + `src/app/apple-icon.png` + `public/icons/*` give
  "Add to Home Screen" support with the real logo and a matching navy theme
  color (`#011C43`, sampled from the logo background). No custom per-device
  iOS splash images and no maskable Android icon variant were generated —
  both were deliberately skipped to keep this simple (maskable was skipped
  specifically because the logo's artwork sits close to the icon edges and
  would risk cropping under Android's adaptive-icon mask).

## Current status (as of handoff)

- Local dev works (`npm install && npm run dev`), `.env.local` is filled in
  with real Supabase + Billplz **sandbox** credentials.
- Supabase: project created, migration `0001_init.sql` run. Double-check
  `0002_attendance_mentor_delete.sql` has also been run (see above).
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
