import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMYR } from "@/lib/format";

export default async function MentorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, grade_level, schedule, monthly_fee_cents, enrollments(count)")
    .eq("mentor_id", user!.id)
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
              <p className="text-sm text-slate-600">{formatMYR(c.monthly_fee_cents)}/mo</p>
              <div className="mt-3 flex gap-3">
                <Link href={`/mentor/attendance?course=${c.id}`} className="btn text-sm">
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
