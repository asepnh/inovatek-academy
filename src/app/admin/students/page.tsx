import { createAdminClient } from "@/lib/supabase/server";
import { AdminStudentsTable } from "@/components/admin-students-table";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, full_name, grade, created_at, profiles!students_parent_id_fkey(full_name, email, phone), enrollments(status, classes(name))"
    )
    .order("created_at", { ascending: false });

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const rows = (students ?? []).map((s: NonNullable<typeof students>[number]) => {
    const parent = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const classNames = (s.enrollments ?? [])
      .filter((e: { status: string }) => e.status !== "cancelled")
      .map((e: { classes: { name: string } | { name: string }[] | null }) =>
        Array.isArray(e.classes) ? e.classes[0]?.name : e.classes?.name
      )
      .filter((name: string | undefined): name is string => !!name);

    return {
      id: s.id,
      full_name: s.full_name,
      grade: s.grade,
      created_at: s.created_at,
      parentName: parent?.full_name,
      parentEmail: parent?.email,
      parentPhone: parent?.phone,
      classNames,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">All Students</h1>
      <AdminStudentsTable students={rows} classes={classes ?? []} />
    </div>
  );
}
