import { createClient } from "@/lib/supabase/server";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { monthName } from "@/lib/format";

export default async function MentorStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase.from("courses").select("id, name").eq("mentor_id", user!.id);
  const courseIds = (courses ?? []).map((c) => c.id);

  const { data: enrollments } = courseIds.length
    ? await supabase
        .from("enrollments")
        .select("id, status, students(id, full_name, grade), courses(id, name)")
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false })
    : { data: [] };

  const now = new Date();
  const { data: payments } = courseIds.length
    ? await supabase
        .from("payments")
        .select("student_id, course_id, status")
        .in("course_id", courseIds)
        .eq("period_month", now.getMonth() + 1)
        .eq("period_year", now.getFullYear())
    : { data: [] };

  const paymentByStudentCourse = new Map(
    (payments ?? []).map((p) => [`${p.student_id}:${p.course_id}`, p.status])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Students &amp; Payment Status</h1>
      <p className="text-sm text-slate-500">
        Showing {monthName(now.getMonth() + 1)} {now.getFullYear()} payment status for students in your courses.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Class</th>
              <th className="pb-2 font-medium">Enrollment</th>
              <th className="pb-2 font-medium">This month&apos;s payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments?.map((e: NonNullable<typeof enrollments>[number]) => {
              const student = Array.isArray(e.students) ? e.students[0] : e.students;
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
              const status = paymentByStudentCourse.get(`${student?.id}:${course?.id}`);
              return (
                <tr key={e.id}>
                  <td className="py-2">{student?.full_name}</td>
                  <td className="py-2">{student?.grade}</td>
                  <td className="py-2">{course?.name}</td>
                  <td className="py-2 capitalize">{e.status}</td>
                  <td className="py-2">
                    {status ? <PaymentStatusBadge status={status as any} /> : <span className="text-slate-400">Not billed yet</span>}
                  </td>
                </tr>
              );
            })}
            {(!enrollments || enrollments.length === 0) && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
