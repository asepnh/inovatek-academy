import { createClient } from "@/lib/supabase/server";
import { enrollStudent } from "@/actions/enrollments";
import { formatMYR } from "@/lib/format";

export default async function ParentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enrolled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, description, grade_level, monthly_fee_cents, schedule")
    .eq("is_active", true)
    .order("name");

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("parent_id", user!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Browse courses</h1>

      {params.enrolled && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Enrollment request submitted — an admin will confirm it shortly.
        </div>
      )}
      {params.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>
      )}

      {(!students || students.length === 0) && (
        <div className="card text-sm text-slate-600">
          Add a student first before registering for a course.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses?.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{c.name}</h2>
                <p className="text-xs text-slate-500">{c.grade_level}</p>
              </div>
              <span className="font-semibold text-brand-700">{formatMYR(c.monthly_fee_cents)}/mo</span>
            </div>
            {c.description && <p className="mt-2 text-sm text-slate-600">{c.description}</p>}
            {c.schedule && <p className="mt-1 text-xs text-slate-500">Schedule: {c.schedule}</p>}

            {students && students.length > 0 && (
              <form action={enrollStudent} className="mt-4 flex gap-2">
                <input type="hidden" name="course_id" value={c.id} />
                <select name="student_id" className="input" required defaultValue="">
                  <option value="" disabled>Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <button type="submit" className="btn whitespace-nowrap">Register</button>
              </form>
            )}
          </div>
        ))}
        {(!courses || courses.length === 0) && (
          <p className="text-sm text-slate-500">No courses available right now.</p>
        )}
      </div>
    </div>
  );
}
