import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QrCodeCard } from "@/components/qr-code-card";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatDate, formatDateTime, formatMYR, monthName } from "@/lib/format";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, grade, qr_token, created_at")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, courses(id, name, monthly_fee_cents)")
    .eq("student_id", id);

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, scanned_at, status, courses(name)")
    .eq("student_id", id)
    .order("scanned_at", { ascending: false })
    .limit(20);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, status, amount_cents, period_month, period_year, due_date, courses(name)")
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QrCodeCard studentName={student.full_name} qrToken={student.qr_token} />

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Enrolled courses</h2>
            <Link href="/parent/courses" className="text-sm font-medium text-brand-600 hover:underline">
              Browse courses
            </Link>
          </div>
          {(!enrollments || enrollments.length === 0) && (
            <p className="mt-3 text-sm text-slate-500">Not enrolled in any courses yet.</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {enrollments?.map((e: NonNullable<typeof enrollments>[number]) => {
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
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
              const course = Array.isArray(a.courses) ? a.courses[0] : a.courses;
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
              const course = Array.isArray(p.courses) ? p.courses[0] : p.courses;
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
