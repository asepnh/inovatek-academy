import { createClient } from "@/lib/supabase/server";
import { QrScanner } from "@/components/qr-scanner";

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

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Scan Attendance</h1>

      {(!courses || courses.length === 0) && (
        <p className="text-sm text-slate-500">You have no assigned courses yet.</p>
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

          {selectedCourseId && (
            <>
              <p className="text-center text-sm text-slate-500">
                Point the camera at a student&apos;s QR code to mark them present.
              </p>
              <QrScanner key={selectedCourseId} courseId={selectedCourseId} />
            </>
          )}
        </>
      )}
    </div>
  );
}
