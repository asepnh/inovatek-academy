import { createAdminClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { formatMYR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [{ count: studentCount }, { count: activeEnrollments }, { count: overdueCount }, { data: paidThisMonth }] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "overdue"),
      supabase
        .from("payments")
        .select("amount_cents")
        .eq("status", "paid")
        .gte("paid_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

  const revenueThisMonth = (paidThisMonth ?? []).reduce((sum: number, p: { amount_cents: number }) => sum + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total students" value={studentCount ?? 0} />
        <StatCard label="Active enrollments" value={activeEnrollments ?? 0} />
        <StatCard label="Overdue payments" value={overdueCount ?? 0} hint="Needs follow-up" />
        <StatCard label="Revenue this month" value={formatMYR(revenueThisMonth)} />
      </div>
    </div>
  );
}
