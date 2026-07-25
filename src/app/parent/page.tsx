import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, grade, created_at")
    .eq("parent_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, created_at, is_read")
    .eq("parent_id", user!.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-semibold">{n.title}</p>
              <p>{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
        <Link href="/parent/students/new" className="btn">
          + Enroll a student
        </Link>
      </div>

      {(!students || students.length === 0) && (
        <div className="card text-center text-slate-600">
          No students yet.{" "}
          <Link href="/parent/students/new" className="font-medium text-brand-600 hover:underline">
            Enroll your first student
          </Link>{" "}
          to get started.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students?.map((s: NonNullable<typeof students>[number]) => (
          <Link key={s.id} href={`/parent/students/${s.id}`} className="card block hover:shadow-md">
            <p className="text-lg font-semibold text-slate-900">{s.full_name}</p>
            <p className="text-sm text-slate-500">{s.grade}</p>
            <p className="mt-2 text-xs text-slate-400">Added {formatDate(s.created_at)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
