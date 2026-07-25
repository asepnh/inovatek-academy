import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, grade, created_at, profiles!students_parent_id_fkey(full_name, email, phone)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">All Students</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Parent</th>
              <th className="pb-2 font-medium">Contact</th>
              <th className="pb-2 font-medium">Added</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students?.map((s: NonNullable<typeof students>[number]) => {
              const parent = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
              return (
                <tr key={s.id}>
                  <td className="py-2">{s.full_name}</td>
                  <td className="py-2">{s.grade}</td>
                  <td className="py-2">{parent?.full_name}</td>
                  <td className="py-2">
                    <div>{parent?.email}</div>
                    <div className="text-xs text-slate-400">{parent?.phone}</div>
                  </td>
                  <td className="py-2">{formatDate(s.created_at)}</td>
                  <td className="py-2 text-right">
                    <Link href={`/admin/students/${s.id}`} className="text-brand-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!students || students.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
