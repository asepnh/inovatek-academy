import { createCourse } from "@/actions/courses";
import { createAdminClient } from "@/lib/supabase/server";
import { GRADE_OPTIONS } from "@/lib/grades";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const { data: mentors } = await supabase.from("profiles").select("id, full_name").eq("role", "mentor");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">New course</h1>

      {params.error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>}

      <form action={createCourse} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Course name</label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={3} />
        </div>
        <div>
          <label className="label" htmlFor="grade_level">Grade level</label>
          <select className="input" id="grade_level" name="grade_level" defaultValue="All levels">
            <option value="All levels">All levels</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="schedule">Schedule</label>
          <input className="input" id="schedule" name="schedule" placeholder="e.g. Saturdays 10am-12pm" />
        </div>
        <div>
          <label className="label" htmlFor="monthly_fee">Monthly fee (RM)</label>
          <input className="input" id="monthly_fee" name="monthly_fee" type="number" min="0" step="0.01" required />
        </div>
        <div>
          <label className="label" htmlFor="mentor_id">Mentor</label>
          <select className="input" id="mentor_id" name="mentor_id" defaultValue="">
            <option value="">Unassigned</option>
            {mentors?.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn w-full">Create course</button>
      </form>
    </div>
  );
}
