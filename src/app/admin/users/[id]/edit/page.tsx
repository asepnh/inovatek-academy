import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRoleForm } from "@/components/user-role-form";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin/users" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to Users
      </Link>

      <div className="card space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile.full_name || "—"}</h1>
          <p className="text-sm text-slate-600">{profile.email}</p>
          <p className="text-sm text-slate-600">{profile.phone}</p>
          <p className="mt-1 text-xs text-slate-400">Joined {formatDate(profile.created_at)}</p>
        </div>

        <hr className="border-slate-200" />

        <UserRoleForm userId={profile.id} initialRole={profile.role} />
      </div>
    </div>
  );
}
