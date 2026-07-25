import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatMYR } from "@/lib/format";

export default async function AdminCoursesPage() {
  const supabase = createAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, grade_level, monthly_fee_cents, is_active, profiles(full_name), enrollments(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <Link href="/admin/courses/new" className="btn">+ New course</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Course</th>
              <th className="pb-2 font-medium">Grade level</th>
              <th className="pb-2 font-medium">Mentor</th>
              <th className="pb-2 font-medium">Fee</th>
              <th className="pb-2 font-medium">Enrolled</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses?.map((c) => {
              const mentor = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              const count = Array.isArray(c.enrollments) ? c.enrollments[0]?.count ?? 0 : 0;
              return (
                <tr key={c.id}>
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.grade_level}</td>
                  <td className="py-2">{mentor?.full_name ?? <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="py-2">{formatMYR(c.monthly_fee_cents)}</td>
                  <td className="py-2">{count}</td>
                  <td className="py-2">
                    <span className={`badge ${c.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/admin/courses/${c.id}/edit`} className="text-brand-600 hover:underline">Edit</Link>
                  </td>
                </tr>
              );
            })}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">No courses yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
