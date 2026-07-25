import { notFound } from "next/navigation";
import { updateCourse } from "@/actions/courses";
import { createAdminClient } from "@/lib/supabase/server";
import { GRADE_OPTIONS } from "@/lib/grades";

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = createAdminClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const { data: mentors } = await supabase.from("profiles").select("id, full_name").eq("role", "mentor");
  const updateCourseWithId = updateCourse.bind(null, id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Edit course</h1>

      {sp.error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{sp.error}</div>}

      <form action={updateCourseWithId} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Course name</label>
          <input className="input" id="name" name="name" required defaultValue={course.name} />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input" id="description" name="description" rows={3} defaultValue={course.description} />
        </div>
        <div>
          <label className="label" htmlFor="grade_level">Grade level</label>
          <select className="input" id="grade_level" name="grade_level" defaultValue={course.grade_level}>
            <option value="All levels">All levels</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="schedule">Schedule</label>
          <input className="input" id="schedule" name="schedule" defaultValue={course.schedule} />
        </div>
        <div>
          <label className="label" htmlFor="monthly_fee">Monthly fee (RM)</label>
          <input
            className="input"
            id="monthly_fee"
            name="monthly_fee"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={(course.monthly_fee_cents / 100).toFixed(2)}
          />
        </div>
        <div>
          <label className="label" htmlFor="mentor_id">Mentor</label>
          <select className="input" id="mentor_id" name="mentor_id" defaultValue={course.mentor_id ?? ""}>
            <option value="">Unassigned</option>
            {mentors?.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="is_active" defaultChecked={course.is_active} />
          Active (visible to parents for registration)
        </label>
        <button type="submit" className="btn w-full">Save changes</button>
      </form>
    </div>
  );
}
