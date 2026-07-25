import { createClient } from "@/lib/supabase/server";
import { payNow } from "@/actions/payments";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatDate, formatMYR, monthName } from "@/lib/format";

export default async function ParentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string; result?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: students } = await supabase.from("students").select("id").eq("parent_id", user!.id);
  const studentIds = (students ?? []).map((s) => s.id);

  const { data: payments } = studentIds.length
    ? await supabase
        .from("payments")
        .select("id, status, amount_cents, period_month, period_year, due_date, students(full_name), courses(name)")
        .in("student_id", studentIds)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Payments</h1>

      {params.result === "paid" && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Payment received — thank you!</div>
      )}
      {params.result === "unpaid" && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Payment was not completed. You can try again below.
        </div>
      )}
      {params.error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>}
      {params.info && <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{params.info}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Course</th>
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
              const course = Array.isArray(p.courses) ? p.courses[0] : p.courses;
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
                      <form action={payNow.bind(null, p.id)}>
                        <button type="submit" className="btn text-xs">Pay via FPX</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {(!payments || payments.length === 0) && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
