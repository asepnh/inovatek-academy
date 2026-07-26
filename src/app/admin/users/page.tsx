import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { DeleteUserButton } from "@/components/delete-user-button";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="text-sm text-slate-600">
        Everyone who signs up starts as a Parent. Edit an account to promote
        it to Mentor or Admin.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Phone</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Joined</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles?.map((p: NonNullable<typeof profiles>[number]) => (
              <tr key={p.id}>
                <td className="py-2">{p.full_name || <span className="text-slate-400">—</span>}</td>
                <td className="py-2">{p.email}</td>
                <td className="py-2">{p.phone}</td>
                <td className="py-2">
                  <span className="badge bg-slate-100 text-slate-700 capitalize">{p.role}</span>
                </td>
                <td className="py-2">{formatDate(p.created_at)}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/users/${p.id}/edit`} className="text-brand-600 hover:underline">
                      Edit
                    </Link>
                    <DeleteUserButton userId={p.id} role={p.role} className="text-red-600 hover:underline" />
                  </div>
                </td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
