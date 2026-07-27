import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatMYR } from "@/lib/format";
import { DeleteClassButton } from "@/components/delete-class-button";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const { data: courses, error } = await supabase
    .from("classes")
    .select("id, name, grade_level, monthly_fee_cents, is_active, profiles!courses_mentor_id_fkey(full_name), enrollments(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
        <Link href="/admin/classes/new" className="btn">+ New class</Link>
      </div>

      {params.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 pb-2 font-medium">Class</th>
              <th className="px-3 pb-2 font-medium">Grade level</th>
              <th className="px-3 pb-2 font-medium">Mentor</th>
              <th className="px-3 pb-2 font-medium">Fee</th>
              <th className="px-3 pb-2 font-medium">Enrolled</th>
              <th className="px-3 pb-2 font-medium">Status</th>
              <th className="px-3 pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses?.map((c: NonNullable<typeof courses>[number]) => {
              const mentor = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              const count = Array.isArray(c.enrollments) ? c.enrollments[0]?.count ?? 0 : 0;
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.grade_level}</td>
                  <td className="px-3 py-2">{mentor?.full_name ?? <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="px-3 py-2">{formatMYR(c.monthly_fee_cents)}</td>
                  <td className="px-3 py-2">{count}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${c.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/admin/classes/${c.id}/edit`} className="text-brand-600 hover:underline">Edit</Link>
                      <DeleteClassButton classId={c.id} className="text-red-600 hover:underline" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">No classes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
