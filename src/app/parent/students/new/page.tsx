import { createStudent } from "@/actions/students";
import { GRADE_OPTIONS } from "@/lib/grades";
import { createClient } from "@/lib/supabase/server";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Enroll a student</h1>
      <p className="mt-1 text-sm text-slate-600">
        Add your child&apos;s details. You can register them for classes next.
      </p>

      {params.error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{params.error}</div>
      )}

      <form action={createStudent} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="student_name">Student name</label>
          <input className="input" id="student_name" name="student_name" required />
        </div>
        <div>
          <label className="label" htmlFor="grade">Student grade</label>
          <select className="input" id="grade" name="grade" required defaultValue="">
            <option value="" disabled>Select grade</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <hr className="border-slate-200" />
        <div>
          <label className="label" htmlFor="parent_name">Parent name</label>
          <input className="input" id="parent_name" name="parent_name" required defaultValue={profile?.full_name ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="parent_email">Parent email</label>
          <input className="input" id="parent_email" name="parent_email" type="email" required defaultValue={profile?.email ?? ""} readOnly />
          <p className="mt-1 text-xs text-slate-500">This is your account email.</p>
        </div>
        <div>
          <label className="label" htmlFor="parent_phone">Parent phone</label>
          <input className="input" id="parent_phone" name="parent_phone" type="tel" required defaultValue={profile?.phone ?? ""} placeholder="+60123456789" />
        </div>
        <button type="submit" className="btn w-full">Save student</button>
      </form>
    </div>
  );
}
