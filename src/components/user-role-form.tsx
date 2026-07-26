"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/actions/users";
import type { UserRole } from "@/lib/types";

export function UserRoleForm({ userId, initialRole }: { userId: string; initialRole: UserRole }) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(userId, role);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // Hard navigation back to the list guarantees fresh data, avoiding
      // any stale client-side route cache from before the edit.
      window.location.href = "/admin/users";
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="role">Role</label>
        <select
          className="input"
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="parent">Parent</option>
          <option value="mentor">Mentor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={handleSave} disabled={pending} className="btn">
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
