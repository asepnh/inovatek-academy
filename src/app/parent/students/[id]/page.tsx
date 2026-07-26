import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QrCodeCard } from "@/components/qr-code-card";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { updateStudentPhoto } from "@/actions/students";
import { getStudentPhotoUrl } from "@/lib/student-photo";
import { formatDate, formatDateTime, formatMYR, monthName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; photoUpdated?: string; photoError?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, grade, qr_token, photo_path, created_at")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const photoUrl = await getStudentPhotoUrl(supabase, student.photo_path);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, classes(id, name, monthly_fee_cents)")
    .eq("student_id", id);

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, scanned_at, status, classes(name)")
    .eq("student_id", id)
    .order("scanned_at", { ascending: false })
    .limit(20);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, status, amount_cents, period_month, period_year, due_date, classes(name)")
    .eq("student_id", id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{student.full_name}</h1>
        <p className="text-sm text-slate-500">{student.grade}</p>
      </div>

      {sp.error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{sp.error}</div>}
      {sp.photoUpdated && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Photo updated.</div>
      )}
      {sp.photoError && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Student saved, but the photo failed to upload: {sp.photoError}. You can try again below.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center text-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={student.full_name} className="h-40 w-40 rounded-full object-cover" />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400">
              No photo
            </div>
          )}
          <form action={updateStudentPhoto.bind(null, student.id)} className="mt-4 w-full space-y-2">
            <input
              className="input text-sm"
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
              required
            />
            <button type="submit" className="btn-secondary w-full text-sm">
              {photoUrl ? "Replace photo" : "Add photo"}
            </button>
          </form>
        </div>

        <QrCodeCard studentName={student.full_name} qrToken={student.qr_token} />

        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Enrolled classes</h2>
            <Link href="/parent/classes" className="text-sm font-medium text-brand-600 hover:underline">
              Browse classes
            </Link>
          </div>
          {(!enrollments || enrollments.length === 0) && (
            <p className="mt-3 text-sm text-slate-500">Not enrolled in any classes yet.</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {enrollments?.map((e: NonNullable<typeof enrollments>[number]) => {
              const course = Array.isArray(e.classes) ? e.classes[0] : e.classes;
              return (
                <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{course?.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">{formatMYR(course?.monthly_fee_cents ?? 0)}/mo</span>
                    <span className="badge bg-slate-100 text-slate-700 capitalize">{e.status}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">Recent attendance</h2>
          {(!attendance || attendance.length === 0) && (
            <p className="mt-3 text-sm text-slate-500">No attendance recorded yet.</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {attendance?.map((a: NonNullable<typeof attendance>[number]) => {
              const course = Array.isArray(a.classes) ? a.classes[0] : a.classes;
              return (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{course?.name}</span>
                  <span className="text-slate-500">{formatDateTime(a.scanned_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900">Recent payments</h2>
          {(!payments || payments.length === 0) && (
            <p className="mt-3 text-sm text-slate-500">No payments yet.</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {payments?.map((p: NonNullable<typeof payments>[number]) => {
              const course = Array.isArray(p.classes) ? p.classes[0] : p.classes;
              return (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {course?.name} — {monthName(p.period_month)} {p.period_year}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">{formatMYR(p.amount_cents)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </span>
                </li>
              );
            })}
          </ul>
          <Link href="/parent/payments" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            View all payments
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400">Added {formatDate(student.created_at)}</p>
    </div>
  );
}
