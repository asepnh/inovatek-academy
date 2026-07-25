import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AttendanceToggle } from "@/components/attendance-toggle";
import { QrScanner } from "@/components/qr-scanner";

interface RosterStudent {
  id: string;
  full_name: string;
  grade: string;
}

export default async function MentorAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "scan" ? "scan" : "roster";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("classes")
    .select("id, name")
    .eq("mentor_id", user!.id)
    .order("name");

  const selectedClassId = params.class ?? courses?.[0]?.id;

  let roster: RosterStudent[] = [];
  let presentIds = new Set<string>();

  if (selectedClassId) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("students(id, full_name, grade)")
      .eq("class_id", selectedClassId)
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
      .eq("class_id", selectedClassId)
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
            <input type="hidden" name="mode" value={mode} />
            <select name="class" className="input" defaultValue={selectedClassId}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary text-sm">Switch</button>
          </form>

          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
            <Link
              href={`/mentor/attendance?class=${selectedClassId}&mode=roster`}
              className={`px-3 py-1.5 text-sm font-medium transition ${
                mode === "roster" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Roster
            </Link>
            <Link
              href={`/mentor/attendance?class=${selectedClassId}&mode=scan`}
              className={`border-l border-slate-300 px-3 py-1.5 text-sm font-medium transition ${
                mode === "scan" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Scan QR
            </Link>
          </div>

          {mode === "scan" && selectedClassId && (
            <QrScanner key={selectedClassId} classId={selectedClassId} />
          )}

          {mode === "roster" && (
            <>
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
                      classId={selectedClassId!}
                      initialPresent={presentIds.has(s.id)}
                    />
                  </div>
                ))}
                {roster.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No active students enrolled in this class.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
