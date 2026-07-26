import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MentorDashboard() {
  const supabase = await createClient();

  // No .eq("mentor_id", ...) filter here on purpose: RLS (is_mentor_of_class,
  // see migration 0010) already restricts this to classes the signed-in
  // mentor is either the primary mentor or a co-mentor for.
  const { data: courses } = await supabase
    .from("classes")
    .select("id, name, grade_level, schedule, enrollments(count)")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses?.map((c: NonNullable<typeof courses>[number]) => {
          const count = Array.isArray(c.enrollments) ? c.enrollments[0]?.count ?? 0 : 0;
          return (
            <div key={c.id} className="card">
              <h2 className="font-semibold text-slate-900">{c.name}</h2>
              <p className="text-xs text-slate-500">{c.grade_level} · {c.schedule || "No schedule set"}</p>
              <p className="mt-2 text-sm text-slate-600">{count} enrolled student{count === 1 ? "" : "s"}</p>
              <div className="mt-3 flex gap-3">
                <Link href={`/mentor/attendance?class=${c.id}`} className="btn text-sm">
                  Take attendance
                </Link>
              </div>
            </div>
          );
        })}
        {(!courses || courses.length === 0) && (
          <p className="text-sm text-slate-500">No classes assigned to you yet. Ask an admin to assign one.</p>
        )}
      </div>
    </div>
  );
}
