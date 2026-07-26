import { notFound } from "next/navigation";
import { updateClass } from "@/actions/classes";
import { createAdminClient } from "@/lib/supabase/server";
import { CLASS_GRADE_LEVELS } from "@/lib/grades";
import { CoMentorsForm } from "@/components/co-mentors-form";

export const dynamic = "force-dynamic";

export default async function EditClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = createAdminClient();

  const { data: course } = await supabase.from("classes").select("*").eq("id", id).single();
  if (!course) notFound();

  const { data: mentors } = await supabase.from("profiles").select("id, full_name").eq("role", "mentor");
  const { data: coMentorRows } = await supabase
    .from("class_co_mentors")
    .select("mentor_id")
    .eq("class_id", id);
  const coMentorIds = (coMentorRows ?? []).map((r: { mentor_id: string }) => r.mentor_id);
  const otherMentors = (mentors ?? []).filter((m: { id: string; full_name: string }) => m.id !== course.mentor_id);
  const updateClassWithId = updateClass.bind(null, id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Edit class</h1>

      {sp.error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{sp.error}</div>}

      <form action={updateClassWithId} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Class name</label>
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
            {CLASS_GRADE_LEVELS.map((g) => (
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
            {mentors?.map((m: { id: string; full_name: string }) => (
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

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-900">Co-mentors</h2>
        <p className="mt-1 text-sm text-slate-600">
          Extra mentors who can also see this class&apos;s roster and take attendance for it,
          alongside the primary mentor above. They appear as a normal mentor on their end — no
          different UI.
        </p>
        <div className="mt-4">
          <CoMentorsForm classId={course.id} mentors={otherMentors} initialSelectedIds={coMentorIds} />
        </div>
      </div>
    </div>
  );
}
