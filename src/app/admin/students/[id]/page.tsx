import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { QrCodeCard } from "@/components/qr-code-card";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatDateTime, formatMYR, monthName } from "@/lib/format";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, grade, qr_token, profiles!students_parent_id_fkey(full_name, email, phone)")
    .eq("id", id)
    .single();

  if (!student) notFound();
  const parent = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, scanned_at, courses(name)")
    .eq("student_id", id)
    .order("scanned_at", { ascending: false })
    .limit(20);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, status, amount_cents, period_month, period_year, courses(name)")
    .eq("student_id", id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{student.full_name}</h1>
        <p className="text-sm text-slate-500">{student.grade}</p>
        <p className="mt-1 text-sm text-slate-600">
          Parent: {parent?.full_name} · {parent?.email} · {parent?.phone}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <QrCodeCard studentName={student.full_name} qrToken={student.qr_token} />

        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Payment history</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {payments?.map((p) => {
              const course = Array.isArray(p.courses) ? p.courses[0] : p.courses;
              return (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{course?.name} — {monthName(p.period_month)} {p.period_year}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">{formatMYR(p.amount_cents)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </span>
                </li>
              );
            })}
            {(!payments || payments.length === 0) && <p className="mt-2 text-sm text-slate-500">No payments yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Attendance log</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {attendance?.map((a) => {
            const course = Array.isArray(a.courses) ? a.courses[0] : a.courses;
            return (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>{course?.name}</span>
                <span className="text-slate-500">{formatDateTime(a.scanned_at)}</span>
              </li>
            );
          })}
          {(!attendance || attendance.length === 0) && <p className="mt-2 text-sm text-slate-500">No attendance recorded yet.</p>}
        </ul>
      </div>
    </div>
  );
}
