import { createAdminClient } from "@/lib/supabase/server";
import { monthName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: classes } = await supabase.from("classes").select("id, name").order("name");

  const now = new Date();
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const today = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Attendance export</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download attendance records for a class over a date range as an Excel file.
        </p>
        <form action="/api/export/attendance" method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="attendance_class_id">Class</label>
            <select className="input" id="attendance_class_id" name="class_id" required>
              {classes?.map((c: NonNullable<typeof classes>[number]) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="attendance_from">From</label>
            <input className="input" id="attendance_from" name="from" type="date" defaultValue={monthStart} required />
          </div>
          <div>
            <label className="label" htmlFor="attendance_to">To</label>
            <input className="input" id="attendance_to" name="to" type="date" defaultValue={today} required />
          </div>
          <button type="submit" className="btn">Download .xlsx</button>
        </form>
        {(!classes || classes.length === 0) && (
          <p className="mt-3 text-sm text-slate-500">No classes yet.</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Payments export</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download all payment records for a given month as an Excel file.
        </p>
        <form action="/api/export/payments" method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="payments_month">Month</label>
            <select className="input" id="payments_month" name="month" defaultValue={now.getMonth() + 1} required>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="payments_year">Year</label>
            <select className="input" id="payments_year" name="year" defaultValue={now.getFullYear()} required>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn">Download .xlsx</button>
        </form>
      </div>
    </div>
  );
}
