import { createAdminClient } from "@/lib/supabase/server";
import { setUserRole } from "@/actions/users";
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
        Everyone who signs up starts as a Parent. Promote an account to Mentor
        or Admin here once they&apos;ve created their account.
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
              <th className="pb-2 font-medium">Change role</th>
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
                <td className="py-2">
                  <div className="flex gap-2">
                    {(["parent", "mentor", "admin"] as const)
                      .filter((r) => r !== p.role)
                      .map((r) => (
                        <form key={r} action={setUserRole.bind(null, p.id, r)}>
                          <button className="btn-secondary text-xs capitalize">Make {r}</button>
                        </form>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
