import { createClient } from "@/lib/supabase/server";
import { AttendanceToggle } from "@/components/attendance-toggle";

interface RosterStudent {
  id: string;
  full_name: string;
  grade: string;
}

export default async function MentorAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("mentor_id", user!.id)
    .order("name");

  const selectedCourseId = params.course ?? courses?.[0]?.id;

  let roster: RosterStudent[] = [];
  let presentIds = new Set<string>();

  if (selectedCourseId) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("students(id, full_name, grade)")
      .eq("course_id", selectedCourseId)
      .eq("status", "active");

    roster = (enrollments ?? [])
      .map((e) => (Array.isArray(e.students) ? e.students[0] : e.students))
      .filter((s): s is RosterStudent => !!s)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todayAttendance } = await supabase
      .from("attendance")
      .select("student_id")
      .eq("course_id", selectedCourseId)
      .gte("scanned_at", startOfDay.toISOString());

    presentIds = new Set((todayAttendance ?? []).map((a) => a.student_id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>

      {(!courses || courses.length === 0) && (
        <p className="text-sm text-slate-500">You have no assigned classes yet.</p>
      )}

      {courses && courses.length > 0 && (
        <>
          <form method="get" className="flex items-center gap-2">
            <select name="course" className="input" defaultValue={selectedCourseId}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary text-sm">Switch</button>
          </form>

          <p className="text-sm text-slate-500">
            Today&apos;s attendance — every student starts as Absent until you mark them Present.
          </p>

          <div className="card divide-y divide-slate-100">
            {roster.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{s.full_name}</p>
                  <p className="text-xs text-slate-500">{s.grade}</p>
                </div>
                <AttendanceToggle
                  studentId={s.id}
                  courseId={selectedCourseId!}
                  initialPresent={presentIds.has(s.id)}
                />
              </div>
            ))}
            {roster.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No active students enrolled in this course.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
