import Link from "next/link";
import { CreateUserForm } from "@/components/create-user-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin/users" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to Users
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Creates the account directly with a temporary password — no email is sent, you&apos;ll
          share the password with them yourself.
        </p>
      </div>

      <CreateUserForm />
    </div>
  );
}
