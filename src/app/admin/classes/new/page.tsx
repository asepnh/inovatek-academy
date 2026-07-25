import { createClass } from "@/actions/classes";
import { createAdminClient } from "@/lib/supabase/server";
import { CLASS_GRADE_LEVELS } from "@/lib/grades";

export const dynamic = "force-dynamic";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const { data: mentors, error: mentorsError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "mentor");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">New class</h1>

      {params.error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>}
      <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-800">
        Debug: mentorsError={mentorsError ? mentorsError.message : "none"}, mentors count={mentors?.length ?? "null"}
      </div>

      <form action={createClass} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Class name</label>
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
            {CLASS_GRADE_LEVELS.map((g) => (
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
            {mentors?.map((m: { id: string; full_name: string }) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn w-full">Create class</button>
      </form>
    </div>
  );
}
