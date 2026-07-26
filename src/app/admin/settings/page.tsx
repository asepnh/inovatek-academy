import { createAdminClient } from "@/lib/supabase/server";
import { addBillingHoliday, removeBillingHoliday } from "@/actions/billing-holidays";
import { RunInvoicesButton } from "@/components/run-invoices-button";
import { monthName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; added?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const { data: holidays } = await supabase
    .from("billing_holidays")
    .select("year, month, note")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const now = new Date();
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() + i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Run invoicing now</h2>
        <p className="mt-1 text-sm text-slate-600">
          The automatic monthly run only fires once, on the 1st. Use this to catch students
          enrolled/approved after that — it creates this month&apos;s payment row for any active
          enrollment that doesn&apos;t already have one, and flags any already-overdue payments.
          Safe to run as many times as you like.
        </p>
        <div className="mt-4">
          <RunInvoicesButton />
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Billing holidays</h2>
        <p className="mt-1 text-sm text-slate-600">
          Months marked here are skipped by the monthly invoice generator — no new payment
          rows get created for that month, for any class. Already-created payments from other
          months still get flagged overdue as normal.
        </p>

        {params.error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>
        )}
        {params.added && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Holiday month added.</div>
        )}

        <form action={addBillingHoliday} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="month">Month</label>
            <select className="input" id="month" name="month" defaultValue={now.getMonth() + 1}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="year">Year</label>
            <select className="input" id="year" name="year" defaultValue={now.getFullYear()}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="note">Note (optional)</label>
            <input className="input" id="note" name="note" placeholder="e.g. School term break" />
          </div>
          <button type="submit" className="btn">Add holiday</button>
        </form>

        <ul className="mt-6 divide-y divide-slate-100">
          {holidays?.map((h: NonNullable<typeof holidays>[number]) => (
            <li key={`${h.year}-${h.month}`} className="flex items-center justify-between py-2 text-sm">
              <span>
                {monthName(h.month)} {h.year}
                {h.note && <span className="text-slate-500"> — {h.note}</span>}
              </span>
              <form action={removeBillingHoliday.bind(null, h.year, h.month)}>
                <button type="submit" className="text-red-600 hover:underline">Remove</button>
              </form>
            </li>
          ))}
          {(!holidays || holidays.length === 0) && (
            <li className="py-4 text-center text-sm text-slate-500">No holiday months set.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
