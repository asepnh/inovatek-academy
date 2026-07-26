"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createUserAccount } from "@/actions/users";
import type { UserRole } from "@/lib/types";

export function CreateUserForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("mentor");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createUserAccount({ fullName, email, phone, role });
      if (result.error) {
        setError(result.error);
        return;
      }
      setCreated({ email, tempPassword: result.tempPassword! });
    });
  }

  if (created) {
    return (
      <div className="card space-y-4">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Account created for <strong>{created.email}</strong>.
        </div>
        <div>
          <p className="label">Temporary password</p>
          <p className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm">
            {created.tempPassword}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Copy this now and share it with them yourself (WhatsApp, in person, etc.) — it won&apos;t be
            shown again. They can sign in with this email and password right away.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              setCreated(null);
              setFullName("");
              setEmail("");
              setPhone("");
            }}
          >
            Create another
          </button>
          <Link href="/admin/users" className="btn text-sm">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="full_name">Full name</label>
        <input
          className="input"
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          className="input"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input
          className="input"
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+60123456789"
        />
      </div>
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select
          className="input"
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="mentor">Mentor</option>
          <option value="parent">Parent</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
