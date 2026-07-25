import { createAdminClient } from "@/lib/supabase/server";
import { setEnrollmentStatus } from "@/actions/enrollments";
import { formatDate } from "@/lib/format";

export default async function AdminEnrollmentsPage() {
  const supabase = createAdminClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, students(full_name, grade), courses(name)")
    .order("enrolled_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Enrollments</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Course</th>
              <th className="pb-2 font-medium">Requested</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments?.map((e: NonNullable<typeof enrollments>[number]) => {
              const student = Array.isArray(e.students) ? e.students[0] : e.students;
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              return (
                <tr key={e.id}>
                  <td className="py-2">{student?.full_name} <span className="text-xs text-slate-400">({student?.grade})</span></td>
                  <td className="py-2">{course?.name}</td>
                  <td className="py-2">{formatDate(e.enrolled_at)}</td>
                  <td className="py-2">
                    <span className="badge bg-slate-100 text-slate-700 capitalize">{e.status}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {e.status !== "active" && (
                        <form action={setEnrollmentStatus.bind(null, e.id, "active")}>
                          <button className="btn-secondary text-xs">Approve</button>
                        </form>
                      )}
                      {e.status !== "cancelled" && (
                        <form action={setEnrollmentStatus.bind(null, e.id, "cancelled")}>
                          <button className="btn-secondary text-xs">Cancel</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!enrollments || enrollments.length === 0) && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">No enrollments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
