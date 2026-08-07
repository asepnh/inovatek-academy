import { createAdminClient } from "@/lib/supabase/server";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { formatDate, formatMYR, monthName } from "@/lib/format";
import type { PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("payments")
    .select("id, status, amount_cents, period_month, period_year, due_date, students(full_name), classes(name)")
    .order("due_date", { ascending: false });

  if (params.status) query = query.eq("status", params.status as PaymentStatus);

  const { data: payments } = await query;

  const statuses: PaymentStatus[] = ["pending", "overdue", "paid", "failed", "cancelled"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <form method="get" className="flex items-center gap-2">
          <select name="status" defaultValue={params.status ?? ""} className="input">
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn-secondary text-sm">Filter</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Class</th>
              <th className="pb-2 font-medium">Period</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Due</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments?.map((p: NonNullable<typeof payments>[number]) => {
              const student = Array.isArray(p.students) ? p.students[0] : p.students;
              const course = Array.isArray(p.classes) ? p.classes[0] : p.classes;
              return (
                <tr key={p.id}>
                  <td className="py-2">{student?.full_name}</td>
                  <td className="py-2">{course?.name}</td>
                  <td className="py-2">{monthName(p.period_month)} {p.period_year}</td>
                  <td className="py-2">{formatMYR(p.amount_cents)}</td>
                  <td className="py-2">{formatDate(p.due_date)}</td>
                  <td className="py-2"><PaymentStatusBadge status={p.status} /></td>
                  <td className="py-2 text-right">
                    {p.status !== "paid" && p.status !== "cancelled" && (
                      <MarkPaidButton paymentId={p.id} studentName={student?.full_name ?? "this student"} />
                    )}
                  </td>
                </tr>
              );
            })}
            {(!payments || payments.length === 0) && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
